// データ層。今は localStorage で動く。バックエンド接続時はこのファイルの各関数の中身だけ差し替える。
// 型:
//   Trip  = { title: string, start: 'YYYY-MM-DD', days: [{ id: string, title: string }] }
//   Item  = { id: string, dayId: string, order: number, time: 'HH:MM'|'', title: string, desc: string, url: string, done: boolean }
//   Session = { name: string }

export const ANNIVERSARY = '2024-04-01'; // 合言葉になる記念日 (YYYY-MM-DD)。本番はサーバー側で照合する。

const KEY = 'okinawa-shiori-v1';
const uid = () => Math.random().toString(36).slice(2, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const seed = () => {
  const days = [{ id: 'd1', title: '那覇・国際通り' }, { id: 'd2', title: '美ら海と古宇利島' }, { id: 'd3', title: '瀬長島・帰路' }];
  const items = [
    ['d1', '10:30', '那覇空港 着', 'レンタカー受け取り。送迎バスで営業所へ。', 'https://www.naha-airport.co.jp/'],
    ['d1', '12:30', '首里そば', '行列必至。開店30分前を目安に。', ''],
    ['d1', '15:00', '首里城公園', '守礼門で写真。夕方の光がきれい。', 'https://oki-park.jp/shurijo/'],
    ['d1', '19:00', '国際通りで夕ごはん', '', ''],
    ['d2', '09:00', '美ら海水族館', 'ジンベエザメの給餌は15:00と17:00。', 'https://churaumi.okinawa/'],
    ['d2', '13:30', '古宇利大橋を渡る', '橋の手前の駐車場で降りて海を見る。', ''],
    ['d2', '15:00', 'ハートロック', '', ''],
    ['d3', '10:00', '瀬長島ウミカジテラス', '飛行機が近い。おやつ休憩。', ''],
    ['d3', '14:20', '那覇空港 発', 'レンタカー返却は12:30までに。', ''],
  ].map(([dayId, time, title, desc, url], i) => ({ id: uid(), dayId, order: i, time, title, desc, url, done: false }));
  return { trip: { title: 'ふたりの沖縄', start: '2026-10-10', days }, items };
};

const load = () => {
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.trip) return v; } catch (e) {}
  const v = seed(); localStorage.setItem(KEY, JSON.stringify(v)); return v;
};
const save = (v) => localStorage.setItem(KEY, JSON.stringify(v));

// --- 認証 -----------------------------------------------------------
export async function getSession() { // TODO(backend): GET /api/session
  try { return JSON.parse(sessionStorage.getItem(KEY + ':session')); } catch (e) { return null; }
}
export async function login(name, anniversary) { // TODO(backend): POST /api/login {name, anniversary} → 401 で失敗
  await sleep(500);
  if (!name.trim() || anniversary !== ANNIVERSARY) throw new Error('記念日がちがうみたい');
  const s = { name: name.trim() };
  sessionStorage.setItem(KEY + ':session', JSON.stringify(s));
  return s;
}
export async function logout() { sessionStorage.removeItem(KEY + ':session'); } // TODO(backend): POST /api/logout

// --- 旅程 -----------------------------------------------------------
export async function getTrip() { return load().trip; } // TODO(backend): GET /api/trip
export async function saveTrip(trip) { const v = load(); v.trip = trip; save(v); return trip; } // TODO(backend): PUT /api/trip

// --- 予定カード -------------------------------------------------------
export async function listItems() { return load().items; } // TODO(backend): GET /api/items
export async function createItem(data) { // TODO(backend): POST /api/items
  const v = load(); const item = { id: uid(), done: false, ...data }; v.items.push(item); save(v); return item;
}
export async function updateItem(id, patch) { // TODO(backend): PATCH /api/items/:id
  const v = load(); const it = v.items.find((x) => x.id === id); Object.assign(it, patch); save(v); return it;
}
export async function deleteItem(id) { // TODO(backend): DELETE /api/items/:id
  const v = load(); v.items = v.items.filter((x) => x.id !== id); save(v);
}
// 並べ替え確定。changes = [{ id, dayId, order }] を一括で送る。
export async function reorderItems(changes) { // TODO(backend): PUT /api/items/order
  const v = load(); for (const c of changes) { const it = v.items.find((x) => x.id === c.id); if (it) Object.assign(it, c); } save(v); return v.items;
}
