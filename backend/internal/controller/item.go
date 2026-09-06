package controller

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"okinawa-shiori/backend/internal/domain"
	"okinawa-shiori/backend/internal/httpx"
	"okinawa-shiori/backend/internal/service"
)

type ItemController struct {
	svc *service.ItemService
}

func NewItemController(svc *service.ItemService) *ItemController {
	return &ItemController{svc: svc}
}

func (c *ItemController) List(w http.ResponseWriter, r *http.Request) {
	is, err := c.svc.List(r.Context())
	if err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, is)
}

func (c *ItemController) Create(w http.ResponseWriter, r *http.Request) {
	var in domain.ItemInput
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	it, err := c.svc.Create(r.Context(), in)
	if err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, it)
}

func (c *ItemController) Patch(w http.ResponseWriter, r *http.Request) {
	var in domain.ItemInput
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	it, err := c.svc.Patch(r.Context(), chi.URLParam(r, "id"), in)
	if err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, it)
}

func (c *ItemController) Delete(w http.ResponseWriter, r *http.Request) {
	if err := c.svc.Delete(r.Context(), chi.URLParam(r, "id")); err != nil {
		httpx.WriteError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
