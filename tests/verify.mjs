// Vérifie le moteur et chaque algorithme de la base. Lancer : node tests/verify.mjs
import * as C from '../js/cube.js';
import { SETS } from '../js/data.js';

let failures = 0;
const ok = (cond, msg) => {
  if (!cond) { failures++; console.log('  ✗ ' + msg); }
};

// ---------- Moteur ----------
const S = C.solved();
ok(C.isSolved(S), 'état résolu');
for (const m of 'UDRLFBMESudrlfbxyz') {
  ok(C.isSolved(C.applyAlg(S, `${m} ${m} ${m} ${m}`)), `${m}^4 = identité`);
  ok(C.isSolved(C.applyAlg(C.applyAlg(S, m), m + "'")), `${m} ${m}' = identité`);
}
ok(C.isSolved(C.applyAlg(S, "R U R' U' ".repeat(6))), 'sexy move d’ordre 6');
ok(C.equal(C.applyAlg(S, 'x'), C.applyAlg(S, "R M' L'")), 'x = R M\' L\'');
ok(C.equal(C.applyAlg(S, 'y'), C.applyAlg(S, "U E' D'")), 'y = U E\' D\'');
ok(C.equal(C.applyAlg(S, 'z'), C.applyAlg(S, "F S B'")), 'z = F S B\'');
ok(C.equal(C.applyAlg(S, 'r'), C.applyAlg(S, "R M'")), 'r = R M\'');
ok(C.equal(C.applyAlg(S, 'Rw'), C.applyAlg(S, 'r')), 'Rw = r');
for (let i = 0; i < 20; i++) {
  const scr = C.randomScramble(25);
  ok(C.isSolved(C.applyAlg(C.applyAlg(S, scr), C.invertAlg(scr))), 'scramble puis inverse');
}
// U : F -> L (sens horaire vu du dessus)
{
  const s = C.applyAlg(S, 'U');
  const fTopLeft = C.SLOTS.findIndex((x) => x.face === 'L' && x.r === 0 && x.c === 0);
  ok(s[fTopLeft] === 2, 'U envoie F vers L');
  const s2 = C.applyAlg(S, 'R');
  const uSlot = C.SLOTS.findIndex((x) => x.face === 'U' && x.r === 2 && x.c === 2);
  ok(s2[uSlot] === 2, 'R envoie F vers U');
}

// ---------- Outils d'analyse du dernier étage ----------
const homeOf = new Map(); // "couleurs triées" -> index de cubie
const cubies = [...C.CORNERS, ...C.EDGES];
cubies.forEach((slots, i) => homeOf.set(slots.map((s) => C.SLOTS[s].fi).sort().join(), i));

const llCorners = C.CORNERS.filter((c) => C.SLOTS[c[0]].p[1] === 1);
const llEdges = C.EDGES.filter((c) => C.SLOTS[c[0]].p[1] === 1);

function permOf(state, list) {
  // pour chaque emplacement de list, quel emplacement de list contient la pièce qui y est
  return list.map((slots) => {
    const id = homeOf.get(slots.map((s) => state[s]).sort().join());
    return list.findIndex((l) => homeOf.get(l.map((s) => C.SLOTS[s].fi).sort().join()) === id);
  });
}
function cycleType(p) {
  const seen = new Set();
  const cyc = [];
  p.forEach((_, i) => {
    if (seen.has(i)) return;
    let len = 0, j = i;
    while (!seen.has(j)) { seen.add(j); j = p[j]; len++; }
    if (len > 1) cyc.push(len);
  });
  return cyc.sort().join('+') || 'id';
}
const f2lIntact = (st) => C.SLOTS.every((s, i) => !(s.face === 'D' || (s.face !== 'U' && s.r >= 1)) || st[i] === s.fi);
const uFace = (st) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (st[i] === 0 ? 1 : 0));

// ---------- Algorithmes ----------
const EXPECT_PLL = {
  Ua: ['id', '3'], Ub: ['id', '3'], H: ['id', '2+2'], Z: ['id', '2+2'],
  Aa: ['3', 'id'], Ab: ['3', 'id'], E: ['2+2', 'id'],
  T: ['2', '2'], F: ['2', '2'], Ja: ['2', '2'], Jb: ['2', '2'], Ra: ['2', '2'], Rb: ['2', '2'],
  Y: ['2', '2'], V: ['2', '2'], Na: ['2', '2'], Nb: ['2', '2'],
  Ga: ['3', '3'], Gb: ['3', '3'], Gc: ['3', '3'], Gd: ['3', '3'],
};
const diagonal = (p) => { // le seul échange de coins est-il diagonal ? (indices de llCorners : UBL, UBR, UFL, UFR)
  const moved = p.map((v, i) => (v !== i ? i : -1)).filter((i) => i >= 0);
  const pos = moved.map((i) => C.SLOTS[llCorners[i][0]].p);
  return pos.length === 2 && Math.abs(pos[0][0] - pos[1][0]) === 2 && Math.abs(pos[0][2] - pos[1][2]) === 2;
};
const GROUP_DIAG = { 'Échange de coins diagonaux': true, 'Échange de coins adjacents': false };

