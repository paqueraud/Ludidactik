/**
 * CM2 — Organisation et gestion de données, probabilités (BO n°16 du 17/04/2025, cycle 3).
 *
 * Données : lire et interpréter un tableau, un diagramme en barres, un diagramme circulaire ou une courbe ;
 * résoudre des problèmes en une ou deux étapes ; produire un diagramme (choisir la hauteur d'une barre).
 * Les items portent `meta.graphique = { type, titre, etiquettes, valeurs, unite }` (Station météo), avec
 * `type` ∈ 'barres' | 'tableau' | 'courbe' | 'circulaire' (« circulaire » : extension de la convention,
 * `valeurs` = effectifs, les parts se lisent facilement : moitié, quart, tiers…). L'énoncé reprend toujours
 * les données en clair (jeux sans graphique) et `meta.question` contient la question seule.
 *
 * Données réelles (arrondies) :
 * - températures moyennes mensuelles à Paris-Montsouris, normales 1991-2020 (Météo-France), au degré ;
 * - étendue moyenne de la banquise arctique en septembre (NSIDC, Sea Ice Index), en millions de km², au dixième ;
 * - quantité moyenne annuelle de CO₂ dans l'air à Mauna Loa (NOAA), en ppm, à l'unité.
 *
 * Probabilités : vocabulaire (impossible, possible, certain, probable, peu probable, une chance sur deux),
 * « a chances sur b » en situation d'équiprobabilité (attendu au Normal), comparer des probabilités,
 * indépendance (« le dé ne se souvient pas »), deux issues ≠ une chance sur deux, expériences en deux étapes
 * (tableau ou arbre). Écriture fractionnaire et trois étapes : pour aller plus loin (6e).
 */
import type { Rng } from '@/engine/rng';
import type { ItemGen, LessonContent } from '../../registry';
import type { Level } from '../../schemas';
import { cap, clamp01, de, distinctInts, fmt, make, mcq, numeric, parNiv, PERSOS, vraiFaux } from './util';

/* ================================================================== */
/* Données                                                             */
/* ================================================================== */

type TypeGraphique = 'barres' | 'tableau' | 'courbe' | 'circulaire';

interface Donnees {
  type: TypeGraphique;
  titre: string;
  etiquettes: string[];
  /** Valeurs en millièmes pour éviter les erreurs d'arrondi (banquise : 7,7 → 7700). */
  vm: number[];
  /** Unité affichée après une valeur (« élèves », « °C », « cm »). */
  unite: string;
  /** Ce qu'on compte (« élèves ») ; absent pour une mesure (température, hauteur…). */
  nom?: string;
  /** Pour une mesure : « la température », « la hauteur du plant ». */
  mesure?: string;
  /** Complément de temps ou de lieu d'une étiquette : « en juillet », « à 14 h ». */
  prep: (e: string) => string;
  /** Diagramme circulaire : nom de la part de chaque étiquette (« la moitié »). */
  parts?: string[];
  /** Effectif total (diagramme circulaire). */
  total?: number;
}

const val = (d: Donnees, i: number) => d.vm[i]! / 1000;
/** « 1 élève », « 0,2 million de km² », « 12 °C ». */
const avecUnite = (d: Donnees, v: number) => {
  if (d.unite === '°C') return `${fmt(v)} °C`;
  const u = v < 2 ? d.unite.replace(/^(\p{L}+?)(x|s)(?=$| )/u, '$1') : d.unite;
  return `${fmt(v)} ${u}`;
};
/** « que au jour 3 » → « qu’au jour 3 ». */
const queX = (s: string) => (/^[aeiouyàâéèê]/i.test(s) ? `qu’${s}` : `que ${s}`);
const lireGraph = (d: Donnees) =>
  ({
    barres: 'On lit la hauteur de chaque barre',
    tableau: 'On lit chaque case du tableau',
    courbe: 'On lit la hauteur de chaque point de la courbe',
    circulaire: 'On regarde la taille de chaque part du disque',
  })[d.type];

/* ---------- enquêtes (diagrammes en barres, tableaux) ---------- */

const ENQUETES: { titre: string; etiquettes: string[]; nom: string }[] = [
  {
    titre: 'Comment les élèves de l’école viennent à l’école',
    etiquettes: ['à pied', 'à vélo', 'en voiture', 'en bus', 'en trottinette'],
    nom: 'élèves',
  },
  {
    titre: 'Le sport préféré des élèves de cycle 3',
    etiquettes: ['football', 'natation', 'danse', 'basket', 'judo', 'tennis'],
    nom: 'élèves',
  },
  {
    titre: 'Les oiseaux comptés au jardin de l’école (comptage pour la biodiversité)',
    etiquettes: ['moineaux', 'mésanges', 'merles', 'pigeons', 'rouges-gorges'],
    nom: 'oiseaux',
  },
  {
    titre: 'Les déchets ramassés pendant le nettoyage de la plage',
    etiquettes: ['bouteilles en plastique', 'canettes', 'mégots', 'sacs en plastique', 'bouchons'],
    nom: 'déchets',
  },
  {
    titre: 'Les livres empruntés à la bibliothèque de l’école',
    etiquettes: ['lundi', 'mardi', 'jeudi', 'vendredi'],
    nom: 'livres',
  },
];

function enquete(level: Level, rng: Rng, multiple = 1): Donnees {
  const t = rng.pick(ENQUETES);
  const n = Math.min(t.etiquettes.length, parNiv(level, { facile: 3, normal: rng.int(4, 5), plus_loin: 5 }));
  const [lo, hi] = parNiv(level, { facile: [1, 30], normal: [8, 250], plus_loin: [40, 900] });
  // valeurs distinctes : le plus grand et le plus petit sont uniques
  const valeurs = distinctInts(rng, n, Math.ceil(lo / multiple), Math.floor(hi / multiple)).map(
    (v) => v * multiple,
  );
  return {
    type: level === 'facile' || rng.chance(0.65) ? 'barres' : 'tableau',
    titre: t.titre,
    etiquettes: t.etiquettes.slice(0, n),
    vm: valeurs.map((v) => v * 1000),
    unite: t.nom,
    nom: t.nom,
    prep: (e) => `« ${e} »`,
  };
}

/* ---------- courbes ---------- */

/** Températures moyennes mensuelles à Paris-Montsouris (normales 1991-2020, Météo-France), arrondies au degré. */
const PARIS = {
  mois: [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ],
  temp: [5, 6, 9, 12, 16, 19, 21, 21, 17, 13, 8, 6],
};
/** Étendue moyenne de la banquise arctique en septembre (NSIDC), en millions de km², arrondie au dixième. */
const BANQUISE = { annees: ['1980', '1990', '2000', '2010', '2020'], vm: [7700, 6100, 6300, 4900, 3900] };
/** Quantité moyenne annuelle de CO₂ dans l'air à Mauna Loa (NOAA), en ppm (parties par million), arrondie. */
const CO2 = {
  annees: ['1960', '1970', '1980', '1990', '2000', '2010', '2020'],
  v: [317, 326, 339, 354, 370, 390, 414],
};

