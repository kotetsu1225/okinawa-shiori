// Package model は DB の行を表す GORM 構造体を定義する。
// スキーマの真実は migrations/ の SQL であり、ここはそれに合わせる側(D15)。
package model

import "time"

type Trip struct {
	ID        uint64 `gorm:"column:id;primaryKey;autoIncrement"`
	Title     string `gorm:"column:title"`
	Slug      string `gorm:"column:slug"`
	Theme     string `gorm:"column:theme"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// TableName preserves the original table name.
func (Trip) TableName() string { return "trip" }

type Day struct {
	ID        string    `gorm:"column:id;primaryKey;type:char(26)"`
	TripID    uint64    `gorm:"column:trip_id"`
	Date      time.Time `gorm:"column:date;type:date"`
	Title     string    `gorm:"column:title"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Item struct {
	ID          string  `gorm:"column:id;primaryKey;type:char(26)"`
	DayID       string  `gorm:"column:day_id;type:char(26)"`
	Position    uint    `gorm:"column:position"`
	StartTime   *string `gorm:"column:start_time;type:char(5)"` // NULL = 時間未定(D13)
	Title       string  `gorm:"column:title"`
	Description *string `gorm:"column:description"`
	URL         *string `gorm:"column:url"`
	Done        bool    `gorm:"column:done"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
