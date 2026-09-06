package controller

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"okinawa-shiori/backend/internal/domain"
	"okinawa-shiori/backend/internal/httpx"
	"okinawa-shiori/backend/internal/service"
)

type DayController struct {
	svc *service.DayService
}

func NewDayController(svc *service.DayService) *DayController {
	return &DayController{svc: svc}
}

func (c *DayController) List(w http.ResponseWriter, r *http.Request) {
	ds, err := c.svc.List(r.Context())
	if err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, ds)
}

func (c *DayController) Create(w http.ResponseWriter, r *http.Request) {
	var in domain.DayInput
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	d, err := c.svc.Create(r.Context(), in)
	if err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, d)
}

func (c *DayController) Patch(w http.ResponseWriter, r *http.Request) {
	var in domain.DayInput
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	d, err := c.svc.Patch(r.Context(), chi.URLParam(r, "id"), in)
	if err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, d)
}

func (c *DayController) Delete(w http.ResponseWriter, r *http.Request) {
	withItems := r.URL.Query().Get("withItems") == "true"
	if err := c.svc.Delete(r.Context(), chi.URLParam(r, "id"), withItems); err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
