import * as C from './cube.js';
import { netSVG } from './render.js';
import { store, fmt, fmtSolve, eff, summary, aoN } from './store.js';
import { $, $$, esc, icons } from './ui.js';

const HOLD_MS = 300;

function chartSVG(solves) {
  const data = solves.slice(-50);
  const vals = data.map(eff);
  const ok = vals.filter((v) => v !== Infinity);
  if (data.length < 2 || !ok.length) return '<p class="muted center small">La courbe apparaît après deux résolutions.</p>';
  const W = 320, H = 130, pl = 34, pr = 8, pt = 8, pb = 16;
  const lo = Math.min(...ok), hi = Math.max(...ok);
  const span = Math.max(hi - lo, 500);
  const y = (v) => pt + (1 - (v - lo) / span) * (H - pt - pb);
  const x = (i) => pl + (i / (data.length - 1)) * (W - pl - pr);
  const pts = vals.map((v, i) => (v === Infinity ? null : [x(i), y(v)]));
  const line = pts.filter(Boolean).map((p) => p.join(',')).join(' ');
  const avgPts = data.map((_, i) => {
    const a = aoN(solves, 5, solves.length - data.length + i + 1);
    return a === null || a === Infinity ? null : [x(i), y(a)];
  }).filter(Boolean).map((p) => p.join(',')).join(' ');
  const ticks = [lo, lo + span / 2, lo + span];
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Évolution des temps">
    ${ticks.map((t) => `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}" class="grid"/><text x="${pl - 4}" y="${y(t) + 3}" text-anchor="end" class="axis">${fmt(t, 1)}</text>`).join('')}
    <polyline points="${line}" class="l-solve"/>
    ${pts.map((p) => (p ? `<circle cx="${p[0]}" cy="${p[1]}" r="2.2" class="dot-solve"/>` : '')).join('')}
    ${avgPts ? `<polyline points="${avgPts}" class="l-avg"/>` : ''}
  </svg>
  <p class="legend-line"><i class="k-solve"></i>Résolutions <i class="k-avg"></i>Moyenne de 5</p>`;
}

export function timerView({ page, statTile, toast }) {
  const html = page('Chrono', `
    <div class="scramble-bar">
      <p class="scramble" id="scr" aria-live="polite"></p>
      <div class="row tight">
        <button class="ib" id="newscr" aria-label="Nouveau mélange">${icons.refresh}</button>
        <button class="ib" id="togglenet" aria-label="Voir le cube mélangé" aria-pressed="false">${icons.net}</button>
      </div>
    </div>
    <div id="netwrap" class="net-wrap" hidden></div>
    <div class="timer-pad" id="pad" tabindex="0" role="button" aria-label="Zone du chrono">
      <div id="tdisp" class="tdisp">0.00</div>
      <p class="thint" id="thint"></p>
    </div>
    <div class="last-actions" id="last" hidden>
      <button class="btn small" data-pen="2">+2</button>
      <button class="btn small" data-pen="dnf">DNF</button>
      <button class="btn small" data-pen="0">OK</button>
      <button class="btn small bad" data-del>${icons.trash}</button>
    </div>
    <div id="stats"></div>
    <dialog id="solve-dlg" class="dlg"></dialog>`);

  return {
    html,
    mount(el) {
      let solves = store.solves();
      let state = 'idle'; // idle | holding | ready | inspecting | running | stopped
      let scramble = '';
      let holdTimer = null, raf = 0, t0 = 0, inspT0 = 0, inspMs = 0, wasInspecting = false, ignoreRelease = false, pressedOnPad = false, wake = null;
      const settings = store.settings();
      const disp = $('#tdisp', el), pad = $('#pad', el), hint = $('#thint', el);

      const setHint = () => {
        hint.textContent = {
          idle: settings.inspection ? 'Appuie pour lancer l’inspection' : 'Maintiens la barre espace (ou l’écran), puis relâche',
          holding: 'Garde appuyé…',
          ready: 'Relâche pour partir !',
          inspecting: 'Inspection — maintiens, puis relâche pour partir',
          running: 'Touche pour arrêter',
          stopped: 'Maintiens à nouveau pour une nouvelle résolution',
        }[state];
      };
      const setState = (s) => {
        state = s;
        pad.dataset.state = s;
        document.body.classList.toggle('timing', s === 'running');
        setHint();
      };

      // ----- mélange -----
      const newScramble = () => {
        scramble = C.randomScramble(20);
        $('#scr', el).textContent = scramble;
        const w = $('#netwrap', el);
        if (!w.hidden) w.innerHTML = netSVG(C.applyAlg(C.solved(), scramble), { label: 'Cube mélangé' });
      };

      // ----- boucle d'affichage -----
      const tick = () => {
        if (state === 'running') {
          disp.textContent = fmt(performance.now() - t0, 2);
          raf = requestAnimationFrame(tick);
        } else if (state === 'inspecting' || (state === 'holding' && wasInspecting) || (state === 'ready' && wasInspecting)) {
          const e = (performance.now() - inspT0) / 1000;
          disp.textContent = e < 15 ? String(Math.ceil(15 - e)) : e < 17 ? '+2' : 'DNF';
          raf = requestAnimationFrame(tick);
        }
      };

      const lockScreen = async () => { try { wake = await navigator.wakeLock?.request('screen'); } catch { wake = null; } };
      const unlock = () => { try { wake?.release(); } catch { /* ignore */ } wake = null; };

      // ----- logique principale -----
      const startInspection = () => {
        wasInspecting = true;
        inspT0 = performance.now();
        setState('inspecting');
        cancelAnimationFrame(raf);
        tick();
      };
      const startSolve = () => {
        if (wasInspecting) inspMs = performance.now() - inspT0;
        else inspMs = 0;
        t0 = performance.now();
        setState('running');
        $('#last', el).hidden = true;
        lockScreen();
        cancelAnimationFrame(raf);
        tick();
      };
      const stop = () => {
        const t = performance.now() - t0;
        cancelAnimationFrame(raf);
        unlock();
        const e = inspMs / 1000;
        const pen = wasInspecting ? (e > 17 ? 'dnf' : e > 15 ? 2000 : 0) : 0;
        wasInspecting = false;
        const solve = { t: Math.round(t), pen, scr: scramble, ts: Date.now() };
        solves.push(solve);
        store.saveSolves(solves);
        disp.textContent = fmtSolve(solve);
        setState('stopped');
        $('#last', el).hidden = false;
        newScramble();
        renderStats();
      };
      const press = () => {
        if (state === 'running') { stop(); ignoreRelease = true; return; }
        if (state === 'idle' || state === 'stopped') {
          if (settings.inspection) { startInspection(); ignoreRelease = true; return; }
          setState('holding');
          disp.textContent = '0.00';
          holdTimer = setTimeout(() => setState('ready'), HOLD_MS);
        } else if (state === 'inspecting') {
          setState('holding');
          holdTimer = setTimeout(() => { setState('ready'); }, HOLD_MS);
        }
      };
      const release = () => {
        if (ignoreRelease) { ignoreRelease = false; return; }
        if (state === 'ready') startSolve();
        else if (state === 'holding') {
          clearTimeout(holdTimer);
          if (wasInspecting) { setState('inspecting'); tick(); } else setState(solves.length ? 'stopped' : 'idle');
        }
      };
      const cancel = () => {
        clearTimeout(holdTimer);
        cancelAnimationFrame(raf);
        wasInspecting = false;
        setState(solves.length ? 'stopped' : 'idle');
        disp.textContent = solves.length ? fmtSolve(solves[solves.length - 1]) : '0.00';
      };

      // ----- événements -----
      const onKeyDown = (e) => {
        if (el.querySelector('#solve-dlg[open]')) return;
        if (e.target.closest?.('input, select, textarea')) return;
        if (e.code === 'Space') {
          e.preventDefault();
          if (!e.repeat) press();
        } else if (e.code === 'Escape') {
          if (state === 'inspecting' || state === 'holding' || state === 'ready') cancel();
        } else if (state === 'running' && !e.repeat && !e.metaKey && !e.ctrlKey) {
          stop();
        }
      };
      const onKeyUp = (e) => { if (e.code === 'Space') { e.preventDefault(); release(); } };
      const onPointerDown = (e) => {
        if (state === 'running') { e.preventDefault(); pressedOnPad = true; press(); return; }
        if (e.target.closest('#pad')) { e.preventDefault(); pressedOnPad = true; press(); }
      };
      const onPointerUp = () => { if (pressedOnPad) { pressedOnPad = false; release(); } };
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);

      $('#newscr', el).addEventListener('click', newScramble);
      $('#togglenet', el).addEventListener('click', (e) => {
        const w = $('#netwrap', el);
        w.hidden = !w.hidden;
        e.currentTarget.setAttribute('aria-pressed', String(!w.hidden));
        if (!w.hidden) w.innerHTML = netSVG(C.applyAlg(C.solved(), scramble), { label: 'Cube mélangé' });
      });

      // pénalités sur la dernière résolution
      $('#last', el).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b || !solves.length) return;
        const s = solves[solves.length - 1];
        if (b.hasAttribute('data-del')) { solves.pop(); $('#last', el).hidden = true; disp.textContent = '0.00'; }
        else s.pen = b.dataset.pen === 'dnf' ? 'dnf' : +b.dataset.pen;
        store.saveSolves(solves);
        if (!b.hasAttribute('data-del')) disp.textContent = fmtSolve(s);
        renderStats();
      });

      // ----- statistiques + historique -----
      const dlg = $('#solve-dlg', el);
      const openSolve = (i) => {
        const s = solves[i];
        dlg.innerHTML = `
          <h3>Résolution n° ${i + 1}</h3>
          <p class="big-time">${fmtSolve(s)}</p>
          <p class="scramble small">${esc(s.scr || '')}</p>
          <p class="muted small">${new Date(s.ts).toLocaleString('fr-BE')}</p>
          <div class="row"><button class="btn small" data-p="0">OK</button><button class="btn small" data-p="2000">+2</button><button class="btn small" data-p="dnf">DNF</button><button class="btn small bad" data-d>${icons.trash} Supprimer</button></div>
          <button class="btn" data-close>Fermer</button>`;
        dlg.showModal();
        dlg.onclick = (e) => {
          if (e.target === dlg || e.target.closest('[data-close]')) return dlg.close();
          const b = e.target.closest('button');
          if (!b) return;
          if (b.hasAttribute('data-d')) solves.splice(i, 1);
          else s.pen = b.dataset.p === 'dnf' ? 'dnf' : +b.dataset.p;
          store.saveSolves(solves);
          dlg.close();
          renderStats();
        };
      };
      const renderStats = () => {
        const s = summary(solves);
        const f = (v) => (v === null ? '–' : fmt(v));
        const recent = solves.map((x, i) => [x, i]).slice(-40).reverse();
        $('#stats', el).innerHTML = `
          <div class="tiles">
            ${statTile('Meilleur', f(s.best))}
            ${statTile('Ao5', f(s.ao5), s.bestAo5 !== null ? 'meilleur ' + fmt(s.bestAo5) : '')}
            ${statTile('Ao12', f(s.ao12), s.bestAo12 !== null ? 'meilleur ' + fmt(s.bestAo12) : '')}
            ${statTile('Moyenne', f(s.mean), s.count + ' résolutions')}
          </div>
          ${s.ao100 !== null ? `<p class="muted center small">Ao100 : <b>${f(s.ao100)}</b></p>` : ''}
          <div class="card">${chartSVG(solves)}</div>
          <div class="card">
            <div class="row between"><h3>Historique</h3>${solves.length ? `<button class="btn small bad" id="clear">${icons.trash} Effacer</button>` : ''}</div>
            ${recent.length ? `<ol class="history">${recent.map(([x, i]) => `<li><button data-i="${i}"><span class="n">${i + 1}</span><span class="t ${x.pen === 'dnf' ? 'dnf' : ''}">${fmtSolve(x)}</span></button></li>`).join('')}</ol>` : '<p class="muted center">Aucune résolution pour l’instant.</p>'}
          </div>`;
        $('#clear', el)?.addEventListener('click', () => {
          if (confirm('Effacer toutes les résolutions ?')) { solves = []; store.saveSolves(solves); disp.textContent = '0.00'; $('#last', el).hidden = true; setState('idle'); renderStats(); toast('Résolutions effacées'); }
        });
        $$('.history button', el).forEach((b) => b.addEventListener('click', () => openSolve(+b.dataset.i)));
      };

      newScramble();
      setState('idle');
      if (solves.length) { disp.textContent = fmtSolve(solves[solves.length - 1]); setState('stopped'); $('#last', el).hidden = false; }
      renderStats();

      return () => {
        clearTimeout(holdTimer);
        cancelAnimationFrame(raf);
        unlock();
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);
        document.body.classList.remove('timing');
      };
    },
  };
}
