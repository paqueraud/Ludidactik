/**
 * Défi bonus du week-end : le Dragon des tables (GAMIFICATION §4). 30 calculs de la leçon des tables
 * de la classe : chaque bonne réponse vide un peu sa barre de vie. Pas de chrono, pas de vies à
 * perdre : une erreur montre la bonne réponse et l'on continue.
 */
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Confetti } from '@/components/Confetti';
import { Keypad, usePhysicalKeyboard } from '@/components/Keypads';
import { Screen } from '@/components/Layout';
import { Ludo } from '@/components/Ludo';
import { Button, LudiCoin, SpeakButton } from '@/components/ui';
import { content, getLesson } from '@/content';
import type { NumericItem } from '@/content/items';
import { createStream, itemKey } from '@/content/provider';
import { checkNumeric, formatNumber } from '@/engine/answer';
import { createRng } from '@/engine/rng';
import { getBadge } from '@/meta/badges';
import { dayKey } from '@/meta/dates';
import { Dragon } from '@/meta/Illustrations';
import { LECON_BOSS, NB_COUPS_BOSS, bossDisponible, victoireBoss } from '@/services/meta';
import { updateLeitner } from '@/services/results';
import { addPlayTime } from '@/services/screenTime';
import { sfx } from '@/services/sfx';
import { speech } from '@/services/speech';
import type { Profile } from '@/services/storage/db';
import { AvecProfil } from './Parcours';

export function Boss() {
  return <AvecProfil>{(profile) => <BossInner key={profile.id} profile={profile} />}</AvecProfil>;
}

const ACCEPT = /^[0-9,.]$/;

