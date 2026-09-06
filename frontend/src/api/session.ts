import { ANNIVERSARY, SESSION_KEY } from '../config';
import type { Session } from '../types/domain';

// 認証はフロントだけで行う(B10)。sessionStorage にのみ保持し、タブを閉じると消える。

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const v: unknown = JSON.parse(raw);
    if (v && typeof v === 'object' && typeof (v as Session).name === 'string') return v as Session;
    return null;
  } catch {
    return null;
  }
}

export async function login(name: string, anniversary: string): Promise<Session> {
  await sleep(500);
  if (!name.trim() || anniversary !== ANNIVERSARY) throw new Error('記念日がちがうみたい');
  const s: Session = { name: name.trim() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  return s;
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
