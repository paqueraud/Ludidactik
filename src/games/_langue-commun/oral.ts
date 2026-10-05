/**
 * Comparaison tolérante d'une réponse orale (reconnaissance vocale) avec la réponse attendue.
 * La reconnaissance vocale écrit souvent un homophone (« vers » pour « vert ») ou un mot voisin
 * pour un pseudo-mot (« chouste » pour « choust ») : on compare donc une forme « phonétique »
 * approximative, avec une petite tolérance. Fonctions pures, testées.
 */
import { normalizeText } from '@/engine/answer';
import { graphiesNombre } from '@/engine/nombres';
import { cleMot, distance } from './texte';

const V = 'aeiouyéèêëàâîïôûù';

/**
 * Clé phonétique approximative du français (règles simples de correspondance graphie → son).
 * Deux écritures qui se prononcent pareil ont, le plus souvent, la même clé.
 */
export function phonetiser(mot: string): string {
  let x = normalizeText(mot).toLowerCase();
  x = x.replace(/[^\p{L}]/gu, '');
  x = x.replace(/œu/g, 'eu').replace(/œ/g, 'e').replace(/æ/g, 'e');
  x = x.replace(/ç/g, 's');
  // petits mots en « es » : les, des, mes, ces, est… se prononcent [e]
  x = x.replace(/^([ldmtsc]?)es$|^est$/, (_m, c: string | undefined) => `${c ?? ''}É`);
  // finales muettes et terminaisons fréquentes
  x = x.replace(/ent$/, (m) => (x.length > 4 ? 'e' : m));
  x = x.replace(/(er|ez|et|ai|ais|ait|aient|é|ée|és|ées)$/, 'É');
  x = x
    .replace(/[éèêë]/g, 'É')
    .replace(/[àâ]/g, 'a')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o');
  x = x.replace(/[ûüù]/g, 'u');
  x = x.replace(/eaux?|aux?|au/g, 'o');
  x = x
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/sch|sh|ch/g, 'S');
  x = x
    .replace(/qu|ck|k/g, 'K')
    .replace(/c(?![eiyÉ])/g, 'K')
    .replace(/c/g, 's');
  x = x
    .replace(/gu(?=[eiyÉ])/g, 'G')
    .replace(/ge(?=[aou])/g, 'J')
    .replace(/g(?=[eiyÉ])/g, 'J');
  x = x.replace(/gn/g, 'N').replace(/g/g, 'G');
  x = x.replace(new RegExp(`([${V}])ill`, 'g'), '$1Y').replace(/ill/g, 'iY');
  x = x.replace(/oi/g, 'wa').replace(/ou/g, 'U').replace(/eu/g, 'E');
  // voyelles nasales (sauf devant voyelle ou n/m doublé) ; « ien » se prononce [jɛ̃]
  const pasVoyelle = `(?![${V}ÉUEnm])`;
  x = x.replace(new RegExp(`ien${pasVoyelle}`, 'g'), 'i1');
  x = x.replace(new RegExp(`(ain|ein|aim|in|im|yn|ym|un|um)${pasVoyelle}`, 'g'), '1');
  x = x.replace(new RegExp(`(an|am|en|em)${pasVoyelle}`, 'g'), '2');
  x = x.replace(new RegExp(`(on|om)${pasVoyelle}`, 'g'), '3');
  x = x.replace(/ai|ei/g, 'É');
  x = x.replace(/y/g, 'i');
  x = x.replace(new RegExp(`([${V}É])s(?=[${V}É])`, 'g'), '$1z');
  x = x.replace(/h/g, '');
  x = x.replace(/([a-zA-Z])\1+/g, '$1');
  // lettres finales muettes
  x = x.replace(/(?<=.{2})e$/, '');
  x = x.replace(/(?<=.{2})[stdxp]$/, '');
  return x.replace(/e/g, 'E');
}

/** Les deux mots se ressemblent-ils assez à l'oral ? (lecture, pseudo-mots) */
export function motsProches(attendu: string, entendu: string): boolean {
  const a = cleMot(attendu);
  const b = cleMot(entendu);
  if (!a || !b) return false;
  if (a === b) return true;
  const pa = phonetiser(attendu);
  const pb = phonetiser(entendu);
  if (pa === pb) return true;
  const n = Math.max(a.length, b.length);
  if (n >= 4 && distance(a, b) <= (n >= 8 ? 2 : 1)) return true;
  return pa.length >= 4 && distance(pa, pb) <= 1;
}

/** Écritures possibles d'une transcription qui contient des chiffres (« 20 » → « vingt »). */
function variantesNombres(mot: string): string[] {
  if (!/^\d{1,9}$/.test(mot)) return [mot];
  return [mot, ...graphiesNombre(Number(mot))];
}

export interface VerdictOral {
  ok: boolean;
  /** La transcription retenue (pour « J'ai entendu : … »). */
  entendu: string;
}

/**
 * Une des transcriptions correspond-elle à une des réponses acceptées ?
 * Tolérant : homophones, pseudo-mots approchés, mot isolé dans une transcription plus longue.
 */
export function comparerOral(alternatives: string[], acceptes: string[]): VerdictOral {
  const alts = alternatives.map((a) => normalizeText(a)).filter(Boolean);
  for (const alt of alts) {
    for (const acc of acceptes) {
      const motsAcc = normalizeText(acc)
        .split(' ')
        .filter((m) => cleMot(m));
      const motsAlt = alt
        .split(' ')
        .flatMap(variantesNombres)
        .filter((m) => cleMot(m));
      if (!motsAcc.length || !motsAlt.length) continue;
      // phrase entière : même suite de mots (tolérance mot à mot)
      if (motsAcc.length === motsAlt.length && motsAcc.every((m, i) => motsProches(m, motsAlt[i]!)))
        return { ok: true, entendu: alt };
      // expression attendue collée par la reconnaissance (« cerf volant » / « cerf-volant »)
      if (motsProches(motsAcc.join(''), motsAlt.join(''))) return { ok: true, entendu: alt };
      // un mot isolé attendu, entendu au milieu d'autres (« euh… choust »)
      if (motsAcc.length === 1 && motsAlt.length <= 3 && motsAlt.some((m) => motsProches(motsAcc[0]!, m)))
        return { ok: true, entendu: alt };
    }
  }
  return { ok: false, entendu: alts[0] ?? '' };
}
