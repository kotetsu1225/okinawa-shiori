// backend/internal/domain/domain.go と 1:1 に対応する API の型。
// 任意項目は null ではなく "" で「未設定」を表す(B2 / D16)。

export type Trip = {
  title: string;
  slug: string;
  theme: 'okinawa' | 'onsen';
};

export type Day = {
  id: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
};

export type Item = {
  id: string;
  dayId: string;
  position: number;
  startTime: string; // 'HH:MM' | '' (時間未定)
  title: string;
  description: string;
  url: string;
  done: boolean;
};

// PATCH / POST の入力。送ったキーだけが変更される(B3)。
export type TripInput = Partial<Pick<Trip, 'title'>>;
export type DayInput = Partial<Pick<Day, 'date' | 'title'>>;
export type ItemInput = Partial<
  Pick<Item, 'dayId' | 'position' | 'startTime' | 'title' | 'description' | 'url' | 'done'>
>;

// エラー応答 {"error":{"code","message",...}}(B7)
export type ApiErrorCode =
  | 'invalid'
  | 'not_found'
  | 'date_conflict'
  | 'last_day'
  | 'day_has_items'
  | 'internal';
