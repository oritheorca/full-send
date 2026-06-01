/* ui.jsx — shared controls: Sheet, Toggle, Stepper, Segmented, buttons, Chip. */

const { useState: useStateUI, useEffect: useEffectUI, useRef: useRefUI } = React;

/* Bottom sheet with backdrop + slide-up. */
function Sheet({ open, onClose, title, children, maxHeight = '88%' }) {
  const [mounted, setMounted] = useStateUI(open);
  const [shown, setShown] = useStateUI(false);
  useEffectUI(() => {
    if (open) {
      setMounted(true);
      const t = setTimeout(() => setShown(true), 10);
      return () => clearTimeout(t);
    } else {
      setShown(false);
      const t = setTimeout(() => setMounted(false), 280);
      return () => clearTimeout(t);
    }
  }, [open]);
  if (!mounted) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}>
      <div onPointerDown={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
        opacity: shown ? 1 : 0, transition: 'opacity 0.28s ease',
        backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--surface)', color: 'var(--ink)',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        boxShadow: 'var(--shadow-float)', maxHeight,
        display: 'flex', flexDirection: 'column',
        transform: shown ? 'translateY(0)' : 'translateY(102%)',
        transition: 'transform 0.32s cubic-bezier(.32,.72,0,1)',
        paddingBottom: 30,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 38, height: 5, borderRadius: 999, background: 'var(--line-strong)' }} />
        </div>
        {title && (
          <div style={{
            fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 21,
            color: 'var(--ink)', padding: '14px 22px 6px',
          }}>{title}</div>
        )}
        <div style={{ overflowY: 'auto', padding: '6px 22px 0' }}>{children}</div>
      </div>
    </div>
  );
}

/* iOS-style switch. */
function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 52, height: 32, borderRadius: 999, border: 'none', padding: 2,
      background: on ? 'var(--accent)' : 'var(--line-strong)',
      position: 'relative', cursor: 'pointer', flexShrink: 0,
      transition: 'background 0.22s ease',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 28, height: 28, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.22s cubic-bezier(.32,.72,0,1)',
      }} />
    </button>
  );
}

/* Stepper: −  value  + */
function Stepper({ value, min = 0, max = 99, step = 1, onChange, format, suffix }) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  const btn = (label, fn, disabled) => (
    <button onClick={fn} disabled={disabled} style={{
      width: 46, height: 46, borderRadius: 14, border: 'none', cursor: disabled ? 'default' : 'pointer',
      background: 'var(--surface-2)', color: disabled ? 'var(--ink-faint)' : 'var(--ink)',
      fontSize: 24, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-ui)', lineHeight: 1,
    }}>{label}</button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {btn('−', dec, value <= min)}
      <div style={{
        minWidth: 64, textAlign: 'center', fontFamily: 'var(--font-display)',
        fontWeight: 700, fontSize: 26, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums',
      }}>
        {format ? format(value) : value}{suffix && <span style={{ fontSize: 30, fontWeight: 700, color: 'var(--ink-muted)', marginLeft: 4 }}>{suffix}</span>}
      </div>
      {btn('+', inc, value >= max)}
    </div>
  );
}

/* Segmented control — options [{value,label,color}] */
function Segmented({ options, value, onChange }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`,
      gap: 4, background: 'var(--surface-2)', borderRadius: 14, padding: 4,
    }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            border: 'none', cursor: 'pointer', borderRadius: 11, padding: '10px 4px',
            fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5,
            letterSpacing: '0.01em',
            background: active ? (o.color || 'var(--surface)') : 'transparent',
            color: active ? (o.ink || 'var(--ink)') : 'var(--ink-muted)',
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'background 0.18s ease, color 0.18s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function PrimaryButton({ children, onClick, style, color = 'var(--accent)', ink = 'var(--accent-ink)', disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border: 'none', cursor: disabled ? 'default' : 'pointer', width: '100%',
      background: disabled ? 'var(--surface-2)' : color,
      color: disabled ? 'var(--ink-faint)' : ink,
      fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 17,
      padding: '17px 20px', borderRadius: 'var(--radius-pill)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
      letterSpacing: '0.01em', transition: 'transform 0.1s ease, opacity 0.2s', whiteSpace: 'nowrap',
      ...style,
    }}
      onPointerDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >{children}</button>
  );
}

function GhostButton({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      border: '1.5px solid var(--line-strong)', background: 'transparent',
      color: 'var(--ink)', cursor: 'pointer', width: '100%',
      fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16,
      padding: '15px 20px', borderRadius: 'var(--radius-pill)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      ...style,
    }}>{children}</button>
  );
}

Object.assign(window, { Sheet, Toggle, Stepper, Segmented, PrimaryButton, GhostButton });
