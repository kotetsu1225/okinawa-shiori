// Package router は chi のルーティング定義。エンドポイントの一覧はここを読めば分かる。
package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"okinawa-shiori/backend/internal/controller"
	"okinawa-shiori/backend/internal/httpx"
)

type Controllers struct {
	Trip *controller.TripController
	Day  *controller.DayController
	Item *controller.ItemController
}

func New(c Controllers, corsOrigin string) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{corsOrigin},
		AllowedMethods: []string{http.MethodGet, http.MethodPost, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowedHeaders: []string{"Content-Type"},
		MaxAge:         300,
	}))

	r.Route("/api", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
			httpx.WriteJSON(w, http.StatusOK, map[string]bool{"ok": true})
		})

		r.Group(func(r chi.Router) {
			r.Use(c.Trip.SelectTrip)
			r.Get("/trip", c.Trip.Get)
			r.Patch("/trip", c.Trip.Patch)

			r.Route("/days", func(r chi.Router) {
				r.Get("/", c.Day.List)
				r.Post("/", c.Day.Create)
				r.Patch("/{id}", c.Day.Patch)
				r.Delete("/{id}", c.Day.Delete)
			})

			r.Route("/items", func(r chi.Router) {
				r.Get("/", c.Item.List)
				r.Post("/", c.Item.Create)
				r.Patch("/{id}", c.Item.Patch)
				r.Delete("/{id}", c.Item.Delete)
			})
		})
	})
	return r
}
