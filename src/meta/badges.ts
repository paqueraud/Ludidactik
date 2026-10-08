/**
 * Badges (GAMIFICATION §5). Ils récompensent l'effort et la variété, jamais l'heure à laquelle on
 * joue : pas de « Lève-tôt » ni de « Couche-tard » (aucune incitation à jouer tard ou très tôt),
 * et aucun badge ne se perd.
 */

export interface StatsBadges {
  partiesParJeu: Record<string, number>;
  victoiresParJeu: Record<string, number>;
  /** Mots écrits sans faute dans les jeux de dictée (on écoute puis on écrit). */
  motsDicteeJustes: number;
  /** Parties des jeux où l'on parle. */
  partiesOrales: number;
  jeuxDifferents: number;
  /** Parties terminées avec 3 étoiles. */
  troisEtoiles: number;
  /** Leçons de tables réussies à 3 étoiles en Normal / nombre de leçons de tables de la classe. */
  tablesTroisEtoiles: number;
  tablesTotal: number;
  matieres: number;
  defisReussis: number;
  coffres: number;
  bossGagnes: number;
  flamme: number;
  gemmes: number;
  objets: number;
}

export interface BadgeDef {
  id: string;
  titre: string;
  description: string;
  icone: string;
  /** Dégradé Tailwind de la médaille. */
  couleur: string;
  /** Avancement vers le badge (obtenu quand n ≥ but). */
  progression(s: StatsBadges): { n: number; but: number };
}

const jeu = (s: Record<string, number>, id: string) => s[id] ?? 0;

export const BADGES: BadgeDef[] = [
  {
    id: 'premier_galop',
    titre: 'Premier galop',
    description: 'Termine ta première course du Grand Prix.',
    icone: '🏇',
    couleur: 'from-sun to-coral',
    progression: (s) => ({ n: jeu(s.partiesParJeu, 'grand-prix'), but: 1 }),
  },
  {
    id: 'sommet_atteint',
    titre: 'Sommet atteint',
    description: 'Atteins le sommet de L’Ascension.',
    icone: '🏔️',
    couleur: 'from-sky to-grape',
    progression: (s) => ({ n: jeu(s.victoiresParJeu, 'ascension'), but: 1 }),
  },
  {
    id: 'tete_epaules',
    titre: 'Tête bien sur les épaules',
    description: 'Sois acquitté 10 fois à La Guillotine.',
    icone: '⚖️',
    couleur: 'from-coral to-sky',
    progression: (s) => ({ n: jeu(s.victoiresParJeu, 'guillotine'), but: 10 }),
  },
  {
    id: 'tables_fer',
    titre: 'Tables de fer',
    description: 'Obtiens 3 étoiles en Normal dans toutes les leçons de tables de ta classe.',
    icone: '🛡️',
    couleur: 'from-ink-soft to-sky-dark',
    progression: (s) => ({ n: s.tablesTroisEtoiles, but: Math.max(1, s.tablesTotal) }),
  },
  {
    id: 'oreille_or',
    titre: 'Oreille d’or',
    description: 'Écris 100 mots de dictée sans faute.',
    icone: '👂',
    couleur: 'from-sun to-sun-dark',
    progression: (s) => ({ n: s.motsDicteeJustes, but: 100 }),
  },
  {
    id: 'orateur',
    titre: 'Orateur',
    description: 'Joue 10 parties où l’on parle à voix haute.',
    icone: '🎤',
    couleur: 'from-grape to-coral',
    progression: (s) => ({ n: s.partiesOrales, but: 10 }),
  },
  {
    id: 'explorateur',
    titre: 'Explorateur',
    description: 'Essaie 20 jeux différents.',
    icone: '🧭',
    couleur: 'from-grass to-sky',
    progression: (s) => ({ n: s.jeuxDifferents, but: 20 }),
  },
  {
    id: 'touche_a_tout',
    titre: 'Touche-à-tout',
    description: 'Joue dans 4 matières différentes.',
    icone: '🎨',
    couleur: 'from-coral to-grape',
    progression: (s) => ({ n: s.matieres, but: 4 }),
  },
  {
    id: 'triple_etoile',
    titre: 'Triple étoile',
    description: 'Termine une partie avec 3 étoiles.',
    icone: '⭐',
    couleur: 'from-sun to-grass',
    progression: (s) => ({ n: s.troisEtoiles, but: 1 }),
  },
  {
    id: 'releve_defis',
    titre: 'Relève les défis',
    description: 'Réussis 10 défis du jour.',
    icone: '🎯',
    couleur: 'from-coral to-sun',
    progression: (s) => ({ n: s.defisReussis, but: 10 }),
  },
  {
    id: 'chasseur_tresors',
    titre: 'Chasseur de trésors',
    description: 'Ouvre ton premier coffre au trésor.',
    icone: '🎁',
    couleur: 'from-sun to-coral',
    progression: (s) => ({ n: s.coffres, but: 1 }),
  },
  {
    id: 'flamme_7',
    titre: 'Belle flamme',
    description: 'Fais briller ta flamme 7 jours. Les jours de repos gelés ne l’éteignent pas !',
    icone: '🔥',
    couleur: 'from-sun to-coral',
    progression: (s) => ({ n: s.flamme, but: 7 }),
  },
  {
    id: 'dompteur',
    titre: 'Dompteur de dragon',
    description: 'Vaincs le Dragon des tables, le défi bonus du week-end.',
    icone: '🐉',
    couleur: 'from-grass to-grass-dark',
    progression: (s) => ({ n: s.bossGagnes, but: 1 }),
  },
  {
    id: 'batisseur',
    titre: 'Bâtisseur',
    description: 'Gagne ta première gemme de maîtrise pour ton île.',
    icone: '💎',
    couleur: 'from-sky to-grass',
    progression: (s) => ({ n: s.gemmes, but: 1 }),
  },
  {
    id: 'architecte',
    titre: 'Architecte',
    description: 'Construis 10 bâtiments sur ton île.',
    icone: '🏰',
    couleur: 'from-grape to-sky',
    progression: (s) => ({ n: s.gemmes, but: 10 }),
  },
  {
    id: 'collectionneur',
    titre: 'Collectionneur',
    description: 'Possède 5 objets pour ton avatar.',
    icone: '👑',
    couleur: 'from-sun to-grape',
    progression: (s) => ({ n: s.objets, but: 5 }),
  },
];

export const getBadge = (id: string) => BADGES.find((b) => b.id === id);

/** Badges obtenus d'après les statistiques. */
export function badgesObtenus(s: StatsBadges): string[] {
  return BADGES.filter((b) => {
    const p = b.progression(s);
    return p.n >= p.but;
  }).map((b) => b.id);
}

/** Leçons de tables (badge « Tables de fer ») par classe. */
export const LECONS_TABLES: Record<string, string[]> = {
  CE1: ['CE1.MA.CM.TABLES_ADD', 'CE1.MA.CM.TABLES_MULT'],
  CM2: ['CM2.MA.CM.FAITS'],
};
