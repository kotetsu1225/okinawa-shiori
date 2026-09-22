package database

import (
	"context"
	_ "embed"
	"encoding/json"
	"time"

	"gorm.io/gorm"

	"okinawa-shiori/backend/internal/domain"
)

var jst = time.FixedZone("JST", 9*60*60)

//go:embed seeds/onsen.json
var onsenSeed []byte

// Bootstrap only creates missing trips. Existing titles, dates and cards are
// never overwritten or restored on restart, including user-deleted seed days.
func Bootstrap(ctx context.Context, db *gorm.DB) error {
	_, err := SeedTrip(ctx, db, TripSeed{
		Slug: domain.DefaultTripSlug, Theme: "okinawa",
		Days: []DaySeed{{Date: time.Now().In(jst).Format(domain.DateLayout)}},
	})
	if err != nil {
		return err
	}
	var seed TripSeed
	if err := json.Unmarshal(onsenSeed, &seed); err != nil {
		return err
	}
	_, err = SeedTrip(ctx, db, seed)
	return err
}
