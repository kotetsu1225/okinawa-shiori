import { useCallback, useEffect, useRef, useState } from 'react';
import { LoginPage } from './presenter';

type Props = {
  initialName: string;
  // 名前と記念日を検証して保存する。失敗は throw
  login: (name: string, anniversary: string) => Promise<unknown>;
  // 退場アニメーションが終わったあとに呼ぶ
  onEntered: () => void;
};

export function LoginContainer({ initialName, login, onEntered }: Props) {
  const [name, setName] = useState(initialName);
  const [anniversary, setAnniversary] = useState('');
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const onSubmit = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await login(name, anniversary);
      setLeaving(true);
      timers.current.push(window.setTimeout(onEntered, 450));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'ログインできませんでした');
      setBusy(false);
      timers.current.push(window.setTimeout(() => setError(''), 2500));
    }
  }, [busy, name, anniversary, login, onEntered]);

  return (
    <LoginPage
      name={name}
      anniversary={anniversary}
      busy={busy}
      leaving={leaving}
      error={error}
      onNameChange={(e) => setName(e.target.value)}
      onAnniversaryChange={(e) => setAnniversary(e.target.value)}
      onSubmit={onSubmit}
    />
  );
}
