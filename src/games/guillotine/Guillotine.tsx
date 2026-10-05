/**
 * ⭐ La Guillotine — quiz d'histoire (CATALOGUE n°49).
 * Décor « papier découpé », non réaliste. Bonne réponse : la lame tient (et remonte après une série).
 * Erreur : elle descend d'un cran. Au dernier cran : écran comique « Vous avez perdu la tête !! »,
 * un bonnet phrygien qui s'envole — aucune tête, aucun corps, aucun sang. L'avatar reste à côté de
 * la guillotine, jamais dessous. Les thèmes sensibles sont exclus par le filtre du module.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '@/avatar/Avatar';
import { Keypad, usePhysicalKeyboard } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import { itemKey } from '@/content/provider';
import type { Level, McqItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';

const CRANS = 5;
const OBJECTIF: Record<Level, number> = { facile: 6, normal: 10, plus_loin: 12 };
/** Facile : 3 cocardes protègent des 3 premières erreurs. */
const COCARDES: Record<Level, number> = { facile: 3, normal: 0, plus_loin: 0 };
const LETTRES = ['A', 'B', 'C', 'D'];
const COULEURS = ['bg-sky', 'bg-coral', 'bg-sun', 'bg-grass'];

type Etat =
  | { type: 'question' }
  | { type: 'juste'; choix: number | null; remonte: boolean }
  | { type: 'faux'; choix: number | null; saisie?: string; protege: boolean }
  | { type: 'perdu' }
  | { type: 'gagne' };

function Cocarde({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="9.5" fill="#1E4FB8" />
      <circle cx="10" cy="10" r="6.5" fill="#fff" />
      <circle cx="10" cy="10" r="3.5" fill="#D7372F" />
    </svg>
  );
}

function BonnetPhrygien({ size = 120 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 90" width={size} height={size * 0.75} aria-hidden>
      <path d="M8 80 C0 30 70 0 104 26 C120 38 118 58 98 52 C100 64 100 72 100 80 Z" fill="#D7372F" />
      <rect x="6" y="74" width="96" height="12" rx="6" fill="#B02A23" />
      <circle cx="24" cy="70" r="11" fill="#1E4FB8" />
      <circle cx="24" cy="70" r="7" fill="#fff" />
      <circle cx="24" cy="70" r="3.5" fill="#D7372F" />
    </svg>
  );
}

