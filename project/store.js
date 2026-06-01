/* store.js — data model, persistence, sample data, time helpers. */

(function () {
  const KEY = 'interval-timer:v1';
  const uid = () => Math.random().toString(36).slice(2, 9);

  function stage(label, workSec, restSec, rounds) {
    return { id: uid(), label, workSec, restSec: restSec || 0, rounds: rounds || 1 };
  }

  function sampleData() {
    return {
      timers: [
        {
          id: uid(),
          name: 'Tabata Classic',
          createdAt: Date.now() - 86400000 * 3,
          stages: [
            stage('warmup', 180, 0, 1),
            stage('work', 20, 10, 8),
            stage('cooldown', 120, 0, 1),
          ],
        },
        {
          id: uid(),
          name: '',                       // unnamed → "Timer 2"
          createdAt: Date.now() - 86400000,
          stages: [
            stage('warmup', 120, 0, 1),
            stage('work', 45, 15, 6),
            stage('rest', 60, 0, 1),
            stage('Sprints', 30, 20, 5),
            stage('cooldown', 180, 0, 1),
          ],
        },
      ],
      coachDone: false,
      homeCoachDone: false,
      settings: { keepRunningInBackground: false, sound: true, haptics: true },
      counter: 2,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { const d = sampleData(); save(d); return d; }
      const d = JSON.parse(raw);
      if (!d.settings) d.settings = { keepRunningInBackground: false, sound: true, haptics: true };
      if (typeof d.settings.sound !== 'boolean') d.settings.sound = true;
      if (typeof d.settings.haptics !== 'boolean') d.settings.haptics = true;
      if (typeof d.counter !== 'number') d.counter = d.timers.length;
      if (typeof d.homeCoachDone !== 'boolean') d.homeCoachDone = false;
      return d;
    } catch (e) {
      const d = sampleData(); save(d); return d;
    }
  }

  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  }

  function reset() {
    const d = sampleData(); save(d); return d;
  }

  // display name for a timer given its index in the list
  function timerName(timer, index) {
    return (timer.name && timer.name.trim()) || `Timer ${index + 1}`;
  }

  // total seconds a timer runs
  function totalSeconds(timer) {
    return timer.stages.reduce(
      (sum, s) => sum + s.rounds * (s.workSec + s.restSec), 0
    );
  }

  // flatten a timer into an ordered list of run segments
  function buildSegments(timer) {
    const segs = [];
    timer.stages.forEach((s, si) => {
      const intent = window.labelIntent(s.label);
      for (let r = 0; r < s.rounds; r++) {
        segs.push({
          type: intent === 'rest' ? 'rest' : (intent === 'work' || intent === 'custom' ? 'work' : intent),
          intent,
          label: s.label,
          sec: s.workSec,
          stageIndex: si,
          round: r + 1,
          totalRounds: s.rounds,
          kind: 'main',
        });
        if (s.restSec > 0) {
          segs.push({
            type: 'rest',
            intent: 'rest',
            label: 'Rest',
            sec: s.restSec,
            stageIndex: si,
            round: r + 1,
            totalRounds: s.rounds,
            kind: 'rest',
          });
        }
      }
    });
    return segs;
  }

  // "M:SS" (or "MM:SS")
  function fmtClock(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // compact human duration: "24 min", "1 hr 5 min", "45 sec"
  function fmtDuration(sec) {
    sec = Math.round(sec);
    if (sec < 60) return `${sec} sec`;
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    if (h > 0) return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
    return `${m} min`;
  }

  // pretty label text for display
  function labelText(label) {
    const map = { warmup: 'Warmup', work: 'Work', rest: 'Rest', cooldown: 'Cooldown' };
    const key = (label || '').toLowerCase();
    return map[key] || label || 'Stage';
  }

  window.IT_store = {
    load, save, reset, stage, uid,
    timerName, totalSeconds, buildSegments,
    fmtClock, fmtDuration, labelText,
  };
})();
