import { http } from './client';
import type { Item, ItemInput } from '../types/domain';
import { withTrip } from '../lib/routes';

// (day.date, position) 順で返る
export const listItems = (tripSlug: string) => http.get<Item[]>(withTrip('/api/items', tripSlug));
// position は無視され、その日の末尾に置かれる(B6)
export const createItem = (tripSlug: string, input: ItemInput & { dayId: string; title: string }) =>
  http.post<Item>(withTrip('/api/items', tripSlug), input);
// 送ったキーだけ変更。dayId / position を含むと「移動」になり、サーバが振り直す(B6)
export const patchItem = (tripSlug: string, id: string, input: ItemInput) => http.patch<Item>(withTrip(`/api/items/${encodeURIComponent(id)}`, tripSlug), input);
export const deleteItem = (tripSlug: string, id: string) => http.delete(withTrip(`/api/items/${encodeURIComponent(id)}`, tripSlug));
