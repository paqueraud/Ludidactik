/**
 * Le Robot codeur (CATALOGUE n°25) — repérage, déplacements codés, initiation à la programmation.
 * L'enfant écrit un programme (flèches absolues au CE1 facile ; « avancer / quart de tour » ensuite ;
 * boucles « répéter n fois [ … ] » en CM2 pour aller plus loin), puis le robot l'exécute pas à pas.
 * Plusieurs programmes conviennent : on SIMULE celui de l'enfant.
 * Facile : le chemin prévu s'affiche pendant qu'on écrit, 3 essais. Normal : 2 essais.
 * Plus loin : 1 essai, bonus si le programme est aussi court que possible.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import type { GeometryItem, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { useAutoSpeak } from '@/games/_kit/session';
import { Hud } from '@/games/_kit/ui';
import { vibrate } from '@/services/sfx';
import { cle } from '../_geometrie-commun/grille';
import {
  type Bloc,
  type Instr,
  type PlanRobot,
  type Simulation,
  VERS_DIR,
  aUneBoucle,
  deplier,
  ecrireProgramme,
  estRobot,
  lireProgramme,
  lireRobot,
  simuler,
  tailleProgramme,
} from '../_geometrie-commun/robot';
import { Bravo, Consigne, EnTete, Indice, pl } from '../_geometrie-commun/ui';
import { useManches } from '../_geometrie-commun/useManches';
import { bravo, dansUnChamp, useBoucle, useRng } from '../_nombres-commun/outils';
import { Correction, PasDeQuestion } from '../_nombres-commun/ui';

const MANCHES: Record<Level, number> = { facile: 5, normal: 6, plus_loin: 6 };
const ESSAIS: Record<Level, number> = { facile: 3, normal: 2, plus_loin: 1 };
const S = 64;
const MAX_INSTR = 30;

const LIBELLES: Record<Instr, { court: string; long: string; touche: string }> = {
  A: { court: 'A', long: 'Avancer', touche: 'A ou ↑' },
  G: { court: '↺', long: 'Quart de tour à gauche', touche: 'G ou ←' },
  D: { court: '↻', long: 'Quart de tour à droite', touche: 'D ou →' },
  '↑': { court: '↑', long: 'Haut', touche: '↑' },
  '→': { court: '→', long: 'Droite', touche: '→' },
  '↓': { court: '↓', long: 'Bas', touche: '↓' },
  '←': { court: '←', long: 'Gauche', touche: '←' },
};
const DIT: Record<Instr, string> = {
  A: 'avance',
  G: 'quart de tour à gauche',
  D: 'quart de tour à droite',
  '↑': 'haut',
  '→': 'droite',
  '↓': 'bas',
  '←': 'gauche',
};

const MESSAGES_ECHEC: Record<Simulation['issue'], string> = {
  cible: '',
  obstacle: 'Boum ! Le robot a heurté un rocher.',
  sortie: 'Le robot allait sortir du quadrillage : il s’est arrêté au bord.',
  'pas-arrive': 'Le programme est fini, mais le robot n’est pas sur le trésor.',
  depasse: 'Le robot est passé sur le trésor, mais il ne s’y est pas arrêté.',
};

export default function RobotCodeur(props: GameProps) {
  const { level, paused, sfx, speech, lectureAuto } = props;
  const rng = useRng();
  const m = useManches(props, estRobot, {
    manches: MANCHES,
    fin: (g, j, n) =>
      g
        ? 'Tous les trésors sont trouvés ! Tu es un as du code ! 🏆'
        : `${j} ${pl(j, 'trésor trouvé', 'trésors trouvés')} sur ${n} !`,
    autoSuivant: 1800,
  });
  const { item } = m;
  useAutoSpeak(speech, item?.prompt ?? null, m.manche, lectureAuto && !paused);
  if (!item) {
    return <PasDeQuestion texte="Cette leçon n’a pas de robot à programmer." onFin={m.abandonner} />;
  }
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <EnTete icone="💎" manche={m.manche} N={m.N} justes={m.stats.correct}>
        <Hud>⭐ {m.score}</Hud>
      </EnTete>
      <Manche
        key={m.manche}
        item={item}
        level={level}
        paused={paused}
        phase={m.phase}
        sfx={sfx}
        felicitation={bravo(rng)}
        onValider={m.valider}
        onSuivant={m.suivant}
      />
    </div>
  );
}

/** Le robot, toujours debout ; une flèche jaune et ses yeux montrent la direction (angle en degrés). */
function Robot({ triste, angle }: { triste: boolean; angle: number }) {
  const a = (angle * Math.PI) / 180;
  const [ox, oy] = [Math.sin(a) * 2.2, -Math.cos(a) * 2.2];
  return (
    <g>
      <g transform={`rotate(${angle})`}>
        <path
          d="M0 -40 L -9 -29 L 9 -29 Z"
          fill="#FFD45C"
          stroke="#24304A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>
      <rect x="-18" y="-4" width="36" height="22" rx="8" fill="#4FC3F7" stroke="#24304A" strokeWidth="3" />
      <rect x="-14" y="-24" width="28" height="22" rx="8" fill="#E8F6FF" stroke="#24304A" strokeWidth="3" />
      <circle cx={-6 + ox} cy={-14 + oy} r="3.5" fill="#24304A" />
      <circle cx={6 + ox} cy={-14 + oy} r="3.5" fill="#24304A" />
      <path
        d={triste ? 'M-5 -5 Q 0 -9 5 -5' : 'M-5 -7 Q 0 -3 5 -7'}
        stroke="#24304A"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="0" cy="7" r="4" fill="#FFD45C" stroke="#24304A" strokeWidth="2" />
      <rect x="-23" y="4" width="6" height="13" rx="3" fill="#24304A" />
      <rect x="17" y="4" width="6" height="13" rx="3" fill="#24304A" />
    </g>
  );
}

