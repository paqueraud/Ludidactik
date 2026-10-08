/**
 * Qui suis-je ? (CATALOGUE n° 52).
 * Un personnage mystère (ou un animal, un monument…) se dévoile indice après indice, du plus difficile
 * au plus facile. Moins on utilise d'indices, plus on gagne de points ; on peut répondre à tout moment.
 * Après la réponse, le mystère se révèle (image) avec l'explication.
 * Facile : 2 indices d'emblée, 3 propositions, un 2e essai (la mauvaise est barrée, un indice s'ajoute).
 * Normal : on demande les indices soi-même, toutes les propositions. Plus loin : les indices tombent
 * tout seuls toutes les 7 secondes (les points baissent), bonus ×1,5.
 * Repli : un QCM sans indices se joue comme une devinette à un seul indice (la question).
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Level, McqItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { itemSuivant, parNiveau, useGameSession } from '../_kit/session';
import { ChoiceGrid, Feedback, Hud } from '../_kit/ui';
import { useRng } from '../_monde-commun/hooks';
import { insecable, reduireChoix } from '../_monde-commun/outils';
import { EtatVide } from '../_monde-commun/ui';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { estDevinette } from './filtre';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
const NB_CHOIX: Record<Level, number> = { facile: 3, normal: 6, plus_loin: 6 };
const ESSAIS: Record<Level, number> = { facile: 2, normal: 1, plus_loin: 1 };
const INDICES_DEPART: Record<Level, number> = { facile: 2, normal: 1, plus_loin: 1 };
/** Plus loin : un nouvel indice tombe tout seul (ms). */
const AUTO_MS: Record<Level, number> = { facile: Infinity, normal: Infinity, plus_loin: 7000 };
const BONUS: Record<Level, number> = { facile: 1, normal: 1, plus_loin: 1.5 };

interface Mystere {
  item: McqItem;
  indices: string[];
  choices: string[];
  answerIndex: number;
}

