import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppContext, type AppContextValue } from './app/AppContext';
import { TabBar } from './components/TabBar';
import { ItemSheetContainer } from './features/ItemSheet';
import { TripSheetContainer } from './features/TripSheet';
import { useCountUp } from './hooks/useCountUp';
import { useItinerary } from './hooks/useItinerary';
import { useNow } from './hooks/useNow';
import { useSheet } from './hooks/useSheet';
import { usePageRoute } from './hooks/usePageRoute';
import { dayPath, loginDestination, overviewPath, tripFromSearch } from './lib/routes';
import { computeHeadline, headlineTarget } from './lib/headline';
import { color, font } from './lib/theme';
import { DayContainer } from './pages/Day';
import { OverviewContainer } from './pages/Overview';

export function App() {
  const pageRoute = usePageRoute();
  const tripSlug = tripFromSearch(pageRoute.search);
  // A different trip gets fresh data, sheets, and callbacks. Requests already
  // in flight retain their original scope and cannot update this new workspace.
  return <TripWorkspace key={tripSlug} tripSlug={tripSlug} pageRoute={pageRoute} />;
}

type WorkspaceProps = { tripSlug: string; pageRoute: ReturnType<typeof usePageRoute> };

function TripWorkspace({ tripSlug, pageRoute }: WorkspaceProps) {
  const itinerary = useItinerary(tripSlug);
  const sheet = useSheet();
  const { trip, days, items, loaded, loadError } = itinerary;
  const { route, pathname, search, navigate } = pageRoute;
  const screen = route.page === 'day' ? 'day' : 'overview';
  const routeDayId = route.page === 'day' ? route.dayId : null;
  const dayIdx = days.findIndex((day) => day.id === routeDayId);
  const [lastDayId, setLastDayId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (route.page === 'login') navigate(loginDestination(search), true);
  }, [route.page, search, navigate]);

  useEffect(() => {
    if (routeDayId && dayIdx >= 0) setLastDayId(routeDayId);
  }, [routeDayId, dayIdx]);

  useEffect(() => {
    setExpandedId(null);
    setConfirmId(null);
    sheet.close();
    window.scrollTo(0, 0);
  }, [pathname, sheet.close]);

  const theme = trip?.theme ?? (tripSlug === 'onsen' ? 'onsen' : 'okinawa');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.title = trip?.title ?? '旅のしおり';
    return () => { delete document.documentElement.dataset.theme; };
  }, [theme, trip?.title]);

  const now = useNow(30000);
  const headline = useMemo(() => computeHeadline(days, items, now), [days, items, now]);
  const count = useCountUp(headlineTarget(headline), loaded);

  const goOverview = useCallback(() => navigate(overviewPath(tripSlug)), [navigate, tripSlug]);
  const goDay = useCallback(() => {
    const day = days.find((d) => d.id === lastDayId) ?? days[0];
    if (day) navigate(dayPath(day.id, tripSlug));
  }, [days, lastDayId, navigate, tripSlug]);
  const openDay = useCallback((i: number) => {
    const day = days[i];
    if (day) navigate(dayPath(day.id, tripSlug));
  }, [days, navigate, tripSlug]);

  const ctx: AppContextValue = useMemo(
    () => ({
      itinerary,
      sheet,
      nav: { screen, dayIdx, goOverview, goDay, openDay, selectDay: openDay },
      ui: { expandedId, confirmId, setExpandedId, setConfirmId },
      headline,
      count,
    }),
    [itinerary, sheet, screen, dayIdx, goOverview, goDay, openDay, expandedId, confirmId, headline, count],
  );

  const curDayId = screen === 'day' ? days[dayIdx]?.id : undefined;
  const isApp = !!trip && !loadError && route.page !== 'login';
  const missingPage = route.page === 'not-found' || (route.page === 'day' && loaded && !loadError && dayIdx < 0);

  return (
    <AppContext.Provider value={ctx}>
      <div data-theme={theme} style={{ minHeight: '100dvh', display: 'flex', justifyContent: 'center', fontFamily: font.body, color: color.ink, fontSize: 15, lineHeight: 1.5 }}>
        <div style={{ width: '100%', maxWidth: 430, minHeight: '100dvh', background: color.paper, position: 'relative', overflowX: 'clip' }}>
          {!loaded && <div role="status" style={{ padding: '80px 28px', color: color.sub }}>旅のしおりを開いています…</div>}

          {loadError && (
            <div role="alert" style={{ padding: '80px 28px', color: color.red, fontSize: 13 }}>
              しおりを読み込めませんでした。URL と通信状況を確認してください。
              <div style={{ marginTop: 8, color: color.muted }}>{loadError}</div>
              <button onClick={() => void itinerary.refreshAll()} style={{ marginTop: 16, color: color.sea, cursor: 'pointer' }}>もう一度読み込む</button>
            </div>
          )}

          {isApp && !missingPage && screen === 'overview' && <OverviewContainer />}
          {isApp && !missingPage && screen === 'day' && <DayContainer />}

          {loaded && !loadError && missingPage && (
            <div style={{ padding: '80px 28px' }}>
              <p>このページは見つかりませんでした。日程が削除された可能性があります。</p>
              <button onClick={goOverview} style={{ color: color.sea, cursor: 'pointer' }}>一覧に戻る</button>
            </div>
          )}

          {isApp && !missingPage && (
            <TabBar
              active={screen}
              onOverview={goOverview}
              onDay={goDay}
              onAdd={() => {
                const dayId = curDayId ?? days[0]?.id;
                if (dayId) sheet.openAdd(dayId);
              }}
            />
          )}

          {sheet.sheet && sheet.sheet.mode !== 'trip' && <ItemSheetContainer state={sheet.sheet} />}
          {sheet.sheet && sheet.sheet.mode === 'trip' && <TripSheetContainer state={sheet.sheet} />}
        </div>
      </div>
    </AppContext.Provider>
  );
}
