/**
 * Items de conjugaison communs aux leçons CE1 et CM2 : un « plan » (temps, verbes, personnes, options)
 * par leçon et par niveau ; un tirage (verbe, temps, personne, sujet, complément) ; puis les items
 * (phrase à trou de la Forge, paires sujet ↔ forme, QCM, vrai/faux, réponse orale).
 */
import type { Rng } from '@/engine/rng';
import type { GenContext } from '../../registry';
import type { ItemOf, Level } from '../../schemas';
import {
  APOSTROPHES_PL,
  APOSTROPHES_SG,
  GN_PLURIEL,
  GN_SINGULIER,
  INDICATEURS,
  PRENOMS,
  PRONOMS_SUJETS,
  type Sujet,
  type VerbeLex,
} from './lexique';
import {
  AU_TEMPS,
  NOM_TEMPS,
  PERSONNES,
  PERSONNES_IMPERATIF,
  type Personne,
  type Temps,
  auxiliaire,
  avecPronom,
  commenceParVoyelle,
  estCompose,
  formes,
  groupe,
  participePasse,
} from './moteur';
import { clamp01, distinctsPar, distracteurs, majuscule, make, mcq, trou, vraiFaux } from './util';

/* ------------------------------------------------------------------ */
/* Plans                                                               */
/* ------------------------------------------------------------------ */

export interface Plan {
  temps: readonly Temps[];
  /** Verbes (un verbe peut apparaître plusieurs fois pour peser davantage). */
  verbes: readonly VerbeLex[];
  personnes: readonly Personne[];
  /** Sujets : seulement des pronoms, ou aussi des prénoms et des groupes nominaux. */
  sujets: 'pronoms' | 'varies';
  /** Probabilité d'une forme négative (temps composés). */
  negation?: number;
  /** Probabilité d'un indicateur de temps en tête de phrase (défaut 1). */
  indicateur?: number;
  /** Temps simples dont on tire des formes fausses (distracteurs) : seulement des temps connus de la classe. */
  voisins?: readonly Temps[];
  /** Proposer des participes passés accordés à tort avec avoir (as cherchés) : pas au CE1. */
  piegesAccord?: boolean;
}

export type PlanParNiveau = Record<Level, Plan>;

export interface Tirage {
  verbe: VerbeLex;
  temps: Temps;
  p: Personne;
  /** null à l'impératif. */
  sujet: Sujet | null;
  /** Apostrophe en tête (« Léa, », « Les enfants, ») qui donne le genre ou s'adresse à quelqu'un. */
  apostrophe?: string;
  fem?: boolean;
  negation: boolean;
  compl: string;
  indicateur?: string;
  /** Temps des distracteurs. */
  voisins: readonly Temps[];
  piegesAccord: boolean;
}

/** Sujet de la personne p. */
function tirerSujet(rng: Rng, p: Personne, varies: boolean, eviterOn: boolean): Sujet {
  const pronoms = PRONOMS_SUJETS.filter((s) => s.p === p && !(eviterOn && s.texte === 'on'));
  if (!varies || (p !== 2 && p !== 5)) return rng.pick(pronoms);
  const r = rng.next();
  if (r < 0.4) return rng.pick(pronoms);
  if (p === 2) return r < 0.75 ? rng.pick(PRENOMS) : rng.pick(GN_SINGULIER);
  return rng.pick(GN_PLURIEL);
}

const TEMPS_SIMPLES_PROCHES: Temps[] = ['present', 'imparfait', 'futur', 'passe_simple'];
const INDICATEURS_ETAT = ['Aujourd’hui', 'Maintenant', 'En ce moment'];

/** Ouvertures qui désignent sans ambiguïté « nous » (« Tous ensemble » pourrait s'adresser à « vous »). */
const OUVERTURES_NOUS = ['Toi et moi', 'Nous deux'];
/** Compléments impossibles à la forme négative sans changer l'article (pas un dessin → pas de dessin). */
const INDEFINI = /^(un|une|des|du|de la|de l’)\s/;

