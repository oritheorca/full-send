/* swipe.jsx — SwipeRow: swipe left to reveal trailing action buttons.
   Used for timer cards (Edit/Delete) and stage rows (Delete). */

const { useState: useStateSw, useRef: useRefSw } = React;

function SwipeRow({
  children, actions = [], radius = 'var(--radius-card)',
  onTap, openExternally, onOpenChange, disabled = false, marginBottom = 0, shadow = 'none',
}) {
  const ACTION_W = 76;
  const total = actions.length * ACTION_W;
  const [x, setX] = useStateSw(0);
  const [dragging, setDragging] = useStateSw(false);
  const st = useRefSw({ x0: 0, y0: 0, startX: 0, axis: null, moved: false, id: null });

  const open = () => { setX(-total); onOpenChange && onOpenChange(true); };
  const close = () => { setX(0); onOpenChange && onOpenChange(false); };

  const onDown = (e) => {
    if (disabled || total === 0) return;
    if (e.target.closest && e.target.closest('[data-no-swipe]')) return;
    const p = e.touches ? e.touches[0] : e;
    st.current = { x0: p.clientX, y0: p.clientY, startX: x, axis: null, moved: false, id: e.pointerId };
  };
  const onMove = (e) => {
    if (disabled || total === 0 || st.current.id == null) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - st.current.x0;
    const dy = p.clientY - st.current.y0;
    if (!st.current.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      st.current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (st.current.axis === 'x') {
        setDragging(true);
        e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
      }
    }
    if (st.current.axis !== 'x') return;
    st.current.moved = true;
    let nx = st.current.startX + dx;
    nx = Math.max(-total - 24, Math.min(0, nx));
    setX(nx);
  };
  const onUp = (e) => {
    if (st.current.id == null) return;
    setDragging(false);
    const wasX = st.current.axis === 'x';
    const moved = st.current.moved;
    st.current.id = null; st.current.axis = null;
    if (!wasX) return;
    if (!moved) return;
    if (x < -total / 2) open(); else close();
  };
  const onClick = () => {
    if (st.current.moved) { st.current.moved = false; return; }
    if (x !== 0) { close(); return; }
    onTap && onTap();
  };

  // controlled close (e.g. another row opened)
  React.useEffect(() => {
    if (openExternally === false && x !== 0) setX(0);
  }, [openExternally]);

  return (
    // outer layer carries the shadow + radius but does NOT clip, so a lifted
    // card's drop shadow is visible during drag-to-reorder
    <div style={{ position: 'relative', borderRadius: radius, marginBottom, boxShadow: shadow }}>
      {/* clip layer: rounds the corners and hides the revealed actions */}
      <div style={{ position: 'relative', borderRadius: radius, overflow: 'hidden' }}>
        {/* action layer — spans the full track and is tinted with the action
            adjacent to the card, so an over-drag past the open position reads
            as the button stretching rather than a gap to the page background */}
        {total > 0 && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'flex-end', background: actions[0].color }}>
            {actions.map((a, i) => (
              <button key={i} onClick={() => { a.onClick && a.onClick(); close(); }} style={{
                width: ACTION_W, border: 'none', cursor: 'pointer',
                background: a.color, color: a.ink || '#fff',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5,
              }}>
                {a.icon}{a.label}
              </button>
            ))}
          </div>
        )}
        {/* foreground */}
        <div
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
          onPointerCancel={onUp} onClick={onClick}
          style={{
            position: 'relative', transform: `translateX(${x}px)`,
            transition: dragging ? 'none' : 'transform 0.32s cubic-bezier(.32,.72,0,1)',
            touchAction: 'pan-y', cursor: onTap ? 'pointer' : 'default',
          }}
        >{children}</div>
      </div>
    </div>
  );
}

window.SwipeRow = SwipeRow;
