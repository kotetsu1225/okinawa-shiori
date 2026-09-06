package domain

import (
	"context"
	"errors"
)

// repository が返すエラー。service はこれを業務エラーに読み替える。
var (
	ErrNotFound  = errors.New("record not found")
	ErrDuplicate = errors.New("duplicate key")
)

// 以下は「業務が永続化層に求めること」の宣言。実装は repository パッケージ(GORM)。
//
// トランザクションについて: 境界を切るのは service の Transactor で、ここには現れない(業務の語彙ではないため)。
// Transactor が fn に渡す ctx をそのまま各メソッドに渡すと、同じトランザクション内で実行される。
// ctx にトランザクションが無ければ通常の接続で実行される(B13)。

type TripRepository interface {
	Get(ctx context.Context) (*Trip, error)
	// Save は全フィールドを書く。ゼロ値(false / 0 / "")も書き込まれる(B3)。
	Save(ctx context.Context, t *Trip) error
}

type DayRepository interface {
	// List は date 昇順(D3)。
	List(ctx context.Context) ([]Day, error)
	FindByID(ctx context.Context, id string) (*Day, error)
	Count(ctx context.Context) (int64, error)
	// ExistsByDate は同じ日付の行があるか。excludeID は更新時に自分自身を除外するため。
	ExistsByDate(ctx context.Context, date string, excludeID string) (bool, error)
	Create(ctx context.Context, d *Day) error
	Save(ctx context.Context, d *Day) error
	Delete(ctx context.Context, id string) error
}

type ItemRepository interface {
	// List は (day.date, position) 順。
	List(ctx context.Context) ([]Item, error)
	FindByID(ctx context.Context, id string) (*Item, error)
	CountByDay(ctx context.Context, dayID string) (int64, error)
	Create(ctx context.Context, it *Item) error
	Save(ctx context.Context, it *Item) error
	Delete(ctx context.Context, id string) error
	DeleteByDay(ctx context.Context, dayID string) error
	// Renumber は dayID のカードを現在の順序のまま 0..n-1 に振り直す(I2)。
	Renumber(ctx context.Context, dayID string) error
	// PlaceAt は itemID を dayID の pos 番目(自分を除いた並びの中で)に置き、その日を 0..n-1 に振り直す(B6)。
	// pos は [0, n] にクランプされる。呼び出し前に itemID の DayID を dayID にして Save しておくこと。
	PlaceAt(ctx context.Context, dayID, itemID string, pos int) error
}
