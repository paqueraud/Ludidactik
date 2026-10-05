/**
 * Le Feu tricolore de la ponctuation (CATALOGUE n° 43) — oreille prosodique.
 * On ENTEND la phrase (synthèse vocale : la phrase lue porte sa ponctuation, donc son intonation),
 * puis on allume le bon feu : point (la voix descend), point d'interrogation (elle monte),
 * point d'exclamation (elle s'exclame). Une bonne réponse fait passer une voiture.
 * Facile : la phrase est écrite, aide-mémoire sous chaque feu, écoutes illimitées.
 * Normal : on écoute d'abord ; « Voir la phrase » en indice. Plus loin : 2 écoutes, feu chronométré.
 * Clavier : touches . ? ! ou 1 2 3 ; R = réécouter.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Eye, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import type { Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import { type QuestionFeu, type Signe, avecSigne, versFeu } from '../_langue-commun/phrases';
import { tirerItem } from '../_langue-commun/tirage';
import { PasDExercice, Touche, useTouches } from '../_langue-commun/ui';
import { BarreTemps } from '../_nombres-commun/ui';
import { useCompteARebours, useVoixEnPause } from '../_orthographe-commun/hooks';

const MANCHES: Record<Level, number> = { facile: 8, normal: 10, plus_loin: 12 };
const ECOUTES: Record<Level, number> = { facile: Infinity, normal: Infinity, plus_loin: 2 };
const CHRONO_MS: Record<Level, number> = { facile: Infinity, normal: Infinity, plus_loin: 12_000 };

const LAMPES: Record<Signe, { couleur: string; nom: string; aide: string }> = {
  '.': { couleur: '#FF7A6B', nom: 'Point', aide: 'La voix descend : on raconte.' },
  '?': { couleur: '#FFB13D', nom: 'Point d’interrogation', aide: 'La voix monte : on demande.' },
  '!': { couleur: '#5CC46E', nom: 'Point d’exclamation', aide: 'La voix s’exclame : surprise, joie, ordre…' },
};
const ORDRE: Signe[] = ['.', '?', '!'];

/** La route, le petit feu et la voiture qui passe quand la réponse est juste. */
function Route({ passe, allume, reduite }: { passe: boolean; allume: Signe | null; reduite: boolean }) {
  return (
    <svg viewBox="0 0 400 200" className="block h-[170px] w-full sm:h-[240px]" aria-hidden>
      <defs>
        <linearGradient id="feu-ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BFE8FF" />
          <stop offset="1" stopColor="#EAF8FF" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#feu-ciel)" />
      <circle cx="350" cy="38" r="20" fill="#FFD45C" />
      <ellipse cx="90" cy="40" rx="38" ry="11" fill="#fff" opacity="0.9" />
      <ellipse cx="230" cy="28" rx="30" ry="9" fill="#fff" opacity="0.8" />
      <path d="M0 120 Q60 95 130 112 T260 106 T400 112 V140 H0 Z" fill="#9EDB8F" />
      <rect y="132" width="400" height="50" fill="#5B667D" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={i * 48 + 6} y="155" width="26" height="4" rx="2" fill="#FFF8EC" />
      ))}
      <rect y="182" width="400" height="18" fill="#7BD389" />
      {/* passage piéton et feu */}
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x="262" y={134 + i * 9.5} width="22" height="5" fill="#FFF8EC" opacity="0.9" />
      ))}
      <rect x="296" y="70" width="6" height="64" rx="3" fill="#24304A" />
      <rect x="287" y="52" width="24" height="56" rx="8" fill="#24304A" />
      {ORDRE.map((s, i) => (
        <circle
          key={s}
          cx="299"
          cy={62 + i * 18}
          r="6.5"
          fill={allume === s ? LAMPES[s].couleur : '#4A5670'}
          stroke={allume === s ? '#fff' : 'none'}
          strokeWidth="1.5"
        />
      ))}
      {/* la voiture */}
      <motion.g
        initial={false}
        animate={passe ? { x: reduite ? 0 : 330, opacity: reduite ? 0.3 : 1 } : { x: 0, opacity: 1 }}
        transition={passe ? { duration: reduite ? 0.2 : 1.1, ease: 'easeIn' } : { duration: 0 }}
      >
        <g transform="translate(150 128)">
          <rect x="0" y="12" width="96" height="26" rx="10" fill="#8E7CFF" />
          <path d="M18 14 Q28 -6 52 -6 Q72 -6 80 14 Z" fill="#8E7CFF" />
          <path d="M26 13 Q33 0 48 0 L48 13 Z M54 13 L54 0 Q68 0 73 13 Z" fill="#DDF3FF" />
          <circle cx="92" cy="22" r="3.5" fill="#FFD45C" />
          <circle cx="24" cy="38" r="10" fill="#24304A" />
          <circle cx="24" cy="38" r="4" fill="#B8C0D0" />
          <circle cx="74" cy="38" r="10" fill="#24304A" />
          <circle cx="74" cy="38" r="4" fill="#B8C0D0" />
        </g>
      </motion.g>
    </svg>
  );
}

