/**
 * L'expérience aléatoire de l'énoncé, dessinée et « testable » : on lance le dé, la pièce, on tire une
 * carte ou une bille, on fait tourner la roue… Les résultats s'ajoutent dans un tableau d'effectifs.
 * Tester ne donne pas la réponse : cela aide à se faire une idée des chances.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui';
import type { Rng } from '@/engine/rng';
import type { SfxService } from '@/services/sfx';
import {
  type Experience,
  type Tirage,
  cleResultat,
  decrire,
  teinte,
  tirer,
} from '../_geometrie-commun/proba';
import { useBoucle } from '../_nombres-commun/outils';

const POINTS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-1, -1],
    [1, 1],
  ],
  3: [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  4: [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  5: [
    [-1, -1],
    [1, -1],
    [0, 0],
    [-1, 1],
    [1, 1],
  ],
  6: [
    [-1, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
  ],
};

function De({ face, couleur = '#FFFFFF', roule }: { face: number; couleur?: string; roule: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="-40 -40 80 80"
      className="h-20 w-20"
      animate={roule && !reduce ? { rotate: [0, 200, 360], y: [0, -24, 0] } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.6 }}
      aria-label={`dé : ${face}`}
      role="img"
    >
      <rect x="-34" y="-34" width="68" height="68" rx="14" fill={couleur} stroke="#24304A" strokeWidth="4" />
      {POINTS[face]!.map(([x, y], i) => (
        <circle key={i} cx={x * 17} cy={y * 17} r="7" fill="#24304A" />
      ))}
    </motion.svg>
  );
}

function Piece({ cote, roule }: { cote: 'pile' | 'face'; roule: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="-40 -40 80 80"
      className="h-20 w-20"
      animate={roule && !reduce ? { scaleX: [1, 0.1, 1, 0.1, 1], y: [0, -30, 0] } : { scaleX: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      role="img"
      aria-label={`pièce : ${cote}`}
    >
      <circle r="34" fill="#FFD45C" stroke="#D69600" strokeWidth="4" />
      <circle r="26" fill="none" stroke="#D69600" strokeWidth="2" />
      <text
        y="8"
        textAnchor="middle"
        fontSize="19"
        fontWeight="800"
        fill="#6B4A00"
        fontFamily="Baloo 2, sans-serif"
      >
        {cote}
      </text>
    </motion.svg>
  );
}

function Carte({ n, retournee, roule }: { n: number; retournee: boolean; roule: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`flex h-14 w-10 items-center justify-center rounded-lg border-2 border-ink font-titre text-xl font-extrabold ${
        retournee ? 'bg-card' : 'bg-gradient-to-br from-grape to-sky'
      }`}
      animate={roule && retournee && !reduce ? { rotateY: [180, 0], y: [0, -14, 0] } : { rotateY: 0, y: 0 }}
      transition={{ duration: 0.5 }}
      aria-hidden={!retournee}
    >
      {retournee ? n : ''}
    </motion.div>
  );
}

function Sac({ x, sortie }: { x: Extract<Experience, { type: 'sac' }>; sortie: string | null }) {
  const billes = x.couleurs.flatMap((c) => Array.from({ length: c.n }, () => c.nom));
  const cols = Math.ceil(Math.sqrt(billes.length * 1.4));
  return (
    <svg
      viewBox="-80 -70 160 160"
      className="h-36 w-36"
      role="img"
      aria-label={`Sac de ${billes.length} billes`}
    >
      <path
        d="M -60 -30 Q -75 70 0 75 Q 75 70 60 -30 Q 30 -45 0 -40 Q -30 -45 -60 -30 Z"
        fill="#F4E1C1"
        stroke="#8D5A3B"
        strokeWidth="4"
      />
      <path d="M -40 -42 Q 0 -60 40 -42" fill="none" stroke="#8D5A3B" strokeWidth="5" />
      {billes.map((b, i) => {
        const cx = -44 + ((i % cols) + 0.5) * (88 / cols);
        const cy = -14 + Math.floor(i / cols) * (88 / cols);
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={Math.min(12, 38 / cols)}
            fill={teinte(b)}
            stroke="#24304A"
            strokeWidth="2"
          />
        );
      })}
      {sortie && <circle cx="58" cy="-52" r="14" fill={teinte(sortie)} stroke="#24304A" strokeWidth="3" />}
    </svg>
  );
}

function Roue({ x, angle }: { x: Extract<Experience, { type: 'roue' }>; angle: number }) {
  const parts = x.couleurs.flatMap((c) => Array.from({ length: c.n }, () => c.nom));
  const n = parts.length;
  const R = 70;
  return (
    <svg viewBox="-85 -90 170 175" className="h-40 w-40" role="img" aria-label={`Roue de ${n} parts égales`}>
      {parts.map((c, i) => {
        const a1 = ((i / n) * 360 - 90) * (Math.PI / 180);
        const a2 = (((i + 1) / n) * 360 - 90) * (Math.PI / 180);
        return (
          <path
            key={i}
            d={`M 0 0 L ${R * Math.cos(a1)} ${R * Math.sin(a1)} A ${R} ${R} 0 0 1 ${R * Math.cos(a2)} ${R * Math.sin(a2)} Z`}
            fill={teinte(c)}
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
        );
      })}
      <circle r={R} fill="none" stroke="#24304A" strokeWidth="3" />
      <g transform={`rotate(${angle})`}>
        <path d="M -6 0 L 0 -62 L 6 0 Z" fill="#24304A" />
        <circle r="9" fill="#FFD45C" stroke="#24304A" strokeWidth="3" />
      </g>
    </svg>
  );
}

export function ExperienceVue({
  x,
  rng,
  sfx,
  actif,
  limite,
}: {
  x: Experience;
  rng: Rng;
  sfx: SfxService;
  actif: boolean;
  /** Nombre maximal de tirages (null = illimité). */
  limite: number | null;
}) {
  const [dernier, setDernier] = useState<Tirage | null>(null);
  const [effectifs, setEffectifs] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [roule, setRoule] = useState(0);
  const [angle, setAngle] = useState(0);

  const lancer = useCallback(
    (fois: number) => {
      if (!actif || (limite !== null && total >= limite)) return;
      const k = limite !== null ? Math.min(fois, limite - total) : fois;
      const res = Array.from({ length: k }, () => tirer(x, rng));
      const e = { ...effectifs };
      for (const r of res) e[cleResultat(r)] = (e[cleResultat(r)] ?? 0) + 1;
      setEffectifs(e);
      setTotal((t) => t + k);
      const d = res[res.length - 1]!;
      setDernier(d);
      setRoule((r) => r + 1);
      if (x.type === 'roue' && d.type === 'couleur') {
        const parts = x.couleurs.flatMap((c) => Array.from({ length: c.n }, () => c.nom));
        const idx = parts.findIndex(
          (p, i) => p === d.nom && parts.slice(0, i).filter((q) => q === d.nom).length === d.index,
        );
        const cible = ((idx + 0.5) / parts.length) * 360;
        setAngle((a) => a - (a % 360) + 720 + cible);
      }
      sfx.play(x.type.includes('piece') ? 'piece' : 'pop');
    },
    [actif, limite, total, x, rng, effectifs, sfx],
  );

  const visuel = () => {
    const tourne = roule > 0;
    switch (x.type) {
      case 'de':
      case 'deux-des': {
        const faces = dernier?.type === 'de' ? dernier.faces : x.type === 'de' ? [6] : [3, 4];
        return (
          <div className="flex gap-3" key={roule}>
            {faces.map((f, i) => (
              <De
                key={i}
                face={f}
                couleur={x.type === 'deux-des' ? (i ? '#8FD3FF' : '#FFB4AA') : '#FFFFFF'}
                roule={tourne}
              />
            ))}
          </div>
        );
      }
      case 'piece':
      case 'deux-pieces':
      case 'trois-pieces': {
        const n = x.type === 'piece' ? 1 : x.type === 'deux-pieces' ? 2 : 3;
        const cotes = dernier?.type === 'piece' ? dernier.cotes : Array<'pile' | 'face'>(n).fill('pile');
        return (
          <div className="flex gap-2" key={roule}>
            {cotes.map((c, i) => (
              <Piece key={i} cote={c} roule={tourne} />
            ))}
          </div>
        );
      }
      case 'piece-de':
        return (
          <div className="flex gap-3" key={roule}>
            <Piece cote={dernier?.type === 'mixte' ? dernier.cote : 'pile'} roule={tourne} />
            <De face={dernier?.type === 'mixte' ? dernier.face : 1} roule={tourne} />
          </div>
        );
      case 'cartes':
        return (
          <div
            className="flex max-w-xs flex-wrap justify-center gap-1.5"
            key={roule}
            style={{ perspective: 600 }}
          >
            {Array.from({ length: x.n }, (_, i) => (
              <Carte
                key={i}
                n={i + 1}
                retournee={dernier?.type === 'carte' && dernier.n === i + 1}
                roule={tourne}
              />
            ))}
          </div>
        );
      case 'sac':
        return <Sac x={x} sortie={dernier?.type === 'couleur' ? dernier.nom : null} />;
      case 'roue':
        return <RoueAnimee x={x} angle={angle} />;
    }
  };

  const cles = Object.keys(effectifs).sort(
    (a, b) => (Number(a) || 0) - (Number(b) || 0) || a.localeCompare(b),
  );
  const max = Math.max(1, ...Object.values(effectifs));
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex min-h-[6rem] items-center justify-center">{visuel()}</div>
      <p className="min-h-[1.75rem] text-center font-titre text-lg font-bold" aria-live="polite">
        {dernier ? `Résultat : ${decrire(dernier)}` : 'Teste l’expérience pour voir ce qui peut arriver.'}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="sun"
          onClick={() => lancer(1)}
          disabled={!actif || (limite !== null && total >= limite)}
        >
          🎲 Tester
        </Button>
        <Button
          variant="blanc"
          onClick={() => lancer(10)}
          disabled={!actif || (limite !== null && total >= limite)}
        >
          × 10
        </Button>
      </div>
      {total > 0 && (
        <div className="w-full max-w-md rounded-2xl bg-cream p-2">
          <p className="text-center text-sm font-bold text-ink-soft">
            {total} essai{total > 1 ? 's' : ''}
            {limite !== null ? ` sur ${limite}` : ''}
          </p>
          <ul className="flex flex-col gap-1">
            {cles.map((k) => (
              <li key={k} className="flex items-center gap-2 text-sm">
                <span className="w-20 shrink-0 truncate text-right font-bold">{k}</span>
                <span
                  className="h-3 rounded-full bg-grape"
                  style={{ width: `${(effectifs[k]! / max) * 70}%` }}
                  aria-hidden
                />
                <span className="font-bold">{effectifs[k]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RoueAnimee({ x, angle }: { x: Extract<Experience, { type: 'roue' }>; angle: number }) {
  const reduce = useReducedMotion();
  const [a, setA] = useState(angle);
  // L'aiguille rejoint l'angle tiré en ralentissant (instantané si mouvement réduit).
  useBoucle(Math.abs(a - angle) > 0.5, (dt) =>
    setA((v) => (reduce ? angle : v + (angle - v) * Math.min(1, dt * 3.2))),
  );
  return <Roue x={x} angle={a} />;
}
