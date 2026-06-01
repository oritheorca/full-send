/* running.jsx — RunningScreen: ready plan → live ring countdown with
   beeps, haptics, background-pause, segment controls, completion. */

const { useRef: useRefRun, useReducer: useReducerRun, useEffect: useEffectRun, useState: useStateRun } = React;
const S_run = window.IT_store;

function useAudio() {
  const ref = useRefRun(null);
  const ensure = () => {
    if (!ref.current) {
      try { ref.current = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (ref.current && ref.current.state === 'suspended') ref.current.resume();
    return ref.current;
  };
  const beep = (freq = 880, dur = 0.12, vol = 0.18) => {
    const ctx = ref.current; if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.02);
  };
  return { ensure, beep };
}

function CtrlButton({ onClick, children, size = 60, fill, ink, border }) {
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%', cursor: 'pointer',
      background: fill, color: ink, border: border || 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform 0.1s ease',
    }}
      onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
      onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      onPointerLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >{children}</button>
  );
}

function RunningScreen({ timer, theme, name, sound, haptics, keepRunningInBackground, autoStart, onExit }) {
  const segs = React.useMemo(() => S_run.buildSegments(timer), [timer]);
  const totalSec = React.useMemo(() => segs.reduce((a, s) => a + s.sec, 0), [segs]);
  const beforeSec = React.useMemo(() => {
    const arr = []; let acc = 0;
    segs.forEach(s => { arr.push(acc); acc += s.sec; });
    return arr;
  }, [segs]);

  const audio = useAudio();
  const [, force] = useReducerRun(x => x + 1, 0);
  const st = useRefRun({ i: 0, remMs: segs[0].sec * 1000, running: false, done: false, ready: !autoStart, lastSec: segs[0].sec });
  const raf = useRefRun(0);
  const lastTs = useRefRun(0);
  const [pulse, setPulse] = useStateRun(0);
  const [bgPaused, setBgPaused] = useStateRun(false);
  const bgPausedRef = useRefRun(false);
  const ringRef = useRefRun(null);
  const ringApplied = useRefRun('');

  const buzz = (pattern) => { if (haptics && navigator.vibrate) navigator.vibrate(pattern); };

  const stop = () => { cancelAnimationFrame(raf.current); raf.current = 0; };
  const startLoop = () => {
    stop(); lastTs.current = performance.now();
    const loop = (ts) => {
      const s = st.current;
      const dt = ts - lastTs.current; lastTs.current = ts;
      s.remMs -= dt;
      const secLeft = Math.ceil(s.remMs / 1000);
      if (secLeft !== s.lastSec) {
        if (secLeft <= 3 && secLeft >= 1 && sound) audio.beep(880, 0.1, 0.16);
        s.lastSec = secLeft;
      }
      if (s.remMs <= 0) {
        const more = advance();      // roll into the next segment (or finish)
        if (!more) return;            // run complete → stop the loop
      }
      force();
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };

  // move to the next segment; returns false when the whole timer is finished.
  const advance = () => {
    const s = st.current;
    if (s.i >= segs.length - 1) {
      stop(); s.done = true; s.running = false; s.remMs = 0;
      if (sound) { audio.beep(660, 0.14, 0.18); setTimeout(() => audio.beep(880, 0.14, 0.18), 150); setTimeout(() => audio.beep(1175, 0.22, 0.2), 320); }
      buzz([90, 60, 90, 60, 160]);
      force(); return false;
    }
    s.i += 1; s.remMs = segs[s.i].sec * 1000; s.lastSec = segs[s.i].sec;
    if (sound) audio.beep(1100, 0.16, 0.2);
    buzz(60); setPulse(p => p + 1);
    lastTs.current = performance.now();
    force(); return true;
  };

  const start = () => { audio.ensure(); const s = st.current; s.ready = false; s.running = true; if (sound) audio.beep(1100, 0.16, 0.2); setPulse(p => p + 1); startLoop(); force(); };
  const pause = () => { const s = st.current; s.running = false; stop(); force(); };
  const resume = () => { audio.ensure(); const s = st.current; s.running = true; startLoop(); force(); };
  const toggle = () => (st.current.running ? pause() : resume());
  const next = () => { const s = st.current; if (s.i < segs.length - 1) { s.i += 1; s.remMs = segs[s.i].sec * 1000; s.lastSec = segs[s.i].sec; lastTs.current = performance.now(); setPulse(p => p + 1); force(); } else advance(); };
  const prev = () => { const s = st.current; if (s.remMs < segs[s.i].sec * 1000 - 1200 || s.i === 0) { s.remMs = segs[s.i].sec * 1000; } else { s.i -= 1; s.remMs = segs[s.i].sec * 1000; } s.lastSec = Math.ceil(s.remMs / 1000); lastTs.current = performance.now(); setPulse(p => p + 1); force(); };
  const restart = () => { stop(); const s = st.current; s.i = 0; s.remMs = segs[0].sec * 1000; s.lastSec = segs[0].sec; s.done = false; setBgPaused(false); bgPausedRef.current = false; start(); };

  useEffectRun(() => () => stop(), []);

  // auto-start immediately when launched from the timer's play button
  useEffectRun(() => { if (autoStart) start(); /* eslint-disable-next-line */ }, []);

  // background pause / auto-resume on return
  useEffectRun(() => {
    const onVis = () => {
      if (document.hidden) {
        if (!keepRunningInBackground && st.current.running) {
          pause(); setBgPaused(true); bgPausedRef.current = true;
        }
      } else if (bgPausedRef.current) {
        bgPausedRef.current = false; setBgPaused(false);
        if (!st.current.done) resume();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [keepRunningInBackground]);

  // smoothly animate the countdown ring via a single CSS transition per phase,
  // so the arc depletes fluidly instead of stepping each frame.
  const applyRing = () => {
    const el = ringRef.current; if (!el) return;
    const s = st.current;
    const seg = segs[s.i]; if (!seg) return;
    const C = 2 * Math.PI * 120;
    const frac = Math.max(0, Math.min(1, s.remMs / (seg.sec * 1000)));
    const offNow = C * (1 - frac);
    const key = pulse + '|' + (s.running ? 'run' : 'hold');
    if (key === ringApplied.current) return;   // mid-segment frames: leave the CSS animation running
    ringApplied.current = key;
    if (s.running) {
      el.style.transition = 'none';
      el.style.strokeDashoffset = offNow + 'px';
      void el.getBoundingClientRect();          // commit start position
      el.style.transition = 'stroke-dashoffset ' + Math.max(0, s.remMs) + 'ms linear';
      el.style.strokeDashoffset = C + 'px';      // deplete to empty over the remaining time
    } else {
      el.style.transition = 'stroke-dashoffset 0.25s ease';
      el.style.strokeDashoffset = offNow + 'px'; // freeze at current position
    }
  };
  useEffectRun(() => { applyRing(); });

  const s = st.current;

  // ── READY ──
  if (s.ready) {
    return (
      <div key="run-ready" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '60px 18px 6px', flexShrink: 0 }}>
          <button onClick={onExit} style={{ border: 'none', background: 'var(--surface)', color: 'var(--ink)', width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--line)' }}><window.IconChevL size={22} /></button>
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 16, color: 'var(--ink-muted)' }}>Ready</span>
          <div style={{ width: 42 }} />
        </div>
        <div style={{ padding: '8px 24px 0', flexShrink: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: theme.displayWeight, fontSize: 38, color: 'var(--ink)', margin: '6px 0 4px', letterSpacing: theme.displayTracking, lineHeight: 1.02 }}>{name}</h1>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 15, color: 'var(--ink-muted)' }}>{S_run.fmtDuration(totalSec)} · {segs.length} segments</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px 8px' }}>
          {timer.stages.map((stg, i) => {
            const lc = window.labelColor(theme, stg.label);
            return (
              <div key={stg.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 14, height: 14, borderRadius: 5, background: lc.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: theme.displayWeight, fontSize: 19, color: 'var(--ink)', letterSpacing: theme.displayTracking }}>{S_run.labelText(stg.label)}</span>
                {stg.rounds > 1 && <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 13, color: lc.color }}>{stg.rounds}×</span>}
                <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {S_run.fmtClock(stg.workSec)}{stg.restSec > 0 ? ` / ${S_run.fmtClock(stg.restSec)}` : ''}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ flexShrink: 0, padding: '10px 24px 32px' }}>
          <PrimaryButton onClick={start}><window.IconPlay size={20} /> Start</PrimaryButton>
        </div>
      </div>
    );
  }

  // ── COMPLETE ──
  if (s.done) {
    return (
      <div key="run-done" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: 'var(--accent-ink)', padding: 30, textAlign: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
          <window.IconCheck size={52} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: theme.displayWeight, fontSize: 46, margin: '0 0 6px', letterSpacing: theme.displayTracking }}>Complete</h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 17, opacity: 0.85, margin: '0 0 36px' }}>{name} · {S_run.fmtDuration(totalSec)}</p>
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 320 }}>
          <button onClick={restart} style={{ flex: 1, border: '1.5px solid currentColor', background: 'transparent', color: 'inherit', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 16, padding: '16px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><window.IconReplay size={18} /> Again</button>
          <button onClick={onExit} style={{ flex: 1, border: 'none', background: 'var(--accent-ink)', color: 'var(--accent)', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 16, padding: '16px', borderRadius: 999, cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    );
  }

  // ── RUNNING ──
  const seg = segs[s.i];
  const segTotal = seg.sec * 1000;
  const frac = Math.max(0, Math.min(1, s.remMs / segTotal));
  const sc = window.segColor(theme, seg.type, seg.label);
  const bg = sc.color, on = sc.on;
  const onDim = (a) => (on === '#FFFFFF' || on === '#fff') ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
  const R = 120, C = 2 * Math.PI * R;
  const ringW = theme.id === 'minimal' ? 9 : theme.id === 'sporty' ? 15 : 18;
  const overall = (beforeSec[s.i] + (seg.sec - s.remMs / 1000)) / totalSec;
  const nextSeg = segs[s.i + 1];
  const secCeil = Math.ceil(s.remMs / 1000);

  return (
    <div key="run-live" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: bg, color: on, transition: 'background 0.4s ease' }}>
      {/* overall progress */}
      <div style={{ height: 4, background: onDim(0.18), marginTop: 54, flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${overall * 100}%`, background: on, transition: 'width 0.25s linear' }} />
      </div>

      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 0', flexShrink: 0 }}>
        <button onClick={onExit} style={{ border: 'none', background: onDim(0.16), color: on, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><window.IconClose size={20} /></button>
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 14, opacity: 0.85, letterSpacing: '0.02em' }}>{name}</span>
        <div style={{ width: 40, height: 40 }} aria-hidden="true"></div>
      </div>

      {/* ring + number */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div key={pulse} style={{ position: 'relative', width: 280, height: 280, animation: 'itRingPulse 0.45s ease' }}>
          <svg width="280" height="280" viewBox="0 0 280 280" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="140" cy="140" r={R} fill="none" stroke={onDim(0.2)} strokeWidth={ringW} />
            <circle ref={ringRef} cx="140" cy="140" r={R} fill="none" stroke={on} strokeWidth={ringW} strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={0} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 16, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.9, marginBottom: 2 }}>{S_run.labelText(seg.label)}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: theme.displayWeight, fontSize: 88, lineHeight: 1, letterSpacing: theme.displayTracking, fontVariantNumeric: 'tabular-nums' }}>{S_run.fmtClock(secCeil)}</span>
            {seg.totalRounds > 1 && (
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 14, letterSpacing: '0.06em', opacity: 0.85, marginTop: 6, textTransform: 'uppercase' }}>Round {seg.round} / {seg.totalRounds}</span>
            )}
          </div>
        </div>

        {/* up next */}
        <div style={{ marginTop: 26, minHeight: 24, fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, opacity: 0.82 }}>
          {nextSeg ? `Next: ${S_run.labelText(nextSeg.label)} ${S_run.fmtClock(nextSeg.sec)}` : 'Last segment'}
        </div>
        {bgPaused && !s.running && (
          <div style={{ marginTop: 8, fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, background: onDim(0.16), padding: '5px 12px', borderRadius: 999 }}>Paused — you left the app</div>
        )}
      </div>

      {/* controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '10px 24px 40px', flexShrink: 0 }}>
        <CtrlButton onClick={prev} size={58} fill={onDim(0.16)} ink={on}><window.IconPrev size={24} /></CtrlButton>
        <CtrlButton onClick={toggle} size={84} fill={on} ink={bg}>
          {s.running ? <window.IconPause size={34} /> : <window.IconPlay size={34} />}
        </CtrlButton>
        <CtrlButton onClick={next} size={58} fill={onDim(0.16)} ink={on}><window.IconNext size={24} /></CtrlButton>
      </div>
    </div>
  );
}

window.RunningScreen = RunningScreen;
