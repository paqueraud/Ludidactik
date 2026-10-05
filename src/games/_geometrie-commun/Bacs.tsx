/**
 * Classer des étiquettes dans des bacs (items `classification`), au tactile ET au clavier :
 * toucher une étiquette puis toucher un bac (« toucher puis toucher ») ; au clavier, ← → pour choisir
 * l'étiquette, 1 à 6 pour la poser dans un bac, Entrée pour vérifier.
 * Facile : vérification immédiate (l'étiquette revient si elle n'est pas dans le bon bac).
 * Normal et Plus loin : on range tout, puis on vérifie.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import type { ClassificationItem, Level } from '@/content/schemas';
import type { SfxService } from '@/services/sfx';
import { dansUnChamp } from '../_nombres-commun/outils';

export interface ResultatBacs {
  correct: boolean;
  erreurs: number;
  donne: string;
  attendu: string;
}

const TEINTES_BACS = [
  'bg-sky/20',
  'bg-sun/25',
  'bg-coral/15',
  'bg-grass/20',
  'bg-grape/15',
  'bg-histoire/20',
];

export function Bacs({
  item,
  level,
  actif,
  sfx,
  rendu,
  teintes = TEINTES_BACS,
  enTeteBac,
  onFini,
}: {
  item: ClassificationItem;
  level: Level;
  /** Faux pendant la pause ou après la réponse. */
  actif: boolean;
  sfx: SfxService;
  /** Dessin propre au jeu pour chaque élément (figure, angle…). */
  rendu?: (i: number) => ReactNode;
  teintes?: string[];
  /** Contenu ajouté en tête de chaque bac (pictogramme…). */
  enTeteBac?: (c: number) => ReactNode;
  onFini: (r: ResultatBacs) => void;
}) {
  const reduce = useReducedMotion();
  const n = item.elements.length;
  const immediat = level === 'facile';
  const [place, setPlace] = useState<(number | null)[]>(() => Array<number | null>(n).fill(null));
  const [sel, setSel] = useState<number | null>(0);
  const [erreurs, setErreurs] = useState(0);
  const [refus, setRefus] = useState<number | null>(null);
  const [verifie, setVerifie] = useState(false);

  const libres = useMemo(() => place.map((p, i) => (p === null ? i : -1)).filter((i) => i >= 0), [place]);
  const tousPlaces = libres.length === 0;

  const resultat = useCallback(
    (pl: (number | null)[], err: number): ResultatBacs => {
      const fautes = item.elements.filter((e, i) => pl[i] !== e.category).length;
      const total = immediat ? err : fautes;
      return {
        correct: immediat ? err <= 1 : fautes === 0,
        erreurs: total,
        donne: item.elements.map((e, i) => `${e.label} → ${item.categories[pl[i] ?? -1] ?? '?'}`).join(' ; '),
        attendu: item.elements.map((e) => `${e.label} → ${item.categories[e.category]}`).join(' ; '),
      };
    },
    [item, immediat],
  );

  const poser = useCallback(
    (bac: number) => {
      if (!actif || verifie || sel === null) return;
      const el = item.elements[sel]!;
      if (immediat && el.category !== bac) {
        sfx.play('faux');
        setErreurs((e) => e + 1);
        setRefus(sel);
        setTimeout(() => setRefus(null), 700);
        return;
      }
      sfx.play('pop');
      const next = place.map((p, i) => (i === sel ? bac : p));
      setPlace(next);
      const restants = next.map((p, i) => (p === null ? i : -1)).filter((i) => i >= 0);
      setSel(restants.find((i) => i > sel) ?? restants[0] ?? null);
      if (immediat && restants.length === 0) {
        setVerifie(true);
        onFini(resultat(next, erreurs));
      }
    },
    [actif, verifie, sel, item, immediat, place, sfx, erreurs, onFini, resultat],
  );

  const verifier = useCallback(() => {
    if (!actif || verifie || !tousPlaces) return;
    setVerifie(true);
    onFini(resultat(place, erreurs));
  }, [actif, verifie, tousPlaces, place, erreurs, onFini, resultat]);

  // Clavier
  useEffect(() => {
    if (!actif || verifie) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      const ordre = immediat ? libres : item.elements.map((_, i) => i);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!ordre.length) return;
        const k = sel === null ? -1 : ordre.indexOf(sel);
        const d = e.key === 'ArrowRight' ? 1 : -1;
        setSel(ordre[(k + d + ordre.length) % ordre.length]!);
        sfx.play('tic');
      } else if (/^[1-6]$/.test(e.key) && Number(e.key) <= item.categories.length) {
        e.preventDefault();
        poser(Number(e.key) - 1);
      } else if (e.key === 'Enter' && tousPlaces) {
        e.preventDefault();
        verifier();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif, verifie, immediat, libres, item, sel, poser, tousPlaces, verifier, sfx]);

  const carte = (i: number) => {
    const el = item.elements[i]!;
    const choisi = sel === i && !verifie;
    const faux = verifie && !immediat && place[i] !== el.category;
    return (
      <motion.button
        key={i}
        layout={!reduce}
        layoutId={reduce ? undefined : `carte-${item.id}-${i}`}
        type="button"
        onClick={() => {
          if (!actif || verifie) return;
          if (immediat && place[i] !== null) return;
          setSel(i);
          sfx.play('tic');
        }}
        animate={refus === i && !reduce ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className={`flex min-h-touch min-w-touch max-w-full items-center gap-2 rounded-2xl border-4 bg-card px-3 py-2 text-left font-bold shadow-pop-sm ${
          choisi ? 'border-grape ring-4 ring-grape/30' : faux ? 'border-coral' : 'border-white'
        }`}
        aria-pressed={choisi}
        aria-label={`${el.label}${place[i] !== null ? `, rangé dans « ${item.categories[place[i]!]} »` : ''}`}
      >
        {rendu?.(i)}
        {el.image && !rendu && (
          <span className="text-2xl" aria-hidden>
            {el.image}
          </span>
        )}
        <span className="break-words">{el.label}</span>
        {faux && <span className="text-sm text-grass-dark">→ {item.categories[el.category]}</span>}
      </motion.button>
    );
  };

  const nb = item.categories.length;
  return (
    <div className="flex w-full flex-col gap-3">
      <div
        className="flex min-h-[4rem] flex-wrap justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/20 p-2"
        aria-label="Étiquettes à ranger"
      >
        <AnimatePresence>{libres.map(carte)}</AnimatePresence>
        {tousPlaces && !verifie && (
          <p className="self-center text-center font-bold text-ink-soft">Tout est rangé !</p>
        )}
      </div>
      <div
        className={`grid gap-2 ${nb <= 2 ? 'grid-cols-2' : nb === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}
      >
        {item.categories.map((c, k) => (
          <div
            key={c}
            className={`flex min-w-0 flex-col gap-2 rounded-2xl p-2 ${teintes[k % teintes.length]}`}
          >
            <button
              type="button"
              className="btn-3d flex min-h-btn items-center justify-center gap-2 bg-card px-2 py-1 text-center text-base sm:text-lg"
              onClick={() => poser(k)}
              disabled={!actif || verifie || sel === null}
              aria-label={`Ranger dans « ${c} » (touche ${k + 1})`}
            >
              {enTeteBac?.(k)}
              <span className="rounded-full bg-ink/10 px-2 text-sm" aria-hidden>
                {k + 1}
              </span>
              <span className="break-words">{c}</span>
            </button>
            <div className="flex min-h-[3rem] flex-wrap gap-2">
              {place.map((p, i) => (p === k ? carte(i) : null))}
            </div>
          </div>
        ))}
      </div>
      {immediat && erreurs > 0 && !verifie && (
        <p className="text-center font-bold text-coral-dark" role="status">
          Presque ! Regarde bien et essaie un autre bac.
        </p>
      )}
      {!immediat && !verifie && (
        <Button
          variant="grass"
          size="lg"
          onClick={verifier}
          disabled={!actif || !tousPlaces}
          className="self-center"
        >
          Vérifier
        </Button>
      )}
    </div>
  );
}
