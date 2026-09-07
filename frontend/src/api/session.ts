import { ANNIVERSARY, SESSION_KEY, SESSION_TTL_MS } from '../config';
import type { Session } from '../types/domain';

// 認証はフロントだけで行う(B10)。localStorage に期限付きで保持する。
// sessionStorage はタブを閉じると消える仕様のため、アプリを開き直すたびに再ログインが要る。
// https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// 保存形式。expiresAt は epoch ミリ秒
type Stored = Session & { expiresAt: number };

function save(name: string): Session {
  const s: Session = { name };
  const stored: Stored = { ...s, expiresAt: Date.now() + SESSION_TTL_MS };
  localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
  return s;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== 'object') return null;
    const { name, expiresAt } = v as Partial<Stored>;
    if (typeof name !== 'string' || !name) return null;
    if (typeof expiresAt !== 'number' || Date.now() >= expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    // 開くたびに期限を切り直す(スライディング延長)。7 日以上あけると失効する
    return save(name);
  } catch {
    return null;
  }
}

export async function login(name: string, anniversary: string): Promise<Session> {
  await sleep(500);
  if (!name.trim() || anniversary !== ANNIVERSARY) throw new Error('記念日がちがうみたい');
  return save(name.trim());
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}
