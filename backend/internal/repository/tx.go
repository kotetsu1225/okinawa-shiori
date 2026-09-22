// Package repository は domain の repository interface を GORM で実装する。
// domain ↔ model の変換と、driver 固有エラーの読み替えもここに閉じる。
package repository

import (
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"okinawa-shiori/backend/internal/domain"
	"okinawa-shiori/backend/internal/model"
)

// txKey は context に載せるトランザクションのキー。
type txKey struct{}

// Transactor は service.Transactor の GORM 実装(適合検査は main.go)。
//
// GORM の「継続セッションモード」を使う: db.WithContext(ctx) で ctx を Statement に載せた *gorm.DB は、
// 以降の操作すべてに同じ ctx を引き継ぐ。その上で Transaction を呼ぶと BeginTx(ctx, ...) に ctx が渡り、
// リクエストのキャンセルやタイムアウトがトランザクション全体に効く。
// → https://gorm.io/docs/context.html / https://gorm.io/docs/transactions.html
//
// 開始したトランザクション(tx *gorm.DB)は ctx に載せて fn に渡す。各 repository メソッドは conn(ctx) で
// それを取り出すので、interface のシグネチャに *gorm.DB が現れない(B13)。
type Transactor struct{ db *gorm.DB }

func NewTransactor(db *gorm.DB) *Transactor { return &Transactor{db: db} }

func (t *Transactor) Transaction(ctx context.Context, fn func(ctx context.Context) error) error {
	// 既にトランザクションの中なら、その tx で Transaction を呼ぶ → GORM が SavePoint にする(入れ子)
	return conn(ctx, t.db).Transaction(func(tx *gorm.DB) error {
		// Serialize writes within this trip so last-day checks, moves and position
		// renumbering remain valid even when two people edit at the same time.
		var trip model.Trip
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&trip, "slug = ?", domain.TripSlug(ctx)).Error; err != nil {
			return wrap(err)
		}
		return fn(context.WithValue(ctx, txKey{}, tx))
	})
}

// conn は ctx にトランザクションがあればそれを、無ければ base を返す。全 repository メソッドの入口。
// どちらの場合も WithContext(ctx) で ctx を載せ直し、クエリのキャンセルが効くようにする。
func conn(ctx context.Context, base *gorm.DB) *gorm.DB {
	if tx, ok := ctx.Value(txKey{}).(*gorm.DB); ok {
		return tx.WithContext(ctx)
	}
	return base.WithContext(ctx)
}
