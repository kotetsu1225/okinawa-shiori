package service

import (
	"errors"
	"fmt"

	"okinawa-shiori/backend/internal/domain"
)

// エラーコード。httpx がこれを HTTP ステータスに変換する(B7)。
const (
	CodeInvalid      = "invalid"       // 400
	CodeNotFound     = "not_found"     // 404
	CodeDateConflict = "date_conflict" // 409 (D4)
	CodeLastDay      = "last_day"      // 409 (I1)
	CodeDayHasItems  = "day_has_items" // 409 (I3)
)

// Error は業務上の失敗。HTTP を知らないが、controller が機械的に変換できる形にしておく。
type Error struct {
	Code    string
	Message string
	Extra   map[string]any // 応答に添える追加情報(itemCount など)
}

func (e *Error) Error() string { return e.Message }

var (
	ErrNotFound     = &Error{Code: CodeNotFound, Message: "not found"}
	ErrDateConflict = &Error{Code: CodeDateConflict, Message: "a day with the same date already exists"}
	ErrLastDay      = &Error{Code: CodeLastDay, Message: "cannot delete the last day"}
)

func Invalid(format string, args ...any) error {
	return &Error{Code: CodeInvalid, Message: fmt.Sprintf(format, args...)}
}

func DayHasItems(n int64) error {
	return &Error{
		Code:    CodeDayHasItems,
		Message: "the day still has items; pass ?withItems=true to delete them together",
		Extra:   map[string]any{"itemCount": n},
	}
}

// fromRepo は repository(domain.Err*)のエラーを業務エラーに読み替える。
// *Error はそのまま通す(トランザクション内で返したものが Transaction() を経由して戻ってくるため)。
func fromRepo(err error) error {
	switch {
	case err == nil:
		return nil
	case errors.Is(err, domain.ErrNotFound):
		return ErrNotFound
	case errors.Is(err, domain.ErrDuplicate):
		return ErrDateConflict // UNIQUE は uq_days_date しか無い(D4)
	default:
		return err
	}
}