/** Tire une situation conjugable (verbe, temps, personne, sujet, complément). */
export function tirer(plan: Plan, rng: Rng): Tirage {
  const voisins = plan.voisins ?? TEMPS_SIMPLES_PROCHES;
  const piegesAccord = plan.piegesAccord ?? true;
  for (let essai = 0; essai < 50; essai++) {
    const verbe = rng.pick(plan.verbes);
    const temps = rng.pick(plan.temps);
    const persos =
      temps === 'imperatif' ? plan.personnes.filter((p) => PERSONNES_IMPERATIF.includes(p)) : plan.personnes;
    if (!persos.length) continue;
    const p = rng.pick(persos);
    if (temps === 'imperatif') {
      if (verbe.sansImperatif || !formes(verbe.inf, 'imperatif', p).length) continue;
      const compl = rng.pick(verbe.imp ?? verbe.compl);
      let apostrophe: string;
      if (p === 1) apostrophe = rng.pick(APOSTROPHES_SG).texte;
      else if (p === 4) apostrophe = rng.pick(APOSTROPHES_PL).texte;
      else apostrophe = rng.pick(OUVERTURES_NOUS);
      return { verbe, temps, p, sujet: null, apostrophe, negation: false, compl, voisins, piegesAccord };
    }
    // un verbe d'état ou de goût sonne mal au passé simple (« elle aima les fraises »)
    if (temps === 'passe_simple' && verbe.etat) continue;
    const accordEtre = estCompose(temps) && auxiliaire(verbe.inf) === 'être';
    const sujet = tirerSujet(rng, p, plan.sujets === 'varies', accordEtre);
    let apostrophe: string | undefined;
    let fem = sujet.fem;
    // Avec être, « tu » et « vous » : une apostrophe donne le genre (« Léa, tu es arrivée »)
    if (accordEtre && (p === 1 || p === 4)) {
      if (p === 1) {
        const a = rng.pick(APOSTROPHES_SG);
        apostrophe = a.texte;
        fem = a.fem;
      } else {
        const a = rng.pick(APOSTROPHES_PL);
        apostrophe = a.texte;
        fem = a.fem;
      }
    }
    const complsNeg = verbe.compl.filter((c) => !INDEFINI.test(c));
    const negation = estCompose(temps) && complsNeg.length > 0 && rng.chance(plan.negation ?? 0);
    const indics = temps === 'present' && verbe.etat ? INDICATEURS_ETAT : INDICATEURS[temps];
    const indicateur =
      !apostrophe && rng.chance(plan.indicateur ?? 1) && indics.length ? rng.pick(indics) : undefined;
    return {
      verbe,
      temps,
      p,
      sujet,
      apostrophe,
      fem,
      negation,
      compl: rng.pick(negation ? complsNeg : verbe.compl),
      indicateur,
      voisins,
      piegesAccord,
    };
  }
  throw new Error('Aucun tirage possible pour ce plan');
}

/* ------------------------------------------------------------------ */
/* Formes et phrases                                                   */
/* ------------------------------------------------------------------ */

/** Formes justes [référence, ...variantes] pour un tirage. */
export function formesDe(t: Tirage): string[] {
  return formes(t.verbe.inf, t.temps, t.p, { fem: t.fem, negation: t.negation });
}

/** Pronom d'affichage (« elle » si le sujet est un pronom féminin…) ; pour les GN : il/ils selon le genre. */
export function pronomDe(t: Tirage): string {
  if (t.sujet?.pronom) return t.sujet.texte;
  if (t.p === 2) return t.fem ? 'elle' : 'il';
  if (t.p === 5) return t.fem ? 'elles' : 'ils';
  return ['je', 'tu', 'il', 'nous', 'vous', 'ils'][t.p]!;
}

