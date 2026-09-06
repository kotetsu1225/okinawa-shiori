import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppContext, type AppContextValue } from './app/AppContext';
import { TabBar } from './components/TabBar';
import { ItemSheetContainer } from './features/ItemSheet';
import { TripSheetContainer } from './features/TripSheet';
import { useCountUp } from './hooks/useCountUp';
import { useItinerary } from './hooks/useItinerary';
import { useNow } from './hooks/useNow';
import { useSession } from './hooks/useSession';
import { useSheet } from './hooks/useSheet';
import { usePageRoute } from './hooks/usePageRoute';
import { dayPath, loginDestination } from './lib/routes';
import { computeHeadline, headlineTarget } from './lib/headline';
import { color, font } from './lib/theme';
import { DayContainer } from './pages/Day';
import { LoginContainer } from './pages/Login';
import { OverviewContainer } from './pages/Overview';

// ルートの container。画面の切替と、ページをまたいで共有する状態(旅程・シート・展開中のカード)を束ねる。
export function App() {
  const { session, enter, commit, logout } = useSession();
  const itinerary = useItinerary();
  const sheet = useSheet();
  const { days, items, loaded, loadError } = itinerary;

  const { route, pathname, search, navigate } = usePageRoute();
  const screen = route.page === 'day' ? 'day' : 'overview';
  const routeDayId = route.page === 'day' ? route.dayId : null;
  const dayIdx = days.findIndex((day) => day.id === routeDayId);
  const [lastDayId, setLastDayId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [lastName, setLastName] = useState(session?.name ?? '');

  useEffect(() => {
    if (!session && route.page !== 'login') {
      const next = route.page === 'day' ? `?next=${encodeURIComponent(dayPath(route.dayId))}` : '';
      navigate(`/login${next}`, true);
    } else if (session && route.page === 'login') {
      navigate(loginDestination(search), true);
    }
  }, [session, route.page, routeDayId, search, navigate]);

  useEffect(() => {
    if (routeDayId && dayIdx >= 0) setLastDayId(routeDayId);
  }, [routeDayId, dayIdx]);

  useEffect(() => {
    setExpandedId(null);
    setConfirmId(null);
    sheet.close();
    window.scrollTo(0, 0);
  }, [pathname, sheet.close]);

  // ---- 一覧上部の見出し。出発前は出発までの日数、旅の最中は次の予定までのカウントダウン。30 秒ごとに再計算
  const now = useNow(30000);
  const headline = useMemo(() => computeHeadline(days, items, now), [days, items, now]);
  const count = useCountUp(headlineTarget(headline), !!session && loaded);

  // ---- 画面遷移
  const goOverview = useCallback(() => navigate('/'), [navigate]);
  const goDay = useCallback(() => {
    const day = days.find((d) => d.id === lastDayId) ?? days[0];
    if (day) navigate(dayPath(day.id));
  }, [days, lastDayId, navigate]);
  const openDay = useCallback((i: number) => {
    const day = days[i];
    if (day) navigate(dayPath(day.id));
  }, [days, navigate]);
  const selectDay = openDay;

  const doLogout = useCallback(() => {
    logout();
    sheet.close();
    navigate('/login', true);
  }, [logout, sheet.close, navigate]);

  const onEntered = useCallback(() => {
    commit();
    navigate(loginDestination(search), true);
  }, [commit, search, navigate]);

  useEffect(() => {
    if (session) setLastName(session.name);
  }, [session]);

  const ctx: AppContextValue = useMemo(
    () => ({
      itinerary,
      sheet,
      session: { name: session?.name ?? '', logout: doLogout },
      nav: { screen, dayIdx, goOverview, goDay, openDay, selectDay },
      ui: { expandedId, confirmId, setExpandedId, setConfirmId },
      headline,
      count,
    }),
    [itinerary, sheet, session, doLogout, screen, dayIdx, goOverview, goDay, openDay, selectDay, expandedId, confirmId, headline, count],
  );

  const curDayId = screen === 'day' ? days[dayIdx]?.id : undefined;
  const isApp = !!session && !!itinerary.trip && route.page !== 'login';
  const missingPage = route.page === 'not-found' || (route.page === 'day' && loaded && !loadError && dayIdx < 0);

  return (
    <AppContext.Provider value={ctx}>
      <div style={{ minHeight: '100dvh', display: 'flex', justifyContent: 'center', fontFamily: font.body, color: color.ink, fontSize: 15, lineHeight: 1.5 }}>
        <div style={{ width: '100%', maxWidth: 430, minHeight: '100dvh', background: color.paper, position: 'relative', overflowX: 'clip' }}>
          {!session && <LoginContainer initialName={lastName} login={enter} onEntered={onEntered} />}

          {session && loadError && (
            <div style={{ padding: '80px 28px', color: color.red, fontSize: 13 }}>
              しおりを読み込めませんでした。バックエンドが起動しているか確認してね。
              <div style={{ marginTop: 8, color: color.muted }}>{loadError}</div>
            </div>
          )}

          {isApp && !missingPage && screen === 'overview' && <OverviewContainer />}
          {isApp && !missingPage && screen === 'day' && <DayContainer />}

          {session && missingPage && (
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

          {session && sheet.sheet && sheet.sheet.mode !== 'trip' && <ItemSheetContainer state={sheet.sheet} />}
          {session && sheet.sheet && sheet.sheet.mode === 'trip' && <TripSheetContainer state={sheet.sheet} />}
        </div>
      </div>
    </AppContext.Provider>
  );
}
