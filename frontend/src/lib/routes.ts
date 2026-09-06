export type PageRoute = { page: 'login' | 'overview' | 'not-found' } | { page: 'day'; dayId: string };

export function parseRoute(path: string): PageRoute {
  if (path === '/') return { page: 'overview' };
  if (path === '/login' || path === '/login/') return { page: 'login' };
  const match = /^\/days\/([^/]+)\/?$/.exec(path);
  if (match) {
    try {
      const dayId = decodeURIComponent(match[1]);
      if (dayId && !/[/?#\\]/.test(dayId)) return { page: 'day', dayId };
    } catch { /* Malformed URL: show the missing-page view. */ }
  }
  return { page: 'not-found' };
}

export const dayPath = (id: string) => `/days/${encodeURIComponent(id)}`;

// Only internal, recognized destinations may be used after login.
export function loginDestination(search: string): string {
  const next = new URLSearchParams(search).get('next') ?? '/';
  const route = parseRoute(next);
  return route.page === 'day' ? dayPath(route.dayId) : '/';
}
