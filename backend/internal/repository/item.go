package repository

import (
	"context"
	"slices"

	"gorm.io/gorm"

	"okinawa-shiori/backend/internal/domain"
	"okinawa-shiori/backend/internal/model"
)

type ItemRepository struct{ db *gorm.DB }

var _ domain.ItemRepository = (*ItemRepository)(nil)

func NewItemRepository(db *gorm.DB) *ItemRepository { return &ItemRepository{db: db} }

// itemColumns は Save で書く列。id / created_at は書かない。updated_at は GORM が自動で付ける。
var itemColumns = []string{"day_id", "position", "start_time", "title", "description", "url", "done"}

// List は全カードを表示順(日付 → position)で返す。設計書の想定クエリ 3 本目。
func (r *ItemRepository) List(ctx context.Context) ([]domain.Item, error) {
	var ms []model.Item
	err := selectedItems(ctx, r.db).
		Select("items.*").
		Joins("JOIN days ON days.id = items.day_id").
		Order("days.date, items.position").
		Find(&ms).Error
	if err != nil {
		return nil, wrap(err)
	}
	return itemsToDomain(ms), nil
}

func (r *ItemRepository) FindByID(ctx context.Context, id string) (*domain.Item, error) {
	var m model.Item
	if err := selectedItems(ctx, r.db).First(&m, "id = ?", id).Error; err != nil {
		return nil, wrap(err)
	}
	it := itemToDomain(&m)
	return &it, nil
}

func (r *ItemRepository) CountByDay(ctx context.Context, dayID string) (int64, error) {
	var n int64
	err := selectedItems(ctx, r.db).Where("day_id = ?", dayID).Count(&n).Error
	return n, wrap(err)
}

func (r *ItemRepository) Create(ctx context.Context, it *domain.Item) error {
	if _, err := NewDayRepository(r.db).FindByID(ctx, it.DayID); err != nil {
		return err
	}
	return wrap(conn(ctx, r.db).Create(itemToModel(it)).Error)
}

// Save は列を明示して全項目を書く。GORM の Updates(struct) はゼロ値(done=false, position=0)を
// 書かないため、Select で列を指定する(B3)。
func (r *ItemRepository) Save(ctx context.Context, it *domain.Item) error {
	if _, err := NewDayRepository(r.db).FindByID(ctx, it.DayID); err != nil {
		return err
	}
	m := itemToModel(it)
	return wrap(selectedItems(ctx, r.db).Where("id = ?", m.ID).Select(itemColumns).Updates(m).Error)
}

func (r *ItemRepository) Delete(ctx context.Context, id string) error {
	return wrap(selectedItems(ctx, r.db).Delete(&model.Item{}, "id = ?", id).Error)
}

func (r *ItemRepository) DeleteByDay(ctx context.Context, dayID string) error {
	return wrap(selectedItems(ctx, r.db).Delete(&model.Item{}, "day_id = ?", dayID).Error)
}

// orderedIDs は dayID のカード ID を表示順で返す。excludeID を除外できる。
func (r *ItemRepository) orderedIDs(ctx context.Context, dayID, excludeID string) ([]string, error) {
	q := selectedItems(ctx, r.db).Where("day_id = ?", dayID)
	if excludeID != "" {
		q = q.Where("id <> ?", excludeID)
	}
	var ids []string
	err := q.Order("position, id").Pluck("id", &ids).Error
	return ids, wrap(err)
}

// writePositions は ids の添字をそのまま position に書く。
// 1 行ずつ更新でき、中間状態で重複しても構わないのは idx_items_day_position が非一意だから(D6)。
// 1 日あたり十数枚なので素朴なループで足りる。
func (r *ItemRepository) writePositions(ctx context.Context, ids []string) error {
	for i, id := range ids {
		if err := selectedItems(ctx, r.db).
			Where("id = ?", id).
			Update("position", i).Error; err != nil {
			return wrap(err)
		}
	}
	return nil
}

func (r *ItemRepository) Renumber(ctx context.Context, dayID string) error {
	ids, err := r.orderedIDs(ctx, dayID, "")
	if err != nil {
		return err
	}
	return r.writePositions(ctx, ids)
}

// PlaceAt は「自分を除いた並び」に挿入するので、同じ日の中で後ろへ動かす場合も期待どおりの位置になる(B6)。
func (r *ItemRepository) PlaceAt(ctx context.Context, dayID, itemID string, pos int) error {
	ids, err := r.orderedIDs(ctx, dayID, itemID)
	if err != nil {
		return err
	}
	pos = max(0, min(pos, len(ids)))
	ids = slices.Insert(ids, pos, itemID)
	return r.writePositions(ctx, ids)
}
