/**
 * CE1 — Organisation et gestion de données (BO n°41 du 31/10/2024) : recueillir des données, produire et lire
 * un tableau ou un diagramme en barres (axe gradué de 1 en 1), lire un tableau à double entrée.
 *
 * Les items portent `meta.graphique = { type, titre, etiquettes, valeurs, unite }` (Station météo) ; l'énoncé
 * reprend aussi les données en clair pour les jeux qui n'affichent pas de graphique, et `meta.question` contient
 * la question seule.
 */
import type { Rng } from '@/engine/rng';
import type { ItemGen, LessonContent } from '../../registry';
import type { Level } from '../../schemas';
import { clamp01, distinctInts, make, mcq, numeric, parNiv } from './util';

type Theme = { titre: string; etiquettes: string[]; unite: string; qui: string; verbe: string; max: number };

/** « 1 élèves » → « 1 élève », « 1 oiseaux » → « 1 oiseau ». */
const nb = (v: number, unite: string) => `${v} ${v > 1 ? unite : unite.replace(/x$/, '').replace(/s$/, '')}`;

/** Phrase de comparaison naturelle selon le thème. */
function plusQue(t: Theme, a: string, b: string): string {
  if (t.unite === 'jours') return `Il a plu plus de jours en ${a} qu’en ${b}.`;
  if (t.unite === 'élèves') return `Il y a plus de réponses « ${a} » que de réponses « ${b} ».`;
  return `On a compté plus ${de(a)} que ${/^[aeiouyéèê]/i.test(b) ? 'd’' : 'de '}${b}.`;
}

const THEMES: Theme[] = [
  {
    titre: 'Comment les élèves de l’école viennent à l’école',
    etiquettes: ['à pied', 'à vélo', 'en voiture', 'en bus', 'en trottinette'],
    unite: 'élèves',
    qui: 'élèves',
    verbe: 'viennent',
    max: 30,
  },
  {
    titre: 'Le fruit préféré des élèves de l’école',
    etiquettes: ['pomme', 'banane', 'fraise', 'orange', 'poire'],
    unite: 'élèves',
    qui: 'élèves',
    verbe: 'préfèrent',
    max: 30,
  },
  {
    titre: 'La couleur préférée des élèves de l’école',
    etiquettes: ['rouge', 'bleu', 'vert', 'jaune', 'violet'],
    unite: 'élèves',
    qui: 'élèves',
    verbe: 'préfèrent',
    max: 30,
  },
  {
    titre: 'Les jours de pluie de l’automne',
    etiquettes: ['septembre', 'octobre', 'novembre', 'décembre'],
    unite: 'jours',
    qui: 'jours de pluie',
    verbe: 'en',
    max: 25,
  },
  {
    titre: 'Les oiseaux vus dans la cour',
    etiquettes: ['moineaux', 'pigeons', 'merles', 'mésanges', 'pies'],
    unite: 'oiseaux',
    qui: 'oiseaux',
    verbe: '',
    max: 40,
  },
  {
    titre: 'Les déchets ramassés dans la cour',
    etiquettes: ['papiers', 'bouteilles', 'canettes', 'emballages'],
    unite: 'déchets',
    qui: 'déchets',
    verbe: '',
    max: 60,
  },
];

interface Donnees {
  theme: Theme;
  type: 'barres' | 'tableau';
  etiquettes: string[];
  valeurs: number[];
}

function tirer(level: Level, rng: Rng): Donnees {
  const theme = rng.pick(THEMES);
  const n = Math.min(
    theme.etiquettes.length,
    parNiv(level, { facile: 3, normal: rng.int(4, 5), plus_loin: 5 }),
  );
  const etiquettes = theme.etiquettes.slice(0, n);
  const max = parNiv(level, { facile: 10, normal: theme.max, plus_loin: Math.max(theme.max, 60) });
  // valeurs distinctes : le plus grand et le plus petit sont uniques
  const valeurs = distinctInts(rng, n, 1, max);
  return { theme, type: level === 'facile' || rng.chance(0.7) ? 'barres' : 'tableau', etiquettes, valeurs };
}

/** « de élèves » → « d’élèves ». */
const de = (mot: string) => (/^[aeiouyéèêh]/i.test(mot) ? `d’${mot}` : `de ${mot}`);

const enClair = (d: Donnees) =>
  `${d.theme.titre} — ${d.etiquettes.map((e, i) => `${e} : ${d.valeurs[i]}`).join(', ')}.`;

const meta = (d: Donnees, question: string, extra: Record<string, unknown> = {}) => ({
  graphique: {
    type: d.type,
    titre: d.theme.titre,
    etiquettes: d.etiquettes,
    valeurs: d.valeurs,
    unite: d.theme.unite,
  },
  question,
  ...extra,
});

const lire = (d: Donnees) =>
  d.type === 'barres' ? 'On lit la hauteur de chaque barre' : 'On lit chaque case du tableau';