/** Libellé de la parenthèse (« chanter, imparfait » ; « ranger, impératif présent »). */
const parenthese = (t: Tirage) =>
  `(${t.verbe.inf}, ${NOM_TEMPS[t.temps]}${t.negation ? ', forme négative' : ''})`;

/** Sujet écrit devant le trou ou la forme (« J’ » si élision). */
function sujetEcrit(t: Tirage, forme: string): string {
  if (!t.sujet) return '';
  if (t.sujet.texte === 'je' && commenceParVoyelle(forme)) return 'j’';
  return `${t.sujet.texte} `;
}

/** Début de phrase : indicateur et/ou apostrophe. */
function debut(t: Tirage): string {
  if (t.apostrophe) return `${t.apostrophe}, `;
  if (t.indicateur) return `${t.indicateur}, `;
  return '';
}

/** Phrase complète avec une forme donnée. */
export function phraseAvec(t: Tirage, forme: string): string {
  const fin = t.temps === 'imperatif' ? ' !' : '.';
  const corps = `${debut(t)}${sujetEcrit(t, forme)}${forme} ${t.compl}`;
  return majuscule(corps) + fin;
}

/** Phrase à trou (avec la parenthèse « verbe, temps »). */
export function phraseATrou(t: Tirage, forme: string, avecParenthese = true): string {
  const fin = t.temps === 'imperatif' ? ' !' : '.';
  const par = avecParenthese ? ` ${parenthese(t)}` : '';
  return majuscule(`${debut(t)}${sujetEcrit(t, forme)}___${par} ${t.compl}`) + fin;
}

/** Forme avec son pronom (« nous chanterons », « j’aime ») ; à l'impératif, la forme seule. */
export function formeAvecPronom(t: Tirage, forme: string): string {
  if (t.temps === 'imperatif') return forme;
  return avecPronom(t.p, forme, pronomDe(t));
}

/* ------------------------------------------------------------------ */
/* Règles (explications d'enfant)                                       */
/* ------------------------------------------------------------------ */

const TERMINAISONS_PS: Record<string, string> = {
  a: '-ai, -as, -a, -âmes, -âtes, -èrent',
  i: '-is, -is, -it, -îmes, -îtes, -irent',
  u: '-us, -us, -ut, -ûmes, -ûtes, -urent',
  in: '-ins, -ins, -int, -înmes, -întes, -inrent',
};

function familleRadical(inf: string): string | null {
  if (/[cg]er$/.test(inf)) return inf.endsWith('cer') ? 'cer' : 'ger';
  if (/yer$/.test(inf)) return 'yer';
  if (['appeler', 'jeter', 'rappeler', 'rejeter'].includes(inf)) return 'double';
  if (/e[bcdfghjklmnpqrstvz]er$/.test(inf)) return 'egrave';
  if (/é[bcdfghjklmnpqrstvz]+er$/.test(inf)) return 'eaigu';
  if (/ier$/.test(inf)) return 'ier';
  return null;
}

/** Les six formes d'un temps simple, pour les verbes à apprendre par cœur. */
function tableau(inf: string, temps: Temps): string {
  return PERSONNES.map((p) => avecPronom(p, formes(inf, temps, p)[0]!)).join(', ');
}