const seen = new Map();
for (const set of SETS) {
  console.log(`\n${set.name}`);
  for (const c of set.cases) {
    let line = `  ${c.name.padEnd(12)}`;
    try {
      const before = C.caseState(c.alg);
      const after = C.applyAlg(S, c.alg);
      const end = C.normalizeOrientation(C.applyAlg(before, c.alg));
      ok(C.isSolved(end), `${c.name} : l'algo ne résout pas son propre cas`);
      ok(f2lIntact(C.normalizeOrientation(after)), `${c.name} : casse les deux premières couches`);
      ok(!C.isSolved(C.normalizeOrientation(after)), `${c.name} : ne fait rien`);

      if (set.id === 'pll') {
        const cc = C.canonicalCase(c.alg);
        const ws = C.normalizeOrientation(C.applyAlg(S, cc.w));
        ok(uFace(ws).every((v) => v === 1), `${c.name} : désoriente le dernier étage`);
        const cp = permOf(ws, llCorners), ep = permOf(ws, llEdges);
        const ct = cycleType(cp), et = cycleType(ep);
        line += ` AUF[${cc.pre || '-'} | ${cc.post || '-'}]`.padEnd(14) + ` coins:${ct.padEnd(4)} arêtes:${et.padEnd(4)}`;
        const [ec, ee] = EXPECT_PLL[c.name];
        ok(ct === ec && et === ee, `${c.name} : attendu coins ${ec} / arêtes ${ee}`);
        if (c.group in GROUP_DIAG && ct === '2') ok(diagonal(cp) === GROUP_DIAG[c.group], `${c.name} : mauvais groupe (diagonal/adjacent)`);
        // forme canonique = minimum sur AUF et conjugaison par y
        let best = null;
        const Y = ['', 'y', 'y2', "y'"], Yi = ['', "y'", 'y2', 'y'];
        for (let k = 0; k < 4; k++) for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
          const w = `${Y[k]} ${'U '.repeat(a)} ${c.alg} ${'U '.repeat(b)} ${Yi[k]}`;
          const key = C.normalizeOrientation(C.applyAlg(S, w)).join('');
          if (best === null || key < best) best = key;
        }
        if (seen.has(best)) { failures++; console.log(`  ✗ ${c.name} identique à ${seen.get(best)}`); }
        seen.set(best, c.name);
        for (const alt of c.alts) {
          const same = C.equal(C.normalizeOrientation(C.applyAlg(S, alt)), C.normalizeOrientation(after));
          ok(same, `${c.name} : variante « ${alt} » ≠ algo principal`);
        }
      } else {
        const top = uFace(C.normalizeOrientation(before));
        const ey = [1, 3, 5, 7].filter((i) => top[i]).length;
        const cy = [0, 2, 6, 8].filter((i) => top[i]);
        line += ` arêtes jaunes:${ey} coins jaunes:${cy.join('') || '-'}`;
        const expect = { dot: [0, null], line: [2, null], l: [2, null], sune: [4, 1], antisune: [4, 1], h: [4, 0], pi: [4, 0], t: [4, 2], u: [4, 2], lc: [4, 2] }[c.id.slice(5)];
        ok(ey === expect[0], `${c.name} : arêtes orientées attendues ${expect[0]}`);
        if (expect[1] !== null) ok(cy.length === expect[1], `${c.name} : coins orientés attendus ${expect[1]}`);
        if (c.id === 'oll2-lc') ok(cy.join('') === '08' || cy.join('') === '26', `${c.name} : les coins jaunes devraient être en diagonale`);
        if (c.id === 'oll2-t' || c.id === 'oll2-u') ok(['02', '28', '68', '06'].includes(cy.join('')), `${c.name} : les coins jaunes devraient être adjacents`);
        ok(uFace(end).every((v) => v === 1), `${c.name} : ne termine pas la face jaune`);
      }
    } catch (e) {
      failures++;
      line += ' ERREUR ' + e.message;
    }
    console.log(line);
  }
}

// ---------- Méthode débutant ----------
console.log('\nMéthode débutant');
{
  const bottomIntact = (st) => C.SLOTS.every((sl, i) => !(sl.face === 'D' || (sl.face !== 'U' && sl.r === 2)) || st[i] === sl.fi);
  const midEdgesDisplaced = (st) => C.EDGES.filter((e) => C.SLOTS[e[0]].p[1] === 0 && e.some((sl) => st[sl] !== C.SLOTS[sl].fi)).length;
  for (const [name, alg] of [['arête droite', "U R U' R' U' F' U F"], ['arête gauche', "U' L' U L U F U' F'"]]) {
    const st = C.applyAlg(S, alg);
    ok(bottomIntact(st), `${name} : touche la première couche`);
    console.log(`  ${name.padEnd(14)} arêtes du milieu déplacées : ${midEdgesDisplaced(st)}`);
  }
  const corners = "R' F R' B2 R F' R' B2 R2";
  const st = C.applyAlg(S, corners);
  ok(f2lIntact(st), 'permutation des coins : touche F2L');
  ok(uFace(st).every((v) => v === 1), 'permutation des coins : désoriente');
  const cy = C.llCycles(st);
  console.log(`  permutation des coins  coins:${cy.c.join('+') || 'id'} arêtes:${cy.e.join('+') || 'id'}`);
  ok(cy.c.join() === '3' && cy.e.length === 0, 'permutation des coins : doit être un 3-cycle de coins seuls');
  const cross = C.applyAlg(S, "F R U R' U' F'");
  ok(f2lIntact(cross), 'croix jaune : touche F2L');
}

console.log(failures ? `\n${failures} échec(s)` : '\nTout est vérifié ✓');
process.exit(failures ? 1 : 0);
