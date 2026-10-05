/**
 * La Fusée des compléments (CATALOGUE n°3).
 * Chaque bonne réponse ajoute un étage à la fusée ; quand elle est complète : compte à rebours et
 * décollage animé vers une planète. Pour les items `meta.complement = { depart, cible }`, un réservoir
 * gradué montre le niveau de départ et le trait à atteindre : on cherche « combien il manque ».
 * Facile : 6 étages, réservoir avec graduations, pas de chrono. Normal : 10 étages, réservoir sans
 * graduations fines. Plus loin : 12 étages, fenêtre de tir chronométrée, réservoir sans repères.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keypad } from '@/components/Keypads';
import { SpeakButton } from '@/components/ui';
import type { Level, NumericItem } from '@/content/schemas';
import { checkNumeric, formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { useGameSession } from '@/games/_kit/session';
import { Hud } from '@/games/_kit/ui';
import { vibrate } from '@/services/sfx';
import { bravo, direNombre, estNumerique, tirer, useBoucle, useRng } from '../_nombres-commun/outils';
import { Bandeau, BarreTemps, CaseReponse, Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { useSaisieNumerique } from '../_nombres-commun/useSaisieNumerique';

const ETAGES: Record<Level, number> = { facile: 6, normal: 10, plus_loin: 12 };
const CHRONO: Record<Level, number | null> = { facile: null, normal: null, plus_loin: 15 };
const COULEURS = ['#FF7A6B', '#4FC3F7', '#FFD45C', '#7BD389', '#8E7CFF', '#FF9DD2'];
const PLANETES = [
  { nom: 'Pistachia', a: '#9BE07A', b: '#4FA84A' },
  { nom: 'Myrtilla', a: '#9C8CFF', b: '#5A48D8' },
  { nom: 'Caramella', a: '#FFC36B', b: '#D9822B' },
  { nom: 'Fraisia', a: '#FF9DB0', b: '#E0506E' },
  { nom: 'Glaçonia', a: '#BDEBFF', b: '#4FA8D8' },
];

interface Complement {
  depart: number;
  cible: number;
}

function complementDe(it: NumericItem): Complement | null {
  const c = it.meta?.complement as Partial<Complement> | undefined;
  if (!c || typeof c.depart !== 'number' || typeof c.cible !== 'number' || c.cible <= 0) return null;
  if (c.depart < 0 || c.depart > c.cible) return null;
  return { depart: c.depart, cible: c.cible };
}

/** Réservoir gradué (vertical). `niveau` et `repere` dans [0, 1]. */
function Reservoir({
  niveau,
  repere,
  graduations,
  etiquettes,
}: {
  niveau: number;
  repere: number | null;
  graduations: number;
  etiquettes: { bas: string; haut: string } | null;
}) {
  const H = 220;
  return (
    <svg viewBox="0 0 120 260" className="h-full w-auto" aria-hidden>
      <rect x="30" y="20" width="60" height={H} rx="18" fill="#E8F1FA" stroke="#24304A" strokeWidth="4" />
      <clipPath id="fc-cuve">
        <rect x="32" y="22" width="56" height={H - 4} rx="16" />
      </clipPath>
      <motion.rect
        x="30"
        width="60"
        fill="#4FC3F7"
        clipPath="url(#fc-cuve)"
        initial={false}
        animate={{ y: 20 + H * (1 - niveau), height: H * niveau }}
        transition={{ type: 'spring', stiffness: 60, damping: 14 }}
      />
      <motion.rect
        x="30"
        width="60"
        height="8"
        fill="#B3E8FF"
        clipPath="url(#fc-cuve)"
        initial={false}
        animate={{ y: 20 + H * (1 - niveau) }}
        transition={{ type: 'spring', stiffness: 60, damping: 14 }}
      />
      {Array.from({ length: Math.max(0, graduations - 1) }, (_, i) => {
        const y = 20 + (H * (i + 1)) / graduations;
        return <line key={i} x1="30" x2="46" y1={y} y2={y} stroke="#24304A" strokeWidth="2" />;
      })}
      {repere !== null && (
        <g>
          <line
            x1="22"
            x2="98"
            y1={20 + H * (1 - repere)}
            y2={20 + H * (1 - repere)}
            stroke="#FF7A6B"
            strokeWidth="4"
            strokeDasharray="8 5"
          />
        </g>
      )}
      {etiquettes && (
        <>
          <text
            x="100"
            y={20 + H + 4}
            fontSize="16"
            fontWeight="800"
            fill="#24304A"
            fontFamily="Baloo 2, sans-serif"
          >
            {etiquettes.bas}
          </text>
          <text x="100" y="28" fontSize="16" fontWeight="800" fill="#FF7A6B" fontFamily="Baloo 2, sans-serif">
            {etiquettes.haut}
          </text>
        </>
      )}
      <text
        x="60"
        y="255"
        textAnchor="middle"
        fontSize="15"
        fontWeight="800"
        fill="#24304A"
        fontFamily="Baloo 2, sans-serif"
      >
        carburant
      </text>
    </svg>
  );
}