/** Règle du temps pour ce verbe, en une phrase d'enfant. */
export function regle(inf: string, temps: Temps, p?: Personne): string {
  const g = groupe(inf);
  let fam = familleRadical(inf);
  // la particularité n'est rappelée que si elle concerne la personne demandée
  const muette = p === undefined || [0, 1, 2, 5].includes(p);
  if (temps === 'present' && (fam === 'cer' || fam === 'ger') && p !== undefined && p !== 3) fam = null;
  if (
    temps === 'present' &&
    ['yer', 'double', 'egrave', 'eaigu'].includes(fam ?? '') &&
    !muette &&
    p !== undefined
  )
    fam = fam === 'eaigu' || fam === 'egrave' || fam === 'double' || fam === 'yer' ? null : fam;
  if (temps === 'imparfait' && (fam === 'cer' || fam === 'ger') && p !== undefined && (p === 3 || p === 4))
    fam = null;
  if (temps === 'imparfait' && fam === 'ier' && p !== undefined && p !== 3 && p !== 4) fam = null;
  switch (temps) {
    case 'present':
      if (g === 0 || g === 3) return `Le verbe ${inf} au présent se sait par cœur : ${tableau(inf, temps)}.`;
      if (g === 2)
        return 'Au présent, les verbes comme finir se terminent par -is, -is, -it, -issons, -issez, -issent.';
      if (fam === 'cer')
        return 'Au présent, les verbes en -er se terminent par -e, -es, -e, -ons, -ez, -ent ; devant -ons, le c prend une cédille (nous commençons).';
      if (fam === 'ger')
        return 'Au présent, les verbes en -er se terminent par -e, -es, -e, -ons, -ez, -ent ; devant -ons, on garde un e après le g (nous mangeons).';
      if (fam === 'yer')
        return 'Au présent, les verbes en -yer changent le y en i devant un e muet (je nettoie, nous nettoyons).';
      if (fam === 'double')
        return 'Au présent, appeler et jeter doublent le l ou le t devant un e muet (j’appelle, nous appelons).';
      if (fam === 'egrave' || fam === 'eaigu')
        return 'Au présent, le e (ou le é) du radical devient è devant un e muet (j’achète, je préfère, mais nous achetons).';
      return 'Au présent, les verbes en -er se terminent par -e, -es, -e, -ons, -ez, -ent.';
    case 'imparfait':
      if (inf === 'être')
        return 'À l’imparfait, être devient « ét- » + -ais, -ais, -ait, -ions, -iez, -aient (j’étais).';
      if (g === 2)
        return 'À l’imparfait, les verbes comme finir prennent -iss- puis -ais, -ais, -ait, -ions, -iez, -aient (je finissais).';
      if (fam === 'cer')
        return 'À l’imparfait, on ajoute -ais, -ais, -ait, -ions, -iez, -aient ; devant a, le c prend une cédille (je commençais, nous commencions).';
      if (fam === 'ger')
        return 'À l’imparfait, on ajoute -ais, -ais, -ait, -ions, -iez, -aient ; devant a, on garde un e après le g (je mangeais, nous mangions).';
      if (fam === 'ier')
        return 'À l’imparfait, on ajoute -ions et -iez au radical qui finit déjà par i : nous pliions, vous pliiez.';
      return 'À l’imparfait, on ajoute toujours -ais, -ais, -ait, -ions, -iez, -aient au radical.';
    case 'futur': {
      const je = avecPronom(0, formes(inf, 'futur', 0)[0]!);
      if (g === 0 || g === 3)
        return `Au futur, ${inf} change de radical (${je}) ; les terminaisons sont -ai, -as, -a, -ons, -ez, -ont.`;
      if (fam === 'yer')
        return `Au futur, le y devient i (${je}), puis on ajoute -ai, -as, -a, -ons, -ez, -ont.`;
      if (fam === 'double')
        return `Au futur, ${inf} double sa consonne (${je}), puis on ajoute -ai, -as, -a, -ons, -ez, -ont.`;
      if (fam === 'egrave')
        return `Au futur, le e devient è (${je}), puis on ajoute -ai, -as, -a, -ons, -ez, -ont.`;
      if (fam === 'eaigu')
        return `Au futur, on écrit ${je} (ou, en orthographe rectifiée, avec un è) ; terminaisons -ai, -as, -a, -ons, -ez, -ont.`;
      return 'Au futur, on garde l’infinitif et on ajoute -ai, -as, -a, -ons, -ez, -ont : on entend le r.';
    }
    case 'conditionnel': {
      const je = avecPronom(0, formes(inf, 'conditionnel', 0)[0]!);
      const base =
        'Au conditionnel présent, on prend le radical du futur et les terminaisons de l’imparfait : -rais, -rais, -rait, -rions, -riez, -raient';
      if (g === 0 || g === 3 || fam === 'yer' || fam === 'double' || fam === 'egrave' || fam === 'eaigu')
        return `${base} (${je}).`;
      return `${base}.`;
    }
    case 'passe_simple': {
      const il = formes(inf, 'passe_simple', 2)[0]!;
      const fam2 = g === 1 || inf === 'aller' ? 'a' : /ut$/.test(il) ? 'u' : /int$/.test(il) ? 'in' : 'i';
      const ex = `il ${il}, ils ${formes(inf, 'passe_simple', 5)[0]}`;
      return `Au passé simple, ${inf} se termine par ${TERMINAISONS_PS[fam2]} (${ex}).`;
    }
    case 'passe_compose':
    case 'plus_que_parfait': {
      const aux = auxiliaire(inf);
      const tAux = temps === 'passe_compose' ? 'au présent' : 'à l’imparfait';
      const pp = participePasse(inf);
      if (aux === 'être')
        return `Au ${NOM_TEMPS[temps]}, ${inf} se conjugue avec l’auxiliaire être ${tAux} ; le participe passé « ${pp} » s’accorde avec le sujet.`;
      return `Au ${NOM_TEMPS[temps]}, on écrit l’auxiliaire avoir ${tAux}, puis le participe passé « ${pp} ».`;
    }
    case 'imperatif':
      if (inf === 'aller')
        return 'À l’impératif, il n’y a pas de sujet : va !, allons !, allez ! (pas de s à « va »).';
      if (g === 1)
        return 'À l’impératif, il n’y a pas de sujet ; à la 2e personne du singulier, les verbes en -er ne prennent pas de s (chante !).';
      return `À l’impératif, il n’y a pas de sujet : ${formes(inf, 'imperatif', 1)[0]} !, ${formes(inf, 'imperatif', 3)[0]} !, ${formes(inf, 'imperatif', 4)[0]} !`;
  }
}

