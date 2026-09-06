// Package database は接続・マイグレーション・初期データ投入を担当する。
package database

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

const (
	connectAttempts = 30
	connectInterval = time.Second
)

// Open は MySQL に接続する。コンテナ起動直後は DB が受け付けないことがあるので、一定回数リトライする。
func Open(ctx context.Context, dsn string) (*gorm.DB, error) {
	var lastErr error
	for i := 1; i <= connectAttempts; i++ {
		db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Warn),
		})
		if err == nil {
			return db, nil
		}
		lastErr = err
		slog.Warn("mysql not ready, retrying", "attempt", i, "err", err)
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(connectInterval):
		}
	}
	return nil, fmt.Errorf("connect mysql after %d attempts: %w", connectAttempts, lastErr)
}
