/**
 * Instruments virtuels du Géomètre : règle graduée (tracer un segment), compas (tracer un cercle),
 * équerre (tracer un angle droit), et tracé d'un rectangle sur papier quadrillé au centimètre.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { cle } from '../_geometrie-commun/grille';
import { Indice } from '../_geometrie-commun/ui';
import { dansUnChamp } from '../_nombres-commun/outils';
import { ESSAIS, type PropsAtelier, TracePolygone, useTrace } from './Ateliers';
import { type Instrument, estRectangle, lireInstrument } from './logique';
import { Papier, pointSvg, useCurseur } from './Papier';

/** Raccourcis clavier simples (hors champs de saisie). */
function useTouches(actif: boolean, touches: Record<string, () => void>) {
  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      const f = touches[e.key];
      if (f) {
        e.preventDefault();
        f();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif, touches]);
}

/** Règle graduée en centimètres (et millimètres), de 0 à `max` cm. */
function Regle({
  x0,
  y,
  cm,
  max,
  curseur,
}: {
  x0: number;
  y: number;
  cm: number;
  max: number;
  curseur?: number | null;
}) {
  return (
    <g pointerEvents="none">
      <rect
        x={x0 - 22}
        y={y}
        width={max * cm + 44}
        height={70}
        rx="8"
        fill="#FFE9A8"
        stroke="#D69600"
        strokeWidth="2.5"
      />
      {Array.from({ length: max * 10 + 1 }, (_, k) => (
        <line
          key={k}
          x1={x0 + (k * cm) / 10}
          x2={x0 + (k * cm) / 10}
          y1={y}
          y2={y + (k % 10 === 0 ? 26 : k % 5 === 0 ? 17 : 10)}
          stroke="#6B4A00"
          strokeWidth={k % 10 === 0 ? 2.2 : 1}
        />
      ))}
      {Array.from({ length: max + 1 }, (_, k) => (
        <text
          key={k}
          x={x0 + k * cm}
          y={y + 46}
          textAnchor="middle"
          fontSize="18"
          fontWeight="800"
          fill="#6B4A00"
        >
          {k}
        </text>
      ))}
      <text x={x0 + max * cm + 12} y={y + 64} textAnchor="end" fontSize="13" fill="#6B4A00">
        cm
      </text>
      {curseur !== null && curseur !== undefined && (
        <rect
          x={x0 + curseur * cm - 12}
          y={y - 4}
          width={24}
          height={60}
          rx="8"
          fill="none"
          stroke="#8E7CFF"
          strokeWidth="4"
        />
      )}
    </g>
  );
}