function courbe(level: Level, rng: Rng): Donnees {
  const sorte = parNiv(level, { facile: rng.int(0, 1), normal: rng.int(0, 3), plus_loin: rng.int(1, 4) });
  if (sorte === 0) {
    // Croissance d'un plant de haricot (expérience de classe) : la hauteur augmente chaque jour
    const n = parNiv(level, { facile: 5, normal: 6, plus_loin: 7 });
    let h = rng.int(0, 2);
    const v: number[] = [];
    const pas = distinctInts(rng, n, 1, 6);
    for (let i = 0; i < n; i++) {
      h += i === 0 ? 0 : pas[i]!;
      v.push(h);
    }
    return {
      type: 'courbe',
      titre: 'La hauteur du plant de haricot de la classe',
      etiquettes: v.map((_, i) => `jour ${i + 1}`),
      vm: v.map((x) => x * 1000),
      unite: 'cm',
      mesure: 'la hauteur du plant',
      prep: (e) => `au ${e}`,
    };
  }
  if (sorte === 1) {
    // Température relevée pendant une journée de printemps : elle monte puis redescend
    const heures = ['8 h', '10 h', '12 h', '14 h', '16 h', '18 h'];
    const pic = rng.int(3, 4);
    const v: number[] = [];
    let t = rng.int(4, 12);
    const montee = distinctInts(rng, pic, 1, 5);
    for (let i = 0; i < heures.length; i++) {
      if (i > 0 && i <= pic) t += montee[i - 1]!;
      if (i > pic) t -= rng.int(1, 4);
      v.push(t);
    }
    return {
      type: 'courbe',
      titre: 'La température dans la cour pendant une journée de printemps',
      etiquettes: heures,
      vm: v.map((x) => x * 1000),
      unite: '°C',
      mesure: 'la température',
      prep: (e) => `à ${e}`,
    };
  }
  if (sorte === 2) {
    const debut = rng.int(0, 6);
    const n = 6;
    return {
      type: 'courbe',
      titre: 'La température moyenne de chaque mois à Paris',
      etiquettes: PARIS.mois.slice(debut, debut + n),
      vm: PARIS.temp.slice(debut, debut + n).map((x) => x * 1000),
      unite: '°C',
      mesure: 'la température moyenne',
      prep: (e) => `en ${e}`,
    };
  }
  if (sorte === 3) {
    return {
      type: rng.chance(0.5) ? 'courbe' : 'barres',
      titre: 'La surface de la banquise arctique en septembre (en millions de km²)',
      etiquettes: BANQUISE.annees,
      vm: BANQUISE.vm,
      unite: 'millions de km²',
      mesure: 'la surface de la banquise',
      prep: (e) => `en ${e}`,
    };
  }
  return {
    type: 'courbe',
    titre: 'La quantité de dioxyde de carbone (CO₂) dans l’air, mesurée chaque année à Hawaï (en ppm)',
    etiquettes: CO2.annees,
    vm: CO2.v.map((x) => x * 1000),
    unite: 'ppm',
    mesure: 'la quantité de CO₂',
    prep: (e) => `en ${e}`,
  };
}

/* ---------- diagrammes circulaires ---------- */

const PARTS: Record<string, [number, number]> = {
  'la moitié': [1, 2],
  'le quart': [1, 4],
  'les trois quarts': [3, 4],
  'le tiers': [1, 3],
  'le sixième': [1, 6],
  'le huitième': [1, 8],
};
const MODELES: Record<Level, string[][]> = {
  facile: [['la moitié', 'le quart', 'le quart']],
  normal: [
    ['la moitié', 'le quart', 'le huitième', 'le huitième'],
    ['la moitié', 'le quart', 'le quart'],
    ['les trois quarts', 'le quart'],
  ],
  plus_loin: [
    ['la moitié', 'le tiers', 'le sixième'],
    ['le tiers', 'le tiers', 'le sixième', 'le sixième'],
    ['la moitié', 'le quart', 'le huitième', 'le huitième'],
  ],
};
const CIRC = [
  {
    titre: (t: number) => `Comment les ${t} élèves de CM2 viennent à l’école`,
    etiquettes: ['à pied', 'en voiture', 'à vélo', 'en bus'],
    verbe: 'viennent',
  },
  {
    titre: (t: number) => `Le goûter préféré des ${t} élèves de l’école`,
    etiquettes: ['un fruit', 'une tartine', 'un yaourt', 'un gâteau'],
    verbe: 'préfèrent',
  },
];

function circulaire(level: Level, rng: Rng): Donnees & { verbe: string } {
  const modele = rng.pick(MODELES[level]);
  const ppcmDen = modele.map((p) => PARTS[p]![1]).reduce((a, b) => (a * b) / pgcd(a, b), 1);
  const k = rng.int(2, level === 'facile' ? 10 : Math.floor(60 / ppcmDen));
  const total = ppcmDen * k;
  const c = rng.pick(CIRC);
  const etiquettes = rng.shuffle(c.etiquettes).slice(0, modele.length);
  return {
    type: 'circulaire',
    titre: c.titre(total),
    etiquettes,
    vm: modele.map((p) => ((total * PARTS[p]![0]) / PARTS[p]![1]) * 1000),
    unite: 'élèves',
    nom: 'élèves',
    prep: (e) => `« ${e} »`,
    parts: modele,
    total,
    verbe: c.verbe,
  };
}
const pgcd = (a: number, b: number): number => (b ? pgcd(b, a % b) : a);

/* ---------- textes communs ---------- */

const enClair = (d: Donnees) =>
  d.type === 'circulaire'
    ? `Diagramme circulaire « ${d.titre} » — ${d.etiquettes.map((e, i) => `${e} : ${d.parts![i]}`).join(', ')}.`
    : `${cap(d.type === 'tableau' ? 'tableau' : d.type === 'courbe' ? 'courbe' : 'diagramme en barres')} « ${d.titre} » — ${d.etiquettes
        .map((e, i) => `${e} : ${avecUnite(d, val(d, i))}`)
        .join(', ')}.`;

const meta = (d: Donnees, question: string, extra: Record<string, unknown> = {}) => ({
  graphique: {
    type: d.type,
    titre: d.titre,
    etiquettes: d.etiquettes,
    valeurs: d.vm.map((v) => v / 1000),
    unite: d.unite,
  },
  question,
  ...extra,
});

const sig = (d: Donnees) => `${d.titre}-${d.etiquettes.join(',')}-${d.vm.join(',')}`;

/** Deux indices distincts de valeurs différentes, [plus grand, plus petit]. */
function deuxDifferents(d: Donnees, rng: Rng): [number, number] {
  for (let essai = 0; essai < 50; essai++) {
    const [a, b] = rng.shuffle(d.vm.map((_, i) => i)).slice(0, 2) as [number, number];
    if (d.vm[a] !== d.vm[b]) return d.vm[a]! > d.vm[b]! ? [a, b] : [b, a];
  }
  const iMax = d.vm.indexOf(Math.max(...d.vm));
  const iMin = d.vm.indexOf(Math.min(...d.vm));
  return [iMax, iMin];
}