function Rocher() {
  return (
    <g>
      <path
        d="M-24 16 Q -26 -4 -12 -12 Q -2 -22 12 -14 Q 26 -8 24 16 Z"
        fill="#9AA3B5"
        stroke="#5A6378"
        strokeWidth="3"
      />
      <path d="M-10 -6 Q -4 -10 2 -6" stroke="#C9D0DE" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Tresor({ ouvert }: { ouvert: boolean }) {
  return (
    <g>
      <rect x="-22" y="-6" width="44" height="24" rx="4" fill="#C77B3A" stroke="#6B3D17" strokeWidth="3" />
      <rect x="-22" y="-6" width="44" height="6" fill="#E0A458" />
      <g transform={ouvert ? 'translate(0 -16) rotate(-18)' : undefined}>
        <path d="M-22 -6 Q 0 -24 22 -6 Z" fill="#E0A458" stroke="#6B3D17" strokeWidth="3" />
      </g>
      <rect x="-4" y="-2" width="8" height="10" rx="2" fill="#FFD45C" stroke="#6B3D17" strokeWidth="2" />
      {ouvert && (
        <>
          <circle cx="-8" cy="-12" r="5" fill="#FFD45C" />
          <circle cx="6" cy="-14" r="5" fill="#8E7CFF" />
          <circle cx="0" cy="-20" r="5" fill="#7BD389" />
        </>
      )}
    </g>
  );
}

function Tuile({ i, actif, petit = false }: { i: Instr; actif?: boolean; petit?: boolean }) {
  const relatif = i === 'A' || i === 'G' || i === 'D';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl border-2 font-titre font-extrabold ${
        petit ? 'h-9 min-w-9 px-1 text-lg' : 'h-11 min-w-11 px-1.5 text-2xl'
      } ${actif ? 'border-grape bg-grape text-white' : relatif ? 'border-sky-dark/40 bg-sky/20' : 'border-grass-dark/40 bg-grass/25'}`}
      aria-label={DIT[i]}
    >
      {LIBELLES[i].court}
    </span>
  );
}

function Manche({
  item,
  level,
  paused,
  phase,
  sfx,
  felicitation,
  onValider,
  onSuivant,
}: {
  item: GeometryItem;
  level: Level;
  paused: boolean;
  phase: string;
  sfx: GameProps['sfx'];
  felicitation: string;
  onValider: (correct: boolean, donne: string, attendu: string, points?: number) => void;
  onSuivant: () => void;
}) {
  const reduce = useReducedMotion();
  const plan = useMemo(() => lireRobot(item)!, [item]) as PlanRobot;
  const palette: Instr[] = plan.relatif ? ['A', 'G', 'D'] : ['↑', '→', '↓', '←'];
  const [blocs, setBlocs] = useState<Bloc[]>([]);
  const [boucleOuverte, setBoucleOuverte] = useState<{ n: number; corps: Instr[] } | null>(null);
  const [essais, setEssais] = useState(ESSAIS[level]);
  const [execution, setExecution] = useState<{ sim: Simulation; t: number } | null>(null);
  const [echec, setEchec] = useState<string | null>(null);
  const [astuce, setAstuce] = useState<string | null>(null);
  const actif = phase === 'jeu' && !paused && !execution;

  const programme = useMemo(
    () => (boucleOuverte ? [...blocs, { type: 'boucle' as const, ...boucleOuverte }] : blocs),
    [blocs, boucleOuverte],
  );
  const deplie = useMemo(() => deplier(programme), [programme]);
  const apercu = useMemo(() => (level === 'facile' ? simuler(plan, deplie) : null), [level, plan, deplie]);

  const ajouter = useCallback(
    (i: Instr) => {
      if (!actif) return;
      setEchec(null);
      if (tailleProgramme(programme) >= MAX_INSTR) return;
      sfx.play('tic');
      if (boucleOuverte) setBoucleOuverte({ ...boucleOuverte, corps: [...boucleOuverte.corps, i] });
      else setBlocs((b) => [...b, { type: 'instr', i }]);
    },
    [actif, programme, boucleOuverte, sfx],
  );

  const effacer = useCallback(() => {
    if (!actif) return;
    setEchec(null);
    if (boucleOuverte) {
      if (boucleOuverte.corps.length)
        setBoucleOuverte({ ...boucleOuverte, corps: boucleOuverte.corps.slice(0, -1) });
      else setBoucleOuverte(null);
    } else setBlocs((b) => b.slice(0, -1));
  }, [actif, boucleOuverte]);

  const fermerBoucle = useCallback(() => {
    if (!boucleOuverte) return;
    if (boucleOuverte.corps.length) setBlocs((b) => [...b, { type: 'boucle', ...boucleOuverte }]);
    setBoucleOuverte(null);
  }, [boucleOuverte]);

  const lancer = useCallback(() => {
    if (!actif || !deplie.length) return;
    const blocsFinaux = boucleOuverte?.corps.length ? programme : blocs;
    if (boucleOuverte) fermerBoucle();
    setEchec(null);
    setAstuce(null);
    sfx.play('monte');
    setExecution({ sim: simuler(plan, deplier(blocsFinaux)), t: 0 });
  }, [actif, deplie, boucleOuverte, programme, blocs, fermerBoucle, sfx, plan]);

  // Exécution animée, pas à pas (figée pendant la pause).
  const vitesse = reduce ? 0.12 : level === 'facile' ? 0.55 : 0.42; // secondes par pas
  const nbPas = execution ? execution.sim.pas.length - 1 : 0;
  useBoucle(!!execution && !paused && execution.t < nbPas + 0.6, (dt) => {
    setExecution((e) => {
      if (!e) return e;
      const t = e.t + dt / vitesse;
      if (Math.floor(t) > Math.floor(e.t) && Math.floor(t) <= nbPas) sfx.play('tic');
      return { ...e, t };
    });
  });

  // Fin de l'exécution
  useEffect(() => {
    if (!execution || execution.t < nbPas + 0.6 || phase !== 'jeu') return;
    const { sim } = execution;
    const texte = ecrireProgramme(blocs);
    if (sim.issue === 'cible') {
      const court = plan.longueurMini !== null && deplie.length <= plan.longueurMini;
      const points = level === 'plus_loin' && court ? 1.3 : 1;
      if (plan.boucles && !aUneBoucle(blocs))
        setAstuce('Astuce : avec « répéter … fois », ton programme serait plus court !');
      onValider(true, texte, plan.exemple, points);
      return;
    }
    vibrate([40, 40, 60]);
    sfx.play('faux');
    if (essais > 1) {
      setEssais((e) => e - 1);
      setEchec(MESSAGES_ECHEC[sim.issue]);
      setExecution(null);
      return;
    }
    setEchec(MESSAGES_ECHEC[sim.issue]);
    onValider(false, texte, plan.exemple);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execution, nbPas]);

  // Clavier
  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      const k = e.key;
      const rel: Record<string, Instr> = {
        a: 'A',
        A: 'A',
        ArrowUp: 'A',
        g: 'G',
        G: 'G',
        ArrowLeft: 'G',
        d: 'D',
        D: 'D',
        ArrowRight: 'D',
      };
      const abs: Record<string, Instr> = { ArrowUp: '↑', ArrowRight: '→', ArrowDown: '↓', ArrowLeft: '←' };
      const instr = plan.relatif ? rel[k] : abs[k];
      if (instr) {
        e.preventDefault();
        ajouter(instr);
      } else if (k === 'Backspace') {
        e.preventDefault();
        effacer();
      } else if (k === 'Enter') {
        e.preventDefault();
        lancer();
      } else if ((k === 'r' || k === 'R') && plan.boucles && !boucleOuverte) {
        e.preventDefault();
        setBoucleOuverte({ n: 3, corps: [] });
      } else if ((k === ']' || k === 'Escape') && boucleOuverte) {
        e.preventDefault();
        fermerBoucle();
      } else if (boucleOuverte && /^[2-9]$/.test(k)) {
        e.preventDefault();
        setBoucleOuverte({ ...boucleOuverte, n: Number(k) });
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif, plan, ajouter, effacer, lancer, boucleOuverte, fermerBoucle]);

  // Position affichée du robot
  const pasCourant = execution ? Math.max(0, Math.min(nbPas, Math.floor(execution.t))) : 0;
  const frac = execution ? Math.min(1, execution.t - pasCourant) : 0;
  const etats = execution?.sim.pas ?? [{ x: plan.depart[0], y: plan.depart[1], d: plan.orientation }];
  const a = etats[pasCourant]!;
  const b = etats[Math.min(pasCourant + 1, etats.length - 1)]!;
  const lisse = reduce ? 1 : frac;
  const rx = a.x + (b.x - a.x) * lisse;
  const ry = a.y + (b.y - a.y) * lisse;
  // rotation : on prend le plus court chemin entre deux orientations
  let dd = b.d - a.d;
  if (dd > 2) dd -= 4;
  if (dd < -2) dd += 4;
  const angle = (a.d + dd * lisse) * 90;
  const fini = execution && execution.t >= nbPas;
  const bloque =
    fini && execution && (execution.sim.issue === 'obstacle' || execution.sim.issue === 'sortie');
  const bosse =
    bloque && execution.sim.bloqueSur
      ? 0.22 * Math.sin(Math.min(1, (execution.t - nbPas) / 0.6) * Math.PI)
      : 0;
  const bx = bloque && execution?.sim.bloqueSur ? (execution.sim.bloqueSur[0] - b.x) * bosse : 0;
  const by = bloque && execution?.sim.bloqueSur ? (execution.sim.bloqueSur[1] - b.y) * bosse : 0;

  const trace = execution ? execution.sim.pas.slice(0, pasCourant + 1) : [];
  const exemple = useMemo(() => simuler(plan, deplier(lireProgramme(plan.exemple))), [plan]);
  const W = plan.cols * S;
  const H = plan.rows * S;
  const obst = new Set(plan.obstacles.map(cle));
  const juste = phase === 'juste';
  const faux = phase === 'faux';
  const instrActive = execution && pasCourant < nbPas ? pasCourant : -1;

  // Correspondance instruction dépliée → tuile affichée (surbrillance pendant l'exécution)
  const tuilesActives = useMemo(() => {
    const map: { bloc: number; k: number }[] = [];
    programme.forEach((bl, bi) => {
      if (bl.type === 'instr') map.push({ bloc: bi, k: -1 });
      else for (let r = 0; r < bl.n; r++) bl.corps.forEach((_, k) => map.push({ bloc: bi, k }));
    });
    return map;
  }, [programme]);
  const active = instrActive >= 0 ? tuilesActives[instrActive] : undefined;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <div className="flex flex-col gap-3 lg:w-[54%]">
        <Consigne
          texte={
            plan.relatif
              ? `Programme le robot : il regarde ${VERS_DIR[plan.orientation]}.`
              : 'Programme le robot avec les flèches.'
          }
          aDire={item.prompt}
        />
        <section
          className="overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-grass/40 to-grass/15 shadow-soft"
          aria-label="Le terrain du robot"
        >
          <svg
            viewBox={`-8 -8 ${W + 16} ${H + 16}`}
            className="mx-auto block h-auto max-h-[56vh] w-full select-none"
            role="img"
            aria-label={`Quadrillage de ${plan.cols} colonnes et ${plan.rows} lignes. Le robot part de la colonne ${plan.depart[0] + 1}, ligne ${plan.depart[1] + 1}. Le trésor est colonne ${plan.cible[0] + 1}, ligne ${plan.cible[1] + 1}. ${plan.obstacles.length} rochers.`}
          >
            {Array.from({ length: plan.rows }, (_, y) =>
              Array.from({ length: plan.cols }, (_, x) => (
                <rect
                  key={`${x},${y}`}
                  x={x * S}
                  y={y * S}
                  width={S}
                  height={S}
                  fill={(x + y) % 2 ? '#BFE8B0' : '#D3F0C6'}
                  stroke="#8CC97B"
                  strokeWidth="1.5"
                />
              )),
            )}
            {/* chemin prévu (Facile) */}
            {apercu && !execution && apercu.pas.length > 1 && (
              <polyline
                points={apercu.pas.map((p) => `${p.x * S + S / 2},${p.y * S + S / 2}`).join(' ')}
                fill="none"
                stroke="#8E7CFF"
                strokeWidth="5"
                strokeDasharray="2 10"
                strokeLinecap="round"
                opacity="0.8"
              />
            )}
            {/* trace de l'exécution */}
            {trace.length > 1 && (
              <polyline
                points={trace.map((p) => `${p.x * S + S / 2},${p.y * S + S / 2}`).join(' ')}
                fill="none"
                stroke="#FFD45C"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />
            )}
            {/* programme exemple après la correction */}
            {faux && exemple.issue === 'cible' && (
              <polyline
                points={exemple.pas.map((p) => `${p.x * S + S / 2},${p.y * S + S / 2}`).join(' ')}
                fill="none"
                stroke="#2E8C48"
                strokeWidth="6"
                strokeDasharray="12 8"
                strokeLinecap="round"
              />
            )}
            {[...obst].map((k) => {
              const [x, y] = k.split(',').map(Number) as [number, number];
              return (
                <g key={k} transform={`translate(${x * S + S / 2} ${y * S + S / 2 + 4})`}>
                  <Rocher />
                </g>
              );
            })}
            <g transform={`translate(${plan.cible[0] * S + S / 2} ${plan.cible[1] * S + S / 2 + 4})`}>
              <Tresor ouvert={juste} />
            </g>
            <g transform={`translate(${(rx + bx) * S + S / 2} ${(ry + by) * S + S / 2 + 4})`}>
              <Robot triste={!!bloque} angle={angle} />
            </g>
            {juste && !reduce && (
              <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -10 }}>
                {[-1, 0, 1].map((k) => (
                  <text
                    key={k}
                    x={plan.cible[0] * S + S / 2 + k * 26}
                    y={plan.cible[1] * S - 4 - (k === 0 ? 14 : 0)}
                    textAnchor="middle"
                    fontSize="26"
                  >
                    ⭐
                  </text>
                ))}
              </motion.g>
            )}
          </svg>
        </section>
      </div>

      <div className="carte flex min-w-0 flex-1 flex-col gap-3 p-4">
        <h2 className="text-xl">Mon programme</h2>
        <div
          className="flex min-h-[4.5rem] flex-wrap items-center gap-1.5 rounded-2xl border-2 border-dashed border-ink/20 bg-cream p-2"
          aria-label={`Programme : ${ecrireProgramme(programme) || 'vide'}`}
          aria-live="polite"
        >
          {!programme.length && <span className="text-ink-soft">Touche les instructions ci-dessous…</span>}
          <AnimatePresence initial={false}>
            {programme.map((bl, bi) =>
              bl.type === 'instr' ? (
                <motion.span key={bi} initial={reduce ? false : { scale: 0.4 }} animate={{ scale: 1 }}>
                  <Tuile i={bl.i} actif={active?.bloc === bi} />
                </motion.span>
              ) : (
                <motion.span
                  key={bi}
                  initial={reduce ? false : { scale: 0.6 }}
                  animate={{ scale: 1 }}
                  className={`inline-flex flex-wrap items-center gap-1 rounded-2xl border-2 px-2 py-1 ${
                    boucleOuverte && bi === programme.length - 1
                      ? 'border-grape bg-grape/10'
                      : 'border-sun-dark/50 bg-sun/20'
                  }`}
                >
                  <span className="font-titre font-bold">🔁 répéter {bl.n} fois [</span>
                  {bl.corps.map((i, k) => (
                    <Tuile key={k} i={i} petit actif={active?.bloc === bi && active.k === k} />
                  ))}
                  {boucleOuverte && bi === programme.length - 1 && (
                    <span className="animate-pulse font-bold">…</span>
                  )}
                  <span className="font-titre font-bold">]</span>
                </motion.span>
              ),
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Instructions">
          {palette.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => ajouter(i)}
              disabled={!actif}
              className={`btn-3d flex min-h-btn min-w-[4.5rem] flex-col items-center justify-center px-3 py-1 ${
                plan.relatif ? 'bg-sky-dark text-white' : 'bg-grass-dark text-white'
              }`}
              aria-label={`${LIBELLES[i].long} (touche ${LIBELLES[i].touche})`}
            >
              <span className="text-3xl leading-none">{LIBELLES[i].court}</span>
              {plan.relatif && <span className="text-xs font-bold">{LIBELLES[i].long}</span>}
            </button>
          ))}
        </div>

        {plan.boucles && (
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-sun/15 p-2">
            {!boucleOuverte ? (
              <Button
                variant="sun"
                onClick={() => actif && setBoucleOuverte({ n: 3, corps: [] })}
                disabled={!actif}
              >
                🔁 Répéter… (R)
              </Button>
            ) : (
              <>
                <span className="font-bold">Répéter</span>
                <Button
                  variant="blanc"
                  aria-label="Une fois de moins"
                  onClick={() => setBoucleOuverte({ ...boucleOuverte, n: Math.max(2, boucleOuverte.n - 1) })}
                >
                  −
                </Button>
                <span className="font-titre text-2xl font-extrabold" aria-live="polite">
                  {boucleOuverte.n}
                </span>
                <Button
                  variant="blanc"
                  aria-label="Une fois de plus"
                  onClick={() => setBoucleOuverte({ ...boucleOuverte, n: Math.min(9, boucleOuverte.n + 1) })}
                >
                  +
                </Button>
                <span className="font-bold">fois</span>
                <Button variant="sun" onClick={fermerBoucle}>
                  Fermer ]
                </Button>
              </>
            )}
          </div>
        )}

        {phase === 'jeu' && (
          <>
            {level === 'facile' && !echec && <Indice>Le chemin violet montre où ira le robot.</Indice>}
            {echec && (
              <p className="rounded-2xl bg-coral/10 p-2 text-center font-bold" role="status">
                {echec} Presque ! Corrige ton programme et relance-le ({essais} essai{essais > 1 ? 's' : ''}).
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="blanc" onClick={effacer} disabled={!actif || !programme.length}>
                ⌫ Effacer
              </Button>
              <Button
                variant="blanc"
                onClick={() => {
                  setBlocs([]);
                  setBoucleOuverte(null);
                }}
                disabled={!actif || !programme.length}
              >
                Tout effacer
              </Button>
              <Button variant="grass" size="lg" onClick={lancer} disabled={!actif || !deplie.length}>
                ▶ Lancer
              </Button>
            </div>
            <p className="text-center text-sm font-bold text-ink-soft">
              Clavier : {plan.relatif ? 'A (↑) avancer, G (←) et D (→) tourner' : 'flèches'}, ⌫ effacer,
              Entrée lancer
              {plan.boucles ? ', R répéter, ] fermer' : ''}.
            </p>
          </>
        )}
        {juste && (
          <>
            <Bravo texte={`${felicitation} Le trésor est à toi !`} />
            {astuce && <p className="text-center font-bold text-ink-soft">{astuce}</p>}
          </>
        )}
        <Correction
          ouvert={faux}
          titre={`${echec ?? ''} Presque !`}
          bonne={plan.exemple}
          aDire={`Un programme qui marche : ${deplier(lireProgramme(plan.exemple))
            .map((i) => DIT[i])
            .join(', ')}. ${item.explication}`}
          explication={item.explication}
          onContinuer={onSuivant}
        >
          <p className="mt-1 text-sm">
            C’est un programme qui marche (il y en a d’autres). Son chemin est dessiné en vert pointillé sur
            le quadrillage.
          </p>
        </Correction>
      </div>
    </div>
  );
}
