package repository

import (
	"context"

	"gorm.io/gorm"

	"okinawa-shiori/backend/internal/domain"
	"okinawa-shiori/backend/internal/model"
)

const tripID = 1 // 単一行(D8)

type TripRepository struct{ db *gorm.DB }

var _ domain.TripRepository = (*TripRepository)(nil)

func NewTripRepository(db *gorm.DB) *TripRepository { return &TripRepository{db: db} }

func (r *TripRepository) Get(ctx context.Context) (*domain.Trip, error) {
	var m model.Trip
	if err := conn(ctx, r.db).First(&m, "id = ?", tripID).Error; err != nil {
		return nil, wrap(err)
	}
	return tripToDomain(&m), nil
}

// Save は更新対象の列を明示する。GORM の Updates(struct) はゼロ値を書かないため、
// Select で列を指定して "" も書き込まれるようにする(B3)。updated_at は GORM が自動で付ける。
func (r *TripRepository) Save(ctx context.Context, t *domain.Trip) error {
	m := &model.Trip{ID: tripID, Title: t.Title}
	return wrap(conn(ctx, r.db).Model(m).Select("title").Updates(m).Error)
}
