/**
 * Opérations posées en colonnes (Le Grand Huit), chiffre par chiffre. Fonctions pures.
 *
 * Un seul algorithme par opération, cohérent du CE1 au CM2 (BO 2024-2025) :
 * - addition : de droite à gauche, avec retenues (2 à 4 termes, entiers ou décimaux alignés sur la virgule) ;
 * - soustraction : **par cassage** par défaut (« je casse 1 dizaine en 10 unités ») — c'est l'algorithme
 *   retenu pour toute l'application (contenu CE1 : `meta.algorithme = 'cassage'`). La méthode par
 *   **compensation** (« j'ajoute 10 en haut et 1 en bas ») n'est utilisée que si le contenu la demande
 *   (`meta.algorithme` ou `meta.posee.methode` = 'compensation') ;
 * - multiplication : produits partiels ligne par ligne (retenues au-dessus), puis addition des lignes ;
 *   pour un décimal, la virgule est placée à la fin (autant de chiffres après la virgule que dans les facteurs) ;
 * - division : potence « à la française », on écrit chaque chiffre du quotient (le produit et le reste
 *   s'affichent ensuite) ; division euclidienne : on écrit aussi le reste ; division décimale : on abaisse des zéros.
 *
 * La disposition est une grille (lignes × colonnes) de cellules : chiffres donnés, cases à remplir (étapes
 * dans l'ordre), retenues et marques de cassage qui apparaissent au bon moment.
 */
import type { Item } from '@/content/schemas';
import { formatNumber, roundTo } from '@/engine/answer';

export type OpPosee = '+' | '−' | '×' | '÷';
export type Methode = 'cassage' | 'compensation';

export interface Posee {
  op: OpPosee;
  termes: number[];
  methode: Methode;
  /** Division : nombre de chiffres après la virgule attendus au quotient (0 = division euclidienne). */
  decimalesQuotient: number;
}

export interface Cellule {
  ligne: number;
  col: number;
  texte: string;
  type: 'donnee' | 'operateur' | 'saisie' | 'retenue' | 'casse' | 'zero';
  /** Une virgule suit ce chiffre. */
  virgule?: boolean;
  /** Virgule visible seulement à partir de cette étape. */
  virguleA?: number;
  /** Petite marque dans un coin de la case (compensation : « 1 » ajouté). */
  coin?: 'hg' | 'bg';
  /** Pour les cases à remplir : ordre de remplissage. */
  etape?: number;
  /** Visible quand l'étape courante ≥ visibleA (par défaut : toujours). */
  visibleA?: number;
  /** Cachée quand l'étape courante ≥ cacheA. */
  cacheA?: number;
  /** Barrée à partir de cette étape (cassage). */
  barreA?: number;
  /** Annotation d'aide (retenue) : masquée au niveau Plus loin. */
  aide?: boolean;
}

export interface Trait {
  ligne: number;
  col0: number;
  col1: number;
  /** Trait vertical (potence) : de `ligne` à `ligne1`, à gauche de `col0`. */
  vertical?: boolean;
  ligne1?: number;
  visibleA?: number;
}

export interface Etape {
  attendu: string;
  aide: string;
  ligne: number;
  col: number;
}

export interface Disposition {
  op: OpPosee;
  lignes: number;
  colonnes: number;
  cellules: Cellule[];
  traits: Trait[];
  etapes: Etape[];
  resultat: number;
  reste?: number;
  /** Les cases à remplir futures sont-elles montrées (vides) ? Non pour la division. */
  casesFuturesVisibles: boolean;
  /** Phrase finale (virgule, reste…). */
  conclusion: string;
}

/* ------------------------------------------------------------------ */
/* Lecture des items                                                   */
/* ------------------------------------------------------------------ */

const OPS: Record<string, OpPosee> = {
  '+': '+',
  '−': '−',
  '-': '−',
  '×': '×',
  x: '×',
  '*': '×',
  '÷': '÷',
  ':': '÷',
  '/': '÷',
};

export function decimalesDe(n: number): number {
  const s = String(roundTo(n, 6));
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
}

const nombreOk = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0 && n < 1e9 && decimalesDe(n) <= 3;

