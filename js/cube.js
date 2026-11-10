// Moteur de Rubik's Cube 3x3 — représentation par autocollants (54 emplacements).
// Ordre des faces : U R F D L B (comme Kociemba). Chaque face est lue "vue de l'extérieur",
// U avec B en haut, D avec F en haut, les 4 autres avec U en haut.

export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
const NORMAL = { U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1], D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1] };

function cell(face, r, c) {
  switch (face) {
    case 'U': return [c - 1, 1, r - 1];
    case 'D': return [c - 1, -1, 1 - r];
    case 'F': return [c - 1, 1 - r, 1];
    case 'B': return [1 - c, 1 - r, -1];
    case 'R': return [1, 1 - r, 1 - c];
    case 'L': return [-1, 1 - r, c - 1];
  }
}

const key = (p, n) => p.join(',') + '|' + n.join(',');

export const SLOTS = [];
const INDEX = new Map();
FACES.forEach((face, fi) => {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const p = cell(face, r, c);
      const n = NORMAL[face];
      INDEX.set(key(p, n), SLOTS.length);
      SLOTS.push({ face, fi, r, c, p, n });
    }
  }
});

// Cubies : emplacements groupés par position
function groupByPosition(filter) {
  const m = new Map();
  SLOTS.forEach((s, i) => {
    const nonZero = s.p.filter((v) => v !== 0).length;
    if (!filter(nonZero)) return;
    const k = s.p.join(',');
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(i);
  });
  return [...m.values()];
}
export const CORNERS = groupByPosition((n) => n === 3);
export const EDGES = groupByPosition((n) => n === 2);

// Rotation d'un quart de tour horaire autour de l'axe sortant a (rotation de -90° autour de a)
function rot(a, v) {
  const d = a[0] * v[0] + a[1] * v[1] + a[2] * v[2];
  const x = [a[1] * v[2] - a[2] * v[1], a[2] * v[0] - a[0] * v[2], a[0] * v[1] - a[1] * v[0]];
  return [a[0] * d - x[0], a[1] * d - x[1], a[2] * d - x[2]];
}

const all = () => true;
const BASE = {
  U: [[0, 1, 0], (p) => p[1] === 1],
  D: [[0, -1, 0], (p) => p[1] === -1],
  R: [[1, 0, 0], (p) => p[0] === 1],
  L: [[-1, 0, 0], (p) => p[0] === -1],
  F: [[0, 0, 1], (p) => p[2] === 1],
  B: [[0, 0, -1], (p) => p[2] === -1],
  M: [[-1, 0, 0], (p) => p[0] === 0],
  E: [[0, -1, 0], (p) => p[1] === 0],
  S: [[0, 0, 1], (p) => p[2] === 0],
  u: [[0, 1, 0], (p) => p[1] >= 0],
  d: [[0, -1, 0], (p) => p[1] <= 0],
  r: [[1, 0, 0], (p) => p[0] >= 0],
  l: [[-1, 0, 0], (p) => p[0] <= 0],
  f: [[0, 0, 1], (p) => p[2] >= 0],
  b: [[0, 0, -1], (p) => p[2] <= 0],
  x: [[1, 0, 0], all],
  y: [[0, 1, 0], all],
  z: [[0, 0, 1], all],
};

const compose = (a, b) => a.map((j) => b[j]); // a puis b

export const MOVE = {};
for (const [name, [axis, sel]] of Object.entries(BASE)) {
  const q = SLOTS.map((s, i) => (sel(s.p) ? INDEX.get(key(rot(axis, s.p), rot(axis, s.n))) : i));
  const q2 = compose(q, q);
  MOVE[name] = q;
  MOVE[name + '2'] = q2;
  MOVE[name + "'"] = compose(q2, q);
}

const TOKEN = /^([URFDLBMESxyz]w?|[urfdlb])(2'|2|')?$/;

export function normalizeToken(tok) {
  const m = TOKEN.exec(tok);
  if (!m) throw new Error('Mouvement inconnu : ' + tok);
  let base = m[1];
  if (base.length === 2) base = base[0].toLowerCase(); // Rw -> r
  const suf = m[2] === "2'" ? '2' : m[2] || '';
  const name = base + suf;
  if (!MOVE[name]) throw new Error('Mouvement inconnu : ' + tok);
  return name;
}

export function parseAlg(alg) {
  return alg.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean).map(normalizeToken);
}

export function invertToken(t) {
  if (t.endsWith('2')) return t;
  return t.endsWith("'") ? t.slice(0, -1) : t + "'";
}

export function invertAlg(alg) {
  return parseAlg(alg).reverse().map(invertToken).join(' ');
}

export function solved() {
  return Uint8Array.from(SLOTS, (s) => s.fi);
}

