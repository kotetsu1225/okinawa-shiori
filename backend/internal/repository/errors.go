package repository

import (
	"errors"

	"github.com/go-sql-driver/mysql"
	"gorm.io/gorm"

	"okinawa-shiori/backend/internal/domain"
)

const mysqlErrDupEntry = 1062

// wrap はドライバ固有のエラーを domain のエラーに変換する。
// service に GORM / MySQL の型を漏らさないための境界。
func wrap(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return domain.ErrNotFound
	}
	var me *mysql.MySQLError
	if errors.As(err, &me) && me.Number == mysqlErrDupEntry {
		return domain.ErrDuplicate
	}
	return err
}
