/**
 * Memory des familles & affixes (CATALOGUE n° 48) — lexique (et toute notion en paires).
 * Les paires de l'item (`pairing` : radical ↔ dérivé, préfixe ↔ sens, mot ↔ image, expression ↔ sens…)
 * deviennent des cartes retournées. On en retourne deux : si elles vont ensemble, elles restent visibles.
 * Retournement 3D (transform), compteur de coups, grille adaptée au nombre de cartes et à l'écran.
 * Facile : 4 paires, on voit toutes les cartes 3 s au début, ruban de couleur par côté (mot / partenaire).
 * Normal : 6 paires, un « coup d'œil » possible, rubans. Plus loin : 8 paires, sans aide.
 * Une erreur sur deux cartes déjà vues = vraie confusion : on montre les bonnes associations + l'explication.
 * Clavier : flèches pour se déplacer, Entrée ou Espace pour retourner.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Eye } from 'lucide-react';
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Level, PairingItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { parNiveau, useGameSession } from '../_kit/session';
import { Hud } from '../_kit/ui';
import {
  type CarteMemory,
  type Paire,
  collecterPaires,
  colonnesMemory,
  preparerMemory,
} from '../_langue-commun/paires';
import { collecterItems } from '../_langue-commun/tirage';
import { PasDExercice } from '../_langue-commun/ui';
import { useRng } from '../_nombres-commun/outils';
import { useVoixEnPause } from '../_orthographe-commun/hooks';

const PAIRES: Record<Level, number> = { facile: 4, normal: 6, plus_loin: 8 };
const GRILLES = 2;
const APERCU_MS: Record<Level, number> = { facile: 3000, normal: 0, plus_loin: 0 };
const RETOUR_MS = 1100;

interface Confusion {
  a: CarteMemory;
  b: CarteMemory;
}

function Dos() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <pattern
          id="memo-motif"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="20" height="20" fill="#8E7CFF" />
          <rect width="10" height="20" fill="#7A67F0" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#memo-motif)" />
      <circle cx="50" cy="50" r="22" fill="#FFD45C" stroke="#fff" strokeWidth="4" />
      <text
        x="50"
        y="61"
        textAnchor="middle"
        fontSize="30"
        fontWeight="800"
        fill="#24304A"
        fontFamily="Baloo 2, sans-serif"
      >
        ?
      </text>
    </svg>
  );
}

export default function MemoryFamilles({ level, stream, paused, onAnswer, onEnd, speech, sfx }: GameProps) {
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduite = !!useReducedMotion();
  const rng = useRng();
  const nbPaires = parNiveau(level, PAIRES);
  const rubans = level !== 'plus_loin';

  // Réservoir de paires (sans texte en double) puis les grilles de la partie
  const grilles = useMemo(() => {
    const items = collecterItems(
      stream,
      (x): x is PairingItem => x.kind === 'pairing' && x.pairs.length >= 3,
      10,
    );
    // une seule relation si elle suffit (contraires OU familles…), sinon tout le réservoir
    const parRelation = new Map<string, PairingItem[]>();
    for (const it of items)
      parRelation.set(it.relation ?? it.prompt, [...(parRelation.get(it.relation ?? it.prompt) ?? []), it]);
    const groupes = [...parRelation.values()]
      .map((g) => collecterPaires(rng.shuffle(g), 70))
      .sort((a, b) => b.length - a.length);
    const pool = rng.shuffle(
      // une seule relation à la fois (pas de lien imprévu entre deux notions)
      groupes[0] ?? [],
    );
    const out: Paire[][] = [];
    for (let g = 0; g < GRILLES && pool.length >= 2; g++) {
      const debut = (g * nbPaires) % pool.length;
      const tranche = [...pool.slice(debut), ...pool.slice(0, debut)].slice(0, nbPaires);
      if (g > 0 && pool.length <= nbPaires) break; // pas assez pour une 2e grille différente
      out.push(tranche);
    }
    return out;
  }, [stream, nbPaires, rng]);

  const [iGrille, setIGrille] = useState(0);
  const paires = useMemo(() => grilles[iGrille] ?? [], [grilles, iGrille]);
  const cartes = useMemo(() => preparerMemory(paires, rng), [paires, rng]);
  const [retournees, setRetournees] = useState<string[]>([]);
  const [trouvees, setTrouvees] = useState<Set<number>>(new Set());
  const [vues, setVues] = useState<Set<string>>(new Set());
  const [coups, setCoups] = useState(0);
  const [coupsTotal, setCoupsTotal] = useState(0);
  const [apercu, setApercu] = useState(APERCU_MS[level] > 0);
  const [coupOeil, setCoupOeil] = useState(level === 'normal' ? 1 : 0);
  const [confusion, setConfusion] = useState<Confusion | null>(null);
  const [focus, setFocus] = useState(0);
  const [fini, setFini] = useState(false);
  const boutons = useRef<(HTMLButtonElement | null)[]>([]);
  /** La première carte du coup avait-elle déjà été vue avant ce coup ? */
  const premiereDejaVue = useRef(false);
  const grille = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(800);

  useLayoutEffect(() => {
    const el = grille.current;
    if (!el) return;
    const maj = () => setLargeur(el.clientWidth || window.innerWidth);
    maj();
    const ro = new ResizeObserver(maj);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const texteMax = Math.max(0, ...cartes.map((c) => c.texte.length));
  const cols = colonnesMemory(cartes.length, largeur, texteMax);

  // Nouvelle grille : on remet tout à zéro (et aperçu en Facile)
  useEffect(() => {
    setRetournees([]);
    setTrouvees(new Set());
    setVues(new Set());
    setCoups(0);
    setConfusion(null);
    setApercu(APERCU_MS[level] > 0);
    setFocus(0);
    session.startQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartes]);

  // Aperçu (Facile au début, ou « coup d'œil ») : figé pendant la pause
  useEffect(() => {
    if (!apercu || paused) return;
    const t = setTimeout(() => setApercu(false), APERCU_MS[level] || 1500);
    return () => clearTimeout(t);
  }, [apercu, paused, level]);

  // Deux cartes retournées qui ne vont pas ensemble : elles se retournent (figé pendant la pause)
  useEffect(() => {
    if (retournees.length !== 2 || paused) return;
    const t = setTimeout(() => setRetournees([]), RETOUR_MS);
    return () => clearTimeout(t);
  }, [retournees, paused]);

  const retourner = useCallback(
    (c: CarteMemory) => {
      if (paused || fini || apercu || trouvees.has(c.paire) || retournees.includes(c.id)) return;
      if (retournees.length >= 2) return;
      sfx.play('glisse');
      setConfusion(null);
      const nouvelles = [...retournees, c.id];
      setRetournees(nouvelles);
      if (nouvelles.length < 2) {
        premiereDejaVue.current = vues.has(c.id);
        setVues((v) => new Set(v).add(c.id));
        return;
      }
      const a = cartes.find((x) => x.id === nouvelles[0])!;
      setCoups((n) => n + 1);
      setCoupsTotal((n) => n + 1);
      const paire = paires[a.paire]!;
      if (a.paire === c.paire) {
        sfx.play('juste');
        session.answer(paire.item, true, `${a.texte} + ${c.texte}`, `${paire.gauche} + ${paire.droite}`);
        setTrouvees((s) => new Set(s).add(c.paire));
        setRetournees([]);
        session.startQuestion();
      } else {
        // déjà vues toutes les deux : ce n'est plus la mémoire, c'est une vraie confusion
        if (premiereDejaVue.current && vues.has(c.id)) {
          session.answer(paire.item, false, `${a.texte} + ${c.texte}`, `${paire.gauche} + ${paire.droite}`);
          setConfusion({ a, b: c });
        }
        sfx.play('faux');
      }
      setVues((v) => new Set(v).add(c.id));
    },
    [paused, fini, apercu, trouvees, retournees, cartes, paires, vues, sfx, session],
  );

  // Grille terminée
  useEffect(() => {
    if (!paires.length || trouvees.size < paires.length || fini) return;
    const t = setTimeout(() => {
      if (iGrille + 1 < grilles.length) {
        sfx.play('etoile');
        setIGrille((g) => g + 1);
        return;
      }
      setFini(true);
      sfx.play('fanfare');
      const totalPaires = grilles.reduce((n, g) => n + g.length, 0);
      const ideal = totalPaires;
      session.end({
        won: true,
        headline: `Toutes les paires en ${coupsTotal} coups ! 🃏`,
        score: Math.max(0, totalPaires * 100 - (coupsTotal - ideal) * 10),
        correct: totalPaires,
        total: Math.max(totalPaires, coupsTotal),
        delayMs: 600,
      });
    }, 900);
    return () => clearTimeout(t);
  }, [trouvees, paires.length, iGrille, grilles, fini, sfx, session, coupsTotal]);

  // Clavier : flèches + Entrée / Espace
  const surTouche = (e: KeyboardEvent, i: number) => {
    const n = cartes.length;
    let j = i;
    if (e.key === 'ArrowRight') j = Math.min(n - 1, i + 1);
    else if (e.key === 'ArrowLeft') j = Math.max(0, i - 1);
    else if (e.key === 'ArrowDown') j = Math.min(n - 1, i + cols);
    else if (e.key === 'ArrowUp') j = Math.max(0, i - cols);
    else return;
    e.preventDefault();
    setFocus(j);
    boutons.current[j]?.focus();
  };

  if (!cartes.length) {
    return (
      <PasDExercice
        texte="Il faut des paires (mot et mot de sa famille, préfixe et sens…) pour jouer au Memory."
        onFin={() => session.end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const taille = (t: string) =>
    t.length <= 8 ? 'text-xl sm:text-2xl' : t.length <= 16 ? 'text-base sm:text-lg' : 'text-sm sm:text-base';
  const objectif = paires.length * 2;
  // Paires d'une seule notion : on affiche sa consigne ; sinon une consigne générale
  const unique = new Set(paires.map((p) => p.item.relation ?? p.item.prompt)).size === 1;
  const relation = unique ? paires[0]?.item.relation : undefined;
  const consigne = unique && paires[0] ? paires[0].item.prompt : 'Retrouve les cartes qui vont ensemble.';

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <Hud>
          🃏 Grille {iGrille + 1} / {grilles.length}
        </Hud>
        <Hud>
          {trouvees.size} / {paires.length} paires
        </Hud>
        <Hud className={level === 'plus_loin' && coups > objectif ? 'text-coral-dark' : ''}>
          👆 {coups} coup{coups > 1 ? 's' : ''}
          {level === 'plus_loin' ? ` (défi : ${objectif})` : ''}
        </Hud>
      </div>
      <div className="flex items-center gap-2 text-center">
        <SpeakButton text={consigne} label="Écouter la consigne" size={40} />
        <p className="font-titre text-lg font-bold sm:text-xl">
          {consigne}
          {relation && (
            <span className="ml-2 rounded-full bg-grape/15 px-2 py-0.5 text-sm text-grape-dark">
              {relation}
            </span>
          )}
        </p>
      </div>

      <div
        ref={grille}
        className="grid w-full max-w-3xl gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        role="grid"
        aria-label="Les cartes du Memory"
      >
        {cartes.map((c, i) => {
          const trouvee = trouvees.has(c.paire);
          const visible = apercu || trouvee || retournees.includes(c.id);
          const enConfusion = confusion && (confusion.a.id === c.id || confusion.b.id === c.id);
          return (
            <div
              key={`${iGrille}-${c.id}`}
              role="gridcell"
              className="aspect-[4/3] [perspective:900px] sm:aspect-[5/4]"
            >
              <motion.button
                ref={(el) => {
                  boutons.current[i] = el;
                }}
                type="button"
                tabIndex={i === focus ? 0 : -1}
                onFocus={() => setFocus(i)}
                onKeyDown={(e) => surTouche(e, i)}
                onClick={() => retourner(c)}
                disabled={paused || fini}
                className="relative h-full w-full rounded-2xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-sun"
                style={{ transformStyle: 'preserve-3d' }}
                initial={false}
                animate={reduite ? { rotateY: 0 } : { rotateY: visible ? 180 : 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                aria-label={
                  visible
                    ? `Carte : ${c.texte}${trouvee ? ' (paire trouvée)' : ''}`
                    : `Carte ${i + 1}, face cachée`
                }
              >
                {/* dos */}
                <motion.span
                  className="absolute inset-0 overflow-hidden rounded-2xl border-4 border-white shadow-pop-sm"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  animate={reduite ? { opacity: visible ? 0 : 1 } : { opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Dos />
                </motion.span>
                {/* face */}
                <motion.span
                  className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-2xl border-4 bg-white p-1.5 text-center shadow-pop-sm ${
                    trouvee ? 'border-grass bg-grass/10' : enConfusion ? 'border-coral' : 'border-white'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: reduite ? undefined : 'rotateY(180deg)',
                  }}
                  animate={reduite ? { opacity: visible ? 1 : 0 } : { opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {rubans && (
                    <span
                      className={`absolute inset-x-0 top-0 h-2 ${c.cote === 'gauche' ? 'bg-sky' : 'bg-coral'}`}
                      aria-hidden
                    />
                  )}
                  <span
                    className={`font-titre font-extrabold leading-tight [overflow-wrap:anywhere] ${taille(c.texte)}`}
                  >
                    {c.texte}
                  </span>
                  {trouvee && (
                    <span className="absolute bottom-1 right-1.5 text-sm" aria-hidden>
                      ✅
                    </span>
                  )}
                </motion.span>
              </motion.button>
            </div>
          );
        })}
      </div>

      {level === 'normal' && coupOeil > 0 && !apercu && (
        <Button
          variant="sun"
          icon={<Eye aria-hidden />}
          onClick={() => {
            setCoupOeil((x) => x - 1);
            setRetournees([]);
            setApercu(true);
          }}
          disabled={paused || fini}
        >
          Coup d’œil
        </Button>
      )}
      {apercu && (
        <p className="font-bold text-grape-dark" role="status">
          Regarde bien toutes les cartes…
        </p>
      )}

      <AnimatePresence>
        {confusion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full rounded-2xl bg-coral/10 p-3"
            role="status"
          >
            <div className="flex items-start gap-2">
              <SpeakButton
                text={`${texteConfusion(confusion, paires)} ${paires[confusion.a.paire]?.item.explication ?? ''}`}
                size={40}
                label="Écouter l’explication"
              />
              <div>
                <p className="font-bold">Presque&nbsp;! {texteConfusion(confusion, paires)}</p>
                <p className="text-sm">{paires[confusion.a.paire]?.item.explication}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** « grand » va avec « petit », et « chaud » avec « froid ». */
function texteConfusion(c: Confusion, paires: Paire[]): string {
  const partenaire = (x: CarteMemory) => {
    const p = paires[x.paire]!;
    return x.cote === 'gauche' ? p.droite : p.gauche;
  };
  return `« ${c.a.texte} » va avec « ${partenaire(c.a)} », et « ${c.b.texte} » avec « ${partenaire(c.b)} ».`;
}
