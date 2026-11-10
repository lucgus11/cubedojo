import * as C from './cube.js';
import { SETS, ALL_CASES, caseById, setById } from './data.js';
import { caseSVG, netSVG, PALETTE, COLOR_NAMES, speffz, speffzSlot } from './render.js';
import { store, fmt, fmtSolve, eff, summary, aoN, rate, isMastered, isDue } from './store.js';
import { $, $$, esc, rnd, pick, shuffle, icons, slug, caseHref, caseView, thumb, algHTML, playerHTML, hydratePlayers, mountQuiz } from './ui.js';
import { timerView } from './timer.js';
import { guideIndex, guideView } from './guides.js';

const root = $('#app');
let cleanup = null;
let deferredInstall = null;

// ---------- Thème ----------
function applyTheme() {
  const t = store.settings().theme;
  document.documentElement.dataset.theme = t === 'auto' ? '' : t;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name=theme-color]')?.setAttribute('content', dark ? '#101216' : '#f4f1ea');
}
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

// ---------- Utilitaires de vue ----------
const page = (title, body, { back = '', sub = '' } = {}) => `
  <header class="page-head">
    ${back ? `<a class="back" href="${back}" aria-label="Retour">${icons.prev}</a>` : ''}
    <div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div>
  </header>${body}`;

const favBtn = (id) => {
  const on = store.favs().has(id);
  return `<button type="button" class="ib fav ${on ? 'on' : ''}" data-fav="${id}" aria-pressed="${on}" aria-label="Favori">${icons.star}</button>`;
};

const statTile = (label, value, sub = '') => `<div class="tile"><span>${label}</span><b>${value}</b>${sub ? `<em>${sub}</em>` : ''}</div>`;

// ---------- Accueil ----------
function homeView() {
  const solves = store.solves();
  const s = summary(solves);
  const srs = store.srs();
  const due = ALL_CASES.filter((c) => srs[c.id] && isDue(srs, c.id)).length;
  const mastered = ALL_CASES.filter((c) => isMastered(srs, c.id)).length;
  const favs = [...store.favs()].map(caseById).filter(Boolean).slice(0, 6);
  const journey = [
    ['Apprendre à résoudre le cube', 'Couche par couche, ta première résolution.', '#/guides/beginner'],
    ['Maîtriser les bases du dernier étage', 'OLL 2-look : 10 cas pour la face jaune.', '#/algos/oll2'],
    ['Placer toutes les pièces', 'Les 21 PLL, avec reconnaissance et fiches.', '#/algos/pll'],
    ['Chronométrer et progresser', 'Moyennes ao5 / ao12 / ao100 et courbe.', '#/timer'],
  ];
  const html = `
    <section class="hero">
      <p class="eyebrow">CubeDojo</p>
      <h1>Du premier cube<br>au sub-20, pas à pas.</h1>
      <p class="lead">Guides, bases d’algorithmes vérifiées, entraîneurs de reconnaissance et chrono — tout fonctionne hors ligne.</p>
      <div class="row">
        <a class="btn primary" href="#/guides/beginner">Apprendre à résoudre ${icons.arrow}</a>
        <a class="btn" href="#/timer">Ouvrir le chrono</a>
      </div>
      <div class="hero-cube" aria-hidden="true">${netSVG(C.applyAlg(C.solved(), "R U R' U' R' F R2 U' R' U' R U R' F'"))}</div>
    </section>

    <section>
      <h2 class="sect">Ton activité</h2>
      <div class="tiles">
        ${statTile('Meilleur temps', s.best !== null ? fmt(s.best) : '–')}
        ${statTile('Moyenne de 5', s.ao5 !== null ? fmt(s.ao5) : '–')}
        ${statTile('Moyenne de 12', s.ao12 !== null ? fmt(s.ao12) : '–')}
        ${statTile('Résolutions', s.count)}
      </div>
      <div class="tiles two">
        <a class="tile link" href="#/train/flash"><span>Cartes à réviser</span><b>${due}</b><em>${mastered} / ${ALL_CASES.length} maîtrisés</em></a>
        <a class="tile link" href="#/favs"><span>Favoris</span><b>${store.favs().size}</b><em>algorithmes épinglés</em></a>
      </div>
    </section>

    <section>
      <h2 class="sect">Ton parcours</h2>
      <ol class="journey">
        ${journey.map(([t, d, h], i) => `<li><a href="${h}"><span class="num">${i + 1}</span><span><b>${t}</b><em>${d}</em></span>${icons.arrow}</a></li>`).join('')}
      </ol>
    </section>

    <section>
      <h2 class="sect">S’entraîner</h2>
      <div class="cards">
        <a class="card trainer" href="#/train/pll"><div class="thumb">${thumb(caseById('pll-ja'))}</div><b>Reconnaître les PLL</b><span>21 cas, avec AUF aléatoire</span></a>
        <a class="card trainer" href="#/train/oll"><div class="thumb">${thumb(caseById('oll2-sune'))}</div><b>Reconnaître les OLL</b><span>Croix et coins, 10 cas</span></a>
        <a class="card trainer" href="#/train/flash"><div class="thumb">${thumb(caseById('pll-t'))}</div><b>Cartes d’algorithmes</b><span>Répétition espacée</span></a>
        <a class="card trainer" href="#/train/corners"><div class="thumb">${netSVG(C.solved(), { reveal: new Set([2, 29, 38]), hide: 29 })}</div><b>Déduction de coin</b><span>Quelle couleur est cachée ?</span></a>
      </div>
    </section>

    ${favs.length ? `<section><h2 class="sect">Favoris</h2><div class="case-grid">${favs.map(caseCard).join('')}</div></section>` : ''}
  `;
  return { html };
}