/** Données pour un niveau : enquêtes et courbes (et diagrammes circulaires si `circ`). */
function tirer(level: Level, rng: Rng, circ = true): Donnees {
  const r = rng.next();
  if (circ && level !== 'facile' && r < 0.25) return circulaire(level, rng);
  if (circ && level === 'facile' && r < 0.15) return circulaire(level, rng);
  if (r < 0.6) return enquete(level, rng);
  return courbe(level, rng);
}

/* ---------- générateurs ---------- */

const donneesNumeric: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, { facile: rng.int(0, 1), normal: rng.int(0, 5), plus_loin: rng.int(2, 7) });
  if (forme === 1 || forme === 6) {
    // Diagramme circulaire : retrouver un effectif à partir d'une part (ou le total à partir d'une part)
    const d = circulaire(level, rng);
    const i = rng.int(0, d.etiquettes.length - 1);
    const v = val(d, i);
    if (forme === 6) {
      const q = `${cap(d.parts![i]!)} des élèves ${d.verbe} « ${d.etiquettes[i]} » : cela fait ${v} élèves. Combien d’élèves ont répondu en tout ?`;
      const [a, b] = PARTS[d.parts![i]!]!;
      return numeric(ctx, `circ-total-${sig(d)}-${i}`, {
        prompt: `${q}`,
        spoken: q,
        answer: d.total!,
        unit: 'élèves',
        explication: `${cap(d.parts![i]!)}, c’est ${a}/${b} : ${b} parts comme celle-ci font le tout${a > 1 ? ` (1 part = ${v / a} élèves)` : ''}, donc ${d.total} élèves.`,
        difficulty: 0.85,
        meta: meta(d, q),
      });
    }
    const q = `Combien d’élèves ${d.verbe} « ${d.etiquettes[i]} » ?`;
    const [a, b] = PARTS[d.parts![i]!]!;
    return numeric(ctx, `circ-${sig(d)}-${i}`, {
      prompt: `${enClair(d)} Il y a ${d.total} élèves en tout.\n${q}`,
      spoken: q,
      answer: v,
      unit: 'élèves',
      explication: `« ${d.etiquettes[i]} » occupe ${d.parts![i]} du disque : ${a === 1 ? `${d.total} ÷ ${b} = ${v}` : `${d.total} ÷ ${b} = ${d.total! / b}, puis ${a} × ${d.total! / b} = ${v}`} élèves.`,
      difficulty: clamp01(0.35 + (b > 4 ? 0.2 : 0) + (a > 1 ? 0.15 : 0)),
      meta: meta(d, q),
    });
  }
  if (forme === 5 || forme === 7) {
    // Produire : hauteur d'une barre avec une échelle (1 carreau = 5 ou 10)
    const echelle = forme === 7 ? rng.pick([20, 25, 50]) : rng.pick([5, 10]);
    const d = enquete(level === 'plus_loin' ? 'plus_loin' : 'normal', rng, echelle);
    const i = rng.int(0, d.etiquettes.length - 1);
    const v = val(d, i);
    const q = `Tu construis le diagramme en barres avec 1 carreau pour ${echelle} ${d.nom}. Combien de carreaux de haut doit mesurer la barre « ${d.etiquettes[i]} » ?`;
    return numeric(ctx, `produire-${sig(d)}-${i}-${echelle}`, {
      prompt: `Tableau « ${d.titre} » — ${d.etiquettes.map((e, j) => `${e} : ${fmt(val(d, j))}`).join(', ')}.\n${q}`,
      spoken: q,
      answer: v / echelle,
      unit: 'carreaux',
      explication: `${fmt(v)} ÷ ${echelle} = ${fmt(v / echelle)} : la barre mesure ${fmt(v / echelle)} carreaux.`,
      difficulty: forme === 7 ? 0.75 : 0.55,
      meta: { ...meta({ ...d, type: 'tableau' }, q), echelle },
    });
  }
  const d = tirer(level, rng, false);
  if (forme === 0) {
    const i = rng.int(0, d.etiquettes.length - 1);
    const q = d.nom
      ? `Combien ${de(d.nom)} pour « ${d.etiquettes[i]} » ?`
      : `Quelle est ${d.mesure} ${d.prep(d.etiquettes[i]!)} ?`;
    return numeric(ctx, `lire-${sig(d)}-${i}`, {
      prompt: `${enClair(d)}\n${q}`,
      spoken: q,
      answer: val(d, i),
      unit: d.unite,
      explication: `${lireGraph(d)} : ${d.prep(d.etiquettes[i]!)}, on lit ${avecUnite(d, val(d, i))}.`,
      difficulty: 0.2,
      meta: meta(d, q),
    });
  }
  if (forme === 2) {
    const [g, p] = deuxDifferents(d, rng);
    const ecart = (d.vm[g]! - d.vm[p]!) / 1000;
    const q = d.nom
      ? `Combien ${de(d.nom)} de plus pour « ${d.etiquettes[g]} » que pour « ${d.etiquettes[p]} » ?`
      : `Quel est l’écart entre ${d.mesure} ${d.prep(d.etiquettes[g]!)} et ${d.mesure} ${d.prep(d.etiquettes[p]!)} ?`;
    return numeric(ctx, `ecart-${sig(d)}-${g}-${p}`, {
      prompt: `${enClair(d)}\n${q}`,
      spoken: q,
      answer: ecart,
      unit: d.unite,
      explication: `On lit ${fmt(val(d, g))} et ${fmt(val(d, p))}, puis on calcule l’écart : ${fmt(val(d, g))} − ${fmt(val(d, p))} = ${fmt(ecart)}.`,
      difficulty: 0.5,
      meta: meta(d, q),
    });
  }
  if (forme === 3 && d.nom) {
    const somme = d.vm.reduce((x, y) => x + y, 0) / 1000;
    const q = `Combien ${de(d.nom)} en tout ?`;
    return numeric(ctx, `total-${sig(d)}`, {
      prompt: `${enClair(d)}\n${q}`,
      spoken: q,
      answer: somme,
      unit: d.unite,
      explication: `On ajoute toutes les valeurs : ${d.vm.map((v) => fmt(v / 1000)).join(' + ')} = ${fmt(somme)}.`,
      difficulty: 0.55,
      meta: meta(d, q),
    });
  }
  if (forme === 4 && d.nom) {
    // Deux étapes : total, puis on enlève une catégorie
    const i = rng.int(0, d.etiquettes.length - 1);
    const somme = d.vm.reduce((x, y) => x + y, 0) / 1000;
    const q = `Combien ${de(d.nom)} ne sont pas dans la catégorie « ${d.etiquettes[i]} » ?`;
    return numeric(ctx, `sauf-${sig(d)}-${i}`, {
      prompt: `${enClair(d)}\n${q}`,
      spoken: q,
      answer: somme - val(d, i),
      unit: d.unite,
      explication: `Étape 1 : le total est ${fmt(somme)}. Étape 2 : on enlève « ${d.etiquettes[i]} » : ${fmt(somme)} − ${fmt(val(d, i))} = ${fmt(somme - val(d, i))}. (On peut aussi ajouter les autres catégories.)`,
      difficulty: 0.7,
      meta: meta(d, q),
    });
  }
  // Courbe (ou cas sans effectif) : évolution entre le premier et le dernier relevé
  const a = 0;
  let b = d.etiquettes.length - 1;
  if (d.vm[b] === d.vm[a]) b = d.vm.indexOf(Math.max(...d.vm));
  const diff = Math.abs(d.vm[b]! - d.vm[a]!) / 1000;
  const sens = d.vm[b]! >= d.vm[a]! ? 'augmenté' : 'diminué';
  const quoi = d.mesure ?? `le nombre ${de(d.nom!)}`;
  const q = `De combien ${quoi} a-t-${/^(la|une)/.test(quoi) ? 'elle' : 'il'} ${sens} entre ${d.etiquettes[a]} et ${d.etiquettes[b]} ?`;
  return numeric(ctx, `evol-${sig(d)}`, {
    prompt: `${enClair(d)}\n${q}`,
    spoken: q,
    answer: diff,
    unit: d.unite,
    explication: `On lit ${fmt(val(d, a))} puis ${fmt(val(d, b))} : la différence est ${fmt(Math.max(val(d, a), val(d, b)))} − ${fmt(Math.min(val(d, a), val(d, b)))} = ${fmt(diff)}.`,
    difficulty: 0.6,
    meta: meta(d, q),
  });
};

