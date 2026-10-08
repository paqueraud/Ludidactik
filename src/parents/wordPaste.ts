/**
 * Collage d'une liste de mots : un mot par ligne, ou séparés par des virgules / points-virgules / tabulations.
 * Nettoyage : espaces superflus, puces et numéros (« - », « • », « 1. », « 2) »), guillemets et point final.
 * Les doublons (sans tenir compte de la casse) sont retirés ; la casse saisie est conservée (noms propres).
 */

export const MOT_MAX = 40;

export interface PasteResult {
  mots: string[];
  /** Mots ignorés car déjà présents (dans le collage ou dans la liste existante). */
  doublons: string[];
  /** Morceaux ignorés car trop longs (probablement une phrase). */
  tropLongs: string[];
}

/** Clé de comparaison : minuscules, Unicode NFC, apostrophe droite. */
export const cleMot = (m: string) => m.normalize('NFC').toLocaleLowerCase('fr-FR').replace(/[’ʼ]/g, "'");

/** Nettoie un mot isolé (saisie ou collage). */
export function nettoyerMot(brut: string): string {
  return brut
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:[-–—•*·▪●◦]+|\d{1,3}\s*[.)-])\s*/, '')
    .replace(/^["«“'‘\s]+|["»”.!?…:\s]+$/g, '')
    .trim();
}

export function parseWordPaste(texte: string, existants: string[] = []): PasteResult {
  const vus = new Set(existants.map(cleMot));
  const mots: string[] = [];
  const doublons: string[] = [];
  const tropLongs: string[] = [];
  for (const morceau of texte.split(/[\r\n,;\t]+/)) {
    const mot = nettoyerMot(morceau);
    if (!mot) continue;
    if (mot.length > MOT_MAX) {
      tropLongs.push(mot);
      continue;
    }
    const k = cleMot(mot);
    if (vus.has(k)) {
      doublons.push(mot);
      continue;
    }
    vus.add(k);
    mots.push(mot);
  }
  return { mots, doublons, tropLongs };
}