/** Calcul exact (sans artefacts flottants). */
export function calculer(op: OpPosee, termes: number[]): number {
  if (op === '+')
    return roundTo(
      termes.reduce((a, b) => a + b, 0),
      6,
    );
  if (op === '−') return roundTo(termes[0]! - termes[1]!, 6);
  if (op === '×') return roundTo(termes[0]! * termes[1]!, 6);
  return termes[0]! / termes[1]!;
}

/**
 * Opération posée d'un item `numeric_answer` : `meta.posee = { a, b, op }` ou, pour une addition de
 * plusieurs nombres, `meta.termes`. Null si l'item n'a pas ce `meta` ou s'il n'est pas cohérent.
 */
export function lirePosee(item: Item): Posee | null {
  if (item.kind !== 'numeric_answer') return null;
  const meta = item.meta ?? {};
  const p = meta.posee as Record<string, unknown> | undefined;
  let op: OpPosee | undefined;
  let termes: number[] | undefined;
  if (p && typeof p === 'object') {
    op = OPS[String(p.op)];
    termes = [p.a, p.b] as number[];
  } else if (Array.isArray(meta.termes)) {
    op = '+';
    termes = meta.termes as number[];
  }
  if (!op || !termes || termes.length < 2 || !termes.every(nombreOk)) return null;
  if (op !== '+' && termes.length !== 2) return null;
  if (termes.length > 4) return null;
  const algo = String(meta.algorithme ?? (p?.methode as string | undefined) ?? 'cassage');
  const methode: Methode = algo === 'compensation' ? 'compensation' : 'cassage';
  const [a, b] = termes as [number, number];
  if (op === '−' && a < b) return null;
  if (op === '×' && (b === 0 || a === 0)) return null;
  if (op === '÷') {
    if (!Number.isInteger(b) || b < 1 || b > 99) return null;
  }
  const res = calculer(op, termes);
  const decQ = op === '÷' ? item.decimals : 0;
  if (op === '÷') {
    const q = roundTo(Math.floor(res * 10 ** decQ + 1e-9) / 10 ** decQ, 6);
    if (Math.abs(q - item.answer) > 1e-9) return null;
  } else if (Math.abs(res - item.answer) > 1e-9) return null;
  const pose: Posee = { op, termes, methode, decimalesQuotient: decQ };
  try {
    const d = disposer(pose);
    if (d.colonnes > 13 || d.etapes.length === 0) return null;
  } catch {
    return null;
  }
  return pose;
}

/* ------------------------------------------------------------------ */
/* Outils                                                              */
/* ------------------------------------------------------------------ */

const NOMS: Record<number, [string, string]> = {
  [-3]: ['millième', 'millièmes'],
  [-2]: ['centième', 'centièmes'],
  [-1]: ['dixième', 'dixièmes'],
  0: ['unité', 'unités'],
  1: ['dizaine', 'dizaines'],
  2: ['centaine', 'centaines'],
  3: ['millier', 'milliers'],
  4: ['dizaine de milliers', 'dizaines de milliers'],
  5: ['centaine de milliers', 'centaines de milliers'],
  6: ['million', 'millions'],
};
/** Nom d'un rang (puissance de 10) : « dizaine » / « dizaines ». */
export const nomRang = (p: number, pluriel = true) => (NOMS[p] ?? ['chiffre', 'chiffres'])[pluriel ? 1 : 0];

/** Entier « à l'échelle » : 3,25 avec 2 décimales → 325. */
const echelle = (n: number, dec: number) => Math.round(n * 10 ** dec);

/** Chiffre de rang q (0 = unités) d'un entier ≥ 0. */
const chiffre = (N: number, q: number) => Math.floor(N / 10 ** q) % 10;

/** Nombre de chiffres d'un entier (0 → 1). */
const longueur = (N: number) => Math.max(1, String(N).length);

/** Chiffres à écrire pour un nombre « à l'échelle » : au moins les unités (dec + 1 chiffres). */
const longueurEcrite = (N: number, dec: number) => Math.max(longueur(N), dec + 1);

/* ------------------------------------------------------------------ */
/* Addition                                                            */
/* ------------------------------------------------------------------ */