const donneesQcm: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, { facile: rng.int(0, 1), normal: rng.int(0, 3), plus_loin: rng.int(1, 4) });
  if (forme === 1) {
    // Diagramme circulaire : quelle part ?
    const d = circulaire(level, rng);
    const i = rng.int(0, d.etiquettes.length - 1);
    const q = `Quelle part des élèves ${d.verbe} « ${d.etiquettes[i]} » ?`;
    const [a, b] = PARTS[d.parts![i]!]!;
    return mcq(ctx, rng, `circ-part-${sig(d)}-${i}`, {
      question: `${enClair(d).replace(/ — .*$/, '.')} (${d.etiquettes.map((e, j) => `${e} : ${fmt(val(d, j))} élèves`).join(', ')}).\n${q}`,
      good: d.parts![i]!,
      wrong: Object.keys(PARTS).filter((p) => p !== d.parts![i]),
      max: level === 'facile' ? 3 : 4,
      explication: `${fmt(val(d, i))} élèves sur ${d.total}, c’est ${a}/${b} du total : ${d.parts![i]}.`,
      difficulty: 0.45 + (b > 4 ? 0.2 : 0),
      meta: meta(d, q),
    });
  }
  if (forme === 2) {
    // Courbe : entre quels relevés la hausse est-elle la plus forte ?
    for (let essai = 0; essai < 30; essai++) {
      const d = courbe(level, rng);
      const hausses = d.vm.slice(1).map((v, i) => v - d.vm[i]!);
      const max = Math.max(...hausses);
      if (max <= 0 || hausses.filter((h) => h === max).length !== 1) continue;
      const k = hausses.indexOf(max);
      const lib = (i: number) => `entre ${d.etiquettes[i]} et ${d.etiquettes[i + 1]}`;
      const q = `Entre quels relevés ${d.mesure} a-t-elle le plus augmenté ?`;
      return mcq(ctx, rng, `hausse-${sig(d)}`, {
        question: `${enClair(d)}\n${q}`,
        good: lib(k),
        wrong: hausses
          .map((_, i) => i)
          .filter((i) => i !== k)
          .map(lib),
        explication: `On calcule chaque augmentation : la plus grande est ${lib(k)} (+ ${avecUnite(d, max / 1000)}), c’est là que la courbe monte le plus.`,
        difficulty: 0.7,
        meta: meta(d, q),
      });
    }
  }
  if (forme === 4) {
    // Pour aller plus loin : repérer l'erreur dans un diagramme produit par un élève
    const d = enquete('normal', rng);
    const i = rng.int(0, d.etiquettes.length - 1);
    const faux = [...d.vm];
    const v = d.vm[i]! / 1000;
    const autres = new Set(d.vm.map((x) => x / 1000));
    let w = rng.pick([v + 10, v - 10, Number(String(v).split('').reverse().join('')), v + 1, v - 1]);
    if (w <= 0 || w === v || autres.has(w)) w = v + 20;
    faux[i] = w * 1000;
    const qui = rng.pick(PERSOS);
    const q = `${qui.nom} a construit le diagramme en barres. Quelle barre est fausse ?`;
    return mcq(ctx, rng, `erreur-${sig(d)}-${i}-${w}`, {
      question: `Tableau « ${d.titre} » — ${d.etiquettes.map((e, j) => `${e} : ${fmt(val(d, j))}`).join(', ')}.\nDiagramme ${de(qui.nom)} — ${d.etiquettes.map((e, j) => `${e} : ${fmt(faux[j]! / 1000)}`).join(', ')}.\n${q}`,
      good: d.etiquettes[i]!,
      wrong: d.etiquettes.filter((_, j) => j !== i),
      max: 5,
      explication: `On compare chaque barre au tableau : pour « ${d.etiquettes[i]} », la barre monte à ${fmt(w)} au lieu de ${fmt(v)}.`,
      difficulty: 0.8,
      meta: {
        graphique: {
          type: 'barres',
          titre: d.titre,
          etiquettes: d.etiquettes,
          valeurs: faux.map((x) => x / 1000),
          unite: d.unite,
        },
        question: q,
        tableauJuste: d.vm.map((x) => x / 1000),
      },
    });
  }
  // Le plus / le moins (valeur unique)
  for (let essai = 0; essai < 30; essai++) {
    const d = tirer(level, rng, false);
    const plus = rng.chance(0.6);
    const v = plus ? Math.max(...d.vm) : Math.min(...d.vm);
    if (d.vm.filter((x) => x === v).length !== 1) continue;
    const good = d.etiquettes[d.vm.indexOf(v)]!;
    const q = d.nom
      ? `Pour quelle catégorie a-t-on compté le ${plus ? 'plus' : 'moins'} ${de(d.nom)} ?`
      : `À quel moment ${d.mesure} est-elle ${plus ? 'la plus élevée' : 'la plus basse'} ?`;
    return mcq(ctx, rng, `extreme-${sig(d)}-${plus}`, {
      question: `${enClair(d)}\n${q}`,
      good,
      wrong: d.etiquettes.filter((e) => e !== good),
      max: 6,
      explication: `${lireGraph(d)} : ${d.prep(good)}, on lit ${avecUnite(d, v / 1000)}, c’est la valeur ${plus ? 'la plus grande' : 'la plus petite'} : il n’y en a pas d’autre aussi ${plus ? 'grande' : 'petite'}.`,
      difficulty: clamp01(0.2 + d.etiquettes.length * 0.04),
      meta: meta(d, q),
    });
  }
  throw new Error('données : aucun extrême unique');
};

