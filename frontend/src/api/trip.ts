import { http } from './client';
import type { Trip, TripInput } from '../types/domain';
import { withTrip } from '../lib/routes';

export const getTrip = (tripSlug: string) => http.get<Trip>(withTrip('/api/trip', tripSlug));
export const patchTrip = (tripSlug: string, input: TripInput) => http.patch<Trip>(withTrip('/api/trip', tripSlug), input);
