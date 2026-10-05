/**
 * Les Diviseurs mystères (CATALOGUE n° 19) — chasse aux œufs.
 * Des œufs numérotés sont cachés dans le jardin ; on range chacun dans le bon panier (« divisible par 5 »,
 * « 6 est un diviseur », « pair »…). Glisser l'œuf sur le panier, ou toucher l'œuf puis le panier.
 * Clavier : Tab jusqu'à un œuf, Entrée pour le prendre, puis le chiffre du panier (1 à 6).
 * Chaque œuf est vérifié tout de suite : s'il n'est pas dans le bon panier, il y est remis avec la règle.
 * Niveaux : Facile = la règle est affichée dès le début ; Normal = 1 indice ; Plus loin = sans indice,
 * avec un soleil qui se couche (bonus si on finit avant la nuit, jamais bloquant).
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { ClassificationItem, Item, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { parNiveau } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import { aDire } from '../_calcul-commun/tirer';
import { Bandeau, Bulle, EtatVide, useManches } from '../_calcul-commun/ui';

const MANCHES: Record<Level, number> = { facile: 4, normal: 5, plus_loin: 6 };
const DUREE_SOLEIL_MS = 40_000;
const COULEURS_OEUFS = ['#FF9AA2', '#FFD45C', '#8EE3C8', '#B9A7FF', '#7FD0F5', '#FFB877'];
const PANIERS = ['#C98B3C', '#B0763A', '#9C6A36', '#C9965B', '#A86F3F', '#8A5A3B'];

const estNombre = (s: string) => /^\d[\d  ]*$/.test(s.trim());
const itemDiviseurs = (it: Item): it is ClassificationItem =>
  it.kind === 'classification' && it.elements.every((e) => estNombre(e.label));
const convertir = (it: Item): ClassificationItem | null => (itemDiviseurs(it) ? it : null);

function Oeuf({ texte, couleur, taille = 64 }: { texte: string; couleur: string; taille?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: taille, height: taille * 1.22 }}
    >
      <svg viewBox="0 0 60 74" className="absolute inset-0 h-full w-full" aria-hidden>
        <ellipse cx="30" cy="70" rx="18" ry="3" fill="rgb(0 0 0 / 0.15)" />
        <path
          d="M30 2 C 50 2 58 34 58 46 C 58 62 46 72 30 72 C 14 72 2 62 2 46 C 2 34 10 2 30 2 Z"
          fill={couleur}
          stroke="rgb(0 0 0 / 0.15)"
          strokeWidth="2"
        />
        <path
          d="M6 40 q 6 -6 12 0 t 12 0 t 12 0 t 12 0"
          stroke="#fff"
          strokeWidth="3"
          fill="none"
          opacity="0.7"
        />
        <ellipse cx="20" cy="20" rx="6" ry="10" fill="#fff" opacity="0.35" transform="rotate(20 20 20)" />
      </svg>
      <span className="relative mt-3 rounded-full bg-white/90 px-1.5 font-titre text-lg font-extrabold leading-tight text-ink">
        {texte}
      </span>
    </span>
  );
}

interface Etat {
  /** Panier choisi pour chaque œuf (index), null = encore dans le jardin. */
  places: (number | null)[];
  /** Œufs corrigés (mal rangés puis remis dans le bon panier). */
  corriges: Set<number>;
}