function Silhouette({ revele, image, reduce }: { revele: boolean; image?: string; reduce: boolean }) {
  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="qsj-halo" cx="0.5" cy="0.45" r="0.6">
            <stop offset="0" stopColor="#FFF3C4" />
            <stop offset="1" stopColor="#FFD45C" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="92" fill="url(#qsj-halo)" stroke="#FFFFFF" strokeWidth="8" />
        {/* rideau de théâtre */}
        <path d="M16 60 Q30 40 60 30 Q50 90 40 170 Q26 150 16 120 Z" fill="#FF7A6B" opacity="0.85" />
        <path d="M184 60 Q170 40 140 30 Q150 90 160 170 Q174 150 184 120 Z" fill="#FF7A6B" opacity="0.85" />
      </svg>
      <AnimatePresence mode="wait">
        {revele && image ? (
          <motion.span
            key="img"
            initial={reduce ? false : { scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className="relative text-7xl sm:text-8xl"
            aria-hidden
          >
            {image}
          </motion.span>
        ) : (
          <motion.svg
            key="ombre"
            viewBox="0 0 100 100"
            className="relative h-24 w-24 sm:h-28 sm:w-28"
            initial={false}
            animate={revele ? { opacity: 0.3 } : { opacity: 1 }}
            aria-hidden
          >
            <circle cx="50" cy="34" r="18" fill="#3A3F66" />
            <path d="M18 96 Q18 58 50 58 Q82 58 82 96 Z" fill="#3A3F66" />
            <text
              x="50"
              y="44"
              textAnchor="middle"
              fontSize="28"
              fontWeight="800"
              fill="#FFD45C"
              fontFamily="'Baloo 2', system-ui"
            >
              ?
            </text>
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function QuiSuisJe({
  lesson,
  level,
  stream,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
  lectureAuto,
}: GameProps) {
  const total = parNiveau(level, MANCHES);
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduce = !!useReducedMotion();
  const rng = useRng();
  const dernier = useRef<string | null>(null);

  const tirer = useCallback((): Mystere | null => {
    // On préfère les vraies devinettes (avec indices) ; sinon, repli sur un QCM simple.
    let repli: McqItem | null = null;
    const essais = Math.max(12, Math.min(60, (stream.size ?? 20) * 2));
    for (let i = 0; i < essais; i++) {
      const it = itemSuivant(stream);
      if (!it) break;
      if (!estDevinette(it) || it.kind !== 'mcq') continue;
      // EMC, français : une situation de vie ou une question de grammaire n'est pas une devinette —
      // seulement les vraies devinettes à indices
      if ((lesson.matiere === 'emc' || lesson.matiere === 'francais') && !it.hints?.length) continue;
      if (it.id === dernier.current && (stream.size ?? 2) > 1) continue;
      if (it.hints?.length) {
        repli = it;
        break;
      }
      repli ??= it;
    }
    if (!repli) return null;
    dernier.current = repli.id;
    const r = reduireChoix(repli, Math.min(NB_CHOIX[level], repli.choices.length), rng);
    return {
      item: repli,
      indices: repli.hints?.length ? repli.hints.slice(0, 5) : [repli.question],
      ...r,
    };
  }, [stream, level, rng, lesson.matiere]);

  const [m, setM] = useState<Mystere | null>(tirer);
  const [manche, setManche] = useState(1);
  const [vus, setVus] = useState(() => Math.min(INDICES_DEPART[level], m?.indices.length ?? 1));
  const [essais, setEssais] = useState(ESSAIS[level]);
  const [barres, setBarres] = useState<number[]>([]);
  const [etat, setEtat] = useState<'juste' | 'faux' | null>(null);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [justes, setJustes] = useState(0);
  const [points, setPoints] = useState(0);
  const [gain, setGain] = useState(0);
  const [fini, setFini] = useState(false);

  const nbIndices = m?.indices.length ?? 1;
  const avecIndices = !!m?.item.hints?.length;
  /** Points en jeu : 5 au premier indice, puis de moins en moins à chaque indice dévoilé. */
  const enJeu = Math.max(1, Math.round((5 * (nbIndices - vus + 1)) / nbIndices));

  const titre = avecIndices ? m!.item.question : 'Devinette';
  const texteIndices = m
    ? m.indices
        .slice(0, vus)
        .map((t, i) => `Indice ${i + 1} : ${t}`)
        .join(' ')
    : '';
  const texteChoix = m ? m.choices.map((c, i) => `${'ABCDEF'[i]} : ${c}.`).join(' ') : '';

  useEffect(() => {
    session.startQuestion();
    if (lectureAuto && m) void speech.speak(`${titre}. ${texteIndices}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m]);

  const indiceSuivant = useCallback(() => {
    if (etat || paused || fini) return;
    setVus((v) => {
      if (v >= nbIndices) return v;
      sfx.play('pop');
      const t = m?.indices[v];
      if (lectureAuto && t) void speech.speak(t);
      return v + 1;
    });
  }, [etat, paused, fini, nbIndices, sfx, m, lectureAuto, speech]);

  // Plus loin : les indices tombent tout seuls
  useEffect(() => {
    if (!Number.isFinite(AUTO_MS[level]) || etat || paused || fini || vus >= nbIndices) return;
    const t = setTimeout(indiceSuivant, AUTO_MS[level]);
    return () => clearTimeout(t);
  }, [level, etat, paused, fini, vus, nbIndices, indiceSuivant]);

  const repondre = useCallback(
    (i: number) => {
      if (!m || etat || paused || fini || barres.includes(i)) return;
      const ok = i === m.answerIndex;
      if (ok) {
        const g = Math.round(enJeu * 10 * BONUS[level]) - (essais < ESSAIS[level] ? 10 : 0);
        session.answer(m.item, true, m.choices[i]!, m.choices[m.answerIndex]!);
        sfx.play('juste');
        setGain(Math.max(5, g));
        setPoints((p) => p + Math.max(5, g));
        setJustes((j) => j + 1);
        setChoisi(i);
        setVus(nbIndices);
        setEtat('juste');
        return;
      }
      if (essais > 1) {
        sfx.play('glisse');
        setEssais((e) => e - 1);
        setBarres((b) => [...b, i]);
        setVus((v) => Math.min(nbIndices, v + 1));
        return;
      }
      session.answer(m.item, false, m.choices[i]!, m.choices[m.answerIndex]!);
      sfx.play('faux');
      vibrate(40);
      setChoisi(i);
      setVus(nbIndices);
      setEtat('faux');
    },
    [m, etat, paused, fini, barres, enJeu, level, essais, nbIndices, session, sfx],
  );

  const suivant = useCallback(() => {
    if (fini) return;
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      session.end({
        won: justes >= Math.ceil(total / 2),
        headline: `${justes} mystère${justes > 1 ? 's' : ''} résolu${justes > 1 ? 's' : ''} sur ${total} !`,
        score: points,
      });
      return;
    }
    const n = tirer();
    setM(n);
    setManche((x) => x + 1);
    setVus(Math.min(INDICES_DEPART[level], n?.indices.length ?? 1));
    setEssais(ESSAIS[level]);
    setBarres([]);
    setEtat(null);
    setChoisi(null);
  }, [fini, manche, total, justes, points, session, sfx, tirer, level]);

  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, 2600);
    return () => clearTimeout(t);
  }, [etat, paused, suivant]);

  // Touche I : indice suivant
  useEffect(() => {
    if (etat || paused || fini) return;
    const h = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        indiceSuivant();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [etat, paused, fini, indiceSuivant]);

  const choixAffiches = useMemo(
    () => (m ? m.choices.map((c, i) => (barres.includes(i) ? `✗ ${c}` : c)) : []),
    [m, barres],
  );

  if (!m) {
    return <EtatVide icone="🕵️" jeu="Qui suis-je ?" besoin="de devinettes ou de questions à choix" />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <Hud>
          Mystère {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🔍</span> {points} pts
        </Hud>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        {/* Le mystère et ses indices */}
        <section className="carte flex flex-col gap-3 p-4 sm:p-5 lg:w-[46%]" aria-label="Les indices">
          <Silhouette revele={!!etat} image={m.item.image} reduce={reduce} />
          <div className="flex items-start justify-center gap-3">
            <SpeakButton text={`${titre}. ${texteIndices}`} label="Écouter les indices" />
            <h2 className="text-center font-titre text-2xl font-extrabold leading-snug sm:text-3xl">
              {insecable(titre)}
            </h2>
          </div>
          {avecIndices ? (
            <ol className="flex flex-col gap-2" aria-live="polite">
              {m.indices.map((t, i) => (
                <motion.li
                  key={`${m.item.id}-${i}-${i < vus}`}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-2 rounded-2xl px-3 py-2 ${
                    i < vus ? 'bg-sun/25 font-bold' : 'border-2 border-dashed border-ink/15 text-ink/35'
                  }`}
                >
                  <span className="font-titre text-lg font-extrabold text-sun-dark" aria-hidden>
                    {i + 1}
                  </span>
                  <span>{i < vus ? insecable(t) : 'Indice caché'}</span>
                </motion.li>
              ))}
            </ol>
          ) : (
            <p className="rounded-2xl bg-sun/25 px-4 py-3 text-center text-xl font-bold">
              {insecable(m.item.question)}
            </p>
          )}
          {avecIndices && !etat && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="rounded-full bg-grape/15 px-3 py-1 font-titre font-bold text-grape-dark">
                En jeu : {enJeu} {enJeu > 1 ? 'points' : 'point'}
              </span>
              {vus < nbIndices && level !== 'plus_loin' && (
                <Button
                  variant="sun"
                  icon={<Lightbulb aria-hidden />}
                  onClick={indiceSuivant}
                  disabled={paused}
                >
                  Indice suivant
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Les réponses */}
        <section className="carte flex min-w-0 flex-1 flex-col items-center gap-4 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <SpeakButton text={texteChoix} label="Écouter les propositions" size={40} />
            <p className="font-bold text-ink-soft">
              {essais > 1 && !etat ? 'Tu as 2 essais. ' : ''}Réponds quand tu veux !
            </p>
          </div>
          <ChoiceGrid
            choices={choixAffiches}
            onPick={repondre}
            reveal={etat ? { correct: m.answerIndex, chosen: choisi } : null}
            disabled={paused || fini}
          />
          {!etat && barres.length > 0 && (
            <p className="rounded-2xl bg-sun/25 px-4 py-2 text-center font-bold" role="status">
              Presque ! Ce n’est pas {m.choices[barres[barres.length - 1]!]}. Un nouvel indice va t’aider.
            </p>
          )}
          {etat === 'juste' && <Feedback state="juste" message={`Bravo, mystère résolu ! +${gain} points`} />}
          {etat === 'juste' && <p className="text-center">{m.item.explication}</p>}
          {etat === 'faux' && (
            <Feedback
              state="faux"
              message="Presque ! Le mystère se dévoile :"
              expected={m.choices[m.answerIndex]}
              explication={m.item.explication}
              onContinue={suivant}
            />
          )}
        </section>
      </div>
    </div>
  );
}
