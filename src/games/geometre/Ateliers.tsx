/**
 * Ateliers du Géomètre :
 * - Figure : reconnaître / nommer une figure et ses propriétés, avec l'équerre et la règle virtuelles ;
 * - Points : placer un point sur les nœuds du quadrillage (milieu, parallèle, perpendiculaire, sommet) ;
 * - Reproduire : refaire une figure sur un quadrillage (sommets aux nœuds).
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import type { GeometryItem, Level } from '@/content/schemas';
import type { SfxService } from '@/services/sfx';
import { ChoiceGrid } from '@/games/_kit/ui';
import {
  type Dessin,
  angleDroit,
  cadre,
  dessinDe,
  groupesCotes,
  longueur,
  mesureAngle,
  pivoter,
} from '../_geometrie-commun/figures';
import { cle, lirePoints, lireReproduire, memeFigureTranslatee } from '../_geometrie-commun/grille';
import { Indice } from '../_geometrie-commun/ui';
import { type P, Papier, PointNomme, useCurseur } from './Papier';

export interface PropsAtelier {
  item: GeometryItem;
  level: Level;
  actif: boolean;
  phase: string;
  sfx: SfxService;
  onValider: (correct: boolean, donne: string, attendu: string, points?: number) => void;
}

export const ESSAIS: Record<Level, number> = { facile: 3, normal: 2, plus_loin: 1 };

const fr = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const add = (a: P, b: P, k = 1): P => [a[0] + b[0] * k, a[1] + b[1] * k];
const unit = (a: P, b: P): P => {
  const l = longueur(a, b) || 1;
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
};

/* ------------------------------------------------------------------ */
/* Figure                                                              */
/* ------------------------------------------------------------------ */

/** Petit carré de codage d'un angle droit en `s`, entre les directions de `a` et `b`. */
function CodeAngleDroit({ s, a, b, U }: { s: P; a: P; b: P; U: number }) {
  const k = 0.42;
  const u = unit(s, a);
  const v = unit(s, b);
  const p1 = add(s, u, k);
  const p2 = add(p1, v, k);
  const p3 = add(s, v, k);
  return (
    <polyline
      points={[p1, p2, p3].map(([x, y]) => `${x * U},${y * U}`).join(' ')}
      fill="none"
      stroke="#CD3E30"
      strokeWidth="3"
      pointerEvents="none"
    />
  );
}

/** L'équerre posée sur un sommet : un bord le long de [s a], l'autre du côté de b. */
function Equerre({ s, a, b, U }: { s: P; a: P; b: P; U: number }) {
  const u = unit(s, a);
  let v: P = [-u[1], u[0]];
  const w = unit(s, b);
  if (v[0] * w[0] + v[1] * w[1] < 0) v = [-v[0], -v[1]];
  const p1 = add(s, u, 2.2);
  const p2 = add(s, v, 1.5);
  const t = (p: P) => `${p[0] * U},${p[1] * U}`;
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} pointerEvents="none">
      <polygon
        points={`${t(s)} ${t(p1)} ${t(p2)}`}
        fill="#FFD45C"
        fillOpacity="0.55"
        stroke="#D69600"
        strokeWidth="3"
      />
      <polygon
        points={`${t(add(add(s, u, 0.45), v, 0.3))} ${t(add(s, u, 1.25))} ${t(add(add(s, v, 0.75), u, 0.3))}`}
        fill="#FFFDF7"
        fillOpacity="0.8"
        stroke="#D69600"
        strokeWidth="2"
      />
    </motion.g>
  );
}

function Badge({ p, texte, ok, U }: { p: P; texte: string; ok: boolean; U: number }) {
  const largeur = texte.length * 9.5 + 18;
  return (
    <g transform={`translate(${p[0] * U} ${p[1] * U})`} pointerEvents="none">
      <rect x={-largeur / 2} y={-17} width={largeur} height={30} rx={15} fill={ok ? '#2E8C48' : '#CD3E30'} />
      <text
        x={0}
        y={4}
        textAnchor="middle"
        fontSize="17"
        fontWeight="800"
        fill="#FFFFFF"
        fontFamily="Andika, sans-serif"
      >
        {texte}
      </text>
    </g>
  );
}