/** La fusée en construction (étages empilés) sur son pas de tir. */
function Fusee({ etages, total, decolle }: { etages: number; total: number; decolle: boolean }) {
  const reduce = useReducedMotion();
  const hEtage = Math.min(30, 210 / total);
  const bas = 340;
  return (
    <motion.g
      initial={false}
      animate={decolle ? { y: reduce ? -60 : [0, 6, -620] } : { y: 0 }}
      transition={
        decolle
          ? { duration: reduce ? 0.6 : 2.6, times: reduce ? undefined : [0, 0.25, 1], ease: 'easeIn' }
          : { duration: 0 }
      }
    >
      {/* flamme */}
      {decolle && (
        <motion.path
          d="M84 344 Q 100 410 116 344 Z"
          fill="#FFB347"
          animate={reduce ? undefined : { scaleY: [1, 1.4, 1] }}
          transition={{ duration: 0.25, repeat: Infinity }}
          style={{ originX: '100px', originY: '344px' }}
        />
      )}
      {/* ailerons */}
      <path d={`M70 ${bas} L 52 ${bas + 4} L 70 ${bas - 40} Z`} fill="#FF7A6B" />
      <path d={`M130 ${bas} L 148 ${bas + 4} L 130 ${bas - 40} Z`} fill="#FF7A6B" />
      {Array.from({ length: etages }, (_, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        >
          <rect
            x="70"
            y={bas - (i + 1) * hEtage}
            width="60"
            height={hEtage - 2}
            rx="6"
            fill={COULEURS[i % COULEURS.length]}
          />
          <circle
            cx="100"
            cy={bas - (i + 0.5) * hEtage}
            r={Math.min(7, hEtage / 3)}
            fill="#fff"
            opacity="0.85"
          />
        </motion.g>
      ))}
      {/* coiffe */}
      <path
        d={`M70 ${bas - etages * hEtage} Q 100 ${bas - etages * hEtage - 70} 130 ${bas - etages * hEtage} Z`}
        fill="#ECEFF1"
        stroke="#B0BEC5"
        strokeWidth="3"
      />
    </motion.g>
  );
}

