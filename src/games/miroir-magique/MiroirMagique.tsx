/**
 * Le Miroir magique (CATALOGUE n°22) — symétrie axiale sur quadrillage.
 * L'axe est un miroir qui scintille. L'enfant colorie les cases symétriques ; s'il a juste, la figure
 * bat des ailes comme un papillon et s'envole.
 * Facile : distances au miroir écrites le long du quadrillage, 3 essais. Normal : 2 essais.
 * Plus loin : 1 seul essai, sans repère (et des figures à cheval sur l'axe, données par le contenu).
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import type { GeometryItem, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { useAutoSpeak } from '@/games/_kit/session';
import { Hud } from '@/games/_kit/ui';
import {
  type Axe,
  type Cell,
  axeDe,
  cle,
  distanceAxe,
  estSymetrie,
  solutionSymetrie,
  trier,
} from '../_geometrie-commun/grille';
import { Bravo, Consigne, EnTete, Indice } from '../_geometrie-commun/ui';
import { useManches } from '../_geometrie-commun/useManches';
import { bravo, dansUnChamp, useBoucle, useRng } from '../_nombres-commun/outils';
import { Correction, PasDeQuestion } from '../_nombres-commun/ui';

const MANCHES: Record<Level, number> = { facile: 5, normal: 6, plus_loin: 7 };
const ESSAIS: Record<Level, number> = { facile: 3, normal: 2, plus_loin: 1 };
const S = 48; // côté d'une case (unités du viewBox)
const M = 30; // marge (repères)

/** Rotation qui rend l'axe vertical (pour l'animation des ailes). */
const ROT: Record<Axe, number> = { vertical: 0, horizontal: 90, diagonale: 45, 'anti-diagonale': -45 };

function ligneAxe(axe: Axe, cols: number, rows: number): [number, number, number, number] {
  const [w, h] = [cols * S, rows * S];
  if (axe === 'vertical') return [w / 2, -12, w / 2, h + 12];
  if (axe === 'horizontal') return [-12, h / 2, w + 12, h / 2];
  if (axe === 'diagonale') return [-10, -10, w + 10, h + 10];
  return [w + 10, -10, -10, h + 10];
}

export default function MiroirMagique(props: GameProps) {
  const { level, paused, sfx, speech, lectureAuto } = props;
  const rng = useRng();
  const m = useManches(props, estSymetrie, {
    manches: MANCHES,
    fin: (g, j, n) => (g ? 'Tous les papillons se sont envolés ! 🦋' : `${j} papillons envolés sur ${n} !`),
    autoSuivant: 2300,
  });
  const { item } = m;
  useAutoSpeak(speech, item?.prompt ?? null, m.manche, lectureAuto && !paused);

  if (!item) {
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de quadrillage à compléter par symétrie."
        onFin={m.abandonner}
      />
    );
  }
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <EnTete icone="🦋" manche={m.manche} N={m.N} justes={m.stats.correct}>
        <Hud>⭐ {m.score}</Hud>
      </EnTete>
      <Manche
        key={m.manche}
        item={item}
        level={level}
        paused={paused}
        phase={m.phase}
        sfx={sfx}
        message={bravo(rng)}
        onValider={m.valider}
        onSuivant={m.suivant}
      />
    </div>
  );
}