function addition(termes: number[]): Disposition {
  const D = Math.max(...termes.map(decimalesDe));
  const Ns = termes.map((t) => echelle(t, D));
  const S = Ns.reduce((a, b) => a + b, 0);
  const lens = termes.map((_, i) => longueurEcrite(Ns[i]!, D));
  const P = Math.max(longueur(S), ...lens, D + 1) - 1;
  const col = (q: number) => 1 + (P - q);
  const k = termes.length;
  const cellules: Cellule[] = [];
  const etapes: Etape[] = [];
  termes.forEach((t, i) => {
    const di = decimalesDe(t);
    for (let q = 0; q < lens[i]!; q++) {
      const zero = q < D - di;
      cellules.push({
        ligne: 1 + i,
        col: col(q),
        texte: String(chiffre(Ns[i]!, q)),
        type: zero ? 'zero' : 'donnee',
        virgule: D > 0 && q === D && !zero ? true : undefined,
      });
    }
    if (D > 0 && di === 0) {
      // virgule ajoutée à un nombre entier aligné avec des décimaux
      const c = cellules.find((x) => x.ligne === 1 + i && x.col === col(D));
      if (c) c.virgule = true;
    }
    if (i > 0) cellules.push({ ligne: 1 + i, col: 0, texte: '+', type: 'operateur' });
  });
  const ligneRes = k + 1;
  let retenue = 0;
  const maxLen = Math.max(...lens);
  for (let q = 0; q < maxLen || retenue > 0; q++) {
    const chiffres = Ns.map((N, i) => (q < lens[i]! ? chiffre(N, q) : null)).filter(
      (x): x is number => x !== null,
    );
    const s = chiffres.reduce((a, b) => a + b, 0) + retenue;
    const idx = etapes.length;
    const nom = nomRang(q - D);
    const aide =
      q >= maxLen
        ? `Il reste la retenue : j’écris ${retenue}.`
        : `Colonne des ${nom} : ${chiffres.join(' + ')}${retenue ? ` + ${retenue} (retenue)` : ''} = ${s}` +
          (s >= 10 ? `, j’écris ${s % 10} et je retiens ${Math.floor(s / 10)}.` : `, j’écris ${s}.`);
    etapes.push({ attendu: String(s % 10), aide, ligne: ligneRes, col: col(q) });
    cellules.push({
      ligne: ligneRes,
      col: col(q),
      texte: String(s % 10),
      type: 'saisie',
      etape: idx,
      virgule: D > 0 && q === D ? true : undefined,
    });
    retenue = Math.floor(s / 10);
    if (retenue > 0 && q + 1 < maxLen)
      cellules.push({
        ligne: 0,
        col: col(q + 1),
        texte: String(retenue),
        type: 'retenue',
        visibleA: idx + 1,
        aide: true,
      });
  }
  return {
    op: '+',
    lignes: ligneRes + 1,
    colonnes: P + 2,
    cellules,
    traits: [{ ligne: k, col0: 0, col1: P + 1 }],
    etapes,
    resultat: roundTo(S / 10 ** D, 6),
    casesFuturesVisibles: true,
    conclusion: `${termes.map((t) => formatNumber(t)).join(' + ')} = ${formatNumber(roundTo(S / 10 ** D, 6))}`,
  };
}

/* ------------------------------------------------------------------ */
/* Soustraction                                                        */
/* ------------------------------------------------------------------ */

