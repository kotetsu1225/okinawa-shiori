import type { ChangeEvent, CSSProperties } from 'react';
import { Sun } from '../../components/decor/Sun';
import { Flower } from '../../components/decor/Flower';
import { Waves } from '../../components/decor/Waves';
import { color, font } from '../../lib/theme';

export type LoginPageProps = {
  name: string;
  anniversary: string;
  busy: boolean;
  leaving: boolean;
  error: string;
  onNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAnniversaryChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
};

const inputStyle: CSSProperties = {
  width: '100%',
  height: 52,
  borderRadius: 16,
  border: `1.5px solid ${color.lineInput}`,
  background: '#fff',
  padding: '0 18px',
  outline: 'none',
  fontSize: 16,
};

export function LoginPage(p: LoginPageProps) {
  const wrapStyle: CSSProperties = {
    animation: p.leaving ? 'leave .45s ease-in both' : p.error ? 'shake .5s' : 'none',
  };
  const buttonStyle: CSSProperties = {
    height: 54,
    borderRadius: 16,
    border: 0,
    background: p.busy ? color.seaDim : color.sea,
    color: '#fff',
    fontFamily: font.maru,
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(30,134,180,.3)',
    transition: 'background .2s, transform .15s',
    marginTop: 6,
  };

  return (
    <div style={wrapStyle}>
      <div
        style={{
          minHeight: '100dvh',
          padding: '0 28px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: 'linear-gradient(180deg,#CFEAF4 0%,#E9F5F9 45%,#F6FAFC 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Sun size={120} top={70} right={36} shadow="0 20px 50px rgba(245,196,81,.35)" />
        <Flower variant="large" top={44} left={26} />
        <Waves
          height={150}
          waves={[
            { bottom: 60, height: 70, duration: 14, opacity: 0.55, fill: '#8FCBE0' },
            { bottom: 0, height: 110, duration: 9, reverse: true, fill: '#BFE3EE' },
          ]}
        />
        <div style={{ position: 'relative', animation: 'rise .7s cubic-bezier(.2,.8,.2,1) both' }}>
          <div style={{ fontFamily: font.grotesque, fontSize: 12, letterSpacing: '.22em', color: color.sea, fontWeight: 700 }}>OKINAWA · TWO OF US</div>
          <h1 style={{ fontFamily: font.maru, fontWeight: 700, fontSize: 38, lineHeight: 1.2, margin: '8px 0 6px' }}>
            ふたりの
            <br />
            沖縄のしおり
          </h1>
          <p style={{ margin: '0 0 28px', color: color.sub }}>名前と、ふたりの記念日を入れてね。</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={p.name} onChange={p.onNameChange} placeholder="あなたの名前" style={inputStyle} />
            <input
              type="date"
              value={p.anniversary}
              onChange={p.onAnniversaryChange}
              style={{ ...inputStyle, color: color.ink, WebkitAppearance: 'none', appearance: 'none' }}
            />
            <button onClick={p.onSubmit} style={buttonStyle}>
              {p.busy ? '確認中…' : 'しおりを開く'}
            </button>
          </div>
          <div style={{ height: 22, marginTop: 10, fontSize: 13, color: color.red, fontWeight: 500 }}>{p.error}</div>
        </div>
      </div>
    </div>
  );
}
