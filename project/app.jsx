/* app.jsx — root: navigation stack with push/pop transitions, theme
   application via CSS vars, persistence, Tweaks panel. */

const { useState: useStateApp, useRef: useRefApp, useEffect: useEffectApp } = React;
const S = window.IT_store;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "flavor": "sporty"
}/*EDITMODE-END*/;

function Frame({ children, kind, animate }) {
  const map = {
    'enter-push': 'itEnterRight 0.36s cubic-bezier(.32,.72,0,1) both',
    'exit-push':  'itExitLeft 0.36s cubic-bezier(.32,.72,0,1) both',
    'enter-pop':  'itEnterLeft 0.36s cubic-bezier(.32,.72,0,1) both',
    'exit-pop':   'itExitRight 0.36s cubic-bezier(.32,.72,0,1) both',
  };
  const z = (kind === 'enter-push' || kind === 'exit-pop') ? 2 : 1;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: z, animation: animate ? map[kind] : 'none' }}>{children}</div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [data, setData] = useStateApp(() => S.load());
  const [view, setView] = useStateApp({ name: 'home', _k: 'home0' });
  const [prev, setPrev] = useStateApp(null);
  const dirRef = useRefApp('push');
  const navLock = useRefApp(false);

  const theme = window.IT_THEMES[t.flavor] || window.IT_THEMES.sporty;

  const persist = (next) => { setData(next); S.save(next); };

  const navTo = (next, dir) => {
    if (navLock.current) return;
    navLock.current = true;
    dirRef.current = dir;
    setPrev({ ...view });
    setView({ ...next, _k: next.name + Math.random().toString(36).slice(2, 6) });
    setTimeout(() => { setPrev(null); navLock.current = false; }, 380);
  };

  // ── data mutations ──
  const deleteTimer = (id) => persist({ ...data, timers: data.timers.filter(x => x.id !== id) });
  const saveTimer = ({ name, stages }, editId) => {
    let next;
    if (editId) {
      next = { ...data, timers: data.timers.map(x => x.id === editId ? { ...x, name, stages } : x) };
    } else {
      const timer = { id: S.uid(), name, stages, createdAt: Date.now() };
      next = { ...data, timers: [...data.timers, timer], counter: (data.counter || 0) + 1 };
    }
    persist(next);
    navTo({ name: 'home' }, 'pop');
  };
  const markCoachDone = () => persist({ ...data, coachDone: true });
  const markHomeCoachDone = () => persist({ ...data, homeCoachDone: true });
  const reorderTimers = (from, to) => {
    if (from === to) return;
    const arr = data.timers.slice();
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    persist({ ...data, timers: arr });
  };
  const changeSetting = (key, val) => persist({ ...data, settings: { ...data.settings, [key]: val } });

  const settings = data.settings;

  const renderScreen = (v) => {
    if (v.name === 'home') {
      return <window.HomeScreen
        data={data} theme={theme}
        settings={settings} onChangeSetting={changeSetting}
        sound={settings.sound} haptics={settings.haptics}
        onSound={(b) => changeSetting('sound', b)} onHaptics={(b) => changeSetting('haptics', b)}
        onOpenTimer={(id) => navTo({ name: 'run', id, autoStart: true }, 'push')}
        onEditTimer={(id) => navTo({ name: 'edit', id }, 'push')}
        onNewTimer={() => navTo({ name: 'edit', id: null }, 'push')}
        onDeleteTimer={deleteTimer}
        onReorderTimers={reorderTimers}
        homeCoachDone={data.homeCoachDone} onHomeCoachDone={markHomeCoachDone}
      />;
    }
    if (v.name === 'edit') {
      const editingTimer = v.id ? data.timers.find(x => x.id === v.id) : null;
      return <window.EditorScreen
        data={data} theme={theme} editingTimer={editingTimer}
        coachDone={data.coachDone} onCoachDone={markCoachDone}
        onCancel={() => navTo({ name: 'home' }, 'pop')}
        onSave={(payload) => saveTimer(payload, v.id)}
        onDelete={v.id ? () => { deleteTimer(v.id); navTo({ name: 'home' }, 'pop'); } : null}
      />;
    }
    if (v.name === 'run') {
      const timer = data.timers.find(x => x.id === v.id);
      if (!timer) return null;
      const index = data.timers.findIndex(x => x.id === v.id);
      return <window.RunningScreen
        timer={timer} theme={theme} name={S.timerName(timer, index)}
        sound={settings.sound} haptics={settings.haptics}
        autoStart={!!v.autoStart}
        keepRunningInBackground={settings.keepRunningInBackground}
        onExit={() => navTo({ name: 'home' }, 'pop')}
      />;
    }
    return null;
  };

  const rootVars = {
    ...window.styleVars(theme),
    '--font-ui': theme.fontUI, '--font-display': theme.fontDisplay,
    '--dw': theme.displayWeight, '--dt': theme.displayTracking,
  };

  const dir = dirRef.current;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%', padding: 20, boxSizing: 'border-box', background: '#15151a' }}>
      <window.IOSDevice dark={!theme.statusDark}>
        <div style={{ ...rootVars, position: 'relative', height: '100%', width: '100%', background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-ui)', overflow: 'hidden' }}>
          {prev && <Frame kind={dir === 'push' ? 'exit-push' : 'exit-pop'} animate={true} key={prev._k}>{renderScreen(prev)}</Frame>}
          <Frame kind={dir === 'push' ? 'enter-push' : 'enter-pop'} animate={!!prev} key={view._k}>{renderScreen(view)}</Frame>
        </div>
      </window.IOSDevice>

      <TweaksPanel>
        <TweakSection label="Flavor" />
        <TweakRadio label="Visual style" value={t.flavor}
          options={[{ value: 'sporty', label: 'Pace' }, { value: 'poppy', label: 'Bounce' }, { value: 'minimal', label: 'Mono' }]}
          onChange={(v) => setTweak('flavor', v)} />
        <div style={{ fontSize: 12, opacity: 0.6, padding: '2px 2px 6px', lineHeight: 1.4 }}>{theme.tagline}</div>

        <TweakSection label="Feedback" />
        <TweakToggle label="Countdown beeps" value={settings.sound} onChange={(v) => changeSetting('sound', v)} />
        <TweakToggle label="Haptics" value={settings.haptics} onChange={(v) => changeSetting('haptics', v)} />
        <TweakToggle label="Pause when you leave the app" value={!settings.keepRunningInBackground} onChange={(v) => changeSetting('keepRunningInBackground', !v)} />

        <TweakSection label="Demo" />
        <TweakButton label="Replay first-time cues" onClick={() => persist({ ...data, coachDone: false, homeCoachDone: false })} />
        <TweakButton label="Reset sample data" onClick={() => { const d = S.reset(); setData(d); navTo({ name: 'home' }, 'pop'); }} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
