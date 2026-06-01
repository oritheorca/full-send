/* editor.jsx — EditorScreen: name field, reorderable stage list with
   swipe-to-delete + drag-to-reorder, stage editor sheet, first-run coachmarks. */

const { useState: useStateEd, useRef: useRefEd, useEffect: useEffectEd } = React;
const S_ed = window.IT_store;

const LABEL_CHOICES = [
  { key: 'warmup', text: 'Warmup' },
  { key: 'work', text: 'Work' },
  { key: 'rest', text: 'Rest' },
  { key: 'cooldown', text: 'Cooldown' },
  { key: 'custom', text: 'Custom' },
];

/* minutes + seconds — typeable numeric inputs */
function MinSec({ value, onChange }) {
  // single combined m:ss field. Digits fill from the right (calculator style):
  // typing 1‑2‑0 reads as 1:20, 4‑5 reads as 0:45.
  const fmt = (v) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
  const handle = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(-4); // up to MMSS
    if (!digits) { onChange(0); return; }
    const n = parseInt(digits, 10);
    let m = Math.floor(n / 100), s = n % 100;
    if (s > 59) s = 59;
    if (m > 99) m = 99;
    onChange(m * 60 + s);
  };
  return (
    <input type="text" inputMode="numeric" pattern="[0-9]*" value={fmt(value)}
      onFocus={(e) => e.target.select()}
      onChange={(e) => handle(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box', textAlign: 'center',
        border: '1.5px solid var(--line-strong)', background: 'var(--surface-2)', color: 'var(--ink)',
        borderRadius: 14, padding: '14px 8px', outline: 'none',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, letterSpacing: '0.01em',
        fontVariantNumeric: 'tabular-nums',
      }} />
  );
}