const donneesVraiFaux: ItemGen = (level, rng, ctx) => {
  const r = rng.next();
  if (level !== 'facile' && r < 0.3) {
    const d = circulaire(level, rng);
    const i = rng.int(0, d.etiquettes.length - 1);
    const juste = rng.chance(0.5);
    const part = juste ? d.parts![i]! : rng.pick(Object.keys(PARTS).filter((p) => p !== d.parts![i]));
    const q = `${cap(part)} des élèves ${d.verbe} « ${d.etiquettes[i]} ».`;
    return vraiFaux(ctx, `circ-vf-${sig(d)}-${i}-${part}`, {
      statement: `${enClair(d).replace(/ — .*$/, '.')} (${d.etiquettes.map((e, j) => `${e} : ${fmt(val(d, j))} élèves`).join(', ')}).\n${q}`,
      spoken: q,
      answer: juste,
      explication: `« ${d.etiquettes[i]} » : ${fmt(val(d, i))} élèves sur ${d.total}, c’est ${d.parts![i]}.`,
      difficulty: 0.5,
      meta: meta(d, q),
    });
  }
  const d = tirer(level, rng, false);
  if (level !== 'facile' && r < 0.55 && d.nom) {
    const somme = d.vm.reduce((x, y) => x + y, 0) / 1000;
    const juste = rng.chance(0.5);
    const montre = juste ? somme : somme + rng.pick([-10, 10, -1, 1, 100]);
    const q = `En tout, on a compté ${fmt(montre)} ${d.nom}.`;
    return vraiFaux(ctx, `vf-total-${sig(d)}-${montre}`, {
      statement: `${enClair(d)}\n${q}`,
      spoken: q,
      answer: juste,
      explication: `${d.vm.map((v) => fmt(v / 1000)).join(' + ')} = ${fmt(somme)}.`,
      difficulty: 0.55,
      meta: meta(d, q),
    });
  }
  const [g, p] = deuxDifferents(d, rng);
  const [a, b] = rng.chance(0.5) ? [g, p] : [p, g];
  const q = d.nom
    ? `Il y a plus ${de(d.nom)} pour « ${d.etiquettes[a]} » que pour « ${d.etiquettes[b]} ».`
    : `${cap(d.mesure!)} est plus élevée ${d.prep(d.etiquettes[a]!)} ${queX(d.prep(d.etiquettes[b]!))}.`;
  return vraiFaux(ctx, `vf-${sig(d)}-${a}-${b}`, {
    statement: `${enClair(d)}\n${q}`,
    spoken: q,
    answer: a === g,
    explication: `${lireGraph(d)} : ${d.prep(d.etiquettes[a]!)} ${avecUnite(d, val(d, a))}, ${d.prep(d.etiquettes[b]!)} ${avecUnite(d, val(d, b))}.`,
    difficulty: 0.35,
    meta: meta(d, q),
  });
};

const donneesClasser: ItemGen = (level, rng, ctx) => {
  for (let essai = 0; essai < 30; essai++) {
    const d = tirer(level, rng, false);
    const tri = [...d.vm].sort((x, y) => x - y);
    const seuil = tri[Math.floor(tri.length / 2)]!;
    const cats = [`${avecUnite(d, seuil / 1000)} ou plus`, `moins de ${avecUnite(d, seuil / 1000)}`];
    const elements = d.etiquettes.map((e, i) => ({ label: e, category: d.vm[i]! >= seuil ? 0 : 1 }));
    if (new Set(elements.map((e) => e.category)).size < 2) continue;
    const q = `Range chaque ${d.type === 'courbe' ? 'relevé' : 'catégorie'} : ${cats[0]}, ou ${cats[1]} ?`;
    return make(ctx, 'classification', `seuil-${sig(d)}`, {
      prompt: `${enClair(d)}\n${q}`,
      spoken: q,
      categories: cats,
      elements,
      explication: `${lireGraph(d)} et on compare chaque valeur à ${avecUnite(d, seuil / 1000)}.`,
      difficulty: clamp01(0.3 + d.etiquettes.length * 0.05),
      meta: meta(d, q),
    });
  }
  throw new Error('données : classement impossible');
};

/* ================================================================== */
/* Probabilités                                                        */
/* ================================================================== */

interface Ev {
  texte: string;
  ok: (issue: string) => boolean;
}
interface Experience {
  intro: string;
  /** Issues équiprobables (une bille = une issue). */
  issues: string[];
  events: Ev[];
  /** Expérience en deux étapes ou plus. */
  etapes: number;
}

const nb = (s: string) => Number(s);
const ev = (texte: string, ok: (i: string) => boolean): Ev => ({ texte, ok });
const compte = (x: Experience, e: Ev) => x.issues.filter(e.ok).length;

function de6(): Experience {
  return {
    intro: 'On lance un dé à 6 faces numérotées de 1 à 6.',
    issues: ['1', '2', '3', '4', '5', '6'],
    etapes: 1,
    events: [
      ev('obtenir 6', (i) => i === '6'),
      ev('obtenir un nombre pair', (i) => nb(i) % 2 === 0),
      ev('obtenir un nombre impair', (i) => nb(i) % 2 === 1),
      ev('obtenir un nombre plus petit que 7', (i) => nb(i) < 7),
      ev('obtenir 7', (i) => i === '7'),
      ev('obtenir 0', (i) => i === '0'),
      ev('obtenir un nombre plus grand que 2', (i) => nb(i) > 2),
      ev('obtenir 1 ou 2', (i) => nb(i) <= 2),
      ev('obtenir un multiple de 3', (i) => nb(i) % 3 === 0),
      ev('obtenir un nombre plus petit que 6', (i) => nb(i) < 6),
      ev('obtenir un nombre entre 1 et 6', (i) => nb(i) >= 1 && nb(i) <= 6),
    ],
  };
}

function piece(): Experience {
  return {
    intro: 'On lance une pièce de monnaie.',
    issues: ['pile', 'face'],
    etapes: 1,
    events: [
      ev('obtenir pile', (i) => i === 'pile'),
      ev('obtenir face', (i) => i === 'face'),
      ev('obtenir pile ou face', () => true),
      ev('obtenir à la fois pile et face', () => false),
    ],
  };
}

function cartes(): Experience {
  const issues = Array.from({ length: 10 }, (_, i) => String(i + 1));
  return {
    intro: 'On tire au hasard une carte parmi 10 cartes numérotées de 1 à 10.',
    issues,
    etapes: 1,
    events: [
      ev('tirer un nombre pair', (i) => nb(i) % 2 === 0),
      ev('tirer un multiple de 5', (i) => nb(i) % 5 === 0),
      ev('tirer un nombre plus petit que 4', (i) => nb(i) < 4),
      ev('tirer le nombre 11', (i) => i === '11'),
      ev('tirer un nombre plus petit que 11', (i) => nb(i) < 11),
      ev('tirer le nombre 10', (i) => i === '10'),
      ev('tirer un nombre plus grand que 2', (i) => nb(i) > 2),
      ev('tirer un nombre plus grand que 1', (i) => nb(i) > 1),
      ev('tirer un nombre à deux chiffres', (i) => i.length === 2),
    ],
  };
}

