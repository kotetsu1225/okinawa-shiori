// 合言葉になる記念日 (YYYY-MM-DD)。
// 記念日の判定はフロントだけで行い、バックエンドに認証は無い(B10)。
export const ANNIVERSARY = '2026-06-24';

// API のオリジン。空文字なら同一オリジン(開発時は vite の proxy が /api を転送する)。
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? '';

// sessionStorage のキー
export const SESSION_KEY = 'okinawa-shiori-v1:session';
