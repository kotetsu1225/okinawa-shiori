package integration_test

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync"
	"testing"

	mysqldriver "github.com/go-sql-driver/mysql"
	"github.com/oklog/ulid/v2"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"okinawa-shiori/backend/internal/controller"
	"okinawa-shiori/backend/internal/database"
	"okinawa-shiori/backend/internal/domain"
	"okinawa-shiori/backend/internal/model"
	"okinawa-shiori/backend/internal/repository"
	"okinawa-shiori/backend/internal/router"
	"okinawa-shiori/backend/internal/service"
	"okinawa-shiori/backend/migrations"
)

// Every test creates and drops its own database. The optional DSN must name a
// disposable local MySQL server and a user allowed to CREATE/DROP DATABASE.
func testDB(t *testing.T) (*gorm.DB, string) {
	t.Helper()
	dsn := os.Getenv("SHIORI_TEST_MYSQL_DSN")
	if dsn == "" {
		t.Skip("set SHIORI_TEST_MYSQL_DSN to run isolated MySQL integration tests")
	}
	cfg, err := mysqldriver.ParseDSN(dsn)
	must(t, err)
	cfg.DBName = ""
	cfg.ParseTime = true
	admin, err := sql.Open("mysql", cfg.FormatDSN())
	must(t, err)
	name := "shiori_test_" + strings.ToLower(ulid.Make().String())
	_, err = admin.Exec("CREATE DATABASE " + name + " CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci")
	must(t, err)
	t.Cleanup(func() {
		_, err := admin.Exec("DROP DATABASE " + name)
		if err != nil {
			t.Errorf("drop test database: %v", err)
		}
		admin.Close()
	})
	cfg.DBName = name
	cfg.MultiStatements = false // production uses ordinary single-statement queries
	dsn = cfg.FormatDSN()
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	must(t, err)
	pool, err := db.DB()
	must(t, err)
	t.Cleanup(func() { pool.Close() })
	return db, dsn
}

func must(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
}

func handler(db *gorm.DB) http.Handler {
	tx := repository.NewTransactor(db)
	days := repository.NewDayRepository(db)
	items := repository.NewItemRepository(db)
	return router.New(router.Controllers{
		Trip: controller.NewTripController(service.NewTripService(tx, repository.NewTripRepository(db))),
		Day:  controller.NewDayController(service.NewDayService(tx, days, items)),
		Item: controller.NewItemController(service.NewItemService(tx, days, items)),
	}, "*")
}

func request(h http.Handler, method, path string, body any) *httptest.ResponseRecorder {
	var data []byte
	if body != nil {
		data, _ = json.Marshal(body)
	}
	r := httptest.NewRequest(method, path, bytes.NewReader(data))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}

func call(t *testing.T, h http.Handler, method, path string, body any, status int) *httptest.ResponseRecorder {
	t.Helper()
	w := request(h, method, path, body)
	if w.Code != status {
		t.Fatalf("%s %s: want %d, got %d: %s", method, path, status, w.Code, w.Body.String())
	}
	return w
}

func decode[T any](t *testing.T, w *httptest.ResponseRecorder) T {
	t.Helper()
	var value T
	must(t, json.Unmarshal(w.Body.Bytes(), &value))
	return value
}

func TestUpgradePreservesExistingTrip(t *testing.T) {
	db, dsn := testDB(t)
	for _, name := range []string{"000001_create_trip.up.sql", "000002_create_days.up.sql", "000003_create_items.up.sql"} {
		data, err := migrations.FS.ReadFile(name)
		must(t, err)
		must(t, db.Exec(string(data)).Error)
	}
	dayID, itemID := ulid.Make().String(), ulid.Make().String()
	must(t, db.Exec("INSERT INTO trip (id, title) VALUES (1, ?)", "既存の沖縄旅行").Error)
	must(t, db.Exec("INSERT INTO days (id, date, title) VALUES (?, '2026-09-23', ?)", dayID, "既存の日付").Error)
	must(t, db.Exec("INSERT INTO items (id, day_id, position, title, done) VALUES (?, ?, 0, ?, 1)", itemID, dayID, "既存の予定").Error)
	must(t, db.Exec("CREATE TABLE schema_migrations (version BIGINT NOT NULL PRIMARY KEY, dirty BOOLEAN NOT NULL)").Error)
	must(t, db.Exec("INSERT INTO schema_migrations (version, dirty) VALUES (3, 0)").Error)
	version, err := database.Migrate(dsn)
	must(t, err)
	if version != 4 {
		t.Fatalf("migration version = %d", version)
	}
	must(t, database.Bootstrap(context.Background(), db))
	h := handler(db)
	trip := decode[domain.Trip](t, call(t, h, "GET", "/api/trip", nil, 200))
	if trip.Title != "既存の沖縄旅行" || trip.Slug != "okinawa" || trip.Theme != "okinawa" {
		t.Fatalf("existing trip changed: %+v", trip)
	}
	days := decode[[]domain.Day](t, call(t, h, "GET", "/api/days", nil, 200))
	items := decode[[]domain.Item](t, call(t, h, "GET", "/api/items", nil, 200))
	if len(days) != 1 || days[0].ID != dayID || days[0].Date != "2026-09-23" || days[0].Title != "既存の日付" {
		t.Fatalf("existing days changed: %+v", days)
	}
	if len(items) != 1 || items[0].ID != itemID || items[0].DayID != dayID || !items[0].Done || items[0].Title != "既存の予定" {
		t.Fatalf("existing items changed: %+v", items)
	}
	if got := decode[[]domain.Item](t, call(t, h, "GET", "/api/items?trip=onsen", nil, 200)); len(got) != 0 {
		t.Fatalf("Okinawa cards leaked into onsen: %+v", got)
	}
}

