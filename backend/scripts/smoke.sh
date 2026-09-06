#!/usr/bin/env bash
# curl + jq による E2E。api が起動している前提。全 assert が通れば exit 0。
# 使い方: ./scripts/smoke.sh [BASE_URL]   (既定 http://localhost:8088)
# 作った日付・カードは最後に削除するので、繰り返し実行できる。
set -uo pipefail

BASE="${1:-http://localhost:8088}"
PASS=0
FAIL=0
STATUS=""
BODY=""

# ---- helpers -------------------------------------------------------------

req() { # METHOD PATH [JSON]
  local method=$1 path=$2 data=${3:-} out
  if [[ -n "$data" ]]; then
    out=$(curl -sS -X "$method" "$BASE$path" -H 'Content-Type: application/json' -d "$data" -w $'\n%{http_code}')
  else
    out=$(curl -sS -X "$method" "$BASE$path" -w $'\n%{http_code}')
  fi
  STATUS="${out##*$'\n'}"
  BODY="${out%$'\n'*}"
}

check() { # DESC RC
  if [[ "$2" == "0" ]]; then
    echo "  ok    $1"; PASS=$((PASS + 1))
  else
    echo "  FAIL  $1"; echo "        status=$STATUS body=$BODY"; FAIL=$((FAIL + 1))
  fi
}

expect_status() { # DESC EXPECTED
  local rc=0; [[ "$STATUS" == "$2" ]] || rc=1
  check "$1 → $2" $rc
}

expect_jq() { # DESC JQ_BOOLEAN_FILTER   (BODY に対して true になること)
  local rc=0; jq -e "$2" <<<"$BODY" >/dev/null 2>&1 || rc=1
  check "$1  [$2]" $rc
}

field() { jq -r "$1" <<<"$BODY"; }

section() { echo; echo "== $1"; }

# ---- health ----------------------------------------------------------------

section "health"
req GET /api/health
expect_status "GET /api/health" 200
expect_jq "ok is true" '.ok == true'

# ---- trip ------------------------------------------------------------------

section "trip"
req GET /api/trip
expect_status "GET /api/trip" 200
req PATCH /api/trip '{"title":"ふたりの沖縄"}'
expect_status "PATCH /api/trip title" 200
expect_jq "title updated" '.title == "ふたりの沖縄"'
req GET /api/trip
expect_jq "title persisted" '.title == "ふたりの沖縄"'
LONG=$(printf 'あ%.0s' $(seq 1 101))
req PATCH /api/trip "{\"title\":\"$LONG\"}"
expect_status "PATCH /api/trip 101 chars (rune count)" 400
req PATCH /api/trip '{"title":'
expect_status "PATCH /api/trip broken JSON" 400

# ---- days ------------------------------------------------------------------

section "days"
req GET /api/days
expect_status "GET /api/days" 200
expect_jq "bootstrap created at least one day (I1)" 'length >= 1'
D0=$(field '.[0].id')

req POST /api/days '{"date":"2026-10-10","title":"那覇"}'
expect_status "POST day 2026-10-10" 201
expect_jq "returns id/date/title" '.id != "" and .date == "2026-10-10" and .title == "那覇"'
D1=$(field '.id')

req POST /api/days '{"date":"2026-10-11","title":"美ら海"}'
expect_status "POST day 2026-10-11" 201
D2=$(field '.id')

req POST /api/days '{"date":"2026-10-10","title":"dup"}'
expect_status "POST duplicate date (D4)" 409
expect_jq "code date_conflict" '.error.code == "date_conflict"'

req POST /api/days '{"date":"2026-13-01"}'
expect_status "POST invalid date" 400
req POST /api/days '{"title":"no date"}'
expect_status "POST without date" 400

req PATCH "/api/days/$D1" '{"title":"那覇・国際通り"}'
expect_status "PATCH day title" 200
expect_jq "title updated, date untouched" '.title == "那覇・国際通り" and .date == "2026-10-10"'

req PATCH "/api/days/$D1" '{"date":"2026-10-11"}'
expect_status "PATCH day to existing date (D4)" 409

req PATCH "/api/days/01ZZZZZZZZZZZZZZZZZZZZZZZZ" '{"title":"x"}'
expect_status "PATCH nonexistent day" 404

req GET /api/days
expect_jq "days sorted by date asc (D3)" '[.[].date] == ([.[].date] | sort)'

# ---- items -----------------------------------------------------------------

section "items"
req POST /api/items "{\"dayId\":\"$D1\",\"startTime\":\"10:30\",\"title\":\"那覇空港 着\",\"description\":\"レンタカー受け取り\",\"url\":\"https://www.naha-airport.co.jp/\"}"
expect_status "POST item 1" 201
expect_jq "position 0, fields echoed" '.position == 0 and .startTime == "10:30" and .description == "レンタカー受け取り" and .done == false'
I1=$(field '.id')

req POST /api/items "{\"dayId\":\"$D1\",\"title\":\"首里そば\",\"startTime\":\"\",\"position\":99}"
expect_status "POST item 2 (position ignored)" 201
expect_jq "position 1 (appended), empty fields are \"\"" '.position == 1 and .startTime == "" and .description == "" and .url == ""'
I2=$(field '.id')

req POST /api/items "{\"dayId\":\"$D1\",\"title\":\"首里城\"}"
expect_status "POST item 3" 201
expect_jq "position 2" '.position == 2'
I3=$(field '.id')

