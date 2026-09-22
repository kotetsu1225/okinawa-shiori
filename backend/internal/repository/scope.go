package repository

import (
	"context"

	"gorm.io/gorm"

	"okinawa-shiori/backend/internal/domain"
	"okinawa-shiori/backend/internal/model"
)

func selectedTripID(ctx context.Context, db *gorm.DB) *gorm.DB {
	return conn(ctx, db).Model(&model.Trip{}).Select("id").Where("slug = ?", domain.TripSlug(ctx))
}

func selectedDays(ctx context.Context, db *gorm.DB) *gorm.DB {
	return conn(ctx, db).Model(&model.Day{}).Where("trip_id IN (?)", selectedTripID(ctx, db))
}

func selectedItems(ctx context.Context, db *gorm.DB) *gorm.DB {
	return conn(ctx, db).Model(&model.Item{}).
		Where("day_id IN (?)", selectedDays(ctx, db).Select("id"))
}