export function applyMove(state, name) {
  const dest = MOVE[name];
  const out = new Uint8Array(54);
  for (let i = 0; i < 54; i++) out[dest[i]] = state[i];
  return out;
}

export function applyAlg(state, alg) {
  const toks = Array.isArray(alg) ? alg : parseAlg(alg);
  let s = state;
  for (const t of toks) s = applyMove(s, t);
  return s;
}

export function isSolved(state) {
  return SLOTS.every((s, i) => state[i] === s.fi);
}

export const equal = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

// État "avant l'algorithme" : celui qu'il résout.
export function caseState(alg) {
  return applyAlg(solved(), invertAlg(alg));
}

export function randomScramble(len = 20, rnd = Math.random) {
  const faces = ['U', 'D', 'R', 'L', 'F', 'B'];
  const axis = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };
  const out = [];
  while (out.length < len) {
    const f = faces[Math.floor(rnd() * 6)];
    const prev = out.length ? out[out.length - 1][0] : null;
    const prev2 = out.length > 1 ? out[out.length - 2][0] : null;
    if (f === prev) continue;
    if (prev && prev2 && axis[prev] === axis[f] && axis[prev2] === axis[f]) continue;
    out.push(f + ['', "'", '2'][Math.floor(rnd() * 3)]);
  }
  return out.join(' ');
}

// ---------- Orientation et cas canoniques ----------
const CENTERS = FACES.map((_, fi) => fi * 9 + 4);
const ROT_SEQS = [];
for (const pre of [[], ['x'], ['x2'], ["x'"], ['z'], ["z'"]]) {
  for (const spin of [[], ['y'], ['y2'], ["y'"]]) ROT_SEQS.push([...pre, ...spin]);
}

// Remet les centres à leur place par une rotation du cube entier.
export function normalizeOrientation(state) {
  for (const seq of ROT_SEQS) {
    const s = applyAlg(state, seq);
    if (CENTERS.every((c, fi) => s[c] === fi)) return s;
  }
  throw new Error('Orientation impossible');
}

export const mismatches = (state) => SLOTS.reduce((n, s, i) => n + (state[i] !== s.fi ? 1 : 0), 0);

// Analyse des permutations du dernier étage
const HOME = new Map();
[...CORNERS, ...EDGES].forEach((slots, i) => HOME.set(slots.map((s) => SLOTS[s].fi).sort().join(), i));
export const LL_CORNERS = CORNERS.filter((c) => SLOTS[c[0]].p[1] === 1);
export const LL_EDGES = EDGES.filter((c) => SLOTS[c[0]].p[1] === 1);
const homeId = (slots, state) => HOME.get(slots.map((s) => state[s]).sort().join());
const solvedId = (slots) => HOME.get(slots.map((s) => SLOTS[s].fi).sort().join());

export function llPerm(state, list) {
  return list.map((slots) => {
    const id = homeId(slots, state);
    const j = list.findIndex((l) => solvedId(l) === id);
    return j < 0 ? 9 : j;
  });
}
export function cycleLengths(p) {
  const seen = new Set();
  const out = [];
  p.forEach((_, i) => {
    if (seen.has(i)) return;
    let len = 0;
    let j = i;
    while (j < p.length && !seen.has(j)) { seen.add(j); j = p[j]; len++; }
    if (len > 1) out.push(len);
  });
  return out.sort();
}
export function llCycles(state) {
  return { c: cycleLengths(llPerm(state, LL_CORNERS)), e: cycleLengths(llPerm(state, LL_EDGES)) };
}

// Pour un algorithme de PLL : cherche les AUF (U avant / après) qui donnent la permutation
// "pure" (le moins de pièces déplacées, puis les cycles les plus courts), et renvoie l'état de ce cas.
export function canonicalCase(alg) {
  const U = ['', 'U', 'U2', "U'"];
  let best = null;
  for (let a = 0; a < 4; a++) {
    for (let b = 0; b < 4; b++) {
      const w = `${U[a]} ${alg} ${U[b]}`;
      const after = normalizeOrientation(applyAlg(solved(), w));
      const { c, e } = llCycles(after);
      const lens = [...c, ...e];
      const displaced = lens.reduce((n, l) => n + l, 0);
      const squares = lens.reduce((n, l) => n + l * l, 0);
      const cost = displaced * 1000 + squares * 10 + (a ? 1 : 0) + (b ? 1 : 0);
      if (!best || cost < best.cost) best = { cost, w, pre: U[a], post: U[b] };
    }
  }
  return { ...best, state: normalizeOrientation(applyAlg(solved(), invertAlg(best.w))) };
}

// Version "propre" d'un état de cas : centres à leur place.
export function displayState(alg) {
  return normalizeOrientation(caseState(alg));
}
