export const DEFAULT_TRIP = 'okinawa';

export function tripFromSearch(search: string): string {
  return new URLSearchParams(search).get('trip') || DEFAULT_TRIP;
}

// Every caller supplies its own captured trip. In-flight requests must never
// consult window.location after the user has switched to another itinerary.
export function withTrip(path: string, tripSlug: string): string {
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  if (tripSlug === DEFAULT_TRIP) params.delete('trip');
  else params.set('trip', tripSlug);
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ''}`;
}

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

export const overviewPath = (tripSlug = DEFAULT_TRIP) => withTrip('/', tripSlug);
export const dayPath = (id: string, tripSlug = DEFAULT_TRIP) => withTrip(`/days/${encodeURIComponent(id)}`, tripSlug);

// Only internal, recognized destinations may be used after login.
export function loginDestination(search: string): string {
  const next = new URLSearchParams(search).get('next') ?? '/';
  const tripSlug = tripFromSearch(search);
  // Legacy login links can contain a scoped day link. Never accept a host,
  // backslash, or a fragment as part of that destination.
  if (!next.startsWith('/') || next.startsWith('//') || /[\\#]/.test(next)) return overviewPath(tripSlug);
  const [pathname, nextSearch = ''] = next.split('?');
  const scope = new URLSearchParams(search).has('trip') ? tripSlug : tripFromSearch(nextSearch);
  const route = parseRoute(pathname);
  return route.page === 'day' ? dayPath(route.dayId, scope) : overviewPath(scope);
}
