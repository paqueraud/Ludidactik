/**
 * Tangram & Formes (CATALOGUE n°23) — figures planes et repérage.
 * On reconstitue la silhouette de la figure avec des pièces (carrés, demi-carrés, demi-dominos) qu'on
 * tourne et retourne, puis on répond à la question sur la figure obtenue (son nom, ses propriétés).
 * Facile : contours des pièces dessinés dans la silhouette, pièces déjà orientées, aide illimitée.
 * Normal : contours dessinés, pièces à tourner, une aide. Plus loin : silhouette seule, une pièce en
 * trop, aucune aide.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import type { GeometryItem, Item, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import type { Rng } from '@/engine/rng';
import { useAutoSpeak } from '@/games/_kit/session';
import { ChoiceGrid, Hud } from '@/games/_kit/ui';
import { Bravo, Consigne, EnTete, Indice } from '../_geometrie-commun/ui';
import { useManches } from '../_geometrie-commun/useManches';
import { bravo, dansUnChamp, useRng } from '../_nombres-commun/outils';
import { Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { pointSvg } from '../geometre/Papier';
import {
  type Emplacement,
  type Piece,
  cadre,
  estPourTangram,
  memeOrientation,
  memeType,
  retourner,
  silhouette,
  sommets,
  tourner,
} from './pieces';

const MANCHES: Record<Level, number> = { facile: 5, normal: 6, plus_loin: 6 };
const AIDES: Record<Level, number> = { facile: 99, normal: 1, plus_loin: 0 };
const COULEURS = [
  '#FF7A6B',
  '#4FC3F7',
  '#FFD45C',
  '#7BD389',
  '#8E7CFF',
  '#E0A458',
  '#1AB1AA',
  '#F28FB8',
  '#B4A8FF',
];

interface PieceJeu {
  id: number;
  piece: Piece;
  /** Emplacement occupé (index), null = encore dans la boîte. */
  place: number | null;
}

function melanger(slots: Emplacement[], level: Level, rng: Rng): PieceJeu[] {
  const pieces = slots.map((s) => {
    let p: Piece = { forme: s.forme, w: s.w, h: s.h, coin: s.coin };
    if (level !== 'facile') {
      for (let k = rng.int(0, 3); k > 0; k--) p = tourner(p);
      if (rng.chance(0.4)) p = retourner(p);
    }
    return p;
  });
  if (level === 'plus_loin')
    pieces.push(rng.chance(0.5) ? { forme: 'carre', w: 1, h: 1 } : { forme: 'tri', w: 1, h: 1, coin: 'hg' });
  return rng.shuffle(pieces).map((piece, id) => ({ id, piece, place: null }));
}

const pts = (p: Piece, x: number, y: number, U: number) =>
  sommets(p, x, y)
    .map(([a, b]) => `${a * U},${b * U}`)
    .join(' ');