// ---------- Algorithmes ----------
function caseCard(c) {
  const fav = store.favs().has(c.id);
  return `<a class="case-card" href="${caseHref(c)}">
    <div class="thumb">${thumb(c)}</div>
    <span class="cc-name">${esc(c.name)}</span>${fav ? `<span class="cc-fav">${icons.star}</span>` : ''}
  </a>`;
}

function algosIndex() {
  const srs = store.srs();
  const html = `
    <div class="cards">
      ${SETS.map((s) => {
        const m = s.cases.filter((c) => isMastered(srs, c.id)).length;
        return `<a class="card setcard" href="#/algos/${s.id}">
          <div class="thumb-row">${s.cases.slice(0, 3).map((c) => `<div class="thumb">${thumb(c)}</div>`).join('')}</div>
          <b>${s.name} <small>${s.cases.length} cas</small></b>
          <span>${s.blurb}</span>
          <div class="bar"><i style="width:${(m / s.cases.length) * 100}%"></i></div>
          <em>${m} / ${s.cases.length} maîtrisés</em>
        </a>`;
      }).join('')}
    </div>
    <p class="note">Chaque algorithme est vérifié automatiquement avec un simulateur de cube : il résout bien le cas affiché, sans toucher aux deux premières couches.</p>`;
  return { html: page('Algorithmes', html, { sub: 'Choisis un ensemble à apprendre.' }) };
}

function setView(setId) {
  const set = setById(setId);
  if (!set) return notFound();
  const srs = store.srs();
  const html = `
    <p class="lead small">${set.blurb}</p>
    <div class="row"><a class="btn primary" href="#/train/flash?set=${set.id}">${icons.train} Réviser avec des cartes</a>
    ${set.id === 'pll' ? `<a class="btn" href="#/train/pll">Reconnaissance</a>` : `<a class="btn" href="#/train/oll">Reconnaissance</a>`}</div>
    ${set.groups.map((g) => {
      const cs = set.cases.filter((c) => c.group === g);
      return `<h2 class="sect">${g} <small>${cs.length}</small></h2>
        <div class="case-grid">${cs.map((c) => `<a class="case-card ${isMastered(srs, c.id) ? 'mastered' : ''}" href="${caseHref(c)}"><div class="thumb">${thumb(c)}</div><span class="cc-name">${esc(c.name)}</span>${store.favs().has(c.id) ? `<span class="cc-fav">${icons.star}</span>` : ''}</a>`).join('')}</div>`;
    }).join('')}`;
  return { html: page(`${set.name} <small>${set.long}</small>`, html, { back: '#/algos' }) };
}