function soustraction(a: number, b: number, methode: Methode): Disposition {
  const D = Math.max(decimalesDe(a), decimalesDe(b));
  const A = echelle(a, D);
  const B = echelle(b, D);
  const R = A - B;
  const lenA = longueurEcrite(A, D);
  const lenB = longueurEcrite(B, D);
  const P = lenA - 1;
  const col = (q: number) => 1 + (P - q);
  const cellules: Cellule[] = [];
  const etapes: Etape[] = [];
  const da = decimalesDe(a);
  const db = decimalesDe(b);
  const celluleA: Cellule[] = [];
  for (let q = 0; q < lenA; q++) {
    const c: Cellule = {
      ligne: 1,
      col: col(q),
      texte: String(chiffre(A, q)),
      type: q < D - da ? 'zero' : 'donnee',
      virgule: D > 0 && q === D ? true : undefined,
    };
    celluleA[q] = c;
    cellules.push(c);
  }
  for (let q = 0; q < lenB; q++)
    cellules.push({
      ligne: 2,
      col: col(q),
      texte: String(chiffre(B, q)),
      type: q < D - db ? 'zero' : 'donnee',
      virgule: D > 0 && q === D ? true : undefined,
    });
  cellules.push({ ligne: 2, col: 0, texte: '−', type: 'operateur' });

  // Rang du chiffre le plus haut du résultat à écrire (pas de zéros inutiles à gauche)
  const hautRes = Math.max(longueur(R) - 1, D);
  const t = Array.from({ length: lenA }, (_, q) => chiffre(A, q));
  const bq = (q: number) => (q < lenB ? chiffre(B, q) : 0);
  const derniereMarque = new Map<number, Cellule>();
  let reportBas = 0;

  for (let q = 0; q < lenA; q++) {
    const idx = etapes.length;
    let aide: string;
    let d: number;
    const nom = nomRang(q - D);
    if (methode === 'cassage') {
      const marques: string[] = [];
      if (t[q]! < bq(q)) {
        let j = q + 1;
        while (j < lenA && t[j] === 0) j++;
        const marquer = (r: number) => {
          const avant = derniereMarque.get(r);
          if (avant) avant.cacheA = idx;
          else celluleA[r]!.barreA = idx;
          const c: Cellule = { ligne: 0, col: col(r), texte: String(t[r]), type: 'casse', visibleA: idx };
          cellules.push(c);
          derniereMarque.set(r, c);
        };
        for (let r = j; r > q; r--) {
          t[r] = t[r]! - 1;
          t[r - 1] = t[r - 1]! + 10;
          marques.push(`1 ${nomRang(r - D, false)} en 10 ${nomRang(r - 1 - D)}`);
        }
        for (let r = j; r >= q; r--) marquer(r);
      }
      d = t[q]! - bq(q);
      aide =
        (marques.length
          ? `Pas assez ${/^[aeiouéè]/.test(nom) ? 'd’' : 'de '}${nom} en haut : je casse ${marques.join(', puis ')}. `
          : `Colonne des ${nom} : `) + `${t[q]} − ${bq(q)} = ${d}.`;
    } else {
      const haut = chiffre(A, q);
      const bas = bq(q) + reportBas;
      const basTexte = reportBas ? `${bq(q)} + 1 = ${bas}, ` : '';
      if (haut < bas) {
        cellules.push({ ligne: 1, col: col(q), texte: '1', type: 'retenue', coin: 'hg', visibleA: idx });
        if (q + 1 < lenA)
          cellules.push({
            ligne: 2,
            col: col(q + 1),
            texte: '1',
            type: 'retenue',
            coin: 'bg',
            visibleA: idx,
          });
        d = haut + 10 - bas;
        aide = `Colonne des ${nom} : ${basTexte}${haut} est plus petit que ${bas} : j’ajoute 10 ${nom} en haut et 1 ${nomRang(q + 1 - D, false)} en bas. ${haut + 10} − ${bas} = ${d}.`;
        reportBas = 1;
      } else {
        d = haut - bas;
        aide = `Colonne des ${nom} : ${basTexte}${haut} − ${bas} = ${d}.`;
        reportBas = 0;
      }
    }
    if (q > hautRes) {
      // zéro inutile à gauche : rien à écrire
      if (d !== 0) throw new Error('soustraction incohérente');
      continue;
    }
    etapes.push({ attendu: String(d), aide, ligne: 3, col: col(q) });
    cellules.push({
      ligne: 3,
      col: col(q),
      texte: String(d),
      type: 'saisie',
      etape: idx,
      virgule: D > 0 && q === D ? true : undefined,
    });
  }
  const res = roundTo(R / 10 ** D, 6);
  return {
    op: '−',
    lignes: 4,
    colonnes: P + 2,
    cellules,
    traits: [{ ligne: 2, col0: 0, col1: P + 1 }],
    etapes,
    resultat: res,
    casesFuturesVisibles: true,
    conclusion: `${formatNumber(a)} − ${formatNumber(b)} = ${formatNumber(res)}`,
  };
}

/* ------------------------------------------------------------------ */
/* Multiplication                                                      */
/* ------------------------------------------------------------------ */

