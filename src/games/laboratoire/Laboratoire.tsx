/**
 * Le Laboratoire des sciences (CATALOGUE n° 53).
 * Sur la paillasse : ranger des « spécimens » dans des bocaux (classer : vivant / non vivant, états de
 * l'eau, régimes alimentaires…), ou remettre en ordre les étapes d'une expérience ou d'un cycle de vie.
 * Pour les conducteurs / isolants, un petit circuit pile-ampoule montre le résultat de l'expérience
 * après chaque rangement.
 * Facile : 6 spécimens au plus, vérification immédiate, on réessaie (le bon bocal brille).
 * Normal : 8 spécimens, vérification immédiate (le spécimen file dans le bon bocal), 1 indice par expérience.
 * Plus loin : tous les spécimens, on vérifie à la fin, avec un sablier.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Eraser, Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ludo } from '@/components/Ludo';
import { Button, SpeakButton } from '@/components/ui';
import type { ClassificationItem, Item, Level, OrderingItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useEnterKey, useGameSession } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import { PlateauOrdre } from '../_monde-commun/PlateauOrdre';
import { useChronometre, useOrdre, useRng } from '../_monde-commun/hooks';
import { insecable, restreindreOrdre, sousOrdre, verifierOrdre } from '../_monde-commun/outils';
import { BarreTemps, EtatVide, Pastille } from '../_monde-commun/ui';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { BocalSvg, CircuitSvg } from './Decor';
import { categorieAllumee, estExperience } from './filtre';

const EXPERIENCES: Record<Level, number> = { facile: 4, normal: 5, plus_loin: 6 };
const MAX_SPECIMENS: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 16 };
const MAX_ETAPES: Record<Level, number> = { facile: 4, normal: 6, plus_loin: 10 };
const BONUS: Record<Level, number> = { facile: 1, normal: 1, plus_loin: 1.5 };
const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];

type Experience =
  { type: 'classer'; item: ClassificationItem; ordre: number[] } | { type: 'ordonner'; item: OrderingItem };

type Resultat = { juste: boolean; points: number };

export default function Laboratoire({
  level,
  stream,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
  lectureAuto,
}: GameProps) {
  const total = parNiveau(level, EXPERIENCES);
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const rng = useRng();
  const dernier = useRef<string | null>(null);

  const tirer = useCallback((): Experience | null => {
    const essais = Math.max(12, Math.min(60, (stream.size ?? 20) * 2));
    let trouve: Item | null = null;
    for (let i = 0; i < essais; i++) {
      const it = stream.next();
      if (!estExperience(it)) continue;
      trouve = it;
      if (it.id !== dernier.current || (stream.size ?? 2) < 2) break;
    }
    if (!trouve) return null;
    dernier.current = trouve.id;
    if (trouve.kind === 'classification') {
      const ordre = rng.shuffle(trouve.elements.map((_, i) => i)).slice(0, MAX_SPECIMENS[level]);
      return { type: 'classer', item: trouve, ordre };
    }
    const it = trouve as OrderingItem;
    const max = MAX_ETAPES[level];
    return {
      type: 'ordonner',
      item: it.elements.length > max ? restreindreOrdre(it, sousOrdre(it.elements.length, max, rng)) : it,
    };
  }, [stream, level, rng]);

  const [exp, setExp] = useState<Experience | null>(tirer);
  const [manche, setManche] = useState(1);
  const [reussies, setReussies] = useState(0);
  const [points, setPoints] = useState(0);
  const [fini, setFini] = useState(false);
  const [joie, setJoie] = useState(false);

  const resultat = useCallback((r: Resultat) => {
    setPoints((p) => p + r.points);
    if (r.juste) {
      setReussies((x) => x + 1);
      setJoie(true);
      setTimeout(() => setJoie(false), 1800);
    }
  }, []);

  const suivant = useCallback(() => {
    if (fini) return;
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      session.end({
        won: reussies >= Math.ceil(total / 2),
        headline:
          reussies === total
            ? 'Toutes les expériences sont réussies !'
            : `${reussies} expérience${reussies > 1 ? 's' : ''} réussie${reussies > 1 ? 's' : ''} sur ${total} !`,
        score: points,
      });
      return;
    }
    setExp(tirer());
    setManche((m) => m + 1);
  }, [fini, manche, total, reussies, points, session, sfx, tirer]);

  if (!exp) {
    return <EtatVide icone="🧪" jeu="Le Laboratoire" besoin="d’éléments à classer ou d’étapes à ordonner" />;
  }

  const commun = {
    level,
    paused,
    session,
    sfx,
    speech,
    lectureAuto,
    fini,
    onResultat: resultat,
    onSuivant: suivant,
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <Hud>
          Expérience {manche} / {total}
        </Hud>
        <div className="hidden sm:block" aria-hidden>
          <Ludo size={56} pose={joie ? 'joie' : 'pense'} />
        </div>
        <Hud>
          <span aria-hidden>🧪</span> {points} pts
        </Hud>
      </div>
      {exp.type === 'classer' ? (
        <Classer key={`${manche}-${exp.item.id}`} item={exp.item} ordre={exp.ordre} {...commun} />
      ) : (
        <Ordonner key={`${manche}-${exp.item.id}`} item={exp.item} {...commun} />
      )}
    </div>
  );
}

interface PropsExperience {
  level: Level;
  paused: boolean;
  session: ReturnType<typeof useGameSession>;
  sfx: GameProps['sfx'];
  speech: GameProps['speech'];
  lectureAuto: boolean;
  fini: boolean;
  onResultat: (r: Resultat) => void;
  onSuivant: () => void;
}

/* ------------------------------------------------------------------ */
/* Classer dans les bocaux                                             */
/* ------------------------------------------------------------------ */

