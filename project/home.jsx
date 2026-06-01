/* home.jsx — HomeScreen: brand header, saved-timer cards with stage strips,
   new-timer button, settings sheet. */

const { useState: useStateHm, useRef: useRefHm, useEffect: useEffectHm } = React;
const S_hm = window.IT_store;

/* proportional colored bar showing the shape of a timer's stages */
function StageStrip({ timer, theme, height = 11 }) {
  const segs = timer.stages.map(s => ({
    t: Math.max(1, s.rounds * (s.workSec + s.restSec)),
    c: window.labelColor(theme, s.label).color,
  }));
  const total = segs.reduce((a, s) => a + s.t, 0) || 1;
  return (
    <div style={{ display: 'flex', gap: 3, height, width: '100%' }}>
      {segs.map((s, i) => (
        <div key={i} style={{
          flexGrow: s.t, flexBasis: 6, minWidth: 6, background: s.c,
          borderRadius: 4, opacity: 0.92,
        }} />
      ))}
    </div>
  );
}

function MetaPair({ value, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, whiteSpace: 'nowrap', flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{label}</span>
    </div>
  );
}

function TimerCard({ timer, index, theme, onTap, onPlay, onDelete, disabled, dragging }) {
  const name = S_hm.timerName(timer, index);
  const total = S_hm.totalSeconds(timer);
  const rounds = timer.stages.reduce((a, s) => a + s.rounds, 0);
  return (
    <SwipeRow
      onTap={onTap}
      disabled={disabled}
      shadow={dragging ? 'var(--shadow-float)' : 'var(--shadow-card)'}
      actions={[
        { label: 'Delete', color: '#FF3B30', ink: '#fff', icon: <window.IconTrash size={20} />, onClick: onDelete },
      ]}
    >
      <div style={{
        background: 'var(--surface)',
        padding: '18px 20px',
        border: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-display)', fontWeight: 'var(--dw)', fontSize: 25, color: 'var(--ink)', letterSpacing: 'var(--dt)', lineHeight: 1.08, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <button
            data-no-swipe
            aria-label={`Start ${name}`}
            onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.style.transform = 'scale(0.9)'; }}
            onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={(e) => { e.stopPropagation(); onPlay && onPlay(); }}
            style={{
              width: 64, height: 64, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'var(--accent)', color: 'var(--accent-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: 'var(--shadow-card)', transition: 'transform 0.1s ease',
            }}>
            <window.IconPlay size={30} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 22, margin: '15px 0 16px' }}>
          <MetaPair value={S_hm.fmtDuration(total)} label="Total" />
          <MetaPair value={timer.stages.length} label="Stages" />
          <MetaPair value={rounds} label="Rounds" />
        </div>
        <StageStrip timer={timer} theme={theme} />
      </div>
    </SwipeRow>
  );
}

function SettingsSheet({ open, onClose, settings, onChange, sound, haptics, onSound, onHaptics }) {
  const Row = ({ title, sub, control }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{title}</div>
        {sub && <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 13, color: 'var(--ink-muted)', marginTop: 3, lineHeight: 1.35 }}>{sub}</div>}
      </div>
      {control}
    </div>
  );
  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <Row title="Countdown beeps" sub="Audio cues on the last 3 seconds and at every stage change." control={<Toggle on={sound} onChange={onSound} />} />
      <Row title="Haptic feedback" sub="Buzz on stage changes and when a timer completes." control={<Toggle on={haptics} onChange={onHaptics} />} />
      <Row title="Pause when you leave the app" sub="Timers only count down when the app is active." control={<Toggle on={!settings.keepRunningInBackground} onChange={(v) => onChange('keepRunningInBackground', !v)} />} />
      <div style={{ height: 8 }} />
    </Sheet>
  );
}

