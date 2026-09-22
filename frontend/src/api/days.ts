import { http } from './client';
import type { Day, DayInput } from '../types/domain';
import { withTrip } from '../lib/routes';

// date 昇順で返る(D3)
export const listDays = (tripSlug: string) => http.get<Day[]>(withTrip('/api/days', tripSlug));
export const createDay = (tripSlug: string, input: DayInput & { date: string }) => http.post<Day>(withTrip('/api/days', tripSlug), input);
export const patchDay = (tripSlug: string, id: string, input: DayInput) => http.patch<Day>(withTrip(`/api/days/${encodeURIComponent(id)}`, tripSlug), input);
// カードが残っていると 409 day_has_items。withItems=true でカードごと消す(B9)
export const deleteDay = (tripSlug: string, id: string, withItems = false) =>
  http.delete(withTrip(`/api/days/${encodeURIComponent(id)}${withItems ? '?withItems=true' : ''}`, tripSlug));
