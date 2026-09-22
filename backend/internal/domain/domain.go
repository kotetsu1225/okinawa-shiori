// Package domain は業務の構造体と、業務が永続化層に求める interface を定義する。
// API の形と一致し、DB の都合(timestamp / GORM / SQL)を持たない。どのパッケージにも依存しない。
package domain

import "time"

// DateLayout は API 上の日付表現。辞書順 = 日付順なので文字列のまま比較・整列できる。
const DateLayout = "2006-01-02"

// ParseDate は "YYYY-MM-DD" を検証し、UTC 深夜の time.Time にする(B5)。
func ParseDate(s string) (time.Time, error) {
	return time.Parse(DateLayout, s)
}

// ---- 出力用(GET / POST・PATCH のレスポンス)
// 任意項目は "" で「未設定」を表す。DB の NULL との変換は repository が行う(B2)。

type Trip struct {
	Title string `json:"title"`
	Slug  string `json:"slug"`
	Theme string `json:"theme"`
}

type Day struct {
	ID    string `json:"id"`
	Date  string `json:"date"` // "YYYY-MM-DD"
	Title string `json:"title"`
}

type Item struct {
	ID          string `json:"id"`
	DayID       string `json:"dayId"`
	Position    int    `json:"position"`
	StartTime   string `json:"startTime"` // "" = 時間未定
	Title       string `json:"title"`
	Description string `json:"description"` // "" = 未記入
	URL         string `json:"url"`         // "" = 未設定
	Done        bool   `json:"done"`
}

// ---- 入力用(POST / PATCH 共通)
// nil = キーが送られてこなかった(変更しない)。"" = 空にする。
// POST では必須項目の nil をバリデーションで弾く。

type TripInput struct {
	Title *string `json:"title"`
}

type DayInput struct {
	Date  *string `json:"date"`
	Title *string `json:"title"`
}

type ItemInput struct {
	DayID       *string `json:"dayId"`
	Position    *int    `json:"position"` // POST では無視(末尾に追加)
	StartTime   *string `json:"startTime"`
	Title       *string `json:"title"`
	Description *string `json:"description"`
	URL         *string `json:"url"`
	Done        *bool   `json:"done"`
}

// ApplyTo は nil でないフィールドだけを t に上書きする(差分適用、B3)。
func (in TripInput) ApplyTo(t *Trip) {
	if in.Title != nil {
		t.Title = *in.Title
	}
}

func (in DayInput) ApplyTo(d *Day) {
	if in.Date != nil {
		d.Date = *in.Date
	}
	if in.Title != nil {
		d.Title = *in.Title
	}
}

// ApplyTo は本文のフィールドだけを適用する。
// 居場所(DayID / Position)は採番と振り直しを伴う業務判断なので service が別途扱う(B6)。
func (in ItemInput) ApplyTo(it *Item) {
	if in.StartTime != nil {
		it.StartTime = *in.StartTime
	}
	if in.Title != nil {
		it.Title = *in.Title
	}
	if in.Description != nil {
		it.Description = *in.Description
	}
	if in.URL != nil {
		it.URL = *in.URL
	}
	if in.Done != nil {
		it.Done = *in.Done
	}
}
