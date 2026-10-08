/**
 * Tirage des 3 défis du jour (GAMIFICATION §4) — fonction pure, déterministe par (profil, date).
 * - Défi 1 : une leçon « en cours » (sinon une leçon de la période).
 * - Défi 2 : la leçon qui a le plus d'items à revoir (Leitner), sinon une autre leçon en cours.
 * - Défi 3 : une révision ancienne (leçon jouée il y a longtemps), sinon une leçon de la période.
 * Les modalités sont variées : on cherche un jeu où l'on écrit, un où l'on écoute ou parle, un où
 * l'on regarde ou manipule (d'après les `modalites` des jeux).
 */
import type { Level, Modality } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import type { DefiRow } from '@/services/storage/db';
import { hashSeed } from './dates';

export type Famille = DefiRow['famille'];
export type Motif = DefiRow['motif'];

export const FAMILLES: Famille[] = ['ecrit', 'oral', 'visuel'];

export const FAMILLE_META: Record<Famille, { label: string; icone: string }> = {
  ecrit: { label: 'J’écris', icone: '✏️' },
  oral: { label: 'J’écoute', icone: '👂' },
  visuel: { label: 'Je regarde et je manipule', icone: '👀' },
};

export const MOTIF_META: Record<Motif, { label: string; icone: string }> = {
  en_cours: { label: 'Ma leçon en cours', icone: '📌' },
  revoir: { label: 'À revoir', icone: '🔁' },
  ancienne: { label: 'Petite révision', icone: '🕰️' },
};

/** Jeux jamais tirés en défi : à deux joueurs, ou hors du temps d'un défi. */
export const JEUX_HORS_DEFIS = new Set(['dictee-duel']);

export function famillesDuJeu(modalites: readonly Modality[]): Famille[] {
  const out: Famille[] = [];
  if (modalites.includes('ecrire')) out.push('ecrit');
  if (modalites.includes('ecouter') || modalites.includes('parler')) out.push('oral');
  if (modalites.includes('regarder') || modalites.includes('manipuler')) out.push('visuel');
  return out;
}

export interface JeuCandidat {
  id: string;
  modalites: readonly Modality[];
  needsMic?: boolean;
}

export interface LeconCandidate {
  id: string;
  /** Jeux jouables pour cette leçon (contenu suffisant). */
  jeux: JeuCandidat[];
  /** Niveau proposé (Facile tant que la leçon n'est pas réussie en Normal). */
  niveau: Level;
}

export interface TirageEntree {
  profileId: string;
  day: string;
  enCours: LeconCandidate[];
  /** Leçons ayant des items à revoir, de la plus chargée à la moins chargée. */
  aRevoir: LeconCandidate[];
  /** Leçons jouées il y a longtemps (de la plus ancienne à la plus récente). */
  anciennes: LeconCandidate[];
  /** Leçons de la période scolaire actuelle (repli). */
  periode: LeconCandidate[];
  /** Reconnaissance vocale autorisée par le parent. */
  micro: boolean;
}

const jouable = (micro: boolean) => (j: JeuCandidat) => !JEUX_HORS_DEFIS.has(j.id) && (micro || !j.needsMic);

