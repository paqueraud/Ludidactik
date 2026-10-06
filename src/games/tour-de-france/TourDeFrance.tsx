/**
 * Le Tour de France / Globe-trotteur (CATALOGUE n° 51).
 * Une carte SVG cliquable (régions, fleuves, massifs, Europe, monde) : on touche le lieu demandé.
 * À chaque lieu trouvé, le camping-car (ou l'avion, sur le planisphère) roule jusqu'à cette étape et
 * le nom s'inscrit sur la carte. Après une erreur, on dit où l'enfant a touché et dans quelle
 * direction chercher.
 * Facile : 6 étapes, 3 essais (au 3e, le lieu clignote). Normal : 8 étapes, 2 essais avec une
 * direction. Plus loin : 10 étapes, 1 essai, 15 secondes par étape.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SpeakButton } from '@/components/ui';
import type { Level, MapPointItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { CarteSvg, type EtatZone } from '../_cartes/CarteSvg';
import { getCarte, resoudreCible } from '../_cartes/cartes';
import type { Carte } from '../_cartes/types';
import { parNiveau, useGameSession } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import { useChronometre } from '../_monde-commun/hooks';
import { direction, insecable, phraseDirection } from '../_monde-commun/outils';
import { BarreTemps, EtatVide } from '../_monde-commun/ui';
import { tirerItem } from '../_orthographe-commun/lettres';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { Vehicule } from './Vehicules';

const ETAPES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
const ESSAIS: Record<Level, number> = { facile: 3, normal: 2, plus_loin: 1 };
const CHRONO_S: Record<Level, number> = { facile: Infinity, normal: Infinity, plus_loin: 15 };
const POINTS = [0, 100, 60, 30];
const BONUS: Record<Level, number> = { facile: 1, normal: 1, plus_loin: 1.5 };

/** Item jouable : carte connue et cible présente sur cette carte. */
const estEtape = (it: { kind: string }): it is MapPointItem => {
  if (it.kind !== 'map_point') return false;
  const m = it as MapPointItem;
  const carte = getCarte(m.map);
  return !!carte && resoudreCible(carte, m.target) !== null;
};

interface Etape {
  item: MapPointItem;
  carte: Carte;
  cibles: string[];
}

const versEtape = (item: MapPointItem): Etape => {
  const carte = getCarte(item.map)!;
  return { item, carte, cibles: resoudreCible(carte, item.target) ?? [] };
};

