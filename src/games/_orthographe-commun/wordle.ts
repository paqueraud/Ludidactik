/**
 * Coloration « Wordle » d'un essai, accents compris.
 * - bien : bonne lettre, bonne place ;
 * - accent : bonne lettre à la bonne place mais accent différent (e / é) ;
 * - mal_place : la lettre est dans le mot, ailleurs ;
 * - absent : la lettre n'est pas (ou plus) dans le mot.
 * Les lettres répétées sont comptées : une lettre ne colore pas plus de cases qu'elle n'apparaît
 * dans le mot (passe 1 : places exactes, passe 2 : lettres mal placées, de gauche à droite).
 */
import { base, lettres } from './lettres';

export type EtatLettre = 'bien' | 'accent' | 'mal_place' | 'absent';

export function colorer(essai: string, cible: string): EtatLettre[] {
  const g = lettres(essai).map((c) => c.toLowerCase());
  const t = lettres(cible).map((c) => c.toLowerCase());
  const etats: (EtatLettre | null)[] = g.map(() => null);
  const restant = new Map<string, number>();

  // Passe 1 : lettres à la bonne place
  t.forEach((ch, i) => {
    const gi = g[i];
    if (gi === ch) etats[i] = 'bien';
    else if (gi !== undefined && base(gi) === base(ch)) etats[i] = 'accent';
    else restant.set(base(ch), (restant.get(base(ch)) ?? 0) + 1);
  });

  // Passe 2 : lettres présentes ailleurs (sans dépasser leur nombre d'apparitions)
  g.forEach((ch, i) => {
    if (etats[i]) return;
    const b = base(ch);
    const n = restant.get(b) ?? 0;
    if (n > 0) {
      etats[i] = 'mal_place';
      restant.set(b, n - 1);
    } else etats[i] = 'absent';
  });
  return etats as EtatLettre[];
}

const RANG: Record<EtatLettre, number> = { absent: 0, mal_place: 1, accent: 2, bien: 3 };

/**
 * État de chaque touche du clavier (lettre exacte, en minuscule) après plusieurs essais :
 * on garde le meilleur état connu. « accent » signale une lettre juste à qui il manque son accent.
 */
export function etatsClavier(essais: { mot: string; etats: EtatLettre[] }[]): Map<string, EtatLettre> {
  const out = new Map<string, EtatLettre>();
  for (const { mot, etats } of essais)
    lettres(mot).forEach((ch, i) => {
      const e = etats[i]!;
      const k = ch.toLowerCase();
      const prev = out.get(k);
      if (!prev || RANG[e] > RANG[prev]) out.set(k, e);
    });
  return out;
}
