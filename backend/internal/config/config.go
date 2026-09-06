// Package config は環境変数から設定を読む。設定値はここ以外で os.Getenv しない。
package config

import (
	"fmt"
	"net/url"
	"os"
)

type Config struct {
	Port       string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	CORSOrigin string
}

func Load() Config {
	return Config{
		Port:       getenv("PORT", "8088"),
		DBHost:     getenv("DB_HOST", "127.0.0.1"),
		DBPort:     getenv("DB_PORT", "3306"),
		DBUser:     getenv("DB_USER", "shiori"),
		DBPassword: getenv("DB_PASSWORD", "shiori"),
		DBName:     getenv("DB_NAME", "shiori"),
		CORSOrigin: getenv("CORS_ORIGIN", "*"),
	}
}

// DSN は go-sql-driver/mysql 形式の接続文字列を組み立てる。
// loc=UTC: DATE 列は時刻を持たないので、一度も TZ 変換しなければ UTC で正しく往復する(B5)。
func (c Config) DSN() string {
	q := url.Values{}
	q.Set("parseTime", "true")
	q.Set("loc", "UTC")
	q.Set("charset", "utf8mb4")
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?%s",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName, q.Encode())
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