/** Explication complète d'un tirage : règle + phrase juste (+ accord avec être, + négation). */
export function explication(t: Tirage): string {
  const [bonne] = formesDe(t);
  let txt = regle(t.verbe.inf, t.temps, t.p);
  if (estCompose(t.temps) && auxiliaire(t.verbe.inf) === 'être' && t.fem !== undefined) {
    const genre = t.fem ? 'féminin' : 'masculin';
    const nombre = t.p >= 3 ? 'pluriel' : 'singulier';
    if (t.apostrophe && t.sujet)
      txt += ` Ici, « ${t.sujet.texte} » désigne ${t.apostrophe.replace(/^(Les|Mes)\b/, (m) => m.toLowerCase())} : ${genre} ${nombre}.`;
    else txt += ` Ici, le sujet (${t.sujet?.texte ?? ''}) est ${genre} ${nombre}.`;
  }
  if (t.negation) txt += ' À la forme négative, ne… pas encadre l’auxiliaire.';
  return `${txt} → ${phraseAvec(t, bonne!)}`;
}

/* ------------------------------------------------------------------ */
/* Distracteurs                                                        */
/* ------------------------------------------------------------------ */

/** Formes fausses plausibles pour un tirage (jamais une forme acceptée). */
export function formesFausses(t: Tirage): string[] {
  const inf = t.verbe.inf;
  const ok = formesDe(t);
  const out: string[] = [];
  // autres personnes, même temps
  const persos = t.temps === 'imperatif' ? PERSONNES_IMPERATIF : PERSONNES;
  for (const q of persos) {
    // « Noé, chantez ! » serait juste (vouvoiement) : pas de 2e personne du pluriel pour « tu »
    if (q === t.p || (t.temps === 'imperatif' && t.p === 1 && q === 4)) continue;
    out.push(...formes(inf, t.temps, q, { fem: t.fem, negation: t.negation }));
  }
  if (t.temps === 'imperatif') {
    // erreur fréquente : le -s du présent à la 2e personne (chantes !)
    if (t.p === 1) out.push(...formes(inf, 'present', 1));
    out.push(...formes(inf, 'present', t.p === 1 ? 0 : t.p));
  } else if (!estCompose(t.temps)) {
    for (const tt of t.voisins) if (tt !== t.temps) out.push(...formes(inf, tt, t.p));
  } else {
    // auxiliaire au mauvais temps, mauvais auxiliaire, accord oublié, infinitif à la place du participe
    const autre: Temps = t.temps === 'passe_compose' ? 'plus_que_parfait' : 'passe_compose';
    if (t.voisins.includes(autre)) out.push(...formes(inf, autre, t.p, { fem: t.fem, negation: t.negation }));
    const aux = auxiliaire(inf);
    const tAux: Temps = t.temps === 'passe_compose' ? 'present' : 'imparfait';
    const mauvaisAux = formes(aux === 'être' ? 'avoir' : 'être', tAux, t.p)[0]!;
    const auxOk = formes(aux, tAux, t.p)[0]!;
    const pp = participePasse(inf);
    const ne = (a: string, x: string) =>
      t.negation ? `${commenceParVoyelle(a) ? 'n’' : 'ne '}${a} pas ${x}` : `${a} ${x}`;
    out.push(ne(mauvaisAux, pp));
    if (groupe(inf) === 1 && inf !== 'aller') out.push(ne(auxOk, inf));
    if (aux === 'être' || t.piegesAccord)
      for (const fem of [false, true])
        for (const plur of [false, true]) out.push(ne(auxOk, participePasse(inf, { fem, plur })));
  }
  // je : garder la même élision que la bonne réponse (« J’___ » / « Je ___ »)
  const voyelle = commenceParVoyelle(ok[0]!);
  return out.filter((f) => !ok.includes(f) && (t.sujet?.texte !== 'je' || commenceParVoyelle(f) === voyelle));
}