const COULEURS: [string, string][] = [
  ['rouge', 'rouges'],
  ['bleue', 'bleues'],
  ['verte', 'vertes'],
  ['jaune', 'jaunes'],
  ['noire', 'noires'],
];

/** Sac de billes ou roue à parts égales : `n` = effectif de chaque couleur (0 = absente). */
function sac(level: Level, rng: Rng, roue = rng.chance(0.4)): Experience {
  const total = roue
    ? rng.pick([4, 6, 8, 10, 12])
    : rng.int(level === 'facile' ? 3 : 5, level === 'facile' ? 8 : 12);
  const couleurs = rng.shuffle(COULEURS);
  const presentes = rng.int(2, 3);
  // répartition aléatoire, chaque couleur présente au moins une fois, effectifs souvent différents
  const n = Array<number>(presentes).fill(1);
  for (let k = presentes; k < total; k++) n[rng.int(0, presentes - 1)]! += 1;
  const objet = roue ? ['part', 'parts'] : ['bille', 'billes'];
  const desc = n.map(
    (c, i) => `${c} ${c > 1 ? objet[1] : objet[0]} ${c > 1 ? couleurs[i]![1] : couleurs[i]![0]}`,
  );
  const liste = desc.length === 2 ? desc.join(' et ') : `${desc.slice(0, -1).join(', ')} et ${desc.at(-1)}`;
  const issues = n.flatMap((c, i) => Array<string>(c).fill(couleurs[i]![0]));
  const absente = couleurs[presentes]![0];
  const action = (c: string) => (roue ? `tomber sur une part ${c}` : `tirer une bille ${c}`);
  const events: Ev[] = couleurs.slice(0, presentes).map(([c]) => ev(action(c), (i) => i === c));
  events.push(ev(action(absente), (i) => i === absente));
  if (presentes === 3) {
    const [a, b] = [couleurs[0]![0], couleurs[1]![0]];
    events.push(
      ev(
        roue ? `tomber sur une part ${a} ou ${b}` : `tirer une bille ${a} ou ${b}`,
        (i) => i === a || i === b,
      ),
    );
  }
  events.push(
    ev(
      roue ? `tomber sur une part qui n’est pas ${absente}` : `tirer une bille qui n’est pas ${absente}`,
      (i) => i !== absente,
    ),
  );
  return {
    intro: roue
      ? `Une roue est partagée en ${total} parts égales : ${liste}. On fait tourner la flèche.`
      : `Dans un sac, il y a ${liste}. On tire une bille au hasard.`,
    issues,
    etapes: 1,
    events,
  };
}

function deuxPieces(): Experience {
  const issues = ['pile-pile', 'pile-face', 'face-pile', 'face-face'];
  const piles = (i: string) => i.split('-').filter((x) => x === 'pile').length;
  return {
    intro: 'On lance deux pièces de monnaie, une rouge et une bleue.',
    issues,
    etapes: 2,
    events: [
      ev('obtenir deux fois pile', (i) => piles(i) === 2),
      ev('obtenir un pile et un face', (i) => piles(i) === 1),
      ev('obtenir au moins un pile', (i) => piles(i) >= 1),
      ev('obtenir deux fois face', (i) => piles(i) === 0),
      ev('obtenir trois fois pile', () => false),
      ev('obtenir deux résultats (pile ou face)', () => true),
    ],
  };
}

function pieceDe(): Experience {
  const issues = ['pile', 'face'].flatMap((p) => [1, 2, 3, 4, 5, 6].map((d) => `${p}-${d}`));
  const p = (i: string) => i.split('-')[0]!;
  const d = (i: string) => nb(i.split('-')[1]!);
  return {
    intro: 'On lance une pièce de monnaie, puis un dé à 6 faces.',
    issues,
    etapes: 2,
    events: [
      ev('obtenir pile et 6', (i) => p(i) === 'pile' && d(i) === 6),
      ev('obtenir face et un nombre pair', (i) => p(i) === 'face' && d(i) % 2 === 0),
      ev('obtenir pile', (i) => p(i) === 'pile'),
      ev('obtenir face et 7', () => false),
      ev('obtenir un nombre plus grand que 1', (i) => d(i) > 1),
      ev('obtenir face et un nombre plus petit que 3', (i) => p(i) === 'face' && d(i) < 3),
      ev('obtenir pile ou face et un nombre de 1 à 6', () => true),
    ],
  };
}

function deuxDes(): Experience {
  const issues = [1, 2, 3, 4, 5, 6].flatMap((a) => [1, 2, 3, 4, 5, 6].map((b) => `${a}-${b}`));
  const s = (i: string) =>
    i
      .split('-')
      .map(nb)
      .reduce((x, y) => x + y, 0);
  const [a, b] = [(i: string) => nb(i.split('-')[0]!), (i: string) => nb(i.split('-')[1]!)];
  return {
    intro: 'On lance deux dés à 6 faces, un rouge et un bleu, et on ajoute les deux nombres.',
    issues,
    etapes: 2,
    events: [
      ev('obtenir une somme égale à 7', (i) => s(i) === 7),
      ev('obtenir une somme égale à 12', (i) => s(i) === 12),
      ev('obtenir un double', (i) => a(i) === b(i)),
      ev('obtenir une somme égale à 13', (i) => s(i) === 13),
      ev('obtenir une somme plus grande que 1', (i) => s(i) > 1),
      ev('obtenir une somme égale à 2', (i) => s(i) === 2),
      ev('obtenir une somme plus grande que 3', (i) => s(i) > 3),
      ev('obtenir une somme plus petite que 5', (i) => s(i) < 5),
    ],
  };
}

function troisPieces(): Experience {
  const issues = ['P', 'F'].flatMap((x) => ['P', 'F'].flatMap((y) => ['P', 'F'].map((z) => `${x}${y}${z}`)));
  const piles = (i: string) => i.split('').filter((x) => x === 'P').length;
  return {
    intro: 'On lance trois pièces de monnaie l’une après l’autre.',
    issues,
    etapes: 3,
    events: [
      ev('obtenir trois fois pile', (i) => piles(i) === 3),
      ev('obtenir exactement deux piles', (i) => piles(i) === 2),
      ev('obtenir au moins un pile', (i) => piles(i) >= 1),
      ev('obtenir quatre piles', () => false),
      ev('obtenir au plus un pile', (i) => piles(i) <= 1),
    ],
  };
}

function experience(level: Level, rng: Rng): Experience {
  const x = parNiv(level, {
    facile: rng.int(0, 3),
    normal: rng.int(0, 5),
    plus_loin: rng.int(2, 7),
  });
  return [de6, piece, () => sac(level, rng), cartes, deuxPieces, pieceDe, deuxDes, troisPieces][x]!();
}

export const chances = (a: number, b: number) => `${a} chance${a > 1 ? 's' : ''} sur ${b}`;

