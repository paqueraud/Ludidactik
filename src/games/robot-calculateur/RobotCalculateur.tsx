/**
 * Le Robot calculateur (CATALOGUE n°4) — calcul mental à l'oral.
 * Le robot dit le calcul ; l'enfant répond à voix haute (reconnaissance vocale, seulement si le parent
 * l'a autorisée dans les réglages) ou tape sa réponse au pavé numérique (repli toujours disponible).
 * Facile : le calcul reste écrit, réécoute illimitée. Normal : calcul seulement à l'oral, un coup d'œil
 * possible. Plus loin : à l'oral, une seule réécoute, batterie qui se vide (chrono).
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keypad } from '@/components/Keypads';
import { Button } from '@/components/ui';
import type { Item, Level } from '@/content/schemas';
import { checkNumeric, formatNumber, normalizeText, parseNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { graphiesNombre } from '@/engine/nombres';
import { useGameSession } from '@/games/_kit/session';
import { Hud } from '@/games/_kit/ui';
import { vibrate } from '@/services/sfx';
import { useSettings } from '@/stores/settings';
import { bravo, tirer, useBoucle, useRng } from '../_nombres-commun/outils';
import { Bandeau, BarreTemps, CaseReponse, Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { useSaisieNumerique } from '../_nombres-commun/useSaisieNumerique';
import { type Humeur, Robot } from './Robot';

const MANCHES: Record<Level, number> = { facile: 6, normal: 10, plus_loin: 12 };
const REECOUTES: Record<Level, number> = { facile: Infinity, normal: Infinity, plus_loin: 1 };
const CHRONO: Record<Level, number | null> = { facile: null, normal: null, plus_loin: 14 };

interface Question {
  item: Item;
  ecrit: string;
  aDire: string;
  valeur: number | null;
  acceptes: string[];
  bonne: string;
  explication: string;
}

const norm = (s: string) =>
  normalizeText(s)
    .toLowerCase()
    .replace(/[.!?]$/, '');

function versQuestion(it: Item): Question | null {
  if (it.kind === 'oral_answer') {
    const valeur = parseNumber(it.answer);
    if (valeur === null) return null;
    return {
      item: it,
      ecrit: it.prompt,
      aDire: it.spoken ?? it.prompt,
      valeur,
      acceptes: [...it.accepted, it.answer].map(norm),
      bonne: it.answer,
      explication: it.explication,
    };
  }
  if (it.kind === 'numeric_answer') {
    const a = it.answer;
    const acceptes = [String(a), formatNumber(a), String(a).replace('.', ',')];
    if (Number.isInteger(a) && a >= 0 && a <= 999_999_999) acceptes.push(...graphiesNombre(a));
    return {
      item: it,
      ecrit: it.prompt,
      aDire: it.spoken,
      valeur: a,
      acceptes: acceptes.map(norm),
      bonne: formatNumber(a),
      explication: it.explication,
    };
  }
  return null;
}

/** Une transcription correspond-elle ? (mots acceptés, ou nombre reconnu en chiffres). */
function correspond(q: Question, alternatives: string[]): boolean {
  for (const alt of alternatives) {
    const n = norm(alt);
    if (q.acceptes.includes(n)) return true;
    if (q.acceptes.includes(n.replace(/ /g, '-'))) return true;
    const v = parseNumber(n.replace(/\s/g, ''));
    if (v !== null && q.valeur !== null && Math.abs(v - q.valeur) < 1e-9) return true;
  }
  return false;
}

type Etat = 'ecoute-robot' | 'reponse' | 'micro' | 'juste' | 'faux' | 'fin';

