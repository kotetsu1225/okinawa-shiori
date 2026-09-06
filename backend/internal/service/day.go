package service

import (
	"context"

	"github.com/oklog/ulid/v2"

	"okinawa-shiori/backend/internal/domain"
)

type DayService struct {
	tx    Transactor
	days  domain.DayRepository
	items domain.ItemRepository
}

func NewDayService(tx Transactor, days domain.DayRepository, items domain.ItemRepository) *DayService {
	return &DayService{tx: tx, days: days, items: items}
}

func (s *DayService) List(ctx context.Context) ([]domain.Day, error) {
	ds, err := s.days.List(ctx)
	return ds, fromRepo(err)
}

func (s *DayService) Create(ctx context.Context, in domain.DayInput) (domain.Day, error) {
	if in.Date == nil {
		return domain.Day{}, Invalid("date is required")
	}
	if err := checkDate(in.Date); err != nil {
		return domain.Day{}, err
	}
	if in.Title != nil {
		if err := checkLen("title", *in.Title, maxDayTitle); err != nil {
			return domain.Day{}, err
		}
	}

	var out domain.Day
	err := s.tx.Transaction(ctx, func(ctx context.Context) error {
		// 重複は DB の UNIQUE(D4)でも守られるが、先に検査して分かりやすいエラーにする
		exists, err := s.days.ExistsByDate(ctx, *in.Date, "")
		if err != nil {
			return err
		}
		if exists {
			return ErrDateConflict
		}
		d := &domain.Day{ID: ulid.Make().String()}
		in.ApplyTo(d)
		if err := s.days.Create(ctx, d); err != nil {
			return err
		}
		out = *d
		return nil
	})
	return out, fromRepo(err)
}

func (s *DayService) Patch(ctx context.Context, id string, in domain.DayInput) (domain.Day, error) {
	if err := checkDate(in.Date); err != nil {
		return domain.Day{}, err
	}
	if in.Title != nil {
		if err := checkLen("title", *in.Title, maxDayTitle); err != nil {
			return domain.Day{}, err
		}
	}

	var out domain.Day
	err := s.tx.Transaction(ctx, func(ctx context.Context) error {
		d, err := s.days.FindByID(ctx, id)
		if err != nil {
			return err
		}
		if in.Date != nil && *in.Date != d.Date {
			exists, err := s.days.ExistsByDate(ctx, *in.Date, d.ID)
			if err != nil {
				return err
			}
			if exists {
				return ErrDateConflict
			}
		}
		in.ApplyTo(d)
		if err := s.days.Save(ctx, d); err != nil {
			return err
		}
		out = *d
		return nil
	})
	return out, fromRepo(err)
}

// Delete は I1(最後の 1 日は消せない)と I3(カードを黙って消さない)を守る。
// withItems=true のときだけ、その日のカードを先に削除してから日付を削除する(FK RESTRICT のため順序が必須、D7)。
func (s *DayService) Delete(ctx context.Context, id string, withItems bool) error {
	err := s.tx.Transaction(ctx, func(ctx context.Context) error {
		d, err := s.days.FindByID(ctx, id)
		if err != nil {
			return err
		}
		total, err := s.days.Count(ctx)
		if err != nil {
			return err
		}
		if total <= 1 {
			return ErrLastDay
		}
		n, err := s.items.CountByDay(ctx, d.ID)
		if err != nil {
			return err
		}
		if n > 0 {
			if !withItems {
				return DayHasItems(n)
			}
			if err := s.items.DeleteByDay(ctx, d.ID); err != nil {
				return err
			}
		}
		return s.days.Delete(ctx, d.ID)
	})
	return fromRepo(err)
}