function StageSheet({ open, onClose, theme, initial, isNew, onSave, onDelete }) {
  const [label, setLabel] = useStateEd('warmup');
  const [custom, setCustom] = useStateEd('');
  const [workSec, setWorkSec] = useStateEd(0);
  const [restSec, setRestSec] = useStateEd(0);
  const [rounds, setRounds] = useStateEd(1);

  useEffectEd(() => {
    if (!open) return;
    if (initial) {
      const intent = window.labelIntent(initial.label);
      setLabel(intent);
      setCustom(intent === 'custom' ? (initial.label || '') : '');
      setWorkSec(initial.workSec);
      setRestSec(initial.restSec || 0);
      setRounds(initial.rounds || 1);
    } else {
      // new stage → reset to defaults every time (don't carry over the last input)
      setLabel('warmup');
      setCustom('');
      setWorkSec(0);
      setRestSec(0);
      setRounds(1);
    }
  }, [open, initial]);

  const intent = label;
  const showRest = intent === 'work' || intent === 'custom';
  const finalLabel = intent === 'custom'
    ? (custom.trim() || 'Custom')
    : LABEL_CHOICES.find(l => l.key === intent).text;

  const save = () => {
    onSave({
      label: intent === 'custom' ? finalLabel
        : (intent === 'warmup' ? 'warmup' : intent === 'cooldown' ? 'cooldown' : intent === 'rest' ? 'rest' : 'work'),
      workSec: Math.max(1, workSec),
      restSec: showRest ? restSec : 0,
      rounds: Math.max(1, rounds),
    });
  };

  const SectionLabel = ({ children, mt = 20 }) => (
    <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-faint)', margin: `${mt}px 0 11px` }}>{children}</div>
  );

  return (
    <Sheet open={open} onClose={onClose} title={isNew ? 'Add Stage' : 'Edit Stage'}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {LABEL_CHOICES.map(l => {
          const lc = window.labelColor(theme, l.key === 'custom' ? '__c' : l.key === 'work' ? 'work' : l.key);
          const active = label === l.key;
          return (
            <button key={l.key} onClick={() => setLabel(l.key)} style={{
              border: active ? '1.5px solid transparent' : `1.5px solid ${lc.color}`,
              cursor: 'pointer', borderRadius: 999, padding: '9px 15px',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14,
              background: active ? lc.color : 'var(--surface-2)',
              color: active ? lc.on : 'var(--ink)',
              transition: 'all 0.15s ease',
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: active ? lc.on : lc.color,
                opacity: active ? 0.85 : 1,
              }} />
              {l.text}
            </button>
          );
        })}
      </div>
      {intent === 'custom' && (
        <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Stage name (e.g. Sprints)" maxLength={20}
          style={{ marginTop: 12, width: '100%', boxSizing: 'border-box', border: '1.5px solid var(--line-strong)', background: 'var(--surface-2)', color: 'var(--ink)', borderRadius: 12, padding: '13px 15px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 16, outline: 'none' }} />
      )}

      <div style={{ height: 22 }} />
      <MinSec value={workSec} onChange={setWorkSec} />

      {showRest && (
        <>
          <SectionLabel mt={36}>Rest after work (Optional)</SectionLabel>
          <MinSec value={restSec} onChange={setRestSec} />
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14, color: 'var(--ink-muted)', maxWidth: 150, lineHeight: 1.35 }}>
          Number of rounds
        </span>
        <Stepper value={rounds} min={1} max={50} step={1} onChange={setRounds} suffix="×" />
      </div>

      <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryButton onClick={save}><window.IconCheck size={20} /> {isNew ? 'Add Stage' : 'Save Stage'}</PrimaryButton>
        {!isNew && <button onClick={onDelete} style={{ border: 'none', background: 'transparent', color: '#FF3B30', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, padding: '10px', cursor: 'pointer' }}>Delete Stage</button>}
      </div>
    </Sheet>
  );
}

/* a single stage row (foreground content) */
function StageRowBody({ stage, theme, dragging, onHandleDown }) {
  const lc = window.labelColor(theme, stage.label);
  const parts = [`${S_ed.fmtClock(stage.workSec)}`];
  if (stage.restSec > 0) parts.push(`rest ${S_ed.fmtClock(stage.restSec)}`);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'var(--surface)', borderRadius: 'var(--radius-card)',
      padding: '15px 12px 15px 16px', border: '1px solid var(--line)',
      boxShadow: dragging ? 'var(--shadow-float)' : 'var(--shadow-card)',
    }}>
      <div style={{ width: 6, alignSelf: 'stretch', minHeight: 40, borderRadius: 999, background: lc.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--dw)', fontSize: 20, color: 'var(--ink)', letterSpacing: 'var(--dt)' }}>{S_ed.labelText(stage.label)}</span>
          {stage.rounds > 1 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: lc.color, color: lc.on, borderRadius: 999, padding: '2px 9px', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 12 }}>
              <window.IconRepeat size={12} /> {stage.rounds}×
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13.5, color: 'var(--ink-muted)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
          {parts.join('  ·  ')}
        </div>
      </div>
      <div data-no-swipe onPointerDown={onHandleDown} style={{
        width: 40, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-faint)', cursor: 'grab', touchAction: 'none', flexShrink: 0,
      }}>
        <window.IconGrip size={22} />
      </div>
    </div>
  );
}

