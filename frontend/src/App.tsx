import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppContext, type AppContextValue, type Screen } from './app/AppContext';
import { TabBar } from './components/TabBar';
import { ItemSheetContainer } from './features/ItemSheet';
import { TripSheetContainer } from './features/TripSheet';
import { useCountUp } from './hooks/useCountUp';
import { useItinerary } from './hooks/useItinerary';
import { useNow } from './hooks/useNow';
import { useSession } from './hooks/useSession';
import { useSheet } from './hooks/useSheet';
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

  const [screen, setScreen] = useState<Screen>('overview');
  const [dayIdx, setDayIdx] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [lastName, setLastName] = useState(session?.name ?? '');

  // 日が減ったら dayIdx を範囲内に収める
  useEffect(() => {
    if (days.length && dayIdx > days.length - 1) setDayIdx(days.length - 1);
  }, [days.length, dayIdx]);

  // ---- 一覧上部の見出し。出発前は出発までの日数、旅の最中は次の予定までのカウントダウン。30 秒ごとに再計算
  const now = useNow(30000);
  const headline = useMemo(() => computeHeadline(days, items, now), [days, items, now]);
  const count = useCountUp(headlineTarget(headline), !!session && loaded);

  // ---- 画面遷移
  const goOverview = useCallback(() => {
    setScreen('overview');
    setExpandedId(null);
    window.scrollTo(0, 0);
  }, []);
  const goDay = useCallback(() => {
    setScreen('day');
    setExpandedId(null);
    window.scrollTo(0, 0);
  }, []);
  const openDay = useCallback((i: number) => {
    setScreen('day');
    setDayIdx(i);
    window.scrollTo(0, 0);
  }, []);
  const selectDay = useCallback((i: number) => {
    setDayIdx(i);
    setExpandedId(null);
  }, []);

  const doLogout = useCallback(() => {
    logout();
    setScreen('overview');
  }, [logout]);

  const onEntered = useCallback(() => {
    commit();
    setScreen('overview');
  }, [commit]);

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

  const curDayId = screen === 'day' ? days[Math.min(dayIdx, days.length - 1)]?.id : undefined;
  const isApp = !!session && !!itinerary.trip;

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

          {isApp && screen === 'overview' && <OverviewContainer />}
          {isApp && screen === 'day' && <DayContainer />}

          {isApp && (
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