const donneesQcm: ItemGen = (level, rng, ctx) => {
  const d = tirer(level, rng);
  const plus = rng.chance(0.6);
  const v = plus ? Math.max(...d.valeurs) : Math.min(...d.valeurs);
  const good = d.etiquettes[d.valeurs.indexOf(v)]!;
  const q =
    d.theme.unite === 'élèves'
      ? `Quelle est la réponse ${plus ? 'la plus' : 'la moins'} choisie ?`
      : d.theme.unite === 'jours'
        ? `Quel mois a eu ${plus ? 'le plus' : 'le moins'} de jours de pluie ?`
        : `Qu’a-t-on ${plus ? 'le plus' : 'le moins'} compté ?`;
  return mcq(ctx, rng, `qcm-${d.theme.titre}-${d.valeurs.join('-')}-${plus}`, {
    question: `${enClair(d)}\n${q}`,
    good,
    wrong: d.etiquettes.filter((e) => e !== good),
    max: 6,
    explication: `${lire(d)} : « ${good} » a ${nb(v, d.theme.unite)}, c’est ${plus ? 'le plus grand' : 'le plus petit'} nombre.`,
    difficulty: clamp01(0.2 + d.etiquettes.length * 0.05),
    meta: meta(d, q),
  });
};

/** Tableau à double entrée (BO : « Combien de garçons viennent à l'école en vélo ? »). */
function doubleEntree(rng: Rng) {
  const lignes = ['à pied', 'à vélo', 'en voiture', 'en bus'];
  const colonnes = ['filles', 'garçons'];
  const valeurs = lignes.map(() => colonnes.map(() => rng.int(2, 30)));
  return { lignes, colonnes, valeurs };
}

const donneesNumeric: ItemGen = (level, rng, ctx) => {
  const forme = parNiv(level, { facile: 0, normal: rng.int(0, 4), plus_loin: rng.int(1, 4) });
  if (forme === 3) {
    // Produire un diagramme : compter les réponses d'une enquête pour fixer la hauteur d'une barre
    const fruits = ['🍎', '🍌', '🍓'];
    const reponses = Array.from({ length: rng.int(10, 18) }, () => rng.pick(fruits));
    const f = rng.pick(fruits);
    const nomFruit = ({ '🍎': 'pommes', '🍌': 'bananes', '🍓': 'fraises' } as Record<string, string>)[f]!;
    const n = reponses.filter((x) => x === f).length;
    const q = `Pour construire le diagramme en barres (1 carreau = 1 élève), combien de carreaux de haut doit mesurer la barre des ${nomFruit} ${f} ?`;
    return numeric(ctx, `construire-${reponses.join('')}-${f}`, {
      prompt: `Voici les réponses de l’enquête « fruit préféré » : ${reponses.join(' ')}.\n${q}`,
      spoken: `Compte les ${nomFruit} dans les réponses de l’enquête.`,
      answer: n,
      unit: 'carreaux',
      explication: `On compte les ${nomFruit} ${f} : il y en a ${n}, donc la barre monte jusqu’à ${n}.`,
      difficulty: 0.45,
      meta: { question: q, enquete: reponses, aConstruire: f },
    });
  }
  if (forme === 4) {
    const t = doubleEntree(rng);
    const i = rng.int(0, 3);
    const j = rng.int(0, 1);
    const total = rng.chance(0.4);
    const q = total
      ? `Combien d’élèves viennent ${t.lignes[i]} en tout (filles et garçons) ?`
      : `Combien de ${t.colonnes[j]} viennent à l’école ${t.lignes[i]} ?`;
    const rep = total ? t.valeurs[i]![0]! + t.valeurs[i]![1]! : t.valeurs[i]![j]!;
    const txt = t.lignes
      .map((l, k) => `${l} : ${t.valeurs[k]![0]} filles et ${t.valeurs[k]![1]} garçons`)
      .join(' ; ');
    return numeric(ctx, `double-${t.valeurs.flat().join('-')}-${i}-${j}-${total}`, {
      prompt: `Tableau « Comment viens-tu à l’école ? » — ${txt}.\n${q}`,
      spoken: q,
      answer: rep,
      unit: 'élèves',
      explication: total
        ? `On lit la ligne « ${t.lignes[i]} » : ${t.valeurs[i]![0]} + ${t.valeurs[i]![1]} = ${rep}.`
        : `On croise la ligne « ${t.lignes[i]} » et la colonne « ${t.colonnes[j]} » : ${rep}.`,
      difficulty: total ? 0.7 : 0.5,
      meta: { question: q, tableauDouble: t },
    });
  }
  const d = tirer(level, rng);
  if (forme === 0) {
    const k = rng.int(0, d.etiquettes.length - 1);
    const q = `Combien ${de(d.theme.qui)} pour « ${d.etiquettes[k]} » ?`;
    return numeric(ctx, `lire-${d.theme.titre}-${d.valeurs.join('-')}-${k}`, {
      prompt: `${enClair(d)}\n${q}`,
      spoken: q,
      answer: d.valeurs[k]!,
      unit: d.theme.unite,
      explication: `${lire(d)} : « ${d.etiquettes[k]} » a ${nb(d.valeurs[k]!, d.theme.unite)}.`,
      difficulty: 0.2,
      meta: meta(d, q),
    });
  }
  if (forme === 1) {
    const [a, b] = rng.shuffle(d.etiquettes.map((_, i) => i)).slice(0, 2) as [number, number];
    const [g, p] = d.valeurs[a]! > d.valeurs[b]! ? [a, b] : [b, a];
    const q = `Combien ${de(d.theme.qui)} de plus pour « ${d.etiquettes[g]} » que pour « ${d.etiquettes[p]} » ?`;
    return numeric(ctx, `ecart-${d.theme.titre}-${d.valeurs.join('-')}-${g}-${p}`, {
      prompt: `${enClair(d)}\n${q}`,
      spoken: q,
      answer: d.valeurs[g]! - d.valeurs[p]!,
      unit: d.theme.unite,
      explication: `On lit ${d.valeurs[g]} et ${d.valeurs[p]}, puis on calcule l’écart : ${d.valeurs[g]} − ${d.valeurs[p]} = ${d.valeurs[g]! - d.valeurs[p]!}.`,
      difficulty: 0.6,
      meta: meta(d, q),
    });
  }
  const somme = d.valeurs.reduce((x, y) => x + y, 0);
  const q = `Combien ${de(d.theme.qui)} en tout ?`;
  return numeric(ctx, `total-${d.theme.titre}-${d.valeurs.join('-')}`, {
    prompt: `${enClair(d)}\n${q}`,
    spoken: q,
    answer: somme,
    unit: d.theme.unite,
    explication: `On ajoute toutes les valeurs : ${d.valeurs.join(' + ')} = ${somme}.`,
    difficulty: 0.7,
    meta: meta(d, q),
  });
};

