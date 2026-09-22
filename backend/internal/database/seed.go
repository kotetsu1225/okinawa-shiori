package database

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/oklog/ulid/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"okinawa-shiori/backend/internal/domain"
	"okinawa-shiori/backend/internal/model"
)

type TripSeed struct {
	Slug  string    `json:"slug"`
	Title string    `json:"title"`
	Theme string    `json:"theme"`
	Days  []DaySeed `json:"days"`
}

type DaySeed struct {
	Date  string        `json:"date"`
	Title string        `json:"title"`
	Items []domain.Item `json:"items"`
}

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
var seedTimePattern = regexp.MustCompile(`^([01][0-9]|2[0-3]):[0-5][0-9]$`)

// SeedTrip atomically creates a trip and its contents once. A matching slug is
// left untouched, so rerunning deployment or the seed command preserves edits.
// IDs and positions are generated, regardless of fields supplied in the seed.
func SeedTrip(ctx context.Context, db *gorm.DB, seed TripSeed) (bool, error) {
	if err := validateSeed(seed); err != nil {
		return false, err
	}
	created := false
	err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		trip := model.Trip{Slug: seed.Slug, Title: seed.Title, Theme: seed.Theme}
		result := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&trip)
		if result.Error != nil {
			return fmt.Errorf("seed trip %q: %w", seed.Slug, result.Error)
		}
		if result.RowsAffected == 0 {
			return nil
		}
		for _, input := range seed.Days {
			date, _ := domain.ParseDate(input.Date) // validated before the transaction
			day := model.Day{ID: ulid.Make().String(), TripID: trip.ID, Date: date, Title: input.Title}
			if err := tx.Create(&day).Error; err != nil {
				return fmt.Errorf("seed day %s: %w", input.Date, err)
			}
			for position, input := range input.Items {
				item := model.Item{
					ID: ulid.Make().String(), DayID: day.ID, Position: uint(position),
					Title: input.Title, StartTime: seedOptional(input.StartTime),
					Description: seedOptional(input.Description), URL: seedOptional(input.URL), Done: input.Done,
				}
				if err := tx.Create(&item).Error; err != nil {
					return fmt.Errorf("seed item %q: %w", input.Title, err)
				}
			}
		}
		created = true
		return nil
	})
	return created && err == nil, err
}

func seedOptional(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func validateSeed(seed TripSeed) error {
	if !slugPattern.MatchString(seed.Slug) || len(seed.Slug) > 64 {
		return fmt.Errorf("seed slug must be 1–64 lowercase letters, digits or separating hyphens")
	}
	if seed.Theme != "okinawa" && seed.Theme != "onsen" {
		return fmt.Errorf("seed theme must be okinawa or onsen")
	}
	if utf8.RuneCountInString(seed.Title) > 100 || len(seed.Days) == 0 {
		return fmt.Errorf("seed requires a title of at most 100 characters and at least one day")
	}
	dates := make(map[string]bool, len(seed.Days))
	for _, day := range seed.Days {
		if _, err := domain.ParseDate(day.Date); err != nil {
			return fmt.Errorf("seed date %q: %w", day.Date, err)
		}
		if dates[day.Date] || utf8.RuneCountInString(day.Title) > 100 {
			return fmt.Errorf("seed day dates must be unique and titles at most 100 characters")
		}
		dates[day.Date] = true
		for _, item := range day.Items {
			if strings.TrimSpace(item.Title) == "" || utf8.RuneCountInString(item.Title) > 200 {
				return fmt.Errorf("seed item title must contain 1–200 characters")
			}
			if (item.StartTime != "" && !seedTimePattern.MatchString(item.StartTime)) || utf8.RuneCountInString(item.URL) > 1024 {
				return fmt.Errorf("seed item time must be HH:MM or empty and URL at most 1024 characters")
			}
		}
	}
	return nil
}