export default function FeuPonctuation({ level, stream, paused, onAnswer, onEnd, speech, sfx }: GameProps) {
  const total = parNiveau(level, MANCHES);
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduite = !!useReducedMotion();

  const tirer = useCallback((): QuestionFeu | null => {
    const it = tirerItem(stream, (x) => versFeu(x) !== null);
    return it ? versFeu(it) : null;
  }, [stream]);

  const [q, setQ] = useState<QuestionFeu | null>(() => tirer());
  const [manche, setManche] = useState(1);
  const [etat, setEtat] = useState<'question' | 'juste' | 'faux'>('question');
  const [choisi, setChoisi] = useState<Signe | null>(null);
  const [voirTexte, setVoirTexte] = useState(false);
  const [ecoutes, setEcoutes] = useState(0);
  const [voitures, setVoitures] = useState(0);
  const [fini, setFini] = useState(false);

  const sansVoix = !speech.ttsAvailable;
  const texteVisible = level === 'facile' || voirTexte || sansVoix || etat !== 'question';
  const maxEcoutes = ECOUTES[level];

  const ecouter = useCallback(() => {
    if (!q || paused) return;
    setEcoutes((n) => n + 1);
    void speech.speak(q.aDire);
  }, [q, paused, speech]);

  // Nouvelle phrase : on la fait entendre tout de suite (c'est un jeu d'écoute)
  useEffect(() => {
    if (!q) return;
    session.startQuestion();
    if (!paused && !sansVoix) {
      setEcoutes(1);
      void speech.speak(q.aDire);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const repondre = useCallback(
    (signe: Signe | null) => {
      if (!q || etat !== 'question' || paused || fini) return;
      if (signe && !q.choix.includes(signe)) return;
      const juste = signe === q.reponse;
      session.answer(q.item, juste, signe ?? '(temps écoulé)', q.reponse);
      speech.stop();
      setChoisi(signe);
      setEtat(juste ? 'juste' : 'faux');
      if (juste) {
        sfx.play('juste');
        setVoitures((v) => v + 1);
      } else {
        sfx.play('faux');
        vibrate(50);
      }
    },
    [q, etat, paused, fini, session, speech, sfx],
  );

  const restant = useCompteARebours({
    actif: etat === 'question' && Number.isFinite(CHRONO_MS[level]),
    dureeMs: CHRONO_MS[level],
    paused,
    cle: manche,
    onFin: () => repondre(null),
  });

  const suivant = useCallback(() => {
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      session.end({
        won: voitures >= Math.ceil(total * 0.6),
        headline: `${voitures} voiture${voitures > 1 ? 's' : ''} passée${voitures > 1 ? 's' : ''} au feu !`,
        delayMs: 900,
      });
      return;
    }
    setQ(tirer());
    setManche((m) => m + 1);
    setEtat('question');
    setChoisi(null);
    setVoirTexte(false);
    setEcoutes(0);
  }, [manche, total, voitures, session, sfx, tirer]);

  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, reduite ? 1100 : 1500);
    return () => clearTimeout(t);
  }, [etat, paused, suivant, reduite]);

  useTouches(etat === 'question' && !paused && !fini && !!q, (e) => {
    if (e.key === '.' || e.key === '?' || e.key === '!') {
      repondre(e.key);
      return true;
    }
    if (/^[1-3]$/.test(e.key) && q) {
      const s = q.choix[Number(e.key) - 1];
      if (s) repondre(s);
      return true;
    }
    if (e.key.toLowerCase() === 'r' && ecoutes < maxEcoutes) {
      ecouter();
      return true;
    }
    return false;
  });

  if (!q) {
    return (
      <PasDExercice
        texte="Cette leçon n’a pas de phrases à ponctuer à l’oreille."
        onFin={() => session.end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const peutEcouter = ecoutes < maxEcoutes && etat === 'question' && !paused && !sansVoix;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row">
      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[44%] lg:self-start"
        aria-label={etat === 'juste' ? 'La voiture passe au feu !' : 'La voiture attend au feu'}
      >
        <Route passe={etat === 'juste'} allume={etat === 'question' ? null : choisi} reduite={reduite} />
        <div className="absolute left-2 top-2 flex gap-2">
          <Hud>
            🚦 {Math.min(manche, total)} / {total}
          </Hud>
          <Hud>🚗 {voitures}</Hud>
        </div>
      </section>

      <section className="carte flex min-w-0 flex-1 flex-col items-center gap-4 p-4 sm:p-6">
        {Number.isFinite(CHRONO_MS[level]) && etat === 'question' && (
          <BarreTemps reste={restant} label="Feu orange" />
        )}

        {/* La phrase entendue */}
        <div className="flex w-full flex-col items-center gap-3">
          {!sansVoix && (
            <Button
              variant="sun"
              size="lg"
              icon={<Volume2 aria-hidden />}
              onClick={ecouter}
              disabled={!peutEcouter}
              aria-label="Écouter la phrase"
            >
              Écouter la phrase
              {Number.isFinite(maxEcoutes) && etat === 'question'
                ? ` (${Math.max(0, maxEcoutes - ecoutes)})`
                : ''}
            </Button>
          )}
          <div className="min-h-[3.5rem] w-full rounded-2xl bg-cream px-4 py-3 text-center" aria-live="polite">
            {texteVisible ? (
              <p className="font-titre text-2xl font-extrabold leading-snug sm:text-3xl">
                {q.phrase}
                <span
                  className={`ml-1 inline-flex min-w-[1.6ch] justify-center rounded-lg px-1 ${
                    etat === 'question'
                      ? 'border-4 border-dashed border-sky text-ink/30'
                      : etat === 'juste'
                        ? 'bg-grass/30 text-grass-dark'
                        : 'bg-sun/60 text-ink'
                  }`}
                >
                  {etat === 'question' ? '…' : q.reponse}
                </span>
              </p>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <p className="font-bold text-ink-soft">Écoute bien la voix à la fin de la phrase…</p>
                {level === 'normal' && (
                  <Button variant="blanc" icon={<Eye aria-hidden />} onClick={() => setVoirTexte(true)}>
                    Voir la phrase
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Le feu tricolore : un bouton par signe */}
        <div
          className="flex w-full max-w-md items-stretch justify-center gap-3"
          role="group"
          aria-label="Feu tricolore : choisis la ponctuation"
        >
          <div className="flex flex-col gap-3 rounded-[2rem] bg-ink p-3 shadow-pop">
            {ORDRE.map((s, i) => {
              const dispo = q.choix.includes(s);
              const estBon = etat !== 'question' && s === q.reponse;
              const estChoisi = choisi === s;
              return (
                <motion.button
                  key={s}
                  type="button"
                  onClick={() => repondre(s)}
                  disabled={!dispo || etat !== 'question' || paused}
                  aria-label={`${LAMPES[s].nom} (touche ${i + 1})`}
                  className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full font-titre text-5xl font-extrabold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-sun disabled:cursor-default"
                  style={{
                    background: LAMPES[s].couleur,
                    opacity: !dispo ? 0.2 : etat === 'question' || estBon || estChoisi ? 1 : 0.35,
                    boxShadow: estBon
                      ? `0 0 0 5px #fff, 0 0 26px 8px ${LAMPES[s].couleur}`
                      : 'inset 0 -6px 0 rgb(0 0 0 / 0.18)',
                  }}
                  whileTap={reduite ? undefined : { scale: 0.92 }}
                  animate={estChoisi && etat === 'faux' && !reduite ? { x: [0, -6, 6, -4, 0] } : { x: 0 }}
                >
                  <span className="[text-shadow:0_2px_0_rgb(0_0_0/0.25)]">{s}</span>
                </motion.button>
              );
            })}
          </div>
          <ul className="flex flex-col justify-around gap-3 text-left">
            {ORDRE.map((s, i) => (
              <li key={s} className={`flex items-center gap-2 ${q.choix.includes(s) ? '' : 'opacity-30'}`}>
                <Touche>{i + 1}</Touche>
                <span>
                  <span className="block font-bold leading-tight">{LAMPES[s].nom}</span>
                  {level === 'facile' && <span className="block text-sm text-ink-soft">{LAMPES[s].aide}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <AnimatePresence>
          {etat !== 'question' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              <Feedback
                state={etat}
                expected={avecSigne(q.phrase, q.reponse)}
                explication={q.item.explication}
                onContinue={suivant}
                message={
                  etat === 'juste'
                    ? 'Feu vert pour la voiture ! 🚗'
                    : choisi
                      ? 'Presque ! Réécoute la fin de la phrase.'
                      : 'Le feu a changé ! On réessaie à la prochaine.'
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