func TestTripScopedAPIAndIdempotentSeed(t *testing.T) {
	db, dsn := testDB(t)
	_, err := database.Migrate(dsn)
	must(t, err)
	must(t, database.Bootstrap(context.Background(), db))
	h := handler(db)

	t.Run("defaults and unknown slug", func(t *testing.T) {
		for _, query := range []string{"", "?trip=", "?trip=okinawa"} {
			trip := decode[domain.Trip](t, call(t, h, "GET", "/api/trip"+query, nil, 200))
			if trip.Slug != "okinawa" || trip.Theme != "okinawa" {
				t.Fatalf("wrong default: %+v", trip)
			}
		}
		for _, path := range []string{"/api/trip", "/api/days", "/api/items"} {
			call(t, h, "GET", path+"?trip=unknown", nil, 404)
		}
		call(t, h, "PATCH", "/api/trip?trip=unknown", map[string]any{"title": "wrong"}, 404)
		call(t, h, "POST", "/api/days?trip=unknown", map[string]any{"date": "2099-01-01"}, 404)
		trip := decode[domain.Trip](t, call(t, h, "GET", "/api/trip?trip=onsen", nil, 200))
		if trip.Slug != "onsen" || trip.Theme != "onsen" || trip.Title != "温泉のしおり" {
			t.Fatalf("wrong onsen seed: %+v", trip)
		}
	})

	okinawa := decode[domain.Day](t, call(t, h, "POST", "/api/days", map[string]any{"date": "2099-01-01", "title": "沖縄追加"}, 201))
	onsen := decode[domain.Day](t, call(t, h, "POST", "/api/days?trip=onsen", map[string]any{"date": "2099-01-01", "title": "温泉追加"}, 201))
	call(t, h, "POST", "/api/days?trip=onsen", map[string]any{"date": "2099-01-01"}, 409)
	item := decode[domain.Item](t, call(t, h, "POST", "/api/items?trip=onsen", map[string]any{"dayId": onsen.ID, "title": "温泉の予定"}, 201))

	t.Run("cross-trip IDs and moves are rejected", func(t *testing.T) {
		call(t, h, "PATCH", "/api/days/"+onsen.ID, map[string]any{"title": "wrong"}, 404)
		call(t, h, "DELETE", "/api/days/"+onsen.ID+"?withItems=true", nil, 404)
		call(t, h, "PATCH", "/api/items/"+item.ID, map[string]any{"done": true}, 404)
		call(t, h, "DELETE", "/api/items/"+item.ID, nil, 404)
		call(t, h, "POST", "/api/items", map[string]any{"dayId": onsen.ID, "title": "wrong"}, 400)
		call(t, h, "PATCH", "/api/items/"+item.ID+"?trip=onsen", map[string]any{"dayId": okinawa.ID}, 400)
		if got := decode[[]domain.Item](t, call(t, h, "GET", "/api/items", nil, 200)); len(got) != 0 {
			t.Fatalf("foreign card leaked: %+v", got)
		}
	})

	t.Run("same-trip editing ordering and moves", func(t *testing.T) {
		second := decode[domain.Item](t, call(t, h, "POST", "/api/items?trip=onsen", map[string]any{"dayId": onsen.ID, "title": "2枚目"}, 201))
		if second.Position != 1 {
			t.Fatalf("second position = %d", second.Position)
		}
		first := decode[domain.Item](t, call(t, h, "PATCH", "/api/items/"+second.ID+"?trip=onsen", map[string]any{"position": 0, "done": true}, 200))
		if first.Position != 0 || !first.Done {
			t.Fatalf("reorder failed: %+v", first)
		}
		call(t, h, "PATCH", "/api/items/"+second.ID+"?trip=onsen", map[string]any{"done": false, "startTime": "", "url": ""}, 200)
		days := decode[[]domain.Day](t, call(t, h, "GET", "/api/days?trip=onsen", nil, 200))
		moved := decode[domain.Item](t, call(t, h, "PATCH", "/api/items/"+second.ID+"?trip=onsen", map[string]any{"dayId": days[0].ID}, 200))
		if moved.DayID != days[0].ID || moved.Position != 0 || moved.Done {
			t.Fatalf("move/zero fields failed: %+v", moved)
		}
		call(t, h, "DELETE", "/api/items/"+second.ID+"?trip=onsen", nil, 204)
		items := decode[[]domain.Item](t, call(t, h, "GET", "/api/items?trip=onsen", nil, 200))
		if len(items) != 1 || items[0].ID != item.ID || items[0].Position != 0 {
			t.Fatalf("renumber failed: %+v", items)
		}
	})

	t.Run("restart preserves edits and deleted seed days", func(t *testing.T) {
		call(t, h, "PATCH", "/api/trip?trip=onsen", map[string]any{"title": "編集した温泉旅行"}, 200)
		days := decode[[]domain.Day](t, call(t, h, "GET", "/api/days?trip=onsen", nil, 200))
		call(t, h, "DELETE", "/api/days/"+days[0].ID+"?trip=onsen", nil, 204)
		beforeDays := call(t, h, "GET", "/api/days?trip=onsen", nil, 200).Body.String()
		beforeItems := call(t, h, "GET", "/api/items?trip=onsen", nil, 200).Body.String()
		must(t, database.Bootstrap(context.Background(), db))
		must(t, database.Bootstrap(context.Background(), db))
		if after := call(t, h, "GET", "/api/days?trip=onsen", nil, 200).Body.String(); after != beforeDays {
			t.Fatal("bootstrap changed existing days")
		}
		if after := call(t, h, "GET", "/api/items?trip=onsen", nil, 200).Body.String(); after != beforeItems {
			t.Fatal("bootstrap changed existing items")
		}
		trip := decode[domain.Trip](t, call(t, h, "GET", "/api/trip?trip=onsen", nil, 200))
		if trip.Title != "編集した温泉旅行" {
			t.Fatal("bootstrap overwrote edited title")
		}
	})

	t.Run("delete-with-items and per-trip last-day", func(t *testing.T) {
		call(t, h, "DELETE", "/api/days/"+onsen.ID+"?trip=onsen", nil, 409)
		call(t, h, "DELETE", "/api/days/"+onsen.ID+"?trip=onsen&withItems=true", nil, 204)
		days := decode[[]domain.Day](t, call(t, h, "GET", "/api/days?trip=onsen", nil, 200))
		if len(days) != 1 {
			t.Fatalf("remaining days = %d", len(days))
		}
		call(t, h, "DELETE", "/api/days/"+days[0].ID+"?trip=onsen", nil, 409)
		if items := decode[[]domain.Item](t, call(t, h, "GET", "/api/items?trip=onsen", nil, 200)); len(items) != 0 {
			t.Fatal("withItems did not delete cards")
		}
	})
}