function Manche({
  item,
  level,
  paused,
  phase,
  sfx,
  message,
  onValider,
  onSuivant,
}: {
  item: GeometryItem;
  level: Level;
  paused: boolean;
  phase: string;
  sfx: GameProps['sfx'];
  message: string;
  onValider: (correct: boolean, donne: string, attendu: string) => void;
  onSuivant: () => void;
}) {
  const reduce = useReducedMotion();
  const g = item.grid!;
  const axe = axeDe(item)!;
  const solution = useMemo(() => solutionSymetrie(item), [item]);
  const donnees = useMemo(() => new Set(g.cells.map((c) => cle(c))), [g]);
  const solSet = useMemo(() => new Set(solution.map(cle)), [solution]);
  const [choix, setChoix] = useState<Set<string>>(() => new Set());
  const [curseur, setCurseur] = useState<Cell>(() => [Math.floor(g.cols / 2), Math.floor(g.rows / 2)]);
  const [clavier, setClavier] = useState(false);
  const [essais, setEssais] = useState(ESSAIS[level]);
  const [marques, setMarques] = useState<{ faux: string[]; manque: number } | null>(null);
  const [vol, setVol] = useState(0); // 0 → 1 : animation du papillon
  const actif = phase === 'jeu' && !paused;
  const W = g.cols * S;
  const H = g.rows * S;

  const basculer = useCallback(
    (c: Cell) => {
      if (!actif) return;
      const k = cle(c);
      if (donnees.has(k)) {
        sfx.play('tic');
        return;
      }
      setMarques(null);
      setChoix((s) => {
        const n = new Set(s);
        if (n.has(k)) n.delete(k);
        else n.add(k);
        return n;
      });
      sfx.play('pop');
    },
    [actif, donnees, sfx],
  );

  const verifier = useCallback(() => {
    if (!actif || !choix.size) return;
    const faux = [...choix].filter((k) => !solSet.has(k));
    const manque = solution.filter((c) => !choix.has(cle(c))).length;
    const donne = trier([...choix].map((k) => k.split(',').map(Number) as Cell))
      .map(cle)
      .join(';');
    const attendu = solution.map(cle).join(';');
    if (!faux.length && !manque) {
      onValider(true, donne, attendu);
      return;
    }
    if (essais > 1) {
      setEssais((e) => e - 1);
      setMarques({ faux, manque });
      sfx.play('faux');
      return;
    }
    onValider(false, donne, attendu);
  }, [actif, choix, solSet, solution, essais, onValider, sfx]);

  // Clavier : flèches pour se déplacer, Entrée ou Espace pour colorier, V pour vérifier.
  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      const d: Record<string, Cell> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      if (d[e.key]) {
        e.preventDefault();
        setClavier(true);
        setCurseur(([x, y]) => [
          Math.min(g.cols - 1, Math.max(0, x + d[e.key]![0])),
          Math.min(g.rows - 1, Math.max(0, y + d[e.key]![1])),
        ]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setClavier(true);
        basculer(curseur);
      } else if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        verifier();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif, g, curseur, basculer, verifier]);

  // Le papillon bat des ailes puis s'envole (figé pendant la pause).
  useBoucle(phase === 'juste' && !paused && vol < 1, (dt) => setVol((v) => Math.min(1, v + dt / 2)));

  const juste = phase === 'juste';
  const faux = phase === 'faux';
  const [cx, cy] = [W / 2, H / 2];
  const r = ROT[axe];
  const ailes = reduce ? 1 : 1 - 0.75 * Math.abs(Math.sin(vol * Math.PI * 3));
  const envol = reduce ? 0 : Math.max(0, vol - 0.35) * 1.6;
  const transfoAiles = juste
    ? `translate(0 ${-envol * H * 0.9}) rotate(${-r} ${cx} ${cy}) translate(${cx} ${cy}) scale(${ailes} 1) translate(${-cx} ${-cy}) rotate(${r} ${cx} ${cy})`
    : undefined;
  const [ax1, ay1, ax2, ay2] = ligneAxe(axe, g.cols, g.rows);

  const repere = level === 'facile';
  const casesRepere = repere
    ? axe === 'vertical'
      ? Array.from({ length: g.cols }, (_, x) => ({
          x: x * S + S / 2,
          y: -10,
          t: distanceAxe(axe, g.cols, g.rows, [x, 0]),
        }))
      : axe === 'horizontal'
        ? Array.from({ length: g.rows }, (_, y) => ({
            x: -14,
            y: y * S + S / 2 + 6,
            t: distanceAxe(axe, g.cols, g.rows, [0, y]),
          }))
        : []
    : [];

  const toutes: Cell[] = [];
  for (let y = 0; y < g.rows; y++) for (let x = 0; x < g.cols; x++) toutes.push([x, y]);

  return (
    <>
      <Consigne texte={item.prompt} />
      <section
        className="overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-grape/25 via-sky/15 to-cream shadow-soft"
        aria-label="Le quadrillage du miroir magique"
      >
        <svg
          viewBox={`${-M} ${-M} ${W + 2 * M} ${H + 2 * M}`}
          className="mx-auto block h-auto max-h-[62vh] w-full touch-manipulation select-none"
          role="img"
          aria-label={`Quadrillage de ${g.cols} colonnes et ${g.rows} lignes, axe ${axe}, ${choix.size} case${choix.size > 1 ? 's' : ''} coloriée${choix.size > 1 ? 's' : ''}`}
        >
          <defs>
            <radialGradient id="miroir-aile" cx="0.3" cy="0.3" r="0.9">
              <stop offset="0" stopColor="#B4A8FF" />
              <stop offset="1" stopColor="#7B63F2" />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={W} height={H} rx="10" fill="#FFFFFF" opacity="0.92" />
          {/* cases (cibles tactiles) */}
          {toutes.map(([x, y]) => {
            const k = `${x},${y}`;
            const choisie = choix.has(k);
            const marqueFaux = marques?.faux.includes(k);
            return (
              <rect
                key={k}
                data-case={k}
                x={x * S + 1}
                y={y * S + 1}
                width={S - 2}
                height={S - 2}
                rx="6"
                fill={
                  juste && choisie
                    ? 'transparent'
                    : choisie
                      ? marqueFaux
                        ? '#FF9A8E'
                        : '#FFC93C'
                      : faux && solSet.has(k)
                        ? '#BDECC6'
                        : 'transparent'
                }
                stroke={faux && solSet.has(k) ? '#2E8C48' : 'none'}
                strokeWidth={3}
                strokeDasharray={faux && solSet.has(k) && !choisie ? '6 4' : undefined}
                onClick={() => {
                  setClavier(false);
                  setCurseur([x, y]);
                  basculer([x, y]);
                }}
                className={actif && !donnees.has(k) ? 'cursor-pointer' : ''}
              />
            );
          })}
          {/* quadrillage */}
          {Array.from({ length: g.cols + 1 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * S}
              y1={0}
              x2={i * S}
              y2={H}
              stroke="#9AA8C7"
              strokeWidth="1.5"
              pointerEvents="none"
            />
          ))}
          {Array.from({ length: g.rows + 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * S}
              x2={W}
              y2={i * S}
              stroke="#9AA8C7"
              strokeWidth="1.5"
              pointerEvents="none"
            />
          ))}
          {/* croix sur les cases fausses */}
          {marques?.faux.map((k) => {
            const [x, y] = k.split(',').map(Number) as Cell;
            return (
              <g key={`x${k}`} pointerEvents="none" stroke="#CD3E30" strokeWidth="4" strokeLinecap="round">
                <line x1={x * S + 14} y1={y * S + 14} x2={x * S + S - 14} y2={y * S + S - 14} />
                <line x1={x * S + S - 14} y1={y * S + 14} x2={x * S + 14} y2={y * S + S - 14} />
              </g>
            );
          })}
          {/* la figure (et le papillon quand c'est juste) */}
          <g
            transform={transfoAiles}
            opacity={juste ? Math.max(0, 1 - Math.max(0, vol - 0.75) * 4) : 1}
            pointerEvents="none"
          >
            {g.cells.map(([x, y]) => (
              <rect
                key={`d${x},${y}`}
                x={x * S + 1}
                y={y * S + 1}
                width={S - 2}
                height={S - 2}
                rx="6"
                fill="url(#miroir-aile)"
              />
            ))}
            {juste &&
              [...choix].map((k) => {
                const [x, y] = k.split(',').map(Number) as Cell;
                return (
                  <rect
                    key={`c${k}`}
                    x={x * S + 1}
                    y={y * S + 1}
                    width={S - 2}
                    height={S - 2}
                    rx="6"
                    fill="#FFC93C"
                  />
                );
              })}
          </g>
          {/* le miroir */}
          <motion.line
            x1={ax1}
            y1={ay1}
            x2={ax2}
            y2={ay2}
            stroke="#8FD3FF"
            strokeWidth="16"
            strokeLinecap="round"
            pointerEvents="none"
            initial={{ opacity: 0.45 }}
            animate={reduce || paused ? { opacity: 0.45 } : { opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
          <line
            x1={ax1}
            y1={ay1}
            x2={ax2}
            y2={ay2}
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.9"
            pointerEvents="none"
          />
          <line
            x1={ax1}
            y1={ay1}
            x2={ax2}
            y2={ay2}
            stroke="#4FA3F7"
            strokeWidth="3"
            strokeDasharray="10 7"
            pointerEvents="none"
          />
          {/* repères de distance (Facile) */}
          {casesRepere.map((c, i) => (
            <text
              key={i}
              x={c.x}
              y={c.y}
              textAnchor="middle"
              fontSize="20"
              fontWeight="800"
              fill="#6048DC"
              fontFamily="Baloo 2, sans-serif"
            >
              {c.t}
            </text>
          ))}
          {/* curseur clavier */}
          {clavier && actif && (
            <rect
              x={curseur[0] * S - 2}
              y={curseur[1] * S - 2}
              width={S + 4}
              height={S + 4}
              rx="8"
              fill="none"
              stroke="#8E7CFF"
              strokeWidth="5"
              pointerEvents="none"
            />
          )}
          {juste && !reduce && vol > 0.5 && (
            <text
              x={cx}
              y={cy - (vol - 0.5) * H * 2}
              textAnchor="middle"
              fontSize="64"
              opacity={1 - Math.max(0, vol - 0.85) * 6}
            >
              🦋
            </text>
          )}
        </svg>
      </section>

      <div className="carte flex flex-col items-center gap-3 p-4">
        {phase === 'jeu' && (
          <>
            {level === 'facile' && !marques && (
              <Indice>
                Les nombres disent à combien de cases du miroir tu es. Le reflet est à la même distance, de
                l’autre côté.
              </Indice>
            )}
            {marques && (
              <p className="text-center text-lg font-bold" role="status">
                Presque !{' '}
                {marques.faux.length > 0 &&
                  `${marques.faux.length} case${marques.faux.length > 1 ? 's' : ''} marquée${marques.faux.length > 1 ? 's' : ''} d’une croix ne ${marques.faux.length > 1 ? 'sont' : 'est'} pas au bon endroit. `}
                {marques.manque > 0 && `Il manque ${marques.manque} case${marques.manque > 1 ? 's' : ''}. `}
                On réessaie ? ({essais} essai{essais > 1 ? 's' : ''})
              </p>
            )}
            <p className="text-center text-sm font-bold text-ink-soft">
              Touche les cases à colorier (ou flèches + Entrée), puis « Vérifier » (touche V).
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="blanc" onClick={() => setChoix(new Set())} disabled={!actif || !choix.size}>
                Tout effacer
              </Button>
              <Button variant="grass" size="lg" onClick={verifier} disabled={!actif || !choix.size}>
                🪞 Vérifier
              </Button>
            </div>
          </>
        )}
        {juste && <Bravo texte={`${message} Le papillon s’envole !`} />}
        <Correction
          ouvert={faux}
          titre="Presque ! Les bonnes cases sont entourées en vert."
          explication={item.explication}
          aDire={`Les bonnes cases sont entourées en vert. ${item.explication}`}
          onContinuer={onSuivant}
        />
      </div>
    </>
  );
}
