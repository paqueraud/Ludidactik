/**
 * Moteur de conjugaison (fonctions pures, sans dépendance).
 *
 * Verbes couverts :
 * - être, avoir ;
 * - 1er groupe, y compris les verbes en -cer (ç), -ger (ge), -yer (y/i), -eler/-eter (doublement ou è),
 *   e + consonne + er (lever → je lève), é + consonne + er (préférer → je préfère) ;
 * - 2e groupe (finir, choisir…) ;
 * - 3e groupe du BO 2025 : aller, faire, dire, venir (revenir, devenir), pouvoir, voir, vouloir,
 *   prendre (apprendre, comprendre) ; et, pour aller plus loin : partir, sortir, dormir, mettre, écrire, lire.
 *
 * Temps : présent, imparfait, futur, passé simple, conditionnel présent, passé composé, plus-que-parfait,
 * impératif présent. Participe passé et accord avec l'auxiliaire être.
 *
 * `formes()` renvoie toutes les graphies justes : la première est la graphie de référence, les suivantes
 * sont des variantes admises (je paie / je paye ; rectifications de 1990 : je préfèrerai, j'épèle ;
 * accord au féminin quand le genre du sujet n'est pas connu : je suis allé / je suis allée).
 */

export type Temps =
  | 'present'
  | 'imparfait'
  | 'futur'
  | 'passe_simple'
  | 'conditionnel'
  | 'passe_compose'
  | 'plus_que_parfait'
  | 'imperatif';

/** 0 = je, 1 = tu, 2 = il/elle/on, 3 = nous, 4 = vous, 5 = ils/elles. */
export type Personne = 0 | 1 | 2 | 3 | 4 | 5;
export const PERSONNES: readonly Personne[] = [0, 1, 2, 3, 4, 5];
/** Personnes de l'impératif : tu, nous, vous. */
export const PERSONNES_IMPERATIF: readonly Personne[] = [1, 3, 4];

export const PRONOMS = ['je', 'tu', 'il', 'nous', 'vous', 'ils'] as const;

export const NOM_TEMPS: Record<Temps, string> = {
  present: 'présent',
  imparfait: 'imparfait',
  futur: 'futur',
  passe_simple: 'passé simple',
  conditionnel: 'conditionnel présent',
  passe_compose: 'passé composé',
  plus_que_parfait: 'plus-que-parfait',
  imperatif: 'impératif présent',
};

/** « au présent », « à l'imparfait »… */
export const AU_TEMPS: Record<Temps, string> = {
  present: 'au présent',
  imparfait: 'à l’imparfait',
  futur: 'au futur',
  passe_simple: 'au passé simple',
  conditionnel: 'au conditionnel présent',
  passe_compose: 'au passé composé',
  plus_que_parfait: 'au plus-que-parfait',
  imperatif: 'à l’impératif présent',
};

export const TEMPS_COMPOSES: readonly Temps[] = ['passe_compose', 'plus_que_parfait'];
export const estCompose = (t: Temps) => TEMPS_COMPOSES.includes(t);

export interface OptionsForme {
  /** Sujet féminin (accord du participe passé avec être). undefined = genre inconnu : les deux sont admis. */
  fem?: boolean;
  /** Sujet pluriel (par défaut : nous, vous, ils). */
  plur?: boolean;
  /** Forme négative (temps composés) : « n’ai pas chanté ». */
  negation?: boolean;
}

/* ------------------------------------------------------------------ */
/* Verbes irréguliers : tables explicites                              */
/* ------------------------------------------------------------------ */

type Six = readonly [string, string, string, string, string, string];

interface Irregulier {
  present: Six;
  /** Variantes admises au présent (je puis). */
  presentVariantes?: Partial<Record<Personne, string[]>>;
  /** Radical de l'imparfait (« fais » → faisais, faisions). */
  imparfait: string;
  /** Radical du futur et du conditionnel (« ir » → irai, irais). */
  futur: string;
  passeSimple: Six;
  participe: string;
  aux: 'avoir' | 'être';
  /** tu, nous, vous ; null = pas d'impératif en usage à l'école (pouvoir). */
  imperatif: readonly [string, string, string] | null;
}

