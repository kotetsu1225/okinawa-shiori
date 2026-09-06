package service

import (
	"regexp"
	"strings"
	"unicode/utf8"

	"okinawa-shiori/backend/internal/domain"
)

// 上限は DDL の VARCHAR 長と一致させる。MySQL の VARCHAR(n) は n 文字なので、バイト数ではなく rune で数える。
const (
	maxTripTitle = 100
	maxDayTitle  = 100
	maxItemTitle = 200
	maxURL       = 1024
)

var startTimeRe = regexp.MustCompile(`^([01][0-9]|2[0-3]):[0-5][0-9]$`)

func checkLen(field, s string, limit int) error {
	if utf8.RuneCountInString(s) > limit {
		return Invalid("%s must be at most %d characters", field, limit)
	}
	return nil
}

// checkRequiredText は POST の必須文字列。nil でも空白のみでもエラー。
func checkRequiredText(field string, p *string) error {
	if p == nil || strings.TrimSpace(*p) == "" {
		return Invalid("%s is required", field)
	}
	return nil
}

// checkOptionalText は PATCH で「来たなら空でないこと」。
func checkOptionalText(field string, p *string) error {
	if p != nil && strings.TrimSpace(*p) == "" {
		return Invalid("%s must not be empty", field)
	}
	return nil
}

// checkStartTime は "" (時間未定) または "HH:MM" のみ許す(D13)。
func checkStartTime(p *string) error {
	if p == nil || *p == "" {
		return nil
	}
	if !startTimeRe.MatchString(*p) {
		return Invalid("startTime must be \"HH:MM\" (00:00-23:59) or empty")
	}
	return nil
}

// checkDate は nil なら何もせず、来たなら "YYYY-MM-DD" として解釈できることを確かめる。
func checkDate(p *string) error {
	if p == nil {
		return nil
	}
	if _, err := domain.ParseDate(*p); err != nil {
		return Invalid("date must be \"YYYY-MM-DD\"")
	}
	return nil
}
