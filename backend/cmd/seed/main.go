// Command seed adds an itinerary from JSON without changing existing trips.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"

	"okinawa-shiori/backend/internal/config"
	"okinawa-shiori/backend/internal/database"
)

func main() {
	file := flag.String("file", "", "path to itinerary JSON (required)")
	flag.Parse()
	if *file == "" {
		log.Fatal("usage: go run ./cmd/seed -file path/to/trip.json")
	}
	data, err := os.ReadFile(*file)
	if err != nil {
		log.Fatal(err)
	}
	var seed database.TripSeed
	if err := json.Unmarshal(data, &seed); err != nil {
		log.Fatal(err)
	}
	cfg := config.Load()
	ctx := context.Background()
	db, err := database.Open(ctx, cfg.DSN())
	if err != nil {
		log.Fatal(err)
	}
	if _, err := database.Migrate(cfg.DSN()); err != nil {
		log.Fatal(err)
	}
	created, err := database.SeedTrip(ctx, db, seed)
	if err != nil {
		log.Fatal(err)
	}
	if created {
		fmt.Printf("created trip %q\n", seed.Slug)
	} else {
		fmt.Printf("trip %q already exists; left unchanged\n", seed.Slug)
	}
}