/** Catégorie « Roue » : impossible / peu probable (≤ 1/3) / probable (≥ 2/3) / certain ; null si ambigu. */
function categorie4(a: number, b: number): number | null {
  if (a === 0) return 0;
  if (a === b) return 3;
  if (3 * a <= b) return 1;
  if (3 * a >= 2 * b) return 2;
  return null;
}
const categorie3 = (a: number, b: number) => (a === 0 ? 0 : a === b ? 2 : 1);

const explChances = (x: Experience, e: Ev) => {
  const a = compte(x, e);
  const b = x.issues.length;
  if (a === 0) return `Aucune issue ne permet ${de(e.texte)} : c’est impossible (0 chance sur ${b}).`;
  if (a === b) return `Toutes les issues permettent ${de(e.texte)} : c’est certain (${b} chances sur ${b}).`;
  return `Il y a ${b} issues possibles, aussi probables les unes que les autres, et ${a} permet${a > 1 ? 'tent' : ''} ${de(e.texte)} : ${chances(a, b)}.`;
};

const probaClasser: ItemGen = (level, rng, ctx) => {
  for (let essai = 0; essai < 100; essai++) {
    const x = level === 'facile' ? rng.pick([de6, cartes, () => sac(level, rng)])() : experience(level, rng);
    const b = x.issues.length;
    const cats =
      level === 'facile'
        ? ['impossible', 'possible', 'certain']
        : ['impossible', 'peu probable', 'probable', 'certain'];
    const els = rng
      .shuffle(x.events)
      .map((e) => ({ e, c: level === 'facile' ? categorie3(compte(x, e), b) : categorie4(compte(x, e), b) }))
      .filter((o): o is { e: Ev; c: number } => o.c !== null)
      .slice(0, level === 'facile' ? 4 : 5);
    if (els.length < 3 || new Set(els.map((o) => o.c)).size < (level === 'facile' ? 2 : 3)) continue;
    return make(ctx, 'classification', `classe-${x.intro}-${els.map((o) => o.e.texte).join('|')}`, {
      prompt: `${x.intro} Range chaque évènement.`,
      categories: cats,
      elements: els.map((o) => ({ label: cap(o.e.texte), category: o.c })),
      explication:
        level === 'facile'
          ? 'Impossible : cela ne peut jamais arriver ; certain : cela arrive à coup sûr ; possible : cela peut arriver ou non.'
          : 'Je compte les issues favorables : aucune → impossible ; toutes → certain ; plus de la moitié → probable ; moins de la moitié → peu probable.',
      difficulty: level === 'facile' ? 0.25 : x.etapes > 1 ? 0.75 : 0.5,
    });
  }
  throw new Error('probabilités : classement impossible');
};

/** Un évènement ni impossible ni certain. */
function evenementPossible(x: Experience, rng: Rng): Ev {
  const b = x.issues.length;
  return rng.pick(x.events.filter((e) => compte(x, e) > 0 && compte(x, e) < b));
}

const INDEPENDANCE = [
  {
    intro: (p: string, il: string) =>
      `${p} lance un dé et obtient 6 trois fois de suite. ${cap(il)} lance le dé une quatrième fois.`,
    good: 'il y a toujours 1 chance sur 6 d’obtenir 6',
    wrong: [
      'il y a plus de chances d’obtenir 6',
      'il y a moins de chances d’obtenir 6',
      'il est impossible d’obtenir encore 6',
    ],
    expl: 'Le dé ne se souvient pas des lancers précédents : à chaque lancer, il y a 1 chance sur 6 d’obtenir 6.',
  },
  {
    intro: (p: string, il: string) =>
      `${p} lance une pièce et obtient face cinq fois de suite. ${cap(il)} la lance encore une fois.`,
    good: 'il y a toujours 1 chance sur 2 d’obtenir pile',
    wrong: [
      'il est certain d’obtenir pile',
      'il y a plus de chances d’obtenir pile',
      'il est impossible d’obtenir face',
    ],
    expl: 'La pièce ne se souvient pas des lancers précédents : à chaque lancer, il y a 1 chance sur 2 d’obtenir pile.',
  },
];

const probaQcm: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, { facile: 0, normal: rng.int(1, 4), plus_loin: rng.int(1, 5) });
  if (forme === 0) {
    const x = rng.pick([de6, piece, cartes, () => sac(level, rng)])();
    const e = rng.pick(x.events);
    const c = categorie3(compte(x, e), x.issues.length);
    const choix = ['impossible', 'possible', 'certain'];
    return mcq(ctx, rng, `vocab-${x.intro}-${e.texte}`, {
      question: `${x.intro} « ${cap(e.texte)} », c’est…`,
      good: choix[c]!,
      wrong: choix,
      fixedOrder: choix,
      explication: explChances(x, e),
      difficulty: 0.25,
    });
  }
  if (forme === 3) {
    const t = rng.pick(INDEPENDANCE);
    const p = rng.pick(PERSOS);
    return mcq(ctx, rng, `indep-${t.good}-${p.nom}`, {
      question: `${t.intro(p.nom, p.il)} Que peut-on dire ?`,
      good: t.good,
      wrong: t.wrong,
      explication: t.expl,
      difficulty: 0.55,
    });
  }
  if (forme === 4) {
    // Deux issues ne veulent pas dire « une chance sur deux »
    const k = rng.int(2, 9);
    const q = `Dans un sac, il y a 1 bille rouge et ${k} billes bleues. Il y a deux couleurs possibles. Combien de chances a-t-on de tirer la bille rouge ?`;
    return mcq(ctx, rng, `deux-couleurs-${k}`, {
      question: q,
      good: chances(1, k + 1),
      wrong: [chances(1, 2), chances(1, k), chances(k, k + 1), chances(2, k + 1)].filter(
        (w) => w !== chances(1, k + 1),
      ),
      explication: `Ce n’est pas parce qu’il y a deux couleurs qu’on a une chance sur deux : il y a ${k + 1} billes en tout et une seule est rouge, donc ${chances(1, k + 1)}.`,
      difficulty: 0.6,
    });
  }
  const x = experience(level, rng);
  const b = x.issues.length;
  if (forme === 2) {
    // Comparer : quel évènement est le plus probable ?
    const parA = new Map<number, Ev>();
    for (const e of rng.shuffle(x.events)) if (!parA.has(compte(x, e))) parA.set(compte(x, e), e);
    const evs = [...parA.values()].slice(0, 4);
    if (evs.length >= 2) {
      const best = evs.reduce((m, e) => (compte(x, e) > compte(x, m) ? e : m));
      return mcq(ctx, rng, `comparer-${x.intro}-${evs.map((e) => e.texte).join('|')}`, {
        question: `${x.intro} Quel évènement est le plus probable ?`,
        good: cap(best.texte),
        wrong: evs.filter((e) => e !== best).map((e) => cap(e.texte)),
        explication: `On compte les issues favorables de chaque évènement : ${evs.map((e) => `${e.texte} → ${chances(compte(x, e), b)}`).join(' ; ')}.`,
        difficulty: 0.55 + (x.etapes > 1 ? 0.2 : 0),
      });
    }
  }
  // « a chances sur b » (forme 1) ; écriture fractionnaire pour aller plus loin (forme 5)
  const e = evenementPossible(x, rng);
  const a = compte(x, e);
  if (forme === 5) {
    const faux = [`${b - a}/${b}`, `${a}/${b - a}`, `1/${b}`, `${a}/${b + 1}`].filter((f) => {
      const [n, d] = f.split('/').map(Number);
      return n! > 0 && d! > 0 && Math.abs(n! / d! - a / b) > 1e-9;
    });
    return mcq(ctx, rng, `fraction-${x.intro}-${e.texte}`, {
      question: `${x.intro} Quelle fraction donne la probabilité ${de(e.texte)} ?`,
      good: `${a}/${b}`,
      wrong: faux,
      explication: `${explChances(x, e)} On peut l’écrire ${a}/${b}.`,
      difficulty: 0.8,
    });
  }
  const faux = [
    chances(b - a, b),
    ...(a < b - a ? [chances(a, b - a)] : []),
    chances(1, b),
    chances(a, b + 1),
    chances(a, 2 * b),
  ].filter((f) => {
    const m = f.match(/^(\d+) chances? sur (\d+)$/)!;
    return Math.abs(Number(m[1]) / Number(m[2]) - a / b) > 1e-9;
  });
  return mcq(ctx, rng, `chances-${x.intro}-${e.texte}`, {
    question: `${x.intro} Combien de chances a-t-on ${de(e.texte)} ?`,
    good: chances(a, b),
    wrong: faux,
    explication: explChances(x, e),
    difficulty: 0.45 + (x.etapes > 1 ? 0.25 : 0),
  });
};