function EditorScreen({ data, theme, editingTimer, onCancel, onSave, onDelete, coachDone, onCoachDone }) {
  const isNew = !editingTimer;
  const [name, setName] = useStateEd(editingTimer ? editingTimer.name || '' : '');
  const [stages, setStages] = useStateEd(editingTimer ? editingTimer.stages.map(s => ({ ...s })) : []);
  const [sheetOpen, setSheetOpen] = useStateEd(false);
  const [editIndex, setEditIndex] = useStateEd(null); // null=new stage
  const [openRowId, setOpenRowId] = useStateEd(null);

  // ── coachmarks ──
  const [swipeSeen, setSwipeSeen] = useStateEd(coachDone);
  const [dragSeen, setDragSeen] = useStateEd(coachDone);
  useEffectEd(() => {
    if (!coachDone && swipeSeen && (dragSeen || stages.length < 2)) {
      if (swipeSeen && dragSeen) onCoachDone();
    }
  }, [swipeSeen, dragSeen]);
  let coachStep = null;
  if (!coachDone) {
    if (!swipeSeen && stages.length >= 1) coachStep = 'swipe';
    else if (!dragSeen && stages.length >= 2) coachStep = 'drag';
  }

  // ── drag reorder state ──
  const [drag, setDrag] = useStateEd(null); // {id, dy, from}
  const listRef = useRefEd(null);
  const dragRef = useRefEd({});
  const STRIDE = useRefEd(0);

  const beginDrag = (e, id, index) => {
    e.preventDefault();
    setOpenRowId(null);
    const rowEl = e.currentTarget.closest('[data-stage-row]');
    const h = rowEl ? rowEl.getBoundingClientRect().height : 78;
    STRIDE.current = h + 12;
    dragRef.current = { id, from: index, y0: (e.touches ? e.touches[0] : e).clientY };
    setDrag({ id, dy: 0, from: index });
    if (coachStep === 'drag') setDragSeen(true);
    document.addEventListener('pointermove', onDragMove);
    document.addEventListener('pointerup', onDragUp);
  };
  const onDragMove = (e) => {
    const dy = e.clientY - dragRef.current.y0;
    setDrag(d => d ? { ...d, dy } : d);
  };
  const onDragUp = () => {
    document.removeEventListener('pointermove', onDragMove);
    document.removeEventListener('pointerup', onDragUp);
    setDrag(d => {
      if (!d) return null;
      const len = stages.length;
      let target = d.from + Math.round(d.dy / (STRIDE.current || 80));
      target = Math.max(0, Math.min(len - 1, target));
      if (target !== d.from) {
        setStages(prev => {
          const arr = prev.slice();
          const [m] = arr.splice(d.from, 1);
          arr.splice(target, 0, m);
          return arr;
        });
      }
      return null;
    });
  };

  // visual offset for each row during a drag
  const rowOffset = (index) => {
    if (!drag) return 0;
    const from = drag.from;
    const stride = STRIDE.current || 80;
    let target = from + Math.round(drag.dy / stride);
    target = Math.max(0, Math.min(stages.length - 1, target));
    if (index === from) return drag.dy;
    if (from < target && index > from && index <= target) return -stride;
    if (from > target && index < from && index >= target) return stride;
    return 0;
  };

  const openNew = () => { setEditIndex(null); setSheetOpen(true); };
  const openEdit = (i) => { if (drag) return; setEditIndex(i); setSheetOpen(true); };
  const saveStage = (s) => {
    setStages(prev => {
      if (editIndex == null) return [...prev, { id: S_ed.uid(), ...s }];
      const arr = prev.slice(); arr[editIndex] = { ...arr[editIndex], ...s }; return arr;
    });
    setSheetOpen(false);
  };
  const deleteStage = (i) => {
    setStages(prev => prev.filter((_, idx) => idx !== i));
    setSheetOpen(false);
  };

  const totalSec = stages.reduce((a, s) => a + s.rounds * (s.workSec + s.restSec), 0);
  const canSave = stages.length > 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '60px 18px 8px', flexShrink: 0 }}>
        <button onClick={onCancel} style={{ border: 'none', background: 'transparent', color: 'var(--ink-muted)', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, cursor: 'pointer', padding: 4 }}>Cancel</button>
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 17, color: 'var(--ink)' }}>{isNew ? 'New Timer' : 'Edit Timer'}</span>
        <button onClick={() => canSave && onSave({ name: name.trim(), stages })} style={{ border: 'none', background: 'transparent', color: canSave ? 'var(--accent)' : 'var(--ink-faint)', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 16, cursor: canSave ? 'pointer' : 'default', padding: 4, filter: theme.id === 'sporty' && canSave ? 'none' : 'none' }}>Save</button>
      </div>

      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 22px 8px' }}>
        {/* name field */}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Timer ${data.timers.length + 1}`} maxLength={28}
          style={{ width: '100%', boxSizing: 'border-box', border: 'none', background: 'transparent', color: 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: theme.displayWeight, fontSize: 34, letterSpacing: theme.displayTracking, outline: 'none', padding: '2px 0 4px' }} />
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13.5, color: 'var(--ink-muted)', marginBottom: 18 }}>
          {stages.length === 0 ? 'Add stages to build your interval' : `${S_ed.fmtDuration(totalSec)} total · ${stages.length} stage${stages.length > 1 ? 's' : ''}`}
        </div>

        {/* stage list */}
        <div style={{ position: 'relative' }}>
          {stages.map((s, i) => {
            const off = rowOffset(i);
            const isDragging = drag && drag.id === s.id;
            return (
              <div key={s.id} data-stage-row style={{
                position: 'relative', marginBottom: 12,
                transform: `translateY(${off}px)`,
                transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(.32,.72,0,1)',
                zIndex: isDragging ? 5 : 1,
              }}>
                <div style={{ transform: isDragging ? 'scale(1.03)' : 'scale(1)', transition: 'transform 0.16s ease' }}>
                  <SwipeRow
                    onTap={() => openEdit(i)}
                    disabled={!!drag}
                    openExternally={openRowId === s.id ? undefined : false}
                    onOpenChange={(o) => { if (o) { setOpenRowId(s.id); if (coachStep === 'swipe') setSwipeSeen(true); } else if (openRowId === s.id) setOpenRowId(null); }}
                    actions={[{ label: 'Delete', color: '#FF3B30', ink: '#fff', icon: <window.IconTrash size={20} />, onClick: () => deleteStage(i) }]}
                  >
                    <StageRowBody stage={s} theme={theme} dragging={isDragging}
                      onHandleDown={(e) => beginDrag(e, s.id, i)} />
                  </SwipeRow>
                </div>

                {/* coachmarks overlay this row */}
                {coachStep === 'swipe' && i === 0 && (
                  <Coach variant="swipe" text="Swipe left to delete" align="right" tone={theme.statusDark ? 'dark' : 'light'}
                    style={{ top: 0, bottom: 0, right: 0, left: 0 }} onDismiss={() => setSwipeSeen(true)} />
                )}
                {coachStep === 'drag' && i === 1 && (
                  <Coach variant="drag" text="Drag to reorder" align="right" tone={theme.statusDark ? 'dark' : 'light'}
                    style={{ top: 0, bottom: 0, right: 0, left: 0 }} onDismiss={() => setDragSeen(true)} />
                )}
              </div>
            );
          })}
        </div>

        {/* add stage */}
        <button onClick={openNew} style={{
          width: '100%', boxSizing: 'border-box', marginTop: 2, cursor: 'pointer',
          border: '2px dashed var(--line-strong)', background: 'transparent',
          color: 'var(--ink-muted)', borderRadius: 'var(--radius-card)', padding: '17px',
          fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <window.IconPlus size={20} /> Add Stage
        </button>

        {!isNew && onDelete && (
          <button onClick={onDelete} style={{
            width: '100%', boxSizing: 'border-box', marginTop: 24, cursor: 'pointer',
            border: 'none', background: 'transparent', color: '#FF3B30',
            borderRadius: 'var(--radius-card)', padding: '15px',
            fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <window.IconTrash size={19} /> Delete Timer
          </button>
        )}
      </div>

      {/* save footer */}
      <div style={{ flexShrink: 0, padding: '8px 22px 30px', background: 'linear-gradient(to top, var(--bg) 70%, transparent)' }}>
        <PrimaryButton disabled={!canSave} onClick={() => canSave && onSave({ name: name.trim(), stages })}>
          {isNew ? 'Create Timer' : 'Save Changes'}
        </PrimaryButton>
      </div>

      <StageSheet open={sheetOpen} onClose={() => setSheetOpen(false)} theme={theme}
        isNew={editIndex == null}
        initial={editIndex == null ? null : stages[editIndex]}
        onSave={saveStage} onDelete={() => deleteStage(editIndex)} />
    </div>
  );
}

window.EditorScreen = EditorScreen;
