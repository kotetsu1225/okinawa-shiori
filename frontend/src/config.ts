// 合言葉になる記念日 (YYYY-MM-DD)。
// 記念日の判定はフロントだけで行い、バックエンドに認証は無い(B10)。
export const ANNIVERSARY = '2026-06-24';

// API のオリジン。空文字なら同一オリジン(開発時は vite の proxy が /api を転送する)。
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? '';

// localStorage のキー
export const SESSION_KEY = 'okinawa-shiori-v1:session';

// ログインを保持する期間。アプリを開くたびに、その時点から 7 日間へ切り直す(スライディング延長)。
// iOS Safari の ITP は「7 日間ユーザー操作が無いサイト」の script 書き込み可能ストレージを消すため、
// それより長い期間を設定しても実際には保証されない。
// https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