func TestConcurrentWritesStayWithinTrip(t *testing.T) {
	db, dsn := testDB(t)
	_, err := database.Migrate(dsn)
	must(t, err)
	must(t, database.Bootstrap(context.Background(), db))
	h := handler(db)
	days := decode[[]domain.Day](t, call(t, h, "GET", "/api/days?trip=onsen", nil, 200))
	var wg sync.WaitGroup
	results := make(chan *httptest.ResponseRecorder, 12)
	for i := range 12 {
		wg.Go(func() {
			results <- request(h, "POST", "/api/items?trip=onsen", map[string]any{"dayId": days[0].ID, "title": fmt.Sprintf("予定%d", i)})
		})
	}
	wg.Wait()
	close(results)
	for w := range results {
		if w.Code != 201 {
			t.Fatalf("concurrent create: %d %s", w.Code, w.Body.String())
		}
	}
	items := decode[[]domain.Item](t, call(t, h, "GET", "/api/items?trip=onsen", nil, 200))
	if len(items) != 12 {
		t.Fatalf("cards = %d", len(items))
	}
	for i, item := range items {
		if item.Position != i {
			t.Fatalf("position %d = %d", i, item.Position)
		}
	}

	// Both deletions race on two days; the trip lock must preserve one of them.
	deletes := make(chan int, 2)
	for _, day := range days {
		wg.Go(func() { deletes <- request(h, "DELETE", "/api/days/"+day.ID+"?trip=onsen&withItems=true", nil).Code })
	}
	wg.Wait()
	close(deletes)
	counts := map[int]int{}
	for code := range deletes {
		counts[code]++
	}
	if counts[204] != 1 || counts[409] != 1 {
		t.Fatalf("concurrent delete status counts: %+v", counts)
	}
	var count int64
	must(t, db.Model(&model.Day{}).Where("trip_id = (SELECT id FROM trip WHERE slug = 'onsen')").Count(&count).Error)
	if count != 1 {
		t.Fatalf("remaining onsen days: %d", count)
	}
}
