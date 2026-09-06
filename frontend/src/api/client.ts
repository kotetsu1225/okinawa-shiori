import { API_BASE } from '../config';
import type { ApiErrorCode } from '../types/domain';

// backend の {"error":{"code","message",...}} を投げ直す例外(B7)。
// day_has_items のときは itemCount を extra に持つ。
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | string;
  readonly extra: Record<string, unknown>;

  constructor(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.extra = extra;
  }

  get itemCount(): number | undefined {
    const n = this.extra.itemCount;
    return typeof n === 'number' ? n : undefined;
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const err = (json as { error?: Record<string, unknown> } | null)?.error;
    const { code, message, ...extra } = err ?? {};
    throw new ApiError(
      res.status,
      typeof code === 'string' ? code : 'internal',
      typeof message === 'string' ? message : `HTTP ${res.status}`,
      extra,
    );
  }
  return json as T;
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: (path: string) => request<void>('DELETE', path),
};
