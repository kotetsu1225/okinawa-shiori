import { http } from './client';
import type { Item, ItemInput } from '../types/domain';

// (day.date, position) 順で返る
export const listItems = () => http.get<Item[]>('/api/items');
// position は無視され、その日の末尾に置かれる(B6)
export const createItem = (input: ItemInput & { dayId: string; title: string }) =>
  http.post<Item>('/api/items', input);
// 送ったキーだけ変更。dayId / position を含むと「移動」になり、サーバが振り直す(B6)
export const patchItem = (id: string, input: ItemInput) => http.patch<Item>(`/api/items/${id}`, input);
export const deleteItem = (id: string) => http.delete(`/api/items/${id}`);
