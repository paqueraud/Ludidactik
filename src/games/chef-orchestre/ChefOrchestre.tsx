/**
 * Le Chef d'orchestre des classes de mots (CATALOGUE n° 40).
 * Les mots-notes (éléments d'un item `classification`) tombent un par un sur la scène ; on les range
 * sur le bon pupitre (catégories de l'item : nom, verbe, adjectif… ; CM2 : préposition, conjonction…).
 * Toucher un pupitre, taper 1-6, ou glisser la note sur le pupitre.
 * Facile : la note s'arrête à mi-hauteur (pas de chrono) et on a 2 essais par mot.
 * Normal : la note tombe doucement, 1 indice par morceau. Plus loin : chute rapide, sans indice.
 * Animations réduites : la note reste en haut et une barre montre le temps.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { ClassificationItem, Item, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { Hud } from '../_kit/ui';
import { collecterItems } from '../_langue-commun/tirage';
import { PasDExercice, Touche, cibleSous, useTouches } from '../_langue-commun/ui';
import { useBoucle, useRng } from '../_nombres-commun/outils';
import { BarreTemps, Correction } from '../_nombres-commun/ui';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { pourChef } from './filtre';

const MOTS: Record<Level, number> = { facile: 10, normal: 14, plus_loin: 18 };
/** Durée de chute d'une note (s). Facile : la note s'arrête à mi-hauteur et attend. */
const CHUTE_S: Record<Level, number> = { facile: 5, normal: 9, plus_loin: 5.5 };
const ARRET_FACILE = 0.45;
const ESSAIS: Record<Level, number> = { facile: 2, normal: 1, plus_loin: 1 };
const INSTRUMENTS = ['🎻', '🎺', '🥁', '🎹', '🎷', '🪗'];
const COULEURS = ['#4FC3F7', '#FF7A6B', '#FFD45C', '#7BD389', '#8E7CFF', '#E0A458'];

interface Note {
  item: ClassificationItem;
  label: string;
  categorie: number;
}