export default function TourDeFrance({
  lesson,
  level,
  stream,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
  lectureAuto,
}: GameProps) {
  const total = parNiveau(level, ETAPES);
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduce = !!useReducedMotion();
  const dernier = useRef<string | null>(null);

  const tirer = useCallback((): Etape | null => {
    let it = tirerItem(stream, estEtape);
    if (it && it.id === dernier.current && (stream.size ?? 2) > 1) it = tirerItem(stream, estEtape) ?? it;
    if (!it) return null;
    dernier.current = it.id;
    return versEtape(it);
  }, [stream]);

  const [etape, setEtape] = useState<Etape | null>(tirer);
  const [manche, setManche] = useState(1);
  const [essais, setEssais] = useState(ESSAIS[level]);
  const [phase, setPhase] = useState<'jeu' | 'juste' | 'faux'>('jeu');
  const [message, setMessage] = useState<string | null>(null);
  const [rate, setRate] = useState<string | null>(null);
  const [indice, setIndice] = useState(false);
  /** Lieux trouvés, par carte (leur nom reste écrit). */
  const [trouves, setTrouves] = useState<Record<string, string[]>>({});
  const [reussies, setReussies] = useState(0);
  const [points, setPoints] = useState(0);
  const [vehicule, setVehicule] = useState<[number, number] | null>(null);
  const [fini, setFini] = useState(false);

  const carte = etape?.carte;
  /** Cycle 2 : « plus haut, à gauche… » plutôt que les points cardinaux. */
  const cycle2 = ['CP', 'CE1', 'CE2'].includes(lesson.classe);
  const texte = etape ? (etape.item.spoken ?? etape.item.prompt) : '';

  useEffect(() => {
    session.startQuestion();
    if (lectureAuto && etape) void speech.speak(texte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape, manche]);

  // Erreur : la zone touchée reste corail un instant
  useEffect(() => {
    if (!rate) return;
    const t = setTimeout(() => setRate(null), 900);
    return () => clearTimeout(t);
  }, [rate]);

  const centreCible = useCallback(
    (depuis: [number, number]) => {
      if (!etape) return depuis;
      // toutes les parties des zones cibles (le Pacifique est coupé en deux sur le planisphère)
      const cs = etape.cibles
        .flatMap((id) => {
          const z = etape.carte.zones.find((x) => x.id === id)!;
          return z.centres ?? [z.centre];
        })
        .sort(
          (a, b) =>
            Math.hypot(a[0] - depuis[0], a[1] - depuis[1]) - Math.hypot(b[0] - depuis[0], b[1] - depuis[1]),
        );
      return cs[0] ?? depuis;
    },
    [etape],
  );

  const echec = useCallback(
    (raison: string) => {
      if (!etape) return;
      session.answer(etape.item, false, raison, etape.item.targetLabel);
      sfx.play('faux');
      vibrate(40);
      setIndice(false);
      setMessage(null);
      setPhase('faux');
    },
    [etape, session, sfx],
  );

  const choisir = useCallback(
    (id: string) => {
      if (!etape || phase !== 'jeu' || paused || fini) return;
      const z = etape.carte.zones.find((x) => x.id === id);
      if (!z) return;
      if (etape.cibles.includes(id)) {
        const rang = ESSAIS[level] - essais + 1;
        session.answer(etape.item, true, z.nom, etape.item.targetLabel);
        sfx.play('juste');
        setPoints((p) => p + Math.round((POINTS[rang] ?? 30) * BONUS[level]));
        setReussies((r) => r + 1);
        setTrouves((t) => ({ ...t, [etape.carte.id]: [...(t[etape.carte.id] ?? []), id] }));
        setVehicule(z.centre);
        setIndice(false);
        setMessage(null);
        setPhase('juste');
        return;
      }
      const reste = essais - 1;
      setRate(id);
      if (reste <= 0) {
        echec(z.nom);
        return;
      }
      sfx.play('glisse');
      setEssais(reste);
      const dir = phraseDirection(direction(z.centre, centreCible(z.centre)), cycle2);
      setMessage(`Tu as touché : ${z.nom}. ${dir}`);
      if (level === 'facile' && reste === 1) setIndice(true);
    },
    [etape, phase, paused, fini, level, essais, session, sfx, echec, centreCible, cycle2],
  );

  const chrono = useChronometre({
    dureeS: CHRONO_S[level],
    actif: phase === 'jeu' && !fini && !!etape,
    paused,
    onFin: () => echec('temps écoulé'),
  });

  const suivant = useCallback(() => {
    if (fini) return;
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      const monde = carte?.id === 'monde';
      session.end({
        won: reussies >= Math.ceil(total / 2),
        headline:
          reussies === total
            ? monde
              ? 'Tour du monde parfait !'
              : 'Arrivée triomphale du Tour !'
            : `${reussies} étape${reussies > 1 ? 's' : ''} réussie${reussies > 1 ? 's' : ''} sur ${total} !`,
        score: points,
      });
      return;
    }
    const e = tirer();
    if (e && e.carte.id !== carte?.id) setVehicule(null);
    setEtape(e);
    setManche((m) => m + 1);
    setEssais(ESSAIS[level]);
    setPhase('jeu');
    setMessage(null);
    setIndice(false);
  }, [fini, manche, total, reussies, points, session, sfx, tirer, carte, level]);

  // Lieu trouvé : le véhicule roule, puis étape suivante
  useEffect(() => {
    if (phase !== 'juste' || paused) return;
    const t = setTimeout(suivant, 1700);
    return () => clearTimeout(t);
  }, [phase, paused, suivant]);

  const etats = useMemo(() => {
    const e: Record<string, EtatZone> = {};
    if (!etape) return e;
    for (const id of trouves[etape.carte.id] ?? []) e[id] = 'trouve';
    if (indice) for (const id of etape.cibles) e[id] = 'indice';
    if (phase !== 'jeu') for (const id of etape.cibles) e[id] = 'juste';
    if (rate && !etape.cibles.includes(rate)) e[rate] = 'faux';
    return e;
  }, [etape, trouves, indice, phase, rate]);

  const etiquettes = useMemo(() => {
    const s = new Set(etape ? (trouves[etape.carte.id] ?? []) : []);
    if (etape && phase === 'faux') etape.cibles.forEach((c) => s.add(c));
    return s;
  }, [etape, trouves, phase]);

  if (!etape || !carte) {
    return <EtatVide icone="🗺️" jeu="Le Tour de France" besoin="de lieux à trouver sur une carte" />;
  }

  const pos = vehicule ?? [carte.largeur * 0.5, carte.hauteur * 0.5];
  const typeVehicule = carte.id === 'monde' ? 'avion' : 'camping-car';

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <Hud>
          Étape {manche} / {total}
        </Hud>
        <div className="flex items-center gap-1" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3 ${i < manche - 1 || (i === manche - 1 && phase !== 'jeu') ? 'bg-grass' : i === manche - 1 ? 'bg-sun' : 'bg-white/80'}`}
            />
          ))}
        </div>
        <Hud>
          <span aria-hidden>{typeVehicule === 'avion' ? '✈️' : '🚐'}</span> {points} pts
        </Hud>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <section className="carte flex flex-col gap-3 p-4 lg:order-2 lg:w-[34%]">
          <div className="flex items-start gap-3">
            <SpeakButton text={texte} label="Écouter la consigne" />
            <h2 className="font-titre text-2xl font-extrabold leading-snug sm:text-3xl" aria-live="polite">
              {insecable(etape.item.prompt)}
            </h2>
          </div>
          {Number.isFinite(CHRONO_S[level]) && phase === 'jeu' && (
            <BarreTemps fraction={chrono.fraction} label="Temps pour trouver" />
          )}
          {phase === 'jeu' && (
            <p className="text-sm text-ink-soft">
              {ESSAIS[level] > 1
                ? `${essais} essai${essais > 1 ? 's' : ''} pour trouver. `
                : 'Un seul essai : regarde bien ! '}
              Au clavier : Tab et les flèches pour te déplacer, Entrée pour choisir.
            </p>
          )}
          <AnimatePresence mode="wait">
            {message && phase === 'jeu' && (
              <motion.p
                key={message}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-sun/25 px-4 py-2 font-bold"
                role="status"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
          {phase === 'juste' && (
            <Feedback state="juste" message={`Bravo, c’est bien ${etape.item.targetLabel} !`} />
          )}
          {phase === 'faux' && (
            <Feedback
              state="faux"
              message="Presque ! On le regarde ensemble."
              expected={etape.item.targetLabel}
              explication={etape.item.explication}
              onContinue={suivant}
            />
          )}
        </section>

        <section
          className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:order-1 lg:flex-1"
          aria-label={carte.titre}
        >
          <CarteSvg
            carte={carte}
            etats={etats}
            etiquettes={etiquettes}
            onChoisir={choisir}
            onFond={() => {
              if (phase === 'jeu' && !paused && !fini)
                setMessage(
                  'Ici, ce n’est aucun des lieux du jeu (la mer ou un pays voisin). Essaie encore !',
                );
            }}
            desactive={phase !== 'jeu' || paused || fini}
          >
            <Vehicule
              x={pos[0]}
              y={pos[1]}
              taille={carte.largeur / (carte.id === 'monde' ? 16 : 13)}
              type={typeVehicule}
              reduce={reduce}
              saute={phase === 'juste'}
            />
          </CarteSvg>
        </section>
      </div>
    </div>
  );
}
