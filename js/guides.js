import { esc, icons, algHTML, playerHTML } from './ui.js';

const step = (n, title, body) => `<section class="gstep"><span class="num">${n}</span><div><h2>${title}</h2>${body}</div></section>`;
const alg = (a, label = '') => `<div class="card alg-card">${label ? `<h3>${label}</h3>` : ''}<p class="alg-big">${algHTML(a)}</p>${playerHTML({ alg: a })}</div>`;

const GUIDES = [
  {
    id: 'beginner',
    title: 'Résoudre le Rubik’s Cube',
    blurb: 'Ta première résolution, couche par couche, avec sept algorithmes à retenir.',
    time: '1 à 2 h',
    body: () => `
      <p class="lead small">La méthode « couche par couche » demande peu d’algorithmes. Tiens le cube avec le <b>blanc en bas</b> à partir de l’étape 3 : c’est la convention de CubeDojo.</p>
      ${step(1, 'Lire la notation', `
        <p>Chaque lettre est une face qu’on tourne d’un quart de tour <b>dans le sens des aiguilles d’une montre</b>, en regardant cette face :</p>
        <p><span class="mv">R</span> droite · <span class="mv">L</span> gauche · <span class="mv">U</span> dessus · <span class="mv">D</span> dessous · <span class="mv">F</span> devant · <span class="mv">B</span> derrière.</p>
        <p>Une apostrophe (<span class="mv">R'</span>) inverse le sens ; un 2 (<span class="mv">R2</span>) fait un demi-tour. Les minuscules (<span class="mv">r</span>, <span class="mv">f</span>) tournent la face et la tranche du milieu ; <span class="mv">M</span> est la tranche entre L et R ; <span class="mv">x y z</span> font pivoter tout le cube.</p>
        ${alg("R U R' U'", 'Exemple : le « sexy move »')}`)}
      ${step(2, 'La croix blanche', `
        <p>Place les quatre arêtes blanches autour du centre blanc, chacune alignée avec le centre de sa couleur sur le côté. Il n’y a pas d’algorithme : bouge le cube, observe, et réfléchis à deux ou trois coups à l’avance.</p>
        <p class="tip">Astuce : commence par la croix sur le dessus, puis retourne le cube pour mettre le blanc en bas.</p>`)}
      ${step(3, 'Les coins blancs', `
        <p>Chaque coin blanc se met dans son emplacement en bas à droite (devant), juste sous sa position. Amène-le au-dessus de son emplacement, puis répète l’algorithme jusqu’à ce que le coin soit bien orienté (1, 3 ou 5 fois).</p>
        ${alg("R' D' R D", 'Insérer un coin')}
        <p class="tip">Si le coin est déjà dans la couche du bas mais mal placé, fais l’algorithme une fois pour le faire ressortir.</p>`)}
      ${step(4, 'La deuxième couche', `
        <p>Retourne le cube : le blanc en bas, face jaune vers le haut. Cherche une arête du dessus qui n’a <b>pas</b> de jaune, aligne sa couleur de devant avec le centre de la même couleur, puis :</p>
        ${alg("U R U' R' U' F' U F", 'Arête vers la droite')}
        ${alg("U' L' U L U F U' F'", 'Arête vers la gauche')}
        <p class="tip">Si aucune arête n’est utilisable mais que la deuxième couche n’est pas finie, fais l’un des algorithmes sur une arête mal placée pour la sortir.</p>`)}
      ${step(5, 'La croix jaune', `
        <p>Regarde les arêtes jaunes du dessus. Tu verras un <b>point</b>, un <b>L</b> ou une <b>ligne</b>. Tiens le cube comme sur la page « OLL 2-look » et refais l’algorithme jusqu’à obtenir la croix.</p>
        ${alg("F R U R' U' F'", 'Ligne ou L → croix')}
        <p><a class="btn small" href="#/algos/oll2">Voir les cas dans le détail ${icons.arrow}</a></p>`)}
      ${step(6, 'Les coins jaunes', `
        <p>Avec la croix faite, oriente les coins pour que le dessus soit tout jaune. Place le cube avec un coin jaune en bas à gauche du dessus (ou n’importe lequel s’il n’y en a aucun), et répète le Sune jusqu’à ce que la face soit jaune. Entre deux séries, ne bouge que la face U.</p>
        ${alg("R U R' U R U2 R'", 'Sune')}
        <p class="tip">Les coins du bas peuvent sembler cassés pendant l’algorithme : c’est normal, ils reviennent à la fin de la série.</p>`)}
      ${step(7, 'Placer les coins', `
        <p>Tourne U jusqu’à trouver deux coins voisins dont les couleurs du côté sont bonnes (il suffit qu’ils soient à la bonne place l’un par rapport à l’autre). Si les quatre sont bons, passe à l’étape suivante. Sinon, mets un coin bien placé en haut à droite derrière et fais :</p>
        ${alg("R' F R' B2 R F' R' B2 R2", 'Permutation des coins (Aa)')}
        <p>Si aucun coin n’est bien placé, fais l’algorithme une fois dans n’importe quelle position puis recommence.</p>`)}
      ${step(8, 'Placer les arêtes', `
        <p>Dernière étape : trois arêtes tournent en cycle. Mets l’arête déjà bien placée à l’arrière et fais l’un des algorithmes ; si le résultat s’éloigne, refais l’autre.</p>
        ${alg("R U' R U R U R U' R' U' R2", 'Cycle de trois arêtes (Ua)')}
        ${alg("R2 U R U R' U' R' U' R' U R'", 'Cycle inverse (Ub)')}
        <p>Si les arêtes sont mal placées de façon plus complexe, fais Ua une fois pour obtenir un cycle de trois. Termine en tournant U.</p>`)}
      <div class="card done"><h3>Bravo !</h3><p>Tu sais maintenant résoudre le cube. Pour descendre sous la minute, apprends d’abord les 2-look OLL et PLL.</p>
        <div class="row"><a class="btn primary" href="#/guides/two-look">Guide 2-look ${icons.arrow}</a><a class="btn" href="#/timer">Chronométrer</a></div></div>`,
  },
  {
    id: 'two-look',
    title: 'OLL & PLL en deux temps',
    blurb: 'Le dernier étage avec seulement 16 cas : 10 pour orienter, 6 pour permuter.',
    time: '1 semaine',
    body: () => `
      <p class="lead small">Au lieu de mémoriser 78 algorithmes, tu divises le dernier étage en deux fois deux regards : d’abord la face jaune (OLL), puis la place des pièces (PLL).</p>
      ${step(1, 'OLL en deux temps', `
        <p>Fais d’abord <b>la croix</b> (trois cas : point, L, ligne), puis <b>les coins</b> (sept cas). Les dix algorithmes sont dans la base avec leur reconnaissance.</p>
        <p><a class="btn" href="#/algos/oll2">Ouvrir OLL 2-look ${icons.arrow}</a> <a class="btn" href="#/train/oll">S’entraîner</a></p>`)}
      ${step(2, 'PLL en deux temps', `
        <p>Les <b>coins</b> d’abord : soit ils sont déjà bons, soit deux coins voisins s’échangent (T ou Y), soit trois coins tournent (Aa ou Ab).</p>
        <p>Ensuite les <b>arêtes</b> : Ua, Ub, H ou Z. Six algorithmes de PLL suffisent à terminer le cube.</p>
        <div class="row"><a class="btn" href="#/algos/pll">Voir les 21 PLL ${icons.arrow}</a> <a class="btn" href="#/train/pll">S’entraîner</a></div>`)}
      ${step(3, 'Mémoriser durablement', `
        <p>Ajoute les cas aux favoris, puis révise-les avec les cartes : la répétition espacée te redemande les cas ratés plus souvent et espace ceux que tu connais.</p>
        <a class="btn" href="#/train/flash">Ouvrir les cartes ${icons.arrow}</a>`)}`,
  },
  {
    id: 'notation',
    title: 'Notation',
    blurb: 'Toutes les lettres et symboles que tu verras dans les algorithmes.',
    time: '5 min',
    body: () => `
      <div class="card"><table class="tbl">
        <tr><th>Symbole</th><th>Signification</th></tr>
        <tr><td><span class="mv">R L U D F B</span></td><td>quart de tour horaire de la face, vue de face</td></tr>
        <tr><td><span class="mv">R'</span></td><td>quart de tour antihoraire</td></tr>
        <tr><td><span class="mv">R2</span></td><td>demi-tour</td></tr>
        <tr><td><span class="mv">r l u d f b</span></td><td>la face et la tranche du milieu (aussi écrit <span class="mv">Rw</span>)</td></tr>
        <tr><td><span class="mv">M E S</span></td><td>tranches du milieu : M suit L, E suit D, S suit F</td></tr>
        <tr><td><span class="mv">x y z</span></td><td>rotation du cube entier, comme R, U et F</td></tr>
        <tr><td>( )</td><td>regroupement : « (R U R' U') » se répète ou se lit d’un bloc</td></tr>
      </table></div>
      <div class="card"><h3>AUF</h3><p>« Adjust U Face » : un quart ou un demi-tour de la face U avant ou après un algorithme pour aligner le dernier étage.</p></div>
      <div class="card"><h3>Lettrage Speffz</h3><p>Un schéma de 24 lettres qui nomme chaque autocollant d’arête et de coin. Il sert surtout au tir à l’aveugle ; un entraîneur est disponible.</p><a class="btn small" href="#/train/speffz">Entraîner Speffz</a></div>`,
  },
  {
    id: 'glossary',
    title: 'Glossaire',
    blurb: 'Le vocabulaire du speedcubing, en quelques lignes.',
    time: '3 min',
    body: () => `
      <dl class="gloss">
        ${[
          ['CFOP', 'Méthode des speedcubers : croix, deux premières couches, orientation, permutation.'],
          ['F2L', 'Les deux premières couches, résolues par paires coin-arête.'],
          ['OLL', 'Orientation du dernier étage : rendre la face du dessus d’une seule couleur.'],
          ['PLL', 'Permutation du dernier étage : placer les pièces une fois orientées.'],
          ['AUF', 'Ajustement de la face U avant ou après un algorithme.'],
          ['Ao5 / Ao12', 'Moyenne de 5 ou 12 résolutions en retirant la meilleure et la pire.'],
          ['DNF', 'Did Not Finish : résolution non valide.'],
          ['+2', 'Pénalité de deux secondes (cube pas tout à fait résolu ou inspection dépassée).'],
          ['Inspection', '15 secondes pour observer le cube avant de le résoudre.'],
          ['Sune', 'Un des algorithmes OLL les plus connus : R U R\' U R U2 R\'.'],
          ['Parité', 'État impossible sur 3x3 mais qui apparaît sur les gros cubes après réduction.'],
        ].map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}
      </dl>`,
  },
];

export function guideIndex({ page }) {
  const html = `<div class="cards">${GUIDES.map((g, i) => `
    <a class="card guide" href="#/guides/${g.id}"><span class="num">${i + 1}</span><b>${esc(g.title)}</b><span>${esc(g.blurb)}</span><em>${esc(g.time)}</em></a>`).join('')}</div>`;
  return { html: page('Guides', html, { sub: 'De ta première résolution aux 2-look.' }) };
}

export function guideView(id, { page }) {
  const g = GUIDES.find((x) => x.id === id);
  if (!g) return { html: page('Introuvable', `<div class="empty"><p>Ce guide n’existe pas.</p><a class="btn primary" href="#/guides">Tous les guides</a></div>`) };
  return { html: page(esc(g.title), g.body(), { back: '#/guides', sub: g.time }) };
}