function multiplication(a: number, b: number): Disposition {
  const da = decimalesDe(a);
  const db = decimalesDe(b);
  const A = echelle(a, da);
  const B = echelle(b, db);
  const Pr = A * B;
  const lenA = longueurEcrite(A, da);
  const lenB = longueurEcrite(B, db);
  const D = da + db;
  const lenP = longueurEcrite(Pr, D);
  const P = Math.max(lenP, lenA, lenB) - 1;
  const col = (q: number) => 1 + (P - q);
  const cellules: Cellule[] = [];
  const etapes: Etape[] = [];
  const traits: Trait[] = [];
  for (let q = 0; q < lenA; q++)
    cellules.push({
      ligne: 1,
      col: col(q),
      texte: String(chiffre(A, q)),
      type: 'donnee',
      virgule: da > 0 && q === da ? true : undefined,
    });
  for (let q = 0; q < lenB; q++)
    cellules.push({
      ligne: 2,
      col: col(q),
      texte: String(chiffre(B, q)),
      type: 'donnee',
      virgule: db > 0 && q === db ? true : undefined,
    });
  cellules.push({ ligne: 2, col: 0, texte: '×', type: 'operateur' });
  traits.push({ ligne: 2, col0: 0, col1: P + 1 });

  // Lignes de produits partiels (on saute les chiffres 0 du multiplicateur, sauf s'il n'y a qu'un chiffre)
  const rangsB = Array.from({ length: lenB }, (_, j) => j).filter((j) => lenB === 1 || chiffre(B, j) !== 0);
  const partiels: { j: number; ligne: number; valeur: number }[] = [];
  let ligne = 3;
  const debutsPartiels: number[] = [];
  const retenuesParPartiel: Cellule[][] = [];
  for (const j of rangsB) {
    const bj = chiffre(B, j);
    const valeur = A * bj * 10 ** j;
    partiels.push({ j, ligne, valeur });
    debutsPartiels.push(etapes.length);
    const mesRetenues: Cellule[] = [];
    for (let z = 0; z < j; z++)
      cellules.push({ ligne, col: col(z), texte: '0', type: 'zero', visibleA: etapes.length });
    let retenue = 0;
    for (let i = 0; i < lenA; i++) {
      const ai = chiffre(A, i);
      const s = ai * bj + retenue;
      const idx = etapes.length;
      const debutLigne =
        i === 0 && j > 0
          ? `Je multiplie par le chiffre des ${nomRang(j)} : j’ai d’abord écrit ${j > 1 ? `${j} zéros` : 'un 0'} à droite. `
          : '';
      const aide = `${debutLigne}${bj} × ${ai}${retenue ? ` + ${retenue} (retenue)` : ''} = ${s}${
        s >= 10 && i < lenA - 1
          ? `, j’écris ${s % 10} et je retiens ${Math.floor(s / 10)}.`
          : `, j’écris ${i < lenA - 1 ? s % 10 : s}.`
      }`;
      const dernier = i === lenA - 1;
      if (dernier && s >= 10) {
        // dernier chiffre : on écrit le nombre entier (deux cases)
        etapes.push({ attendu: String(s % 10), aide, ligne, col: col(i + j) });
        cellules.push({ ligne, col: col(i + j), texte: String(s % 10), type: 'saisie', etape: idx });
        etapes.push({
          attendu: String(Math.floor(s / 10)),
          aide: `J’écris le ${Math.floor(s / 10)} de ${s} devant.`,
          ligne,
          col: col(i + j + 1),
        });
        cellules.push({
          ligne,
          col: col(i + j + 1),
          texte: String(Math.floor(s / 10)),
          type: 'saisie',
          etape: idx + 1,
        });
      } else {
        etapes.push({ attendu: String(s % 10), aide, ligne, col: col(i + j) });
        cellules.push({ ligne, col: col(i + j), texte: String(s % 10), type: 'saisie', etape: idx });
      }
      retenue = Math.floor(s / 10);
      if (retenue && !dernier) {
        const c: Cellule = {
          ligne: 0,
          col: col(i + 1),
          texte: String(retenue),
          type: 'retenue',
          visibleA: idx + 1,
          aide: true,
        };
        mesRetenues.push(c);
        cellules.push(c);
      }
    }
    retenuesParPartiel.push(mesRetenues);
    ligne++;
  }
  // les retenues d'une ligne disparaissent quand on commence la ligne suivante
  retenuesParPartiel.forEach((rs, k) => {
    const fin = debutsPartiels[k + 1];
    if (fin !== undefined) rs.forEach((c) => (c.cacheA = fin));
  });

  let ligneRes = ligne - 1;
  if (partiels.length > 1) {
    // addition des produits partiels
    const ligneRet = ligne;
    ligneRes = ligne + 1;
    traits.push({ ligne: ligneRet, col0: 0, col1: P + 1 });
    cellules.push({ ligne: ligneRes - 1, col: 0, texte: '+', type: 'operateur', visibleA: etapes.length });
    const lens = partiels.map((p) => longueur(p.valeur));
    let retenue = 0;
    const maxLen = Math.max(...lens);
    for (let q = 0; q < maxLen || retenue > 0; q++) {
      const chiffres = partiels.filter((_, i) => q < lens[i]!).map((p) => chiffre(p.valeur, q));
      const s = chiffres.reduce((x, y) => x + y, 0) + retenue;
      const idx = etapes.length;
      etapes.push({
        attendu: String(s % 10),
        aide:
          q >= maxLen
            ? `Il reste la retenue : j’écris ${retenue}.`
            : `J’additionne les lignes : ${chiffres.join(' + ')}${retenue ? ` + ${retenue} (retenue)` : ''} = ${s}` +
              (s >= 10 ? `, j’écris ${s % 10} et je retiens ${Math.floor(s / 10)}.` : `, j’écris ${s}.`),
        ligne: ligneRes,
        col: col(q),
      });
      cellules.push({ ligne: ligneRes, col: col(q), texte: String(s % 10), type: 'saisie', etape: idx });
      retenue = Math.floor(s / 10);
      if (retenue && q + 1 < maxLen)
        cellules.push({
          ligne: ligneRet,
          col: col(q + 1),
          texte: String(retenue),
          type: 'retenue',
          visibleA: idx + 1,
          aide: true,
        });
    }
  }
  // zéros d'écriture avant la virgule (0,12 × 3 = 0,36) : cases supplémentaires à remplir
  const ecrits = cellules.filter(
    (c) => c.ligne === ligneRes && (c.type === 'saisie' || c.type === 'zero'),
  ).length;
  for (let q = ecrits; q < lenP; q++) {
    const idx = etapes.length;
    etapes.push({
      attendu: '0',
      aide: `Il faut ${D} chiffres après la virgule : j’écris un 0 devant.`,
      ligne: ligneRes,
      col: col(q),
    });
    cellules.push({ ligne: ligneRes, col: col(q), texte: '0', type: 'saisie', etape: idx });
  }
  const fin = etapes.length;
  if (D > 0) {
    const c = cellules.find((x) => x.ligne === ligneRes && x.col === col(D));
    if (c) c.virguleA = fin;
  }
  const res = roundTo(Pr / 10 ** D, 6);
  return {
    op: '×',
    lignes: ligneRes + 1,
    colonnes: P + 2,
    cellules,
    traits,
    etapes,
    resultat: res,
    casesFuturesVisibles: true,
    conclusion:
      D > 0
        ? `${da ? `${formatNumber(a)} a ${da} chiffre${da > 1 ? 's' : ''} après la virgule` : ''}${da && db ? ' et ' : ''}${db ? `${formatNumber(b)} en a ${db}` : ''} : le résultat a ${D} chiffre${D > 1 ? 's' : ''} après la virgule. ${formatNumber(a)} × ${formatNumber(b)} = ${formatNumber(res)}${decimalesDe(res) < D ? ` (${formatNumber(res, D)} = ${formatNumber(res)} : les zéros à la fin de la partie décimale sont inutiles)` : ''}`
        : `${formatNumber(a)} × ${formatNumber(b)} = ${formatNumber(res)}`,
  };
}