/* ------------------------------------------------------------------ */
/* Difficulté                                                          */
/* ------------------------------------------------------------------ */

export function difficulte(t: Tirage): number {
  const g = groupe(t.verbe.inf);
  let d = [0.15, 0.25, 0.25, 0.3, 0.35, 0.3][t.p]!;
  if (g === 3 || g === 0) d += 0.2;
  if (g === 2) d += 0.15;
  if (familleRadical(t.verbe.inf)) d += 0.15;
  if (estCompose(t.temps)) d += 0.1;
  if (estCompose(t.temps) && auxiliaire(t.verbe.inf) === 'être') d += 0.1;
  if (t.negation) d += 0.1;
  if (t.temps === 'passe_simple') d += 0.1;
  return clamp01(d);
}

/* ------------------------------------------------------------------ */
/* Items                                                               */
/* ------------------------------------------------------------------ */

/** Phrase à trou de la Forge (champ `conjugaison`), toujours avec des choix (utilisés en Facile). */
export function itemTrou(ctx: GenContext, rng: Rng, t: Tirage): ItemOf<'fill_blank'> {
  const [bonne, ...variantes] = formesDe(t);
  return trou(ctx, rng, 'forge', {
    sentence: phraseATrou(t, bonne!),
    answer: bonne!,
    accepted: variantes,
    wrong: formesFausses(t),
    nbChoix: 4,
    explication: explication(t),
    difficulty: difficulte(t),
    conjugaison: {
      sujet: t.sujet ? t.sujet.texte : (['', 'tu', '', 'nous', 'vous', ''][t.p] ?? ''),
      verbe: t.verbe.inf,
      temps: NOM_TEMPS[t.temps],
    },
  });
}

