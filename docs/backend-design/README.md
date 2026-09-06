# バックエンド設計 — 沖縄のしおり

対象: Go 1.26 / chi v5 / GORM v1.31 / MySQL 8.4 (8.0.16 以降で動く) / Docker Compose

- DB 設計: [../db-design/README.md](../db-design/README.md)(D1〜D16、不変条件 I1〜I4 はそちら)
- 実装: [../../backend/](../../backend/)
- E2E: [../../backend/scripts/smoke.sh](../../backend/scripts/smoke.sh)

---

## 全体像

```
                 HTTP (JSON)
                     │
   ┌─────────────────▼─────────────────┐
   │ controller   JSON の出し入れ、URL   │   業務判断ゼロ
   ├───────────────────────────────────┤
   │ service      業務ルール、tx 境界、   │   I1 / I2 / I3、バリデーション
   │              position の採番        │   ★ domain の interface にだけ依存
   │              + Transactor interface │   tx 境界を切る道具は使う側(ここ)が定義
   └─────────────────┬─────────────────┘
                     │ 呼ぶ
   ┌─────────────────▼─────────────────┐
   │ domain       業務の構造体 = API の形  │   誰にも依存しない。timestamp を持たない
   │              + repository interface │   TripRepository / DayRepository / ItemRepository
   └─────────────────▲─────────────────┘
                     │ 実装する
   ┌─────────────────┴─────────────────┐
   │ repository   GORM 呼び出し、         │   domain ↔ model、"" ↔ NULL
   │              domain ↔ model 変換    │
   ├───────────────────────────────────┤
   │ model        DB の行(GORM タグ)      │
   └───────────────────────────────────┘
```

import の向きは `controller → service → domain ← repository → model`。
**service は repository / model / GORM を import しない**(B13)。実装と interface を結び付けるのは `cmd/server/main.go` だけ。
`domain` は何にも依存しない。逆向きの import を禁じる以外に決まりは無い。

### ディレクトリと責務

```
backend/
├── cmd/server/main.go          # 起動のみ: config → DB接続(リトライ) → migrate → bootstrap → HTTP
├── internal/
│   ├── config/                 # 環境変数の読み込み。ここ以外で os.Getenv しない
│   ├── domain/                 # domain.go: Trip / Day / Item と *Input(差分入力) / repository.go: interface と Err*
│   ├── model/                  # GORM 構造体。Trip.TableName() = "trip"
│   ├── repository/             # domain / service の interface の GORM 実装。1 リソース 1 ファイル + tx.go + convert.go + errors.go
│   ├── service/                # 1 リソース 1 ファイル + tx.go(Transactor interface) + validate.go + errors.go(業務エラー)
│   ├── controller/             # 1 リソース 1 ファイル
│   ├── router/                 # chi のルート定義。エンドポイント一覧はここ
│   ├── httpx/                  # WriteJSON / DecodeJSON / WriteError
│   └── database/               # mysql.go(接続) migrate.go(埋め込み SQL の適用) bootstrap.go(初期データ)
├── migrations/                 # SQL + embed.go
├── scripts/smoke.sh            # curl + jq の E2E
├── Dockerfile                  # multi-stage → distroless
├── docker-compose.yml          # db(mysql:8.4) + api
├── Makefile
└── .env.example
```

| 層 | やること | やらないこと |
|---|---|---|
| **controller** | JSON のデコード/エンコード、URL パラメータ取得、`service.Error` → HTTP ステータス | DB を触る、業務ルールの判断 |
| **service** | トランザクション境界、バリデーション、`position` の採番、I1 / I2 / I3 | `http.Request` を知る |
| **repository** | `domain` の interface を GORM で実装。`domain ↔ model` 変換、`"" ↔ NULL` 変換、driver エラーの `domain.Err*` への読み替え | 業務判断 |
| **model** | テーブルの写し | — |
| **domain** | 業務の構造体、差分適用(`ApplyTo`)、repository の interface、`ErrNotFound` / `ErrDuplicate` | DB・HTTP を知る |

トランザクションは `service.Transactor` が境界を作り、`ctx` に載せて各メソッドに渡る(B13)。
interface に `*gorm.DB` も `model` も現れない。

```go
// domain
type ItemRepository interface {
    FindByID(ctx context.Context, id string) (*Item, error)
    ...
}
// service
err := s.tx.Transaction(ctx, func(ctx context.Context) error {
    cur, err := s.items.FindByID(ctx, id)   // この ctx を渡すと同じ tx で実行される
    ...
})
```

