package database

import (
	"database/sql"
	"errors"
	"fmt"

	mysqldriver "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	migratemysql "github.com/golang-migrate/migrate/v4/database/mysql"
	"github.com/golang-migrate/migrate/v4/source/iofs"

	"okinawa-shiori/backend/migrations"
)

// Migrate は埋め込んだ SQL を未適用ぶんだけ適用し、適用後のバージョンを返す(B4)。
// GORM とは別に専用の *sql.DB を開く。golang-migrate は Close() で渡された DB を閉じるため、
// GORM のコネクションプールを共有すると起動直後にプールが閉じられてしまう。
func Migrate(dsn string) (uint, error) {
	// Each embedded migration may contain several statements. Enable this only
	// on the dedicated migration connection, never on the application's pool.
	cfg, err := mysqldriver.ParseDSN(dsn)
	if err != nil {
		return 0, fmt.Errorf("parse migration DSN: %w", err)
	}
	cfg.MultiStatements = true
	sqlDB, err := sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		return 0, fmt.Errorf("open for migrate: %w", err)
	}
	driver, err := migratemysql.WithInstance(sqlDB, &migratemysql.Config{})
	if err != nil {
		_ = sqlDB.Close()
		return 0, fmt.Errorf("migrate driver: %w", err)
	}
	src, err := iofs.New(migrations.FS, ".")
	if err != nil {
		_ = sqlDB.Close()
		return 0, fmt.Errorf("migrate source: %w", err)
	}
	m, err := migrate.NewWithInstance("iofs", src, "mysql", driver)
	if err != nil {
		_ = sqlDB.Close()
		return 0, fmt.Errorf("migrate init: %w", err)
	}
	defer m.Close() // source と driver(= sqlDB)を閉じる

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return 0, fmt.Errorf("migrate up: %w", err)
	}
	v, dirty, err := m.Version()
	if err != nil {
		return 0, fmt.Errorf("migrate version: %w", err)
	}
	if dirty {
		return v, fmt.Errorf("migration version %d is dirty; fix the schema manually", v)
	}
	return v, nil
}
