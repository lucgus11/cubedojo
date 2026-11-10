// Composants d'interface partagés : icônes, vignettes, lecteur d'algorithme, quiz.
import * as C from './cube.js';
import { caseSVG, netSVG } from './render.js';
import { store } from './store.js';

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const rnd = (n) => Math.floor(Math.random() * n);
export const pick = (arr) => arr[rnd(arr.length)];
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const I = (d) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const icons = {
  home: I('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
  algos: I('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  train: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  timer: I('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2"/><path d="M9 2h6"/>'),
  book: I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/>'),
  star: I('<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>'),
  gear: I('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  play: I('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
  pause: I('<path d="M8 4v16M16 4v16"/>'),
  prev: I('<path d="M15 5l-7 7 7 7"/>'),
  next: I('<path d="M9 5l7 7-7 7"/>'),
  first: I('<path d="M7 5v14"/><path d="M19 5l-9 7 9 7z" fill="currentColor"/>'),
  last: I('<path d="M17 5v14"/><path d="M5 5l9 7-9 7z" fill="currentColor"/>'),
  copy: I('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
  refresh: I('<path d="M20 11a8 8 0 1 0-2 6"/><path d="M20 4v7h-7"/>'),
  net: I('<rect x="8" y="2" width="6" height="6"/><rect x="2" y="8" width="6" height="6"/><rect x="8" y="8" width="6" height="6"/><rect x="14" y="8" width="6" height="6"/><rect x="8" y="14" width="6" height="6"/>'),
  trash: I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  check: I('<path d="M5 12l5 5 9-10"/>'),
  x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  download: I('<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>'),
};

export const slug = (c) => c.id.slice(c.id.indexOf('-') + 1);
export const caseHref = (c) => `#/algos/${c.set}/${slug(c)}`;

// ---------- Vues d'un cas ----------
const canonCache = new Map();
export function caseView(c) {
  if (!canonCache.has(c.id)) {
    if (c.set === 'pll') {
      const cc = C.canonicalCase(c.alg);
      canonCache.set(c.id, { state: cc.state, mode: 'full', pre: cc.pre, post: cc.post });
    } else {
      canonCache.set(c.id, { state: C.displayState(c.alg), mode: c.mode, pre: '', post: '' });
    }
  }
  return canonCache.get(c.id);
}
export const thumb = (c) => {
  const v = caseView(c);
  return caseSVG(v.state, v.mode, { label: `Cas ${c.name}` });
};

export const algHTML = (alg, cls = '') =>
  `<span class="alg ${cls}">${alg.split(/\s+/).map((t) => `<span class="mv">${esc(t)}</span>`).join(' ')}</span>`;

// ---------- Lecteur d'algorithme ----------
export function playerHTML({ alg, pre = '', post = '', start = 'case' }) {
  return `<div class="player" data-alg="${esc(alg)}" data-pre="${esc(pre)}" data-post="${esc(post)}" data-start="${start}"></div>`;
}

export function hydratePlayers(el) {
  $$('.player', el).forEach((p) => {
    const alg = p.dataset.alg;
    const pre = p.dataset.pre, post = p.dataset.post;
    const items = [];
    if (pre) items.push({ t: pre, auf: true });
    alg.replace(/[()]/g, ' ').trim().split(/\s+/).forEach((t) => items.push({ t, auf: false }));
    if (post) items.push({ t: post, auf: true });
    const toks = items.map((i) => C.normalizeToken(i.t));
    const full = toks.join(' ');
    const startState = p.dataset.start === 'solved' ? C.solved() : C.normalizeOrientation(C.caseState(full));
    const states = [startState];
    toks.forEach((t) => states.push(C.applyMove(states[states.length - 1], t)));
    let i = 0, timer = null;

    p.innerHTML = `
      <div class="player-net"></div>
      <div class="player-moves">${items.map((it, k) => `<button type="button" class="mv step ${it.auf ? 'auf' : ''}" data-i="${k + 1}">${esc(it.t)}</button>`).join('')}</div>
      <div class="player-ctrl">
        <button type="button" class="ib" data-a="first" aria-label="Début">${icons.first}</button>
        <button type="button" class="ib" data-a="prev" aria-label="Précédent">${icons.prev}</button>
        <button type="button" class="ib primary" data-a="play" aria-label="Lecture">${icons.play}</button>
        <button type="button" class="ib" data-a="next" aria-label="Suivant">${icons.next}</button>
        <button type="button" class="ib" data-a="last" aria-label="Fin">${icons.last}</button>
      </div>`;
    const net = $('.player-net', p);
    const steps = $$('.step', p);
    const playBtn = $('[data-a=play]', p);
    const draw = () => {
      net.innerHTML = netSVG(states[i], { label: `Étape ${i} sur ${toks.length}` });
      steps.forEach((s, k) => { s.classList.toggle('on', k + 1 === i); s.classList.toggle('done', k + 1 < i); });
    };
    const stop = () => { clearInterval(timer); timer = null; playBtn.innerHTML = icons.play; };
    const go = (n) => { i = Math.max(0, Math.min(toks.length, n)); draw(); if (i === toks.length) stop(); };
    p.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.i) { stop(); go(+b.dataset.i); return; }
      const a = b.dataset.a;
      if (a === 'first') { stop(); go(0); }
      else if (a === 'last') { stop(); go(toks.length); }
      else if (a === 'prev') { stop(); go(i - 1); }
      else if (a === 'next') { stop(); go(i + 1); }
      else if (a === 'play') {
        if (timer) return stop();
        if (i >= toks.length) go(0);
        playBtn.innerHTML = icons.pause;
        timer = setInterval(() => go(i + 1), 650);
      }
    });
    // arrêter la lecture si le lecteur quitte le DOM
    const obs = new MutationObserver(() => { if (!document.body.contains(p)) { stop(); obs.disconnect(); } });
    obs.observe(document.body, { childList: true, subtree: true });
    draw();
  });
}

// ---------- Quiz générique ----------
/**
 * next() -> { visual: html, answer: string, choices: [{ v, label }], cls?: string }
 */
export function mountQuiz(el, { key, next, intro = '' }) {
  let q = null, t0 = 0, locked = false, timeout = null;
  const draw = () => {
    const st = store.rec(key);
    const acc = st.n ? Math.round((st.ok / st.n) * 100) : 0;
    const avg = st.ok ? (st.ms / st.ok / 1000).toFixed(1) : '–';
    el.innerHTML = `
      <div class="quiz-stats">
        <div><b>${acc}%</b><span>réussite</span></div>
        <div><b>${st.streak}</b><span>série</span></div>
        <div><b>${st.best}</b><span>record</span></div>
        <div><b>${avg}s</b><span>temps moyen</span></div>
      </div>
      ${intro ? `<p class="muted center">${intro}</p>` : ''}
      <div class="quiz-visual">${q.visual}</div>
      <div class="choices ${q.cls || ''}">${q.choices.map((c) => `<button type="button" class="choice" data-v="${esc(c.v)}" ${c.style ? `style="${c.style}"` : ''}>${c.label}</button>`).join('')}</div>
      <div class="quiz-fb" aria-live="polite"></div>`;
    locked = false;
    t0 = performance.now();
  };
  const nextQ = () => { clearTimeout(timeout); q = next(); draw(); };
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) return nextQ();
    const b = e.target.closest('.choice');
    if (!b || locked) return;
    locked = true;
    const ms = performance.now() - t0;
    const good = b.dataset.v === String(q.answer);
    const st = store.rec(key);
    st.n++;
    if (good) { st.ok++; st.streak++; st.ms += ms; st.best = Math.max(st.best, st.streak); } else st.streak = 0;
    store.saveRec(key, st);
    $$('.choice', el).forEach((c) => {
      c.disabled = true;
      if (c.dataset.v === String(q.answer)) c.classList.add('right');
    });
    if (!good) b.classList.add('wrong');
    const fb = $('.quiz-fb', el);
    fb.innerHTML = good
      ? `<span class="ok">${icons.check} Bien joué — ${(ms / 1000).toFixed(1)} s</span>`
      : `<span class="ko">${icons.x} C’était : <b>${esc(q.answerLabel ?? q.answer)}</b></span> <button type="button" class="btn" data-next>Suivant</button>`;
    if (good) timeout = setTimeout(nextQ, 700);
  });
  nextQ();
  return () => clearTimeout(timeout);
}