const IRREGULIERS: Record<string, Irregulier> = {
  être: {
    present: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
    imparfait: 'ét',
    futur: 'ser',
    passeSimple: ['fus', 'fus', 'fut', 'fûmes', 'fûtes', 'furent'],
    participe: 'été',
    aux: 'avoir',
    imperatif: ['sois', 'soyons', 'soyez'],
  },
  avoir: {
    present: ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
    imparfait: 'av',
    futur: 'aur',
    passeSimple: ['eus', 'eus', 'eut', 'eûmes', 'eûtes', 'eurent'],
    participe: 'eu',
    aux: 'avoir',
    imperatif: ['aie', 'ayons', 'ayez'],
  },
  aller: {
    present: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'],
    imparfait: 'all',
    futur: 'ir',
    passeSimple: ['allai', 'allas', 'alla', 'allâmes', 'allâtes', 'allèrent'],
    participe: 'allé',
    aux: 'être',
    imperatif: ['va', 'allons', 'allez'],
  },
  faire: {
    present: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'],
    imparfait: 'fais',
    futur: 'fer',
    passeSimple: ['fis', 'fis', 'fit', 'fîmes', 'fîtes', 'firent'],
    participe: 'fait',
    aux: 'avoir',
    imperatif: ['fais', 'faisons', 'faites'],
  },
  dire: {
    present: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'],
    imparfait: 'dis',
    futur: 'dir',
    passeSimple: ['dis', 'dis', 'dit', 'dîmes', 'dîtes', 'dirent'],
    participe: 'dit',
    aux: 'avoir',
    imperatif: ['dis', 'disons', 'dites'],
  },
  venir: {
    present: ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'],
    imparfait: 'ven',
    futur: 'viendr',
    passeSimple: ['vins', 'vins', 'vint', 'vînmes', 'vîntes', 'vinrent'],
    participe: 'venu',
    aux: 'être',
    imperatif: ['viens', 'venons', 'venez'],
  },
  pouvoir: {
    present: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'],
    presentVariantes: { 0: ['puis'] },
    imparfait: 'pouv',
    futur: 'pourr',
    passeSimple: ['pus', 'pus', 'put', 'pûmes', 'pûtes', 'purent'],
    participe: 'pu',
    aux: 'avoir',
    imperatif: null,
  },
  voir: {
    present: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'],
    imparfait: 'voy',
    futur: 'verr',
    passeSimple: ['vis', 'vis', 'vit', 'vîmes', 'vîtes', 'virent'],
    participe: 'vu',
    aux: 'avoir',
    imperatif: ['vois', 'voyons', 'voyez'],
  },
  vouloir: {
    present: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'],
    imparfait: 'voul',
    futur: 'voudr',
    passeSimple: ['voulus', 'voulus', 'voulut', 'voulûmes', 'voulûtes', 'voulurent'],
    participe: 'voulu',
    aux: 'avoir',
    imperatif: ['veuille', 'veuillons', 'veuillez'],
  },
  prendre: {
    present: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'],
    imparfait: 'pren',
    futur: 'prendr',
    passeSimple: ['pris', 'pris', 'prit', 'prîmes', 'prîtes', 'prirent'],
    participe: 'pris',
    aux: 'avoir',
    imperatif: ['prends', 'prenons', 'prenez'],
  },
  partir: {
    present: ['pars', 'pars', 'part', 'partons', 'partez', 'partent'],
    imparfait: 'part',
    futur: 'partir',
    passeSimple: ['partis', 'partis', 'partit', 'partîmes', 'partîtes', 'partirent'],
    participe: 'parti',
    aux: 'être',
    imperatif: ['pars', 'partons', 'partez'],
  },
  sortir: {
    present: ['sors', 'sors', 'sort', 'sortons', 'sortez', 'sortent'],
    imparfait: 'sort',
    futur: 'sortir',
    passeSimple: ['sortis', 'sortis', 'sortit', 'sortîmes', 'sortîtes', 'sortirent'],
    participe: 'sorti',
    aux: 'être',
    imperatif: ['sors', 'sortons', 'sortez'],
  },
  dormir: {
    present: ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'],
    imparfait: 'dorm',
    futur: 'dormir',
    passeSimple: ['dormis', 'dormis', 'dormit', 'dormîmes', 'dormîtes', 'dormirent'],
    participe: 'dormi',
    aux: 'avoir',
    imperatif: ['dors', 'dormons', 'dormez'],
  },
  mettre: {
    present: ['mets', 'mets', 'met', 'mettons', 'mettez', 'mettent'],
    imparfait: 'mett',
    futur: 'mettr',
    passeSimple: ['mis', 'mis', 'mit', 'mîmes', 'mîtes', 'mirent'],
    participe: 'mis',
    aux: 'avoir',
    imperatif: ['mets', 'mettons', 'mettez'],
  },
  écrire: {
    present: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'],
    imparfait: 'écriv',
    futur: 'écrir',
    passeSimple: ['écrivis', 'écrivis', 'écrivit', 'écrivîmes', 'écrivîtes', 'écrivirent'],
    participe: 'écrit',
    aux: 'avoir',
    imperatif: ['écris', 'écrivons', 'écrivez'],
  },
  lire: {
    present: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'],
    imparfait: 'lis',
    futur: 'lir',
    passeSimple: ['lus', 'lus', 'lut', 'lûmes', 'lûtes', 'lurent'],
    participe: 'lu',
    aux: 'avoir',
    imperatif: ['lis', 'lisons', 'lisez'],
  },
};

