/**
 * Le Train des accords (CATALOGUE n° 37) — chaîne d'accords du BO.
 * Les mots du groupe (`meta.groupe` : déterminant + nom + adjectif ; CM2 : sujet + verbe + attribut,
 * participe passé avec être) sont des wagons. Un wagon est vide : on y accroche le mot bien accordé
 * (parmi les `choices`) et le train démarre.
 * Facile : 2 wagons au choix, astuce affichée. Normal : tous les wagons au choix.
 * Plus loin : il faut écrire soi-même le mot accordé (clavier), sans astuce.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LetterKeyboard, usePhysicalKeyboard } from '@/components/Keypads';
import { SpeakButton } from '@/components/ui';
import type { Item, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { Feedback, Hud } from '../_kit/ui';
import { tirerItem } from '../_orthographe-commun/lettres';
import { wagonsDe } from './wagons';
import {
  type Trou,
  phraseALire,
  phraseComplete,
  reduireChoix,
  trouJuste,
  versTrou,
} from '../_orthographe-commun/trou';

const MANCHES: Record<Level, number> = { facile: 8, normal: 10, plus_loin: 10 };
const COULEURS = ['#4FC3F7', '#7BD389', '#FFD45C', '#8E7CFF', '#FF7A6B', '#3CC8B4'];
const TOUCHES = ['a', 'b', 'c', 'd', 'e', 'f'];
const SAISIE = /^[\p{L}'’\- ]$/u;

function Roues() {
  return (
    <span
      className="pointer-events-none absolute -bottom-3 left-0 right-0 flex justify-between px-2"
      aria-hidden
    >
      <span className="h-6 w-6 rounded-full border-4 border-ink bg-ink/60" />
      <span className="h-6 w-6 rounded-full border-4 border-ink bg-ink/60" />
    </span>
  );
}

function Locomotive({ roule }: { roule: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative mb-3 h-[4.5rem] w-24 shrink-0" aria-hidden>
      <svg viewBox="0 0 96 72" className="absolute inset-0 h-full w-full">
        {roule && !reduce && (
          <motion.circle
            cx="70"
            cy="6"
            r="8"
            fill="#fff"
            initial={{ opacity: 0.9, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -16, scale: 1.6 }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        )}
        <rect x="62" y="8" width="14" height="18" rx="3" fill="#24304A" />
        <rect x="4" y="6" width="34" height="40" rx="6" fill="#FF7A6B" />
        <rect x="11" y="13" width="20" height="14" rx="3" fill="#BEE9FF" />
        <rect x="30" y="24" width="56" height="26" rx="10" fill="#FF7A6B" />
        <rect x="86" y="40" width="8" height="12" rx="2" fill="#24304A" />
        <circle cx="70" cy="34" r="5" fill="#FFD45C" />
        <rect x="0" y="48" width="92" height="8" rx="4" fill="#24304A" />
        <circle cx="20" cy="60" r="10" fill="#24304A" />
        <circle cx="20" cy="60" r="4" fill="#8A93A8" />
        <circle cx="62" cy="60" r="10" fill="#24304A" />
        <circle cx="62" cy="60" r="4" fill="#8A93A8" />
      </svg>
    </div>
  );
}

export default function TrainAccords({
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
  const reduce = useReducedMotion();

  const tirer = useCallback((): Trou | null => {
    const avecGroupe = tirerItem(stream, (it: Item) => {
      const t = versTrou(it);
      return it.kind === 'fill_blank' && !!t?.choix && !!t.groupe;
    });
    const it = avecGroupe ?? tirerItem(stream, (x: Item) => x.kind === 'fill_blank' && !!versTrou(x)?.choix);
    return it ? versTrou(it) : null;
  }, [stream]);

  const [trou, setTrou] = useState<Trou | null>(tirer);
  const [manche, setManche] = useState(1);
  const [etat, setEtat] = useState<'juste' | 'faux' | null>(null);
  const [choisi, setChoisi] = useState<string | null>(null);
  const [saisie, setSaisie] = useState('');
  const [partis, setPartis] = useState(0);
  const [fini, setFini] = useState(false);

  const ecrit = level === 'plus_loin';
  /** Plus loin : le mot de base à accorder (meta.lemme, sinon la forme la plus courte des choix). */
  const lemme = useMemo(() => {
    const l = trou?.item.meta?.lemme;
    if (typeof l === 'string' && l.trim()) return l.trim();
    return trou?.choix ? [...trou.choix].sort((a, b) => a.length - b.length)[0] : undefined;
  }, [trou]);
  const choix = useMemo(
    () => (trou?.choix ? reduireChoix(trou.choix, trou.reponse, level === 'facile' ? 2 : 6) : []),
    [trou, level],
  );
  const wagons = useMemo(() => (trou ? wagonsDe(trou) : []), [trou]);

  useEffect(() => {
    session.startQuestion();
    if (lectureAuto && trou) void speech.speak(phraseALire(trou));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trou]);

  const accrocher = useCallback(
    (mot: string) => {
      if (!trou || etat || paused || fini || !mot.trim()) return;
      const juste = trouJuste(trou, mot);
      session.answer(trou.item, juste, mot, trou.reponse);
      setChoisi(mot);
      setEtat(juste ? 'juste' : 'faux');
      if (juste) {
        sfx.play('turbo');
        setPartis((p) => p + 1);
      } else {
        sfx.play('faux');
        vibrate([30, 30]);
      }
    },
    [trou, etat, paused, fini, session, sfx],
  );

  const suivant = useCallback(() => {
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      session.end({
        won: partis >= Math.ceil(total / 2),
        headline: `${partis} train${partis > 1 ? 's' : ''} parti${partis > 1 ? 's' : ''} à l’heure !`,
        delayMs: 900,
      });
      return;
    }
    setTrou(tirer());
    setManche((m) => m + 1);
    setEtat(null);
    setChoisi(null);
    setSaisie('');
  }, [manche, total, partis, session, sfx, tirer]);

  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, 1700);
    return () => clearTimeout(t);
  }, [etat, paused, suivant]);

  // Clavier : 1-6 / A-F pour choisir un wagon (niveaux à choix)
  useEffect(() => {
    if (ecrit || etat || paused || fini) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const i = TOUCHES.indexOf(e.key.toLowerCase());
      const j = Number(e.key) - 1;
      const k = i >= 0 ? i : Number.isInteger(j) && j >= 0 ? j : -1;
      if (k >= 0 && k < choix.length) {
        e.preventDefault();
        accrocher(choix[k]!);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [ecrit, etat, paused, fini, choix, accrocher]);

  usePhysicalKeyboard(
    {
      onKey: (k) => setSaisie((v) => (v.length < 30 ? v + k : v)),
      onDelete: () => setSaisie((v) => v.slice(0, -1)),
      onSubmit: () => accrocher(saisie),
      disabled: !ecrit || !!etat || paused || fini,
    },
    SAISIE,
  );

  if (!trou) {
    return (
      <div className="carte mx-auto max-w-md p-6 text-center">
        <p className="text-lg">Il n’y a pas encore de groupes à accorder dans cette leçon.</p>
      </div>
    );
  }

  const contenuTrou = etat === 'juste' ? choisi : etat === 'faux' ? trou.reponse : ecrit ? saisie : '';
  const roule = etat === 'juste';

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full items-center justify-between gap-2">
        <Hud>
          Train {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🚂</span> {partis} parti{partis > 1 ? 's' : ''}
        </Hud>
      </div>

      <section className="carte flex w-full flex-col items-center gap-2 p-4">
        <div className="flex items-center gap-3">
          <SpeakButton text={phraseALire(trou)} label="Écouter la phrase" />
          <p className="text-center font-titre text-2xl font-extrabold sm:text-3xl" aria-live="polite">
            {trou.avant}
            <span className="mx-1 inline-block min-w-[3ch] border-b-4 border-dashed border-coral text-center">
              {contenuTrou || ' '}
            </span>
            {trou.apres}
          </p>
        </div>
        {level === 'facile' && trou.astuce && (
          <p className="rounded-2xl bg-sun/25 px-4 py-2 text-center font-bold">💡 {trou.astuce}</p>
        )}
      </section>

      {/* La gare : le train à accrocher */}
      <section
        className="relative w-full overflow-hidden rounded-card border-4 border-white shadow-soft"
        style={{ background: 'linear-gradient(180deg,#BEE9FF 0%,#E6F7FF 60%,#CFEFC4 61%,#A8DE9B 100%)' }}
        aria-label={roule ? 'Le train démarre !' : 'Le train attend son wagon'}
      >
        <svg
          viewBox="0 0 400 60"
          className="absolute left-0 top-2 h-12 w-full"
          preserveAspectRatio="xMidYMin slice"
          aria-hidden
        >
          <ellipse cx="70" cy="30" rx="40" ry="12" fill="#fff" opacity="0.9" />
          <ellipse cx="300" cy="22" rx="50" ry="13" fill="#fff" opacity="0.8" />
        </svg>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={manche}
            className="relative flex min-h-[9rem] flex-wrap items-end justify-center gap-x-2 gap-y-6 px-3 pb-6 pt-14"
            initial={reduce ? { opacity: 0 } : { x: '-110%' }}
            animate={reduce ? { opacity: 1 } : { x: roule ? ['0%', '-2%', '130%'] : '0%' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0 }}
            transition={
              roule
                ? { duration: 1.5, delay: 0.3, ease: 'easeIn' }
                : { type: 'spring', stiffness: 60, damping: 14 }
            }
          >
            {wagons.map((w, i) => (
              <motion.div
                key={i}
                className={`relative mb-3 flex min-h-[3.5rem] min-w-[4.5rem] items-center justify-center rounded-xl px-3 py-2 font-titre text-xl font-extrabold shadow-pop-sm sm:text-2xl ${
                  w.trou
                    ? etat === 'juste'
                      ? 'bg-grass text-ink'
                      : etat === 'faux'
                        ? 'bg-coral/40 text-ink'
                        : 'border-4 border-dashed border-ink/40 bg-white/60 text-ink'
                    : 'text-ink'
                }`}
                style={w.trou ? undefined : { background: COULEURS[i % COULEURS.length] }}
                animate={w.trou && etat === 'faux' && !reduce ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
                transition={{ duration: 0.4 }}
              >
                {w.trou ? (
                  <span>
                    {w.avant}
                    <span className={contenuTrou ? '' : 'text-ink/40'}>{contenuTrou || '?'}</span>
                    {w.apres}
                  </span>
                ) : (
                  w.avant
                )}
                <Roues />
                {/* attelage */}
                <span className="absolute -right-2.5 bottom-3 h-1.5 w-3 rounded bg-ink" aria-hidden />
              </motion.div>
            ))}
            <Locomotive roule={roule} />
          </motion.div>
        </AnimatePresence>
        {/* rails */}
        <div className="absolute bottom-3 left-0 right-0 h-2 bg-ink/70" aria-hidden />
        <div
          className="absolute bottom-1 left-0 right-0 h-2"
          style={{ background: 'repeating-linear-gradient(90deg,#8A5A3B 0 10px,transparent 10px 26px)' }}
          aria-hidden
        />
      </section>

      {/* Voie de garage : les wagons au choix */}
      <section className="carte flex w-full flex-col items-center gap-3 p-4">
        {!ecrit ? (
          <>
            <p className="font-bold">Quel wagon faut-il accrocher ?</p>
            <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Wagons à accrocher">
              {choix.map((c, i) => {
                const bon = etat && c === trou.reponse;
                const mauvais = etat === 'faux' && c === choisi;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => accrocher(c)}
                    disabled={!!etat || paused || fini}
                    className={`btn-3d relative mb-3 flex min-h-[3.5rem] min-w-[5rem] items-center gap-2 rounded-xl px-4 font-titre text-2xl font-extrabold ${
                      bon ? 'bg-grass ring-4 ring-grass-dark' : mauvais ? 'bg-coral/40' : 'bg-sky/25'
                    } ${etat && !bon && !mauvais ? 'opacity-50' : ''}`}
                    aria-label={`Wagon ${i + 1} : ${c}`}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-titre text-sm text-white"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    {c}
                    <Roues />
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          !etat && (
            <>
              <p className="font-bold">
                {lemme ? `Écris le mot « ${lemme} » bien accordé :` : 'Écris le mot bien accordé :'}
              </p>
              <div
                className="flex min-h-[4rem] w-full max-w-md items-center justify-center rounded-2xl border-4 border-coral bg-cream font-titre text-3xl font-extrabold"
                aria-label={`Ton mot : ${saisie || 'rien pour l’instant'}`}
              >
                {saisie}
                <span className="ml-0.5 inline-block h-9 w-1 animate-pulse bg-ink/40" aria-hidden />
              </div>
              <LetterKeyboard
                onKey={(k) => setSaisie((v) => (v.length < 30 ? v + k : v))}
                onDelete={() => setSaisie((v) => v.slice(0, -1))}
                onSubmit={() => accrocher(saisie)}
                disabled={paused || fini}
              />
            </>
          )
        )}
        <Feedback
          state={etat}
          expected={phraseComplete(trou)}
          explication={[etat === 'faux' ? trou.astuce : undefined, trou.explication]
            .filter(Boolean)
            .join(' ')}
          onContinue={suivant}
          message={
            etat === 'juste'
              ? 'Tchou tchou ! Les wagons sont bien accordés !'
              : 'Presque ! Ce wagon ne s’accroche pas.'
          }
        />
      </section>
    </div>
  );
}
