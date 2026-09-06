package httpx

import (
	"errors"
	"log/slog"
	"net/http"

	"okinawa-shiori/backend/internal/service"
)

var statusByCode = map[string]int{
	service.CodeInvalid:      http.StatusBadRequest,
	service.CodeNotFound:     http.StatusNotFound,
	service.CodeDateConflict: http.StatusConflict,
	service.CodeLastDay:      http.StatusConflict,
	service.CodeDayHasItems:  http.StatusConflict,
}

// WriteError は service.Error を {"error":{"code","message",...}} に変換する(B7)。
// それ以外のエラーは 500 とし、詳細はログにのみ出す。
func WriteError(w http.ResponseWriter, r *http.Request, err error) {
	var se *service.Error
	if errors.As(err, &se) {
		status, ok := statusByCode[se.Code]
		if !ok {
			status = http.StatusInternalServerError
		}
		body := map[string]any{"code": se.Code, "message": se.Message}
		for k, v := range se.Extra {
			body[k] = v
		}
		WriteJSON(w, status, map[string]any{"error": body})
		return
	}
	slog.Error("unhandled error", "method", r.Method, "path", r.URL.Path, "err", err)
	WriteJSON(w, http.StatusInternalServerError, map[string]any{
		"error": map[string]any{"code": "internal", "message": "internal server error"},
	})
}
