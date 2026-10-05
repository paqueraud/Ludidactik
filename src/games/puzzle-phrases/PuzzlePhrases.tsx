/**
 * Le Puzzle de phrases (CATALOGUE n° 42) — la phrase, son ordre, sa ponctuation.
 * Les étiquettes-mots (item `ordering`, mode « phrase ») sont mélangées : on les touche dans l'ordre
 * pour construire la phrase, puis on choisit la ponctuation finale (. ? !). Mode « etapes » : on remet
 * les étapes d'une procédure dans l'ordre. Chaque phrase juste dévoile une pièce du tableau.
 * Facile : le premier mot est posé, 2 essais. Normal : 1 indice (pose le mot suivant), 2 essais.
 * Plus loin : chrono, 1 essai, sans indice.
 * Clavier : 1-9 (et 0) = étiquettes, Retour arrière = enlever, . ? ! = ponctuation, Entrée = vérifier.
 */
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { Check, Lightbulb, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import { type Puzzle, SIGNES, type Signe, assembler, premiereErreur, versPuzzle } from '../_langue-commun/phrases';
import { tirerItem } from '../_langue-commun/tirage';
import { PasDExercice, Touche, useTouches } from '../_langue-commun/ui';
import { useRng } from '../_nombres-commun/outils';
import { BarreTemps } from '../_nombres-commun/ui';
import { useCompteARebours, useVoixEnPause } from '../_orthographe-commun/hooks';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 9 };
const ESSAIS: Record<Level, number> = { facile: 2, normal: 2, plus_loin: 1 };
const COULEURS = ['#4FC3F7', '#FF7A6B', '#FFD45C', '#7BD389', '#8E7CFF', '#E0A458', '#3CC8B4', '#F78FB3'];
const NOMS_SIGNES: Record<Signe, string> = { '.': 'point', '?': 'point d’interrogation', '!': 'point d’exclamation' };