const donneesVraiFaux: ItemGen = (level, rng, ctx) => {
  const d = tirer(level, rng);
  const [a, b] = rng.shuffle(d.etiquettes.map((_, i) => i)).slice(0, 2) as [number, number];
  const q = plusQue(d.theme, d.etiquettes[a]!, d.etiquettes[b]!);
  return make(ctx, 'true_false', `vf-${d.theme.titre}-${d.valeurs.join('-')}-${a}-${b}`, {
    statement: `${enClair(d)}\n${q}`,
    spoken: q,
    answer: d.valeurs[a]! > d.valeurs[b]!,
    explication: `« ${d.etiquettes[a]} » : ${d.valeurs[a]}, « ${d.etiquettes[b]} » : ${d.valeurs[b]}.`,
    difficulty: 0.35,
    meta: meta(d, q),
  });
};

const FRUITS: [string, string][] = [
  ['🍎', 'pomme'],
  ['🍌', 'banane'],
  ['🍓', 'fraise'],
  ['🍐', 'poire'],
];
const ENFANTS = [
  'Léo',
  'Lucie',
  'Inès',
  'Malo',
  'Sami',
  'Jade',
  'Noé',
  'Zoé',
  'Hugo',
  'Lina',
  'Enzo',
  'Maya',
];

const donneesClasser: ItemGen = (level, rng, ctx) => {
  if (level === 'facile') {
    // Recueillir : trier les réponses d'une enquête avant de les compter
    const fruits = rng.shuffle(FRUITS).slice(0, 3);
    const enfants = rng.shuffle(ENFANTS).slice(0, 8);
    const elements = enfants.map((e) => {
      const k = rng.int(0, 2);
      return { label: `${e} : ${fruits[k]![0]}`, category: k, image: fruits[k]![0] };
    });
    return make(ctx, 'classification', `enquete-${elements.map((e) => e.label).join('|')}`, {
      prompt: 'Enquête « fruit préféré » : range chaque réponse dans la bonne colonne du tableau.',
      categories: fruits.map((f) => f[1]),
      elements,
      explication:
        'On range chaque réponse dans sa colonne, puis on compte chaque colonne pour remplir le tableau.',
      difficulty: 0.2,
    });
  }
  const d = tirer(level, rng);
  const seuil = d.valeurs.slice().sort((a, b) => a - b)[Math.floor(d.valeurs.length / 2)]!;
  const cats = [`${seuil} ou plus`, `moins de ${seuil}`];
  const q = `Range chaque catégorie : ${seuil} ${d.theme.unite} ou plus, ou moins de ${seuil} ?`;
  return make(ctx, 'classification', `seuil-${d.theme.titre}-${d.valeurs.join('-')}`, {
    prompt: `${enClair(d)}\n${q}`,
    spoken: q,
    categories: cats,
    elements: d.etiquettes.map((e, i) => ({ label: e, category: d.valeurs[i]! >= seuil ? 0 : 1 })),
    explication: `${lire(d)} et on compare chaque nombre à ${seuil}.`,
    difficulty: 0.5,
    meta: meta(d, q),
  });
};

export const DONNEES: Record<string, LessonContent> = {
  'CE1.MA.DON.LIRE': {
    gens: {
      mcq: donneesQcm,
      numeric_answer: donneesNumeric,
      true_false: donneesVraiFaux,
      classification: donneesClasser,
    },
  },
};
