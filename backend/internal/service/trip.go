// Package service は業務ルールとトランザクション境界を担当する。HTTP も GORM も知らない。
// 永続化は domain の interface を通してのみ触る(B13)。
package service

import (
	"context"

	"okinawa-shiori/backend/internal/domain"
)

type TripService struct {
	tx    Transactor
	trips domain.TripRepository
}

func NewTripService(tx Transactor, trips domain.TripRepository) *TripService {
	return &TripService{tx: tx, trips: trips}
}

func (s *TripService) Get(ctx context.Context) (domain.Trip, error) {
	t, err := s.trips.Get(ctx)
	if err != nil {
		return domain.Trip{}, fromRepo(err)
	}
	return *t, nil
}

// Patch は差分を受け取り、読んで適用して全体を書き戻す(B3)。
func (s *TripService) Patch(ctx context.Context, in domain.TripInput) (domain.Trip, error) {
	if in.Title != nil {
		if err := checkLen("title", *in.Title, maxTripTitle); err != nil {
			return domain.Trip{}, err
		}
	}
	var out domain.Trip
	err := s.tx.Transaction(ctx, func(ctx context.Context) error {
		t, err := s.trips.Get(ctx)
		if err != nil {
			return err
		}
		in.ApplyTo(t)
		if err := s.trips.Save(ctx, t); err != nil {
			return err
		}
		out = *t
		return nil
	})
	return out, fromRepo(err)
}
