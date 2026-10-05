/**
 * Le Labo des fonctions (CATALOGUE n° 41) — manipulations syntaxiques (BO cycle 3).
 * Une phrase-éprouvette (`meta.phrase`) ; ses groupes (`elements`) sont analysés un par un.
 * Pour le groupe en couleur, l'enfant fait des expériences — supprimer, déplacer, encadrer par
 * « c'est… qui », remplacer (si l'item donne la phrase obtenue) — en glissant le groupe (vers le haut ou
 * le bas = supprimer, sur le côté = déplacer) ou avec les boutons / touches S, D, E, R. Le jeu montre la
 * phrase obtenue ; l'enfant juge, puis verse le groupe dans la bonne fiole (fonction ; touches 1-6).
 * Facile : astuce de méthode affichée, 2 essais. Normal : 1 astuce par phrase. Plus loin : chrono, sans astuce.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeftRight, Lightbulb, RotateCcw, Scissors, SquareDashed, Replace } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { Hud } from '../_kit/ui';
import {
  type Manipulation,
  type PhraseLabo,
  astuceFonction,
  manipuler,
  phraseInitiale,
  versLabo,
} from '../_langue-commun/fonctions';
import { collecterItems } from '../_langue-commun/tirage';
import { PasDExercice, Touche, useTouches } from '../_langue-commun/ui';
import { useRng } from '../_nombres-commun/outils';
import { BarreTemps, Correction } from '../_nombres-commun/ui';
import { useCompteARebours, useVoixEnPause } from '../_orthographe-commun/hooks';

const PHRASES: Record<Level, number> = { facile: 3, normal: 4, plus_loin: 5 };
const ESSAIS: Record<Level, number> = { facile: 2, normal: 1, plus_loin: 1 };
const CHRONO_MS: Record<Level, number> = { facile: Infinity, normal: Infinity, plus_loin: 35_000 };
const LIQUIDES = ['#4FC3F7', '#FF7A6B', '#7BD389', '#FFD45C', '#8E7CFF', '#E0A458'];

const OUTILS: { id: Manipulation; touche: string; libelle: string; icone: ReactNode }[] = [
  { id: 'supprimer', touche: 'S', libelle: 'Supprimer', icone: <Scissors aria-hidden /> },
  { id: 'deplacer', touche: 'D', libelle: 'Déplacer', icone: <ArrowLeftRight aria-hidden /> },
  { id: 'encadrer', touche: 'E', libelle: 'C’est… qui', icone: <SquareDashed aria-hidden /> },
  { id: 'remplacer', touche: 'R', libelle: 'Remplacer', icone: <Replace aria-hidden /> },
];

/** Une fiole (bouton de fonction), au liquide coloré. */
function Fiole({ couleur, pleine }: { couleur: string; pleine: boolean }) {
  return (
    <svg viewBox="0 0 40 52" className="h-11 w-9" aria-hidden>
      <path
        d="M14 3 H26 V17 L37 44 Q39 50 32 50 H8 Q1 50 3 44 L14 17 Z"
        fill="#fff"
        stroke="#24304A"
        strokeWidth="2.5"
      />
      <path
        d={
          pleine
            ? 'M10.5 26 H29.5 L35 44 Q36 47 32 47 H8 Q4 47 5 44 Z'
            : 'M7 38 H33 L35 44 Q36 47 32 47 H8 Q4 47 5 44 Z'
        }
        fill={couleur}
      />
      <circle cx="16" cy="40" r="2" fill="#fff" opacity="0.8" />
      <circle cx="23" cy="34" r="1.5" fill="#fff" opacity="0.8" />
      <rect x="12" y="1" width="16" height="4" rx="2" fill="#24304A" />
    </svg>
  );
}