/** Verbes formés par préfixe sur un irrégulier : revenir = re + venir. */
const PREFIXES: Record<string, [string, string]> = {
  revenir: ['re', 'venir'],
  devenir: ['de', 'venir'],
  apprendre: ['ap', 'prendre'],
  comprendre: ['com', 'prendre'],
};

/** Verbes du 1er groupe conjugués avec être (verbes de mouvement ou d'état). */
const AUX_ETRE_1ER = new Set(['arriver', 'tomber', 'rester', 'entrer', 'rentrer', 'retourner', 'monter']);

/** -eler / -eter qui doublent la consonne (appeler, jeter et leurs composés). */
const DOUBLEMENT_STRICT = new Set(['appeler', 'rappeler', 'jeter', 'rejeter']);
/** -eler / -eter qui doublent dans l'orthographe traditionnelle ; « è » admis par les rectifications de 1990. */
const DOUBLEMENT_RECTIFIABLE = new Set(['épeler', 'feuilleter', 'ficeler', 'étiqueter']);

/** Le verbe a-t-il une entrée dans le moteur ? */
export function connu(inf: string): boolean {
  return !!irregulier(inf) || /er$/.test(inf) || groupe(inf) === 2;
}

/** Verbes du 2e groupe (infinitif en -ir, participe présent en -issant) utilisés dans l'application. */
export const DEUXIEME_GROUPE = new Set([
  'finir',
  'choisir',
  'grandir',
  'réussir',
  'remplir',
  'obéir',
  'réfléchir',
  'rougir',
  'applaudir',
  'atterrir',
  'bondir',
  'nourrir',
  'saisir',
  'salir',
  'guérir',
  'agir',
  'ralentir',
  'avertir',
  'fleurir',
  'jaunir',
  'maigrir',
  'grossir',
  'vieillir',
  'unir',
  'garnir',
  'franchir',
  'rôtir',
  'bâtir',
  'polir',
  'définir',
]);

function irregulier(inf: string): Irregulier | null {
  if (IRREGULIERS[inf]) return IRREGULIERS[inf]!;
  const pre = PREFIXES[inf];
  if (!pre) return null;
  const [p, base] = pre;
  const b = IRREGULIERS[base]!;
  const six = (s: Six) => s.map((x) => p + x) as unknown as Six;
  return {
    present: six(b.present),
    imparfait: p + b.imparfait,
    futur: p + b.futur,
    passeSimple: six(b.passeSimple),
    participe: p + b.participe,
    aux: inf === 'apprendre' || inf === 'comprendre' ? 'avoir' : b.aux,
    imperatif: b.imperatif ? (b.imperatif.map((x) => p + x) as unknown as [string, string, string]) : null,
  };
}

/** Groupe du verbe : 1, 2 ou 3 (être et avoir sont rangés à part : 0). */
export function groupe(inf: string): 0 | 1 | 2 | 3 {
  if (inf === 'être' || inf === 'avoir') return 0;
  if (inf === 'aller') return 3;
  if (irregulier(inf)) return 3;
  if (inf.endsWith('er')) return 1;
  if (DEUXIEME_GROUPE.has(inf)) return 2;
  return 3;
}

export function auxiliaire(inf: string): 'avoir' | 'être' {
  const irr = irregulier(inf);
  if (irr) return irr.aux;
  return AUX_ETRE_1ER.has(inf) ? 'être' : 'avoir';
}

/* ------------------------------------------------------------------ */
/* 1er groupe : radicaux                                               */
/* ------------------------------------------------------------------ */

/** c → ç et g → ge devant a et o (nous commençons, il mangeait). */
function adoucir(radical: string, terminaison: string): string {
  if (!/^[aoâ]/.test(terminaison)) return radical;
  if (radical.endsWith('c')) return `${radical.slice(0, -1)}ç`;
  if (radical.endsWith('g')) return `${radical}e`;
  return radical;
}

/**
 * Radicaux du 1er groupe devant un e muet (je, tu, il, ils au présent ; futur ; conditionnel).
 * Renvoie [radical de référence, ...variantes admises].
 */