function caseView_(setId, sl) {
  const c = caseById(`${setId}-${sl}`);
  if (!c) return notFound();
  const set = setById(setId);
  const v = caseView(c);
  const idx = set.cases.indexOf(c);
  const prev = set.cases[(idx + set.cases.length - 1) % set.cases.length];
  const nextC = set.cases[(idx + 1) % set.cases.length];
  const srs = store.srs();
  const box = srs[c.id]?.box ?? null;
  const html = `
    <div class="case-hero">
      <div class="thumb big">${caseSVG(v.state, v.mode, { label: `Cas ${c.name}` })}</div>
      <div class="case-info">
        <p class="eyebrow">${esc(set.name)} · ${esc(c.group)}</p>
        <h2>${esc(c.name)}</h2>
        ${c.note ? `<p>${esc(c.note)}</p>` : ''}
        <div class="row">${favBtn(c.id)}<button class="btn" data-copy="${esc(c.alg)}">${icons.copy} Copier</button></div>
        <p class="muted small">${box === null ? 'Pas encore révisé.' : `Boîte ${box + 1} / 6 dans tes cartes.`}</p>
      </div>
    </div>
    <div class="card alg-card">
      <h3>Algorithme</h3>
      <p class="alg-big">${algHTML(c.alg)}</p>
      ${v.pre || v.post ? `<p class="muted small">Pour le cas dessiné ci-dessus, fais <b>${v.pre || '—'}</b> avant et <b>${v.post || '—'}</b> après (AUF). Selon la position réelle des pièces, l’alignement du dernier étage peut changer.</p>` : ''}
      ${c.alts.length ? `<h3>Variantes</h3>${c.alts.map((a) => `<p class="alg-big alt">${algHTML(a)} <button class="ib" data-copy="${esc(a)}" aria-label="Copier">${icons.copy}</button></p>`).join('')}` : ''}
    </div>
    <div class="card">
      <h3>Pas à pas</h3>
      ${playerHTML({ alg: c.alg, pre: v.pre, post: v.post })}
    </div>
    <nav class="pager"><a href="${caseHref(prev)}">${icons.prev} ${esc(prev.name)}</a><a href="${caseHref(nextC)}">${esc(nextC.name)} ${icons.next}</a></nav>`;
  return { html: page(`${esc(c.name)}`, html, { back: `#/algos/${setId}` }), mount: (el) => hydratePlayers(el) };
}

function favsView() {
  const favs = [...store.favs()].map(caseById).filter(Boolean);
  const html = favs.length
    ? `<div class="case-grid">${favs.map(caseCard).join('')}</div><div class="row"><a class="btn primary" href="#/train/flash?set=favs">Réviser mes favoris</a></div>`
    : `<div class="empty">${icons.star}<p>Aucun favori pour l’instant.</p><p class="muted">Appuie sur l’étoile d’un algorithme pour l’épingler ici.</p><a class="btn primary" href="#/algos">Parcourir les algorithmes</a></div>`;
  return { html: page('Favoris', html) };
}

