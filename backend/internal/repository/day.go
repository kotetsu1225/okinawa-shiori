package repository

import (
	"context"

	"gorm.io/gorm"

	"okinawa-shiori/backend/internal/domain"
	"okinawa-shiori/backend/internal/model"
)

type DayRepository struct{ db *gorm.DB }

var _ domain.DayRepository = (*DayRepository)(nil)

func NewDayRepository(db *gorm.DB) *DayRepository { return &DayRepository{db: db} }

// List は date 昇順で返す(D3)。uq_days_date がそのまま効く。
func (r *DayRepository) List(ctx context.Context) ([]domain.Day, error) {
	var ms []model.Day
	if err := conn(ctx, r.db).Order("date").Find(&ms).Error; err != nil {
		return nil, wrap(err)
	}
	return daysToDomain(ms), nil
}

func (r *DayRepository) FindByID(ctx context.Context, id string) (*domain.Day, error) {
	var m model.Day
	if err := conn(ctx, r.db).First(&m, "id = ?", id).Error; err != nil {
		return nil, wrap(err)
	}
	d := dayToDomain(&m)
	return &d, nil
}

func (r *DayRepository) Count(ctx context.Context) (int64, error) {
	var n int64
	err := conn(ctx, r.db).Model(&model.Day{}).Count(&n).Error
	return n, wrap(err)
}

func (r *DayRepository) ExistsByDate(ctx context.Context, date string, excludeID string) (bool, error) {
	t, err := domain.ParseDate(date)
	if err != nil {
		return false, err
	}
	q := conn(ctx, r.db).Model(&model.Day{}).Where("date = ?", t)
	if excludeID != "" {
		q = q.Where("id <> ?", excludeID)
	}
	var n int64
	err = q.Count(&n).Error
	return n > 0, wrap(err)
}

func (r *DayRepository) Create(ctx context.Context, d *domain.Day) error {
	m, err := dayToModel(d)
	if err != nil {
		return err
	}
	return wrap(conn(ctx, r.db).Create(m).Error)
}

func (r *DayRepository) Save(ctx context.Context, d *domain.Day) error {
	m, err := dayToModel(d)
	if err != nil {
		return err
	}
	return wrap(conn(ctx, r.db).Model(m).Select("date", "title").Updates(m).Error)
}

func (r *DayRepository) Delete(ctx context.Context, id string) error {
	return wrap(conn(ctx, r.db).Delete(&model.Day{}, "id = ?", id).Error)
}
