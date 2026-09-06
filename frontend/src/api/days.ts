import { http } from './client';
import type { Day, DayInput } from '../types/domain';

// date 昇順で返る(D3)
export const listDays = () => http.get<Day[]>('/api/days');
export const createDay = (input: DayInput & { date: string }) => http.post<Day>('/api/days', input);
export const patchDay = (id: string, input: DayInput) => http.patch<Day>(`/api/days/${id}`, input);
// カードが残っていると 409 day_has_items。withItems=true でカードごと消す(B9)
export const deleteDay = (id: string, withItems = false) =>
  http.delete(`/api/days/${id}${withItems ? '?withItems=true' : ''}`);