export default function Tangram(props: GameProps) {
  const { level, paused, sfx, speech, lectureAuto } = props;
  const rng = useRng();
  const m = useManches(props, estPourTangram, {
    manches: MANCHES,
    fin: (g, j, n) =>
      g ? 'Maître du tangram ! Toutes les figures sont construites. 🧩' : `${j} figures réussies sur ${n} !`,
    autoSuivant: 1500,
  });
  const { item } = m;
  useAutoSpeak(
    speech,
    item ? 'Reconstruis la figure avec les pièces.' : null,
    m.manche,
    lectureAuto && !paused,
  );
  if (!item)
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de figure à construire avec les pièces."
        onFin={m.abandonner}
      />
    );
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <EnTete icone="🧩" manche={m.manche} N={m.N} justes={m.stats.correct}>
        <Hud>⭐ {m.score}</Hud>
      </EnTete>
      <Manche
        key={m.manche}
        item={item}
        level={level}
        paused={paused}
        phase={m.phase}
        sfx={sfx}
        speech={speech}
        lectureAuto={lectureAuto}
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
  speech,
  lectureAuto,
  felicitation,
  onValider,
  onSuivant,
}: {
  item: Item;
  level: Level;
  paused: boolean;
  phase: string;
  sfx: GameProps['sfx'];
  speech: GameProps['speech'];
  lectureAuto: boolean;
  felicitation: string;
  onValider: (correct: boolean, donne: string, attendu: string) => void;
  onSuivant: () => void;
}) {
  const reduce = useReducedMotion();
  const rng = useRng();
  const g = item as GeometryItem;
  const slots = useMemo(() => silhouette(item, level)!, [item, level]);
  const { w, h } = cadre(slots);
  const [pieces, setPieces] = useState<PieceJeu[]>(() => melanger(slots, level, rng));
  const [sel, setSel] = useState<number | null>(0);
  const [curseur, setCurseur] = useState<[number, number]>([1, 1]);
  const [clavier, setClavier] = useState(false);
  const [refus, setRefus] = useState<string | null>(null);
  const [aides, setAides] = useState(AIDES[level]);
  const [choisi, setChoisi] = useState<number | null>(null);
  const actif = phase === 'jeu' && !paused;
  const occupes = new Set(pieces.filter((p) => p.place !== null).map((p) => p.place!));
  const fini = occupes.size === slots.length;
  const U = 70;
  const [cols, rows] = [w + 2, h + 2];
  const choices = g.choices!;
  const bonne = choices.indexOf(g.answer);

  useEffect(() => {
    if (fini && lectureAuto && !paused) void speech.speak(g.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fini]);

  const libres = pieces.filter((p) => p.place === null);
  const choisir = (id: number) => {
    if (!actif) return;
    setSel(id);
    setRefus(null);
    sfx.play('tic');
  };
  const pivoter = useCallback(
    (f: (p: Piece) => Piece) => {
      if (!actif || sel === null) return;
      setPieces((ps) => ps.map((p) => (p.id === sel ? { ...p, piece: f(p.piece) } : p)));
      sfx.play('glisse');
    },
    [actif, sel, sfx],
  );

  const poser = useCallback(
    (cx: number, cy: number) => {
      if (!actif || sel === null) return;
      const pj = pieces.find((p) => p.id === sel);
      if (!pj || pj.place !== null) return;
      const x = cx - 1;
      const y = cy - 1;
      // Emplacements libres qui recouvrent la case touchée
      const ici = slots
        .map((s, i) => ({ s, i }))
        .filter(({ s, i }) => !occupes.has(i) && x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h);
      const k = ici.find(({ s }) => memeOrientation(s, pj.piece))?.i ?? -1;
      if (k < 0) {
        const presque = ici.some(({ s }) => memeType(s, pj.piece));
        setRefus(
          presque
            ? 'Presque ! Tourne ou retourne la pièce pour qu’elle rentre ici.'
            : 'Cette pièce ne rentre pas ici. Essaie un autre endroit !',
        );
        sfx.play('faux');
        return;
      }
      sfx.play('pop');
      setRefus(null);
      const next = pieces.map((p) => (p.id === sel ? { ...p, place: k } : p));
      setPieces(next);
      const reste = next.filter((p) => p.place === null);
      setSel(reste[0]?.id ?? null);
      if (next.filter((p) => p.place !== null).length === slots.length) sfx.play('etoile');
    },
    [actif, sel, pieces, slots, occupes, sfx],
  );

  const aider = () => {
    if (!actif || aides <= 0) return;
    const k = slots.findIndex((_, i) => !occupes.has(i));
    if (k < 0) return;
    const s = slots[k]!;
    const pj = pieces.find((p) => p.place === null && memeType(p.piece, s));
    if (!pj) return;
    setPieces((ps) =>
      ps.map((p) =>
        p.id === pj.id ? { ...p, piece: { forme: s.forme, w: s.w, h: s.h, coin: s.coin }, place: k } : p,
      ),
    );
    setAides((a) => a - 1);
    sfx.play('pop');
    setSel(pieces.find((p) => p.place === null && p.id !== pj.id)?.id ?? null);
  };

  // Clavier : flèches (case), Entrée (poser), 1-9 (pièce), R (tourner), F (retourner)
  useEffect(() => {
    if (!actif || fini) return;
    const hdl = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      const d: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      if (d[e.key]) {
        e.preventDefault();
        setClavier(true);
        setCurseur(([x, y]) => [
          Math.max(0, Math.min(cols - 1, x + d[e.key]![0])),
          Math.max(0, Math.min(rows - 1, y + d[e.key]![1])),
        ]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setClavier(true);
        poser(curseur[0], curseur[1]);
      } else if (e.key.toLowerCase() === 'r') pivoter(tourner);
      else if (e.key.toLowerCase() === 'f') pivoter(retourner);
      else if (/^[1-9]$/.test(e.key)) {
        const p = libres[Number(e.key) - 1];
        if (p) choisir(p.id);
      }
    };
    window.addEventListener('keydown', hdl);
    return () => window.removeEventListener('keydown', hdl);
  });

  const selPiece = pieces.find((p) => p.id === sel && p.place === null);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <div className="flex flex-col gap-3 lg:w-[55%]">
        <Consigne
          texte={fini ? g.prompt : 'Reconstruis la figure avec les pièces !'}
          aDire={
            fini
              ? g.prompt
              : 'Reconstruis la figure avec les pièces : choisis une pièce, tourne-la si besoin, puis touche l’endroit où elle va.'
          }
        />
        <section
          className="overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-grape/15 to-cream shadow-soft"
          aria-label="Le plateau du tangram"
        >
          <svg
            viewBox={`0 0 ${cols * U} ${rows * U}`}
            className="mx-auto block h-auto max-h-[48vh] w-full touch-manipulation select-none"
            role="img"
            aria-label={`Silhouette à remplir : ${occupes.size} pièce${occupes.size > 1 ? 's' : ''} placée${occupes.size > 1 ? 's' : ''} sur ${slots.length}.`}
            onPointerUp={(e) => {
              if (!actif || fini) return;
              const p = pointSvg(e.currentTarget, e.clientX, e.clientY);
              if (!p) return;
              setClavier(false);
              const cx = Math.floor(p[0] / U);
              const cy = Math.floor(p[1] / U);
              setCurseur([cx, cy]);
              poser(cx, cy);
            }}
          >
            {Array.from({ length: cols + 1 }, (_, i) => (
              <line
                key={`v${i}`}
                x1={i * U}
                y1={0}
                x2={i * U}
                y2={rows * U}
                stroke="#D9D2FF"
                strokeWidth="1.5"
              />
            ))}
            {Array.from({ length: rows + 1 }, (_, i) => (
              <line
                key={`h${i}`}
                x1={0}
                y1={i * U}
                x2={cols * U}
                y2={i * U}
                stroke="#D9D2FF"
                strokeWidth="1.5"
              />
            ))}
            <g transform={`translate(${U} ${U})`}>
              {/* silhouette */}
              {slots.map((s, i) => (
                <polygon
                  key={`s${i}`}
                  points={pts(s, s.x, s.y, U)}
                  fill="#3A3F55"
                  fillOpacity={level === 'plus_loin' ? 1 : 0.85}
                  stroke={level === 'plus_loin' ? '#3A3F55' : '#FFFFFF'}
                  strokeWidth={level === 'plus_loin' ? 1 : 2.5}
                  strokeDasharray={level === 'plus_loin' ? undefined : '6 5'}
                />
              ))}
              {/* pièces placées */}
              {pieces
                .filter((p) => p.place !== null)
                .map((p) => {
                  const s = slots[p.place!]!;
                  return (
                    <motion.polygon
                      key={`p${p.id}`}
                      points={pts(s, s.x, s.y, U)}
                      fill={COULEURS[p.id % COULEURS.length]}
                      stroke="#24304A"
                      strokeWidth="3"
                      strokeLinejoin="round"
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  );
                })}
              {fini && !reduce && (
                <motion.polygon
                  points={slots.map((s) => pts(s, s.x, s.y, U)).join(' ')}
                  fill="none"
                  stroke="#FFD45C"
                  strokeWidth="0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1 }}
                />
              )}
            </g>
            {clavier && actif && !fini && (
              <rect
                x={curseur[0] * U + 3}
                y={curseur[1] * U + 3}
                width={U - 6}
                height={U - 6}
                rx="8"
                fill="none"
                stroke="#8E7CFF"
                strokeWidth="5"
                pointerEvents="none"
              />
            )}
          </svg>
        </section>
      </div>

      <div className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-4">
        {!fini ? (
          <>
            <h2 className="text-lg">Ma boîte de pièces</h2>
            <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Pièces">
              {libres.map((p, k) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => choisir(p.id)}
                  disabled={!actif}
                  aria-pressed={sel === p.id}
                  aria-label={`Pièce ${k + 1} : ${p.piece.forme === 'carre' ? 'carré' : p.piece.w === p.piece.h ? 'demi-carré' : 'triangle long'}`}
                  className={`flex h-20 w-20 items-center justify-center rounded-2xl border-4 bg-card shadow-pop-sm ${sel === p.id ? 'border-grape ring-4 ring-grape/30' : 'border-white'}`}
                >
                  <svg viewBox="-0.15 -0.15 2.3 2.3" className="h-14 w-14" aria-hidden>
                    <polygon
                      points={sommets(p.piece, (2 - p.piece.w) / 2, (2 - p.piece.h) / 2)
                        .map((q) => q.join(','))
                        .join(' ')}
                      fill={COULEURS[p.id % COULEURS.length]}
                      stroke="#24304A"
                      strokeWidth="0.08"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="blanc" onClick={() => pivoter(tourner)} disabled={!actif || !selPiece}>
                ⟳ Tourner (R)
              </Button>
              <Button variant="blanc" onClick={() => pivoter(retourner)} disabled={!actif || !selPiece}>
                ⇋ Retourner (F)
              </Button>
              {aides > 0 && (
                <Button variant="sun" onClick={aider} disabled={!actif}>
                  💡 Placer une pièce{level === 'normal' ? ' (1 fois)' : ''}
                </Button>
              )}
            </div>
            {refus && (
              <p className="text-center font-bold text-coral-dark" role="status">
                {refus}
              </p>
            )}
            {level === 'facile' && !refus && (
              <Indice>Les pointillés blancs montrent où vont les pièces.</Indice>
            )}
            <p className="text-center text-sm font-bold text-ink-soft">
              Choisis une pièce, puis touche l’endroit de la silhouette où elle va (ou flèches + Entrée).
            </p>
          </>
        ) : (
          <>
            <Bravo texte="Figure construite ! Maintenant, réponds :" />
            <ChoiceGrid
              choices={choices}
              onPick={(i) => {
                if (!actif) return;
                setChoisi(i);
                onValider(i === bonne, choices[i]!, g.answer);
              }}
              reveal={phase !== 'jeu' && choisi !== null ? { correct: bonne, chosen: choisi } : null}
              disabled={!actif}
            />
          </>
        )}
        {phase === 'juste' && <Bravo texte={felicitation} />}
        <Correction
          ouvert={phase === 'faux'}
          bonne={g.answer}
          explication={g.explication}
          onContinuer={onSuivant}
        />
      </div>
    </div>
  );
}
