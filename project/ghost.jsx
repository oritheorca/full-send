/* ghost.jsx — first-run coachmarks: an animated touch indicator that
   demonstrates a gesture (swipe / drag) with a caption. Built to sit
   inside the real UI, over the real row, and dismiss on first interaction. */

function GhostTouch({ variant = 'swipe', tone = 'dark' }) {
  // tone = contrast of the dot against whatever it sits on
  const ring = tone === 'dark' ? 'rgba(20,20,24,0.30)' : 'rgba(255,255,255,0.55)';
  const dot  = tone === 'dark' ? 'rgba(20,20,24,0.70)' : 'rgba(255,255,255,0.95)';
  const anim = variant === 'drag' ? 'itGhostDrag' : 'itGhostSwipe';
  return (
    <div style={{
      width: 50, height: 50, position: 'relative',
      animation: `${anim} 2.6s cubic-bezier(.5,0,.2,1) infinite`,
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: `2px solid ${ring}`,
        animation: 'itGhostPulse 2.6s ease-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 20, height: 20, marginLeft: -10, marginTop: -10,
        borderRadius: '50%', background: dot,
        boxShadow: `0 2px 8px ${tone === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.35)'}`,
      }} />
    </div>
  );
}

/* Coach — full-row overlay. Positioned absolutely by parent via `style`.
   variant: 'swipe' | 'drag'. tone matches the surface beneath. */
function Coach({ variant, text, tone = 'dark', style, onDismiss, align = 'center' }) {
  // The gesture target (swipe actions + the drag grip handle) lives at the row's
  // right edge, so the animated touch indicator always trails the caption on the right.
  return (
    <div
      onPointerDown={onDismiss}
      style={{
        position: 'absolute', zIndex: 40, pointerEvents: 'auto',
        display: 'flex', alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'center',
        gap: 12, padding: variant === 'drag' ? '0 8px 0 18px' : '0 18px', boxSizing: 'border-box',
        ...style,
      }}
    >
      <div style={{
        background: tone === 'dark' ? 'rgba(20,20,24,0.92)' : 'rgba(255,255,255,0.96)',
        color: tone === 'dark' ? '#fff' : '#16150F',
        fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14,
        letterSpacing: '0.01em', padding: '9px 15px', borderRadius: 999,
        boxShadow: '0 8px 24px rgba(0,0,0,0.28)', whiteSpace: 'nowrap',
        animation: 'itCoachIn 0.4s ease both',
      }}>
        {text}
      </div>
      <GhostTouch variant={variant} tone={tone} />
    </div>
  );
}

Object.assign(window, { GhostTouch, Coach });
