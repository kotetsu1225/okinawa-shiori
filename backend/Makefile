.PHONY: up down down-v db run build vet logs smoke

## docker compose で db + api を起動(ビルド込み)
up:
	docker compose up -d --build

down:
	docker compose down

## ボリュームごと削除(DB を空に戻す)
down-v:
	docker compose down -v

## db だけ起動して、api はローカルで go run する開発用
db:
	docker compose up -d db

run:
	go run ./cmd/server

build:
	go build ./...

vet:
	go vet ./...

logs:
	docker compose logs -f api

## curl + jq の E2E。api が :8088 (API_PORT で変更可) で動いている前提
smoke:
	./scripts/smoke.sh http://localhost:$${API_PORT:-8088}
