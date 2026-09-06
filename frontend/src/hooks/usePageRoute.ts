import { useCallback, useEffect, useState } from 'react';
import { parseRoute } from '../lib/routes';

const readLocation = () => ({ pathname: window.location.pathname, search: window.location.search });

export function usePageRoute() {
  const [location, setLocation] = useState(readLocation);
  useEffect(() => {
    const onPopState = () => setLocation(readLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: string, replace = false) => {
    if (path === window.location.pathname + window.location.search) return;
    if (replace) window.history.replaceState(null, '', path);
    else window.history.pushState(null, '', path);
    setLocation(readLocation());
  }, []);

  return { ...location, route: parseRoute(location.pathname), navigate };
}