export default function Diviseurs(props: GameProps) {
  const { level, lectureAuto, speech, sfx, paused } = props;
  const reduce = useReducedMotion();
  const jeu = useManches(props, {
    total: parNiveau(level, MANCHES),
    convertir,
    fin: (b, t) => ({
      headline:
        b === t
          ? 'Chasse aux œufs parfaite ! 🥚'
          : `${b} jardin${b > 1 ? 's' : ''} parfait${b > 1 ? 's' : ''} sur ${t} !`,
    }),
    delaiJuste: 1800,
  });
  const { courant, manche, total, etat, fini, repondre, suivant, bonnes } = jeu;
  const item = courant?.valeur ?? null;
  const [st, setSt] = useState<Etat>({ places: [], corriges: new Set() });
  const [selection, setSelection] = useState<number | null>(null);
  const [indice, setIndice] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [soleil, setSoleil] = useState(1);
  const [bonus, setBonus] = useState(0);
  const paniers = useRef<(HTMLButtonElement | null)[]>([]);

  // ordre et positions des œufs dans le jardin (stables pour la manche)
  const ordre = useMemo(() => {
    if (!item) return [];
    const idx = item.elements.map((_, i) => i);
    let s = manche * 97 + item.elements.length;
    for (let i = idx.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [idx[i], idx[j]] = [idx[j]!, idx[i]!];
    }
    return idx;
  }, [item, manche]);

  useEffect(() => {
    if (!item) return;
    setSt({ places: item.elements.map(() => null), corriges: new Set() });
    setSelection(null);
    setIndice(level === 'facile');
    setNote(null);
    setSoleil(1);
    if (lectureAuto) void speech.speak(aDire(item.prompt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  // Le soleil se couche (Plus loin) : bonus seulement, jamais bloquant
  useEffect(() => {
    if (level !== 'plus_loin' || !item || etat || paused || fini) return;
    const debut = performance.now() - (1 - soleil) * DUREE_SOLEIL_MS;
    const t = setInterval(
      () => setSoleil(Math.max(0, 1 - (performance.now() - debut) / DUREE_SOLEIL_MS)),
      250,
    );
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, item, etat, paused, fini]);

  const bloque = !!etat || paused || fini;

  const ranger = useCallback(
    (oeuf: number, panier: number) => {
      if (!item || bloque || st.places[oeuf] !== null || panier >= item.categories.length) return;
      const bon = item.elements[oeuf]!.category;
      const places = [...st.places];
      places[oeuf] = bon;
      const corriges = new Set(st.corriges);
      if (bon !== panier) {
        corriges.add(oeuf);
        sfx.play('glisse');
        setNote(
          `Presque ! ${item.elements[oeuf]!.label} va dans « ${item.categories[bon]} ». ${item.explication}`,
        );
      } else {
        sfx.play('pop');
        setNote(null);
      }
      setSt({ places, corriges });
      setSelection(null);
      if (places.every((p) => p !== null)) {
        const juste = corriges.size === 0;
        if (juste && level === 'plus_loin' && soleil > 0) setBonus((b) => b + 1);
        const donne = juste
          ? 'tous bien rangés'
          : `mal rangés : ${[...corriges].map((i) => item.elements[i]!.label).join(', ')}`;
        repondre(
          juste,
          donne,
          item.elements.map((e) => `${e.label} → ${item.categories[e.category]}`).join(' ; '),
        );
      }
    },
    [item, bloque, st, sfx, level, soleil, repondre],
  );

  // Clavier : chiffre = panier pour l'œuf choisi
  useEffect(() => {
    if (!item || bloque) return;
    const h = (e: KeyboardEvent) => {
      if (selection === null) return;
      const k = Number(e.key);
      if (Number.isInteger(k) && k >= 1 && k <= item.categories.length) {
        e.preventDefault();
        ranger(selection, k - 1);
      } else if (e.key === 'Escape') setSelection(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [item, bloque, selection, ranger]);

  if (!item)
    return (
      <EtatVide
        icone="🥚"
        jeu="Les Diviseurs mystères"
        besoin="de nombres à ranger (divisibilité, diviseurs, multiples)"
      />
    );

  const restants = ordre.filter((i) => st.places[i] === null);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          Jardin {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🥚</span> {bonnes}
          {bonus > 0 && (
            <>
              {' '}
              · <span aria-hidden>☀️</span> {bonus}
            </>
          )}
        </Hud>
      </Bandeau>

      <section className="carte flex w-full flex-col items-center gap-2 p-3">
        <div className="flex items-start gap-3">
          <SpeakButton text={aDire(item.prompt)} label="Écouter la consigne" />
          <p className="font-titre text-xl font-extrabold leading-snug sm:text-2xl" aria-live="polite">
            {item.prompt}
          </p>
        </div>
        {indice && !etat && (
          <Bulle ton="sky">
            <span aria-hidden>🐰</span>
            <span>{item.explication}</span>
            <SpeakButton text={item.explication} size={34} label="Écouter la règle" />
          </Bulle>
        )}
        {level === 'normal' && !indice && !etat && (
          <Button
            variant="sun"
            icon={<Lightbulb aria-hidden />}
            onClick={() => setIndice(true)}
            disabled={bloque}
          >
            Indice
          </Button>
        )}
      </section>

      {/* Le jardin */}
      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft"
        style={{ background: 'linear-gradient(180deg,#BFE6FF 0%,#BFE6FF 18%,#9BDB8C 18%,#7BC96F 100%)' }}
        aria-label="Le jardin"
      >
        {level === 'plus_loin' && (
          <div
            className="absolute right-4 transition-all"
            style={{ top: `${4 + (1 - soleil) * 40}px`, opacity: 0.4 + soleil * 0.6 }}
            aria-label={
              soleil > 0
                ? 'Le soleil se couche : range vite pour un bonus !'
                : 'C’est la nuit, prends ton temps'
            }
            role="img"
          >
            <span className="text-4xl">{soleil > 0 ? '☀️' : '🌙'}</span>
          </div>
        )}
        <div
          className="flex min-h-[150px] flex-wrap items-end justify-center gap-x-3 gap-y-1 px-3 pb-3 pt-12"
          role="group"
          aria-label="Œufs cachés"
        >
          <AnimatePresence>
            {restants.map((i, k) => (
              <motion.button
                key={`${manche}-${i}`}
                type="button"
                initial={reduce ? false : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: (k % 3) * 6, rotate: selection === i ? [0, -6, 6, 0] : 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: 60, scale: 0.5 }}
                transition={selection === i ? { rotate: { repeat: Infinity, duration: 0.6 } } : undefined}
                drag={!bloque && !reduce}
                dragSnapToOrigin
                whileDrag={{ scale: 1.15, zIndex: 40 }}
                onDragEnd={(_, info) => {
                  const x = info.point.x - window.scrollX;
                  const y = info.point.y - window.scrollY;
                  const p = paniers.current.findIndex((el) => {
                    const r = el?.getBoundingClientRect();
                    return r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
                  });
                  if (p >= 0) ranger(i, p);
                }}
                onClick={() => {
                  sfx.play('tic');
                  setSelection((s) => (s === i ? null : i));
                }}
                disabled={bloque}
                className={`touch-none rounded-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-grape ${selection === i ? 'drop-shadow-[0_0_10px_rgba(142,124,255,0.9)]' : ''}`}
                aria-pressed={selection === i}
                aria-label={`Œuf ${item.elements[i]!.label}`}
              >
                <Oeuf texte={item.elements[i]!.label} couleur={COULEURS_OEUFS[i % COULEURS_OEUFS.length]!} />
              </motion.button>
            ))}
          </AnimatePresence>
          {restants.length === 0 && (
            <p className="py-6 font-titre text-xl font-bold text-white drop-shadow">
              Tous les œufs sont rangés !
            </p>
          )}
        </div>
        {/* Les paniers */}
        <div
          className="flex flex-wrap items-stretch justify-center gap-2 bg-[#5DAE53]/60 p-2"
          role="group"
          aria-label="Paniers"
        >
          {item.categories.map((c, p) => {
            const dedans = ordre.filter((i) => st.places[i] === p);
            return (
              <button
                key={c}
                ref={(el) => {
                  paniers.current[p] = el;
                }}
                type="button"
                onClick={() => selection !== null && ranger(selection, p)}
                disabled={bloque || selection === null}
                className={`flex min-h-[110px] min-w-[140px] max-w-[220px] flex-1 flex-col items-center justify-between rounded-2xl border-4 p-2 transition-transform disabled:cursor-default ${
                  selection !== null && !bloque
                    ? 'border-sun ring-4 ring-sun/40 hover:scale-[1.03]'
                    : 'border-white/70'
                }`}
                style={{
                  background: `repeating-linear-gradient(45deg, rgb(0 0 0 / 0.1) 0 6px, transparent 6px 12px), repeating-linear-gradient(-45deg, rgb(255 255 255 / 0.1) 0 6px, transparent 6px 12px), ${PANIERS[p % PANIERS.length]}`,
                }}
                aria-label={`Panier ${p + 1} : ${c}${dedans.length ? ` (${dedans.map((i) => item.elements[i]!.label).join(', ')})` : ''}`}
              >
                <span className="rounded-lg bg-white/90 px-2 text-center text-sm font-extrabold leading-tight text-ink">
                  <span className="mr-1 rounded-full bg-ink px-1.5 text-white">{p + 1}</span>
                  {c}
                </span>
                <span className="mt-1 flex flex-wrap justify-center gap-1">
                  {dedans.map((i) => (
                    <span key={i} className={`rounded-full ${st.corriges.has(i) ? 'ring-4 ring-coral' : ''}`}>
                      <Oeuf
                        texte={item.elements[i]!.label}
                        couleur={COULEURS_OEUFS[i % COULEURS_OEUFS.length]!}
                        taille={38}
                      />
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="w-full">
        {note && !etat && (
          <Bulle>
            <span aria-hidden>🐰</span>
            <span role="status">{note}</span>
          </Bulle>
        )}
        <AnimatePresence>
          {etat && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="carte w-full p-4">
              <Feedback
                state={etat}
                message={
                  etat === 'juste'
                    ? 'Tous les œufs sont dans le bon panier ! 🧺'
                    : `Presque ! ${st.corriges.size} œuf${st.corriges.size > 1 ? 's' : ''} à revoir (entouré${st.corriges.size > 1 ? 's' : ''} en rouge).`
                }
                explication={etat === 'faux' ? item.explication : undefined}
                onContinue={suivant}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
