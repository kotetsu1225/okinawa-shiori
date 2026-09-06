# 沖縄のしおり (ふたり用 旅程アプリ)

## 構成

| レイヤ | 技術 | 状態 |
|---|---|---|
| フロント | TypeScript + React 18 + Vite (container / presentational) | **実装済み**(`frontend/`)。backend と疎通確認済み |
| バックエンド | Go + chi + GORM + MySQL | **実装済み**(`backend/`)。curl による E2E 通過 |

## ドキュメント

- [docs/db-design/](docs/db-design/) — DB 設計。意思決定 D1〜D16、マイグレーション全文、ER 図
  - [README.md](docs/db-design/README.md) — 本体
  - [erd.mmd](docs/db-design/erd.mmd) — ER 図(mermaid 単体ファイル)
- [docs/backend-design/](docs/backend-design/) — バックエンド設計。意思決定 B1〜B13、ディレクトリと責務、API 一覧
  - [README.md](docs/backend-design/README.md) — 本体

## backend/ の動かし方

Docker が動いていれば 2 コマンドで立ち上がる。詳細は [docs/backend-design/README.md](docs/backend-design/README.md#動かし方)。

```sh
cd backend
make up        # docker compose で MySQL 8.4 + api を起動(マイグレーションと初期データは起動時に自動)
make smoke     # curl + jq の E2E。全エンドポイントを叩いて assert する
```

API は `http://localhost:8088/api/...`。ポートは `.env` の `API_PORT` で変えられる。

## frontend/ の動かし方

backend が `:8088` で動いている前提(上記 `make up`)。開発サーバは `/api` を backend にプロキシする。

```sh
cd frontend
pnpm install
pnpm dev        # http://localhost:5173
pnpm typecheck  # tsc --noEmit
pnpm build      # dist/ に静的ファイルを出力。API のオリジンは VITE_API_BASE で指定(.env.example)
```

ログイン画面の「記念日」は [frontend/src/config.ts](frontend/src/config.ts) の `ANNIVERSARY`(`2026-06-24`)。
判定はフロントだけで行い、backend に認証は無い(B10)。セッションは sessionStorage に持つ。

### 構成(container / presentational)

[Container/Presentational パターン](https://zenn.dev/buyselltech/articles/9460c75b7cd8d1)の「分割パターン」で、
ページ・機能ごとに `container.tsx`(ロジック、hooks の呼び出し、Props の組み立て)と
`presenter.tsx`(Props をどう描くかだけ。状態を持たない)に分ける。

```
frontend/src/
├── App.tsx                 # ルートの container。画面切替と、ページをまたぐ状態(旅程・シート・ドラッグ)を束ねる
├── app/AppContext.ts       # 上記の状態を各ページの container に配る Context
├── pages/                  # 画面。Login / Overview(一覧) / Day(日程)
│   └── <Page>/{container,presenter,index}.tsx
├── features/               # 画面をまたいで使う機能。ItemSheet(予定の追加・編集) / TripSheet(旅の設定)
├── components/             # 共通部品。ItemCard / DayHeader は presenter(見た目)+ container(useSortable を噛ませる)、TabBar / SheetShell / decor(太陽・花・波)
├── hooks/                  # ロジック。useItinerary(旅程の読み書き) / useItemSorting(dnd-kit の設定と並べ替え確定) / useSheet / useSession / useCountUp
├── api/                    # fetch の薄いラッパー。backend の API と 1:1(client / trip / days / items / session)
├── types/domain.ts         # backend の domain と 1:1 の型
├── lib/                    # date / url / theme(色・フォント・共通スタイル)
└── config.ts               # ANNIVERSARY / API_BASE
```

### 並べ替え(dnd-kit)

[dnd-kit](https://dndkit.com/)(`@dnd-kit/core` + `@dnd-kit/sortable`)を使う。ページごとに `DndContext` / `SortableContext` を張り、
設定は [useItemSorting.ts](frontend/src/hooks/useItemSorting.ts) にまとめてある。

- 一覧ページは「DAY 見出し + カード」を 1 本の `SortableContext` に並べる。見出しは `"header:<dayId>"` の ID で
  `disabled: { draggable: true, droppable: false }`(掴めないが落とせる)。見出しをまたいで落とすとその日に移り、
  予定が無い日にも見出しに落とせば入る
- ドロップ時は並び順を歩いて「動いた 1 枚がどの日の何番目か」を求め、その 1 枚だけ `PATCH`(B6)
- ハンドルだけで掴む(`listeners` はハンドルの div に付ける)。`restrictToVerticalAxis` で縦方向のみ。キーボード操作(Space → ↑↓ → Space)も可
- 持ち上げ・影・行の詰まり方(.22s)は [lib/sortable.ts](frontend/src/lib/sortable.ts) の `sortableRowStyle` でプロトタイプの値を再現

### プロトタイプからの変更点(DB 設計・API 設計に伴うもの)

1. 日付は `days.date` を実体として持つ。「旅の設定」は出発日ではなく、日ごとに日付を入力する(D1 / D2)
2. 日付・カードの ID はサーバ生成の ULID(D12)。クライアントでは生成しない
3. 並べ替えは**動いた 1 枚だけ** `PATCH /api/items/{id}` に `dayId` / `position` を送る。他は画面上の並びから楽観的に更新し、応答後にサーバの結果で置き換える(B6)
4. 編集は変更したフィールドだけ送る。「空にする」は `""`(B2)。日を変えたときだけ `dayId` を送り、移動先の末尾に置く
5. 「旅の設定」で予定が残っている日を消すと 409 `day_has_items` を受け、シート内で「まとめて消す？」を確認してから `withItems=true` で再送する(B9)
6. 日付の入れ替えで一時的に `date_conflict` になる更新は後回しにして再試行する
7. 旅の最中の見出しは「Now / 旅のまっただなか」ではなく、**次の予定までのカウントダウン**を出す([lib/headline.ts](frontend/src/lib/headline.ts))。
   次の予定 = 時刻が入っていて未完了の予定のうち最も早い未来のもの。`45 分後に 首里そば` / `2 時間15分後に 美ら海水族館` / `1 日後に 美ら海水族館` の 3 段階で、30 秒ごとに更新する。
   時刻付きの未来の予定が無いときだけ従来どおり Now

旧プロトタイプ(dc-runtime 製)は [frontend/prototype/](frontend/prototype/) に残してある。見た目の原本として参照用。
