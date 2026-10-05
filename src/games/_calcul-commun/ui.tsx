/**
 * Composants et hooks communs aux jeux de calcul (n° 11 à 20) : déroulé des manches, état « pas
 * d'exercice adapté », saisie de plusieurs nombres (heures/minutes, numérateur/dénominateur…) au pavé
 * numérique ou au clavier.
 */
import { motion } from 'framer-motion';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Keypad } from '@/components/Keypads';
import type { Item } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { useGameSession } from '../_kit/session';
import { tirerItem } from './tirer';

/* ------------------------------------------------------------------ */
/* Déroulé d'une partie                                                */
/* ------------------------------------------------------------------ */

export interface Courant<T> {
  item: Item;
  valeur: T;
}

/**
 * Déroulé standard : tirage des items qui conviennent, manches, réponse juste/fausse, fin de partie.
 * Après une bonne réponse, on passe tout seul à la manche suivante (sauf `avanceAuto: false`) ;
 * après une erreur, l'enfant lit la correction puis appuie sur « Continuer ».
 */
export function useManches<T>(
  props: Pick<GameProps, 'stream' | 'target' | 'paused' | 'onAnswer' | 'onEnd' | 'sfx' | 'speech'>,
  opts: {
    total: number;
    convertir: (it: Item) => T | null;
    fin: (bonnes: number, total: number) => { headline: string; won?: boolean; score?: number };
    delaiJuste?: number;
    avanceAuto?: boolean;
  },
) {
  const { stream, target, paused, onAnswer, onEnd, sfx, speech } = props;
  const session = useGameSession({ paused, onAnswer, onEnd });
  const vus = useRef(new Set<string>());
  const convertir = useRef(opts.convertir);
  convertir.current = opts.convertir;
  const tirer = useCallback(
    () => tirerItem(stream, (it) => convertir.current(it), vus.current, target()),
    [stream, target],
  );
  const [courant, setCourant] = useState<Courant<T> | null>(tirer);
  const [manche, setManche] = useState(1);
  const [etat, setEtat] = useState<'juste' | 'faux' | null>(null);
  const [fini, setFini] = useState(false);
  const bonnes = useRef(0);
  const [nbBonnes, setNbBonnes] = useState(0);

  useEffect(() => {
    session.startQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courant]);

  // Pause : on coupe la voix
  useEffect(() => {
    if (paused) speech.stop();
  }, [paused, speech]);

  /** Enregistre la réponse de la manche (une seule fois par manche). */
  const repondre = useCallback(
    (correct: boolean, donne: string, attendu: string) => {
      if (!courant || etat || fini) return;
      session.answer(courant.item, correct, donne, attendu);
      setEtat(correct ? 'juste' : 'faux');
      if (correct) {
        bonnes.current++;
        setNbBonnes(bonnes.current);
        sfx.play('juste');
      } else {
        sfx.play('faux');
        vibrate(40);
      }
    },
    [courant, etat, fini, session, sfx],
  );

  const total = opts.total;
  const finRef = useRef(opts.fin);
  finRef.current = opts.fin;

  const suivant = useCallback(() => {
    if (fini) return;
    if (manche >= total) {
      setFini(true);
      const r = finRef.current(bonnes.current, total);
      sfx.play(r.won ?? bonnes.current >= Math.ceil(total / 2) ? 'fanfare' : 'etoile');
      session.end({
        won: r.won ?? bonnes.current >= Math.ceil(total / 2),
        headline: r.headline,
        score: r.score,
        delayMs: 1200,
      });
      return;
    }
    setCourant(tirer());
    setManche((m) => m + 1);
    setEtat(null);
  }, [fini, manche, total, sfx, session, tirer]);

  // Bonne réponse : on enchaîne tout seul (le temps de voir l'animation)
  const delai = opts.delaiJuste ?? 1400;
  const auto = opts.avanceAuto ?? true;
  useEffect(() => {
    if (etat !== 'juste' || paused || !auto) return;
    const t = setTimeout(suivant, delai);
    return () => clearTimeout(t);
  }, [etat, paused, suivant, delai, auto]);

  return { courant, manche, total, etat, fini, bonnes: nbBonnes, repondre, suivant, session, setEtat };
}

/* ------------------------------------------------------------------ */
/* État vide                                                           */
/* ------------------------------------------------------------------ */