export default function RobotCalculateur({
  level,
  lesson,
  stream,
  target,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
}: GameProps) {
  const rng = useRng();
  const microAutorise = useSettings((s) => s.micro);
  const { stats, answer, startQuestion, end } = useGameSession({ paused, onAnswer, onEnd });
  const N = MANCHES[level];

  const nouvelle = useCallback((): Question | null => {
    for (let i = 0; i < 30; i++) {
      const it = tirer(
        stream,
        target(),
        (x): x is Item => x.kind === 'oral_answer' || x.kind === 'numeric_answer',
        1,
      );
      const q = it && versQuestion(it);
      if (q) return q;
    }
    return null;
  }, [stream, target]);

  const [q, setQ] = useState<Question | null>(() => nouvelle());
  const [manche, setManche] = useState(1);
  const [etat, setEtat] = useState<Etat>('ecoute-robot');
  const [voirCalcul, setVoirCalcul] = useState(level === 'facile');
  const [reecoutes, setReecoutes] = useState(0);
  const [micDispo, setMicDispo] = useState(microAutorise && speech.sttAvailable);
  const [infoMicro, setInfoMicro] = useState('');
  const [entendu, setEntendu] = useState('');
  const [message, setMessage] = useState('');
  const [reste, setReste] = useState(1);
  const verrou = useRef(false);
  const score = useRef(0);

  const dire = useCallback(
    async (texte: string) => {
      setEtat((e) => (e === 'reponse' || e === 'ecoute-robot' ? 'ecoute-robot' : e));
      await speech.speak(texte);
      setEtat((e) => (e === 'ecoute-robot' ? 'reponse' : e));
    },
    [speech],
  );

  // Le robot dit le calcul à chaque nouvelle question (c'est un jeu d'écoute)
  useEffect(() => {
    if (!q) return;
    startQuestion();
    setReste(1);
    if (paused) {
      setEtat('reponse');
      return;
    }
    void dire(q.aDire);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const conclure = useCallback(
    (juste: boolean, donne: string) => {
      if (!q || verrou.current) return;
      verrou.current = true;
      speech.stop();
      answer(q.item, juste, donne, q.bonne);
      if (juste) {
        score.current += 100 + Math.round(reste * 50);
        sfx.play('juste');
        setMessage(bravo(rng));
        setEtat('juste');
      } else {
        sfx.play('faux');
        vibrate(60);
        setEtat('faux');
      }
    },
    [q, speech, answer, reste, sfx, rng],
  );

  const valider = useCallback(
    (v: string) => {
      if (!q || paused) return;
      const juste =
        q.valeur !== null
          ? checkNumeric(v, q.valeur, { tolerateZeros: level === 'facile' }).correct
          : q.acceptes.includes(norm(v));
      conclure(juste, v);
    },
    [q, paused, level, conclure],
  );

  const saisieActive = (etat === 'reponse' || etat === 'ecoute-robot') && !paused && !!q;
  const { valeur, setValeur, handlers } = useSaisieNumerique({ actif: saisieActive, onValider: valider });

  const ecouterEnfant = useCallback(async () => {
    if (!q || !saisieActive) return;
    speech.stop();
    setEtat('micro');
    setInfoMicro('');
    const res = await speech.listen({ lang: 'fr-FR', timeoutMs: 6000 });
    if (verrou.current) return;
    if (res === null) {
      setMicDispo(false);
      setInfoMicro('Le micro n’est pas disponible : tape ta réponse sur le pavé.');
      setEtat('reponse');
      return;
    }
    if (!res.length) {
      setInfoMicro('Je n’ai rien entendu… Réessaie, ou tape ta réponse.');
      setEtat('reponse');
      return;
    }
    setEntendu(res[0]!);
    conclure(correspond(q, res), res[0]!);
  }, [q, saisieActive, speech, conclure]);

  const suivant = useCallback(() => {
    if (manche >= N) {
      setEtat('fin');
      const reussi = stats.correct >= Math.ceil(N * 0.6);
      sfx.play(reussi ? 'fanfare' : 'etoile');
      end({
        won: reussi,
        headline: reussi
          ? 'Batterie chargée à bloc ! Le robot te dit merci ! 🤖'
          : `${stats.correct} bonnes réponses sur ${N} !`,
        score: score.current,
        delayMs: 1000,
      });
      return;
    }
    setQ(nouvelle());
    setManche((m) => m + 1);
    setValeur('');
    setEntendu('');
    setInfoMicro('');
    setMessage('');
    setReecoutes(0);
    setVoirCalcul(level === 'facile');
    verrou.current = false;
    setEtat('ecoute-robot');
  }, [manche, N, stats.correct, sfx, end, nouvelle, setValeur, level]);

  useEffect(() => {
    if (etat !== 'juste') return;
    const t = setTimeout(suivant, 1200);
    return () => clearTimeout(t);
  }, [etat, suivant]);

  // Batterie qui se vide (Plus loin)
  const chrono = CHRONO[level];
  useBoucle(!!chrono && etat === 'reponse' && !paused, (dt) =>
    setReste((r) => Math.max(0, r - dt / chrono!)),
  );
  useEffect(() => {
    if (chrono && reste <= 0 && etat === 'reponse') conclure(false, '(temps écoulé)');
  }, [reste, chrono, etat, conclure]);

  // Raccourci clavier : M = micro
  useEffect(() => {
    if (!micDispo || !saisieActive) return;
    const h = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        void ecouterEnfant();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [micDispo, saisieActive, ecouterEnfant]);

  if (!q) {
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de calculs pour le robot."
        onFin={() => end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const humeur: Humeur =
    etat === 'ecoute-robot'
      ? 'parle'
      : etat === 'micro'
        ? 'ecoute'
        : etat === 'juste'
          ? 'content'
          : etat === 'faux'
            ? 'perplexe'
            : 'repos';
  const batterie = Math.min(1, stats.correct / N);
  const peutReecouter = reecoutes < REECOUTES[level] && (etat === 'reponse' || etat === 'ecoute-robot');
  const decimal = (q.valeur !== null && !Number.isInteger(q.valeur)) || lesson.classe === 'CM2';

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row">
      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[42%] lg:self-start"
        aria-label="Le robot"
        style={{ background: 'linear-gradient(180deg,#DDF3FF 0%,#B8E2F8 70%,#9AD0EC 100%)' }}
      >
        <div className="absolute inset-x-0 bottom-0 h-10 bg-[#8FC3DE]" aria-hidden />
        <div className="relative flex h-[230px] items-end justify-center pb-2 sm:h-[330px]">
          <Robot humeur={humeur} batterie={batterie} />
          <AnimatePresence>
            {(etat === 'ecoute-robot' || voirCalcul || etat === 'faux' || etat === 'juste') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-2 top-3 max-w-[55%] rounded-2xl rounded-bl-none bg-white px-4 py-2 font-titre text-2xl font-extrabold shadow-pop-sm sm:text-3xl"
                aria-live="polite"
              >
                {voirCalcul || etat === 'faux' || etat === 'juste' ? q.ecrit : '…'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute left-2 top-2">
          <Hud>
            🤖 {Math.min(manche, N)} / {N}
          </Hud>
        </div>
      </section>

      <section className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-4 sm:p-6">
        <Bandeau>
          <Hud>✅ {stats.correct}</Hud>
          {chrono && etat !== 'juste' && etat !== 'faux' && <BarreTemps reste={reste} label="Batterie" />}
        </Bandeau>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="sun"
            onClick={() => {
              setReecoutes((r) => r + 1);
              void dire(q.aDire);
            }}
            disabled={!peutReecouter || paused}
          >
            🔊 Répète, robot !
          </Button>
          {!voirCalcul && level === 'normal' && (etat === 'reponse' || etat === 'ecoute-robot') && (
            <Button variant="blanc" onClick={() => setVoirCalcul(true)}>
              👀 Voir le calcul
            </Button>
          )}
        </div>

        {micDispo ? (
          <div className="flex flex-col items-center gap-1">
            <motion.button
              type="button"
              onClick={() => void ecouterEnfant()}
              disabled={!saisieActive && etat !== 'micro'}
              className={`flex h-24 w-24 items-center justify-center rounded-full text-white shadow-pop ${
                etat === 'micro' ? 'bg-coral' : 'bg-grape'
              } disabled:opacity-50`}
              animate={etat === 'micro' ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 0.8, repeat: etat === 'micro' ? Infinity : 0 }}
              aria-label="Répondre à voix haute"
            >
              <Mic size={44} aria-hidden />
            </motion.button>
            <p className="text-sm font-bold text-ink-soft">
              {etat === 'micro' ? 'Je t’écoute…' : 'Touche le micro (ou M) et dis ta réponse'}
            </p>
          </div>
        ) : (
          <p className="text-center text-sm font-bold text-ink-soft">
            {microAutorise
              ? 'Le micro n’est pas disponible sur cet appareil : tape ta réponse.'
              : 'Dis ta réponse à voix haute, puis tape-la sur le pavé.'}
          </p>
        )}
        {infoMicro && (
          <p className="text-center font-bold text-coral-dark" role="status">
            {infoMicro}
          </p>
        )}
        {entendu && etat !== 'micro' && (
          <p className="text-center text-sm">
            J’ai entendu : <strong>« {entendu} »</strong>
          </p>
        )}

        <CaseReponse
          valeur={valeur}
          etat={etat === 'faux' ? 'faux' : etat === 'juste' ? 'juste' : null}
          label={micDispo ? 'Ou tape ta réponse' : 'Ta réponse'}
        />
        <p className="min-h-[1.75rem] font-titre text-xl font-extrabold text-grass-dark" aria-live="polite">
          {etat === 'juste' ? message : ''}
        </p>
        <Correction
          ouvert={etat === 'faux'}
          titre={valeur || entendu ? 'Presque !' : 'La batterie est vide !'}
          bonne={q.bonne}
          aDire={`${q.ecrit.replace(/×/g, 'fois').replace(/−/g, 'moins')}, la bonne réponse est ${q.bonne}. ${q.explication}`}
          explication={q.explication}
          onContinuer={suivant}
        />
        {etat !== 'faux' && <Keypad {...handlers} decimal={decimal} />}
      </section>
    </div>
  );
}