function radicauxMuets(inf: string): string[] {
  const r = inf.slice(0, -2);
  if (inf === 'envoyer' || inf === 'renvoyer') return [`${r.slice(0, -1)}i`];
  if (/[ou]yer$/.test(inf)) return [`${r.slice(0, -1)}i`];
  if (/ayer$/.test(inf)) return [`${r.slice(0, -1)}i`, r];
  if (DOUBLEMENT_STRICT.has(inf)) return [r + r.slice(-1)];
  const eFinal = r.match(/^(.*)e([bcdfghjklmnpqrstvz])$/);
  if (DOUBLEMENT_RECTIFIABLE.has(inf) && eFinal) return [r + r.slice(-1), `${eFinal[1]}è${eFinal[2]}`];
  if (eFinal) return [`${eFinal[1]}è${eFinal[2]}`];
  const eAigu = r.match(/^(.*)é([bcdfghjklmnpqrstvz]+)$/);
  if (eAigu) return [`${eAigu[1]}è${eAigu[2]}`];
  return [r];
}

/** Radicaux du futur/conditionnel du 1er groupe : [référence, ...variantes]. */
function radicauxFutur1(inf: string): string[] {
  if (inf === 'envoyer') return ['enverr'];
  if (inf === 'renvoyer') return ['renverr'];
  const r = inf.slice(0, -2);
  // é + consonne : traditionnel « préférerai », rectifié (1990) « préfèrerai »
  if (/é[bcdfghjklmnpqrstvz]+$/.test(r)) return [`${r}er`, ...radicauxMuets(inf).map((m) => `${m}er`)];
  return radicauxMuets(inf).map((m) => `${m}er`);
}

/* ------------------------------------------------------------------ */
/* Terminaisons                                                        */
/* ------------------------------------------------------------------ */

const T_IMPARFAIT: Six = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'];
const T_FUTUR: Six = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];
const T_PRESENT_1: Six = ['e', 'es', 'e', 'ons', 'ez', 'ent'];
const T_PS_1: Six = ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'];
const MUETTE = (p: Personne) => p === 0 || p === 1 || p === 2 || p === 5;

const uniq = (xs: string[]) => [...new Set(xs)];

/** Formes d'un temps simple (sans pronom) : [référence, ...variantes]. */
function formesSimples(inf: string, temps: Temps, p: Personne): string[] {
  const irr = irregulier(inf);
  const g = groupe(inf);
  switch (temps) {
    case 'present': {
      if (irr) return uniq([irr.present[p], ...(irr.presentVariantes?.[p] ?? [])]);
      if (g === 2) {
        const r = inf.slice(0, -2);
        return [r + ['is', 'is', 'it', 'issons', 'issez', 'issent'][p]!];
      }
      const t = T_PRESENT_1[p];
      if (MUETTE(p)) return radicauxMuets(inf).map((m) => m + t);
      return [adoucir(inf.slice(0, -2), t) + t];
    }
    case 'imparfait': {
      const t = T_IMPARFAIT[p];
      if (irr) return [irr.imparfait + t];
      if (g === 2) return [`${inf.slice(0, -2)}iss${t}`];
      const r = inf.slice(0, -2);
      return [adoucir(r, t) + t];
    }
    case 'futur':
    case 'conditionnel': {
      const t = (temps === 'futur' ? T_FUTUR : T_IMPARFAIT)[p];
      if (irr) return [irr.futur + t];
      if (g === 2) return [`${inf}${t}`];
      return radicauxFutur1(inf).map((r) => r + t);
    }
    case 'passe_simple': {
      if (irr) return [irr.passeSimple[p]];
      if (g === 2) {
        const r = inf.slice(0, -2);
        return [r + ['is', 'is', 'it', 'îmes', 'îtes', 'irent'][p]!];
      }
      const t = T_PS_1[p];
      return [adoucir(inf.slice(0, -2), t) + t];
    }
    case 'imperatif': {
      const i = PERSONNES_IMPERATIF.indexOf(p);
      if (i < 0) return [];
      if (irr) return irr.imperatif ? [irr.imperatif[i]!] : [];
      if (g === 2) return formesSimples(inf, 'present', p);
      // 1er groupe : pas de -s à la 2e personne du singulier (chante !)
      return formesSimples(inf, 'present', p === 1 ? 0 : p);
    }
    default:
      return [];
  }
}

/** Participe passé, accordé si demandé. */
export function participePasse(inf: string, accord: { fem?: boolean; plur?: boolean } = {}): string {
  const irr = irregulier(inf);
  let pp: string;
  if (irr) pp = irr.participe;
  else if (groupe(inf) === 2) pp = `${inf.slice(0, -2)}i`;
  else pp = `${inf.slice(0, -2)}é`;
  return accorderParticipe(pp, accord);
}

