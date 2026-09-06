import { useCallback, useState } from 'react';
import * as sessionApi from '../api/session';
import type { Session } from '../types/domain';

// ログイン状態。enter() で検証と保存だけを行い、commit() で画面の状態に反映する。
// 2 段階なのは、ログイン成功後の退場アニメーション(450ms)の間はログイン画面を出し続けるため。
export function useSession() {
  const [session, setSession] = useState<Session | null>(() => sessionApi.getSession());

  const enter = useCallback((name: string, anniversary: string) => sessionApi.login(name, anniversary), []);

  const commit = useCallback(() => setSession(sessionApi.getSession()), []);

  const logout = useCallback(() => {
    sessionApi.logout();
    setSession(null);
  }, []);

  return { session, enter, commit, logout };
}