const ARBRE = ' (Aide-toi d’un tableau ou d’un arbre.)';

const probaNumeric: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, { facile: rng.int(0, 1), normal: rng.int(0, 2), plus_loin: rng.int(1, 3) });
  const x =
    level === 'facile' ? rng.pick([de6, piece, cartes, () => sac(level, rng)])() : experience(level, rng);
  const b = x.issues.length;
  if (forme === 0) {
    return numeric(ctx, `issues-${x.intro}`, {
      prompt: `${x.intro} Combien y a-t-il d’issues possibles${x.etapes === 1 && /sac|roue/i.test(x.intro) ? ' (chaque bille ou chaque part compte)' : ''} ?${x.etapes > 1 ? ARBRE : ''}`,
      answer: b,
      explication:
        x.etapes > 1
          ? `On liste toutes les possibilités dans un tableau ou un arbre : il y en a ${b}.`
          : `On compte toutes les possibilités : il y en a ${b}.`,
      difficulty: 0.2 + (x.etapes > 1 ? 0.4 : 0),
    });
  }
  const e = level === 'facile' ? rng.pick(x.events) : evenementPossible(x, rng);
  const a = compte(x, e);
  if (forme === 1) {
    return numeric(ctx, `favorables-${x.intro}-${e.texte}`, {
      prompt: `${x.intro} Combien d’issues permettent ${de(e.texte)} ?${x.etapes > 1 ? ARBRE : ''}`,
      answer: a,
      explication: explChances(x, e),
      difficulty: 0.3 + (x.etapes > 1 ? 0.35 : 0),
    });
  }
  if (forme === 2) {
    return numeric(ctx, `a-sur-b-${x.intro}-${e.texte}`, {
      prompt: `${x.intro} Il y a … chance${a > 1 ? 's' : ''} sur ${b} ${de(e.texte)}.`,
      spoken: `${x.intro} Combien de chances sur ${b} y a-t-il ${de(e.texte)} ?`,
      answer: a,
      explication: explChances(x, e),
      difficulty: 0.45 + (x.etapes > 1 ? 0.25 : 0),
    });
  }
  return numeric(ctx, `frac-${x.intro}-${e.texte}`, {
    prompt: `${x.intro} La probabilité ${de(e.texte)} s’écrit …/${b}.`,
    spoken: `${x.intro} La probabilité ${de(e.texte)} s’écrit combien sur ${b} ?`,
    answer: a,
    explication: `${explChances(x, e)} On l’écrit ${a}/${b}.`,
    difficulty: 0.75,
  });
};

const probaVraiFaux: ItemGen = (level, rng, ctx) => {
  const juste = rng.chance(0.5);
  const r = rng.next();
  if (level === 'facile') {
    const x = rng.pick([de6, piece, cartes, () => sac(level, rng)])();
    const e = rng.pick(x.events);
    const c = categorie3(compte(x, e), x.issues.length);
    const mots = ['impossible', 'possible', 'certain'];
    const dit = juste ? mots[c]! : rng.pick(mots.filter((_, i) => i !== c));
    return vraiFaux(ctx, `vf-vocab-${x.intro}-${e.texte}-${dit}`, {
      statement: `${x.intro} « ${cap(e.texte)} » est ${dit}.`,
      answer: juste,
      explication: explChances(x, e),
      difficulty: 0.25,
    });
  }
  if (r < 0.2) {
    const p = rng.pick(PERSOS);
    const dit = juste
      ? `Au prochain lancer, ${p.nom} a toujours 1 chance sur 6 d’obtenir 6.`
      : rng.pick([
          `Au prochain lancer, ${p.nom} a moins de chances d’obtenir 6.`,
          `Au prochain lancer, ${p.nom} a plus de chances d’obtenir 6.`,
        ]);
    return vraiFaux(ctx, `vf-indep-${p.nom}-${dit}`, {
      statement: `${p.nom} a obtenu 6 trois fois de suite avec un dé. ${dit}`,
      answer: juste,
      explication:
        'Le dé ne se souvient pas des lancers précédents : à chaque lancer, il y a 1 chance sur 6 d’obtenir 6.',
      difficulty: 0.5,
    });
  }
  const x = experience(level, rng);
  const b = x.issues.length;
  const e = evenementPossible(x, rng);
  const a = compte(x, e);
  const faux = [b - a, a + 1, a - 1].filter((v) => v > 0 && v < b && v !== a);
  const montre = juste || !faux.length ? a : rng.pick(faux);
  return vraiFaux(ctx, `vf-chances-${x.intro}-${e.texte}-${montre}`, {
    statement: `${x.intro} On a ${chances(montre, b)} ${de(e.texte)}.`,
    answer: montre === a,
    explication: explChances(x, e),
    difficulty: 0.5 + (x.etapes > 1 ? 0.2 : 0),
  });
};

export const DONNEES: Record<string, LessonContent> = {
  'CM2.MA.DON.LIRE': {
    gens: {
      mcq: donneesQcm,
      numeric_answer: donneesNumeric,
      true_false: donneesVraiFaux,
      classification: donneesClasser,
    },
  },
  'CM2.MA.PROBA': {
    gens: {
      classification: probaClasser,
      mcq: probaQcm,
      numeric_answer: probaNumeric,
      true_false: probaVraiFaux,
    },
  },
};

/** Pour les tests : expériences et dénombrement. */
export const _proba = { de6, piece, cartes, sac, deuxPieces, pieceDe, deuxDes, troisPieces, compte };