---

## API

ベースパス `/api`。認証なし(B10)。本文は JSON。

| Method | Path | Body | 成功 | 失敗 |
|---|---|---|---|---|
| `GET` | `/api/health` | — | 200 `{"ok":true}` | |
| `GET` | `/api/trip` | — | 200 `{title}` | |
| `PATCH` | `/api/trip` | `{title?}` | 200 `{title}` | 400 |
| `GET` | `/api/days` | — | 200 `[{id,date,title}]` date 昇順 | |
| `POST` | `/api/days` | `{date,title?}` | 201 `{id,date,title}` | 400 / 409 `date_conflict` |
| `PATCH` | `/api/days/{id}` | `{date?,title?}` | 200 | 400 / 404 / 409 `date_conflict` |
| `DELETE` | `/api/days/{id}[?withItems=true]` | — | 204 | 404 / 409 `last_day` / 409 `day_has_items` |
| `GET` | `/api/items` | — | 200 `[{id,dayId,position,startTime,title,description,url,done}]` (day.date, position) 順 | |
| `POST` | `/api/items` | `{dayId,title,startTime?,description?,url?}` | 201 | 400 |
| `PATCH` | `/api/items/{id}` | 任意項目 (`dayId,position,startTime,title,description,url,done`) | 200 | 400 / 404 |
| `DELETE` | `/api/items/{id}` | — | 204 | 404 |

### 規約

| 項目 | 規約 | 根拠 |
|---|---|---|
| 差分 | `PATCH` は**送られたキーだけ**を変更する。送らないキーは触らない | B3 |
| 空にする | `null` ではなく `""` を送る。レスポンスも `NULL` を `""` で返す | B2 / D16 |
| `id`(本文) | 常に無視。URL の `{id}` が正 | |
| `position`(`POST`) | 無視。サーバがその日の末尾に置く | B6 |
| `position`(`PATCH`) | `[0, n]` にクランプ。`dayId` だけ送ると移動先の末尾 | B6 |
| 文字数 | `VARCHAR(n)` は n **文字**。`utf8.RuneCountInString` で数える(trip/day title ≤100, item title ≤200, url ≤1024) | |
| `startTime` | `""` または `HH:MM`(`00:00`〜`23:59`) | D13 |
| `date` | `YYYY-MM-DD` | |
| エラー | `{"error":{"code":"...","message":"...", ...}}`。`day_has_items` は `itemCount` を添える | B7 |

---

## 意思決定

### B1. レイヤード 3 層。`cmd/` + `internal/`

**決定** — controller / service / repository の 3 層。Go 公式の推奨どおり、
コマンドは `cmd/`、ロジックは `internal/` に置く。