/** Paires sujet ↔ forme (un verbe, un temps). */
export function itemPaires(ctx: GenContext, rng: Rng, plan: Plan): ItemOf<'pairing'> {
  for (let essai = 0; essai < 30; essai++) {
    const t = tirer(plan, rng);
    const persos = t.temps === 'imperatif' ? PERSONNES_IMPERATIF : plan.personnes;
    const fem = rng.chance(0.5);
    const cand = persos.map((p) => {
      const pronom =
        p === 2
          ? fem
            ? 'elle'
            : 'il'
          : p === 5
            ? fem
              ? 'elles'
              : 'ils'
            : ['je', 'tu', '', 'nous', 'vous', ''][p]!;
      const f = formes(t.verbe.inf, t.temps, p, { fem: p === 2 || p === 5 ? fem : false })[0];
      if (!f) return null;
      const left =
        t.temps === 'imperatif' ? `(${pronom})` : pronom === 'je' && commenceParVoyelle(f) ? 'j’' : pronom;
      return { left, right: f };
    });
    const pairs = distinctsPar(
      rng,
      cand.filter((c): c is { left: string; right: string } => !!c),
      6,
      (c) => c.right,
    );
    if (pairs.length >= 3) {
      const inf = t.verbe.inf;
      return make(ctx, 'pairing', 'paires', {
        prompt:
          t.temps === 'imperatif'
            ? `Associe chaque personne à la bonne forme du verbe ${inf} à l’impératif présent.`
            : `Associe chaque sujet à la bonne forme du verbe ${inf} ${AU_TEMPS[t.temps]}.`,
        pairs,
        relation: 'sujet → forme conjuguée',
        explication: regle(inf, t.temps),
        difficulty: difficulte({ ...t, p: 3 }),
      });
    }
    // Peu de personnes (Facile) : plusieurs verbes au même temps
    const tirages = distinctsPar(
      rng,
      Array.from({ length: 16 }, () => tirer(plan, rng)).filter((x) => x.temps === t.temps),
      5,
      (x) => x.verbe.inf,
    );
    const paires = distinctsPar(
      rng,
      tirages.map((x) => ({ left: x.verbe.inf, right: formeAvecPronom(x, formesDe(x)[0]!) })),
      5,
      (c) => c.right,
    );
    if (paires.length < 3) continue;
    return make(ctx, 'pairing', 'verbes', {
      prompt: `Associe chaque verbe à sa forme conjuguée ${AU_TEMPS[t.temps]}.`,
      pairs: paires,
      relation: 'infinitif → forme conjuguée',
      explication: regle(tirages[0]!.verbe.inf, t.temps),
      difficulty: difficulte(t),
    });
  }
  throw new Error('Paires impossibles');
}

/** QCM : quel pronom convient ? ou quelle forme convient ? */
export function itemQcm(ctx: GenContext, rng: Rng, plan: Plan): ItemOf<'mcq'> {
  for (let essai = 0; essai < 30; essai++) {
    const t = tirer(plan, rng);
    const [bonne] = formesDe(t);
    const voyelle = commenceParVoyelle(bonne!);
    const parSujet = rng.chance(0.5) && t.temps !== 'imperatif' && !(t.p === 0 && voyelle) && !t.apostrophe;
    if (!parSujet) {
      const fausses = formesFausses(t);
      if (fausses.length < 1) continue;
      return mcq(ctx, rng, 'forme', {
        question: `Quelle forme convient ? ${phraseATrou(t, bonne!)}`,
        good: bonne!,
        wrong: fausses,
        explication: explication(t),
        difficulty: difficulte(t),
      });
    }
    // Quel pronom ? On ne propose que des pronoms dont la forme est différente.
    const pronomBon = pronomDe(t);
    const autres: string[] = [];
    for (const q of PERSONNES) {
      if (q === t.p) continue;
      const fq = formes(t.verbe.inf, t.temps, q, { fem: t.fem, negation: t.negation });
      if (fq.includes(bonne!)) continue;
      if (q === 0 && voyelle) continue;
      autres.push(['je', 'tu', t.fem ? 'elle' : 'il', 'nous', 'vous', t.fem ? 'elles' : 'ils'][q]!);
    }
    if (autres.length < 2) continue;
    const phrase = majuscule(`${debut(t)}___ ${bonne} ${t.compl}`) + '.';
    return mcq(ctx, rng, 'pronom', {
      question: `Quel pronom sujet convient ? ${phrase}`,
      good: pronomBon,
      wrong: autres,
      explication: `La terminaison de « ${bonne} » va avec « ${pronomBon} ». ${regle(t.verbe.inf, t.temps, t.p)}`,
      difficulty: difficulte(t),
    });
  }
  throw new Error('QCM impossible');
}

