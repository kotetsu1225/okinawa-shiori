package repository

import (
	"time"

	"okinawa-shiori/backend/internal/domain"
	"okinawa-shiori/backend/internal/model"
)

// domain ↔ model の変換はこのファイルだけが知っている(B2)。
//   - 日付: domain は "YYYY-MM-DD" 文字列、model は time.Time(UTC 固定、B5)
//   - 任意項目: domain は "" で未設定、model は NULL(*string)

func formatDate(t time.Time) string { return t.UTC().Format(domain.DateLayout) }

func nullToEmpty(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func emptyToNull(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// ---- trip

func tripToDomain(m *model.Trip) *domain.Trip {
	return &domain.Trip{Title: m.Title}
}

// ---- day

func dayToDomain(m *model.Day) domain.Day {
	return domain.Day{ID: m.ID, Date: formatDate(m.Date), Title: m.Title}
}

func daysToDomain(ms []model.Day) []domain.Day {
	out := make([]domain.Day, 0, len(ms))
	for i := range ms {
		out = append(out, dayToDomain(&ms[i]))
	}
	return out
}

func dayToModel(d *domain.Day) (*model.Day, error) {
	date, err := domain.ParseDate(d.Date)
	if err != nil {
		return nil, err
	}
	return &model.Day{ID: d.ID, Date: date, Title: d.Title}, nil
}

// ---- item

func itemToDomain(m *model.Item) domain.Item {
	return domain.Item{
		ID:          m.ID,
		DayID:       m.DayID,
		Position:    int(m.Position),
		StartTime:   nullToEmpty(m.StartTime),
		Title:       m.Title,
		Description: nullToEmpty(m.Description),
		URL:         nullToEmpty(m.URL),
		Done:        m.Done,
	}
}

func itemsToDomain(ms []model.Item) []domain.Item {
	out := make([]domain.Item, 0, len(ms))
	for i := range ms {
		out = append(out, itemToDomain(&ms[i]))
	}
	return out
}

func itemToModel(it *domain.Item) *model.Item {
	return &model.Item{
		ID:          it.ID,
		DayID:       it.DayID,
		Position:    uint(max(it.Position, 0)),
		StartTime:   emptyToNull(it.StartTime),
		Title:       it.Title,
		Description: emptyToNull(it.Description),
		URL:         emptyToNull(it.URL),
		Done:        it.Done,
	}
}