/** Le tableau à dévoiler : un paysage original, recouvert de pièces de puzzle. */
function Tableau({ pieces, total, reduite }: { pieces: number; total: number; reduite: boolean }) {
  const cols = total % 3 === 0 ? 3 : total % 4 === 0 ? 4 : 3;
  const rows = Math.ceil(total / cols);
  const w = 300 / cols;
  const h = 200 / rows;
  return (
    <svg viewBox="0 0 300 200" className="block h-auto w-full" aria-hidden>
      <defs>
        <linearGradient id="pz-ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FD3FF" />
          <stop offset="1" stopColor="#E6F7FF" />
        </linearGradient>
      </defs>
      <rect width="300" height="200" fill="url(#pz-ciel)" />
      <circle cx="245" cy="45" r="24" fill="#FFD45C" />
      <path d="M0 120 L60 70 L110 115 L170 55 L240 120 L300 90 V200 H0 Z" fill="#8E7CFF" opacity="0.55" />
      <path d="M150 62 L170 55 L180 66 Z" fill="#fff" />
      <path d="M0 140 Q80 110 160 135 T300 130 V200 H0 Z" fill="#7BD389" />
      <path d="M120 200 Q150 160 210 150 Q250 145 300 152 V170 Q250 165 215 172 Q170 182 160 200 Z" fill="#4FC3F7" />
      <rect x="46" y="118" width="44" height="34" fill="#FFF8EC" />
      <path d="M40 120 L68 96 L96 120 Z" fill="#FF7A6B" />
      <rect x="62" y="132" width="12" height="20" fill="#E0A458" />
      <circle cx="230" cy="128" r="16" fill="#3E9E5A" />
      <rect x="227" y="140" width="6" height="16" fill="#8A5A3B" />
      <ellipse cx="80" cy="40" rx="26" ry="9" fill="#fff" />
      {Array.from({ length: cols * rows }, (_, i) => {
        const x = (i % cols) * w;
        const y = Math.floor(i / cols) * h;
        const devoilee = i < pieces;
        return (
          <motion.g
            key={i}
            initial={false}
            animate={devoilee ? { opacity: 0, scale: reduite ? 1 : 0.6 } : { opacity: 1, scale: 1 }}
            transition={{ duration: reduite ? 0.15 : 0.6 }}
            style={{ transformOrigin: `${x + w / 2}px ${y + h / 2}px` }}
          >
            <rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx="8" fill={COULEURS[i % COULEURS.length]} />
            <circle cx={x + w / 2} cy={y + 3} r="7" fill={COULEURS[i % COULEURS.length]} />
            <text
              x={x + w / 2}
              y={y + h / 2 + 8}
              textAnchor="middle"
              fontSize="22"
              fontWeight="800"
              fill="#fff"
              fontFamily="Baloo 2, sans-serif"
            >
              ?
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}

export default function PuzzlePhrases({ level, stream, paused, onAnswer, onEnd, speech, sfx }: GameProps) {
  const total = parNiveau(level, MANCHES);
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduite = !!useReducedMotion();
  const rng = useRng();

  const tirer = useCallback((): Puzzle | null => {
    const it = tirerItem(stream, (x) => versPuzzle(x) !== null);
    return it ? versPuzzle(it) : null;
  }, [stream]);

  const [pz, setPz] = useState<Puzzle | null>(() => tirer());
  const [manche, setManche] = useState(1);
  /** Ordre d'affichage des étiquettes dans le plateau (indices dans `etiquettes`). */
  const [plateau, setPlateau] = useState<number[]>([]);
  /** Étiquettes posées dans la phrase, dans l'ordre. */
  const [pose, setPose] = useState<number[]>([]);
  const [signe, setSigne] = useState<Signe | null>(null);
  const [etat, setEtat] = useState<'jeu' | 'juste' | 'faux'>('jeu');
  const [essais, setEssais] = useState(0);
  const [erreurA, setErreurA] = useState<number | null>(null);
  const [indice, setIndice] = useState(level === 'normal' ? 1 : 0);
  const [pieces, setPieces] = useState(0);
  const [fini, setFini] = useState(false);

  // Nouvelle phrase : on mélange (jamais dans l'ordre exact), Facile pose le premier mot
  useEffect(() => {
    if (!pz) return;
    const n = pz.etiquettes.length;
    let ordre = rng.shuffle([...Array(n).keys()]);
    for (let k = 0; k < 5 && ordre.every((v, i) => v === i); k++) ordre = rng.shuffle(ordre);
    setPlateau(ordre);
    setPose(level === 'facile' ? [0] : []);
    setSigne(null);
    setEssais(0);
    setErreurA(null);
    setIndice(level === 'normal' ? 1 : 0);
    session.startQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pz]);

  const attendu = useMemo(() => (pz ? pz.etiquettes : []), [pz]);
  const fixe = level === 'facile' ? 1 : 0;
  const libres = plateau.filter((i) => !pose.includes(i));
  const complet = !!pz && pose.length === attendu.length && (!pz.ponctuation || !!signe);

  const poser = useCallback(
    (i: number) => {
      if (etat !== 'jeu' || paused || pose.includes(i)) return;
      sfx.play('pop');
      setErreurA(null);
      setPose((p) => [...p, i]);
    },
    [etat, paused, pose, sfx],
  );
  const enlever = useCallback(
    (position: number) => {
      if (etat !== 'jeu' || paused || position < fixe) return;
      sfx.play('glisse');
      setErreurA(null);
      setPose((p) => p.filter((_, k) => k !== position));
    },
    [etat, paused, fixe, sfx],
  );

  const verifier = useCallback(
    (tempsEcoule = false) => {
      if (!pz || etat !== 'jeu' || paused || fini) return;
      if (!complet && !tempsEcoule) return;
      const propose = pose.map((i) => attendu[i]!);
      const err = premiereErreur(propose, attendu);
      const ponctOk = !pz.ponctuation || signe === pz.ponctuation;
      const juste = err === -1 && ponctOk;
      const nouvelEssai = essais + 1;
      setEssais(nouvelEssai);
      if (!juste && !tempsEcoule && nouvelEssai < ESSAIS[level]) {
        // Encore un essai : on montre où ça coince, sans rien enlever
        sfx.play('faux');
        vibrate(40);
        setErreurA(err === -1 ? attendu.length : err);
        return;
      }
      session.answer(
        pz.item,
        juste,
        assembler(propose, signe),
        assembler(attendu, pz.ponctuation),
      );
      if (juste) {
        sfx.play('juste');
        setPieces((p) => p + 1);
        setEtat('juste');
      } else {
        sfx.play('faux');
        vibrate(60);
        setEtat('faux');
      }
    },
    [pz, etat, paused, fini, complet, pose, attendu, signe, essais, level, session, sfx],
  );

  const donnerIndice = useCallback(() => {
    if (!pz || indice <= 0 || etat !== 'jeu') return;
    // garde le début juste, enlève le reste, pose le mot suivant
    const propose = pose.map((i) => attendu[i]!);
    const err = premiereErreur(propose, attendu);
    const bons = err === -1 ? pose.length : err;
    if (bons >= attendu.length) return;
    setPose([...pose.slice(0, bons), bons]);
    setIndice((x) => x - 1);
    sfx.play('etoile');
  }, [pz, indice, etat, pose, attendu, sfx]);

  const restant = useCompteARebours({
    actif: level === 'plus_loin' && etat === 'jeu' && !!pz,
    dureeMs: pz ? 12_000 + 3_000 * pz.etiquettes.length : 30_000,
    paused,
    cle: manche,
    onFin: () => verifier(true),
  });

  const suivant = useCallback(() => {
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      session.end({
        won: pieces >= Math.ceil(total * 0.6),
        headline:
          pieces >= total ? 'Tableau complet ! Bravo ! 🧩' : `${pieces} pièce${pieces > 1 ? 's' : ''} du tableau dévoilée${pieces > 1 ? 's' : ''} !`,
        delayMs: 900,
      });
      return;
    }
    setPz(tirer());
    setManche((m) => m + 1);
    setEtat('jeu');
  }, [manche, total, pieces, session, sfx, tirer]);

  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, 1600);
    return () => clearTimeout(t);
  }, [etat, paused, suivant]);

  useTouches(etat === 'jeu' && !paused && !fini && !!pz, (e) => {
    if (/^[0-9]$/.test(e.key)) {
      const k = e.key === '0' ? 9 : Number(e.key) - 1;
      const i = libres[k];
      if (i !== undefined) poser(i);
      return true;
    }
    if (e.key === 'Backspace') {
      enlever(pose.length - 1);
      return true;
    }
    if (pz?.ponctuation && (e.key === '.' || e.key === '?' || e.key === '!')) {
      setSigne(e.key);
      return true;
    }
    if (e.key === 'Enter') {
      verifier();
      return true;
    }
    return false;
  });

  if (!pz) {
    return (
      <PasDExercice
        texte="Cette leçon n’a pas de phrases à remettre dans l’ordre."
        onFin={() => session.end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const etapes = pz.mode === 'etapes';
  const solution = etapes ? attendu.join(' → ') : assembler(attendu, pz.ponctuation);
  const lu = etapes ? attendu.join('. ') : assembler(attendu, pz.ponctuation);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row">
      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[38%] lg:self-start"
        aria-label={`Tableau : ${pieces} pièce${pieces > 1 ? 's' : ''} dévoilée${pieces > 1 ? 's' : ''} sur ${total}`}
      >
        <Tableau pieces={pieces} total={total} reduite={reduite} />
        <div className="absolute left-2 top-2">
          <Hud>
            🧩 {Math.min(manche, total)} / {total}
          </Hud>
        </div>
      </section>

      <section className="carte flex min-w-0 flex-1 flex-col items-center gap-4 p-4 sm:p-6">
        <div className="flex items-start justify-center gap-3">
          <SpeakButton text={pz.item.prompt} label="Écouter la consigne" />
          <p className="text-center font-titre text-xl font-extrabold sm:text-2xl">{pz.item.prompt}</p>
        </div>
        {level === 'plus_loin' && etat === 'jeu' && <BarreTemps reste={restant} label="Temps" />}

        <LayoutGroup>
          {/* La phrase en construction */}
          <div
            className={`flex min-h-[4.5rem] w-full flex-wrap items-center gap-2 rounded-2xl border-4 border-dashed p-3 ${
              etat === 'juste'
                ? 'border-grass bg-grass/10'
                : etat === 'faux'
                  ? 'border-coral bg-coral/5'
                  : 'border-sky/60 bg-cream'
            } ${etapes ? 'flex-col items-stretch' : ''}`}
            role="group"
            aria-label={etapes ? 'Les étapes dans l’ordre' : 'Ta phrase'}
          >
            {pose.length === 0 && (
              <span className="px-2 text-ink-soft">
                {etapes ? 'Touche les étapes dans l’ordre…' : 'Touche les mots dans l’ordre…'}
              </span>
            )}
            {pose.map((i, k) => {
              const faux = erreurA !== null && k >= erreurA;
              return (
                <motion.button
                  layout={!reduite}
                  layoutId={reduite ? undefined : `et-${manche}-${i}`}
                  key={i}
                  type="button"
                  onClick={() => enlever(k)}
                  disabled={etat !== 'jeu' || k < fixe}
                  className={`min-h-[48px] rounded-xl px-3 py-2 font-titre text-xl font-bold shadow-pop-sm ${
                    faux ? 'bg-sun ring-4 ring-coral' : k < fixe ? 'bg-sky/30' : 'bg-card'
                  } ${etapes ? 'text-left text-lg' : ''}`}
                  aria-label={`${attendu[i]}${k < fixe ? ' (déjà posé)' : ', touche pour l’enlever'}`}
                >
                  {etapes && <span className="mr-2 text-ink-soft">{k + 1}.</span>}
                  {attendu[i]}
                </motion.button>
              );
            })}
            {pz.ponctuation && (
              <span
                className={`ml-auto flex h-12 min-w-12 items-center justify-center rounded-xl border-2 px-2 font-titre text-3xl font-extrabold ${
                  signe ? 'border-grape bg-grape/15' : 'border-dashed border-ink/30 text-ink/30'
                }`}
                aria-label={signe ? `Ponctuation : ${NOMS_SIGNES[signe]}` : 'Ponctuation à choisir'}
              >
                {signe ?? '…'}
              </span>
            )}
          </div>

          {erreurA !== null && etat === 'jeu' && (
            <p className="text-center font-bold text-coral-dark" role="status">
              Presque&nbsp;! {erreurA >= attendu.length ? 'Vérifie la ponctuation.' : 'Regarde à partir de l’étiquette en jaune.'}{' '}
              On réessaie ?
            </p>
          )}

          {/* Le plateau d'étiquettes */}
          {etat === 'jeu' && (
            <div
              className={`flex w-full flex-wrap justify-center gap-2 ${etapes ? 'flex-col items-stretch' : ''}`}
              role="group"
              aria-label="Étiquettes à placer"
            >
              {libres.map((i, k) => (
                <motion.button
                  layout={!reduite}
                  layoutId={reduite ? undefined : `et-${manche}-${i}`}
                  key={i}
                  type="button"
                  onClick={() => poser(i)}
                  disabled={paused}
                  className={`btn-3d relative flex min-h-[52px] items-center gap-2 px-4 py-2 font-titre text-xl font-bold text-ink ${etapes ? 'text-left text-lg' : ''}`}
                  style={{ background: `${COULEURS[i % COULEURS.length]}55` }}
                  aria-label={`${attendu[i]} (touche ${k === 9 ? 0 : k + 1})`}
                >
                  {k < 10 && <Touche className="absolute -left-1.5 -top-1.5">{k === 9 ? 0 : k + 1}</Touche>}
                  {attendu[i]}
                </motion.button>
              ))}
            </div>
          )}
        </LayoutGroup>

        {etat === 'jeu' && (
          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            {pz.ponctuation &&
              SIGNES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSigne(s)}
                  disabled={paused}
                  className={`btn-3d h-14 w-14 font-titre text-3xl font-extrabold ${signe === s ? 'bg-grape text-white' : 'bg-card'}`}
                  aria-label={NOMS_SIGNES[s]}
                  aria-pressed={signe === s}
                >
                  {s}
                </button>
              ))}
            <Button variant="blanc" icon={<Undo2 aria-hidden />} onClick={() => enlever(pose.length - 1)} disabled={pose.length <= fixe || paused} aria-label="Enlever le dernier mot">
              <span className="hidden sm:inline">Enlever</span>
            </Button>
            {indice > 0 && (
              <Button variant="sun" icon={<Lightbulb aria-hidden />} onClick={donnerIndice} disabled={paused}>
                Indice
              </Button>
            )}
            <Button variant="grass" icon={<Check aria-hidden />} onClick={() => verifier()} disabled={!complet || paused}>
              Vérifier
            </Button>
          </div>
        )}

        <AnimatePresence>
          {etat !== 'jeu' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full flex-col items-center gap-2">
              {etat === 'juste' && (
                <div className="flex items-center gap-2">
                  <SpeakButton text={lu} label="Écouter la phrase" size={40} />
                  <span className="text-lg font-bold">{solution}</span>
                </div>
              )}
              <Feedback
                state={etat}
                expected={solution}
                explication={pz.item.explication}
                onContinue={suivant}
                message={etat === 'juste' ? 'Une pièce de plus ! 🧩' : 'Presque !'}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