req POST /api/items "{\"dayId\":\"$D1\"}"
expect_status "POST item without title" 400
req POST /api/items "{\"dayId\":\"$D1\",\"title\":\"   \"}"
expect_status "POST item blank title" 400
req POST /api/items '{"dayId":"01ZZZZZZZZZZZZZZZZZZZZZZZZ","title":"x"}'
expect_status "POST item with unknown dayId (B8)" 400
req POST /api/items "{\"dayId\":\"$D1\",\"title\":\"x\",\"startTime\":\"25:00\"}"
expect_status "POST item invalid startTime" 400

# 罠②: ゼロ値の保存
req PATCH "/api/items/$I1" '{"done":true}'
expect_status "PATCH done=true" 200
expect_jq "done true" '.done == true'
req PATCH "/api/items/$I1" '{"done":false}'
expect_status "PATCH done=false" 200
expect_jq "done false is persisted (GORM zero-value trap)" '.done == false'
req GET /api/items
expect_jq "done false persisted on GET" "map(select(.id == \"$I1\"))[0].done == false"

# 罠①: "" → NULL → ""
req PATCH "/api/items/$I1" '{"startTime":"","url":""}'
expect_status "PATCH clear startTime/url with \"\"" 200
expect_jq "cleared fields come back as \"\"" '.startTime == "" and .url == ""'
expect_jq "untouched fields kept" '.title == "那覇空港 着" and .description == "レンタカー受け取り"'

# 同じ日の中で後ろへ: [I1,I2,I3] → I1 を 2 へ → [I2,I3,I1]
req PATCH "/api/items/$I1" '{"position":2}'
expect_status "PATCH move I1 to position 2 (same day)" 200
expect_jq "I1 now at 2" '.position == 2'
req GET /api/items
expect_jq "day1 order is I2,I3,I1" "[.[] | select(.dayId == \"$D1\") | .id] == [\"$I2\",\"$I3\",\"$I1\"]"

# 日をまたいで先頭へ: I3 → D2 の 0
req PATCH "/api/items/$I3" "{\"dayId\":\"$D2\",\"position\":0}"
expect_status "PATCH move I3 to day2 position 0" 200
expect_jq "I3 in day2 at 0" ".dayId == \"$D2\" and .position == 0"
req GET /api/items
expect_jq "day1 renumbered to I2(0),I1(1)" "[.[] | select(.dayId == \"$D1\") | [.id, .position]] == [[\"$I2\",0],[\"$I1\",1]]"

# dayId だけ指定 → 末尾に追加
req PATCH "/api/items/$I2" "{\"dayId\":\"$D2\"}"
expect_status "PATCH move I2 to day2 (no position → append)" 200
expect_jq "I2 appended at 1" ".dayId == \"$D2\" and .position == 1"

# position を超過指定 → 末尾にクランプ
req PATCH "/api/items/$I1" '{"position":999}'
expect_status "PATCH position 999 clamps" 200
expect_jq "I1 stays at 0 (only card in day1)" '.position == 0'

req PATCH "/api/items/$I1" "{\"dayId\":\"01ZZZZZZZZZZZZZZZZZZZZZZZZ\"}"
expect_status "PATCH move to unknown dayId" 400
req PATCH "/api/items/$I1" '{"title":""}'
expect_status "PATCH empty title" 400

req DELETE "/api/items/$I3"
expect_status "DELETE I3" 204
req GET /api/items
expect_jq "day2 renumbered: I2 at 0" "[.[] | select(.dayId == \"$D2\") | [.id, .position]] == [[\"$I2\",0]]"
expect_jq "every day has contiguous positions 0..n-1 (I2)" '[group_by(.dayId)[] | [.[].position] == [range(length)]] | all'
# 並び順: days の順(date 昇順)でグループ化され、その中で position 昇順であること
DAYS_ORDER=$(curl -sS "$BASE/api/days" | jq -c '[.[].id]')
rc=0
jq -e --argjson days "$DAYS_ORDER" \
  '[.[] | .dayId as $d | [($days | index($d)), .position]] as $k | $k == ($k | sort)' <<<"$BODY" >/dev/null 2>&1 || rc=1
check "GET /api/items sorted by (day.date, position)" $rc

req DELETE "/api/items/01ZZZZZZZZZZZZZZZZZZZZZZZZ"
expect_status "DELETE nonexistent item" 404

# ---- days delete (I1 / I3) -------------------------------------------------

section "days delete"
req DELETE "/api/days/$D2"
expect_status "DELETE day2 with items (I3)" 409
expect_jq "code day_has_items, itemCount 1" '.error.code == "day_has_items" and .error.itemCount == 1'

req DELETE "/api/days/$D2?withItems=true"
expect_status "DELETE day2 withItems=true" 204
req GET /api/items
expect_jq "no items left in day2" "[.[] | select(.dayId == \"$D2\")] | length == 0"

req DELETE "/api/days/$D1?withItems=true"
expect_status "DELETE day1 withItems=true" 204

req GET /api/days
expect_jq "only bootstrap day remains" 'length == 1'
req DELETE "/api/days/$D0"
expect_status "DELETE last day (I1)" 409
expect_jq "code last_day" '.error.code == "last_day"'

req DELETE "/api/days/01ZZZZZZZZZZZZZZZZZZZZZZZZ"
expect_status "DELETE nonexistent day" 404

# ---- result ----------------------------------------------------------------

echo
echo "passed: $PASS  failed: $FAIL"
[[ "$FAIL" == "0" ]]
