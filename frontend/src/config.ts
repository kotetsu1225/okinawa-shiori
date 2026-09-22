// API のオリジン。空文字なら同一オリジン(開発時は vite の proxy が /api を転送する)。
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? '';