/** Le chef d'orchestre (dessin original) : il agite sa baguette quand l'orchestre joue juste. */
function Chef({ joue, reduite }: { joue: boolean; reduite: boolean }) {
  return (
    <svg viewBox="0 0 90 110" className="h-24 w-20 sm:h-32 sm:w-24" aria-hidden>
      <ellipse cx="45" cy="104" rx="30" ry="5" fill="#000" opacity="0.15" />
      <path d="M22 100 L28 58 Q45 50 62 58 L68 100 Z" fill="#24304A" />
      <path d="M45 58 L38 100 H52 Z" fill="#fff" />
      <path d="M40 62 L45 68 L50 62 Z" fill="#FF7A6B" />
      <circle cx="45" cy="38" r="18" fill="#F5C9A6" />
      <path d="M27 36 Q30 16 45 18 Q62 16 63 36 Q58 26 45 27 Q32 26 27 36 Z" fill="#B8C0D0" />
      <circle cx="39" cy="38" r="2.5" fill="#24304A" />
      <circle cx="51" cy="38" r="2.5" fill="#24304A" />
      <path
        d={joue ? 'M38 45 Q45 52 52 45' : 'M39 47 Q45 49 51 47'}
        stroke="#24304A"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <motion.g
        style={{ transformOrigin: '64px 66px' }}
        animate={joue && !reduite ? { rotate: [0, -40, 10, -30, 0] } : { rotate: 0 }}
        transition={{ duration: 0.9 }}
      >
        <rect x="60" y="60" width="16" height="7" rx="3.5" fill="#24304A" transform="rotate(-30 64 66)" />
        <line x1="74" y1="58" x2="88" y2="40" stroke="#8A5A3B" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

export default function ChefOrchestre({
  level,
  stream,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
  lectureAuto,
}: GameProps) {
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduite = !!useReducedMotion();
  const rng = useRng();

  // La partition : les mots de plusieurs items, morceau par morceau (chaque item a ses pupitres)
  const notes = useMemo(() => {
    const items = collecterItems(
      stream,
      (x: Item): x is ClassificationItem => x.kind === 'classification' && pourChef(x),
      8,
    );
    const out: Note[] = [];
    const max = parNiveau(level, MOTS);
    for (const item of rng.shuffle(items)) {
      if (out.length >= max) break;
      const els = rng.shuffle(item.elements).slice(0, max - out.length);
      for (const e of els) out.push({ item, label: e.label, categorie: e.category });
    }
    return out;
  }, [stream, level, rng]);
  const total = notes.length;

  const [n, setN] = useState(0);
  const [chute, setChute] = useState(0);
  const [etat, setEtat] = useState<'chute' | 'juste' | 'faux' | 'reessai'>('chute');
  const [choisi, setChoisi] = useState<number | null>(null);
  const [essais, setEssais] = useState(0);
  const [indice, setIndice] = useState(false);
  const [indicesRestants, setIndicesRestants] = useState(level === 'normal' ? 1 : 0);
  const [ranges, setRanges] = useState<Record<string, string[]>>({});
  const [justes, setJustes] = useState(0);
  const [fini, setFini] = useState(false);
  const scene = useRef<HTMLDivElement>(null);

  const note = notes[n];
  const item = note?.item;
  const itemPrecedent = notes[n - 1]?.item;
  const nouveauMorceau = !!item && item !== itemPrecedent;

  useEffect(() => {
    if (!note) return;
    session.startQuestion();
    setChute(0);
    if (lectureAuto && !paused) void speech.speak(note.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  // Nouveau morceau (nouvel item) : un indice de plus en Normal, pupitres vides
  useEffect(() => {
    if (!nouveauMorceau) return;
    setIndicesRestants(level === 'normal' ? 1 : 0);
    setRanges({});
  }, [nouveauMorceau, level]);

  const ranger = useCallback(
    (cat: number | null) => {
      if (!note || (etat !== 'chute' && etat !== 'reessai') || paused || fini) return;
      if (cat !== null && (cat < 0 || cat >= note.item.categories.length)) return;
      const juste = cat === note.categorie;
      const essai = essais + 1;
      setEssais(essai);
      setChoisi(cat);
      if (!juste && cat !== null && essai < ESSAIS[level]) {
        // Facile : un deuxième essai, la note remonte
        sfx.play('glisse');
        setEtat('reessai');
        setChute(0);
        return;
      }
      session.answer(
        note.item,
        juste,
        cat === null ? '(note tombée)' : (note.item.categories[cat] ?? ''),
        note.item.categories[note.categorie] ?? '',
      );
      if (juste) {
        sfx.play('juste');
        setJustes((j) => j + 1);
        setRanges((r) => ({ ...r, [note.categorie]: [...(r[note.categorie] ?? []), note.label] }));
        setEtat('juste');
      } else {
        sfx.play('faux');
        vibrate(50);
        setEtat('faux');
      }
    },
    [note, etat, paused, fini, essais, level, session, sfx],
  );

  // La chute (pause, correction : la note s'arrête)
  const enChute = (etat === 'chute' || etat === 'reessai') && !paused && !fini && !!note;
  useBoucle(enChute, (dt) => {
    setChute((c) => {
      const max = level === 'facile' ? ARRET_FACILE : 1;
      return Math.min(max, c + dt / CHUTE_S[level]);
    });
  });
  useEffect(() => {
    if (level !== 'facile' && chute >= 1 && (etat === 'chute' || etat === 'reessai')) ranger(null);
  }, [chute, level, etat, ranger]);

  const suivant = useCallback(() => {
    if (n + 1 >= total) {
      setFini(true);
      sfx.play('fanfare');
      const reussi = justes >= Math.ceil(total * 0.6);
      session.end({
        won: reussi,
        headline: reussi
          ? 'Bravo ! L’orchestre a joué juste ! 🎼'
          : `${justes} notes bien rangées sur ${total} !`,
        delayMs: 900,
      });
      return;
    }
    setN((x) => x + 1);
    setEtat('chute');
    setChoisi(null);
    setEssais(0);
    setIndice(false);
  }, [n, total, justes, session, sfx]);

  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, 900);
    return () => clearTimeout(t);
  }, [etat, paused, suivant]);

  useTouches((etat === 'chute' || etat === 'reessai') && !paused && !fini && !!note, (e) => {
    if (/^[1-6]$/.test(e.key)) {
      ranger(Number(e.key) - 1);
      return true;
    }
    return false;
  });

  if (!note || !item) {
    return (
      <PasDExercice
        texte="Cette leçon n’a pas de mots à ranger dans des catégories."
        onFin={() => session.end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const enJeu = etat === 'chute' || etat === 'reessai';
  // Contexte facultatif d'un mot (« porte » nom ou verbe ?) : meta.contextes = { mot: 'phrase' }
  const ctx = item.meta?.contextes;
  const contexte =
    ctx && typeof ctx === 'object' && typeof (ctx as Record<string, unknown>)[note.label] === 'string'
      ? ((ctx as Record<string, string>)[note.label] ?? null)
      : null;
  const hauteurChute = reduite ? 0 : chute;

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full items-center justify-between gap-2">
        <Hud>
          🎵 {Math.min(n + 1, total)} / {total}
        </Hud>
        <Hud>✅ {justes}</Hud>
      </div>
      <div className="flex items-center justify-center gap-2">
        <SpeakButton text={item.prompt} label="Écouter la consigne" size={40} />
        <p className="font-titre text-lg font-bold sm:text-xl">{item.prompt}</p>
      </div>

      {/* La scène */}
      <section
        ref={scene}
        className="relative w-full overflow-hidden rounded-card border-4 border-white shadow-soft"
        style={{ background: 'linear-gradient(180deg,#3B2E5A 0%,#5B4A86 55%,#C98A5B 56%,#A86E44 100%)' }}
        aria-label="La scène de l’orchestre"
      >
        {/* rideau */}
        <svg
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-0 h-8 w-full"
          aria-hidden
        >
          <path
            d="M0 0 H400 V18 Q380 34 360 18 Q340 34 320 18 Q300 34 280 18 Q260 34 240 18 Q220 34 200 18 Q180 34 160 18 Q140 34 120 18 Q100 34 80 18 Q60 34 40 18 Q20 34 0 18 Z"
            fill="#D9475A"
          />
        </svg>

        {/* Zone de chute */}
        <div className="relative mx-auto h-[170px] max-w-3xl sm:h-[200px]">
          <AnimatePresence>
            {enJeu && (
              <motion.div
                key={`${n}-${essais}`}
                className="absolute left-1/2 z-20"
                style={{ top: `calc(${hauteurChute * 100}% - ${hauteurChute * 56}px + 34px)`, x: '-50%' }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                drag={!paused}
                dragSnapToOrigin
                dragMomentum={false}
                onDragEnd={(e) => {
                  const v = cibleSous(e as PointerEvent, 'pupitre');
                  if (v !== null) ranger(Number(v));
                }}
              >
                <div className="flex cursor-grab items-center gap-2 rounded-full bg-white px-4 py-2 font-titre text-2xl font-extrabold text-ink shadow-pop active:cursor-grabbing">
                  <span className="text-grape" aria-hidden>
                    ♪
                  </span>
                  <span aria-live="polite">{note.label}</span>
                  <SpeakButton text={note.label} label={`Écouter : ${note.label}`} size={36} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute bottom-0 right-2 z-10 hidden sm:block">
            <Chef joue={etat === 'juste'} reduite={reduite} />
          </div>
          {etat === 'reessai' && (
            <p className="absolute inset-x-0 bottom-1 text-center font-bold text-sun" role="status">
              Presque&nbsp;! Essaie un autre pupitre.
            </p>
          )}
        </div>

        {/* Les pupitres */}
        <div
          className={`relative z-0 grid gap-2 px-2 pb-3 pt-1 ${
            [
              '',
              '',
              'grid-cols-2',
              'grid-cols-3',
              'grid-cols-2 sm:grid-cols-4',
              'grid-cols-3 sm:grid-cols-5',
              'grid-cols-3 sm:grid-cols-6',
            ][item.categories.length] ?? 'grid-cols-3'
          }`}
          role="group"
          aria-label="Les pupitres"
        >
          {item.categories.map((c, i) => {
            const bon = etat === 'faux' && i === note.categorie;
            const rate = (etat === 'faux' || etat === 'reessai') && i === choisi;
            return (
              <motion.button
                key={`${c}-${i}`}
                type="button"
                data-pupitre={i}
                onClick={() => ranger(i)}
                disabled={!enJeu || paused}
                className={`relative flex min-h-[88px] min-w-0 flex-col items-center justify-start gap-0.5 rounded-2xl border-4 bg-white/95 px-1 pb-1 pt-2 text-center shadow-pop-sm focus-visible:outline focus-visible:outline-4 focus-visible:outline-sun ${
                  bon ? 'border-grass ring-4 ring-grass/60' : rate ? 'border-coral' : 'border-transparent'
                }`}
                animate={etat === 'juste' && i === note.categorie && !reduite ? { y: [0, -8, 0] } : { y: 0 }}
                aria-label={`Pupitre ${i + 1} : ${c}`}
              >
                <Touche className="absolute left-1 top-1">{i + 1}</Touche>
                <span className="text-2xl" aria-hidden>
                  {INSTRUMENTS[i % INSTRUMENTS.length]}
                </span>
                <span
                  className="w-full break-words rounded-md px-1 text-sm font-extrabold leading-tight sm:text-base"
                  style={{ background: `${COULEURS[i % COULEURS.length]}40` }}
                >
                  {c}
                </span>
                <span className="flex max-w-full flex-wrap justify-center gap-0.5" aria-hidden>
                  {(ranges[i] ?? []).slice(-4).map((m, k) => (
                    <span key={k} className="max-w-full truncate rounded bg-cream px-1 text-[0.7rem]">
                      ♪ {m}
                    </span>
                  ))}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {level !== 'facile' && enJeu && (reduite || level === 'plus_loin') && (
        <BarreTemps reste={1 - chute} label="Avant que la note touche le sol" />
      )}

      {enJeu && indicesRestants > 0 && !indice && (
        <Button
          variant="sun"
          icon={<Lightbulb aria-hidden />}
          onClick={() => {
            setIndice(true);
            setIndicesRestants((x) => x - 1);
          }}
          disabled={paused}
        >
          Indice
        </Button>
      )}
      {enJeu && contexte && (
        <p className="flex max-w-2xl items-start gap-2 rounded-2xl bg-sky/15 px-4 py-2 font-bold">
          <SpeakButton text={contexte} label="Écouter la phrase" size={36} />
          Dans la phrase : « {contexte} »
        </p>
      )}
      {enJeu && indice && (
        <p
          className="flex max-w-2xl items-start gap-2 rounded-2xl bg-sun/25 px-4 py-2 font-bold"
          role="status"
        >
          <Lightbulb className="mt-0.5 shrink-0 text-sun-dark" aria-hidden />
          {item.explication}
        </p>
      )}

      <Correction
        ouvert={etat === 'faux'}
        titre={choisi === null ? 'La note est tombée !' : 'Presque !'}
        bonne={`« ${note.label} » va sur le pupitre « ${item.categories[note.categorie]} ».`}
        explication={item.explication}
        onContinuer={suivant}
      />
    </div>
  );
}
