// Package migrations はスキーマ定義の SQL をバイナリに埋め込む。
// スキーマの真実はこのディレクトリの SQL であり、GORM の AutoMigrate は使わない(D15)。
// 適用は起動時に golang-migrate で行う(B4)。
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