export default function Guillotine({
  level,
  profile,
  stream,
  lectureAuto,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
}: GameProps) {
  const objectif = Math.min(OBJECTIF[level], Math.max(4, stream.size ?? OBJECTIF[level]));
  const [item, setItem] = useState(() => stream.next() as McqItem);
  const [cran, setCran] = useState(0);
  const [cocardes, setCocardes] = useState(COCARDES[level]);
  const [justes, setJustes] = useState(0);
  const [serie, setSerie] = useState(0);
  const [etat, setEtat] = useState<Etat>({ type: 'question' });
  const [saisie, setSaisie] = useState('');
  const total = useRef(0);
  const start = useRef(performance.now());
  const pausedMs = useRef(0);
  const qStart = useRef(performance.now());

  const saisieDate = level === 'plus_loin' && !!item.typedAnswer;

  useEffect(() => {
    if (!paused) return;
    const t0 = performance.now();
    return () => {
      pausedMs.current += performance.now() - t0;
    };
  }, [paused]);

  const texteALire = useMemo(
    () =>
      saisieDate
        ? item.question
        : `${item.question} ${item.choices.map((c, i) => `Réponse ${LETTRES[i]} : ${c}.`).join(' ')}`,
    [item, saisieDate],
  );

  useEffect(() => {
    qStart.current = performance.now();
    if (lectureAuto && !paused) void speech.speak(texteALire);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const fin = useCallback(
    (won: boolean) => {
      const durationMs = Math.round(performance.now() - start.current - pausedMs.current);
      onEnd({
        correct: justes,
        total: total.current,
        durationMs,
        score: won ? 1000 - cran * 100 + justes * 10 : justes * 10,
        won,
        headline: won ? 'La Nation vous acquitte !' : 'Vous avez perdu la tête !!',
      });
    },
    [onEnd, justes, cran],
  );

  const repondre = useCallback(
    (choix: number | null, texte?: string) => {
      if (etat.type !== 'question' || paused) return;
      const correct = choix !== null ? choix === item.answerIndex : (texte ?? '').trim() === item.typedAnswer;
      const expected = item.choices[item.answerIndex]!;
      total.current++;
      onAnswer({
        itemId: item.id,
        itemKey: itemKey(item),
        correct,
        ms: performance.now() - qStart.current,
        given: choix !== null ? item.choices[choix]! : (texte ?? ''),
        expected,
      });
      if (correct) {
        const s = serie + 1;
        const remonte = s >= 3 && cran > 0;
        setSerie(remonte ? 0 : s);
        if (remonte) setCran((c) => c - 1);
        setJustes((j) => j + 1);
        sfx.play('juste');
        setEtat({ type: 'juste', choix, remonte });
      } else {
        setSerie(0);
        const protege = cocardes > 0;
        if (protege) setCocardes((c) => c - 1);
        else setCran((c) => c + 1);
        sfx.play(protege ? 'faux' : 'lame');
        vibrate(80);
        setEtat({ type: 'faux', choix, saisie: texte, protege });
        void speech.speak(`La bonne réponse était : ${expected}. ${item.explication}`);
      }
    },
    [etat, paused, item, serie, cran, cocardes, onAnswer, sfx, speech],
  );

  const suivant = useCallback(() => {
    if (cran >= CRANS) {
      setEtat({ type: 'perdu' });
      speech.stop();
      setTimeout(() => fin(false), 3200);
      return;
    }
    if (justes >= objectif) {
      setEtat({ type: 'gagne' });
      sfx.play('fanfare');
      setTimeout(() => fin(true), 2200);
      return;
    }
    setItem(stream.next() as McqItem);
    setSaisie('');
    setEtat({ type: 'question' });
  }, [cran, justes, objectif, stream, fin, sfx, speech]);

  // Après une bonne réponse, on enchaîne tout seul
  useEffect(() => {
    if (etat.type !== 'juste') return;
    const t = setTimeout(suivant, etat.remonte ? 1300 : 900);
    return () => clearTimeout(t);
  }, [etat, suivant]);

  const keyHandlers = {
    onKey: (k: string) =>
      etat.type === 'question' && setSaisie((v) => (v.length < 4 && /\d/.test(k) ? v + k : v)),
    onDelete: () => setSaisie((v) => v.slice(0, -1)),
    onSubmit: () =>
      etat.type === 'faux'
        ? suivant()
        : saisieDate && saisie.length === 4
          ? repondre(null, saisie)
          : undefined,
    disabled: paused,
  };
  usePhysicalKeyboard(keyHandlers, /[0-9]/);

  // Raccourcis clavier A/B/C/D ou 1/2/3/4 pour les choix
  useEffect(() => {
    if (saisieDate || etat.type !== 'question' || paused) return;
    const h = (e: KeyboardEvent) => {
      const i = ['a', 'b', 'c', 'd'].indexOf(e.key.toLowerCase());
      const j = ['1', '2', '3', '4'].indexOf(e.key);
      const k = i >= 0 ? i : j;
      if (k >= 0 && k < item.choices.length) repondre(k);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [saisieDate, etat, paused, item, repondre]);

  const bladeY = 74 + (cran / CRANS) * 120;
  const humeur = etat.type === 'gagne' ? 'joie' : cran >= 3 ? 'inquiet' : 'normal';

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row">
      {/* Décor */}
      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[44%] lg:self-start"
        aria-label={`Lame : cran ${cran} sur ${CRANS}`}
      >
        <div className="relative">
          <motion.svg
            viewBox="0 0 400 320"
            className="block w-full"
            aria-hidden
            animate={etat.type === 'faux' && !etat.protege ? { x: [0, -8, 8, -4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <defs>
              <linearGradient id="soir" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3B3F86" />
                <stop offset="1" stopColor="#B28DE0" />
              </linearGradient>
              <linearGradient id="acier" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#F2F5FA" />
                <stop offset="1" stopColor="#9AA6B8" />
              </linearGradient>
            </defs>
            <rect width="400" height="320" fill="url(#soir)" />
            {/* toits de Paris en papier découpé */}
            <path
              d="M0 200 L0 150 L30 150 L30 130 L60 130 L60 160 L90 160 L90 120 L105 105 L120 120 L120 165 L160 165 L160 140 L200 140 L200 170 L240 170 L240 125 L270 125 L270 150 L310 150 L310 110 L325 95 L340 110 L340 160 L370 160 L370 135 L400 135 L400 200 Z"
              fill="#2A2A5E"
              opacity="0.8"
            />
            {/* guirlande tricolore */}
            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={i}
                d={`M${i * 34} 8 L${i * 34 + 34} 8 L${i * 34 + 17} 30 Z`}
                fill={['#1E4FB8', '#FFFFFF', '#D7372F'][i % 3]}
              />
            ))}
            {/* estrade */}
            <rect x="40" y="262" width="320" height="26" rx="4" fill="#8D5A3B" />
            <rect x="40" y="262" width="320" height="6" fill="#A97452" />
            {/* montants et traverse */}
            <rect x="96" y="54" width="16" height="210" rx="3" fill="#7A4B2E" />
            <rect x="176" y="54" width="16" height="210" rx="3" fill="#7A4B2E" />
            <rect x="86" y="42" width="116" height="16" rx="4" fill="#5E3820" />
            {/* crans */}
            {Array.from({ length: CRANS }, (_, i) => (
              <rect
                key={i}
                x="194"
                y={88 + i * 24}
                width="12"
                height="5"
                rx="2"
                fill={i < cran ? '#FF7A6B' : '#FFE9A8'}
              />
            ))}
            {/* lame */}
            <motion.g
              animate={{ y: bladeY - 74 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            >
              <line x1="144" y1="-20" x2="144" y2="74" stroke="#D8C8A8" strokeWidth="2.5" />
              <path
                d="M112 74 L176 74 L176 98 L112 118 Z"
                fill="url(#acier)"
                stroke="#5E6B84"
                strokeWidth="2"
              />
            </motion.g>
            {/* foule en papier découpé */}
            {Array.from({ length: 9 }, (_, i) => (
              <g key={i} transform={`translate(${12 + i * 44} ${292 - (i % 2) * 6})`}>
                <circle cx="14" cy="0" r="10" fill="#1F1F45" />
                <rect x="2" y="8" width="24" height="30" rx="10" fill="#1F1F45" />
                {i % 3 === 1 && (
                  <path
                    d="M24 -18 L24 6 M24 -18 L40 -13 L24 -8"
                    stroke="#1F1F45"
                    strokeWidth="2"
                    fill="#FFFFFF"
                  />
                )}
              </g>
            ))}
          </motion.svg>
          {/* L'avatar, à côté de la guillotine (jamais dessous) */}
          <div className="absolute bottom-[12%] right-[6%]">
            <motion.div
              animate={humeur === 'inquiet' ? { rotate: [-2, 2, -2] } : { rotate: 0 }}
              transition={{ duration: 0.6, repeat: humeur === 'inquiet' ? Infinity : 0 }}
            >
              <Avatar
                config={{ ...profile.avatar, accessoire: 'bonnet_phrygien' }}
                size={110}
                compagnon={false}
                humeur={humeur}
              />
            </motion.div>
          </div>
          <div className="absolute left-2 top-10 flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 font-titre font-bold">
            ⚖️ {justes} / {objectif}
            {cocardes > 0 && (
              <span className="flex gap-0.5" aria-label={`${cocardes} cocardes de protection`}>
                {Array.from({ length: cocardes }, (_, i) => (
                  <Cocarde key={i} size={20} />
                ))}
              </span>
            )}
          </div>
          <AnimatePresence>
            {etat.type === 'juste' && etat.remonte && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 top-1/3 text-center"
              >
                <span className="rounded-full bg-sun px-4 py-2 font-titre text-xl font-extrabold shadow-pop">
                  La lame remonte ! ⬆️
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Question */}
      <section className="carte flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <SpeakButton text={texteALire} label="Écouter la question" />
          <h2 className="text-2xl leading-snug sm:text-3xl" aria-live="polite">
            {item.question}
          </h2>
        </div>

        {saisieDate ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-ink-soft">Écris l’année.</p>
            <div
              className={`flex h-16 w-40 items-center justify-center rounded-2xl border-4 font-titre text-4xl font-extrabold ${
                etat.type === 'faux'
                  ? 'border-coral bg-coral/10'
                  : etat.type === 'juste'
                    ? 'border-grass bg-grass/15'
                    : 'border-sky bg-cream'
              }`}
            >
              {saisie || <span className="text-ink/25">····</span>}
            </div>
            {etat.type === 'question' && <Keypad {...keyHandlers} />}
          </div>
        ) : (
          <div className={`grid gap-3 ${item.choices.length > 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2'}`}>
            {item.choices.map((c, i) => {
              const answered = etat.type === 'juste' || etat.type === 'faux';
              const isGood = i === item.answerIndex;
              const isChosen = answered && 'choix' in etat && etat.choix === i;
              const state = !answered
                ? ''
                : isGood
                  ? 'ring-4 ring-grass bg-grass/20'
                  : isChosen
                    ? 'ring-4 ring-coral bg-coral/15 opacity-90'
                    : 'opacity-50';
              return (
                <button
                  key={c}
                  type="button"
                  className={`btn-3d flex min-h-[4.5rem] items-center gap-3 bg-card p-3 text-left text-lg font-bold sm:text-xl ${state}`}
                  onClick={() => repondre(i)}
                  disabled={answered || paused}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-titre text-xl text-white ${COULEURS[i]}`}
                    aria-hidden
                  >
                    {LETTRES[i]}
                  </span>
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {etat.type === 'juste' && (
            <motion.p
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center font-titre text-2xl font-extrabold text-grass-dark"
              role="status"
            >
              Bravo ! La lame tient bon.
            </motion.p>
          )}
          {etat.type === 'faux' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-coral/10 p-4"
              role="status"
            >
              <p className="text-lg font-bold">
                {etat.protege ? 'Ouf ! Une cocarde t’a protégé.' : 'Presque ! La lame descend d’un cran.'} La
                bonne réponse : <span className="text-grass-dark">{item.choices[item.answerIndex]}</span>
              </p>
              <div className="mt-2 flex items-start gap-2">
                <SpeakButton text={item.explication} size={40} />
                <p>{item.explication}</p>
              </div>
              <Button variant="grass" className="mt-3 w-full" onClick={suivant} autoFocus>
                Continuer
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Fin de partie : écran comique, sans aucune violence montrée */}
      <AnimatePresence>
        {etat.type === 'perdu' && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-[#14142B] p-6 text-center text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            role="alert"
          >
            <motion.div
              initial={{ y: 40, rotate: 0 }}
              animate={{ y: -60, rotate: 380 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
            >
              <BonnetPhrygien size={150} />
            </motion.div>
            <motion.h2
              initial={{ scale: 0.4 }}
              animate={{ scale: [0.4, 1.15, 1] }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="font-titre text-5xl font-extrabold text-sun sm:text-7xl"
            >
              Vous avez perdu la tête !!
            </motion.h2>
            <p className="text-xl">
              Pas de panique : ce n’est qu’un jeu ! Rejoue pour la garder bien sur tes épaules.
            </p>
          </motion.div>
        )}
        {etat.type === 'gagne' && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-ink/70 p-6 text-center text-white backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="alert"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring' }}
            >
              <Cocarde size={140} />
            </motion.div>
            <h2 className="font-titre text-5xl font-extrabold text-sun sm:text-6xl">
              La Nation vous acquitte !
            </h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