// ---------- Entraînement ----------
function trainIndex() {
  const items = [
    ['#/train/flash', 'Cartes d’algorithmes', 'Rappelle l’algorithme d’un cas. Répétition espacée.', thumb(caseById('pll-aa'))],
    ['#/train/pll', 'Reconnaissance PLL', 'Quel PLL ? Vue de dessus, AUF aléatoire.', thumb(caseById('pll-nb'))],
    ['#/train/oll', 'Reconnaissance OLL', 'Croix et coins : nomme le cas du premier coup d’œil.', thumb(caseById('oll2-pi'))],
    ['#/train/corners', 'Déduction de coin', 'Deux couleurs visibles : quelle est la troisième ?', netSVG(C.solved(), { reveal: new Set([8, 15, 24]), hide: 24 })],
    ['#/train/speffz', 'Lettrage Speffz', 'Retrouve la lettre d’un autocollant (pour le tir à l’aveugle).', netSVG(C.solved(), { mark: 2, labels: (i) => speffz(i)?.type === 'corner' ? speffz(i).letter : null })],
  ];
  return { html: page('Entraînement', `<div class="cards">${items.map(([h, t, d, th]) => `<a class="card trainer" href="${h}"><div class="thumb">${th}</div><b>${t}</b><span>${d}</span></a>`).join('')}</div>`) };
}

function flashView(params) {
  const mode = params.get('set') || 'all';
  const srs = store.srs();
  const poolOf = (m) => {
    if (m === 'pll' || m === 'oll2') return ALL_CASES.filter((c) => c.set === m);
    if (m === 'favs') return [...store.favs()].map(caseById).filter(Boolean);
    if (m === 'due') return ALL_CASES.filter((c) => srs[c.id] && isDue(srs, c.id));
    return ALL_CASES;
  };
  const pool = poolOf(mode);
  const chip = (m, l) => `<a class="chip ${mode === m ? 'on' : ''}" href="#/train/flash?set=${m}">${l}</a>`;
  const head = `<div class="chips">${chip('all', 'Tout')}${chip('pll', 'PLL')}${chip('oll2', 'OLL 2-look')}${chip('favs', 'Favoris')}${chip('due', 'À réviser')}</div>`;
  if (!pool.length) {
    return { html: page('Cartes', head + `<div class="empty"><p>Aucune carte dans cette sélection.</p></div>`, { back: '#/train' }) };
  }
  return {
    html: page('Cartes', head + '<div id="flash"></div>', { back: '#/train' }),
    mount(el) {
      const box = $('#flash', el);
      let cur = null, shown = false;
      const mastered = () => pool.filter((c) => isMastered(store.srs(), c.id)).length;
      const choose = () => {
        const s = store.srs();
        const due = pool.filter((c) => s[c.id] && isDue(s, c.id) && c !== cur);
        const fresh = pool.filter((c) => !s[c.id] && c !== cur);
        const rest = pool.filter((c) => c !== cur);
        cur = pick(due.length ? due : fresh.length ? fresh : rest.length ? rest : pool);
        shown = false;
        draw();
      };
      const draw = () => {
        const v = caseView(cur);
        const m = mastered();
        box.innerHTML = `
          <div class="progress"><div class="bar"><i style="width:${(m / pool.length) * 100}%"></i></div><span>${m} / ${pool.length} maîtrisés</span></div>
          <div class="flashcard">
            <div class="thumb big">${caseSVG(v.state, v.mode)}</div>
            ${shown
              ? `<p class="eyebrow">${esc(cur.setName)} · ${esc(cur.group)}</p><h2>${esc(cur.name)}</h2><p class="alg-big">${algHTML(cur.alg)}</p>
                 ${v.pre || v.post ? `<p class="muted small">AUF : ${v.pre || '—'} avant · ${v.post || '—'} après</p>` : ''}
                 <div class="grade"><button class="btn bad" data-g="0">Raté</button><button class="btn" data-g="1">Difficile</button><button class="btn good" data-g="2">Facile</button></div>`
              : `<p class="muted">Quel est l’algorithme de ce cas ?</p><button class="btn primary" data-show>Afficher la réponse</button>`}
          </div>`;
      };
      box.addEventListener('click', (e) => {
        if (e.target.closest('[data-show]')) { shown = true; draw(); return; }
        const g = e.target.closest('[data-g]');
        if (g) { store.saveSrs(rate(store.srs(), cur.id, +g.dataset.g)); choose(); }
      });
      choose();
    },
  };
}