export default function LaboFonctions({ level, stream, paused, onAnswer, onEnd, speech, sfx }: GameProps) {
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduite = !!useReducedMotion();
  const rng = useRng();

  const phrases = useMemo(() => {
    const items = collecterItems(stream, (x) => versLabo(x) !== null, parNiveau(level, PHRASES));
    return rng.shuffle(items).map((it) => versLabo(it)!);
  }, [stream, level, rng]);

  // Étapes de la partie : chaque groupe de chaque phrase, dans l'ordre de la phrase
  const etapes = useMemo(
    () =>
      phrases.flatMap((p, ip) =>
        p.segments.flatMap((s) => (s.groupe === null ? [] : [{ phrase: ip, groupe: s.groupe }])),
      ),
    [phrases],
  );
  const total = etapes.length;

  const [n, setN] = useState(0);
  const [manip, setManip] = useState<Manipulation | null>(null);
  const [essais, setEssais] = useState(0);
  const [etat, setEtat] = useState<'jeu' | 'juste' | 'faux' | 'reessai'>('jeu');
  const [choisi, setChoisi] = useState<number | null>(null);
  const [astuce, setAstuce] = useState(level === 'facile');
  const [astucesRestantes, setAstucesRestantes] = useState(level === 'normal' ? 1 : 0);
  const [trouvees, setTrouvees] = useState<Record<string, number>>({});
  const [justes, setJustes] = useState(0);
  const [fini, setFini] = useState(false);

  const etape = etapes[n];
  const p: PhraseLabo | null = etape ? phrases[etape.phrase]! : null;
  const g = etape?.groupe ?? -1;
  const el = p?.item.elements[g];
  const resultat = p && manip ? manipuler(p, g, manip) : null;

  useEffect(() => {
    session.startQuestion();
    setManip(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
  // Nouvelle phrase : une astuce de plus en Normal
  const indexPhrase = etape?.phrase ?? -1;
  useEffect(() => {
    setAstucesRestantes(level === 'normal' ? 1 : 0);
  }, [indexPhrase, level]);

  const essayer = useCallback(
    (m: Manipulation) => {
      if (!p || etat === 'juste' || etat === 'faux' || paused) return;
      if (m === 'remplacer' && manipuler(p, g, 'remplacer') === null) return;
      sfx.play(m === 'supprimer' ? 'glisse' : 'pop');
      setManip((x) => (x === m ? null : m));
    },
    [p, g, etat, paused, sfx],
  );

  const verser = useCallback(
    (cat: number | null) => {
      if (!p || !el || (etat !== 'jeu' && etat !== 'reessai') || paused || fini) return;
      const juste = cat === el.category;
      const essai = essais + 1;
      setEssais(essai);
      setChoisi(cat);
      if (!juste && cat !== null && essai < ESSAIS[level]) {
        sfx.play('glisse');
        setEtat('reessai');
        setAstuce(true);
        return;
      }
      session.answer(
        p.item,
        juste,
        cat === null ? '(temps écoulé)' : (p.item.categories[cat] ?? ''),
        `${el.label} : ${p.item.categories[el.category]}`,
      );
      setTrouvees((t) => ({ ...t, [`${etape!.phrase}-${g}`]: el.category }));
      if (juste) {
        sfx.play('juste');
        setJustes((j) => j + 1);
        setEtat('juste');
      } else {
        sfx.play('faux');
        vibrate(50);
        setEtat('faux');
      }
    },
    [p, el, etat, paused, fini, essais, level, session, sfx, etape, g],
  );

  const restant = useCompteARebours({
    actif: (etat === 'jeu' || etat === 'reessai') && Number.isFinite(CHRONO_MS[level]) && !!p,
    dureeMs: CHRONO_MS[level],
    paused,
    cle: n,
    onFin: () => verser(null),
  });

  const suivant = useCallback(() => {
    if (n + 1 >= total) {
      setFini(true);
      sfx.play('fanfare');
      const reussi = justes >= Math.ceil(total * 0.6);
      session.end({
        won: reussi,
        headline: reussi
          ? 'Expériences réussies, chercheur ! 🧪'
          : `${justes} fonctions trouvées sur ${total}`,
        delayMs: 900,
      });
      return;
    }
    setN((x) => x + 1);
    setEtat('jeu');
    setChoisi(null);
    setEssais(0);
    setAstuce(level === 'facile');
  }, [n, total, justes, session, sfx, level]);

  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, 1500);
    return () => clearTimeout(t);
  }, [etat, paused, suivant]);

  const enJeu = (etat === 'jeu' || etat === 'reessai') && !paused && !fini;
  useTouches(enJeu && !!p, (e) => {
    const k = e.key.toLowerCase();
    if (/^[1-6]$/.test(k)) {
      verser(Number(k) - 1);
      return true;
    }
    const outil = OUTILS.find((o) => o.touche.toLowerCase() === k);
    if (outil) {
      essayer(outil.id);
      return true;
    }
    if (k === 'escape' || k === 'z') {
      setManip(null);
      return true;
    }
    return false;
  });

  if (!p || !el) {
    return (
      <PasDExercice
        texte="Le labo a besoin de phrases découpées en groupes (sujet, compléments…) à analyser."
        onFin={() => session.end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const astuceTexte = astuceFonction(p.item.categories[el.category] ?? '');
  // Le carnet donne la méthode pour TOUTES les fonctions proposées (sans désigner la bonne réponse)
  const carnet = p.item.categories.flatMap((c) => {
    const a = astuceFonction(c);
    return a ? [{ fonction: c, astuce: a }] : [];
  });
  const peutRemplacer = manipuler(p, g, 'remplacer') !== null;
  const segCible = p.segmentDuGroupe[g]!;

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full items-center justify-between gap-2">
        <Hud>
          🧪 {Math.min(n + 1, total)} / {total}
        </Hud>
        <Hud>✅ {justes}</Hud>
      </div>

      {/* La paillasse : la phrase-éprouvette */}
      <section
        className="relative w-full rounded-card border-4 border-white p-4 shadow-soft sm:p-6"
        style={{ background: 'linear-gradient(180deg,#E8FBF7 0%,#D3F2EC 100%)' }}
        aria-label="La phrase à analyser"
      >
        <div className="mb-3 flex items-center gap-2">
          <SpeakButton text={phraseInitiale(p)} label="Écouter la phrase" />
          <p className="font-bold text-ink-soft">{p.item.prompt}</p>
        </div>
        <div className="relative rounded-[2rem] border-4 border-[#9ADCD0] bg-white/80 px-3 py-4 shadow-inner">
          <p className="flex flex-wrap items-end gap-x-2 gap-y-6 font-titre text-2xl font-extrabold leading-snug sm:text-3xl">
            {p.segments.map((s, i) => {
              const cible = i === segCible;
              const cat = s.groupe !== null ? trouvees[`${etape!.phrase}-${s.groupe}`] : undefined;
              const fait = cat !== undefined;
              if (cible && enJeu) {
                return (
                  <motion.span
                    key={i}
                    className="relative inline-flex cursor-grab touch-none rounded-xl bg-sun px-2 py-0.5 shadow-pop-sm ring-4 ring-sun/50 active:cursor-grabbing"
                    drag={!paused}
                    dragSnapToOrigin
                    dragMomentum={false}
                    whileDrag={{ scale: 1.08, rotate: -3 }}
                    onDragEnd={(_e, info) => {
                      if (Math.abs(info.offset.y) > 45) essayer('supprimer');
                      else if (Math.abs(info.offset.x) > 60) essayer('deplacer');
                    }}
                    animate={!reduite && !manip ? { y: [0, -3, 0] } : { y: 0 }}
                    transition={{ duration: 1.6, repeat: !reduite && !manip ? Infinity : 0 }}
                    aria-label={`Groupe à analyser : ${s.texte}`}
                  >
                    {s.texte}
                  </motion.span>
                );
              }
              return (
                <span
                  key={i}
                  className={`relative inline-flex flex-col items-center ${s.texte === ',' ? '-ml-2' : ''}`}
                >
                  <span
                    className={fait ? 'rounded-lg px-1' : ''}
                    style={fait ? { background: `${LIQUIDES[cat! % LIQUIDES.length]}55` } : undefined}
                  >
                    {s.texte}
                  </span>
                  {fait && (
                    <span className="absolute -bottom-5 whitespace-nowrap text-xs font-bold text-ink-soft">
                      {p.item.categories[cat!]}
                    </span>
                  )}
                </span>
              );
            })}
            <span className="-ml-2">{p.finale}</span>
          </p>
        </div>
        {enJeu && (
          <p className="mt-2 text-center text-sm text-ink-soft">
            Glisse le groupe jaune vers le haut pour le supprimer, sur le côté pour le déplacer… ou utilise
            les outils.
          </p>
        )}

        {/* Les outils */}
        {enJeu && (
          <div className="mt-3 flex flex-wrap justify-center gap-2" role="group" aria-label="Expériences">
            {OUTILS.filter((o) => o.id !== 'remplacer' || peutRemplacer).map((o) => (
              <Button
                key={o.id}
                variant={manip === o.id ? 'grape' : 'blanc'}
                icon={o.icone}
                onClick={() => essayer(o.id)}
                aria-pressed={manip === o.id}
                className="relative !min-h-[52px] !px-3 text-base sm:!px-4"
              >
                {o.libelle}
                <Touche className="ml-1 hidden sm:flex">{o.touche}</Touche>
              </Button>
            ))}
            {manip && (
              <Button
                variant="fantome"
                icon={<RotateCcw aria-hidden />}
                onClick={() => setManip(null)}
                className="!min-h-[52px] text-base"
              >
                Remettre
              </Button>
            )}
          </div>
        )}

        {/* Le résultat de l'expérience */}
        <AnimatePresence mode="wait">
          {resultat && enJeu && (
            <motion.div
              key={`${manip}-${n}`}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-2xl border-2 border-dashed border-grape bg-white p-3"
              role="status"
            >
              <div className="flex items-start gap-2">
                <SpeakButton text={resultat} label="Écouter la phrase obtenue" size={40} />
                <p className="font-titre text-xl font-bold">« {resultat} »</p>
              </div>
              <p className="mt-1 text-sm font-bold text-grape-dark">
                Écoute-la : la phrase est-elle encore correcte ? Garde-t-elle son sens ?
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {enJeu && astuce && carnet.length > 0 && (
        <div className="w-full rounded-2xl bg-sun/25 px-4 py-2">
          <p className="flex items-center gap-2 font-bold">
            <Lightbulb className="shrink-0 text-sun-dark" aria-hidden />
            Le carnet du chercheur
            <SpeakButton
              text={carnet.map((c) => `${c.fonction} : ${c.astuce}`).join(' ')}
              label="Écouter le carnet"
              size={36}
            />
          </p>
          <ul className="mt-1 space-y-1 text-sm sm:text-base">
            {carnet.map((c) => (
              <li key={c.fonction}>
                <strong>{c.fonction}</strong> — {c.astuce}
              </li>
            ))}
          </ul>
        </div>
      )}
      {enJeu && !astuce && astucesRestantes > 0 && carnet.length > 0 && (
        <Button
          variant="sun"
          icon={<Lightbulb aria-hidden />}
          onClick={() => {
            setAstuce(true);
            setAstucesRestantes((x) => x - 1);
          }}
        >
          Astuce
        </Button>
      )}
      {etat === 'reessai' && (
        <p className="font-bold text-coral-dark" role="status">
          Presque&nbsp;! Fais une autre expérience, puis réessaie.
        </p>
      )}
      {Number.isFinite(CHRONO_MS[level]) && enJeu && (
        <BarreTemps reste={restant} label="Temps de l’expérience" />
      )}

      {/* Les fioles : les fonctions */}
      <div
        className="flex w-full flex-wrap justify-center gap-2"
        role="group"
        aria-label="Les fioles des fonctions"
      >
        {p.item.categories.map((c, i) => {
          const bon = (etat === 'faux' || etat === 'juste') && i === el.category;
          const rate = (etat === 'faux' || etat === 'reessai') && i === choisi;
          return (
            <motion.button
              key={`${c}-${i}`}
              type="button"
              onClick={() => verser(i)}
              disabled={!enJeu}
              className={`btn-3d relative flex min-h-[64px] min-w-[7.5rem] flex-1 basis-[30%] items-center gap-2 bg-card px-3 py-2 text-left sm:basis-0 ${
                bon ? 'ring-4 ring-grass' : rate ? 'ring-4 ring-coral' : ''
              }`}
              animate={bon && !reduite ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              aria-label={`Fiole ${i + 1} : ${c}`}
            >
              <Touche className="absolute -left-1.5 -top-1.5">{i + 1}</Touche>
              <Fiole couleur={LIQUIDES[i % LIQUIDES.length]!} pleine={bon} />
              <span className="font-titre text-lg font-bold leading-tight">{c}</span>
            </motion.button>
          );
        })}
      </div>

      {etat === 'juste' && (
        <p className="font-titre text-2xl font-extrabold text-grass-dark" role="status">
          Bonne fiole&nbsp;! « {el.label} » : {p.item.categories[el.category]}.
        </p>
      )}
      <Correction
        ouvert={etat === 'faux'}
        titre={choisi === null ? 'Le temps de l’expérience est fini !' : 'Presque !'}
        bonne={`fonction de « ${el.label} » : ${p.item.categories[el.category]}.`}
        explication={[astuceTexte, p.item.explication].filter(Boolean).join(' ')}
        onContinuer={suivant}
      />
    </div>
  );
}
