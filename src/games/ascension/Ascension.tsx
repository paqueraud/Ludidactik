/**
 * ⭐ L'Ascension — dictée-montagne (CATALOGUE n°29).
 * Le mot est dit (voix du parent ou synthèse fr-FR : mot — phrase — mot). Mot juste : l'alpiniste
 * grimpe d'un camp. Faute : il glisse d'un camp, voit la différence lettre à lettre et recopie le mot
 * juste (copie active) avant de continuer. Sommet = victoire.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Ear } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '@/avatar/Avatar';
import { LetterKeyboard, usePhysicalKeyboard } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import { itemKey } from '@/content/provider';
import type { Level, SpellingItem } from '@/content/schemas';
import { type DiffOp, checkSpelling, letterDiff } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';

const CAMPS: Record<Level, number> = { facile: 8, normal: 12, plus_loin: 12 };
const ECOUTES: Record<Level, number> = { facile: Infinity, normal: 3, plus_loin: 2 };
const SOMMETS: Record<Level, { nom: string; altitude: string }> = {
  facile: { nom: 'le mont Ventoux', altitude: '1 910 m' },
  normal: { nom: 'le mont Blanc', altitude: '4 806 m' },
  plus_loin: { nom: 'l’Everest', altitude: '8 849 m' },
};

type Meteo = 'soleil' | 'nuages' | 'orage';
type Mode =
  | { type: 'ecrire' }
  | { type: 'correction'; given: string; diff: DiffOp[]; message: string }
  | { type: 'fini' };

/** Positions des camps (repère SVG 400 × 300), en zigzag de plus en plus serré vers le sommet. */
function campPositions(k: number) {
  return Array.from({ length: k + 1 }, (_, i) => {
    const t = i / k;
    const y = 278 - t * 236;
    const spread = 95 * (1 - t);
    const x = i === k ? 200 : 200 + (i % 2 === 0 ? -1 : 1) * spread * 0.85;
    return { x, y };
  });
}

function DiffView({ diff }: { diff: DiffOp[] }) {
  return (
    <span className="inline-flex flex-wrap font-titre text-3xl font-extrabold tracking-wide" aria-hidden>
      {diff.map((op, i) => {
        if (op.type === 'ok') return <span key={i}>{op.char}</span>;
        if (op.type === 'missing')
          return (
            <span key={i} className="rounded bg-grass/40 px-0.5 text-grass-dark underline decoration-4">
              {op.char}
            </span>
          );
        if (op.type === 'sub')
          return (
            <span key={i} className="rounded bg-sun/60 px-0.5">
              {op.char}
            </span>
          );
        return (
          <span key={i} className="px-0.5 text-coral line-through">
            {op.given}
          </span>
        );
      })}
    </span>
  );
}