function HomeScreen({ data, theme, onOpenTimer, onEditTimer, onNewTimer, onDeleteTimer, onReorderTimers, homeCoachDone, onHomeCoachDone, settings, onChangeSetting, sound, haptics, onSound, onHaptics }) {
  const [showSettings, setShowSettings] = useStateHm(false);
  const timers = data.timers;

  // ── long-press drag-to-reorder ──
  const [drag, setDrag] = useStateHm(null); // {id, dy, from}
  const dragRef = useRefHm({});
  const STRIDE = useRefHm(0);
  const lpRef = useRefHm(null);     // long-press timeout
  const pressRef = useRefHm({});    // {x0, y0, id, index, started}
  const justDragged = useRefHm(false);

  // ── first-run swipe coachmark ──
  const [coachSeen, setCoachSeen] = useStateHm(homeCoachDone);
  const showCoach = !homeCoachDone && !coachSeen && timers.length >= 1;
  const dismissCoach = () => { setCoachSeen(true); onHomeCoachDone && onHomeCoachDone(); };

  const clearLP = () => { if (lpRef.current) { clearTimeout(lpRef.current); lpRef.current = null; } };
  const removePressListeners = () => {
    document.removeEventListener('pointermove', onPressMove);
    document.removeEventListener('pointerup', onPressUp);
    document.removeEventListener('pointercancel', onPressUp);
  };
  const onPressMove = (e) => {
    if (pressRef.current.started) return;
    const dx = e.clientX - pressRef.current.x0;
    const dy = e.clientY - pressRef.current.y0;
    if (Math.abs(dx) > 9 || Math.abs(dy) > 9) { clearLP(); removePressListeners(); }
  };
  const onPressUp = () => { clearLP(); removePressListeners(); };

  const startDrag = (id, index) => {
    removePressListeners();
    pressRef.current.started = true;
    justDragged.current = true;
    if (haptics && navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
    const el = document.querySelector(`[data-home-row="${id}"]`);
    const h = el ? el.getBoundingClientRect().height : 150;
    STRIDE.current = h + 14;
    dragRef.current = { id, from: index, y0: pressRef.current.y0 };
    setDrag({ id, dy: 0, from: index });
    document.addEventListener('pointermove', onDragMove);
    document.addEventListener('pointerup', onDragUp);
    document.addEventListener('pointercancel', onDragUp);
    if (showCoach) dismissCoach();
  };
  const onDragMove = (e) => {
    const dy = e.clientY - dragRef.current.y0;
    setDrag(d => d ? { ...d, dy } : d);
  };
  const onDragUp = () => {
    document.removeEventListener('pointermove', onDragMove);
    document.removeEventListener('pointerup', onDragUp);
    document.removeEventListener('pointercancel', onDragUp);
    setDrag(d => {
      if (!d) return null;
      const len = timers.length;
      let target = d.from + Math.round(d.dy / (STRIDE.current || 150));
      target = Math.max(0, Math.min(len - 1, target));
      if (target !== d.from) onReorderTimers(d.from, target);
      return null;
    });
    setTimeout(() => { justDragged.current = false; }, 60);
  };

  const onCardDown = (e, id, index) => {
    if (drag) return;
    if (e.target.closest && e.target.closest('[data-no-swipe]')) return;
    const p = e.touches ? e.touches[0] : e;
    pressRef.current = { x0: p.clientX, y0: p.clientY, id, index, started: false };
    clearLP();
    lpRef.current = setTimeout(() => startDrag(id, index), 420);
    document.addEventListener('pointermove', onPressMove);
    document.addEventListener('pointerup', onPressUp);
    document.addEventListener('pointercancel', onPressUp);
  };

  useEffectHm(() => () => { clearLP(); removePressListeners(); }, []);

  // visual offset for each card during a drag
  const rowOffset = (index) => {
    if (!drag) return 0;
    const from = drag.from;
    const stride = STRIDE.current || 150;
    let target = from + Math.round(drag.dy / stride);
    target = Math.max(0, Math.min(timers.length - 1, target));
    if (index === from) return drag.dy;
    if (from < target && index > from && index <= target) return -stride;
    if (from > target && index < from && index >= target) return stride;
    return 0;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* header */}
      <div style={{ padding: '64px 22px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <window.IconBolt size={18} />
            </div>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 15, letterSpacing: '0.02em', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>Full Send</span>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', background: 'var(--surface)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-card)', border: '1px solid var(--line)' }}>
            <window.IconGear size={21} />
          </button>
        </div>
      </div>

      {/* list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 8px' }}>
        {timers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-muted)', fontFamily: 'var(--font-ui)' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', marginBottom: 6 }}>No timers yet</div>
            <div style={{ fontSize: 14 }}>Tap “New Timer” to build your first interval.</div>
          </div>
        )}
        {timers.map((t, i) => {
          const off = rowOffset(i);
          const isDragging = drag && drag.id === t.id;
          return (
            <div key={t.id} data-home-row={t.id} onPointerDown={(e) => onCardDown(e, t.id, i)} style={{
              position: 'relative', marginBottom: 14,
              transform: `translateY(${off}px)`,
              transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(.32,.72,0,1)',
              zIndex: isDragging ? 5 : 1, touchAction: 'pan-y',
            }}>
              <div style={{ transform: isDragging ? 'scale(1.03)' : 'scale(1)', transition: 'transform 0.16s ease' }}>
                <TimerCard timer={t} index={i} theme={theme}
                  disabled={!!drag} dragging={isDragging}
                  onTap={() => { if (justDragged.current) return; onEditTimer(t.id); }}
                  onPlay={() => { if (justDragged.current) return; onOpenTimer(t.id); }}
                  onDelete={() => onDeleteTimer(t.id)} />
              </div>
              {showCoach && i === 0 && (
                <Coach variant="swipe" text="Tap to edit · swipe to delete" align="right" tone={theme.statusDark ? 'dark' : 'light'}
                  style={{ top: 0, bottom: 14, right: 0, left: 0 }} onDismiss={dismissCoach} />
              )}
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div style={{ flexShrink: 0, padding: '8px 22px 30px', background: 'linear-gradient(to top, var(--bg) 70%, transparent)' }}>
        <PrimaryButton onClick={onNewTimer}><window.IconPlus size={20} /> New Timer</PrimaryButton>
      </div>

      <SettingsSheet open={showSettings} onClose={() => setShowSettings(false)}
        settings={settings} onChange={onChangeSetting}
        sound={sound} haptics={haptics} onSound={onSound} onHaptics={onHaptics} />
    </div>
  );
}

Object.assign(window, { HomeScreen, StageStrip });