function pllQuiz() {
  const cases = ALL_CASES.filter((c) => c.set === 'pll');
  const choices = cases.map((c) => ({ v: c.id, label: esc(c.name) }));
  return {
    html: page('Reconnaissance PLL', '<div id="quiz"></div>', { back: '#/train', sub: 'Quel PLL est-ce ? Le dessus est déjà jaune.' }),
    mount(el) {
      return mountQuiz($('#quiz', el), {
        key: 'pll',
        next() {
          const c = pick(cases);
          const v = caseView(c);
          const st = C.applyAlg(v.state, ['U', "U'", 'U2', ''][rnd(4)] || []);
          return { visual: `<div class="thumb big">${caseSVG(st, 'full')}</div>`, answer: c.id, answerLabel: c.name, choices, cls: 'dense' };
        },
      });
    },
  };
}

function ollQuiz() {
  const cases = ALL_CASES.filter((c) => c.set === 'oll2');
  const choices = cases.map((c) => ({ v: c.id, label: esc(c.name) }));
  return {
    html: page('Reconnaissance OLL', '<div id="quiz"></div>', { back: '#/train', sub: 'Croix (coins grisés) ou coins (croix faite) : nomme le cas.' }),
    mount(el) {
      return mountQuiz($('#quiz', el), {
        key: 'oll',
        next() {
          const c = pick(cases);
          const v = caseView(c);
          const st = C.applyAlg(v.state, ['U', "U'", 'U2', ''][rnd(4)] || []);
          return { visual: `<div class="thumb big">${caseSVG(st, v.mode)}</div>`, answer: c.id, answerLabel: c.name, choices, cls: 'wide' };
        },
      });
    },
  };
}

function cornersQuiz() {
  const colorChoices = PALETTE.map((hex, i) => ({ v: String(i), label: `<i class="dot" style="background:${hex}"></i><span>${COLOR_NAMES[i]}</span>` }));
  return {
    html: page('Déduction de coin', '<div class="legend">Blanc en bas · Vert devant · Jaune en haut</div><div id="quiz"></div>', { back: '#/train', sub: 'Deux couleurs d’un coin sont visibles. Quelle est la troisième ?' }),
    mount(el) {
      return mountQuiz($('#quiz', el), {
        key: 'corners',
        next() {
          const st = C.applyAlg(C.solved(), C.randomScramble(25));
          const corner = pick(C.CORNERS);
          const hide = pick(corner);
          const reveal = new Set(corner.filter((s) => s !== hide));
          return {
            visual: `<div class="net-wrap">${netSVG(st, { reveal, hide, mark: [...reveal][0], label: 'Coin partiellement visible' })}</div>`,
            answer: String(st[hide]), answerLabel: COLOR_NAMES[st[hide]], choices: colorChoices, cls: 'colors',
          };
        },
      });
    },
  };
}

function speffzQuiz(params) {
  const type = params.get('type') === 'edge' ? 'edge' : 'corner';
  const letters = [...'ABCDEFGHIJKLMNOPQRSTUVWX'];
  const choices = letters.map((l) => ({ v: l, label: l }));
  const slots = C.SLOTS.map((_, i) => i).filter((i) => speffz(i)?.type === type);
  const chip = (t, l) => `<a class="chip ${type === t ? 'on' : ''}" href="#/train/speffz?type=${t}">${l}</a>`;
  return {
    html: page('Lettrage Speffz', `<div class="chips">${chip('corner', 'Coins')}${chip('edge', 'Arêtes')}</div>
      <button class="btn small" id="cheat">Afficher le schéma</button><div id="cheatnet" hidden class="net-wrap"></div><div id="quiz"></div>`, { back: '#/train', sub: 'Quelle lettre porte l’autocollant entouré ?' }),
    mount(el) {
      $('#cheat', el).addEventListener('click', () => {
        const box = $('#cheatnet', el);
        box.hidden = !box.hidden;
        if (!box.hidden) box.innerHTML = netSVG(C.solved(), { labels: (i) => (speffz(i)?.type === type ? speffz(i).letter : null) });
      });
      return mountQuiz($('#quiz', el), {
        key: 'speffz-' + type,
        next() {
          const slot = pick(slots);
          return { visual: `<div class="net-wrap">${netSVG(C.solved(), { mark: slot, label: 'Autocollant à nommer' })}</div>`, answer: speffz(slot).letter, choices, cls: 'letters' };
        },
      });
    },
  };
}

