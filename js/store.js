// Persistance locale (localStorage) + calculs de statistiques du chrono.

const P = 'cd.';
const read = (k, d) => {
  try {
    const v = localStorage.getItem(P + k);
    return v === null ? d : JSON.parse(v);
  } catch {
    return d;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(P + k, JSON.stringify(v));
  } catch { /* stockage plein ou indisponible */ }
};

export const store = {
  get: read,
  set: write,
  settings() {
    return { theme: 'auto', inspection: false, ...read('settings', {}) };
  },
  saveSettings(s) { write('settings', s); },
  solves: () => read('solves', []),
  saveSolves: (v) => write('solves', v),
  favs: () => new Set(read('favs', [])),
  toggleFav(id) {
    const f = store.favs();
    f.has(id) ? f.delete(id) : f.add(id);
    write('favs', [...f]);
    return f.has(id);
  },
  srs: () => read('srs', {}),
  saveSrs: (v) => write('srs', v),
  rec: (name) => read('rec.' + name, { n: 0, ok: 0, best: 0, streak: 0, ms: 0 }),
  saveRec: (name, v) => write('rec.' + name, v),
  exportAll() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(P)) out[k.slice(P.length)] = JSON.parse(localStorage.getItem(k));
    }
    return out;
  },
  importAll(obj) {
    Object.entries(obj).forEach(([k, v]) => write(k, v));
  },
  clearAll() {
    Object.keys(store.exportAll()).forEach((k) => localStorage.removeItem(P + k));
  },
};

// ---------- Temps ----------
export const eff = (s) => (s.pen === 'dnf' ? Infinity : s.t + (s.pen || 0));

export function fmt(ms, digits = 2) {
  if (ms === Infinity || ms == null || Number.isNaN(ms)) return 'DNF';
  const cs = digits === 3 ? Math.floor(ms) : Math.floor(ms / 10);
  const total = digits === 3 ? cs / 1000 : cs / 100;
  const m = Math.floor(total / 60);
  const sec = total - m * 60;
  const secStr = sec.toFixed(digits).padStart(digits + 3, '0');
  return m > 0 ? `${m}:${secStr}` : sec.toFixed(digits);
}

export function fmtSolve(s) {
  if (s.pen === 'dnf') return 'DNF';
  return fmt(s.t + (s.pen || 0)) + (s.pen ? '+' : '');
}

// Moyenne tronquée (règles WCA) : n valeurs, on retire `trim` meilleurs et `trim` pires.
export function trimmedMean(values, trim) {
  const dnf = values.filter((v) => v === Infinity).length;
  if (dnf > trim) return Infinity;
  const sorted = [...values].sort((a, b) => a - b).slice(trim, values.length - trim);
  return sorted.reduce((a, b) => a + b, 0) / sorted.length;
}

export function aoN(solves, n, endIndex = solves.length) {
  if (endIndex < n) return null;
  const vals = solves.slice(endIndex - n, endIndex).map(eff);
  const trim = n >= 100 ? Math.ceil(n * 0.05) : 1;
  return trimmedMean(vals, trim);
}

export function bestAoN(solves, n) {
  let best = null;
  for (let i = n; i <= solves.length; i++) {
    const a = aoN(solves, n, i);
    if (a !== null && a !== Infinity && (best === null || a < best)) best = a;
  }
  return best;
}

export function summary(solves) {
  const vals = solves.map(eff);
  const ok = vals.filter((v) => v !== Infinity);
  return {
    count: solves.length,
    best: ok.length ? Math.min(...ok) : null,
    worst: ok.length ? Math.max(...ok) : null,
    mean: ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null,
    ao5: aoN(solves, 5),
    ao12: aoN(solves, 12),
    ao100: aoN(solves, 100),
    bestAo5: bestAoN(solves, 5),
    bestAo12: bestAoN(solves, 12),
  };
}

// ---------- Répétition espacée (boîtes de Leitner) ----------
const DAY = 86400000;
const INTERVALS = [0, 1, 3, 7, 14, 30]; // jours par boîte
export function rate(srs, id, grade /* 0 raté, 1 difficile, 2 facile */) {
  const cur = srs[id] || { box: 0, due: 0, seen: 0 };
  let box = cur.box;
  if (grade === 0) box = 0;
  else if (grade === 2) box = Math.min(box + 1, INTERVALS.length - 1);
  const due = grade === 0 ? Date.now() : Date.now() + INTERVALS[box] * DAY;
  srs[id] = { box, due, seen: cur.seen + 1 };
  return srs;
}
export const isMastered = (srs, id) => (srs[id]?.box || 0) >= 3;
export const isDue = (srs, id) => !srs[id] || srs[id].due <= Date.now();