function Crayon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-35)`} pointerEvents="none">
      <path d="M0 0 L 8 -14 L 8 -70 L -8 -70 L -8 -14 Z" fill="#FFD45C" stroke="#24304A" strokeWidth="2.5" />
      <path d="M0 0 L 8 -14 L -8 -14 Z" fill="#F2C29B" stroke="#24304A" strokeWidth="2" />
      <path d="M0 0 L 3 -5 L -3 -5 Z" fill="#24304A" />
      <rect x="-8" y="-80" width="16" height="10" rx="3" fill="#FF7A6B" stroke="#24304A" strokeWidth="2" />
    </g>
  );
}

function Resultat({ phase, message, essais }: { phase: string; message: string | null; essais: number }) {
  if (phase !== 'jeu' || !message) return null;
  return (
    <p className="text-center font-bold" role="status">
      Presque ! {message} On réessaie ? ({essais} essai{essais > 1 ? 's' : ''})
    </p>
  );
}

/* ------------------------------------------------------------------ */

function AtelierSegment({
  longueur,
  item,
  level,
  actif,
  phase,
  sfx,
  onValider,
}: PropsAtelier & { longueur: number }) {
  const MAX = longueur <= 7 ? 10 : 15;
  const CM = 600 / MAX;
  const X0 = 40;
  const [a, setA] = useState<number | null>(null);
  const [b, setB] = useState<number | null>(null);
  const [curseur, setCurseur] = useState<number | null>(null);
  const [essais, setEssais] = useState(ESSAIS[level]);
  const [message, setMessage] = useState<string | null>(null);
  const poser = useCallback(
    (k: number) => {
      if (!actif) return;
      sfx.play('pop');
      setMessage(null);
      if (a === null) setA(k);
      else if (b === null && k !== a) setB(k);
      else if (k !== a) setB(k);
    },
    [actif, a, b, sfx],
  );
  const valider = useCallback(() => {
    if (!actif || a === null || b === null) return;
    const l = Math.abs(b - a);
    if (l === longueur) onValider(true, `${l} cm`, `${longueur} cm`);
    else if (essais > 1) {
      setEssais((e) => e - 1);
      setMessage(`Ton segment mesure ${l} cm, pas ${longueur} cm.`);
      sfx.play('faux');
    } else onValider(false, `${l} cm`, `${longueur} cm`);
  }, [actif, a, b, longueur, essais, onValider, sfx]);
  const touches = useMemo(
    () => ({
      ArrowLeft: () => setCurseur((c) => Math.max(0, (c ?? 0) - 1)),
      ArrowRight: () => setCurseur((c) => Math.min(MAX, (c ?? -1) + 1)),
      Enter: () => (curseur !== null ? poser(curseur) : valider()),
      ' ': () => curseur !== null && poser(curseur),
      v: valider,
      V: valider,
    }),
    [curseur, poser, valider, MAX],
  );
  useTouches(actif, touches);
  const xa = a !== null ? X0 + a * CM : null;
  const xb = b !== null ? X0 + b * CM : null;
  return (
    <div className="carte flex flex-col items-center gap-3 p-3 sm:p-4">
      <svg
        viewBox="0 0 700 250"
        className="block h-auto w-full select-none"
        role="img"
        aria-label={`Règle graduée de 0 à ${MAX} cm.${a !== null ? ` Premier point à ${a} cm.` : ''}${b !== null ? ` Second point à ${b} cm.` : ''}`}
        onPointerUp={(e) => {
          if (!actif) return;
          const p = pointSvg(e.currentTarget, e.clientX, e.clientY);
          if (!p) return;
          const k = Math.round((p[0] - X0) / CM);
          if (k >= 0 && k <= MAX) poser(k);
        }}
      >
        <rect x="0" y="0" width="700" height="250" fill="#FFFDF7" />
        {xa !== null && <circle cx={xa} cy={90} r="7" fill="#24304A" />}
        {xa !== null && xb !== null && (
          <motion.line
            x1={xa}
            y1={90}
            x2={xb}
            y2={90}
            stroke="#6048DC"
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
          />
        )}
        {xb !== null && <circle cx={xb} cy={90} r="7" fill="#24304A" />}
        {phase === 'faux' && (
          <line
            x1={X0}
            y1={60}
            x2={X0 + longueur * CM}
            y2={60}
            stroke="#2E8C48"
            strokeWidth="6"
            strokeDasharray="12 8"
            strokeLinecap="round"
          />
        )}
        <Regle x0={X0} y={120} cm={CM} max={MAX} curseur={actif ? curseur : null} />
        {(xb ?? xa) !== null && <Crayon x={(xb ?? xa)!} y={90} />}
      </svg>
      <Resultat phase={phase} message={message} essais={essais} />
      {phase === 'jeu' && (
        <>
          {level === 'facile' && <Indice>Pars du 0 de la règle !</Indice>}
          <p className="text-center text-sm font-bold text-ink-soft">
            Touche la règle pour marquer le début, puis la fin du segment (ou ← → et Entrée). Puis « Valider »
            (V).
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="blanc"
              aria-label="Déplacer le dernier point vers la gauche"
              disabled={!actif || a === null}
              onClick={() => (b !== null ? setB(Math.max(0, b - 1)) : a !== null && setA(Math.max(0, a - 1)))}
            >
              ◀
            </Button>
            <Button
              variant="blanc"
              aria-label="Déplacer le dernier point vers la droite"
              disabled={!actif || a === null}
              onClick={() =>
                b !== null ? setB(Math.min(MAX, b + 1)) : a !== null && setA(Math.min(MAX, a + 1))
              }
            >
              ▶
            </Button>
            <Button
              variant="blanc"
              onClick={() => {
                setA(null);
                setB(null);
              }}
              disabled={!actif || a === null}
            >
              Recommencer
            </Button>
            <Button variant="grass" size="lg" onClick={valider} disabled={!actif || a === null || b === null}>
              ✔ Valider
            </Button>
          </div>
        </>
      )}
      <span className="sr-only">{item.prompt}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AtelierCompas({ rayon, level, actif, phase, sfx, onValider }: PropsAtelier & { rayon: number }) {
  const reduce = useReducedMotion();
  const CM = 34;
  const [O] = useState<[number, number]>([260, 225]);
  const [ouverture, setOuverture] = useState(1);
  const [trace, setTrace] = useState(false);
  const [essais, setEssais] = useState(ESSAIS[level]);
  const [message, setMessage] = useState<string | null>(null);
  const changer = useCallback(
    (v: number) => {
      if (!actif || trace) return;
      setOuverture(Math.max(1, Math.min(7, v)));
      setMessage(null);
      sfx.play('tic');
    },
    [actif, trace, sfx],
  );
  const tracer = useCallback(() => {
    if (!actif || trace) return;
    setTrace(true);
    sfx.play('glisse');
    setTimeout(
      () => {
        if (ouverture === rayon) onValider(true, `${ouverture} cm`, `${rayon} cm`);
        else if (essais > 1) {
          setEssais((e) => e - 1);
          setMessage(`Ton cercle ne passe pas par A : l’écartement était de ${ouverture} cm.`);
          setTrace(false);
          sfx.play('faux');
        } else onValider(false, `${ouverture} cm`, `${rayon} cm`);
      },
      reduce ? 200 : 1300,
    );
  }, [actif, trace, sfx, ouverture, rayon, essais, onValider, reduce]);
  const touches = useMemo(
    () => ({
      ArrowLeft: () => changer(ouverture - 1),
      ArrowRight: () => changer(ouverture + 1),
      ArrowDown: () => changer(ouverture - 1),
      ArrowUp: () => changer(ouverture + 1),
      Enter: tracer,
    }),
    [changer, ouverture, tracer],
  );
  useTouches(actif, touches);
  const [ox, oy] = O;
  const crayon: [number, number] = [ox + ouverture * CM, oy];
  const charniere: [number, number] = [ox + (ouverture * CM) / 2, oy - 120];
  return (
    <div className="carte flex flex-col items-center gap-3 p-3 sm:p-4">
      <svg
        viewBox="0 0 520 460"
        className="block h-auto max-h-[58vh] w-full select-none"
        role="img"
        aria-label={`Compas ouvert de ${ouverture} cm. Le point A est à ${rayon} cm du centre O.`}
        onPointerUp={(e) => {
          const p = pointSvg(e.currentTarget, e.clientX, e.clientY);
          if (!p) return;
          changer(Math.round(Math.hypot(p[0] - ox, p[1] - oy) / CM));
        }}
      >
        <rect width="520" height="460" fill="#FFFDF7" />
        {Array.from({ length: 16 }, (_, i) => (
          <line key={i} x1={0} y1={i * 34 + 5} x2={520} y2={i * 34 + 5} stroke="#E3ECF8" strokeWidth="1.5" />
        ))}
        {trace && (
          <motion.circle
            cx={ox}
            cy={oy}
            r={ouverture * CM}
            fill="none"
            stroke="#6048DC"
            strokeWidth="5"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1 }}
          />
        )}
        {phase === 'faux' && (
          <circle
            cx={ox}
            cy={oy}
            r={rayon * CM}
            fill="none"
            stroke="#2E8C48"
            strokeWidth="5"
            strokeDasharray="12 8"
          />
        )}
        <g opacity="0.92">
          <Regle x0={ox} y={oy + 14} cm={CM} max={7} />
        </g>
        <circle cx={ox} cy={oy} r="6" fill="#24304A" />
        <text x={ox - 14} y={oy - 10} fontSize="24" fontWeight="800" fill="#24304A" textAnchor="end">
          O
        </text>
        <circle cx={ox + rayon * CM} cy={oy} r="7" fill="#FF7A6B" stroke="#24304A" strokeWidth="2" />
        <text x={ox + rayon * CM + 8} y={oy - 12} fontSize="24" fontWeight="800" fill="#CD3E30">
          A
        </text>
        {!trace && (
          <g pointerEvents="none">
            <line
              x1={ox}
              y1={oy}
              x2={charniere[0]}
              y2={charniere[1]}
              stroke="#586480"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <line
              x1={crayon[0]}
              y1={crayon[1]}
              x2={charniere[0]}
              y2={charniere[1]}
              stroke="#8E7CFF"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <circle
              cx={charniere[0]}
              cy={charniere[1]}
              r="10"
              fill="#FFD45C"
              stroke="#24304A"
              strokeWidth="2.5"
            />
            <circle cx={crayon[0]} cy={crayon[1]} r="5" fill="#6048DC" />
          </g>
        )}
      </svg>
      <Resultat phase={phase} message={message} essais={essais} />
      {phase === 'jeu' && (
        <>
          {level === 'facile' && (
            <Indice>Écarte le compas pour que le crayon arrive pile sur le point A.</Indice>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="blanc"
              aria-label="Fermer un peu le compas"
              onClick={() => changer(ouverture - 1)}
              disabled={!actif || trace}
            >
              −
            </Button>
            <span className="min-w-[9rem] text-center font-titre text-xl font-bold" aria-live="polite">
              Écartement : {ouverture} cm
            </span>
            <Button
              variant="blanc"
              aria-label="Ouvrir un peu le compas"
              onClick={() => changer(ouverture + 1)}
              disabled={!actif || trace}
            >
              +
            </Button>
          </div>
          <Button variant="grass" size="lg" onClick={tracer} disabled={!actif || trace}>
            ✏️ Tracer le cercle
          </Button>
          <p className="text-center text-sm font-bold text-ink-soft">
            Flèches pour écarter le compas, Entrée pour tracer.
          </p>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AtelierEquerre({ level, actif, phase, sfx, onValider }: PropsAtelier) {
  const [angle, setAngle] = useState(() => (Math.random() < 0.5 ? 60 : 120));
  const [equerre, setEquerre] = useState(level === 'facile');
  const [essais, setEssais] = useState(ESSAIS[level]);
  const [message, setMessage] = useState<string | null>(null);
  const tourner = useCallback(
    (d: number) => {
      if (!actif) return;
      setAngle((a) => Math.max(15, Math.min(165, a + d)));
      setMessage(null);
      sfx.play('tic');
    },
    [actif, sfx],
  );
  const valider = useCallback(() => {
    if (!actif) return;
    if (angle === 90) onValider(true, `${angle}°`, '90°');
    else if (essais > 1) {
      setEssais((e) => e - 1);
      setMessage(
        angle < 90
          ? 'Ton angle est plus petit qu’un angle droit.'
          : 'Ton angle est plus grand qu’un angle droit.',
      );
      sfx.play('faux');
    } else onValider(false, `${angle}°`, '90°');
  }, [actif, angle, essais, onValider, sfx]);
  const touches = useMemo(
    () => ({
      ArrowLeft: () => tourner(15),
      ArrowRight: () => tourner(-15),
      Enter: valider,
      e: () => setEquerre((x) => !x),
    }),
    [tourner, valider],
  );
  useTouches(actif, touches);
  const O: [number, number] = [180, 300];
  const r = (angle * Math.PI) / 180;
  const fin: [number, number] = [O[0] + 250 * Math.cos(r), O[1] - 250 * Math.sin(r)];
  const arc = (a: number, R: number) =>
    `M ${O[0] + R} ${O[1]} A ${R} ${R} 0 0 0 ${O[0] + R * Math.cos((a * Math.PI) / 180)} ${O[1] - R * Math.sin((a * Math.PI) / 180)}`;
  return (
    <div className="carte flex flex-col items-center gap-3 p-3 sm:p-4">
      <svg
        viewBox="0 0 600 360"
        className="block h-auto max-h-[55vh] w-full select-none"
        role="img"
        aria-label="Un premier trait est tracé ; fais tourner le second trait."
      >
        <rect width="600" height="360" fill="#FFFDF7" />
        {equerre && (
          <g pointerEvents="none">
            <polygon
              points={`${O[0]},${O[1]} ${O[0] + 230},${O[1]} ${O[0]},${O[1] - 170}`}
              fill="#FFD45C"
              fillOpacity="0.45"
              stroke="#D69600"
              strokeWidth="3"
            />
            <polygon
              points={`${O[0] + 26},${O[1] - 22} ${O[0] + 150},${O[1] - 22} ${O[0] + 26},${O[1] - 114}`}
              fill="#FFFDF7"
              fillOpacity="0.85"
              stroke="#D69600"
              strokeWidth="2"
            />
          </g>
        )}
        <line
          x1={O[0] - 20}
          y1={O[1]}
          x2={560}
          y2={O[1]}
          stroke="#24304A"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <motion.line
          x1={O[0]}
          y1={O[1]}
          animate={{ x2: fin[0], y2: fin[1] }}
          transition={{ duration: 0.15 }}
          stroke="#6048DC"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d={arc(angle, 46)} fill="none" stroke="#6048DC" strokeWidth="3" />
        {phase === 'faux' && (
          <line
            x1={O[0]}
            y1={O[1]}
            x2={O[0]}
            y2={O[1] - 250}
            stroke="#2E8C48"
            strokeWidth="6"
            strokeDasharray="12 8"
          />
        )}
        <circle cx={O[0]} cy={O[1]} r="7" fill="#24304A" />
      </svg>
      <Resultat phase={phase} message={message} essais={essais} />
      {phase === 'jeu' && (
        <>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="blanc"
              onClick={() => tourner(15)}
              disabled={!actif}
              aria-label="Tourner vers la gauche"
            >
              ↺
            </Button>
            <Button
              variant="blanc"
              onClick={() => tourner(-15)}
              disabled={!actif}
              aria-label="Tourner vers la droite"
            >
              ↻
            </Button>
            <Button
              variant={equerre ? 'sun' : 'blanc'}
              onClick={() => setEquerre((x) => !x)}
              disabled={!actif}
              aria-pressed={equerre}
            >
              📐 {equerre ? 'Enlever' : 'Poser'} l’équerre
            </Button>
          </div>
          <Button variant="grass" size="lg" onClick={valider} disabled={!actif}>
            ✔ C’est un angle droit !
          </Button>
          <p className="text-center text-sm font-bold text-ink-soft">
            ← → pour tourner, E pour l’équerre, Entrée pour valider.
          </p>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AtelierRectangle({
  longueur,
  largeur,
  level,
  actif,
  phase,
  sfx,
  onValider,
}: PropsAtelier & { longueur: number; largeur: number }) {
  const t = useTrace(actif, sfx);
  const [essais, setEssais] = useState(ESSAIS[level]);
  const [message, setMessage] = useState<string | null>(null);
  const U = 40;
  const [cols, rows] = [12, 9];
  const valider = useCallback(() => {
    if (!actif || !t.ferme) return;
    const ok = estRectangle(t.pts, longueur, largeur);
    const donne = t.pts.map(cle).join(';');
    if (ok) onValider(true, donne, `${longueur} × ${largeur}`);
    else if (essais > 1) {
      setEssais((e) => e - 1);
      setMessage(
        t.pts.length !== 4
          ? 'Un rectangle a 4 sommets.'
          : `Vérifie les angles droits et les longueurs : ${longueur} cm et ${largeur} cm.`,
      );
      sfx.play('faux');
    } else onValider(false, donne, `${longueur} × ${largeur}`);
  }, [actif, t, longueur, largeur, essais, onValider, sfx]);
  const { curseur, visible } = useCurseur(cols, rows, actif, t.ajouter, {
    Backspace: t.annuler,
    v: valider,
    V: valider,
  });
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <section
        className="overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[60%]"
        aria-label="Papier quadrillé"
      >
        <Papier
          cols={cols}
          rows={rows}
          U={U}
          onNoeud={actif ? t.ajouter : undefined}
          curseur={actif && visible ? curseur : null}
          label={`Papier quadrillé, 1 carreau = 1 cm. ${t.pts.length} sommet${t.pts.length > 1 ? 's' : ''} placé${t.pts.length > 1 ? 's' : ''}.`}
        >
          <TracePolygone pts={t.pts} ferme={t.ferme} U={U} />
          {phase === 'faux' && (
            <rect
              x={U}
              y={U}
              width={longueur * U}
              height={largeur * U}
              fill="none"
              stroke="#2E8C48"
              strokeWidth="4"
              strokeDasharray="10 7"
            />
          )}
        </Papier>
      </section>
      <div className="carte flex min-w-0 flex-1 flex-col items-center gap-2 p-4">
        <p className="rounded-full bg-sky/20 px-3 py-1 font-bold">1 carreau = 1 cm</p>
        <Resultat phase={phase} message={message} essais={essais} />
        {phase === 'jeu' && (
          <>
            <p className="text-center text-sm font-bold text-ink-soft">
              Touche les 4 sommets un par un, puis le premier pour fermer (ou flèches + Entrée).
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="blanc" onClick={t.annuler} disabled={!actif || !t.pts.length}>
                ↶ Annuler
              </Button>
              <Button variant="blanc" onClick={t.effacer} disabled={!actif || !t.pts.length}>
                Tout effacer
              </Button>
              <Button variant="grass" size="lg" onClick={valider} disabled={!actif || !t.ferme}>
                ✔ Valider
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function AtelierInstrument(p: PropsAtelier) {
  const ins = useMemo(() => lireInstrument(p.item), [p.item]) as Instrument;
  if (ins.figure === 'segment') return <AtelierSegment {...p} longueur={ins.longueur} />;
  if (ins.figure === 'cercle') return <AtelierCompas {...p} rayon={ins.rayon} />;
  if (ins.figure === 'angle_droit') return <AtelierEquerre {...p} />;
  return <AtelierRectangle {...p} longueur={ins.longueur} largeur={ins.largeur} />;
}
