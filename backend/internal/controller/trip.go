// Package controller は HTTP と service の橋渡し。JSON の出し入れと URL パラメータの取得だけを行い、業務判断を持たない。
package controller

import (
	"net/http"

	"okinawa-shiori/backend/internal/domain"
	"okinawa-shiori/backend/internal/httpx"
	"okinawa-shiori/backend/internal/service"
)

type TripController struct {
	svc *service.TripService
}

func NewTripController(svc *service.TripService) *TripController {
	return &TripController{svc: svc}
}

// SelectTrip validates the URL selection before every itinerary endpoint.
// An unknown slug must never fall back to another trip's data.
func (c *TripController) SelectTrip(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := domain.WithTripSlug(r.Context(), r.URL.Query().Get("trip"))
		r = r.WithContext(ctx)
		if _, err := c.svc.Get(ctx); err != nil {
			httpx.WriteError(w, r, err)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (c *TripController) Get(w http.ResponseWriter, r *http.Request) {
	t, err := c.svc.Get(r.Context())
	if err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, t)
}

func (c *TripController) Patch(w http.ResponseWriter, r *http.Request) {
	var in domain.TripInput
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	t, err := c.svc.Patch(r.Context(), in)
	if err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, t)
}
