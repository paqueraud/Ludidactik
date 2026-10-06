/**
 * La Machine à remonter le temps (CATALOGUE n° 50).
 * Des cartes-événements (ou des étapes) à remettre dans l'ordre sur une frise. Si l'ordre est juste,
 * la machine voyage d'une époque à l'autre et les dates se révèlent sous chaque carte.
 * Facile : frises courtes (4 cartes), un indice par frise, et un 2e essai qui garde les cartes bien placées.
 * Normal : jusqu'à 6 cartes, 1 indice pour la partie. Plus loin : toutes les cartes, sans indice,
 * avec un sablier (à la fin du temps, on vérifie ce qui est posé).
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Eraser, Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Level, OrderingItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useEnterKey, useGameSession } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import { PlateauOrdre } from '../_monde-commun/PlateauOrdre';
import { useChronometre, useOrdre, useRng } from '../_monde-commun/hooks';
import { estFrise, insecable, restreindreOrdre, sousOrdre, verifierOrdre } from '../_monde-commun/outils';
import { BarreTemps, EtatVide } from '../_monde-commun/ui';
import { tirerItem } from '../_orthographe-commun/lettres';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { MachineSvg } from './MachineSvg';

const FRISES: Record<Level, number> = { facile: 5, normal: 6, plus_loin: 8 };
const MAX_CARTES: Record<Level, number> = { facile: 4, normal: 6, plus_loin: 10 };
const ESSAIS: Record<Level, number> = { facile: 2, normal: 1, plus_loin: 1 };
/** Indices pour toute la partie (Facile : un par frise). */
const INDICES: Record<Level, number> = { facile: Infinity, normal: 1, plus_loin: 0 };
const BONUS: Record<Level, number> = { facile: 1, normal: 1, plus_loin: 1.5 };

/** Bonne réponse lisible : « 1. … (1792) », une ligne par carte. */
function ordreAttendu(item: OrderingItem): string {
  return item.elements
    .map((e, i) => `${i + 1}. ${e}${item.labels?.[i] ? ` (${item.labels[i]})` : ''}`)
    .join('\n');
}

const texteALire = (item: OrderingItem) => `${item.prompt} Les cartes : ${item.elements.join(' ; ')}.`;

