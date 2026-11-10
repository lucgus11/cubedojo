// Rendu SVG : vue du dessus (cas de dernier étage) et patron déplié (cube entier).
import { SLOTS } from './cube.js';

export const PALETTE = ['#f7d117', '#ff8a1f', '#22b35a', '#f4f4f0', '#e0352b', '#2f6fe0'];
export const COLOR_NAMES = ['jaune', 'orange', 'vert', 'blanc', 'rouge', 'bleu'];
const GRAY = '#8a919d';

const rect = (x, y, w, h, fill, extra = '') =>
  `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${Math.min(w, h) * 0.16}" fill="${fill}" ${extra}/>`;

// Indices des autocollants du dessus et des bandes latérales (vue du dessus, B en haut)
const TOP = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const STRIPS = {
  back: [47, 46, 45], // face B, ligne du haut, de gauche à droite
  front: [18, 19, 20],
  right: [11, 10, 9], // face R, de haut en bas
  left: [36, 37, 38],
};

/**
 * Vue du dessus d'un état.
 * mode : 'full' (couleurs réelles), 'oll' (jaune / gris), 'edges' (seules les arêtes comptent)
 */
export function caseSVG(state, mode = 'full', { label = '' } = {}) {
  const pad = 3, strip = 8, gap = 1.6, inner = 1.4;
  const start = pad + strip + gap;
  const cell = (100 - 2 * start - 2 * inner) / 3;
  const fillOf = (slot, isTop, idxInStrip) => {
    const c = state[slot];
    if (mode === 'full') return PALETTE[c];
    if (mode === 'oll') return c === 0 ? PALETTE[0] : GRAY;
    // mode edges : on ne montre que l'orientation des arêtes
    if (isTop) {
      const i = slot;
      const isEdge = i === 1 || i === 3 || i === 5 || i === 7;
      if (i === 4) return PALETTE[0];
      return isEdge ? (c === 0 ? PALETTE[0] : GRAY) : '#c9ccd3';
    }
    if (idxInStrip !== 1) return null;
    return c === 0 ? PALETTE[0] : GRAY;
  };
  let out = '';
  TOP.forEach((slot, i) => {
    const r = Math.floor(i / 3), c = i % 3;
    out += rect(start + c * (cell + inner), start + r * (cell + inner), cell, cell, fillOf(slot, true), 'class="stk"');
  });
  const sw = cell, sh = strip;
  STRIPS.back.forEach((slot, i) => {
    const f = fillOf(slot, false, i);
    if (f) out += rect(start + i * (cell + inner), pad, sw, sh, f, 'class="stk"');
  });
  STRIPS.front.forEach((slot, i) => {
    const f = fillOf(slot, false, i);
    if (f) out += rect(start + i * (cell + inner), 100 - pad - strip, sw, sh, f, 'class="stk"');
  });
  STRIPS.left.forEach((slot, i) => {
    const f = fillOf(slot, false, i);
    if (f) out += rect(pad, start + i * (cell + inner), sh, sw, f, 'class="stk"');
  });
  STRIPS.right.forEach((slot, i) => {
    const f = fillOf(slot, false, i);
    if (f) out += rect(100 - pad - strip, start + i * (cell + inner), sh, sw, f, 'class="stk"');
  });
  return `<svg viewBox="0 0 100 100" class="cube-svg" role="img" aria-label="${label}">${out}</svg>`;
}

// Disposition du patron : [colonne, ligne] de chaque face (en blocs de 3x3)
const NET_POS = { U: [1, 0], L: [0, 1], F: [1, 1], R: [2, 1], B: [3, 1], D: [1, 2] };
const SPEFFZ_FACE = { U: 0, L: 1, F: 2, R: 3, B: 4, D: 5 };
const A = 'ABCDEFGHIJKLMNOPQRSTUVWX';

// Lettre Speffz d'un emplacement (ou null pour un centre). type : 'corner' | 'edge'
export function speffz(slot) {
  const s = SLOTS[slot];
  const { r, c } = s;
  const corner = { '0,0': 0, '0,2': 1, '2,2': 2, '2,0': 3 }[`${r},${c}`];
  const edge = { '0,1': 0, '1,2': 1, '2,1': 2, '1,0': 3 }[`${r},${c}`];
  const base = SPEFFZ_FACE[s.face] * 4;
  if (corner !== undefined) return { letter: A[base + corner], type: 'corner' };
  if (edge !== undefined) return { letter: A[base + edge], type: 'edge' };
  return null;
}
export const speffzSlot = (letter, type) => SLOTS.findIndex((_, i) => {
  const sp = speffz(i);
  return sp && sp.letter === letter && sp.type === type;
});

/**
 * Patron déplié.
 * opts : mark (indice d'un autocollant à entourer), hide (indice masqué, "?"), labels (fn slot -> texte),
 *        dim (fn slot -> bool pour atténuer)
 */
export function netSVG(state, { mark = null, hide = null, labels = null, dim = null, reveal = null, label = '' } = {}) {
  const cell = 10, fg = 2.2;
  const faceSize = cell * 3;
  const W = faceSize * 4 + fg * 3, H = faceSize * 3 + fg * 2;
  let out = '';
  let overlay = '';
  SLOTS.forEach((s, i) => {
    const [fx, fy] = NET_POS[s.face];
    const x = fx * (faceSize + fg) + s.c * cell;
    const y = fy * (faceSize + fg) + s.r * cell;
    const isHidden = hide === i;
    const masked = reveal && !reveal.has(i) && !(s.r === 1 && s.c === 1);
    const fill = isHidden ? '#3b4048' : masked ? '#aeb3bd' : PALETTE[state[i]];
    const opacity = (dim && dim(i)) || masked ? 0.4 : 1;
    out += `<rect x="${x + 0.4}" y="${y + 0.4}" width="${cell - 0.8}" height="${cell - 0.8}" rx="1.4" fill="${fill}" opacity="${opacity}" class="stk"/>`;
    if (isHidden) {
      overlay += `<text x="${x + cell / 2}" y="${y + cell / 2 + 2.4}" text-anchor="middle" font-size="7" font-weight="700" fill="#fff">?</text>`;
    }
    if (labels) {
      const t = labels(i);
      if (t) overlay += `<text x="${x + cell / 2}" y="${y + cell / 2 + 2.1}" text-anchor="middle" font-size="5.6" font-weight="700" fill="#101216" stroke="#fff" stroke-width="0.7" paint-order="stroke">${t}</text>`;
    }
    if (mark === i) {
      overlay += `<rect x="${x + 0.9}" y="${y + 0.9}" width="${cell - 1.8}" height="${cell - 1.8}" rx="1.4" fill="none" stroke="#e8451e" stroke-width="1.6"/>`;
      overlay += `<rect x="${x + 0.1}" y="${y + 0.1}" width="${cell - 0.2}" height="${cell - 0.2}" rx="1.8" fill="none" stroke="#fff" stroke-width="0.6"/>`;
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="cube-svg net" role="img" aria-label="${label}">${out}${overlay}</svg>`;
}
