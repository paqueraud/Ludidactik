/**
 * Le Géomètre (CATALOGUE n°21) — figures planes, propriétés, tracés.
 * Selon l'item, l'atelier change : reconnaître une figure (équerre et règle virtuelles), placer un point
 * sur un quadrillage, reproduire une figure, tracer avec la règle, le compas ou l'équerre, ou classer.
 * Facile : codages visibles (angles droits, côtés égaux), repères, 3 essais.
 * Normal : instruments à disposition, 2 essais. Plus loin : figures tournées, 1 essai, bonus de rapidité.
 */
import { useMemo } from 'react';
import type { ClassificationItem, GeometryItem, Item, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { useAutoSpeak } from '@/games/_kit/session';
import { Hud } from '@/games/_kit/ui';
import { Bacs } from '../_geometrie-commun/Bacs';
import { type Dessin, cadre, dessinDuNom } from '../_geometrie-commun/figures';
import { Bravo, Consigne, EnTete, pl } from '../_geometrie-commun/ui';
import { useManches } from '../_geometrie-commun/useManches';
import { bravo, useRng } from '../_nombres-commun/outils';
import { Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { AtelierFigure, AtelierPoints, AtelierReproduire, type PropsAtelier } from './Ateliers';
import { AtelierInstrument } from './Instruments';
import { estPourGeometre, modeDe } from './logique';

const MANCHES: Record<Level, number> = { facile: 6, normal: 7, plus_loin: 8 };

/** Petite figure dessinée sur une étiquette à classer. */
function MiniFigure({ d }: { d: Dessin }) {
  const c = cadre(d);
  const m = 0.6;
  return (
    <svg
      viewBox={`${c.x - m} ${c.y - m} ${c.w + 2 * m} ${c.h + 2 * m}`}
      className="h-10 w-12 shrink-0"
      aria-hidden
    >
      {d.type === 'polygone' && (
        <polygon
          points={d.points.map((p) => p.join(',')).join(' ')}
          fill="#4FC3F7"
          fillOpacity="0.35"
          stroke="#24304A"
          strokeWidth="0.35"
          strokeLinejoin="round"
        />
      )}
      {d.type === 'cercle' && (
        <circle
          cx={d.centre[0]}
          cy={d.centre[1]}
          r={d.rayon}
          fill="#4FC3F7"
          fillOpacity="0.35"
          stroke="#24304A"
          strokeWidth="0.35"
        />
      )}
    </svg>
  );
}

/** Deux segments (droites parallèles, perpendiculaires…) dessinés sur une étiquette. */
function MiniDroites({ d }: { d: { d1: [number, number][]; d2: [number, number][] } }) {
  const pts = [...d.d1, ...d.d2];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, y0] = [Math.min(...xs) - 0.8, Math.min(...ys) - 0.8];
  const [w, h] = [Math.max(...xs) - x0 + 0.8, Math.max(...ys) - y0 + 0.8];
  return (
    <svg viewBox={`${x0} ${y0} ${w} ${h}`} className="h-12 w-14 shrink-0" aria-hidden>
      {[d.d1, d.d2].map((s, i) => (
        <line
          key={i}
          x1={s[0]![0]}
          y1={s[0]![1]}
          x2={s[1]![0]}
          y2={s[1]![1]}
          stroke={i ? '#FF7A6B' : '#1976D2'}
          strokeWidth="0.45"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function rendusClassement(item: ClassificationItem) {
  const dessins = item.meta?.dessins as
    Record<string, { d1: [number, number][]; d2: [number, number][] }> | undefined;
  const rendus = item.elements.map((e) => {
    const dr = dessins?.[e.label];
    if (dr && Array.isArray(dr.d1) && Array.isArray(dr.d2)) return <MiniDroites d={dr} />;
    const f = dessinDuNom(e.label);
    return f ? <MiniFigure d={f} /> : null;
  });
  return rendus.some(Boolean)
    ? (i: number) =>
        rendus[i] ??
        (item.elements[i]!.image ? <span className="text-2xl">{item.elements[i]!.image}</span> : null)
    : undefined;
}

export default function Geometre(props: GameProps) {
  const { level, paused, sfx, speech, lectureAuto } = props;
  const rng = useRng();
  const m = useManches(props, estPourGeometre, {
    manches: MANCHES,
    fin: (g, j, n) =>
      g
        ? 'Diplôme de géomètre en poche ! 📐'
        : `${j} ${pl(j, 'défi de géomètre réussi', 'défis de géomètre réussis')} sur ${n} !`,
    autoSuivant: 1500,
  });
  const { item } = m;
  useAutoSpeak(
    speech,
    item ? (item.spoken ?? ('prompt' in item ? item.prompt : null)) : null,
    m.manche,
    lectureAuto && !paused,
  );
  if (!item)
    return <PasDeQuestion texte="Cette leçon n’a pas de défi pour le géomètre." onFin={m.abandonner} />;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <EnTete icone="📐" manche={m.manche} N={m.N} justes={m.stats.correct}>
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
  item: Item;
  level: Level;
  paused: boolean;
  phase: string;
  sfx: GameProps['sfx'];
  felicitation: string;
  onValider: PropsAtelier['onValider'];
  onSuivant: () => void;
}) {
  const mode = modeDe(item);
  const actif = phase === 'jeu' && !paused;
  // En Plus loin, on raisonne sans le dessin (« deux droites perpendiculaires à une même droite »).
  const rendu = useMemo(
    () => (item.kind === 'classification' && level !== 'plus_loin' ? rendusClassement(item) : undefined),
    [item, level],
  );
  const p = { item: item as GeometryItem, level, actif, phase, sfx, onValider };
  const prompt = 'prompt' in item ? item.prompt : '';
  const bonne = item.kind === 'geometry_shape' && mode === 'figure' ? item.answer : undefined;
  return (
    <>
      <Consigne texte={prompt} aDire={item.spoken ?? prompt} />
      {mode === 'figure' && <AtelierFigure {...p} />}
      {mode === 'points' && <AtelierPoints {...p} />}
      {mode === 'reproduire' && <AtelierReproduire {...p} />}
      {mode === 'instrument' && <AtelierInstrument {...p} />}
      {mode === 'classer' && item.kind === 'classification' && (
        <div className="carte p-3 sm:p-4">
          <Bacs
            item={item}
            level={level}
            actif={actif}
            sfx={sfx}
            rendu={rendu}
            onFini={(r) => onValider(r.correct, r.donne, r.attendu)}
          />
        </div>
      )}
      {(phase === 'juste' || phase === 'faux') && (
        <div className="carte flex flex-col items-center gap-2 p-4">
          {phase === 'juste' && <Bravo texte={felicitation} />}
          <Correction
            ouvert={phase === 'faux'}
            titre={
              mode === 'figure' || mode === 'classer'
                ? 'Presque !'
                : 'Presque ! La bonne réponse est dessinée en vert.'
            }
            bonne={bonne}
            explication={item.explication}
            onContinuer={onSuivant}
          />
        </div>
      )}
    </>
  );
}
