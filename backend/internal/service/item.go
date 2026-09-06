package service

import (
	"context"
	"errors"
	"math"

	"github.com/oklog/ulid/v2"

	"okinawa-shiori/backend/internal/domain"
)

type ItemService struct {
	tx    Transactor
	days  domain.DayRepository
	items domain.ItemRepository
}

func NewItemService(tx Transactor, days domain.DayRepository, items domain.ItemRepository) *ItemService {
	return &ItemService{tx: tx, days: days, items: items}
}

func (s *ItemService) List(ctx context.Context) ([]domain.Item, error) {
	is, err := s.items.List(ctx)
	return is, fromRepo(err)
}

func validateItemFields(in domain.ItemInput) error {
	if in.Title != nil {
		if err := checkLen("title", *in.Title, maxItemTitle); err != nil {
			return err
		}
	}
	if err := checkStartTime(in.StartTime); err != nil {
		return err
	}
	if in.URL != nil {
		if err := checkLen("url", *in.URL, maxURL); err != nil {
			return err
		}
	}
	if in.Position != nil && *in.Position < 0 {
		return Invalid("position must be >= 0")
	}
	return nil
}

// ensureDay は参照先の日付が存在することを確かめる。無ければ 400(URL のリソースではなく本文の不備、B8)。
func (s *ItemService) ensureDay(ctx context.Context, dayID string) error {
	if _, err := s.days.FindByID(ctx, dayID); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return Invalid("dayId %q does not exist", dayID)
		}
		return err
	}
	return nil
}

// Create はその日の末尾に追加する。position は受け取っても無視する。
func (s *ItemService) Create(ctx context.Context, in domain.ItemInput) (domain.Item, error) {
	if in.DayID == nil || *in.DayID == "" {
		return domain.Item{}, Invalid("dayId is required")
	}
	if err := checkRequiredText("title", in.Title); err != nil {
		return domain.Item{}, err
	}
	if err := validateItemFields(in); err != nil {
		return domain.Item{}, err
	}

	var out domain.Item
	err := s.tx.Transaction(ctx, func(ctx context.Context) error {
		if err := s.ensureDay(ctx, *in.DayID); err != nil {
			return err
		}
		n, err := s.items.CountByDay(ctx, *in.DayID)
		if err != nil {
			return err
		}
		it := &domain.Item{ID: ulid.Make().String(), DayID: *in.DayID, Position: int(n)}
		in.ApplyTo(it)
		if err := s.items.Create(ctx, it); err != nil {
			return err
		}
		out = *it
		return nil
	})
	return out, fromRepo(err)
}

// Patch は差分を受け取り、読んで適用して全体を書き戻す(B3)。
// dayId か position が含まれていれば「移動」として扱い、影響を受けた日の position を振り直す(I2 / B6)。
func (s *ItemService) Patch(ctx context.Context, id string, in domain.ItemInput) (domain.Item, error) {
	if err := checkOptionalText("title", in.Title); err != nil {
		return domain.Item{}, err
	}
	if err := validateItemFields(in); err != nil {
		return domain.Item{}, err
	}
	if in.DayID != nil && *in.DayID == "" {
		return domain.Item{}, Invalid("dayId must not be empty")
	}

	var out domain.Item
	err := s.tx.Transaction(ctx, func(ctx context.Context) error {
		cur, err := s.items.FindByID(ctx, id)
		if err != nil {
			return err
		}
		oldDay := cur.DayID
		in.ApplyTo(cur)

		move := in.DayID != nil || in.Position != nil
		if in.DayID != nil && *in.DayID != oldDay {
			if err := s.ensureDay(ctx, *in.DayID); err != nil {
				return err
			}
			cur.DayID = *in.DayID
		}

		if err := s.items.Save(ctx, cur); err != nil {
			return err
		}

		if move {
			pos := math.MaxInt // 指定が無ければ末尾(PlaceAt がクランプする)
			if in.Position != nil {
				pos = *in.Position
			}
			if err := s.items.PlaceAt(ctx, cur.DayID, cur.ID, pos); err != nil {
				return err
			}
			if oldDay != cur.DayID {
				if err := s.items.Renumber(ctx, oldDay); err != nil {
					return err
				}
			}
		}

		// position は PlaceAt が決めたので読み直す
		cur, err = s.items.FindByID(ctx, cur.ID)
		if err != nil {
			return err
		}
		out = *cur
		return nil
	})
	return out, fromRepo(err)
}

func (s *ItemService) Delete(ctx context.Context, id string) error {
	err := s.tx.Transaction(ctx, func(ctx context.Context) error {
		cur, err := s.items.FindByID(ctx, id)
		if err != nil {
			return err
		}
		if err := s.items.Delete(ctx, cur.ID); err != nil {
			return err
		}
		return s.items.Renumber(ctx, cur.DayID) // 抜けた穴を詰める(I2)
	})
	return fromRepo(err)
}
