/** Les wagons du Train des accords (fonction pure, testée). */
import type { Trou } from '../_orthographe-commun/trou';

export interface Wagon {
  avant: string;
  apres: string;
  /** Wagon vide (à accrocher). */
  trou: boolean;
}

/** Les wagons : les mots du groupe (meta.groupe), sinon les mots de la phrase. */
export function wagonsDe(t: Trou): Wagon[] {
  if (t.groupe) {
    let i = t.groupe.findIndex((g) => g.includes('___'));
    if (i < 0) i = t.groupe.findIndex((g) => g.toLowerCase() === t.reponse.toLowerCase());
    if (i < 0) i = t.groupe.findIndex((g) => t.choix?.some((c) => c.toLowerCase() === g.toLowerCase()));
    const mots = i < 0 ? [...t.groupe, '___'] : t.groupe;
    const k = i < 0 ? mots.length - 1 : i;
    return mots.map((g, j) => {
      if (j !== k) return { avant: g, apres: '', trou: false };
      const [a = '', b = ''] = g.includes('___') ? g.split(/_{3,}/) : ['', ''];
      return { avant: a, apres: b, trou: true };
    });
  }
  const jetons = `${t.avant}___${t.apres}`.split(/\s+/).filter(Boolean);
  return jetons.map((j) => {
    if (!j.includes('___')) return { avant: j, apres: '', trou: false };
    const [a = '', b = ''] = j.split(/_{3,}/);
    return { avant: a, apres: b, trou: true };
  });
}