// ---------- Réglages ----------
function settingsView() {
  const s = store.settings();
  const opt = (v, l) => `<option value="${v}" ${s.theme === v ? 'selected' : ''}>${l}</option>`;
  const html = `
    <div class="card form">
      <label>Thème <select id="theme">${opt('auto', 'Automatique')}${opt('light', 'Clair')}${opt('dark', 'Sombre')}</select></label>
      <label class="check"><input type="checkbox" id="insp" ${s.inspection ? 'checked' : ''}> Inspection de 15 secondes avant chaque résolution</label>
    </div>
    <div class="card form">
      <h3>Installer l’application</h3>
      <p class="muted">Ajoute CubeDojo à l’écran d’accueil pour l’utiliser comme une vraie application, même sans connexion.</p>
      <button class="btn primary" id="install" ${deferredInstall ? '' : 'hidden'}>${icons.download} Installer</button>
      <p class="muted small" id="iosnote">${deferredInstall ? '' : 'Sur iPhone / iPad : bouton Partager, puis « Sur l’écran d’accueil ». Sur ordinateur : icône d’installation dans la barre d’adresse du navigateur.'}</p>
    </div>
    <div class="card form">
      <h3>Données</h3>
      <p class="muted">Tout est stocké sur cet appareil : résolutions, favoris et progression des cartes.</p>
      <div class="row">
        <button class="btn" id="export">${icons.download} Exporter</button>
        <label class="btn" for="import">Importer</label><input type="file" id="import" accept="application/json" hidden>
        <button class="btn bad" id="wipe">${icons.trash} Tout effacer</button>
      </div>
    </div>
    <p class="muted center small">CubeDojo · simulateur et algorithmes vérifiés par tests · v1.0</p>`;
  return {
    html: page('Réglages', html),
    mount(el) {
      $('#theme', el).addEventListener('change', (e) => { store.saveSettings({ ...store.settings(), theme: e.target.value }); applyTheme(); });
      $('#insp', el).addEventListener('change', (e) => store.saveSettings({ ...store.settings(), inspection: e.target.checked }));
      $('#install', el).addEventListener('click', async () => {
        if (!deferredInstall) return;
        deferredInstall.prompt();
        await deferredInstall.userChoice;
        deferredInstall = null;
        route();
      });
      $('#export', el).addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(store.exportAll(), null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `cubedojo-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
      $('#import', el).addEventListener('change', async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        try { store.importAll(JSON.parse(await f.text())); applyTheme(); toast('Données importées'); route(); }
        catch { toast('Fichier invalide'); }
      });
      $('#wipe', el).addEventListener('click', () => {
        if (confirm('Effacer toutes les données (résolutions, favoris, progression) ?')) { store.clearAll(); applyTheme(); toast('Données effacées'); route(); }
      });
    },
  };
}

const notFound = () => ({ html: page('Introuvable', `<div class="empty"><p>Cette page n’existe pas.</p><a class="btn primary" href="#/">Retour à l’accueil</a></div>`) });

// ---------- Toast ----------
let toastTimer;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ---------- Recherche (Ctrl+K) ----------
const searchDlg = $('#search');
function openSearch() {
  searchDlg.showModal?.();
  $('#q').value = '';
  renderResults('');
  $('#q').focus();
}
function renderResults(q) {
  const n = q.trim().toLowerCase();
  const list = n ? ALL_CASES.filter((c) => c.name.toLowerCase().includes(n) || c.alg.toLowerCase().includes(n) || c.group.toLowerCase().includes(n) || c.setName.toLowerCase().includes(n)) : ALL_CASES.slice(0, 8);
  $('#results').innerHTML = list.length
    ? list.map((c) => `<a href="${caseHref(c)}" data-close><div class="thumb">${thumb(c)}</div><span><b>${esc(c.name)}</b><em>${esc(c.setName)} · ${esc(c.group)}</em></span></a>`).join('')
    : '<p class="muted center">Aucun résultat.</p>';
}
$('#q').addEventListener('input', (e) => renderResults(e.target.value));
$('#results').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) searchDlg.close(); });
$('#search-btn').addEventListener('click', openSearch);
$('#search-close').addEventListener('click', () => searchDlg.close());
searchDlg.addEventListener('click', (e) => { if (e.target === searchDlg) searchDlg.close(); });
addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
});

// ---------- Actions globales (favoris, copie) ----------
root.addEventListener('click', async (e) => {
  const f = e.target.closest('[data-fav]');
  if (f) {
    const on = store.toggleFav(f.dataset.fav);
    f.classList.toggle('on', on);
    f.setAttribute('aria-pressed', on);
    toast(on ? 'Ajouté aux favoris' : 'Retiré des favoris');
    return;
  }
  const c = e.target.closest('[data-copy]');
  if (c) {
    try { await navigator.clipboard.writeText(c.dataset.copy); toast('Algorithme copié'); } catch { toast('Copie impossible'); }
  }
});

// ---------- Routeur ----------
function route() {
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  document.body.classList.remove('timing');
  const [path, query = ''] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(query);
  const p = path.split('/').filter(Boolean);
  let v;
  try {
    if (!p.length) v = homeView();
    else if (p[0] === 'algos') v = p.length === 1 ? algosIndex() : p.length === 2 ? setView(p[1]) : caseView_(p[1], p[2]);
    else if (p[0] === 'favs') v = favsView();
    else if (p[0] === 'train') {
      if (!p[1]) v = trainIndex();
      else if (p[1] === 'flash') v = flashView(params);
      else if (p[1] === 'pll') v = pllQuiz();
      else if (p[1] === 'oll') v = ollQuiz();
      else if (p[1] === 'corners') v = cornersQuiz();
      else if (p[1] === 'speffz') v = speffzQuiz(params);
      else v = notFound();
    } else if (p[0] === 'timer') v = timerView({ page, statTile, toast });
    else if (p[0] === 'guides') v = p.length === 1 ? guideIndex({ page }) : guideView(p[1], { page });
    else if (p[0] === 'settings') v = settingsView();
    else v = notFound();
  } catch (err) {
    console.error(err);
    v = { html: page('Oups', `<div class="empty"><p>Une erreur est survenue.</p><pre>${esc(err.message)}</pre></div>`) };
  }
  root.innerHTML = v.html;
  const r = v.mount?.(root);
  if (typeof r === 'function') cleanup = r;
  if (v.cleanup) cleanup = v.cleanup;
  hydratePlayers(root);
  window.scrollTo(0, 0);
  const section = p[0] || 'home';
  $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === section));
  document.title = 'CubeDojo' + (section === 'home' ? '' : ' · ' + ({ algos: 'Algorithmes', train: 'Entraînement', timer: 'Chrono', guides: 'Guides', favs: 'Favoris', settings: 'Réglages' }[section] || ''));
}

addEventListener('hashchange', route);
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });
addEventListener('appinstalled', () => { deferredInstall = null; toast('Application installée'); });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
route();