/* ------------------------------------------------------------------ */
/* Division                                                            */
/* ------------------------------------------------------------------ */

function division(a: number, b: number, decQ: number): Disposition {
  const da = decimalesDe(a);
  const A = echelle(a, da);
  const intLen = longueur(Math.floor(a));
  // chiffres du dividende (sans virgule), puis zéros abaissés si besoin
  const chiffresA = String(A)
    .padStart(intLen + da, '0')
    .split('')
    .map(Number);
  const nbTotal = intLen + Math.max(da, decQ);
  const colDiv = nbTotal + 1; // colonne du diviseur (après une colonne vide : la potence)
  const lenB = longueur(b);
  const cellules: Cellule[] = [];
  const etapes: Etape[] = [];
  const traits: Trait[] = [];

  for (let i = 0; i < chiffresA.length; i++)
    cellules.push({
      ligne: 0,
      col: i,
      texte: String(chiffresA[i]),
      type: 'donnee',
      virgule: da > 0 && i === intLen - 1 ? true : undefined,
    });
  String(b)
    .split('')
    .forEach((c, i) => cellules.push({ ligne: 0, col: colDiv + i, texte: c, type: 'donnee' }));

  let reste = 0;
  let lignePartiel = 0; // ligne où se trouve le dividende partiel courant
  let qCol = colDiv; // colonne du prochain chiffre du quotient
  let ecrit = false;
  let derniereLigne = 1;
  const quotient: string[] = [];
  let virguleAjoutee = false;

  for (let i = 0; i < nbTotal; i++) {
    const zeroAbaisse = i >= chiffresA.length;
    const d = zeroAbaisse ? 0 : chiffresA[i]!;
    const partiel = reste * 10 + d;
    const q = Math.floor(partiel / b);
    if (!ecrit && i < intLen - 1 && q === 0) {
      reste = partiel;
      continue; // on prend un chiffre de plus pour former le premier dividende partiel
    }
    const idx = etapes.length;
    if (zeroAbaisse) {
      // le zéro abaissé apparaît dans le dividende (et la virgule si le dividende était entier)
      cellules.push({ ligne: 0, col: i, texte: '0', type: 'zero', visibleA: idx });
      if (da === 0 && !virguleAjoutee) {
        virguleAjoutee = true;
        const u = cellules.find((c) => c.ligne === 0 && c.col === intLen - 1);
        if (u) u.virguleA = idx;
      }
    }
    const r = partiel - q * b;
    const virguleQ = decQ > 0 && i === intLen - 1;
    etapes.push({
      attendu: String(q),
      aide: `${zeroAbaisse ? 'J’abaisse un 0. ' : ''}Dans ${partiel}, combien de fois ${b} ? ${q} × ${b} = ${q * b}${r ? `, il reste ${r}` : ''} : j’écris ${q}${virguleQ ? ', puis la virgule : on passe aux dixièmes' : ''}.`,
      ligne: 1,
      col: qCol,
    });
    cellules.push({
      ligne: 1,
      col: qCol,
      texte: String(q),
      type: 'saisie',
      etape: idx,
      virguleA: virguleQ ? idx + 1 : undefined,
    });
    quotient.push(String(q));
    if (virguleQ) quotient.push('.');
    qCol++;
    ecrit = true;
    const dernier = i === nbTotal - 1;
    let ligneReste: number;
    if (q > 0) {
      const lp = lignePartiel + 1;
      const prod = String(q * b);
      prod.split('').forEach((c, k) =>
        cellules.push({
          ligne: lp,
          col: i - prod.length + 1 + k,
          texte: c,
          type: 'donnee',
          visibleA: idx + 1,
        }),
      );
      cellules.push({ ligne: lp, col: i - prod.length, texte: '−', type: 'operateur', visibleA: idx + 1 });
      traits.push({
        ligne: lp,
        col0: i - Math.max(prod.length, String(partiel).length) + 1,
        col1: i,
        visibleA: idx + 1,
      });
      ligneReste = lp + 1;
    } else ligneReste = dernier ? lignePartiel + 1 : lignePartiel;
    const rs = String(r);
    if (dernier) {
      if (decQ === 0 && r !== 0) {
        // division euclidienne : l'enfant écrit le reste
        rs.split('').forEach((c, k) => {
          const e = etapes.length;
          etapes.push({
            attendu: c,
            aide: `${partiel} − ${q * b} = ${r} : c’est le reste (il est plus petit que ${b}).`,
            ligne: ligneReste,
            col: i - rs.length + 1 + k,
          });
          cellules.push({
            ligne: ligneReste,
            col: i - rs.length + 1 + k,
            texte: c,
            type: 'saisie',
            etape: e,
          });
        });
      } else if (q > 0)
        rs.split('').forEach((c, k) =>
          cellules.push({
            ligne: ligneReste,
            col: i - rs.length + 1 + k,
            texte: c,
            type: 'donnee',
            visibleA: idx + 1,
          }),
        );
      derniereLigne = Math.max(derniereLigne, ligneReste);
    } else {
      if (q > 0)
        rs.split('').forEach((c, k) =>
          cellules.push({
            ligne: ligneReste,
            col: i - rs.length + 1 + k,
            texte: c,
            type: 'donnee',
            visibleA: idx + 1,
          }),
        );
      if (ligneReste > 0) {
        const suivant = i + 1 < chiffresA.length ? chiffresA[i + 1]! : 0;
        cellules.push({
          ligne: ligneReste,
          col: i + 1,
          texte: String(suivant),
          type: 'donnee',
          visibleA: idx + 1,
        });
      }
      lignePartiel = ligneReste;
      derniereLigne = Math.max(derniereLigne, ligneReste);
    }
    reste = r;
  }
  const quotientTexte = quotient.join('');
  const resultat = Number(quotientTexte.endsWith('.') ? quotientTexte.slice(0, -1) : quotientTexte);
  const nbLignes = derniereLigne + 1;
  traits.push({ ligne: 0, col0: colDiv, col1: colDiv, vertical: true, ligne1: Math.max(1, nbLignes - 1) });
  traits.push({ ligne: 0, col0: colDiv, col1: Math.max(qCol - 1, colDiv + lenB - 1) });
  const resteFinal = decQ === 0 ? reste : undefined;
  return {
    op: '÷',
    lignes: nbLignes,
    colonnes: Math.max(colDiv + lenB, qCol),
    cellules,
    traits,
    etapes,
    resultat,
    reste: resteFinal,
    casesFuturesVisibles: false,
    conclusion:
      resteFinal !== undefined && resteFinal > 0
        ? `${formatNumber(a)} = (${b} × ${formatNumber(resultat)}) + ${resteFinal} : le quotient est ${formatNumber(resultat)}, le reste est ${resteFinal}.`
        : decQ > 0 && reste !== 0
          ? `${formatNumber(a)} ÷ ${b} ≈ ${formatNumber(resultat)} (on s’arrête ${decQ === 1 ? 'aux dixièmes' : decQ === 2 ? 'aux centièmes' : 'aux millièmes'})`
          : `${formatNumber(a)} ÷ ${b} = ${formatNumber(resultat)}`,
  };
}

