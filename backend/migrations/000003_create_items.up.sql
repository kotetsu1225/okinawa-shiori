CREATE TABLE items (
  -- ULID。大小を区別するため ascii_bin(D10 / D12)
  id          CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  -- 居場所その1: どの日付の箱に入っているか(D5)
  -- FK のため days.id と文字セット・照合順序を一致させること
  day_id      CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  -- 居場所その2: 箱の中で上から何番目か。0 始まり、日ごとに閉じた連番(D5)
  position    INT UNSIGNED  NOT NULL,
  -- 'HH:MM' / NULL = 時間未定。表示専用で並び順には使わない(D13)
  start_time  CHAR(5)       NULL,
  title       VARCHAR(200)  NOT NULL,
  -- 任意項目は NULL で「未設定」を表す(D16)
  description TEXT          NULL,
  url         VARCHAR(1024) NULL,
  -- チェック済み。ふたりで共有する(D9)
  done        TINYINT(1)    NOT NULL DEFAULT 0,
  created_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                            ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  -- 一括入れ替えの中間状態で重複するため、意図的に非一意(D6)
  KEY idx_items_day_position (day_id, position),
  -- 退避漏れでカードが黙って消えないよう RESTRICT(D7)
  CONSTRAINT fk_items_day FOREIGN KEY (day_id)
    REFERENCES days (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
