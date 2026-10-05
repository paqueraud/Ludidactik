/**
 * Le Bâtisseur (CATALOGUE n°6) — matériel multibase virtuel.
 * On construit le nombre demandé avec des pièces : cubes (1), barres (10), plaques (100), gros cubes
 * (1 000), puis jetons pour les grands rangs ; en CM2 le même matériel sert pour les décimaux (la plaque
 * vaut alors 1, la barre 0,1, le cube 0,01). Échanges animés : 10 pièces ↔ 1 pièce du rang supérieur.
 * Manipulation : glisser une pièce sur sa ligne, ou boutons + / −, ou clavier (↑ ↓ pour choisir la
 * ligne, + / − pour ajouter / enlever, E échanger, C casser, Entrée valider).
 * Facile : nombre de pièces et total affichés. Normal : nombre de pièces seulement.
 * Plus loin : rien d'affiché, et le chantier commence avec trop de petites pièces (il faut échanger).
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Level, NumericItem } from '@/content/schemas';
import { formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { useGameSession } from '@/games/_kit/session';
import { Hud } from '@/games/_kit/ui';
import { vibrate } from '@/services/sfx';
import { bravo, dansUnChamp, direNombre, estNumerique, tirer, useRng } from '../_nombres-commun/outils';
import { Bandeau, Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { cible, enUnites, nomRang, phraseDecomposition, rangsDe, valeur, valeurPiece } from './materiel';
import { Piece } from './Pieces';

const MANCHES: Record<Level, number> = { facile: 5, normal: 8, plus_loin: 8 };
const MAX_PIECES = 19;

type Comptes = Record<number, number>;

export default function Batisseur({
  level,
  stream,
  target,
  lectureAuto,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
}: GameProps) {
  const rng = useRng();
  const { stats, answer, startQuestion, end } = useGameSession({ paused, onAnswer, onEnd });
  const N = MANCHES[level];
  const nouvelle = useCallback(
    () =>
      tirer(
        stream,
        target(),
        (x): x is NumericItem => estNumerique(x) && x.answer >= 0 && x.answer <= 999_999_999,
      ),
    [stream, target],
  );

  const [item, setItem] = useState<NumericItem | null>(() => nouvelle());
  const rangs = useMemo(() => (item ? rangsDe(item.answer) : [0]), [item]);
  const lo = rangs[rangs.length - 1]!;
  const depart = useCallback(
    (rs: number[]): Comptes => {
      const c: Comptes = Object.fromEntries(rs.map((r) => [r, 0]));
      if (level === 'plus_loin') c[rs[rs.length - 1]!] = rng.int(10, 13);
      return c;
    },
    [level, rng],
  );
  const [comptes, setComptes] = useState<Comptes>(() => depart(rangs));
  const [ligne, setLigne] = useState(0);
  const [manche, setManche] = useState(1);
  const [etat, setEtat] = useState<'jeu' | 'juste' | 'faux' | 'fin'>('jeu');
  const [echange, setEchange] = useState<{ de: number; vers: number } | null>(null);
  const [message, setMessage] = useState('');
  const zones = useRef<Record<number, HTMLDivElement | null>>({});
  const verrou = useRef(false);

  useEffect(() => {
    if (!item) return;
    startQuestion();
    if (lectureAuto && !paused) void speech.speak(item.spoken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const actif = etat === 'jeu' && !paused;

  const modifier = useCallback(
    (r: number, d: number) => {
      if (!actif) return;
      setComptes((c) => {
        const n = (c[r] ?? 0) + d;
        if (n < 0 || n > MAX_PIECES) return c;
        return { ...c, [r]: n };
      });
      sfx.play(d > 0 ? 'pop' : 'tic');
    },
    [actif, sfx],
  );

  /** 10 pièces du rang r → 1 pièce du rang r + 1. */
  const echanger = useCallback(
    (r: number) => {
      if (!actif || (comptes[r] ?? 0) < 10 || !rangs.includes(r + 1)) return;
      setEchange({ de: r, vers: r + 1 });
      sfx.play('monte');
      setComptes((c) => ({ ...c, [r]: (c[r] ?? 0) - 10, [r + 1]: (c[r + 1] ?? 0) + 1 }));
      setTimeout(() => setEchange(null), 700);
    },
    [actif, comptes, rangs, sfx],
  );

  /** 1 pièce du rang r → 10 pièces du rang r − 1. */
  const casser = useCallback(
    (r: number) => {
      if (
        !actif ||
        (comptes[r] ?? 0) < 1 ||
        !rangs.includes(r - 1) ||
        (comptes[r - 1] ?? 0) + 10 > MAX_PIECES
      )
        return;
      setEchange({ de: r, vers: r - 1 });
      sfx.play('glisse');
      setComptes((c) => ({ ...c, [r]: (c[r] ?? 0) - 1, [r - 1]: (c[r - 1] ?? 0) + 10 }));
      setTimeout(() => setEchange(null), 700);
    },
    [actif, comptes, rangs, sfx],
  );

  const valider = useCallback(() => {
    if (!item || !actif || verrou.current) return;
    verrou.current = true;
    const juste = enUnites(comptes, lo) === cible(item.answer, lo);
    answer(item, juste, formatNumber(valeur(comptes, lo)), formatNumber(item.answer));
    if (juste) {
      const desordre = rangs.some((r) => (comptes[r] ?? 0) >= 10);
      sfx.play('etoile');
      setMessage(
        desordre
          ? `${bravo(rng)} Astuce : 10 pièces pareilles s’échangent contre une plus grosse.`
          : `${bravo(rng)} Le nombre est bien construit !`,
      );
      setEtat('juste');
    } else {
      sfx.play('faux');
      vibrate(60);
      setEtat('faux');
    }
  }, [item, actif, comptes, lo, rangs, answer, sfx, rng]);

  const suivant = useCallback(() => {
    if (manche >= N) {
      setEtat('fin');
      const reussi = stats.correct >= Math.ceil(N * 0.6);
      sfx.play(reussi ? 'fanfare' : 'etoile');
      end({
        won: reussi,
        headline: reussi
          ? 'Chantier terminé, maître bâtisseur ! 🏗️'
          : `${stats.correct} nombres construits sur ${N} !`,
        delayMs: 1000,
      });
      return;
    }
    const it = nouvelle();
    setItem(it);
    setComptes(depart(it ? rangsDe(it.answer) : [0]));
    setLigne(0);
    setManche((m) => m + 1);
    setMessage('');
    verrou.current = false;
    setEtat('jeu');
  }, [manche, N, stats.correct, sfx, end, nouvelle, depart]);

  useEffect(() => {
    if (etat !== 'juste') return;
    const t = setTimeout(suivant, 1600);
    return () => clearTimeout(t);
  }, [etat, suivant]);

  // Clavier
  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      const r = rangs[ligne]!;
      const k = e.key;
      if (k === 'ArrowUp' || k === 'ArrowDown') {
        e.preventDefault();
        setLigne((l) => Math.max(0, Math.min(rangs.length - 1, l + (k === 'ArrowUp' ? -1 : 1))));
      } else if (k === '+' || k === 'ArrowRight') {
        e.preventDefault();
        modifier(r, 1);
      } else if (k === '-' || k === 'ArrowLeft') {
        e.preventDefault();
        modifier(r, -1);
      } else if (k.toLowerCase() === 'e') echanger(r);
      else if (k.toLowerCase() === 'c') casser(r);
      else if (k === 'Enter') {
        e.preventDefault();
        valider();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif, rangs, ligne, modifier, echanger, casser, valider]);

  /** Dépôt d'une pièce glissée : elle s'ajoute si on la lâche sur sa ligne. */
  const deposer = (r: number, x: number, y: number) => {
    const z = zones.current[r]?.getBoundingClientRect();
    if (z && x >= z.left - 20 && x <= z.right + 20 && y >= z.top - 20 && y <= z.bottom + 20) modifier(r, 1);
  };

  if (!item) {
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de nombres à construire."
        onFin={() => end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const total = valeur(comptes, lo);
  const consigne =
    item.meta?.construire === true
      ? item.prompt
      : `Construis : ${item.prompt.replace(/\s*=\s*(\?|…)\s*$/, '')}`;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          🧱 {Math.min(manche, N)} / {N}
        </Hud>
        <Hud>✅ {stats.correct}</Hud>
      </Bandeau>

      <div className="carte flex flex-col items-center gap-2 p-4">
        <div className="flex items-center justify-center gap-3">
          <SpeakButton text={item.spoken} label="Écouter le nombre" />
          <p className="text-center font-titre text-2xl font-extrabold sm:text-4xl" aria-live="polite">
            {consigne}
          </p>
        </div>
        {level === 'facile' && (
          <p className="font-bold text-ink-soft" aria-live="polite">
            Ta construction vaut : <span className="font-titre text-2xl text-ink">{formatNumber(total)}</span>
          </p>
        )}
      </div>

      <section
        className="rounded-card border-4 border-white p-2 shadow-soft sm:p-3"
        aria-label="Le chantier"
        style={{ background: 'repeating-linear-gradient(45deg,#FFF3D6 0 18px,#FFEBC2 18px 36px)' }}
      >
        <div className="flex flex-col gap-2">
          {rangs.map((r, i) => {
            const k = r - lo;
            const n = comptes[r] ?? 0;
            const choisie = i === ligne;
            return (
              <div
                key={r}
                className={`grid grid-cols-[auto_1fr] items-center gap-2 rounded-2xl bg-white/85 p-2 sm:grid-cols-[150px_1fr_auto] ${
                  choisie ? 'ring-4 ring-sky' : ''
                }`}
                onClick={() => setLigne(i)}
              >
                {/* réserve : pièce à glisser */}
                <div className="flex items-center gap-2">
                  <motion.div
                    drag={actif}
                    dragSnapToOrigin
                    dragMomentum={false}
                    whileDrag={{ scale: 1.15, zIndex: 50 }}
                    onDragEnd={(_, info) =>
                      deposer(r, info.point.x - window.scrollX, info.point.y - window.scrollY)
                    }
                    className="flex h-14 w-14 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl bg-cream active:cursor-grabbing"
                    title="Glisse-moi sur la ligne"
                    aria-hidden
                  >
                    <Piece
                      k={k}
                      etiquette={valeurPiece(r)}
                      taille={k === 1 ? 0.8 : k >= 2 && k <= 3 ? 0.85 : 1.1}
                    />
                  </motion.div>
                  <div className="min-w-0 leading-tight">
                    <p className="font-titre text-lg font-bold">{nomRang(r, 2)}</p>
                    <p className="text-sm text-ink-soft">1 pièce = {valeurPiece(r)}</p>
                  </div>
                </div>

                {/* pile de pièces */}
                <div
                  ref={(el) => {
                    zones.current[r] = el;
                  }}
                  className="col-span-2 flex min-h-[64px] flex-wrap items-end gap-1 rounded-xl border-2 border-dashed border-ink/15 p-1 sm:col-span-1"
                  aria-label={`${level === 'plus_loin' ? 'des' : n} ${nomRang(r, n)}`}
                >
                  <AnimatePresence initial={false}>
                    {Array.from({ length: n }, (_, j) => (
                      <motion.span
                        key={j}
                        initial={{ scale: 0, y: echange?.vers === r ? -30 : 10 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0, y: echange?.de === r ? -30 : 10, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                        className="inline-flex"
                      >
                        <Piece k={k} etiquette={valeurPiece(r)} taille={k >= 2 && k <= 3 ? 0.75 : 1} />
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>

                {/* commandes */}
                <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 sm:col-span-1">
                  <button
                    type="button"
                    className="btn-3d flex h-12 w-12 items-center justify-center bg-coral/20"
                    onClick={() => modifier(r, -1)}
                    disabled={!actif || n === 0}
                    aria-label={`Enlever 1 ${nomRang(r, 1)}`}
                  >
                    <Minus aria-hidden />
                  </button>
                  {level !== 'plus_loin' && (
                    <span className="w-8 text-center font-titre text-2xl font-extrabold" aria-hidden>
                      {n}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn-3d flex h-12 w-12 items-center justify-center bg-grass/30"
                    onClick={() => modifier(r, 1)}
                    disabled={!actif || n >= MAX_PIECES}
                    aria-label={`Ajouter 1 ${nomRang(r, 1)}`}
                  >
                    <Plus aria-hidden />
                  </button>
                  {n >= 10 && rangs.includes(r + 1) && (
                    <button
                      type="button"
                      className="btn-3d min-h-12 bg-sun px-3 text-sm"
                      onClick={() => echanger(r)}
                      disabled={!actif}
                    >
                      10 → 1 {nomRang(r + 1, 1)}
                    </button>
                  )}
                  {n >= 1 &&
                    rangs.includes(r - 1) &&
                    (comptes[r - 1] ?? 0) + 10 <= MAX_PIECES &&
                    level !== 'facile' && (
                      <button
                        type="button"
                        className="btn-3d min-h-12 bg-card px-3 text-sm"
                        onClick={() => casser(r)}
                        disabled={!actif}
                      >
                        Casser en 10
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="carte flex flex-col items-center gap-3 p-4">
        {etat === 'jeu' && (
          <>
            <p className="text-center text-sm font-bold text-ink-soft">
              Glisse une pièce sur sa ligne ou utilise + et −. Au clavier : ↑ ↓ choisir la ligne, + − ajouter
              ou enlever, E échanger, C casser, Entrée valider.
            </p>
            <Button variant="grass" size="lg" onClick={valider} disabled={paused}>
              🏗️ C’est construit !
            </Button>
          </>
        )}
        {etat === 'juste' && (
          <p className="text-center font-titre text-2xl font-extrabold text-grass-dark" role="status">
            {message}
          </p>
        )}
        <Correction
          ouvert={etat === 'faux'}
          bonne={formatNumber(item.answer)}
          aDire={`Il fallait construire ${direNombre(item.answer)}. ${phraseDecomposition(item.answer, rangs)} ${item.explication}`}
          explication={`${phraseDecomposition(item.answer, rangs)} ${item.explication}`}
          onContinuer={suivant}
        >
          <p className="mt-1">
            Ta construction valait <strong>{formatNumber(total)}</strong>.
          </p>
        </Correction>
      </div>
    </div>
  );
}
