/**
 * L'Usine à patrons (CATALOGUE n°24) — solides et patrons.
 * Postes de l'usine : reconnaître un solide qu'on fait tourner ; compter faces, arêtes, sommets en les
 * touchant ; dire si un patron forme un cube (ou un pavé) puis le voir se plier en 3D ; compléter un
 * patron de cube en ajoutant le carré qui manque.
 * Facile : arêtes cachées en pointillés, outil « compter » activé, pliage d'essai avant de répondre.
 * Normal : arêtes cachées en pointillés, 2 essais pour compléter. Plus loin : sans pointillés, 1 essai.
 */
import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import type { GeometryItem, Item, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { useAutoSpeak } from '@/games/_kit/session';
import { ChoiceGrid, Hud } from '@/games/_kit/ui';
import { type Cell, cle } from '../_geometrie-commun/grille';
import { type PlanPatron, type Rect, casesEnRects, lirePatron, plierCube } from '../_geometrie-commun/patron';
import { modeleSolide } from '../_geometrie-commun/solides';
import { Bravo, Consigne, EnTete, Indice } from '../_geometrie-commun/ui';
import { useManches } from '../_geometrie-commun/useManches';
import { bravo, dansUnChamp, useBoucle, useRng } from '../_nombres-commun/outils';
import { Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { estPourUsine, modeUsine, quoiCompter } from './logique';
import { Pliage } from './Pliage';
import { Solide3D } from './Solide3D';

const MANCHES: Record<Level, number> = { facile: 6, normal: 7, plus_loin: 8 };
const ESSAIS: Record<Level, number> = { facile: 3, normal: 2, plus_loin: 1 };

type PropsPoste = {
  item: GeometryItem;
  level: Level;
  actif: boolean;
  paused: boolean;
  phase: string;
  sfx: GameProps['sfx'];
  onValider: (correct: boolean, donne: string, attendu: string) => void;
};

export default function UsinePatrons(props: GameProps) {
  const { level, paused, sfx, speech, lectureAuto } = props;
  const rng = useRng();
  const m = useManches(props, estPourUsine, {
    manches: MANCHES,
    fin: (g, j, n) =>
      g ? 'La chaîne de l’usine tourne à plein régime ! 🏭' : `${j} commandes réussies sur ${n} !`,
    autoSuivant: 3400,
  });
  const { item } = m;
  useAutoSpeak(speech, item && 'prompt' in item ? item.prompt : null, m.manche, lectureAuto && !paused);
  if (!item)
    return (
      <PasDeQuestion texte="Cette leçon n’a pas de solide ni de patron pour l’usine." onFin={m.abandonner} />
    );
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <EnTete icone="📦" manche={m.manche} N={m.N} justes={m.stats.correct}>
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
  onValider: PropsPoste['onValider'];
  onSuivant: () => void;
}) {
  const g = item as GeometryItem;
  const mode = modeUsine(item);
  const p: PropsPoste = { item: g, level, actif: phase === 'jeu' && !paused, paused, phase, sfx, onValider };
  return (
    <>
      <Consigne texte={g.prompt} />
      {(mode === 'solide' || mode === 'compter') && <PosteSolide {...p} compter={mode === 'compter'} />}
      {mode === 'patron' && <PostePatron {...p} />}
      {mode === 'completer' && <PosteCompleter {...p} />}
      {(phase === 'juste' || phase === 'faux') && (
        <div className="carte flex flex-col items-center gap-2 p-4">
          {phase === 'juste' && <Bravo texte={felicitation} />}
          <Correction
            ouvert={phase === 'faux'}
            bonne={mode === 'completer' ? undefined : g.answer}
            titre={
              mode === 'completer' ? 'Presque ! Une case qui convient est entourée en vert.' : 'Presque !'
            }
            explication={g.explication}
            onContinuer={onSuivant}
          />
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Solides                                                             */
/* ------------------------------------------------------------------ */

function PosteSolide({
  item,
  level,
  actif,
  paused,
  phase,
  sfx,
  onValider,
  compter,
}: PropsPoste & { compter: boolean }) {
  const reduce = useReducedMotion();
  const modele = useMemo(() => modeleSolide(item.shape)!, [item.shape]);
  const [lacet, setLacet] = useState(0.6);
  const [tangage, setTangage] = useState(0.38);
  const [touche, setTouche] = useState(false);
  const [outil, setOutil] = useState(compter && level === 'facile');
  const [marques, setMarques] = useState<string[]>([]);
  const [choisi, setChoisi] = useState<number | null>(null);
  const quoi = compter ? quoiCompter(item.prompt) : null;
  const cachees = level !== 'plus_loin' || phase !== 'jeu';
  const choices = item.choices!;
  const bonne = choices.indexOf(item.answer);

  const tourner = useCallback((dl: number, dt: number) => {
    setTouche(true);
    setLacet((l) => l + dl);
    setTangage((t) => Math.max(-0.2, Math.min(1.1, t + dt)));
  }, []);

  // Le solide tourne doucement tout seul sur le tapis (sauf si on le manipule).
  useBoucle(!compter && !touche && !reduce && !paused && phase === 'jeu', (dt) =>
    setLacet((l) => l + dt * 0.5),
  );

  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      const d: Record<string, [number, number]> = {
        ArrowLeft: [-0.26, 0],
        ArrowRight: [0.26, 0],
        ArrowUp: [0, -0.15],
        ArrowDown: [0, 0.15],
      };
      if (d[e.key]) {
        e.preventDefault();
        tourner(...d[e.key]!);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif, tourner]);

  const marquer = (k: string) => {
    if (!actif) return;
    sfx.play('tic');
    setMarques((m) => (m.includes(k) ? m.filter((x) => x !== k) : [...m, k]));
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <section
        className="overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-sky/25 to-cream shadow-soft lg:w-[55%]"
        aria-label="Le solide sur le tapis de l’usine"
      >
        <Solide3D
          modele={modele}
          lacet={lacet}
          tangage={tangage}
          onTourner={actif ? tourner : undefined}
          cachees={cachees}
          compter={outil ? quoi : null}
          marques={marques}
          onMarquer={outil ? marquer : undefined}
          label={`Un solide dessiné en perspective${cachees ? ', arêtes cachées en pointillés' : ''}.`}
        />
        {/* tapis roulant */}
        <svg viewBox="0 0 400 34" className="block w-full" aria-hidden>
          <rect x="0" y="6" width="400" height="22" rx="11" fill="#586480" />
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={18 + i * 33} cy="17" r="7" fill="#AEB9D2" />
          ))}
        </svg>
        <div className="flex justify-center gap-2 p-2">
          <Button
            variant="blanc"
            aria-label="Tourner vers la gauche"
            onClick={() => tourner(-0.35, 0)}
            disabled={!actif}
          >
            ↺
          </Button>
          <Button
            variant="blanc"
            aria-label="Tourner vers la droite"
            onClick={() => tourner(0.35, 0)}
            disabled={!actif}
          >
            ↻
          </Button>
          <Button
            variant="blanc"
            aria-label="Voir de plus haut"
            onClick={() => tourner(0, 0.2)}
            disabled={!actif}
          >
            ⤓
          </Button>
        </div>
      </section>
      <div className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-4">
        {quoi && phase === 'jeu' && (
          <div className="flex w-full flex-col items-center gap-2 rounded-2xl bg-cream p-2">
            <Button
              variant={outil ? 'sun' : 'blanc'}
              onClick={() => setOutil((o) => !o)}
              disabled={!actif}
              aria-pressed={outil}
            >
              ☝️ Compter en touchant les {quoi}
            </Button>
            {outil && (
              <p className="text-center font-bold" aria-live="polite">
                Tu as compté {marques.length} {quoi}.{' '}
                {marques.length > 0 && (
                  <button type="button" className="underline" onClick={() => setMarques([])}>
                    Effacer
                  </button>
                )}
              </p>
            )}
            {level !== 'plus_loin' && (
              <Indice>Fais tourner le solide pour voir aussi ce qui est caché derrière !</Indice>
            )}
          </div>
        )}
        <p className="text-center text-sm font-bold text-ink-soft">
          Glisse sur le solide ou utilise les flèches pour le faire tourner.
        </p>
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
/* Patrons                                                             */
/* ------------------------------------------------------------------ */

/** Animation du pliage : t avance vers `cible` (0 à plat, 1 plié), figée pendant la pause. */
function usePli(paused: boolean) {
  const reduce = useReducedMotion();
  const [t, setT] = useState(0);
  const [cible, setCible] = useState(0);
  useBoucle(!paused && Math.abs(t - cible) > 1e-3, (dt) => {
    const v = reduce ? 10 : 0.55;
    setT((x) => (cible > x ? Math.min(cible, x + dt * v) : Math.max(cible, x - dt * v)));
  });
  return { t, cible, setCible, fini: Math.abs(t - cible) <= 1e-3 };
}

function rectsDe(plan: PlanPatron, ajout?: Cell | null): Rect[] {
  if (plan.type === 'pave') return plan.rects;
  return casesEnRects(ajout ? [...plan.cells, ajout] : plan.cells);
}

function PostePatron({ item, level, actif, paused, phase, onValider, sfx }: PropsPoste) {
  const plan = useMemo(() => lirePatron(item)!, [item]) as Exclude<PlanPatron, { type: 'completer' }>;
  const pli = usePli(paused);
  const rects = rectsDe(plan);
  const marquees = useMemo(() => {
    if (plan.type !== 'cube' || pli.t < 0.95) return new Set<number>();
    const d = new Set(plierCube(plan.cells).doublons);
    return new Set(plan.cells.map((c, i) => (d.has(cle(c)) ? i : -1)).filter((i) => i >= 0));
  }, [plan, pli.t]);
  const repondre = (oui: boolean) => {
    if (!actif) return;
    onValider(oui === plan.oui, oui ? 'oui' : 'non', plan.oui ? 'oui' : 'non');
    pli.setCible(1);
    sfx.play('glisse');
  };
  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      if (e.key.toLowerCase() === 'o') repondre(true);
      else if (e.key.toLowerCase() === 'n') repondre(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });
  const solide = plan.type === 'cube' ? 'cube' : 'pavé';
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <section
        className="overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-sun/25 to-cream p-2 shadow-soft lg:w-[55%]"
        aria-label="La machine à plier"
      >
        <Pliage
          rects={rects}
          t={pli.t}
          marquees={marquees}
          taille={300}
          label={`Un patron de ${rects.length} faces${pli.t > 0.5 ? ', en train d’être plié' : ', à plat'}.`}
        />
      </section>
      <div className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-4">
        {phase === 'jeu' && level === 'facile' && (
          <Button variant="blanc" onClick={() => pli.setCible(pli.cible ? 0 : 1)} disabled={!actif}>
            {pli.cible ? '↩ Déplier' : '🔧 Essayer de plier'}
          </Button>
        )}
        {phase === 'jeu' && level !== 'facile' && (
          <Indice>Imagine le pliage dans ta tête : la machine pliera après ta réponse.</Indice>
        )}
        <div className="grid w-full max-w-md grid-cols-2 gap-3">
          <Button variant="grass" size="lg" onClick={() => repondre(true)} disabled={!actif}>
            Oui (O)
          </Button>
          <Button variant="coral" size="lg" onClick={() => repondre(false)} disabled={!actif}>
            Non (N)
          </Button>
        </div>
        {phase !== 'jeu' && pli.t > 0.95 && (
          <p className="text-center font-bold" role="status">
            {plan.oui
              ? `Le patron se referme : c’est bien un ${solide} !`
              : `Le ${solide} ne se ferme pas${marquees.size ? ' : les faces rouges se superposent' : ''}.`}
          </p>
        )}
      </div>
    </div>
  );
}

function PosteCompleter({ item, level, actif, paused, phase, onValider, sfx }: PropsPoste) {
  const plan = useMemo(() => lirePatron(item)!, [item]) as Extract<PlanPatron, { type: 'completer' }>;
  const [choix, setChoix] = useState<Cell | null>(null);
  const [essais, setEssais] = useState(ESSAIS[level]);
  const [message, setMessage] = useState<string | null>(null);
  const [plie, setPlie] = useState(false);
  const pli = usePli(paused);
  const pleines = useMemo(() => new Set(plan.cells.map(cle)), [plan]);
  const solutions = useMemo(() => new Set(plan.solutions.map(cle)), [plan]);
  const C = 52;

  // Fin du pliage : on juge
  useEffect(() => {
    if (!plie || !pli.fini || pli.cible !== 1 || !choix || phase !== 'jeu') return;
    const ok = solutions.has(cle(choix));
    if (ok) {
      onValider(true, cle(choix), plan.solutions.map(cle).join(' ou '));
      return;
    }
    if (essais > 1) {
      setEssais((e) => e - 1);
      setMessage('Deux faces se superposent et une reste ouverte : ce n’est pas un patron de cube.');
      sfx.play('faux');
    } else onValider(false, cle(choix), plan.solutions.map(cle).join(' ou '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plie, pli.fini, pli.cible]);

  const plier = () => {
    if (!actif || !choix) return;
    setPlie(true);
    pli.setCible(1);
    sfx.play('glisse');
  };
  const recommencer = () => {
    setPlie(false);
    setMessage(null);
    pli.setCible(0);
  };
  const cellules = choix ? [...plan.cells, choix] : plan.cells;
  const marquees = useMemo(() => {
    if (!plie || pli.t < 0.95) return new Set<number>();
    const d = new Set(plierCube(cellules).doublons);
    return new Set(cellules.map((c, i) => (d.has(cle(c)) ? i : -1)).filter((i) => i >= 0));
  }, [plie, pli.t, cellules]);

  useEffect(() => {
    if (!actif || plie) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      if (e.key === 'Enter' && choix) {
        e.preventDefault();
        plier();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <section
        className="overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-sun/25 to-cream p-2 shadow-soft lg:w-[55%]"
        aria-label="Le patron à compléter"
      >
        {plie ? (
          <Pliage
            rects={casesEnRects(cellules)}
            t={pli.t}
            marquees={marquees}
            taille={300}
            label="Le patron se plie."
          />
        ) : (
          <svg
            viewBox={`-6 -6 ${plan.cols * C + 12} ${plan.rows * C + 12}`}
            className="mx-auto block h-auto max-h-[50vh] w-full"
            role="img"
            aria-label="Quadrillage : 5 carrés coloriés ; touche une case vide pour ajouter le sixième carré."
          >
            {Array.from({ length: plan.rows }, (_, y) =>
              Array.from({ length: plan.cols }, (_, x) => {
                const k = `${x},${y}`;
                const plein = pleines.has(k);
                const choisi = choix && cle(choix) === k;
                const montreSol = phase === 'faux' && solutions.has(k);
                return (
                  <rect
                    key={k}
                    data-case={k}
                    x={x * C}
                    y={y * C}
                    width={C}
                    height={C}
                    rx="4"
                    fill={plein ? '#4FC3F7' : choisi ? '#FFD45C' : '#FFFFFF'}
                    stroke={montreSol ? '#2E8C48' : plein ? '#24304A' : '#C9D6EA'}
                    strokeWidth={montreSol ? 5 : plein ? 3 : 1.5}
                    className={!plein && actif ? 'cursor-pointer' : ''}
                    onClick={() => {
                      if (!actif || plein) return;
                      setChoix([x, y]);
                      setMessage(null);
                      sfx.play('pop');
                    }}
                  />
                );
              }),
            )}
          </svg>
        )}
      </section>
      <div className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-4">
        {message && phase === 'jeu' && (
          <p className="text-center font-bold" role="status">
            Presque ! {message} On réessaie ? ({essais} essai{essais > 1 ? 's' : ''})
          </p>
        )}
        {phase === 'jeu' && !plie && (
          <>
            {level === 'facile' && <Indice>Le carré ajouté doit toucher un autre carré par un côté.</Indice>}
            <p className="text-center text-sm font-bold text-ink-soft">
              Touche la case où tu ajoutes le 6e carré, puis « Plier ! » (Entrée).
            </p>
            <Button variant="grass" size="lg" onClick={plier} disabled={!actif || !choix}>
              🔧 Plier !
            </Button>
          </>
        )}
        {phase === 'jeu' && plie && message && (
          <Button variant="blanc" onClick={recommencer}>
            ↩ Déplier et changer de case
          </Button>
        )}
      </div>
    </div>
  );
}