/** Accorde un participe passé (ou un adjectif régulier) : pris → prise, prises ; allé → allées. */
export function accorderParticipe(pp: string, { fem = false, plur = false }: { fem?: boolean; plur?: boolean }) {
  if (pp === 'été') return pp; // été est invariable
  let out = pp;
  if (fem) out += 'e';
  if (plur && !(!fem && /[sx]$/.test(out))) out += 's';
  return out;
}

/** Élision devant voyelle ou h muet (j’, n’). */
export function commenceParVoyelle(mot: string): boolean {
  return /^[aeiouyàâäéèêëîïôöûüœh]/i.test(mot) && !/^h(urler|aïr|acher|isser|eurter|anter)/i.test(mot);
}

const estPluriel = (p: Personne) => p >= 3;

/**
 * Toutes les formes justes d'un verbe (sans le pronom sujet) : [référence, ...variantes].
 * Renvoie [] si la forme n'existe pas (impératif à la 1re personne, impératif de pouvoir).
 */
export function formes(inf: string, temps: Temps, p: Personne, opts: OptionsForme = {}): string[] {
  if (!estCompose(temps)) return formesSimples(inf, temps, p);
  const aux = auxiliaire(inf);
  const tAux: Temps = temps === 'passe_compose' ? 'present' : 'imparfait';
  const auxForme = formesSimples(aux, tAux, p)[0]!;
  const plur = opts.plur ?? estPluriel(p);
  let pps: string[];
  if (aux === 'être') {
    const genres = opts.fem === undefined ? [false, true] : [opts.fem];
    pps = genres.map((fem) => participePasse(inf, { fem, plur }));
  } else pps = [participePasse(inf)];
  return uniq(
    pps.map((pp) => {
      if (!opts.negation) return `${auxForme} ${pp}`;
      const ne = commenceParVoyelle(auxForme) ? 'n’' : 'ne ';
      return `${ne}${auxForme} pas ${pp}`;
    }),
  );
}

/** Forme de référence (première de `formes`). Lève une erreur si la forme n'existe pas. */
export function conjuguer(inf: string, temps: Temps, p: Personne, opts: OptionsForme = {}): string {
  const f = formes(inf, temps, p, opts)[0];
  if (f === undefined) throw new Error(`Pas de forme pour ${inf} ${temps} ${p}`);
  return f;
}

/** Pronom sujet devant la forme (« j’aime », « je chante », « il chante »). */
export function avecPronom(p: Personne, forme: string, pronom: string = PRONOMS[p]): string {
  if (pronom === 'je' && commenceParVoyelle(forme)) return `j’${forme}`;
  return `${pronom} ${forme}`;
}

/* ------------------------------------------------------------------ */
/* Marques : radical / marque du temps / marque de la personne (CM2)   */
/* ------------------------------------------------------------------ */

export interface Decomposition {
  radical: string;
  /** Marque du temps (vide au présent). */
  temps: string;
  personne: string;
}

const MARQUES: Partial<Record<Temps, readonly (readonly [string, string])[]>> = {
  imparfait: [
    ['ai', 's'],
    ['ai', 's'],
    ['ai', 't'],
    ['i', 'ons'],
    ['i', 'ez'],
    ['ai', 'ent'],
  ],
  futur: [
    ['r', 'ai'],
    ['r', 'as'],
    ['r', 'a'],
    ['r', 'ons'],
    ['r', 'ez'],
    ['r', 'ont'],
  ],
  conditionnel: [
    ['rai', 's'],
    ['rai', 's'],
    ['rai', 't'],
    ['ri', 'ons'],
    ['ri', 'ez'],
    ['rai', 'ent'],
  ],
};

/**
 * Décomposition d'une forme simple d'après les marques du BO (cycle 3) : radical + marque du temps +
 * marque de la personne. Seulement pour l'imparfait, le futur et le conditionnel (marques régulières) et
 * le présent des verbes du 1er groupe (pas de marque de temps). null sinon.
 */
export function decomposer(inf: string, temps: Temps, p: Personne): Decomposition | null {
  const f = formesSimples(inf, temps, p)[0];
  if (!f) return null;
  if (temps === 'present') {
    if (groupe(inf) !== 1) return null;
    const pers = T_PRESENT_1[p];
    return { radical: f.slice(0, f.length - pers.length), temps: '', personne: pers };
  }
  const m = MARQUES[temps];
  if (!m) return null;
  const [mt, mp] = m[p]!;
  if (!f.endsWith(mt + mp)) return null;
  return { radical: f.slice(0, f.length - mt.length - mp.length), temps: mt, personne: mp };
}