export function AtelierFigure({ item, level, actif, phase, onValider, sfx }: PropsAtelier) {
  const reduce = useReducedMotion();
  const brut = useMemo(() => dessinDe(item)!, [item]);
  const [rot] = useState(() =>
    level === 'plus_loin' && brut.type === 'polygone'
      ? [-28, -16, 16, 28][Math.floor(Math.random() * 4)]!
      : 0,
  );
  const d: Dessin = useMemo(() => {
    if (!rot || brut.type !== 'polygone') return brut;
    const c = cadre(brut);
    const centre: P = [c.x + c.w / 2, c.y + c.h / 2];
    return { type: 'polygone', points: brut.points.map((p) => pivoter(p, centre, rot)) };
  }, [brut, rot]);
  const [outil, setOutil] = useState<'equerre' | 'regle' | null>(null);
  const [testsAngles, setTestsAngles] = useState<number[]>([]);
  const [testsCotes, setTestsCotes] = useState<number[]>([]);
  const [regleTracee, setRegleTracee] = useState(false);
  const [choisi, setChoisi] = useState<number | null>(null);
  const U = 56;
  const c = cadre(d);
  const pad = 1.4;
  const [x0, y0] = [Math.floor(c.x - pad), Math.floor(c.y - pad)];
  const [cols, rows] = [Math.ceil(c.x + c.w + pad) - x0, Math.ceil(c.y + c.h + pad) - y0];
  const codages = level === 'facile' || phase !== 'jeu';
  const choices = item.choices!;
  const bonne = choices.indexOf(item.answer);

  const pts: P[] = d.type === 'polygone' || d.type === 'points' ? d.points : [];
  const n = pts.length;
  const tP = (p: P) => `${p[0] * U},${p[1] * U}`;

  const testerAngle = (i: number) => {
    if (!actif || outil !== 'equerre') return;
    sfx.play('tic');
    setTestsAngles((t) => (t.includes(i) ? t : [...t, i]));
  };
  const testerCote = (i: number) => {
    if (!actif || outil !== 'regle') return;
    sfx.play('tic');
    setTestsCotes((t) => (t.includes(i) ? t : [...t, i]));
  };

  // Angle (sommet + deux demi-droites)
  const angle = d.type === 'angle' ? mesureAngle(d.sommet, d.a, d.b) : 0;
  const outils = d.type !== 'cercle';

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <section
        className="overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[56%]"
        aria-label="La feuille du géomètre"
      >
        <svg
          viewBox={`${x0 * U} ${y0 * U} ${cols * U} ${rows * U}`}
          className="block h-auto max-h-[55vh] w-full select-none bg-[#FFFDF7]"
          role="img"
          aria-label={
            d.type === 'polygone'
              ? `Une figure à ${n} côtés est dessinée sur le quadrillage.`
              : d.type === 'cercle'
                ? 'Un cercle et son centre sont dessinés.'
                : d.type === 'angle'
                  ? 'Un angle est dessiné.'
                  : 'Trois points sont dessinés.'
          }
        >
          {Array.from({ length: cols + 1 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={(x0 + i) * U}
              y1={y0 * U}
              x2={(x0 + i) * U}
              y2={(y0 + rows) * U}
              stroke="#CFE0F5"
              strokeWidth="1.5"
            />
          ))}
          {Array.from({ length: rows + 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={x0 * U}
              y1={(y0 + i) * U}
              x2={(x0 + cols) * U}
              y2={(y0 + i) * U}
              stroke="#CFE0F5"
              strokeWidth="1.5"
            />
          ))}

          {d.type === 'polygone' && (
            <motion.polygon
              points={pts.map(tP).join(' ')}
              fill="#4FC3F7"
              fillOpacity="0.28"
              stroke="#24304A"
              strokeWidth="5"
              strokeLinejoin="round"
              initial={reduce ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ transformOrigin: `${(c.x + c.w / 2) * U}px ${(c.y + c.h / 2) * U}px` }}
            />
          )}
          {d.type === 'cercle' && (
            <g>
              <circle
                cx={d.centre[0] * U}
                cy={d.centre[1] * U}
                r={d.rayon * U}
                fill="#4FC3F7"
                fillOpacity="0.25"
                stroke="#24304A"
                strokeWidth="5"
              />
              <circle cx={d.centre[0] * U} cy={d.centre[1] * U} r="6" fill="#24304A" />
              {outil === 'regle' && (
                <g pointerEvents="none">
                  <line
                    x1={d.centre[0] * U}
                    y1={d.centre[1] * U}
                    x2={(d.centre[0] + d.rayon) * U}
                    y2={d.centre[1] * U}
                    stroke="#8E7CFF"
                    strokeWidth="5"
                  />
                  <Badge
                    p={[d.centre[0] + d.rayon / 2, d.centre[1] - 0.45]}
                    texte={`${fr(d.rayon)} carreaux`}
                    ok
                    U={U}
                  />
                </g>
              )}
            </g>
          )}
          {d.type === 'angle' && (
            <g>
              <line
                x1={d.sommet[0] * U}
                y1={d.sommet[1] * U}
                x2={d.a[0] * U}
                y2={d.a[1] * U}
                stroke="#24304A"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <line
                x1={d.sommet[0] * U}
                y1={d.sommet[1] * U}
                x2={d.b[0] * U}
                y2={d.b[1] * U}
                stroke="#24304A"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle cx={d.sommet[0] * U} cy={d.sommet[1] * U} r="7" fill="#24304A" />
              {codages && Math.abs(angle - 90) < 1 && <CodeAngleDroit s={d.sommet} a={d.a} b={d.b} U={U} />}
              {testsAngles.includes(0) && (
                <>
                  <Equerre s={d.sommet} a={d.a} b={d.b} U={U} />
                  <Badge
                    p={add(d.sommet, [0.2, 0.85])}
                    texte={
                      Math.abs(angle - 90) < 1
                        ? 'angle droit'
                        : angle < 90
                          ? 'plus petit qu’un angle droit'
                          : 'plus grand qu’un angle droit'
                    }
                    ok={Math.abs(angle - 90) < 1}
                    U={U}
                  />
                </>
              )}
              {outil === 'equerre' && actif && (
                <circle
                  cx={d.sommet[0] * U}
                  cy={d.sommet[1] * U}
                  r={U * 0.5}
                  fill="#8E7CFF"
                  fillOpacity="0.15"
                  stroke="#8E7CFF"
                  strokeWidth="3"
                  className="cursor-pointer"
                  onClick={() => testerAngle(0)}
                />
              )}
            </g>
          )}
          {d.type === 'points' && (
            <g>
              {regleTracee && (
                <g pointerEvents="none">
                  {(() => {
                    const u = unit(pts[0]!, pts[2]!);
                    const a = add(pts[0]!, u, -0.8);
                    const b = add(pts[2]!, u, 0.8);
                    return (
                      <line
                        x1={a[0] * U}
                        y1={a[1] * U}
                        x2={b[0] * U}
                        y2={b[1] * U}
                        stroke="#8E7CFF"
                        strokeWidth="6"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    );
                  })()}
                </g>
              )}
              {pts.map((p, i) => (
                <PointNomme key={i} p={p} nom={['A', 'B', 'C'][i]!} U={U} />
              ))}
            </g>
          )}

          {/* Codages (Facile, et après la réponse) */}
          {d.type === 'polygone' && codages && (
            <g>
              {pts.map((s, i) =>
                angleDroit(pts, i) ? (
                  <CodeAngleDroit key={`a${i}`} s={s} a={pts[(i + n - 1) % n]!} b={pts[(i + 1) % n]!} U={U} />
                ) : null,
              )}
              {groupesCotes(pts).map((g, i) => {
                if (g < 0) return null;
                const a = pts[i]!;
                const b = pts[(i + 1) % n]!;
                const m: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
                const u = unit(a, b);
                const v: P = [-u[1], u[0]];
                return (
                  <g key={`c${i}`} stroke="#CD3E30" strokeWidth="3" pointerEvents="none">
                    {Array.from({ length: g + 1 }, (_, k) => {
                      const o = add(m, u, (k - g / 2) * 0.16);
                      const p1 = add(o, v, 0.2);
                      const p2 = add(o, v, -0.2);
                      return <line key={k} x1={p1[0] * U} y1={p1[1] * U} x2={p2[0] * U} y2={p2[1] * U} />;
                    })}
                  </g>
                );
              })}
            </g>
          )}

          {/* Outils sur un polygone */}
          {d.type === 'polygone' && (
            <g>
              {testsCotes.map((i) => {
                const a = pts[i]!;
                const b = pts[(i + 1) % n]!;
                const l = longueur(a, b);
                const entier = Math.abs(l - Math.round(l)) < 0.05;
                const u = unit(a, b);
                const m: P = add([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], [-u[1], u[0]], -0.55);
                return (
                  <g key={`r${i}`}>
                    <line
                      x1={a[0] * U}
                      y1={a[1] * U}
                      x2={b[0] * U}
                      y2={b[1] * U}
                      stroke="#8E7CFF"
                      strokeWidth="9"
                      strokeLinecap="round"
                      opacity="0.6"
                      pointerEvents="none"
                    />
                    <Badge
                      p={m}
                      texte={
                        entier
                          ? `${fr(l)} carreau${l >= 2 ? 'x' : ''}`
                          : item.lessonId.startsWith('CM2')
                            ? `≈ ${fr(l)} carreaux`
                            : `entre ${Math.floor(l)} et ${Math.ceil(l)} carreaux`
                      }
                      ok
                      U={U}
                    />
                  </g>
                );
              })}
              {testsAngles.map((i) => {
                const s = pts[i]!;
                const ok = angleDroit(pts, i);
                const a = pts[(i + n - 1) % n]!;
                const b = pts[(i + 1) % n]!;
                const vers = unit(s, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
                return (
                  <g key={`e${i}`}>
                    <Equerre s={s} a={a} b={b} U={U} />
                    <Badge
                      p={add(s, vers, -0.7)}
                      texte={ok ? 'angle droit ✓' : 'pas un angle droit'}
                      ok={ok}
                      U={U}
                    />
                  </g>
                );
              })}
              {actif &&
                outil === 'equerre' &&
                pts.map((s, i) => (
                  <circle
                    key={`ce${i}`}
                    cx={s[0] * U}
                    cy={s[1] * U}
                    r={U * 0.42}
                    fill="#8E7CFF"
                    fillOpacity="0.18"
                    stroke="#8E7CFF"
                    strokeWidth="3"
                    className="cursor-pointer"
                    onClick={() => testerAngle(i)}
                  />
                ))}
              {actif &&
                outil === 'regle' &&
                pts.map((a, i) => {
                  const b = pts[(i + 1) % n]!;
                  return (
                    <line
                      key={`cr${i}`}
                      x1={a[0] * U}
                      y1={a[1] * U}
                      x2={b[0] * U}
                      y2={b[1] * U}
                      stroke="#8E7CFF"
                      strokeOpacity="0.25"
                      strokeWidth={U * 0.45}
                      strokeLinecap="round"
                      className="cursor-pointer"
                      onClick={() => testerCote(i)}
                    />
                  );
                })}
            </g>
          )}
        </svg>
      </section>

      <div className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-4">
        {outils && phase === 'jeu' && (
          <div className="flex w-full flex-col items-center gap-2 rounded-2xl bg-cream p-2">
            <p className="text-center text-sm font-bold text-ink-soft">Mes instruments (facultatifs) :</p>
            <div className="flex flex-wrap justify-center gap-2">
              {d.type !== 'points' && (
                <Button
                  variant={outil === 'equerre' ? 'sun' : 'blanc'}
                  onClick={() => setOutil((o) => (o === 'equerre' ? null : 'equerre'))}
                  disabled={!actif}
                  aria-pressed={outil === 'equerre'}
                >
                  📐 Équerre
                </Button>
              )}
              {d.type !== 'angle' && (
                <Button
                  variant={outil === 'regle' ? 'sun' : 'blanc'}
                  onClick={() => {
                    if (d.type === 'points') setRegleTracee((r) => !r);
                    setOutil((o) => (o === 'regle' ? null : 'regle'));
                  }}
                  disabled={!actif}
                  aria-pressed={outil === 'regle'}
                >
                  📏 Règle
                </Button>
              )}
            </div>
            {outil === 'equerre' && (
              <p className="text-center text-sm">Touche un sommet pour y poser l’équerre.</p>
            )}
            {outil === 'regle' && d.type === 'polygone' && (
              <p className="text-center text-sm">Touche un côté pour le mesurer.</p>
            )}
          </div>
        )}
        {level === 'facile' && phase === 'jeu' && d.type === 'polygone' && (
          <Indice>
            Les petits carrés rouges montrent les angles droits ; les traits rouges, les côtés de même
            longueur.
          </Indice>
        )}
        <ChoiceGrid
          choices={choices}
          onPick={(i) => {
            if (!actif) return;
            setChoisi(i);
            onValider(i === bonne, choices[i]!, item.answer);
          }}
          reveal={phase !== 'jeu' && choisi !== null ? { correct: bonne, chosen: choisi } : null}
          disabled={!actif}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Points sur les nœuds                                                */
/* ------------------------------------------------------------------ */

export function AtelierPoints({ item, level, actif, phase, sfx, onValider }: PropsAtelier) {
  const plan = useMemo(() => lirePoints(item)!, [item]);
  const [pose, setPose] = useState<P | null>(null);
  const [essais, setEssais] = useState(ESSAIS[level]);
  const [rate, setRate] = useState<P[]>([]);
  const U = 44;
  const placer = useCallback(
    (p: P) => {
      if (!actif) return;
      setPose(p);
      sfx.play('pop');
    },
    [actif, sfx],
  );
  const valider = useCallback(() => {
    if (!actif || !pose) return;
    const ok = cle(pose) === cle(plan.solution);
    if (ok) onValider(true, cle(pose), cle(plan.solution));
    else if (essais > 1) {
      setEssais((e) => e - 1);
      setRate((r) => [...r, pose]);
      setPose(null);
      sfx.play('faux');
    } else onValider(false, cle(pose), cle(plan.solution));
  }, [actif, pose, plan, essais, onValider, sfx]);
  const { curseur, visible } = useCurseur(plan.cols, plan.rows, actif, placer, { v: valider, V: valider });

  const noms = Object.keys(plan.points);
  const A = plan.points.A ?? Object.values(plan.points)[0]!;
  const B = plan.points.B ?? Object.values(plan.points)[1] ?? A;
  const fin = phase !== 'jeu';
  const sol = plan.solution;
  const figure = typeof item.meta?.figure === 'string';
  // Déplacement à montrer en Facile : de B à C pour compléter une figure, sinon de A à B.
  const [depuis, vers, nomDepuis, nomVers] =
    figure && plan.points.C ? [B, plan.points.C, 'B', 'C'] : [A, B, noms[0], noms[1] ?? noms[0]];
  const nom = plan.nom;

  const seg = (a: P, b: P, couleur: string, k: string, pointilles = false) => (
    <line
      key={k}
      x1={a[0] * U}
      y1={a[1] * U}
      x2={b[0] * U}
      y2={b[1] * U}
      stroke={couleur}
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray={pointilles ? '10 8' : undefined}
      pointerEvents="none"
    />
  );
  // Ce qui complète la figure une fois le point trouvé
  const complement = () => {
    const C = plan.points.C;
    if (figure && C) return [seg(C, sol, '#2E8C48', 'cd'), seg(sol, A, '#2E8C48', 'da')];
    if (C && nom === 'D') return [seg(C, sol, '#2E8C48', 'cd')];
    if (nom === 'E') return [seg(A, sol, '#2E8C48', 'ae')];
    return [];
  };
  const dx = vers[0] - depuis[0];
  const dy = vers[1] - depuis[1];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <section
        className="overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[60%]"
        aria-label="Le quadrillage"
      >
        <Papier
          cols={plan.cols}
          rows={plan.rows}
          U={U}
          onNoeud={actif ? placer : undefined}
          curseur={actif && visible ? curseur : null}
          label={`Quadrillage. ${noms.map((k) => `Point ${k} : ${plan.points[k]![0]} carreaux vers la droite, ${plan.points[k]![1]} vers le bas`).join('. ')}.`}
          className="max-h-[56vh]"
        >
          {plan.segments.map(([a, b]) => seg(plan.points[a]!, plan.points[b]!, '#24304A', `${a}${b}`))}
          {level === 'facile' && !fin && (dx !== 0 || dy !== 0) && (
            <g pointerEvents="none" opacity="0.9">
              {dx !== 0 && seg(depuis, [vers[0], depuis[1]], '#8E7CFF', 'hx', true)}
              {dy !== 0 && seg([vers[0], depuis[1]], vers, '#8E7CFF', 'hy', true)}
              {dx !== 0 && (
                <text
                  x={((depuis[0] + vers[0]) / 2) * U}
                  y={depuis[1] * U + (dy < 0 ? 30 : -14)}
                  textAnchor="middle"
                  fontSize="22"
                  fontWeight="800"
                  fill="#6048DC"
                  stroke="#FFFDF7"
                  strokeWidth="5"
                  paintOrder="stroke"
                >
                  {Math.abs(dx)} {dx > 0 ? '→' : '←'}
                </text>
              )}
              {dy !== 0 && (
                <text
                  x={vers[0] * U + (dx < 0 ? -12 : 12)}
                  y={((depuis[1] + vers[1]) / 2) * U + 8}
                  textAnchor={dx < 0 ? 'end' : 'start'}
                  fontSize="22"
                  fontWeight="800"
                  fill="#6048DC"
                  stroke="#FFFDF7"
                  strokeWidth="5"
                  paintOrder="stroke"
                >
                  {Math.abs(dy)} {dy > 0 ? '↓' : '↑'}
                </text>
              )}
            </g>
          )}
          {phase === 'juste' && complement()}
          {rate.map((p, i) => (
            <g key={`r${i}`} opacity="0.5" pointerEvents="none">
              <circle cx={p[0] * U} cy={p[1] * U} r="9" fill="#FF7A6B" />
            </g>
          ))}
          {noms.map((k) => (
            <PointNomme key={k} p={plan.points[k]!} nom={k} U={U} />
          ))}
          {pose && <PointNomme p={pose} nom={nom} U={U} couleur={phase === 'faux' ? '#CD3E30' : '#6048DC'} />}
          {phase === 'faux' && <PointNomme p={sol} nom={nom} U={U} couleur="#2E8C48" />}
        </Papier>
      </section>
      <div className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-4">
        {phase === 'jeu' && (
          <>
            {rate.length > 0 && (
              <p className="text-center font-bold" role="status">
                Presque ! Ce n’est pas encore le bon nœud. Compte bien les carreaux et réessaie ({essais}{' '}
                essai{essais > 1 ? 's' : ''}).
              </p>
            )}
            {level === 'facile' && (
              <Indice>
                Les flèches violettes comptent les carreaux pour aller de {nomDepuis} à {nomVers}.
              </Indice>
            )}
            <p className="text-center text-sm font-bold text-ink-soft">
              Touche un nœud (croisement de lignes) pour placer le point {nom}, ou flèches + Entrée. Puis «
              Valider » (V).
            </p>
            <Button variant="grass" size="lg" onClick={valider} disabled={!actif || !pose}>
              ✔ Valider le point {nom}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tracer un polygone sur les nœuds (reproduire, rectangle)            */
/* ------------------------------------------------------------------ */

/** Tracé d'un polygone en touchant les nœuds ; il se ferme en revenant sur le premier point. */
export function useTrace(actif: boolean, sfx: SfxService) {
  const [pts, setPts] = useState<P[]>([]);
  const [ferme, setFerme] = useState(false);
  const ajouter = useCallback(
    (p: P) => {
      if (!actif || ferme) return;
      if (pts.length >= 3 && cle(p) === cle(pts[0]!)) {
        setFerme(true);
        sfx.play('etoile');
        return;
      }
      if (pts.some((q) => cle(q) === cle(p))) return;
      if (pts.length >= 8) return;
      setPts([...pts, p]);
      sfx.play('pop');
    },
    [actif, ferme, pts, sfx],
  );
  const annuler = useCallback(() => {
    if (!actif) return;
    if (ferme) setFerme(false);
    else setPts((p) => p.slice(0, -1));
  }, [actif, ferme]);
  const effacer = useCallback(() => {
    setPts([]);
    setFerme(false);
  }, []);
  return { pts, ferme, ajouter, annuler, effacer, setFerme };
}

export function TracePolygone({
  pts,
  ferme,
  U,
  couleur = '#6048DC',
}: {
  pts: P[];
  ferme: boolean;
  U: number;
  couleur?: string;
}) {
  if (!pts.length) return null;
  const s = pts.map((p) => `${p[0] * U},${p[1] * U}`).join(' ');
  return (
    <g pointerEvents="none">
      {ferme ? (
        <polygon
          points={s}
          fill={couleur}
          fillOpacity="0.18"
          stroke={couleur}
          strokeWidth="5"
          strokeLinejoin="round"
        />
      ) : (
        <polyline
          points={s}
          fill="none"
          stroke={couleur}
          strokeWidth="5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p[0] * U}
          cy={p[1] * U}
          r={i === 0 && !ferme ? 10 : 7}
          fill={i === 0 ? '#FFD45C' : couleur}
          stroke="#24304A"
          strokeWidth="2"
        />
      ))}
    </g>
  );
}

export function AtelierReproduire({ item, level, actif, phase, sfx, onValider }: PropsAtelier) {
  const plan = useMemo(() => lireReproduire(item)!, [item]);
  const t = useTrace(actif, sfx);
  const [essais, setEssais] = useState(ESSAIS[level]);
  const [message, setMessage] = useState<string | null>(null);
  const U = 40;
  const decal: P = t.pts[0] ? [t.pts[0][0] - plan.sommets[0]![0], t.pts[0][1] - plan.sommets[0]![1]] : [0, 0];
  const valider = useCallback(() => {
    if (!actif || !t.ferme) return;
    const ok = memeFigureTranslatee(plan.sommets, t.pts);
    const donne = t.pts.map(cle).join(';');
    const attendu = plan.sommets.map(cle).join(';');
    if (ok) onValider(true, donne, attendu);
    else if (essais > 1) {
      setEssais((e) => e - 1);
      setMessage(
        t.pts.length !== plan.sommets.length
          ? `Ta figure a ${t.pts.length} sommets, le modèle en a ${plan.sommets.length}.`
          : 'Les côtés n’ont pas tous la bonne longueur ou la bonne direction.',
      );
      sfx.play('faux');
    } else onValider(false, donne, attendu);
  }, [actif, t, plan, essais, onValider, sfx]);
  const { curseur, visible } = useCurseur(plan.cols, plan.rows, actif, t.ajouter, {
    Backspace: t.annuler,
    v: valider,
    V: valider,
  });
  const n = plan.sommets.length;
  const cotes = plan.sommets.map((p, i) => {
    const q = plan.sommets[(i + 1) % n]!;
    return { p, q, h: p[1] === q[1], v: p[0] === q[0], l: Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) };
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <section
          className="overflow-hidden rounded-card border-4 border-white shadow-soft"
          aria-label="Le modèle"
        >
          <p className="bg-sun/30 py-1 text-center font-titre font-bold">Le modèle</p>
          <Papier cols={plan.cols} rows={plan.rows} U={U} label={`Modèle : une figure à ${n} sommets.`}>
            <polygon
              points={plan.sommets.map((p) => `${p[0] * U},${p[1] * U}`).join(' ')}
              fill="#FF7A6B"
              fillOpacity="0.25"
              stroke="#24304A"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {plan.sommets.map((p, i) => (
              <circle key={i} cx={p[0] * U} cy={p[1] * U} r="6" fill="#24304A" />
            ))}
            {level === 'facile' &&
              cotes
                .filter((c) => c.h || c.v)
                .map((c, i) => (
                  <text
                    key={i}
                    x={((c.p[0] + c.q[0]) / 2) * U + (c.v ? 16 : 0)}
                    y={((c.p[1] + c.q[1]) / 2) * U + (c.h ? -10 : 8)}
                    textAnchor="middle"
                    fontSize="22"
                    fontWeight="800"
                    fill="#CD3E30"
                  >
                    {c.l}
                  </text>
                ))}
          </Papier>
        </section>
        <section
          className="overflow-hidden rounded-card border-4 border-white shadow-soft"
          aria-label="Ma reproduction"
        >
          <p className="bg-grape/20 py-1 text-center font-titre font-bold">Ma figure</p>
          <Papier
            cols={plan.cols}
            rows={plan.rows}
            U={U}
            onNoeud={actif ? t.ajouter : undefined}
            curseur={actif && visible ? curseur : null}
            label={`Ma figure : ${t.pts.length} point${t.pts.length > 1 ? 's' : ''} placé${t.pts.length > 1 ? 's' : ''}${t.ferme ? ', figure fermée' : ''}.`}
          >
            <TracePolygone pts={t.pts} ferme={t.ferme} U={U} />
            {phase === 'faux' && (
              <polygon
                points={plan.sommets
                  .map((p) => `${(p[0] + decal[0]) * U},${(p[1] + decal[1]) * U}`)
                  .join(' ')}
                fill="none"
                stroke="#2E8C48"
                strokeWidth="4"
                strokeDasharray="10 7"
              />
            )}
          </Papier>
        </section>
      </div>
      {phase === 'jeu' && (
        <div className="carte flex flex-col items-center gap-2 p-4">
          {message && (
            <p className="text-center font-bold" role="status">
              Presque ! {message} On réessaie ? ({essais} essai{essais > 1 ? 's' : ''})
            </p>
          )}
          {level === 'facile' && !message && (
            <Indice>Les nombres rouges disent combien de carreaux mesure chaque côté.</Indice>
          )}
          <p className="text-center text-sm font-bold text-ink-soft">
            Touche les nœuds un par un pour placer les sommets (ou flèches + Entrée). Touche le premier point
            (jaune) pour fermer la figure.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="blanc" onClick={t.annuler} disabled={!actif || !t.pts.length}>
              ↶ Annuler
            </Button>
            <Button variant="blanc" onClick={t.effacer} disabled={!actif || !t.pts.length}>
              Tout effacer
            </Button>
            {!t.ferme && t.pts.length >= 3 && (
              <Button variant="sun" onClick={() => t.setFerme(true)} disabled={!actif}>
                Fermer la figure
              </Button>
            )}
            <Button variant="grass" size="lg" onClick={valider} disabled={!actif || !t.ferme}>
              ✔ Valider
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
