// Bases d'algorithmes. Chaque algorithme est vérifié par tests/verify.mjs avec le simulateur.

const pll = (name, group, alg, alts = []) => ({ id: 'pll-' + name.toLowerCase(), name, group, alg, alts, mode: 'full' });
const oll = (id, name, group, alg, mode, note) => ({ id: 'oll2-' + id, name, group, alg, alts: [], mode, note });

export const SETS = [
  {
    id: 'pll',
    name: 'PLL',
    long: 'Permutation du dernier étage',
    blurb: 'Les 21 cas qui envoient chaque pièce du dernier étage à sa place, une fois la face jaune terminée.',
    groups: ['Arêtes seules', 'Coins seuls', 'Échange de coins adjacents', 'Échange de coins diagonaux', 'Perms G'],
    cases: [
      pll('Ua', 'Arêtes seules', "R U' R U R U R U' R' U' R2", ["M2 U M U2 M' U M2"]),
      pll('Ub', 'Arêtes seules', "R2 U R U R' U' R' U' R' U R'", ["M2 U' M U2 M' U' M2"]),
      pll('H', 'Arêtes seules', "M2 U M2 U2 M2 U M2"),
      pll('Z', 'Arêtes seules', "M' U M2 U M2 U M' U2 M2"),
      pll('Aa', 'Coins seuls', "x R' U R' D2 R U' R' D2 R2 x'", ["R' F R' B2 R F' R' B2 R2"]),
      pll('Ab', 'Coins seuls', "x R2 D2 R U R' D2 R U' R x'", ["R2 B2 R F R' B2 R F' R"]),
      pll('E', 'Coins seuls', "x' R U' R' D R U R' D' R U R' D R U' R' D' x"),
      pll('T', 'Échange de coins adjacents', "R U R' U' R' F R2 U' R' U' R U R' F'"),
      pll('F', 'Échange de coins adjacents', "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"),
      pll('Ja', 'Échange de coins adjacents', "x R2 F R F' R U2 r' U r U2 x'"),
      pll('Jb', 'Échange de coins adjacents', "R U R' F' R U R' U' R' F R2 U' R'"),
      pll('Ra', 'Échange de coins adjacents', "R U' R' U' R U R D R' U' R D' R' U2 R'"),
      pll('Rb', 'Échange de coins adjacents', "R' U2 R U2 R' F R U R' U' R' F' R2"),
      pll('Y', 'Échange de coins diagonaux', "F R U' R' U' R U R' F' R U R' U' R' F R F'"),
      pll('V', 'Échange de coins diagonaux', "R' U R' U' B' R' B2 U' B' U B' R B R", ["R' U R' U' y R' F' R2 U' R' U R' F R F"]),
      pll('Na', 'Échange de coins diagonaux', "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"),
      pll('Nb', 'Échange de coins diagonaux', "R' U R U' R' F' U' F R U R' F R' F' R U' R"),
      pll('Ga', 'Perms G', "R2 U R' U R' U' R U' R2 U' D R' U R D'"),
      pll('Gb', 'Perms G', "R' U' R U D' R2 U R' U R U' R U' R2 D"),
      pll('Gc', 'Perms G', "R2 U' R U' R U R' U R2 U D' R U' R' D"),
      pll('Gd', 'Perms G', "R U R' U' D R2 U' R U' R' U R' U R2 D'"),
    ],
  },
  {
    id: 'oll2',
    name: 'OLL 2-look',
    long: 'Orientation du dernier étage en deux temps',
    blurb: 'Les 10 cas pour faire la face jaune en deux étapes : d’abord la croix, ensuite les coins.',
    groups: ['1. La croix (arêtes)', '2. Les coins'],
    cases: [
      oll('dot', 'Point', '1. La croix (arêtes)', "F R U R' U' F' f R U R' U' f'", 'edges', 'Aucune arête jaune sur le dessus.'),
      oll('line', 'Ligne', '1. La croix (arêtes)', "F R U R' U' F'", 'edges', 'Deux arêtes jaunes opposées, à l’horizontale comme sur l’image.'),
      oll('l', 'Crochet (L)', '1. La croix (arêtes)', "f R U R' U' f'", 'edges', 'Deux arêtes jaunes voisines (forme de L) : oriente le cube comme sur l’image.'),
      oll('sune', 'Sune', '2. Les coins', "R U R' U R U2 R'", 'oll', 'Un seul coin jaune sur le dessus, en bas à gauche.'),
      oll('antisune', 'Antisune', '2. Les coins', "R U2 R' U' R U' R'", 'oll', 'Un seul coin jaune sur le dessus, en haut à droite.'),
      oll('h', 'H', '2. Les coins', "F R U R' U' R U R' U' R U R' U' F'", 'oll', 'Aucun coin jaune sur le dessus : les stickers jaunes pointent devant et derrière.'),
      oll('pi', 'Pi', '2. Les coins', "R U2 R2 U' R2 U' R2 U2 R", 'oll', 'Aucun coin jaune sur le dessus : deux stickers jaunes pointent à gauche.'),
      oll('t', 'T', '2. Les coins', "r U R' U' r' F R F'", 'oll', 'Deux coins jaunes voisins, sur la droite.'),
      oll('u', 'U', '2. Les coins', "R2 D R' U2 R D' R' U2 R'", 'oll', 'Deux coins jaunes voisins, à l’arrière.'),
      oll('lc', 'L (coins)', '2. Les coins', "F R' F' r U R U' r'", 'oll', 'Deux coins jaunes en diagonale (en haut à gauche et en bas à droite).'),
    ],
  },
];

export const ALL_CASES = SETS.flatMap((s) => s.cases.map((c) => ({ ...c, set: s.id, setName: s.name })));
export const caseById = (id) => ALL_CASES.find((c) => c.id === id);
export const setById = (id) => SETS.find((s) => s.id === id);
