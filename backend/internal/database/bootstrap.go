package database

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/gorm"

	"okinawa-shiori/backend/internal/domain"
	"okinawa-shiori/backend/internal/model"
)

// jst は「今日」を決めるためだけに使う。DB とのやり取りは UTC 固定(B5)。
var jst = time.FixedZone("JST", 9*60*60)

// Bootstrap は DB が空のときに最低限の行を用意する。
//   - trip: id=1 の 1 行(D8)
//   - days: 今日の日付で 1 件(不変条件 I1)
//
// マイグレーションに含めないのは、内容が適用日時に依存して再現性が無くなるため。
func Bootstrap(ctx context.Context, db *gorm.DB) error {
	return db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var n int64
		if err := tx.Model(&model.Trip{}).Count(&n).Error; err != nil {
			return fmt.Errorf("count trip: %w", err)
		}
		if n == 0 {
			if err := tx.Create(&model.Trip{ID: 1, Title: ""}).Error; err != nil {
				return fmt.Errorf("create trip: %w", err)
			}
			slog.Info("bootstrap: created trip row")
		}

		if err := tx.Model(&model.Day{}).Count(&n).Error; err != nil {
			return fmt.Errorf("count days: %w", err)
		}
		if n == 0 {
			today := time.Now().In(jst).Format(domain.DateLayout)
			date, err := domain.ParseDate(today)
			if err != nil {
				return err
			}
			d := model.Day{ID: ulid.Make().String(), Date: date, Title: ""}
			if err := tx.Create(&d).Error; err != nil {
				return fmt.Errorf("create first day: %w", err)
			}
			slog.Info("bootstrap: created first day", "date", today)
		}
		return nil
	})
}