export default function MachineTemps({
  level,
  stream,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
  lectureAuto,
}: GameProps) {
  const total = parNiveau(level, FRISES);
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduce = !!useReducedMotion();
  const rng = useRng();
  const dernier = useRef<string | null>(null);

  const tirer = useCallback((): OrderingItem | null => {
    let it = tirerItem(stream, estFrise);
    // évite de rejouer deux fois de suite la même frise
    if (it && it.id === dernier.current && (stream.size ?? 2) > 1) it = tirerItem(stream, estFrise) ?? it;
    if (!it) return null;
    dernier.current = it.id;
    const max = MAX_CARTES[level];
    return it.elements.length > max ? restreindreOrdre(it, sousOrdre(it.elements.length, max, rng)) : it;
  }, [stream, level, rng]);

  const [item, setItem] = useState<OrderingItem | null>(tirer);
  const [manche, setManche] = useState(1);
  const [reussies, setReussies] = useState(0);
  const [points, setPoints] = useState(0);
  const [indices, setIndices] = useState(INDICES[level]);
  const [voyage, setVoyage] = useState(false);
  const [panne, setPanne] = useState(false);
  const [fini, setFini] = useState(false);

  useEffect(() => {
    if (!voyage) return;
    const t = setTimeout(() => setVoyage(false), 1800);
    return () => clearTimeout(t);
  }, [voyage]);
  useEffect(() => {
    if (!panne) return;
    const t = setTimeout(() => setPanne(false), 600);
    return () => clearTimeout(t);
  }, [panne]);

  const resultat = useCallback(
    (juste: boolean, nbBien: number, n: number) => {
      if (juste) {
        setReussies((r) => r + 1);
        setVoyage(true);
        setPoints((p) => p + Math.round((10 * n + 20) * BONUS[level]));
      } else {
        setPanne(true);
        setPoints((p) => p + 10 * nbBien);
      }
    },
    [level],
  );

  const suivant = useCallback(() => {
    if (fini) return;
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      session.end({
        won: reussies >= Math.ceil(total / 2),
        headline:
          reussies === total
            ? 'Voyage parfait à travers le temps !'
            : `${reussies} voyage${reussies > 1 ? 's' : ''} réussi${reussies > 1 ? 's' : ''} sur ${total} !`,
        score: points,
      });
      return;
    }
    setItem(tirer());
    setManche((m) => m + 1);
  }, [fini, manche, total, reussies, points, session, sfx, tirer]);

  if (!item) {
    return (
      <EtatVide
        icone="⏳"
        jeu="La Machine à remonter le temps"
        besoin="d’événements ou d’étapes à remettre dans l’ordre"
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <Hud>
          Frise {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🕰️</span> {reussies} voyage{reussies > 1 ? 's' : ''}
        </Hud>
      </div>
      <section
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-card border-4 border-white shadow-soft"
        aria-label={`La machine a fait ${reussies} voyage${reussies > 1 ? 's' : ''}`}
      >
        <MachineSvg
          position={reussies / total}
          etapes={total}
          voyage={voyage}
          panne={panne}
          reduce={reduce}
        />
      </section>
      <Frise
        key={`${manche}-${item.id}`}
        item={item}
        level={level}
        paused={paused}
        session={session}
        sfx={sfx}
        speech={speech}
        lectureAuto={lectureAuto}
        indiceDispo={indices > 0}
        onIndice={() => setIndices((i) => i - 1)}
        onResultat={resultat}
        onSuivant={suivant}
        fini={fini}
      />
    </div>
  );
}

function Frise({
  item,
  level,
  paused,
  session,
  sfx,
  speech,
  lectureAuto,
  indiceDispo,
  onIndice,
  onResultat,
  onSuivant,
  fini,
}: {
  item: OrderingItem;
  level: Level;
  paused: boolean;
  session: ReturnType<typeof useGameSession>;
  sfx: GameProps['sfx'];
  speech: GameProps['speech'];
  lectureAuto: boolean;
  indiceDispo: boolean;
  onIndice: () => void;
  onResultat: (juste: boolean, nbBien: number, n: number) => void;
  onSuivant: () => void;
  fini: boolean;
}) {
  const rng = useRng();
  const n = item.elements.length;
  const [phase, setPhase] = useState<'jeu' | 'juste' | 'faux'>('jeu');
  const [essai, setEssai] = useState(1);
  const [bien, setBien] = useState<boolean[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [indiceUtilise, setIndiceUtilise] = useState(false);
  const actif = phase === 'jeu' && !paused && !fini;
  const ordre = useOrdre({ n, rng, actif });

  useEffect(() => {
    session.startQuestion();
    if (lectureAuto) void speech.speak(texteALire(item));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifierRef = useRef<(force: boolean) => void>(() => {});
  const chrono = useChronometre({
    dureeS: level === 'plus_loin' ? 12 + 6 * n : Infinity,
    actif: phase === 'jeu' && !fini,
    paused,
    onFin: () => verifierRef.current(true),
  });

  const donne = () =>
    ordre.cases.map((c, p) => `${p + 1}. ${c === null ? '…' : item.elements[c]}`).join(' ; ');

  const verifier = (force: boolean) => {
    if (phase !== 'jeu' || fini) return;
    if (!force && (!ordre.plein || paused)) return;
    const r = verifierOrdre(ordre.propose, n);
    if (r.juste) {
      session.answer(item, true, donne(), item.elements.join(' ; '));
      sfx.play('monte');
      setBien(r.bienPlaces);
      setMessage(null);
      setPhase('juste');
      onResultat(true, n, n);
      return;
    }
    if (essai < ESSAIS[level] && !force) {
      sfx.play('glisse');
      ordre.garderBienPlaces();
      setEssai((e) => e + 1);
      const nb = r.bienPlaces.filter(Boolean).length;
      setMessage(
        nb
          ? `Presque ! ${nb === 1 ? 'La carte verte est bien placée : elle reste' : 'Les cartes vertes sont bien placées : elles restent'}. Replace les autres.`
          : 'Presque ! Regarde bien et essaie encore une fois.',
      );
      return;
    }
    session.answer(item, false, donne(), item.elements.join(' ; '));
    sfx.play('faux');
    vibrate(40);
    setBien(r.bienPlaces);
    setMessage(null);
    setPhase('faux');
    onResultat(false, r.bienPlaces.filter(Boolean).length, n);
  };
  verifierRef.current = verifier;

  useEnterKey(phase === 'jeu' && ordre.plein && !paused ? () => verifier(false) : null);

  // Ordre juste : la machine voyage, puis on enchaîne
  useEffect(() => {
    if (phase !== 'juste' || paused) return;
    const t = setTimeout(onSuivant, 2800);
    return () => clearTimeout(t);
  }, [phase, paused, onSuivant]);

  const indice = () => {
    if (!indiceDispo || indiceUtilise || phase !== 'jeu') return;
    ordre.indice();
    setIndiceUtilise(true);
    onIndice();
    sfx.play('pop');
  };

  return (
    <section className="carte flex w-full flex-col items-center gap-4 p-4 sm:p-6">
      <div className="flex w-full items-start justify-center gap-3">
        <SpeakButton text={texteALire(item)} label="Écouter la consigne et les cartes" />
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
        theme="frise"
        actif={actif}
      />

      {message && phase === 'jeu' && (
        <p className="rounded-2xl bg-sun/25 px-4 py-2 text-center font-bold" role="status">
          {message}
        </p>
      )}

      {phase === 'jeu' && (
        <div className="flex w-full flex-wrap items-center justify-center gap-3">
          {indiceDispo && !indiceUtilise && (
            <Button variant="sun" icon={<Lightbulb aria-hidden />} onClick={indice} disabled={!actif}>
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
            Lancer la machine !
          </Button>
        </div>
      )}

      <AnimatePresence>
        {phase === 'juste' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2"
            role="status"
          >
            <p className="text-center font-titre text-2xl font-extrabold text-grass-dark">
              Bravo ! La machine voyage dans le temps ✨
            </p>
            <Button variant="grass" onClick={onSuivant} disabled={paused}>
              Continuer
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      {phase === 'faux' && (
        <Feedback
          state="faux"
          message="Presque ! La machine a besoin d’un petit réglage."
          expected={`\n${ordreAttendu(item)}`}
          explication={item.explication}
          onContinue={onSuivant}
        />
      )}
    </section>
  );
}
