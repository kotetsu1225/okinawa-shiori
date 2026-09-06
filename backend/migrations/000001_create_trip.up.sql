-- 旅は 1 つしか存在しない。この表は常に 1 行だけ持つ(D8)
CREATE TABLE trip (
  -- 識別子ではなく単一行を強制するための固定値。常に 1
  id         TINYINT UNSIGNED NOT NULL DEFAULT 1,
  title      VARCHAR(100)     NOT NULL DEFAULT '',
  created_at DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  -- 2 行目を作れなくする。MySQL 8.0.16 以降で強制される
  CONSTRAINT ck_trip_singleton CHECK (id = 1)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
