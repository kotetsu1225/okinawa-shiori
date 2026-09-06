// Package httpx は HTTP の入出力ヘルパー。controller だけが使う。
package httpx

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"okinawa-shiori/backend/internal/service"
)

const maxBodyBytes = 1 << 20 // 1MB。旅程アプリの 1 リクエストにはこれで十分

func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if v == nil {
		return
	}
	_ = json.NewEncoder(w).Encode(v)
}

// DecodeJSON は本文を v に読む。未知のキーは無視する(id など、送られても困らないものがあるため)。
func DecodeJSON(r *http.Request, v any) error {
	body := http.MaxBytesReader(nil, r.Body, maxBodyBytes)
	defer body.Close()
	if err := json.NewDecoder(body).Decode(v); err != nil {
		if errors.Is(err, io.EOF) {
			return service.Invalid("request body is empty")
		}
		return service.Invalid("invalid JSON: %v", err)
	}
	return nil
}
