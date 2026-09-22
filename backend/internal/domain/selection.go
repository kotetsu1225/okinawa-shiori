package domain

import "context"

const DefaultTripSlug = "okinawa"

type tripSlugKey struct{}

// WithTripSlug carries the selected itinerary through every repository call.
func WithTripSlug(ctx context.Context, slug string) context.Context {
	if slug == "" {
		slug = DefaultTripSlug
	}
	return context.WithValue(ctx, tripSlugKey{}, slug)
}

func TripSlug(ctx context.Context) string {
	if slug, ok := ctx.Value(tripSlugKey{}).(string); ok {
		return slug
	}
	return DefaultTripSlug
}
