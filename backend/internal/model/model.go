// Package model は DB の行を表す GORM 構造体を定義する。
// スキーマの真実は migrations/ の SQL であり、ここはそれに合わせる側(D15)。
package model

import "time"

type Trip struct {
	ID        uint8  `gorm:"column:id;primaryKey"`
	Title     string `gorm:"column:title"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// TableName は GORM の複数形化(Trip → trips)を抑止する。実テーブルは単一行の trip(D8)。
func (Trip) TableName() string { return "trip" }

type Day struct {
	ID        string    `gorm:"column:id;primaryKey;type:char(26)"`
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
