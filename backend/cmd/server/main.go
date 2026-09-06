// Command server は API サーバの起動だけを行う。
// 順序: 設定 → DB 接続(リトライ) → マイグレーション → 初期データ → HTTP。
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"okinawa-shiori/backend/internal/config"
	"okinawa-shiori/backend/internal/controller"
	"okinawa-shiori/backend/internal/database"
	"okinawa-shiori/backend/internal/repository"
	"okinawa-shiori/backend/internal/router"
	"okinawa-shiori/backend/internal/service"
)

// service が求める interface を repository の GORM 実装が満たすことをコンパイル時に検査する(B13)。
// repository は service を import しないので、両方を知るここで行う。
var _ service.Transactor = (*repository.Transactor)(nil)

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, nil)))
	if err := run(); err != nil {
		slog.Error("fatal", "err", err)
		os.Exit(1)
	}
}

func run() error {
	cfg := config.Load()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	db, err := database.Open(ctx, cfg.DSN())
	if err != nil {
		return err
	}
	version, err := database.Migrate(cfg.DSN())
	if err != nil {
		return err
	}
	slog.Info("migrations applied", "version", version)
	if err := database.Bootstrap(ctx, db); err != nil {
		return err
	}

	// 依存の組み立て。service は domain の interface しか知らず、GORM 実装はここでだけ結び付ける(B13)
	tx := repository.NewTransactor(db)
	trips := repository.NewTripRepository(db)
	days := repository.NewDayRepository(db)
	items := repository.NewItemRepository(db)
	handler := router.New(router.Controllers{
		Trip: controller.NewTripController(service.NewTripService(tx, trips)),
		Day:  controller.NewDayController(service.NewDayService(tx, days, items)),
		Item: controller.NewItemController(service.NewItemService(tx, days, items)),
	}, cfg.CORSOrigin)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = srv.Shutdown(shutdownCtx)
	}()

	slog.Info("listening", "addr", srv.Addr)
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	slog.Info("shutdown complete")
	return nil
}
