package service

import "context"

// Transactor はユースケース 1 つ分のトランザクション境界を切る道具。
// 「どこからどこまでを原子的に行うか」を決めるのは application 層(= service)の責務なので、
// interface は使う側であるここに置く(B13)。業務の語彙ではないため domain には置かない。
//
// 使い方:
//
//	err := s.tx.Transaction(ctx, func(ctx context.Context) error {
//	    cur, err := s.items.FindByID(ctx, id) // fn に渡された ctx を使うと同じトランザクションで実行される
//	    ...
//	    return nil                            // nil ならコミット、エラーならロールバック
//	})
//
// 実装(repository.Transactor)は GORM の db.WithContext(ctx).Transaction(...) を使う。
// ctx が BeginTx に渡るため、リクエストのキャンセルやタイムアウトがトランザクション全体に効く。
// 入れ子で呼ぶと SavePoint になり、内側だけをロールバックできる。
type Transactor interface {
	Transaction(ctx context.Context, fn func(ctx context.Context) error) error
}
