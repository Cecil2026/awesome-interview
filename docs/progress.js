// Unified progress store for the whole web app — solved set, day streak, and SM-2
// spaced-repetition reviews in ONE localStorage key, with a JSON export/import bridge.
// Replaces the old split keys (awesome-interview-solved / -web-streak), which it
// migrates on first load. This is the browser counterpart to the CLI's
// ~/.awesome-interview-streak.json; export/import is the bridge between them.
(function () {
  const KEY = 'awesome-interview-progress';
  const OLD_SOLVED = 'awesome-interview-solved';
  const OLD_STREAK = 'awesome-interview-web-streak';

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }
  function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function blank() {
    return { version: 1, solved: [], streak: { count: 0, last: null, longest: 0 }, reviews: {} };
  }

  function migrate() {
    const s = blank();
    try {
      const os = JSON.parse(localStorage.getItem(OLD_SOLVED) || '[]');
      if (Array.isArray(os)) s.solved = os;
    } catch (e) {}
    try {
      const ost = JSON.parse(localStorage.getItem(OLD_STREAK) || '{}');
      if (ost && ost.last) {
        s.streak.count = ost.count || 0;
        s.streak.last = ost.last;
        s.streak.longest = ost.count || 0;
      }
    } catch (e) {}
    write(s);
    return s;
  }

  function read() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!s || typeof s !== 'object') s = migrate();
    if (!Array.isArray(s.solved)) s.solved = [];
    if (!s.streak || typeof s.streak !== 'object') s.streak = { count: 0, last: null, longest: 0 };
    if (!s.reviews || typeof s.reviews !== 'object') s.reviews = {};
    return s;
  }
  function write(s) {
    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }

  function bumpStreak(s) {
    const today = todayStr();
    if (s.streak.last === today) return;
    const yest = addDays(today, -1);
    s.streak.count = (s.streak.last === yest) ? (s.streak.count || 0) + 1 : 1;
    s.streak.last = today;
    if (s.streak.count > (s.streak.longest || 0)) s.streak.longest = s.streak.count;
  }

  function isSolved(id) { return read().solved.indexOf(id) !== -1; }
  function setSolved(id, val) {
    const s = read();
    const i = s.solved.indexOf(id);
    if (val && i === -1) { s.solved.push(id); bumpStreak(s); }
    else if (!val && i !== -1) { s.solved.splice(i, 1); }
    return write(s);
  }
  function toggleSolved(id) { return setSolved(id, !isSolved(id)); }

  function recordActivity() { const s = read(); bumpStreak(s); return write(s); }
  function streakCount() {
    const s = read();
    const today = todayStr();
    const yest = addDays(today, -1);
    return (s.streak.last === today || s.streak.last === yest) ? (s.streak.count || 0) : 0;
  }

  // SM-2, mirroring tools/review.py so a grade means the same thing on both surfaces.
  function grade(id, quality) {
    quality = Math.max(0, Math.min(5, quality | 0));
    const s = read();
    const r = s.reviews[id] || { ef: 2.5, reps: 0, interval: 0, due: null, last: null, history: [] };
    if (quality < 3) {
      r.reps = 0;
      r.interval = 1;
    } else {
      if (r.reps === 0) r.interval = 1;
      else if (r.reps === 1) r.interval = 6;
      else r.interval = Math.round(r.interval * r.ef);
      r.reps += 1;
    }
    r.ef = Math.max(1.3, r.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    r.ef = Math.round(r.ef * 100) / 100;
    const today = todayStr();
    r.last = today;
    r.due = addDays(today, r.interval);
    r.history.push({ d: today, q: quality });
    s.reviews[id] = r;
    if (quality >= 3 && s.solved.indexOf(id) === -1) s.solved.push(id);
    bumpStreak(s);
    return write(s);
  }
  function due() {
    const s = read();
    const today = todayStr();
    return Object.keys(s.reviews).filter((id) => !s.reviews[id].due || s.reviews[id].due <= today);
  }
  function reviewOf(id) { return read().reviews[id] || null; }

  function stats() {
    const s = read();
    return {
      solved: s.solved.length,
      streak: streakCount(),
      longest: s.streak.longest || 0,
      reviews: Object.keys(s.reviews).length,
      due: due().length,
    };
  }

  function exportJSON() { return JSON.stringify(read(), null, 2); }
  function download() {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'awesome-interview-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function importJSON(text, mode) {
    let incoming;
    try { incoming = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON'); }
    if (!incoming || typeof incoming !== 'object') throw new Error('Invalid progress file');
    if (mode === 'replace') {
      const s = blank();
      s.solved = Array.isArray(incoming.solved) ? incoming.solved : [];
      s.streak = incoming.streak || s.streak;
      s.reviews = incoming.reviews || {};
      return write(s);
    }
    const s = read();
    (incoming.solved || []).forEach((id) => { if (s.solved.indexOf(id) === -1) s.solved.push(id); });
    Object.keys(incoming.reviews || {}).forEach((id) => {
      const a = s.reviews[id];
      const b = incoming.reviews[id];
      if (!a || (b && (b.reps || 0) >= (a.reps || 0))) s.reviews[id] = b;
    });
    if (incoming.streak) {
      s.streak.longest = Math.max(s.streak.longest || 0, incoming.streak.longest || 0);
      if ((incoming.streak.last || '') > (s.streak.last || '')) {
        s.streak.last = incoming.streak.last;
        s.streak.count = incoming.streak.count || s.streak.count;
      }
    }
    return write(s);
  }

  read(); // trigger migration on load

  window.AwesomeProgress = {
    isSolved, setSolved, toggleSolved, recordActivity, streakCount,
    grade, due, reviewOf, stats, exportJSON, download, importJSON, read,
  };
})();