export default function FuseeComplements({
  level,
  lesson,
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
  const N = ETAGES[level];
  const planete = useMemo(() => rng.pick(PLANETES), [rng]);
  const nouvelle = useCallback(() => tirer(stream, target(), estNumerique), [stream, target]);

  const [item, setItem] = useState<NumericItem | null>(() => nouvelle());
  const [etat, setEtat] = useState<'jeu' | 'juste' | 'faux' | 'decollage'>('jeu');
  const [etages, setEtages] = useState(0);
  const [plein, setPlein] = useState(false);
  const [message, setMessage] = useState('');
  const [compte, setCompte] = useState<number | null>(null);
  const [reste, setReste] = useState(1);
  const [hint, setHint] = useState<string | undefined>();
  const questions = useRef(0);

  const comp = item ? complementDe(item) : null;
  const chrono = CHRONO[level];

  const valider = useCallback(
    (v: string) => {
      if (!item || etat !== 'jeu' || paused) return;
      const check = checkNumeric(v, item.answer, { tolerateZeros: level === 'facile' });
      questions.current++;
      answer(item, check.correct, v, formatNumber(item.answer));
      if (check.correct) {
        setPlein(true);
        setEtages((e) => e + 1);
        sfx.play('monte');
        setMessage(`${bravo(rng)} +1 étage !`);
        setEtat('juste');
      } else {
        setHint(check.hint);
        sfx.play('faux');
        vibrate(60);
        setEtat('faux');
      }
    },
    [item, etat, paused, level, answer, sfx, rng],
  );

  const suivant = useCallback(() => {
    if (etages >= N || questions.current >= 2 * N) {
      // décollage (même si la fusée n'est pas complète : elle part avec ses étages)
      setEtat('decollage');
      return;
    }
    setItem(nouvelle());
    setPlein(false);
    setMessage('');
    setHint(undefined);
    setReste(1);
    setEtat('jeu');
  }, [etages, N, nouvelle]);

  const { valeur, setValeur, handlers } = useSaisieNumerique({
    actif: etat === 'jeu' && !paused && !!item,
    onValider: valider,
  });

  useEffect(() => {
    if (!item) return;
    startQuestion();
    setValeur('');
    if (lectureAuto && !paused) void speech.speak(item.spoken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  useEffect(() => {
    if (etat !== 'juste') return;
    const t = setTimeout(suivant, 1100);
    return () => clearTimeout(t);
  }, [etat, suivant]);

  // Fenêtre de tir (Plus loin)
  useBoucle(!!chrono && etat === 'jeu' && !paused && !!item, (dt) =>
    setReste((r) => Math.max(0, r - dt / chrono!)),
  );
  useEffect(() => {
    if (chrono && reste <= 0 && etat === 'jeu' && item) {
      questions.current++;
      answer(item, false, '(temps écoulé)', formatNumber(item.answer));
      sfx.play('faux');
      setEtat('faux');
    }
  }, [reste, chrono, etat, item, answer, sfx]);

  // Compte à rebours puis fin de partie
  useEffect(() => {
    if (etat !== 'decollage' || paused) return;
    if (compte === null) {
      setCompte(3);
      return;
    }
    if (compte > 0) {
      sfx.play('tic');
      const t = setTimeout(() => setCompte((c) => (c ?? 1) - 1), 700);
      return () => clearTimeout(t);
    }
    sfx.play('fanfare');
    const complete = etages >= N;
    end({
      won: complete,
      headline: complete
        ? `Décollage réussi ! Tu as atteint la planète ${planete.nom} ! 🪐`
        : `Ta fusée de ${etages} étage${etages > 1 ? 's' : ''} a décollé !`,
      score: etages * 100 + Math.max(0, 2 * N - questions.current) * 10,
      delayMs: 3200,
    });
  }, [etat, compte, paused, sfx, end, etages, N, planete]);

  if (!item) {
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de calculs pour la fusée."
        onFin={() => end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const niveau = comp
    ? (plein ? comp.cible : comp.depart) / comp.cible
    : Math.min(1, (etages + (plein ? 0 : 0)) / N);
  const graduationsReservoir = comp
    ? level === 'facile'
      ? Number.isInteger(comp.cible) && comp.cible <= 20
        ? comp.cible
        : 10
      : level === 'normal'
        ? 2
        : 1
    : N;
  const decimal = item.decimals > 0 || lesson.classe === 'CM2';
  const decollage = etat === 'decollage';

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row">
      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[46%] lg:self-start"
        aria-label={`Fusée : ${etages} étages sur ${N}`}
        style={{ background: 'linear-gradient(180deg,#1B1F4B 0%,#3A3F8F 60%,#7C6FD8 100%)' }}
      >
        <div className="flex h-[300px] items-end justify-center gap-2 sm:h-[380px]">
          <svg viewBox="0 0 200 380" className="h-full w-auto" aria-hidden>
            {Array.from({ length: 22 }, (_, i) => (
              <circle
                key={i}
                cx={(i * 47) % 200}
                cy={(i * 71) % 260}
                r={i % 3 ? 1.2 : 2}
                fill="#fff"
                opacity="0.8"
              />
            ))}
            <circle cx="170" cy="40" r="22" fill={planete.a} />
            <path d="M150 40 a 20 20 0 0 0 40 0" fill={planete.b} opacity="0.6" />
            <rect x="0" y="344" width="200" height="40" fill="#5B5F7A" />
            <rect x="40" y="340" width="120" height="8" rx="3" fill="#8D93B5" />
            <rect x="160" y="160" width="10" height="184" fill="#8D93B5" />
            {Array.from({ length: 6 }, (_, i) => (
              <line
                key={i}
                x1="160"
                x2="170"
                y1={170 + i * 28}
                y2={184 + i * 28}
                stroke="#5B5F7A"
                strokeWidth="3"
              />
            ))}
            <Fusee etages={etages} total={N} decolle={decollage && compte === 0} />
          </svg>
          <div className="h-[75%] py-2">
            <Reservoir
              niveau={niveau}
              repere={comp ? 1 : null}
              graduations={graduationsReservoir}
              etiquettes={
                comp && level !== 'plus_loin'
                  ? { bas: formatNumber(comp.depart), haut: formatNumber(comp.cible) }
                  : null
              }
            />
          </div>
        </div>
        <div className="absolute left-2 top-2">
          <Hud>
            🚀 {etages} / {N}
          </Hud>
        </div>
        <AnimatePresence>
          {decollage && compte !== null && (
            <motion.div
              key={compte}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center font-titre text-7xl font-extrabold text-sun drop-shadow-lg"
              role="status"
            >
              {compte > 0 ? compte : 'Décollage !'}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-4 sm:p-6">
        <Bandeau>
          <Hud>✅ {stats.correct}</Hud>
          {chrono && etat === 'jeu' && <BarreTemps reste={reste} label="Fenêtre de tir" />}
        </Bandeau>
        {comp && level !== 'plus_loin' && (
          <p className="text-center font-bold text-ink-soft">
            Le réservoir contient {formatNumber(comp.depart)}. Il faut le remplir jusqu’à{' '}
            {formatNumber(comp.cible)}.
          </p>
        )}
        <div className="flex items-center gap-3">
          <SpeakButton text={item.spoken} label="Écouter le calcul" />
          <p className="font-titre text-4xl font-extrabold sm:text-5xl" aria-live="polite">
            {item.prompt}
          </p>
        </div>
        <CaseReponse
          valeur={valeur}
          etat={etat === 'faux' ? 'faux' : etat === 'juste' ? 'juste' : null}
          unite={item.unit}
        />
        <p className="min-h-[1.75rem] font-titre text-xl font-extrabold text-grass-dark" aria-live="polite">
          {etat === 'juste' ? message : ''}
        </p>
        <Correction
          ouvert={etat === 'faux'}
          titre={valeur ? 'Presque !' : 'La fenêtre de tir s’est refermée !'}
          bonne={formatNumber(item.answer)}
          aDire={`La bonne réponse est ${direNombre(item.answer)}. ${item.explication}`}
          explication={item.explication}
          onContinuer={suivant}
        >
          {hint && <p className="mt-1">{hint}</p>}
        </Correction>
        {etat !== 'faux' && !decollage && <Keypad {...handlers} decimal={decimal} />}
      </section>
    </div>
  );
}