function BossInner({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const lesson = getLesson(LECON_BOSS[profile.classe] ?? '');
  const ouvert = bossDisponible(profile.classe, dayKey());
  const stream = useMemo(
    () =>
      lesson
        ? createStream(content, lesson, 'numeric_answer', 'normal', createRng(Date.now()), {
            parentLists: [],
          })
        : null,
    [lesson],
  );
  const [item, setItem] = useState<NumericItem | null>(null);
  const [saisie, setSaisie] = useState('');
  const [coups, setCoups] = useState(0);
  const [essais, setEssais] = useState(0);
  const [correction, setCorrection] = useState<NumericItem | null>(null);
  const [touche, setTouche] = useState(false);
  const [fin, setFin] = useState<{ ludis: number; badges: string[] } | null>(null);
  const debut = useRef(Date.now());

  const suivant = useCallback(() => {
    const it = stream?.next(0.5);
    setItem(it && it.kind === 'numeric_answer' ? it : null);
    setSaisie('');
  }, [stream]);

  useEffect(() => {
    if (!item && stream) suivant();
  }, [item, stream, suivant]);

  // temps de jeu compté comme une partie
  useEffect(() => {
    debut.current = Date.now();
    return () => void addPlayTime(profile.id, Math.min(Date.now() - debut.current, 30 * 60_000));
  }, [profile.id]);

  const valider = useCallback(async () => {
    if (!item || correction || fin || !saisie) return;
    const ok = checkNumeric(saisie, item.answer, { tolerateZeros: true }).correct;
    setEssais((n) => n + 1);
    void updateLeitner(profile.id, itemKey(item), ok, undefined, lesson?.id);
    if (ok) {
      sfx.play('juste');
      setTouche(true);
      setTimeout(() => setTouche(false), 350);
      const n = coups + 1;
      setCoups(n);
      if (n >= NB_COUPS_BOSS) {
        sfx.play('fanfare');
        const r = await victoireBoss(profile.id);
        setFin(r);
        void speech.speak('Bravo ! Tu as vaincu le Dragon des tables !');
        return;
      }
      suivant();
    } else {
      sfx.play('faux');
      setCorrection(item);
    }
  }, [item, correction, fin, saisie, profile.id, lesson?.id, coups, suivant]);

  const clavier = useMemo(
    () => ({
      onKey: (k: string) => setSaisie((s) => (s.length < 9 ? s + k : s)),
      onDelete: () => setSaisie((s) => s.slice(0, -1)),
      onSubmit: () => {
        if (correction) {
          setCorrection(null);
          suivant();
        } else void valider();
      },
      disabled: !!fin,
    }),
    [correction, fin, suivant, valider],
  );
  usePhysicalKeyboard(clavier, ACCEPT, { pointEnVirgule: true });

  if (!lesson || !stream || !ouvert) {
    return (
      <Screen titre="Le Dragon des tables" retour="/defis">
        <div className="carte flex items-center gap-4 p-5">
          <Ludo pose="pense" size={80} />
          <p className="text-lg">
            Le dragon se repose en semaine. Il revient samedi et dimanche pour le défi bonus !
          </p>
        </div>
      </Screen>
    );
  }

  const vie = 1 - coups / NB_COUPS_BOSS;
  const consigne = `Le Dragon des tables ! Chaque bonne réponse lui fait perdre un peu de vie. Il faut ${NB_COUPS_BOSS} bonnes réponses pour le vaincre. Prends ton temps.`;

  return (
    <Screen titre="Le Dragon des tables" aLire={consigne} retour="/defis">
      {fin && <Confetti />}
      <div className="carte mx-auto flex max-w-xl flex-col items-center gap-3 p-4 text-center">
        <div className="w-full">
          <div className="mb-1 flex items-center justify-between text-sm font-bold">
            <span className="flex items-center gap-1">
              <Heart size={18} className="fill-coral text-coral" aria-hidden /> Vie du dragon
            </span>
            <span>
              {NB_COUPS_BOSS - coups} / {NB_COUPS_BOSS}
            </span>
          </div>
          <div
            className="h-6 overflow-hidden rounded-full bg-ink/10"
            role="progressbar"
            aria-label="Vie du dragon"
            aria-valuemin={0}
            aria-valuemax={NB_COUPS_BOSS}
            aria-valuenow={NB_COUPS_BOSS - coups}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-coral to-sun"
              animate={{ width: `${vie * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        <motion.div
          animate={
            fin
              ? { y: 40, opacity: 0.4, rotate: -12 }
              : touche
                ? { x: [0, -10, 10, -6, 0] }
                : { y: [0, -6, 0] }
          }
          transition={fin || touche ? { duration: 0.4 } : { duration: 2.5, repeat: Infinity }}
        >
          <Dragon size={150} touche={touche || !!fin} />
        </motion.div>

        {fin ? (
          <div className="flex flex-col items-center gap-3" role="status">
            <h2 className="text-3xl">Dragon vaincu !</h2>
            <p className="text-lg">
              {essais - coups === 0
                ? 'Sans une seule erreur : quelle maîtrise des tables !'
                : `${coups} bonnes réponses : tes tables sont de plus en plus solides.`}
            </p>
            {fin.ludis > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-sun/40 px-4 py-2 font-titre text-2xl font-extrabold">
                +{fin.ludis} <LudiCoin size={28} />
              </span>
            )}
            {fin.badges.map((id) => (
              <p key={id} className="font-bold">
                {getBadge(id)?.icone} Nouveau badge : {getBadge(id)?.titre} !
              </p>
            ))}
            <Button variant="grass" size="lg" onClick={() => navigate('/defis')} autoFocus>
              Retour aux défis
            </Button>
          </div>
        ) : correction ? (
          <div className="flex w-full flex-col items-center gap-2" role="alert">
            <p className="text-lg font-bold">Presque ! Le dragon a esquivé.</p>
            <p className="font-titre text-3xl font-extrabold">
              {correction.prompt} <span aria-hidden>→</span>{' '}
              <span className="text-grass-dark">{formatNumber(correction.answer)}</span>
            </p>
            <p className="text-ink-soft">{correction.explication}</p>
            <Button
              variant="sky"
              size="lg"
              autoFocus
              onClick={() => {
                setCorrection(null);
                suivant();
              }}
            >
              On continue !
            </Button>
          </div>
        ) : item ? (
          <>
            <div className="flex items-center gap-2">
              <p className="font-titre text-4xl font-extrabold sm:text-5xl" aria-live="polite">
                {/[=…]/.test(item.prompt) ? item.prompt : `${item.prompt} = ?`}
              </p>
              <SpeakButton text={item.spoken} size={44} />
            </div>
            <output
              className="flex h-16 min-w-[8rem] items-center justify-center rounded-2xl border-4 border-sky bg-cream px-4 font-titre text-4xl font-extrabold"
              aria-label="Ta réponse"
            >
              {saisie || ' '}
            </output>
            <Keypad {...clavier} decimal={item.decimals > 0} />
          </>
        ) : null}
      </div>
    </Screen>
  );
}