export function tirerDefis(e: TirageEntree): DefiRow[] {
  const rng = createRng(hashSeed(`${e.profileId}|${e.day}|defis`));
  const ok = jouable(e.micro);
  const utilisable = (l: LeconCandidate) => l.jeux.some(ok);
  const prises = new Set<string>();
  const choisir = (liste: LeconCandidate[], premiers?: number): LeconCandidate | null => {
    const dispo = liste.filter((l) => utilisable(l) && !prises.has(l.id));
    if (!dispo.length) return null;
    // les items à revoir et les révisions anciennes sont triés : on tire parmi les premiers
    const pool = premiers ? dispo.slice(0, premiers) : dispo;
    const l = rng.pick(pool);
    prises.add(l.id);
    return l;
  };

  const slots: { motif: Motif; lecon: LeconCandidate }[] = [];
  const push = (motif: Motif, l: LeconCandidate | null) => l && slots.push({ motif, lecon: l });
  push('en_cours', choisir(e.enCours) ?? choisir(e.periode));
  push('revoir', choisir(e.aRevoir, 2) ?? choisir(e.enCours));
  push('ancienne', choisir(e.anciennes, 3) ?? choisir(e.periode));
  // compléments si un tiroir était vide
  while (slots.length < 3) {
    const l = choisir(e.periode) ?? choisir(e.enCours) ?? choisir(e.anciennes) ?? choisir(e.aRevoir);
    if (!l) break;
    slots.push({ motif: e.enCours.some((x) => x.id === l.id) ? 'en_cours' : 'ancienne', lecon: l });
  }

  // Attribution des familles et des jeux : pour chaque façon de répartir les 3 familles entre les
  // tiroirs (ordre mélangé = variété), on cherche des jeux tous différents ; on garde la meilleure.
  const jeuxOk = slots.map((s) => rng.shuffle(s.lecon.jeux.filter(ok)));
  let meilleure = null as { familles: Famille[]; jeux: (JeuCandidat | null)[]; score: number } | null;
  for (const familles of rng.shuffle(permutations(FAMILLES))) {
    const listes = slots.map((_, i) =>
      jeuxOk[i]!.filter((j) => famillesDuJeu(j.modalites).includes(familles[i]!)),
    );
    const jeux = assigner(listes);
    const score = jeux.filter(Boolean).length;
    if (!meilleure || score > meilleure.score) meilleure = { familles, jeux, score };
  }

  const pris = new Set(meilleure?.jeux.filter((j): j is JeuCandidat => !!j).map((j) => j.id));
  return slots.map((s, i) => {
    let jeu = meilleure?.jeux[i] ?? null;
    let famille = meilleure?.familles[i] ?? 'visuel';
    if (!jeu) {
      // pas de jeu de la famille visée : un autre jeu de la leçon (différent si possible)
      jeu = jeuxOk[i]!.find((j) => !pris.has(j.id)) ?? jeuxOk[i]![0]!;
      pris.add(jeu.id);
      famille = famillesDuJeu(jeu.modalites)[0] ?? 'visuel';
    }
    return {
      lessonId: s.lecon.id,
      gameId: jeu.id,
      level: s.lecon.niveau,
      motif: s.motif,
      famille,
      fait: false,
      stars: 0,
    };
  });
}

/** Un jeu par tiroir, tous différents, en en plaçant le plus possible (retour arrière : listes courtes). */
function assigner(listes: JeuCandidat[][]): (JeuCandidat | null)[] {
  let best: (JeuCandidat | null)[] = listes.map(() => null);
  let bestScore = -1;
  const cur: (JeuCandidat | null)[] = [];
  const pris = new Set<string>();
  const explorer = (i: number, score: number) => {
    if (bestScore === listes.length) return;
    if (i === listes.length) {
      if (score > bestScore) {
        bestScore = score;
        best = [...cur];
      }
      return;
    }
    for (const j of listes[i]!) {
      if (pris.has(j.id)) continue;
      pris.add(j.id);
      cur.push(j);
      explorer(i + 1, score + 1);
      cur.pop();
      pris.delete(j.id);
    }
    cur.push(null);
    explorer(i + 1, score);
    cur.pop();
  };
  explorer(0, 0);
  return best;
}

function permutations<T>(l: readonly T[]): T[][] {
  if (l.length <= 1) return [[...l]];
  return l.flatMap((x, i) => permutations([...l.slice(0, i), ...l.slice(i + 1)]).map((p) => [x, ...p]));
}

/** Ludis gagnés à chaque défi réussi, et contenu de base du coffre. */
export const LUDIS_PAR_DEFI = 10;
export const LUDIS_COFFRE = 30;
/** Si tous les trésors sont déjà gagnés : des Ludis à la place de l'objet. */
export const LUDIS_COFFRE_SANS_OBJET = 20;
export const LUDIS_BOSS = 40;

/** Contenu du coffre : Ludis + un objet d'avatar « trésor » pas encore possédé (déterministe). */
export function contenuCoffre(
  profileId: string,
  day: string,
  tresors: readonly string[],
  possedes: ReadonlySet<string>,
): { ludis: number; objet: string | null } {
  const manquants = tresors.filter((t) => !possedes.has(t));
  if (!manquants.length) return { ludis: LUDIS_COFFRE + LUDIS_COFFRE_SANS_OBJET, objet: null };
  const rng = createRng(hashSeed(`${profileId}|${day}|coffre`));
  return { ludis: LUDIS_COFFRE, objet: rng.pick(manquants) };
}
