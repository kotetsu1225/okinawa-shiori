import { http } from './client';
import type { Trip, TripInput } from '../types/domain';

export const getTrip = () => http.get<Trip>('/api/trip');
export const patchTrip = (input: TripInput) => http.patch<Trip>('/api/trip', input);