export default function Ascension({
  level,
  profile,
  stream,
  lectureAuto: _lectureAuto,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
}: GameProps) {
  const K = CAMPS[level];
  const camps = useMemo(() => campPositions(K), [K]);
  const sommet = SOMMETS[level];

  const [item, setItem] = useState(() => stream.next() as SpellingItem);
  const [camp, setCamp] = useState(0);
  const [input, setInput] = useState('');
  const [copie, setCopie] = useState('');
  const [mode, setMode] = useState<Mode>({ type: 'ecrire' });
  const [ecoutes, setEcoutes] = useState(0);
  const [erreursDeSuite, setErreursDeSuite] = useState(0);
  const [flash, setFlash] = useState(false);
  const tentatives = useRef(0);
  const erreurs = useRef(0);
  const start = useRef(performance.now());
  const pausedMs = useRef(0);
  const questionStart = useRef(performance.now());

  const meteo: Meteo = erreursDeSuite >= 2 ? 'orage' : erreursDeSuite === 1 ? 'nuages' : 'soleil';
  const sansVoix = !speech.ttsAvailable && !item.audioKey;
  // Facile : la première lettre est donnée (sauf pour une phrase)
  const prefixe = level === 'facile' && !item.isSentence ? [...item.word][0]! : '';

  // Temps passé en pause exclu de la durée
  useEffect(() => {
    if (!paused) return;
    const t0 = performance.now();
    speech.stop();
    return () => {
      pausedMs.current += performance.now() - t0;
    };
  }, [paused, speech]);

  const dicter = useCallback(async () => {
    if (sansVoix) {
      // Repli sans synthèse vocale : le mot s'affiche 3 secondes (« photographie le mot »)
      setFlash(true);
      setTimeout(() => setFlash(false), 3000);
      return;
    }
    await speech.dictate(item.word, item.isSentence ? undefined : item.sentence, item.audioKey);
    if (item.isSentence) await speech.speak(item.word, { queue: true, rate: speech.rate * 0.75 });
  }, [item, speech, sansVoix]);

  // Dictée automatique de chaque nouveau mot
  useEffect(() => {
    if (paused || mode.type !== 'ecrire') return;
    questionStart.current = performance.now();
    void dicter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const terminer = useCallback(
    (won: boolean, campAtteint: number) => {
      setMode({ type: 'fini' });
      const durationMs = Math.round(performance.now() - start.current - pausedMs.current);
      if (won) sfx.play('fanfare');
      setTimeout(
        () =>
          onEnd({
            correct: tentatives.current - erreurs.current,
            total: tentatives.current,
            durationMs,
            score: won
              ? Math.max(1, 10_000 - erreurs.current * 200 - Math.round(durationMs / 1000))
              : campAtteint * 100,
            won,
            headline: won ? `Sommet atteint : ${sommet.nom} !` : `Tu es monté jusqu’au camp ${campAtteint} !`,
          }),
        won ? 1800 : 600,
      );
    },
    [onEnd, sfx, sommet.nom],
  );

  const motSuivant = useCallback(() => {
    setItem(stream.next() as SpellingItem);
    setInput('');
    setCopie('');
    setEcoutes(0);
    setMode({ type: 'ecrire' });
  }, [stream]);

  const valider = useCallback(() => {
    if (mode.type !== 'ecrire' || paused) return;
    const given = prefixe + input;
    if (!given.trim() || given === prefixe) return;
    tentatives.current++;
    const res = checkSpelling(given, item.word, { isSentence: item.isSentence });
    onAnswer({
      itemId: item.id,
      itemKey: itemKey(item),
      correct: res.correct,
      ms: performance.now() - questionStart.current,
      given,
      expected: item.word,
    });
    if (res.correct) {
      const c = camp + 1;
      setCamp(c);
      setErreursDeSuite(0);
      sfx.play('monte');
      if (c >= K) terminer(true, c);
      else if (tentatives.current >= K * 2) terminer(false, c);
      else setTimeout(motSuivant, 500);
    } else {
      erreurs.current++;
      setCamp((c) => Math.max(0, c - 1));
      setErreursDeSuite((e) => e + 1);
      sfx.play('glisse');
      vibrate([40, 40, 40]);
      setMode({ type: 'correction', given, diff: letterDiff(given, item.word), message: res.message });
      void speech.speak(`${res.message} On écrit : ${item.word}`);
    }
  }, [mode, paused, prefixe, input, item, onAnswer, camp, K, sfx, terminer, motSuivant, speech]);

  const copieOk =
    mode.type === 'correction' && checkSpelling(copie, item.word, { isSentence: item.isSentence }).correct;
  const continuer = useCallback(() => {
    if (!copieOk) return;
    if (tentatives.current >= K * 2) terminer(false, camp);
    else motSuivant();
  }, [copieOk, K, camp, terminer, motSuivant]);

  const handlers = {
    onKey: (k: string) => {
      if (mode.type === 'ecrire') setInput((v) => (v.length < 80 ? v + k : v));
      else if (mode.type === 'correction') setCopie((v) => (v.length < 80 ? v + k : v));
    },
    onDelete: () =>
      mode.type === 'ecrire' ? setInput((v) => v.slice(0, -1)) : setCopie((v) => v.slice(0, -1)),
    onSubmit: () => (mode.type === 'ecrire' ? valider() : continuer()),
    disabled: paused || mode.type === 'fini',
  };
  usePhysicalKeyboard(handlers, /^[\p{L}'’\- .,]$/u);

  const reecouter = () => {
    if (ecoutes >= ECOUTES[level]) return;
    setEcoutes((e) => e + 1);
    void dicter();
  };

  const pos = camps[camp]!;
  const skyColors: Record<Meteo, [string, string]> = {
    soleil: ['#7FD3FF', '#E6F7FF'],
    nuages: ['#9DB4CC', '#DDE6EF'],
    orage: ['#4B5A78', '#8796B0'],
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row">
      {/* Montagne */}
      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[44%] lg:self-start"
        aria-label={`Montagne : camp ${camp} sur ${K}`}
      >
        <div className="relative">
          <svg viewBox="0 0 400 300" className="block w-full" aria-hidden>
            <defs>
              <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={skyColors[meteo][0]} style={{ transition: 'stop-color 0.8s' }} />
                <stop offset="1" stopColor={skyColors[meteo][1]} style={{ transition: 'stop-color 0.8s' }} />
              </linearGradient>
            </defs>
            <rect width="400" height="300" fill="url(#ciel)" />
            {meteo === 'soleil' && <circle cx="340" cy="50" r="26" fill="#FFD45C" />}
            {meteo !== 'soleil' && (
              <g fill={meteo === 'orage' ? '#5E6B84' : '#fff'} opacity="0.9">
                <ellipse cx="90" cy="50" rx="50" ry="18" />
                <ellipse cx="300" cy="40" rx="60" ry="20" />
              </g>
            )}
            {meteo === 'orage' && (
              <g stroke="#B9D7FF" strokeWidth="2" opacity="0.7">
                {Array.from({ length: 14 }, (_, i) => (
                  <line
                    key={i}
                    x1={20 + i * 28}
                    y1={70 + (i % 3) * 10}
                    x2={12 + i * 28}
                    y2={90 + (i % 3) * 10}
                  />
                ))}
              </g>
            )}
            <path d="M-20 300 L90 140 L170 300 Z" fill="#B8A9F5" opacity="0.6" />
            <path d="M230 300 L330 120 L430 300 Z" fill="#B8A9F5" opacity="0.6" />
            <path d="M10 300 L200 26 L390 300 Z" fill="#7E8CA8" />
            <path d="M200 26 L390 300 L300 300 Z" fill="#6A7894" />
            <path d="M200 26 L160 84 L178 78 L190 92 L204 80 L220 94 L236 82 L200 26 Z" fill="#fff" />
            <polyline
              points={camps.map((c) => `${c.x},${c.y}`).join(' ')}
              fill="none"
              stroke="#E0A458"
              strokeWidth="4"
              strokeDasharray="7 6"
              strokeLinecap="round"
            />
            {camps.map((c, i) =>
              i === K ? (
                <g key={i}>
                  <line x1={c.x} y1={c.y} x2={c.x} y2={c.y - 34} stroke="#24304A" strokeWidth="3" />
                  <path
                    d={`M${c.x} ${c.y - 34} L${c.x + 26} ${c.y - 27} L${c.x} ${c.y - 20} Z`}
                    fill="#FF7A6B"
                  />
                </g>
              ) : (
                <g key={i}>
                  <path
                    d={`M${c.x - 10} ${c.y + 2} L${c.x} ${c.y - 12} L${c.x + 10} ${c.y + 2} Z`}
                    fill={i <= camp ? '#FFD45C' : '#E8EEF6'}
                    stroke="#24304A"
                    strokeWidth="1.5"
                  />
                </g>
              ),
            )}
            <rect x="6" y="6" width="150" height="34" rx="12" fill="rgba(255,255,255,0.85)" />
            <text
              x="16"
              y="28"
              fontFamily="Baloo 2, sans-serif"
              fontWeight="800"
              fontSize="15"
              fill="#24304A"
            >
              ⛰ {sommet.altitude}
            </text>
          </svg>
          {/* Alpiniste */}
          <motion.div
            className="absolute -translate-x-1/2 -translate-y-full"
            animate={{ left: `${(pos.x / 400) * 100}%`, top: `${(pos.y / 300) * 100}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 14 }}
          >
            <Avatar
              config={{ ...profile.avatar, accessoire: 'casque_alpi' }}
              size={54}
              compagnon={false}
              humeur={meteo === 'orage' ? 'inquiet' : camp >= K ? 'joie' : 'normal'}
            />
          </motion.div>
          <div className="absolute bottom-2 right-2 rounded-full bg-white/85 px-3 py-1 font-titre font-bold">
            Camp {camp} / {K}
          </div>
        </div>
      </section>

      {/* Zone d'écriture */}
      <section className="carte flex flex-1 flex-col items-center gap-3 p-4">
        {mode.type !== 'correction' ? (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="sun"
                icon={<Ear aria-hidden />}
                onClick={reecouter}
                disabled={ecoutes >= ECOUTES[level] || paused}
                aria-label="Réécouter le mot"
              >
                Réécouter{ECOUTES[level] !== Infinity ? ` (${ECOUTES[level] - ecoutes})` : ''}
              </Button>
              {item.source === 'parents' && (
                <span className="rounded-full bg-grape/15 px-3 py-1 text-sm font-bold text-grape-dark">
                  Mot de la semaine
                </span>
              )}
            </div>
            {flash && (
              <p className="font-titre text-4xl font-extrabold" aria-live="assertive">
                {item.word}
              </p>
            )}
            <p className="text-ink-soft">
              {item.isSentence ? 'Écris la phrase que tu entends.' : 'Écris le mot que tu entends.'}
            </p>
            <div
              className="flex min-h-[4.5rem] w-full max-w-xl flex-wrap items-center justify-center rounded-2xl border-4 border-sky bg-cream px-4 py-2 font-titre text-3xl font-extrabold sm:text-4xl"
              aria-label={`Ce que tu as écrit : ${prefixe + input || 'rien pour l’instant'}`}
              aria-live="polite"
            >
              {prefixe && <span className="text-grape">{prefixe}</span>}
              <span className="whitespace-pre-wrap break-all">{input}</span>
              <span className="ml-0.5 inline-block h-9 w-1 animate-pulse bg-ink/40" aria-hidden />
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full flex-col items-center gap-2 text-center"
            role="status"
          >
            <p className="text-xl font-bold">{mode.message}</p>
            <div className="rounded-2xl bg-cream px-4 py-2">
              <div className="text-sm text-ink-soft">Ce que tu as écrit, corrigé :</div>
              <DiffView diff={mode.diff} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ink-soft">On écrit :</span>
              <span className="font-titre text-4xl font-extrabold text-grass-dark">{item.word}</span>
              <SpeakButton text={item.word} size={40} />
            </div>
            <p className="text-sm">{item.explication}</p>
            <p className="font-bold">Recopie-le pour continuer l’ascension :</p>
            <div
              className={`flex min-h-[4rem] w-full max-w-xl items-center justify-center rounded-2xl border-4 px-4 font-titre text-3xl font-extrabold ${copieOk ? 'border-grass bg-grass/10' : 'border-sun bg-cream'}`}
              aria-label={`Ta copie : ${copie || 'vide'}`}
            >
              {copie}
              <span className="ml-0.5 inline-block h-8 w-1 animate-pulse bg-ink/40" aria-hidden />
            </div>
            <Button variant="grass" onClick={continuer} disabled={!copieOk}>
              {copieOk ? 'Bravo ! On repart' : 'Recopie le mot'}
            </Button>
          </motion.div>
        )}
        <LetterKeyboard {...handlers} ponctuation={item.isSentence} />
        <AnimatePresence>
          {mode.type === 'fini' && camp >= K && (
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="font-titre text-3xl font-extrabold text-grass-dark"
            >
              🚩 Sommet atteint !
            </motion.p>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