/** Aucun exercice de la bonne forme dans cette leçon : message calme, sans erreur. */
export function EtatVide({ icone, jeu, besoin }: { icone: string; jeu: string; besoin: string }) {
  return (
    <div className="carte mx-auto my-6 flex max-w-md flex-col items-center gap-3 p-6 text-center" role="status">
      <span className="text-5xl" aria-hidden>
        {icone}
      </span>
      <p className="font-titre text-2xl font-extrabold">Pas d’exercice adapté pour l’instant</p>
      <p className="text-ink-soft">
        {jeu} a besoin {besoin}. Choisis un autre jeu pour cette leçon !
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* En-tête                                                             */
/* ------------------------------------------------------------------ */

export function Bandeau({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-wrap items-center justify-between gap-2">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Saisie de plusieurs nombres                                         */
/* ------------------------------------------------------------------ */

export interface Champ {
  cle: string;
  /** Nom lu par les lecteurs d'écran (« heures »). */
  nom: string;
  /** Texte affiché après la case (« h », « min »). */
  suffixe?: string;
  /** Nombre maximal de caractères. */
  max: number;
}

/**
 * Cases de saisie (une ou plusieurs) + pavé numérique. Clavier : chiffres, virgule, Retour arrière,
 * Entrée ; flèches gauche/droite, espace, « / », « h » ou « : » pour changer de case.
 * Une case pleine passe automatiquement à la suivante.
 */
export function SaisieChamps({
  champs,
  valeurs,
  onChange,
  onValider,
  decimal = false,
  disabled = false,
  etat = null,
  disposition = 'ligne',
  separateur,
  clavier = true,
}: {
  champs: Champ[];
  valeurs: Record<string, string>;
  onChange(v: Record<string, string>): void;
  onValider(): void;
  decimal?: boolean;
  disabled?: boolean;
  etat?: 'juste' | 'faux' | null;
  /** « fraction » : numérateur au-dessus du dénominateur. */
  disposition?: 'ligne' | 'fraction';
  separateur?: string;
  clavier?: boolean;
}) {
  const [actif, setActif] = useState(0);
  const ref = useRef({ valeurs, actif, champs, onChange, onValider, disabled });
  ref.current = { valeurs, actif, champs, onChange, onValider, disabled };

  // Revenir à la première case quand toutes les cases sont vides (nouvelle question)
  const toutesVides = champs.every((c) => !valeurs[c.cle]);
  useEffect(() => {
    if (toutesVides) setActif(0);
  }, [toutesVides]);

  const taper = useCallback((k: string) => {
    const { valeurs: v, actif: a, champs: cs, onChange: oc, disabled: d } = ref.current;
    if (d) return;
    const c = cs[a];
    if (!c) return;
    const cur = v[c.cle] ?? '';
    if (k === ',' && (cur.includes(',') || !cur)) return;
    if (cur.length >= c.max) {
      if (a < cs.length - 1) {
        const n = cs[a + 1]!;
        oc({ ...v, [n.cle]: (v[n.cle] ?? '') + k });
        setActif(a + 1);
      }
      return;
    }
    const nv = cur + k;
    oc({ ...v, [c.cle]: nv });
    if (nv.length >= c.max && a < cs.length - 1) setActif(a + 1);
  }, []);

  const effacer = useCallback(() => {
    const { valeurs: v, actif: a, champs: cs, onChange: oc, disabled: d } = ref.current;
    if (d) return;
    const c = cs[a];
    if (!c) return;
    const cur = v[c.cle] ?? '';
    if (!cur && a > 0) {
      const p = cs[a - 1]!;
      oc({ ...v, [p.cle]: (v[p.cle] ?? '').slice(0, -1) });
      setActif(a - 1);
      return;
    }
    oc({ ...v, [c.cle]: cur.slice(0, -1) });
  }, []);

  const valider = useCallback(() => {
    if (ref.current.disabled) return;
    ref.current.onValider();
  }, []);

  useEffect(() => {
    if (!clavier) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA'].includes(t.tagName)) return;
      if (ref.current.disabled) return;
      const n = ref.current.champs.length;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        taper(e.key);
      } else if ((e.key === ',' || e.key === '.') && decimal) {
        e.preventDefault();
        taper(',');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        effacer();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        valider();
      } else if (n > 1 && ['ArrowRight', ' ', '/', 'h', ':'].includes(e.key)) {
        e.preventDefault();
        setActif((a) => Math.min(n - 1, a + 1));
      } else if (n > 1 && e.key === 'ArrowLeft') {
        e.preventDefault();
        setActif((a) => Math.max(0, a - 1));
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [taper, effacer, valider, decimal, clavier]);

  const couleur =
    etat === 'juste' ? 'border-grass bg-grass/15' : etat === 'faux' ? 'border-coral bg-coral/10' : 'border-sky bg-cream';

  const cases = champs.map((c, i) => {
    const v = valeurs[c.cle] ?? '';
    const estActif = i === actif && !disabled;
    return (
      <span key={c.cle} className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActif(i)}
          className={`flex h-14 items-center justify-center rounded-2xl border-4 px-2 font-titre text-3xl font-extrabold sm:h-16 ${couleur} ${
            estActif && champs.length > 1 ? 'ring-4 ring-grape/60' : ''
          }`}
          style={{ minWidth: `${Math.max(2.2, c.max * 0.85 + 1)}ch` }}
          aria-label={`${c.nom} : ${v || 'vide'}`}
          aria-pressed={champs.length > 1 ? estActif : undefined}
          disabled={disabled}
        >
          {v || (
            <span className={estActif ? 'animate-pulse text-ink/30' : 'text-ink/20'} aria-hidden>
              ?
            </span>
          )}
        </button>
        {c.suffixe && <span className="font-titre text-2xl font-bold">{c.suffixe}</span>}
      </span>
    );
  });

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {disposition === 'fraction' ? (
        <div className="flex flex-col items-center gap-1" role="group" aria-label="Fraction">
          {cases[0]}
          <span className="h-1.5 w-20 rounded-full bg-ink" aria-hidden />
          {cases[1]}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Ta réponse">
          {cases.flatMap((c, i) =>
            i > 0 && separateur
              ? [
                  <span key={`s${i}`} className="font-titre text-2xl font-bold" aria-hidden>
                    {separateur}
                  </span>,
                  c,
                ]
              : [c],
          )}
        </div>
      )}
      <Keypad onKey={taper} onDelete={effacer} onSubmit={valider} disabled={disabled} decimal={decimal} />
    </div>
  );
}

/** Valeurs vides pour une liste de champs. */
export const vide = (champs: Champ[]) => Object.fromEntries(champs.map((c) => [c.cle, '']));

/** Petite bulle d'aide (indice). */
export function Bulle({ children, ton = 'sun' }: { children: ReactNode; ton?: 'sun' | 'sky' | 'grape' }) {
  const fond = ton === 'sun' ? 'bg-sun/25' : ton === 'sky' ? 'bg-sky/15' : 'bg-grape/15';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full items-start gap-2 rounded-2xl px-4 py-2 font-bold ${fond}`}
    >
      {children}
    </motion.div>
  );
}