/* ------------------------------------------------------------------ */

/** Décale toute la disposition de `k` colonnes vers la droite (place pour le signe « − » de la division). */
function decaler(d: Disposition, k: number): Disposition {
  return {
    ...d,
    colonnes: d.colonnes + k,
    cellules: d.cellules.map((c) => ({ ...c, col: c.col + k })),
    traits: d.traits.map((t) => ({ ...t, col0: t.col0 + k, col1: t.col1 + k })),
    etapes: d.etapes.map((e) => ({ ...e, col: e.col + k })),
  };
}

/** Disposition complète d'une opération posée. */
export function disposer(p: Posee): Disposition {
  const [a, b] = p.termes as [number, number];
  switch (p.op) {
    case '+':
      return addition(p.termes);
    case '−':
      return soustraction(a, b, p.methode);
    case '×':
      return multiplication(a, b);
    case '÷':
      return decaler(division(a, b, p.decimalesQuotient), 1);
  }
}

/** Valeur obtenue en lisant les cases à remplir (pour vérifier les algorithmes). */
export function lireResultat(d: Disposition): number {
  const ligneRes =
    d.op === '÷' ? 1 : Math.max(...d.cellules.filter((c) => c.type === 'saisie').map((c) => c.ligne));
  const cs = d.cellules
    .filter((c) => c.ligne === ligneRes && (c.type === 'saisie' || (d.op !== '÷' && c.type === 'zero')))
    .sort((x, y) => x.col - y.col);
  const s = cs.map((c) => c.texte + (c.virgule || c.virguleA !== undefined ? '.' : '')).join('');
  return Number(s.endsWith('.') ? s.slice(0, -1) : s);
}

/** Écriture de l'opération en ligne : « 345 + 278 ». */
export const enLigne = (p: Posee) => p.termes.map((t) => formatNumber(t)).join(` ${p.op} `);
