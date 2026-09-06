CREATE TABLE days (
  -- ULID。大小を区別するため ascii_bin(D10 / D12)
  id         CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  -- 日付の実体。並び順もこの列で決まる(D1 / D3)
  date       DATE         NOT NULL,
  -- その日のテーマ。例: 美ら海と古宇利島
  title      VARCHAR(100) NOT NULL DEFAULT '',
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                          ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  -- 同じ日付は 2 つ存在しない(D4)。旅が 1 つなので date 単独で一意にできる
  UNIQUE KEY uq_days_date (date)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