**理由** — サーバは自己完結したバイナリで、外部に公開するパッケージが無い。
`internal/` に置けば他モジュールから import できないことをコンパイラが保証する。
リポジトリには Go 以外のディレクトリ(`frontend/` / `docs/`)があるので、`cmd/` にまとめる利点が大きい。
→ [Organizing a Go module — go.dev](https://go.dev/doc/modules/layout)

**却下** — DDD 風の `usecase` / `entity` / `infrastructure`。エンドポイント 10 本に対して層の名前が増えるだけ。

### B2. `domain`(業務)と `model`(DB)を別パッケージにし、変換は repository に閉じる。`""` = 未設定

**決定** — `domain` は API の形そのもので、`id` / `position` / `dayId` は持つが `created_at` / `updated_at` は持たない。
`model` は DB の行そのもの。両者の変換(と `"" ↔ NULL` の変換)は `repository/convert.go` だけが行う。

**理由** — 「DB の知識」と「業務上やること」を分けたい、という要求をパッケージ境界で表現する。
`domain` に timestamp が無いのは、それが業務の語彙ではなく DB の帳簿だから。
repository は `domain.Item` を受け取って `model.Item` に変換して書き、読むときは逆に変換して返す。
service は `model` を一切見ない(B13)。

**`""` を「未設定」にする理由** — 差分 API(B3)で `*string` を使うと、`encoding/json` は
「キーが無い」も `null` も `nil` にするため 2 つを区別できない。区別するには 3 状態型か 2 回デコードが要る。
`""` を「空にする」の意味に決めれば `*string` のまま素直に扱える。
フロントは既に `time: ''` / `desc: ''` / `url: ''` を送っている([frontend/api.js](../../frontend/api.js))ので、都合も合う。
「説明が空文字」と「説明が未設定」を区別する画面がどこにも無いのだから、片方に寄せてよい。

**却下** — 1 セットの構造体に `json` と `gorm` のタグを両方付ける。API の形と表の形が同じものになり、
列を変えると API が変わる。今は同じでも、分けておくコストは構造体 3 つ分しかない。

### B3. 差分 API(`PATCH`)。ただし DB への書き込みは「読む → 適用 → 全体を書く」

**決定** — `PATCH` は送られたキーだけを反映する。実装は、トランザクション内で現在の行を読み、
`nil` でないフィールドだけ上書きし、**全列を書き戻す**。

**理由** — GORM は `Updates(struct)` でゼロ値(`false` / `0` / `""`)を書かない。

> "when updating with `struct` it will only update non-zero fields by default"
> — [Update — GORM](https://gorm.io/docs/update.html)

そのままだと `done: false`(チェックを外す)と `position: 0` が**無言で失敗**する。
読んで適用して、repository の `Save` が `Model(m).Select(列名...).Updates(m)` で**列を明示して**書けば、ゼロ値問題を踏まない。
`id` / `created_at` は列に含めない(`domain` は timestamp を持たないので、含めるとゼロ時刻で上書きしてしまう)。
`updated_at` は Select に無くても GORM が自動で付ける。
`map[string]any` で書く方法もあるが、型が効かない。列名の文字列が repository に閉じているのはこの設計の意図どおり。

### B4. マイグレーションはバイナリに埋め込み、起動時に適用する

**決定** — `migrations/*.sql` を `go:embed` で同梱し、`main` が起動時に golang-migrate(`source/iofs`)で
未適用ぶんを流す。D15(1 ファイル 1 文、AutoMigrate 不使用)は維持。

**理由** — deploy が「バイナリ 1 つ + MySQL」で完結する。`migrate` CLI をコンテナに入れる必要が無い。
規模が小さく、起動時に数十 ms で終わる。

**実装上の注意** — golang-migrate は `Close()` で渡された `*sql.DB` を閉じる。
GORM のコネクションプールを共有すると起動直後にプールが閉じられるので、
マイグレーション用に専用の `*sql.DB` を開いて使い捨てる(`database/migrate.go`)。

### B5. 日付は UTC 固定で扱う

**決定** — DSN は `parseTime=true&loc=UTC`。`days.date` は `time.Parse("2006-01-02", s)` で読み、
`.UTC().Format("2006-01-02")` で書く。ブートストラップの「今日」だけ `time.FixedZone("JST", 9h)` で求める。

**理由** — `DATE` 列は時刻を持たない。**一度も TZ 変換しなければ** UTC で正しく往復する。
`loc=Asia/Tokyo` にすると `time.LoadLocation` がコンテナ内の tzdata を要求し、distroless では失敗する。
`FixedZone` なら tzdata が要らない。

### B6. 並べ替え専用 API は作らない。動いた 1 枚を `PATCH` し、サーバが振り直す

**決定** — ドラッグで動くのは 1 枚なので、`PATCH /api/items/{id}` に `dayId` / `position` を送る。
サーバは「移動先の日で、自分を除いたカード列に自分を挿入し、添字を `position` として書く」(`PlaceAt`)。
日を跨いだら移動元も `0..n-1` に振り直す(`Renumber`)。

**理由** — D5 の「日を跨ぐ移動と日内の移動を分ける必要がない」が、そのまま API 1 本になる。
複数カードを一括で送る API は「一気に複数編集しない」という前提と合わないし、
クライアントに `position` の整合性を任せることになる。

**「自分を除いた列に挿入」にする理由** — 最初は「挿入位置以降を +1 ずらす → 自分を書く → 振り直す」で
実装したが、同じ日の中で**後ろへ**動かすと自分が抜けた穴のぶんだけ位置がずれる
(A,B,C で A を 2 番目へ → 期待は B,C,A だが B,A,C になる)。
「自分を除いてから挿入」なら remove-then-insert の意味になり、どの方向でも期待どおり。

**1 行ずつ `UPDATE` できる理由** — `(day_id, position)` を D6 で非一意にしてあるため、中間状態の重複が許される。
UNIQUE を張っていたら、更新順を制御する 1 文にまとめる必要があった
(→ [MySQL 8.4 15.2.17 UPDATE](https://dev.mysql.com/doc/refman/8.4/en/update.html))。

### B7. エラー応答は `{"error":{"code","message",...}}`。code は 5 種

| code | HTTP | 意味 |
|---|---|---|
| `invalid` | 400 | 形式・必須・長さ、参照先の日付が無い(B8) |
| `not_found` | 404 | URL の `{id}` が無い |
| `date_conflict` | 409 | 同じ日付がある(D4) |
| `last_day` | 409 | 最後の 1 日は消せない(I1) |
| `day_has_items` | 409 | カードが残っている(I3)。`itemCount` を添える |

**理由** — service は `*service.Error{Code, Message, Extra}` を返し、HTTP を知らない。
`httpx` が code → status の表を 1 つ持つ。コードを増やすときはこの表と service の定数を足すだけ。
それ以外のエラーは 500 とし、詳細はログにだけ出す。

### B8. `dayId` が存在しないときは 404 ではなく 400

**決定** — `POST /api/items` や `PATCH` で送られた `dayId` が無い → `400 invalid`。

**理由** — 404 は「URL が指すリソースが無い」の意味。本文の中の参照先が無いのは本文の不備なので 400。

### B9. 日付の削除は 409 で拒否し、`?withItems=true` のときだけカードごと消す

**決定** — `DELETE /api/days/{id}`:

| 状況 | 応答 |
|---|---|
| 最後の 1 日 | `409 last_day` |
| カードが残っている | `409 day_has_items` + `itemCount` |
| `?withItems=true` | トランザクション内で `items` → `days` の順に削除して `204` |

**理由** — D7 の「カードが黙って消えるのは最悪」を API の形で守る。フロントは 409 を受けて
「予定が N 件あります。まとめて削除しますか?」と確認してから `withItems=true` で再送する。
**確認なしでは絶対に消えない**。

FK が `ON DELETE RESTRICT` で InnoDB は即時評価するため、`items` を先に消す順序は必須。
→ [MySQL 8.4 15.1.20.5 FOREIGN KEY Constraints](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html)

### B10. 認証を持たない

**決定** — バックエンドに認証・セッションは無い。`sessions` テーブルと middleware は作らない。
「ふたりの記念日」による入口の演出はフロントだけで行う。

**理由** — しおりに秘密の情報は無く、URL を知っているふたりだけが使う。公開でよい、という判断。

**承知しておくこと** — API は URL を知っていれば誰でも読み書きできる。記念日の値も JS バンドルに含まれる。
後から最低限だけ塞ぐなら、**アプリのコードを変えずに**リバースプロキシで Basic 認証を足すのが最も安上がり。
当初案(D14: ランダムトークンの SHA-256 のみ DB に置く、合言葉は環境変数)は、その次の段階の出発点。

### B11. 同時編集は後勝ち。楽観ロックは入れない

**決定** — `version` 列も `If-Match` も無い。I4 のまま。

**理由** — 差分 API(B3)なら衝突の粒度は「カード 1 枚の、送ったフィールド」に留まる。
A がタイトルを直し、B がチェックを付けても、送るキーが違えば両方生きる。
ふたりで使う旅程アプリで、これ以上の保護は費用に見合わない。

### B12. Docker: `mysql:8.4` + distroless、ポートは 8088

**決定** — `docker-compose.yml` で `db`(mysql:8.4、healthcheck あり)と `api`(multi-stage build →
`gcr.io/distroless/static-debian12:nonroot`、`CGO_ENABLED=0`)。`api` は `db` の healthy を待って起動する。

**理由** — 8.4 は LTS で、設計要件(8.0.16 以降)を満たす。distroless + 静的バイナリなら
イメージが小さく、シェルも無い。マイグレーションは埋め込み(B4)なのでランタイムに追加のものが要らない。

**ポート 8088 の理由** — 8080 は開発機で別プロジェクトが使っていた。`API_PORT` で変えられる。

**healthcheck の `-h 127.0.0.1`** — MySQL イメージは初期化中に一時サーバを立てるが、TCP を開かない。
TCP で ping すれば初期化完了を正しく待てる。

### B13. repository の interface は `domain`、`Transactor` は `service` に置く。トランザクションは `ctx` で渡す

**決定**

| interface | 置き場所 | 理由 |
|---|---|---|
| `TripRepository` / `DayRepository` / `ItemRepository` | `domain/repository.go` | 「業務が永続化層に**何を**求めるか」。業務の語彙で書ける |
| `Transactor` | `service/tx.go` | 「**どうやって**原子性を担保するか」。業務の語彙ではなく、境界を切るのは application 層(= service)の責務。Go の慣習どおり**使う側**が定義する |

`repository` パッケージが両方を GORM で実装する。適合検査は `var _ domain.ItemRepository = (*ItemRepository)(nil)`
を repository に、`var _ service.Transactor = (*repository.Transactor)(nil)` を `main.go` に置く
(repository は service を import しないため)。結線は `main.go` だけが行う。

**理由** — 依存性逆転。service が「業務が永続化層に何を求めるか」を自分の言葉(`domain`)で宣言し、
GORM はそれに合わせる側に回る。service から `gorm` / `model` / `repository` の import が消え、
テストでは interface を差し替えられる。

**interface から `*gorm.DB` を消す方法** — `domain` は GORM を知らないので、トランザクションを引数で
渡せない。代わりに `Transactor.Transaction(ctx, fn)` が `fn` に**トランザクションを載せた `ctx`** を渡し、
各 repository メソッドは `ctx` からそれを取り出す(無ければ通常の接続)。
service は「`Transaction` の中で受け取った `ctx` をそのまま渡す」だけでよく、tx の存在を意識しない。

**GORM 側の実装** — `db.WithContext(ctx).Transaction(fn)` を使う。

- `WithContext(ctx)` は ctx を `Statement.Context` に載せた `*gorm.DB` を返し、以降の操作すべてに引き継がれる
  (公式のいう「継続セッションモード」。"particularly useful in scenarios like transactions")
- その上で `Transaction` を呼ぶと `BeginTx(ctx, ...)` に ctx が渡るため、**リクエストのキャンセルや
  タイムアウトがトランザクション全体に効く**。`db.Transaction(fn)` だけだと ctx が渡らない
- ctx から取り出した tx にも毎回 `WithContext(ctx)` を掛け直し、個々のクエリのキャンセルも効かせる
- 既にトランザクションの中で `Transaction` を呼ぶと GORM が SavePoint にする(入れ子)

→ [Context — GORM](https://gorm.io/docs/context.html) / [Transactions — GORM](https://gorm.io/docs/transactions.html)

**却下** — `Transactor` も `domain` に置く。最初はそうしていたが、「トランザクション」「ロールバック」は DB の言葉で
業務には登場しない。`domain` には「業務が求めること」だけを残す。

**却下** — 各メソッドに `tx any` を渡す。型が効かず、`domain` が「何か DB っぽいもの」を知ってしまう。

---

## 動かし方

前提: Docker Desktop が起動していること。

```sh
cd backend
cp .env.example .env     # 任意。既定値で動く
make up                  # docker compose up -d --build
make logs                # migrations applied version=3 / bootstrap ... / listening addr=:8088
make smoke               # curl + jq の E2E(66 assert)
make down                # 停止。DB を空に戻すなら make down-v
```

ローカルで `go run` する場合は `make db` で MySQL だけ立ててから `make run`。

| 環境変数 | 既定 | 意味 |
|---|---|---|
| `PORT` | `8088` | api が listen するポート |
| `API_PORT` | `8088` | compose でホスト側に公開するポート |
| `DB_HOST` / `DB_PORT` | `127.0.0.1` / `3306` | compose 内では `db` / `3306` |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `shiori` | |
| `DB_ROOT_PASSWORD` | `root` | compose の MySQL 初期化と healthcheck 用 |
| `CORS_ORIGIN` | `*` | フロントのオリジン |

### 起動時に起きること

1. MySQL に接続(最大 30 回、1 秒間隔でリトライ)
2. `migrations/*.sql` の未適用ぶんを適用(`schema_migrations` で管理)
3. `trip` が無ければ `id=1` を、`days` が無ければ今日(JST)の 1 件を作る(I1)
4. `:8088` で listen

2 と 3 は冪等。再起動しても何も起きない(検証済み: 再起動で `version=3` のみ、`down -v` からの再作成で 3 行が再生成される)。

### smoke が検証していること

- 罠①: `startTime: ""` / `url: ""` で消せて、`GET` で `""` が返る(B2)
- 罠②: `done: false` が保存される(B3)
- 同じ日の後ろへの移動 / 日を跨ぐ移動 / `dayId` だけの移動(末尾) / `position` の超過(クランプ)
- 移動・削除後に各日の `position` が `0..n-1`(I2)
- `GET /api/items` が (day.date, position) 順
- `last_day` / `day_has_items` / `withItems=true` / `date_conflict`
- 文字数を rune で数えている(全角 101 文字で 400)

作ったデータは最後に消すので繰り返し実行できる。