function Classer({
  item,
  ordre,
  level,
  paused,
  session,
  sfx,
  speech,
  lectureAuto,
  fini,
  onResultat,
  onSuivant,
}: PropsExperience & { item: ClassificationItem; ordre: number[] }) {
  const reduce = !!useReducedMotion();
  const immediat = level !== 'plus_loin';
  /** Rangement : élément → bocal choisi. */
  const [ranges, setRanges] = useState<Record<number, number>>({});
  const [erreurs, setErreurs] = useState<number[]>([]);
  const [selection, setSelection] = useState<number | null>(null);
  const [secoue, setSecoue] = useState<number | null>(null);
  const [brille, setBrille] = useState<number | null>(null);
  const [indiceUtilise, setIndiceUtilise] = useState(false);
  const [phase, setPhase] = useState<'jeu' | 'juste' | 'faux'>('jeu');
  const [dernierTeste, setDernierTeste] = useState<number | null>(null);
  const allumee = categorieAllumee(item);
  const actif = phase === 'jeu' && !paused && !fini;

  const restants = ordre.filter((e) => ranges[e] === undefined);
  const courant = selection !== null && restants.includes(selection) ? selection : (restants[0] ?? null);

  const texte = `${item.prompt} Les bocaux : ${item.categories.join(', ')}.`;
  useEffect(() => {
    session.startQuestion();
    if (lectureAuto) void speech.speak(texte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (secoue === null) return;
    const t = setTimeout(() => setSecoue(null), 500);
    return () => clearTimeout(t);
  }, [secoue]);

  const terminer = useCallback(
    (r: Record<number, number>, errs: number[]) => {
      const fausses = ordre.filter((e) => r[e] !== item.elements[e]!.category);
      const juste = errs.length === 0 && fausses.length === 0;
      const donne = ordre
        .map((e) => `${item.elements[e]!.label} → ${item.categories[r[e] ?? 0]}`)
        .join(' ; ');
      const attendu = ordre
        .map((e) => `${item.elements[e]!.label} → ${item.categories[item.elements[e]!.category]}`)
        .join(' ; ');
      session.answer(item, juste, donne, attendu);
      const bons = ordre.length - new Set([...errs, ...fausses]).size;
      onResultat({ juste, points: Math.round((bons * 10 + (juste ? 20 : 0)) * BONUS[level]) });
      if (juste) {
        sfx.play('etoile');
        setPhase('juste');
      } else {
        sfx.play(level === 'plus_loin' ? 'faux' : 'pop');
        setPhase('faux');
      }
    },
    [ordre, item, session, onResultat, level, sfx],
  );

  const ranger = useCallback(
    (cat: number) => {
      if (!actif || courant === null) return;
      const e = courant;
      const bonne = item.elements[e]!.category;
      setDernierTeste(e);
      setBrille(null);
      if (!immediat) {
        sfx.play('pop');
        const r = { ...ranges, [e]: cat };
        setRanges(r);
        setSelection(null);
        return;
      }
      if (cat === bonne) {
        sfx.play('juste');
        const r = { ...ranges, [e]: cat };
        setRanges(r);
        setSelection(null);
        if (ordre.every((x) => r[x] !== undefined)) terminer(r, erreurs);
        return;
      }
      // erreur
      vibrate(30);
      const errs = erreurs.includes(e) ? erreurs : [...erreurs, e];
      setErreurs(errs);
      if (level === 'facile') {
        sfx.play('glisse');
        setSecoue(e);
        setBrille(bonne);
        return;
      }
      // Normal : le spécimen file dans le bon bocal (marqué), on continue
      sfx.play('faux');
      const r = { ...ranges, [e]: bonne };
      setRanges(r);
      setSelection(null);
      setBrille(bonne);
      if (ordre.every((x) => r[x] !== undefined)) terminer(r, errs);
    },
    [actif, courant, item, immediat, ranges, ordre, erreurs, level, sfx, terminer],
  );

  const verifierFin = useCallback(() => {
    if (phase !== 'jeu' || fini) return;
    terminer(ranges, []);
  }, [phase, fini, terminer, ranges]);

  const chrono = useChronometre({
    dureeS: level === 'plus_loin' ? 10 + 7 * ordre.length : Infinity,
    actif: phase === 'jeu' && !fini,
    paused,
    onFin: verifierFin,
  });

  const indice = () => {
    if (indiceUtilise || courant === null || !actif) return;
    setIndiceUtilise(true);
    setBrille(item.elements[courant]!.category);
    sfx.play('pop');
  };

  // Clavier : 1-9 choisit un spécimen, A-F le range dans un bocal, Entrée vérifie (Plus loin)
  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (/^[1-9]$/.test(k)) {
        const el = restants[Number(k) - 1];
        if (el !== undefined) {
          e.preventDefault();
          setSelection(el);
        }
        return;
      }
      const j = LETTRES.findIndex((l) => l.toLowerCase() === k);
      if (j >= 0 && j < item.categories.length) {
        e.preventDefault();
        ranger(j);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif, restants, item.categories.length, ranger]);

  useEnterKey(phase === 'jeu' && !immediat && restants.length === 0 && !paused ? verifierFin : null);

  useEffect(() => {
    if (phase !== 'juste' || paused) return;
    const t = setTimeout(onSuivant, 2200);
    return () => clearTimeout(t);
  }, [phase, paused, onSuivant]);

  const revele = phase !== 'jeu';
  const corrections = ordre
    .filter((e) => erreurs.includes(e) || ranges[e] !== item.elements[e]!.category)
    .map((e) => `${item.elements[e]!.label} → ${item.categories[item.elements[e]!.category]}`);
  const nbParBocal = item.categories.map((_, c) => ordre.filter((e) => ranges[e] === c).length);
  const testeAllume =
    allumee >= 0 && dernierTeste !== null && (immediat || revele)
      ? ranges[dernierTeste] !== undefined
        ? item.elements[dernierTeste]!.category === allumee
        : null
      : null;
  const objetTeste =
    dernierTeste !== null ? (item.elements[dernierTeste]!.image ?? item.elements[dernierTeste]!.label) : null;

  return (
    <>
      <section className="carte flex w-full flex-col gap-2 p-4">
        <div className="flex items-start justify-center gap-3">
          <SpeakButton text={texte} label="Écouter la consigne" />
          <h2 className="text-center font-titre text-2xl font-extrabold leading-snug sm:text-3xl">
            {insecable(item.prompt)}
          </h2>
        </div>
        {level === 'plus_loin' && phase === 'jeu' && (
          <BarreTemps fraction={chrono.fraction} label="Sablier" />
        )}
      </section>

      {/* La paillasse */}
      <section
        className="relative overflow-hidden rounded-card border-4 border-white p-3 shadow-soft sm:p-4"
        style={{
          background: 'linear-gradient(180deg,#DDF4F1 0%,#DDF4F1 62%,#B98B62 62%,#A97452 100%)',
        }}
        aria-label="La paillasse du laboratoire"
      >
        <div className={`flex flex-col gap-3 ${allumee >= 0 ? 'md:flex-row md:items-end' : ''}`}>
          <ul
            className={`grid flex-1 gap-2 ${item.categories.length <= 2 ? 'grid-cols-2' : item.categories.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}
            aria-label="Les bocaux"
          >
            {item.categories.map((c, ci) => (
              <li key={c} className="flex min-w-0 flex-col items-center">
                <button
                  type="button"
                  onClick={() => ranger(ci)}
                  disabled={!actif || courant === null}
                  aria-label={`Bocal ${LETTRES[ci]} : ${c} (${nbParBocal[ci]} rangé${nbParBocal[ci]! > 1 ? 's' : ''})`}
                  className="group flex w-full max-w-[11rem] flex-col items-center rounded-3xl p-1 outline-none focus-visible:ring-4 focus-visible:ring-sun"
                >
                  <div className="relative w-full max-w-[7.5rem]">
                    <BocalSvg
                      index={ci}
                      remplissage={nbParBocal[ci]! / Math.max(1, ordre.length / item.categories.length)}
                      brille={brille === ci}
                    />
                    <div className="absolute inset-x-3 bottom-3 top-6 flex flex-wrap content-end justify-center gap-0.5 overflow-hidden text-xl sm:text-2xl">
                      {ordre
                        .filter((e) => ranges[e] === ci)
                        .map((e) => (
                          <motion.span
                            key={e}
                            initial={reduce ? false : { y: -40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className={
                              erreurs.includes(e) || (revele && item.elements[e]!.category !== ci)
                                ? 'rounded-full ring-2 ring-coral'
                                : ''
                            }
                            title={item.elements[e]!.label}
                            aria-hidden
                          >
                            {item.elements[e]!.image ?? '🔹'}
                          </motion.span>
                        ))}
                    </div>
                  </div>
                  <span className="mt-1 flex items-center gap-1 rounded-xl bg-white/90 px-2 py-1 text-center text-sm font-bold leading-tight shadow-pop-sm sm:text-base">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink font-titre text-xs text-white"
                      aria-hidden
                    >
                      {LETTRES[ci]}
                    </span>
                    {c}
                  </span>
                  {ordre.some((e) => ranges[e] === ci && !item.elements[e]!.image) && (
                    <span className="mt-1 text-center text-xs font-bold leading-tight text-ink sm:text-sm">
                      {ordre
                        .filter((e) => ranges[e] === ci && !item.elements[e]!.image)
                        .map((e) => item.elements[e]!.label)
                        .join(', ')}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {allumee >= 0 && (
            <div className="mx-auto w-full max-w-[14rem] rounded-2xl bg-white/70 p-2">
              <CircuitSvg objet={objetTeste} allume={testeAllume} reduce={reduce} />
            </div>
          )}
        </div>
      </section>

      {/* Les spécimens à ranger */}
      {phase === 'jeu' && (
        <section className="carte flex w-full flex-col items-center gap-3 p-4">
          <p className="text-center text-sm font-bold text-ink-soft">
            {restants.length
              ? 'Choisis un spécimen (ou tape son numéro), puis touche son bocal (ou tape sa lettre).'
              : 'Tout est rangé !'}
          </p>
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Spécimens à ranger">
            <AnimatePresence initial={false}>
              {restants.map((e, k) => (
                <motion.li
                  key={e}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                  animate={
                    secoue === e && !reduce
                      ? { x: [0, -10, 10, -6, 0], opacity: 1, scale: 1 }
                      : { opacity: 1, scale: 1 }
                  }
                  exit={reduce ? undefined : { opacity: 0, y: -30 }}
                >
                  <button
                    type="button"
                    onClick={() => setSelection(e)}
                    disabled={!actif}
                    aria-pressed={courant === e}
                    aria-label={`Spécimen ${k + 1} : ${item.elements[e]!.label}`}
                    className={`btn-3d flex min-h-[3.5rem] items-center gap-2 border-2 px-3 py-2 text-base font-bold sm:text-lg ${
                      courant === e
                        ? 'border-sciences bg-sciences/15 ring-4 ring-sun'
                        : 'border-sciences/40 bg-card'
                    }`}
                  >
                    <Pastille n={k + 1} />
                    {item.elements[e]!.image && (
                      <span className="text-2xl" aria-hidden>
                        {item.elements[e]!.image}
                      </span>
                    )}
                    {item.elements[e]!.label}
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {erreurs.length > 0 && level === 'facile' && brille !== null && (
            <p className="rounded-2xl bg-sun/25 px-4 py-2 text-center font-bold" role="status">
              Presque ! Regarde le bocal qui brille et essaie encore.
            </p>
          )}
          {erreurs.length > 0 && level === 'normal' && brille !== null && (
            <p className="rounded-2xl bg-coral/10 px-4 py-2 text-center font-bold" role="status">
              Presque ! Il allait dans le bocal « {item.categories[brille]} ».
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            {level === 'normal' && !indiceUtilise && (
              <Button variant="sun" icon={<Lightbulb aria-hidden />} onClick={indice} disabled={!actif}>
                Indice
              </Button>
            )}
            {!immediat && (
              <>
                <Button
                  variant="blanc"
                  icon={<Eraser aria-hidden />}
                  onClick={() => setRanges({})}
                  disabled={!actif || Object.keys(ranges).length === 0}
                >
                  Tout reprendre
                </Button>
                <Button
                  variant="grass"
                  size="lg"
                  onClick={verifierFin}
                  disabled={!actif || restants.length > 0}
                >
                  Vérifier l’expérience
                </Button>
              </>
            )}
          </div>
        </section>
      )}

      {phase === 'juste' && (
        <section className="carte w-full p-4">
          <Feedback state="juste" message="Expérience réussie ! 🧪✨" />
          <p className="mt-2 text-center">{item.explication}</p>
        </section>
      )}
      {phase === 'faux' && (
        <section className="carte w-full p-4">
          <Feedback
            state="faux"
            message={corrections.length ? 'Presque ! On corrige ensemble :' : 'Presque !'}
            expected={corrections.length ? `\n${corrections.join('\n')}` : undefined}
            explication={item.explication}
            onContinue={onSuivant}
          />
        </section>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Ordonner les étapes                                                 */
/* ------------------------------------------------------------------ */

function Ordonner({
  item,
  level,
  paused,
  session,
  sfx,
  speech,
  lectureAuto,
  fini,
  onResultat,
  onSuivant,
}: PropsExperience & { item: OrderingItem }) {
  const rng = useRng();
  const n = item.elements.length;
  const [phase, setPhase] = useState<'jeu' | 'juste' | 'faux'>('jeu');
  const [essai, setEssai] = useState(1);
  const [bien, setBien] = useState<boolean[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [indiceUtilise, setIndiceUtilise] = useState(false);
  const actif = phase === 'jeu' && !paused && !fini;
  const ordre = useOrdre({ n, rng, actif });
  const texte = `${item.prompt} Les étapes : ${item.elements.join(' ; ')}.`;

  useEffect(() => {
    session.startQuestion();
    if (lectureAuto) void speech.speak(texte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifierRef = useRef<(force: boolean) => void>(() => {});
  const chrono = useChronometre({
    dureeS: level === 'plus_loin' ? 12 + 6 * n : Infinity,
    actif: phase === 'jeu' && !fini,
    paused,
    onFin: () => verifierRef.current(true),
  });

  const verifier = (force: boolean) => {
    if (phase !== 'jeu' || fini || (!force && (!ordre.plein || paused))) return;
    const r = verifierOrdre(ordre.propose, n);
    const donne = ordre.cases.map((c) => (c === null ? '…' : item.elements[c])).join(' → ');
    if (r.juste) {
      session.answer(item, true, donne, item.elements.join(' → '));
      sfx.play('etoile');
      setBien(r.bienPlaces);
      setPhase('juste');
      onResultat({ juste: true, points: Math.round((10 * n + 20) * BONUS[level]) });
      return;
    }
    if (level === 'facile' && essai === 1 && !force) {
      sfx.play('glisse');
      ordre.garderBienPlaces();
      setEssai(2);
      setMessage('Presque ! Les étapes en vert sont bien placées. Replace les autres.');
      return;
    }
    session.answer(item, false, donne, item.elements.join(' → '));
    sfx.play('faux');
    vibrate(40);
    setBien(r.bienPlaces);
    setPhase('faux');
    onResultat({ juste: false, points: 10 * r.bienPlaces.filter(Boolean).length });
  };
  verifierRef.current = verifier;

  useEnterKey(phase === 'jeu' && ordre.plein && !paused ? () => verifier(false) : null);

  useEffect(() => {
    if (phase !== 'juste' || paused) return;
    const t = setTimeout(onSuivant, 2400);
    return () => clearTimeout(t);
  }, [phase, paused, onSuivant]);

  const attendu = useMemo(() => item.elements.map((e, i) => `${i + 1}. ${e}`).join('\n'), [item]);

  return (
    <section className="carte flex w-full flex-col items-center gap-4 p-4 sm:p-6">
      <div className="flex w-full items-start justify-center gap-3">
        <SpeakButton text={texte} label="Écouter la consigne et les étapes" />
        <h2 className="text-center font-titre text-2xl font-extrabold leading-snug sm:text-3xl">
          {insecable(item.prompt)}
        </h2>
      </div>
      {level === 'plus_loin' && phase === 'jeu' && <BarreTemps fraction={chrono.fraction} label="Sablier" />}
      <PlateauOrdre
        item={item}
        ordre={ordre}
        bienPlaces={bien}
        reveler={phase !== 'jeu'}
        theme="labo"
        actif={actif}
      />
      {message && phase === 'jeu' && (
        <p className="rounded-2xl bg-sun/25 px-4 py-2 text-center font-bold" role="status">
          {message}
        </p>
      )}
      {phase === 'jeu' && (
        <div className="flex flex-wrap justify-center gap-3">
          {level === 'normal' && !indiceUtilise && (
            <Button
              variant="sun"
              icon={<Lightbulb aria-hidden />}
              onClick={() => {
                ordre.indice();
                setIndiceUtilise(true);
              }}
              disabled={!actif}
            >
              Indice
            </Button>
          )}
          <Button
            variant="blanc"
            icon={<Eraser aria-hidden />}
            onClick={ordre.effacer}
            disabled={!actif || ordre.cases.every((c, p) => c === null || ordre.verrous[p])}
          >
            Effacer
          </Button>
          <Button variant="grass" size="lg" onClick={() => verifier(false)} disabled={!actif || !ordre.plein}>
            Vérifier l’expérience
          </Button>
        </div>
      )}
      {phase === 'juste' && (
        <>
          <Feedback state="juste" message="Expérience réussie ! 🧪✨" />
          <p className="text-center">{item.explication}</p>
        </>
      )}
      {phase === 'faux' && (
        <Feedback
          state="faux"
          message="Presque ! Voici le bon ordre :"
          expected={`\n${attendu}`}
          explication={item.explication}
          onContinue={onSuivant}
        />
      )}
    </section>
  );
}
