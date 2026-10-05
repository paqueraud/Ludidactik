/**
 * Le Perroquet savant (CATALOGUE n° 45) — lecture à voix haute : syllabes, pseudo-mots, mots (BO CE1).
 * Micro (seulement si le parent l'a autorisé et si le navigateur le permet) : l'enfant lit, la
 * reconnaissance vocale compare avec tolérance (homophones, pseudo-mots approchés) ; si le perroquet a
 * compris, il répète le mot. Repli sans micro : « Je l'ai dit ! » → le perroquet dit le modèle →
 * auto-évaluation honnête (« J'ai bien lu » / « Je réessaie »).
 * Facile : 3 essais. Normal : 2 essais. Le modèle (item.spoken, sinon la réponse) s'écoute après un essai.
 * Plus loin : lecture « flash » (la carte se cache après 3 s), 1 essai.
 * Clavier : M ou Espace = micro / « Je l'ai dit », O = j'ai bien lu, R = je réessaie, Entrée = continuer.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Eye, Mic, RotateCcw, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { useSettings } from '@/stores/settings';
import { parNiveau, useAutoSpeak, useGameSession } from '../_kit/session';
import { Hud } from '../_kit/ui';
import { comparerOral } from '../_langue-commun/oral';
import { tirerItem } from '../_langue-commun/tirage';
import { PasDExercice, useTouches } from '../_langue-commun/ui';
import { bravo, useRng } from '../_nombres-commun/outils';
import { Correction } from '../_nombres-commun/ui';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { type ALire, versLecture } from './lecture';
import { type HumeurPerroquet, Perroquet } from './Perroquet';

const MANCHES: Record<Level, number> = { facile: 8, normal: 10, plus_loin: 12 };
const ESSAIS: Record<Level, number> = { facile: 3, normal: 2, plus_loin: 1 };
const FLASH_MS = 3000;

type Etat = 'lire' | 'ecoute' | 'repete' | 'pasCompris' | 'autoEval' | 'juste' | 'faux';

export default function PerroquetSavant({
  level,
  stream,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
  lectureAuto,
}: GameProps) {
  const total = parNiveau(level, MANCHES);
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduite = !!useReducedMotion();
  const rng = useRng();
  const microAutorise = useSettings((s) => s.micro);
  const [micDispo, setMicDispo] = useState(microAutorise && speech.sttAvailable);

  const tirer = useCallback((): ALire | null => {
    const it = tirerItem(stream, (x) => versLecture(x) !== null);
    return it ? versLecture(it) : null;
  }, [stream]);

  const [q, setQ] = useState<ALire | null>(() => tirer());
  const [manche, setManche] = useState(1);
  const [etat, setEtat] = useState<Etat>('lire');
  const [essais, setEssais] = useState(0);
  const [entendu, setEntendu] = useState('');
  const [info, setInfo] = useState('');
  const [cache, setCache] = useState(false);
  const [message, setMessage] = useState('');
  const [plumes, setPlumes] = useState(0);
  const [fini, setFini] = useState(false);
  const verrou = useRef(false);

  const maxEssais = ESSAIS[level];
  // Le modèle n'est donné qu'après un premier essai (sinon on répète au lieu de décoder)
  const modeleDispo = essais > 0;

  useEffect(() => {
    session.startQuestion();
    verrou.current = false;
    setCache(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  useAutoSpeak(speech, q ? q.consigne : null, q, lectureAuto && !paused);

  // Plus loin : lecture flash, la carte se cache après 3 s (figé pendant la pause)
  useEffect(() => {
    if (level !== 'plus_loin' || !q?.motALire || etat !== 'lire' || cache || paused) return;
    const t = setTimeout(() => setCache(true), FLASH_MS);
    return () => clearTimeout(t);
  }, [level, q, etat, cache, paused]);

  const conclure = useCallback(
    (juste: boolean, donne: string) => {
      if (!q || verrou.current) return;
      verrou.current = true;
      session.answer(q.item, juste, donne, q.reponse);
      if (juste) {
        setPlumes((p) => p + 1);
        setMessage(bravo(rng));
        setEtat('juste');
      } else {
        sfx.play('faux');
        vibrate(40);
        setEtat('faux');
      }
    },
    [q, session, sfx, rng],
  );

  /** Le perroquet répète (succès au micro). */
  const repeter = useCallback(async () => {
    if (!q) return;
    setEtat('repete');
    sfx.play('juste');
    await speech.speak(q.item.spoken ?? q.reponse);
    conclure(true, entendu || q.reponse);
  }, [q, sfx, speech, conclure, entendu]);

  const ecouterEnfant = useCallback(async () => {
    if (!q || paused || fini || (etat !== 'lire' && etat !== 'pasCompris')) return;
    speech.stop();
    setEtat('ecoute');
    setInfo('');
    const res = await speech.listen({ lang: 'fr-FR', timeoutMs: 5000 });
    if (verrou.current) return;
    if (res === null) {
      setMicDispo(false);
      setInfo('Le micro n’est pas disponible : lis à voix haute, puis touche « Je l’ai dit ! ».');
      setEtat('lire');
      return;
    }
    if (!res.length) {
      setInfo('Je n’ai rien entendu… Parle un peu plus fort !');
      setEtat(essais > 0 ? 'pasCompris' : 'lire');
      return;
    }
    const v = comparerOral(res, q.acceptes);
    setEntendu(v.entendu);
    if (v.ok) {
      void repeter();
      return;
    }
    const e = essais + 1;
    setEssais(e);
    if (e >= maxEssais) {
      void speech.speak(q.item.spoken ?? q.reponse);
      conclure(false, v.entendu);
    } else {
      sfx.play('glisse');
      setEtat('pasCompris');
    }
  }, [q, paused, fini, etat, speech, essais, maxEssais, repeter, conclure, sfx]);

  /** Repli sans micro : l'enfant a lu, le perroquet dit le modèle, l'enfant s'auto-évalue. */
  const jeLaiDit = useCallback(async () => {
    if (!q || paused || fini || (etat !== 'lire' && etat !== 'pasCompris')) return;
    setEtat('autoEval');
    setCache(false);
    await speech.speak(q.item.spoken ?? q.reponse);
  }, [q, paused, fini, etat, speech]);

  const autoEvaluer = useCallback(
    (bienLu: boolean) => {
      if (!q || etat !== 'autoEval') return;
      if (bienLu) {
        sfx.play('juste');
        conclure(true, '(auto-évaluation : bien lu)');
        return;
      }
      const e = essais + 1;
      setEssais(e);
      if (e >= maxEssais) conclure(false, '(auto-évaluation : à revoir)');
      else {
        sfx.play('glisse');
        setEtat('lire');
      }
    },
    [q, etat, essais, maxEssais, sfx, conclure],
  );

  const suivant = useCallback(() => {
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      session.end({
        won: plumes >= Math.ceil(total * 0.6),
        headline: `${plumes} plume${plumes > 1 ? 's' : ''} pour le perroquet savant ! 🦜`,
        delayMs: 900,
      });
      return;
    }
    setQ(tirer());
    setManche((m) => m + 1);
    setEtat('lire');
    setEssais(0);
    setEntendu('');
    setInfo('');
  }, [manche, total, plumes, session, sfx, tirer]);

  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, 1400);
    return () => clearTimeout(t);
  }, [etat, paused, suivant]);

  useTouches(!paused && !fini && !!q, (e) => {
    const k = e.key.toLowerCase();
    if ((k === 'm' || k === ' ') && (etat === 'lire' || etat === 'pasCompris')) {
      if (micDispo) void ecouterEnfant();
      else void jeLaiDit();
      return true;
    }
    if (etat === 'autoEval' && k === 'o') {
      autoEvaluer(true);
      return true;
    }
    if (etat === 'autoEval' && k === 'r') {
      autoEvaluer(false);
      return true;
    }
    return false;
  });

  if (!q) {
    return (
      <PasDExercice
        texte="Cette leçon n’a pas de syllabes ni de mots à lire à voix haute."
        onFin={() => session.end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const humeur: HumeurPerroquet =
    etat === 'ecoute'
      ? 'ecoute'
      : etat === 'repete' || etat === 'autoEval'
        ? 'parle'
        : etat === 'juste'
          ? 'content'
          : etat === 'pasCompris' || etat === 'faux'
            ? 'perplexe'
            : 'repos';
  const peutLire = (etat === 'lire' || etat === 'pasCompris') && !paused;
  const bulle =
    etat === 'repete' || etat === 'juste' || etat === 'autoEval'
      ? `${q.reponse} !`
      : etat === 'pasCompris'
        ? 'Pardon ? Répète !'
        : etat === 'ecoute'
          ? '…'
          : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row">
      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[40%] lg:self-start"
        style={{ background: 'linear-gradient(180deg,#C9F0D3 0%,#E8FAEA 60%,#BFE8C5 100%)' }}
        aria-label="Le perroquet"
      >
        <svg
          viewBox="0 0 300 60"
          className="absolute inset-x-0 top-0 h-12 w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 0 H300 V20 Q270 50 240 24 Q210 52 180 22 Q150 50 120 24 Q90 52 60 22 Q30 50 0 24 Z"
            fill="#7BD389"
          />
        </svg>
        <div className="relative flex h-[200px] items-end justify-center pb-2 sm:h-[300px]">
          <Perroquet humeur={humeur} reduite={reduite} />
          <AnimatePresence>
            {bulle && (
              <motion.div
                key={bulle}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-2 top-12 max-w-[50%] rounded-2xl rounded-br-none bg-white px-3 py-2 font-titre text-xl font-extrabold shadow-pop-sm sm:text-2xl"
                aria-live="polite"
              >
                {bulle}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute right-2 top-2 flex gap-2">
          <Hud>
            🦜 {Math.min(manche, total)} / {total}
          </Hud>
          <Hud>🪶 {plumes}</Hud>
        </div>
      </section>

      <section className="carte flex min-w-0 flex-1 flex-col items-center gap-4 p-4 sm:p-6">
        <div className="flex items-start justify-center gap-3">
          <SpeakButton text={q.consigne} label="Écouter la consigne" />
          <p className="text-center font-titre text-2xl font-extrabold">{q.consigne}</p>
        </div>

        {/* La carte à lire */}
        {q.motALire && (
          <div className="relative flex min-h-[7rem] w-full max-w-md items-center justify-center rounded-3xl border-4 border-grass bg-cream px-6 py-4 shadow-pop">
            {cache && etat === 'lire' ? (
              <span className="flex items-center gap-2 text-lg font-bold text-ink-soft">
                <Eye aria-hidden /> Carte cachée : lis-la de mémoire !
              </span>
            ) : (
              <motion.span
                key={q.item.id}
                initial={reduite ? { opacity: 0 } : { opacity: 0, rotateX: 90 }}
                animate={{ opacity: 1, rotateX: 0 }}
                className="text-center font-texte text-[clamp(2rem,10vw,3.75rem)] font-bold tracking-wide [overflow-wrap:anywhere]"
              >
                {q.motALire}
              </motion.span>
            )}
          </div>
        )}

        {/* Lire au micro, ou repli */}
        {peutLire && (
          <div className="flex flex-col items-center gap-2">
            {micDispo ? (
              <>
                <motion.button
                  type="button"
                  onClick={() => void ecouterEnfant()}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-grape text-white shadow-pop focus-visible:outline focus-visible:outline-4 focus-visible:outline-sun"
                  whileTap={reduite ? undefined : { scale: 0.92 }}
                  aria-label="Lire au perroquet (micro)"
                >
                  <Mic size={44} aria-hidden />
                </motion.button>
                <p className="text-sm font-bold text-ink-soft">Touche le micro (ou M) et lis à voix haute</p>
                <Button variant="blanc" onClick={() => void jeLaiDit()} className="text-base">
                  Sans micro : je l’ai dit !
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="grape"
                  size="lg"
                  icon={<Check aria-hidden />}
                  onClick={() => void jeLaiDit()}
                >
                  Je l’ai dit !
                </Button>
                <p className="max-w-sm text-center text-sm font-bold text-ink-soft">
                  {microAutorise
                    ? 'Lis bien fort, puis touche « Je l’ai dit ! » : le perroquet te dira le modèle.'
                    : 'Lis à voix haute, puis touche « Je l’ai dit ! » : le perroquet te dira le modèle.'}
                </p>
              </>
            )}
            {modeleDispo && (
              <Button
                variant="sun"
                icon={<Volume2 aria-hidden />}
                onClick={() => void speech.speak(q.item.spoken ?? q.reponse)}
              >
                Écouter le modèle
              </Button>
            )}
          </div>
        )}
        {etat === 'ecoute' && (
          <p className="flex items-center gap-2 font-bold text-grape-dark" role="status">
            <motion.span
              className="inline-block h-3 w-3 rounded-full bg-coral"
              animate={reduite ? {} : { scale: [1, 1.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              aria-hidden
            />
            Le perroquet t’écoute…
          </p>
        )}
        {info && (
          <p className="text-center font-bold text-coral-dark" role="status">
            {info}
          </p>
        )}
        {etat === 'pasCompris' && (
          <p className="text-center font-bold" role="status">
            Presque&nbsp;! {entendu ? <>J’ai entendu « {entendu} ». </> : null}On réessaie ? (
            {maxEssais - essais} essai
            {maxEssais - essais > 1 ? 's' : ''})
          </p>
        )}

        {/* Auto-évaluation */}
        {etat === 'autoEval' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full flex-col items-center gap-3 rounded-2xl bg-sky/10 p-4 text-center"
            role="status"
          >
            <p className="font-titre text-xl font-extrabold">
              Le perroquet dit : « {q.reponse} ». As-tu lu pareil&nbsp;?
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="grass" icon={<Check aria-hidden />} onClick={() => autoEvaluer(true)}>
                J’ai bien lu
              </Button>
              <Button variant="blanc" icon={<RotateCcw aria-hidden />} onClick={() => autoEvaluer(false)}>
                {essais + 1 >= maxEssais ? 'Pas tout à fait' : 'Je réessaie'}
              </Button>
              <Button
                variant="sun"
                icon={<Volume2 aria-hidden />}
                onClick={() => void speech.speak(q.item.spoken ?? q.reponse)}
              >
                Réécouter
              </Button>
            </div>
          </motion.div>
        )}

        {etat === 'juste' && (
          <p className="font-titre text-2xl font-extrabold text-grass-dark" role="status">
            {message} Une plume de plus&nbsp;! 🪶
          </p>
        )}
        <Correction
          ouvert={etat === 'faux'}
          titre="Presque ! Écoute bien le perroquet."
          bonne={q.reponse}
          aDire={`On lit : ${q.reponse}. ${q.item.explication}`}
          explication={q.item.explication}
          onContinuer={suivant}
        />
      </section>
    </div>
  );
}