/** Vrai / faux : la phrase est-elle bien conjuguée ? (une fois sur deux, une forme fausse) */
export function itemVraiFaux(ctx: GenContext, rng: Rng, plan: Plan): ItemOf<'true_false'> {
  for (let essai = 0; essai < 30; essai++) {
    const t = tirer(plan, rng);
    const [bonne] = formesDe(t);
    const vrai = rng.chance(0.5);
    const fausses = formesFausses(t);
    if (!vrai && !fausses.length) continue;
    const montree = vrai ? bonne! : rng.pick(fausses);
    const phrase = phraseAvec(t, montree);
    return vraiFaux(ctx, 'phrase', {
      statement: `Le verbe ${t.verbe.inf} est bien conjugué ${AU_TEMPS[t.temps]}${t.negation ? ' (forme négative)' : ''} : « ${phrase} »`,
      answer: vrai,
      explication: explication(t),
      difficulty: difficulte(t),
    });
  }
  throw new Error('Vrai/faux impossible');
}

/** Réponse orale : « Conjugue chanter au futur avec nous. » */
export function itemOral(ctx: GenContext, rng: Rng, plan: Plan): ItemOf<'oral_answer'> {
  const t = { ...tirer(plan, rng) };
  // à l'oral, un pronom (pas de prénom) ; pas d'apostrophe
  if (t.sujet && !t.sujet.pronom) t.sujet = { texte: pronomDe(t), p: t.p, fem: t.fem, pronom: true };
  const toutes = formesDe(t).map((f) => formeAvecPronom(t, f));
  const prompt =
    t.temps === 'imperatif'
      ? `Conjugue « ${t.verbe.inf} » à l’impératif présent, à la personne de « ${['', 'tu', '', 'nous', 'vous', ''][t.p]} ».`
      : `Conjugue « ${t.verbe.inf} » ${AU_TEMPS[t.temps]}${t.negation ? ' à la forme négative' : ''} avec « ${pronomDe(t)} ».`;
  return make(ctx, 'oral_answer', 'oral', {
    prompt,
    answer: toutes[0]!,
    accepted: toutes,
    explication: `${regle(t.verbe.inf, t.temps, t.p)} → ${toutes[0]}`,
    difficulty: difficulte(t),
  });
}

/** Générateurs standard d'une leçon de conjugaison à partir de ses plans. */
export function gensConjugaison(plans: PlanParNiveau) {
  return {
    fill_blank: (level: Level, rng: Rng, ctx: GenContext) => itemTrou(ctx, rng, tirer(plans[level], rng)),
    pairing: (level: Level, rng: Rng, ctx: GenContext) => itemPaires(ctx, rng, plans[level]),
    mcq: (level: Level, rng: Rng, ctx: GenContext) => itemQcm(ctx, rng, plans[level]),
    true_false: (level: Level, rng: Rng, ctx: GenContext) => itemVraiFaux(ctx, rng, plans[level]),
    oral_answer: (level: Level, rng: Rng, ctx: GenContext) => itemOral(ctx, rng, plans[level]),
  };
}

export { distracteurs };
