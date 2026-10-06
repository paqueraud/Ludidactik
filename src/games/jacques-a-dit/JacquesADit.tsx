/**
 * Jacques a dit / Simon says (CATALOGUE n° 55) — anglais.
 * Simon dit un mot ou une consigne en anglais (voix en-GB) : on touche la bonne image. Mais attention :
 * si Simon n'a pas dit « Simon says », on ne bouge pas ! Les QCM d'anglais et les réponses orales
 * (répéter / dire en anglais, avec le micro si le parent l'a autorisé) s'intercalent.
 * Facile : le mot est écrit, 3 images, pas de piège, on écoute le modèle avant de parler.
 * Normal : on écoute (le mot écrit est caché, bouton « Voir le mot »), toutes les images, quelques pièges.
 * Plus loin : plus de pièges, 6 secondes par appel (sans bouger quand c'est un piège !).
 * Repli sans micro : on dit le mot à voix haute, puis on s'auto-évalue après avoir écouté le modèle.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Eye, Mic, Hand } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ludo } from '@/components/Ludo';
import { Button, SpeakButton } from '@/components/ui';
import type { Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { useSettings } from '@/stores/settings';
import { parNiveau, useGameSession } from '../_kit/session';
import { ChoiceGrid, Feedback, Hud } from '../_kit/ui';
import { useChronometre, useRng } from '../_monde-commun/hooks';
import { estEmoji, insecable, oralCorrespond } from '../_monde-commun/outils';
import { BarreTemps, Bulle, EtatVide } from '../_monde-commun/ui';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { type Appel, appelsDe, estAnglais, phraseSimon } from './appels';

const APPELS: Record<Level, number> = { facile: 10, normal: 14, plus_loin: 18 };
const CHRONO_S: Record<Level, number> = { facile: Infinity, normal: Infinity, plus_loin: 6 };
const BONUS: Record<Level, number> = { facile: 1, normal: 1, plus_loin: 1.5 };
const EN = 'en-GB';

type Fin = { ok: boolean; points: number };

interface PropsAppel {
  level: Level;
  paused: boolean;
  fini: boolean;
  session: ReturnType<typeof useGameSession>;
  sfx: GameProps['sfx'];
  speech: GameProps['speech'];
  lectureAuto: boolean;
  onHumeur: (h: 'salut' | 'joie' | 'pense') => void;
  onFini: (f: Fin) => void;
}

export default function JacquesADit({
  level,
  stream,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
  lectureAuto,
}: GameProps) {
  const total = parNiveau(level, APPELS);
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const rng = useRng();

  const appels = useMemo(() => {
    const out: Appel[] = [];
    let precedent: string | null = null;
    for (let essai = 0; essai < 40 && out.length < total; essai++) {
      let it = stream.next();
      for (let k = 0; k < 30 && (!estAnglais(it) || (it.id === precedent && (stream.size ?? 2) > 1)); k++) {
        it = stream.next();
      }
      if (!estAnglais(it)) break;
      precedent = it.id;
      out.push(...appelsDe(it, level, rng));
    }
    return out.slice(0, total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [justes, setJustes] = useState(0);
  const [humeur, setHumeur] = useState<'salut' | 'joie' | 'pense'>('salut');
  const [fini, setFini] = useState(false);
  const n = appels.length;

  const finAppel = useCallback(
    (f: Fin) => {
      if (fini) return;
      const p = points + f.points;
      const j = justes + (f.ok ? 1 : 0);
      setPoints(p);
      setJustes(j);
      if (index + 1 >= n) {
        setFini(true);
        sfx.play('fanfare');
        session.end({
          won: j >= Math.ceil(n / 2),
          headline: j === n ? 'Simon est épaté : sans faute !' : `${j} bonne${j > 1 ? 's' : ''} réponse${j > 1 ? 's' : ''} sur ${n} !`,
          score: p,
          delayMs: 600,
        });
        return;
      }
      setIndex((i) => i + 1);
      setHumeur('salut');
    },
    [fini, points, justes, index, n, sfx, session],
  );

  if (!n) {
    return <EtatVide icone="🧢" jeu="Jacques a dit" besoin="de mots anglais avec des images, ou de questions d’anglais" />;
  }

  const a = appels[index]!;
  const commun: PropsAppel = { level, paused, fini, session, sfx, speech, lectureAuto, onHumeur: setHumeur, onFini: finAppel };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <Hud>
          Appel {index + 1} / {n}
        </Hud>
        <Hud>
          <span aria-hidden>⭐</span> {points} pts
        </Hud>
      </div>
      <div className="flex items-end gap-3">
        <div className="shrink-0" aria-hidden>
          <Ludo size={84} pose={humeur === 'joie' ? 'joie' : humeur === 'pense' ? 'pense' : 'salut'} />
        </div>
        <p className="mb-2 font-titre text-lg font-bold text-anglais sm:text-xl">
          {a.type === 'image' ? 'Simon says… (en anglais)' : a.type === 'oral' ? 'Your turn! À toi de parler.' : 'Listen! Écoute bien.'}
        </p>
      </div>
      {a.type === 'image' && <AppelImage key={index} appel={a} {...commun} />}
      {a.type === 'qcm' && <AppelQcm key={index} appel={a} {...commun} />}
      {a.type === 'oral' && <AppelOral key={index} appel={a} {...commun} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toucher l'image                                                     */
/* ------------------------------------------------------------------ */

function AppelImage({
  appel,
  level,
  paused,
  fini,
  session,
  sfx,
  speech,
  onHumeur,
  onFini,
}: PropsAppel & { appel: Extract<Appel, { type: 'image' }> }) {
  const reduce = !!useReducedMotion();
  const phrase = phraseSimon(appel);
  const [etat, setEtat] = useState<null | 'juste' | 'faux' | 'piege-ok' | 'piege-raté' | 'trop-tard'>(null);
  const [choisi, setChoisi] = useState<string | null>(null);
  const [voir, setVoir] = useState(level === 'facile');
  const actif = !etat && !paused && !fini;
  const pieges = level !== 'facile';

  useEffect(() => {
    session.startQuestion();
    const t = setTimeout(() => void speech.speak(phrase, { lang: EN }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conclure = useCallback(
    (e: NonNullable<typeof etat>) => {
      setEtat(e);
      const ok = e === 'juste' || e === 'piege-ok';
      onHumeur(ok ? 'joie' : 'pense');
      if (ok) sfx.play('juste');
      else {
        sfx.play(e === 'piege-raté' ? 'pop' : 'faux');
        vibrate(30);
      }
    },
    [onHumeur, sfx],
  );

  const toucher = useCallback(
    (emoji: string) => {
      if (!actif) return;
      setChoisi(emoji);
      if (!appel.simon) {
        conclure('piege-raté');
        return;
      }
      const ok = emoji === appel.cible;
      session.answer(appel.item, ok, emoji, `${appel.mot} = ${appel.cible}`);
      conclure(ok ? 'juste' : 'faux');
    },
    [actif, appel, session, conclure],
  );

  const immobile = useCallback(() => {
    if (!actif) return;
    if (!appel.simon) {
      conclure('piege-ok');
      return;
    }
    session.answer(appel.item, false, 'je ne bouge pas', `${appel.mot} = ${appel.cible}`);
    conclure('faux');
  }, [actif, appel, session, conclure]);

  const chrono = useChronometre({
    dureeS: CHRONO_S[level],
    actif: !etat && !fini,
    paused,
    onFin: () => {
      if (!appel.simon) conclure('piege-ok');
      else {
        session.answer(appel.item, false, 'temps écoulé', `${appel.mot} = ${appel.cible}`);
        conclure('trop-tard');
      }
    },
  });

  const ok = etat === 'juste' || etat === 'piege-ok';
  const gain = Math.round((voir && level !== 'facile' ? 5 : 10) * BONUS[level]);
  const suivant = useCallback(() => onFini({ ok, points: ok ? gain : 0 }), [onFini, ok, gain]);

  // Bonne réponse : on enchaîne vite
  useEffect(() => {
    if (!ok || paused) return;
    const t = setTimeout(suivant, 1100);
    return () => clearTimeout(t);
  }, [ok, paused, suivant]);

  // Clavier : 1-6 = images, 0 ou N = « je ne bouge pas » (Entrée = continuer, géré par Feedback)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || !actif) return;
      if (/^[1-6]$/.test(e.key)) {
        const em = appel.options[Number(e.key) - 1];
        if (em) {
          e.preventDefault();
          toucher(em);
        }
      } else if (pieges && (e.key === '0' || e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        immobile();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif, appel.options, pieges, toucher, immobile]);

  const masque = appel.mot.replace(/[A-Za-z]/g, '•');

  return (
    <section className="carte flex w-full flex-col items-center gap-4 p-4 sm:p-6">
      <Bulle className="w-full border-2 border-anglais/30">
        <div className="flex flex-wrap items-center gap-3">
          <SpeakButton text={phrase} lang={EN} label="Réécouter Simon" />
          <p className="min-w-0 flex-1 font-titre text-2xl font-extrabold sm:text-3xl" lang="en" aria-live="polite">
            {appel.simon ? 'Simon says: ' : ''}
            {voir || etat ? appel.mot : <span aria-label="mot caché">{masque}</span>}!
          </p>
          {!voir && !etat && (
            <Button
              variant="blanc"
              className="w-full sm:w-auto"
              icon={<Eye aria-hidden />}
              onClick={() => setVoir(true)}
              disabled={!actif}
            >
              Voir le mot
            </Button>
          )}
        </div>
      </Bulle>
      {Number.isFinite(CHRONO_S[level]) && !etat && <BarreTemps fraction={chrono.fraction} label="Temps pour réagir" />}

      <div
        className={`mx-auto grid w-full gap-3 ${
          appel.options.length <= 3
            ? 'max-w-lg grid-cols-3'
            : appel.options.length === 4
              ? 'max-w-2xl grid-cols-2 sm:grid-cols-4'
              : 'grid-cols-3 sm:grid-cols-6'
        }`}
      >
        {appel.options.map((em, i) => {
          const bon = em === appel.cible;
          const style = !etat
            ? ''
            : bon && appel.simon
              ? 'ring-4 ring-grass bg-grass/20'
              : em === choisi
                ? 'ring-4 ring-coral bg-coral/15'
                : 'opacity-50';
          return (
            <motion.button
              key={em}
              type="button"
              onClick={() => toucher(em)}
              disabled={!actif}
              aria-label={`Image ${i + 1}`}
              whileTap={reduce ? undefined : { scale: 0.9 }}
              className={`btn-3d relative flex aspect-square min-h-[4.5rem] items-center justify-center bg-card text-5xl sm:text-6xl ${style}`}
            >
              <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink font-titre text-xs text-white" aria-hidden>
                {i + 1}
              </span>
              <span aria-hidden>{em}</span>
            </motion.button>
          );
        })}
      </div>
      {pieges && !etat && (
        <Button variant="sun" size="lg" icon={<Hand aria-hidden />} onClick={immobile} disabled={!actif}>
          Je ne bouge pas !
        </Button>
      )}

      <AnimatePresence>
        {etat === 'juste' && <Feedback state="juste" message={`Yes! Bravo : ${appel.mot} = ${appel.cible}`} />}
        {etat === 'piege-ok' && (
          <Feedback state="juste" message="Bien vu ! Simon n’avait pas dit « Simon says » 😉" />
        )}
      </AnimatePresence>
      {(etat === 'faux' || etat === 'trop-tard') && (
        <Feedback
          state="faux"
          message={etat === 'trop-tard' ? 'Trop tard ! On réessaiera.' : 'Presque !'}
          expected={`${appel.mot} = ${appel.cible}`}
          explication={appel.item.explication}
          onContinue={suivant}
        />
      )}
      {etat === 'piege-raté' && (
        <Feedback
          state="faux"
          message="Oups ! C’était un piège : Simon n’avait pas dit « Simon says », il ne fallait pas bouger."
          expected={`${appel.mot} = ${appel.cible}`}
          explication="Écoute bien le début : on obéit seulement quand on entend « Simon says »."
          onContinue={suivant}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* QCM d'anglais                                                       */
/* ------------------------------------------------------------------ */

function AppelQcm({
  appel,
  paused,
  fini,
  session,
  sfx,
  speech,
  onHumeur,
  onFini,
}: PropsAppel & { appel: Extract<Appel, { type: 'qcm' }> }) {
  const [etat, setEtat] = useState<'juste' | 'faux' | null>(null);
  const [choisi, setChoisi] = useState<number | null>(null);
  const images = appel.choices.every(estEmoji);
  const audio = appel.item.spoken;

  useEffect(() => {
    session.startQuestion();
    const t = setTimeout(() => {
      if (audio) void speech.speak(audio, { lang: EN });
      else void speech.speak(appel.item.question);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choisir = useCallback(
    (i: number) => {
      if (etat || paused || fini) return;
      const ok = i === appel.answerIndex;
      session.answer(appel.item, ok, appel.choices[i]!, appel.choices[appel.answerIndex]!);
      setChoisi(i);
      setEtat(ok ? 'juste' : 'faux');
      onHumeur(ok ? 'joie' : 'pense');
      sfx.play(ok ? 'juste' : 'faux');
    },
    [etat, paused, fini, appel, session, onHumeur, sfx],
  );
  const suivant = useCallback(() => onFini({ ok: etat === 'juste', points: etat === 'juste' ? 10 : 0 }), [onFini, etat]);

  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, 1200);
    return () => clearTimeout(t);
  }, [etat, paused, suivant]);

  return (
    <section className="carte flex w-full flex-col items-center gap-4 p-4 sm:p-6">
      <div className="flex w-full items-start justify-center gap-3">
        {audio ? (
          <SpeakButton text={audio} lang={EN} label="Écouter le mot anglais" />
        ) : (
          <SpeakButton text={appel.item.question} label="Écouter la question" />
        )}
        <div className="flex flex-col items-center gap-1">
          {appel.item.image && (
            <span className="text-6xl" aria-hidden>
              {appel.item.image}
            </span>
          )}
          <h2 className="text-center font-titre text-2xl font-extrabold leading-snug sm:text-3xl">
            {insecable(appel.item.question)}
          </h2>
        </div>
      </div>
      {images ? (
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {appel.choices.map((c, i) => {
            const style = !etat
              ? ''
              : i === appel.answerIndex
                ? 'ring-4 ring-grass bg-grass/20'
                : i === choisi
                  ? 'ring-4 ring-coral bg-coral/15'
                  : 'opacity-50';
            return (
              <button
                key={c}
                type="button"
                onClick={() => choisir(i)}
                disabled={!!etat || paused || fini}
                aria-label={`Image ${String.fromCharCode(65 + i)}`}
                className={`btn-3d flex aspect-square min-h-[4.5rem] items-center justify-center bg-card text-5xl sm:text-6xl ${style}`}
              >
                <span aria-hidden>{c}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <SpeakButton text={appel.choices.join(', ')} lang={EN} label="Écouter les mots en anglais" size={40} />
          <div className="w-full" lang="en">
            <ChoiceGrid
              choices={appel.choices}
              onPick={choisir}
              reveal={etat ? { correct: appel.answerIndex, chosen: choisi } : null}
              disabled={paused || fini}
            />
          </div>
        </>
      )}
      {images && <KeysChoix n={appel.choices.length} actif={!etat && !paused && !fini} onPick={choisir} />}
      {etat === 'juste' && <Feedback state="juste" message="Yes! Bravo !" />}
      {etat === 'faux' && (
        <Feedback
          state="faux"
          expected={appel.choices[appel.answerIndex]}
          explication={appel.item.explication}
          onContinue={suivant}
        />
      )}
    </section>
  );
}

/** Raccourcis A-F / 1-6 pour une grille d'images. */
function KeysChoix({ n, actif, onPick }: { n: number; actif: boolean; onPick: (i: number) => void }) {
  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      const i = 'abcdef'.indexOf(e.key.toLowerCase());
      const j = Number(e.key) - 1;
      const k = i >= 0 ? i : Number.isInteger(j) && j >= 0 ? j : -1;
      if (k >= 0 && k < n) {
        e.preventDefault();
        onPick(k);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [n, actif, onPick]);
  return null;
}

/* ------------------------------------------------------------------ */
/* Parler                                                              */
/* ------------------------------------------------------------------ */

function AppelOral({
  appel,
  level,
  paused,
  fini,
  session,
  sfx,
  speech,
  onHumeur,
  onFini,
}: PropsAppel & { appel: Extract<Appel, { type: 'oral' }> }) {
  const microAutorise = useSettings((s) => s.micro);
  const [micro, setMicro] = useState(microAutorise && speech.sttAvailable);
  const [ecoute, setEcoute] = useState(false);
  const [entendu, setEntendu] = useState<string | null>(null);
  const [essais, setEssais] = useState(2);
  const [modele, setModele] = useState(level === 'facile');
  const [dit, setDit] = useState(false);
  const [etat, setEtat] = useState<'juste' | 'faux' | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const vivant = useRef(true);
  useEffect(
    () => () => {
      vivant.current = false;
    },
    [],
  );

  const reponse = appel.item.answer;
  const actif = !etat && !paused && !fini;

  useEffect(() => {
    session.startQuestion();
    const t = setTimeout(async () => {
      await speech.speak(appel.item.spoken ?? appel.item.prompt);
      // Facile : « Repeat after me » — on entend le modèle avant de parler
      if (level === 'facile' && vivant.current) await speech.speak(reponse, { lang: EN, queue: true });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conclure = useCallback(
    (ok: boolean, donne: string) => {
      session.answer(appel.item, ok, donne, reponse);
      setEtat(ok ? 'juste' : 'faux');
      onHumeur(ok ? 'joie' : 'pense');
      sfx.play(ok ? 'juste' : 'faux');
      if (!ok) void speech.speak(reponse, { lang: EN });
    },
    [appel.item, reponse, session, onHumeur, sfx, speech],
  );

  const parler = useCallback(async () => {
    if (!actif || ecoute) return;
    setEcoute(true);
    setInfo(null);
    const res = await speech.listen({ lang: EN, timeoutMs: 6000 });
    if (!vivant.current) return;
    setEcoute(false);
    if (res === null) {
      setMicro(false);
      setInfo('Le micro n’est pas disponible : dis-le à voix haute, puis touche « Je l’ai dit ! ».');
      return;
    }
    if (!res.length) {
      setInfo('Je n’ai rien entendu… On réessaie ?');
      return;
    }
    setEntendu(res[0]!);
    if (oralCorrespond(res, appel.item.accepted)) {
      conclure(true, res[0]!);
      return;
    }
    if (essais > 1) {
      setEssais((e) => e - 1);
      setInfo(`Presque ! J’ai entendu « ${res[0]} ». Écoute le modèle et réessaie.`);
      setModele(true);
      void speech.speak(reponse, { lang: EN });
      return;
    }
    conclure(false, res[0]!);
  }, [actif, ecoute, speech, appel.item.accepted, essais, conclure, reponse]);

  const suivant = useCallback(() => onFini({ ok: etat === 'juste', points: etat === 'juste' ? 15 : 0 }), [onFini, etat]);

  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, 1500);
    return () => clearTimeout(t);
  }, [etat, paused, suivant]);

  // Clavier : M = micro
  useEffect(() => {
    if (!micro || !actif) return;
    const h = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        void parler();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [micro, actif, parler]);

  return (
    <section className="carte flex w-full flex-col items-center gap-4 p-4 sm:p-6">
      <div className="flex w-full items-start justify-center gap-3">
        <SpeakButton text={appel.item.spoken ?? appel.item.prompt} label="Écouter la consigne" />
        <h2 className="text-center font-titre text-2xl font-extrabold leading-snug sm:text-3xl">{insecable(appel.item.prompt)}</h2>
      </div>

      {(modele || etat) && (
        <div className="flex items-center gap-2 rounded-2xl bg-anglais/10 px-4 py-2">
          <SpeakButton text={reponse} lang={EN} label="Écouter le modèle en anglais" size={40} />
          <span className="font-titre text-2xl font-extrabold" lang="en">
            {reponse}
          </span>
        </div>
      )}
      {!modele && !etat && level === 'normal' && (
        <Button variant="blanc" onClick={() => {
          setModele(true);
          void speech.speak(reponse, { lang: EN });
        }} disabled={!actif}>
          Écouter le modèle
        </Button>
      )}

      {!etat && micro && (
        <div className="flex flex-col items-center gap-2">
          <motion.button
            type="button"
            onClick={() => void parler()}
            disabled={!actif}
            aria-label={ecoute ? 'Je t’écoute…' : 'Parler dans le micro'}
            className={`flex h-24 w-24 items-center justify-center rounded-full text-white shadow-pop ${ecoute ? 'bg-coral' : 'bg-anglais'}`}
            animate={ecoute ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.8, repeat: ecoute ? Infinity : 0 }}
          >
            <Mic size={44} aria-hidden />
          </motion.button>
          <p className="font-bold text-ink-soft">{ecoute ? 'Je t’écoute… Speak!' : 'Touche le micro (ou M) et parle en anglais.'}</p>
        </div>
      )}

      {!etat && !micro && !dit && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-center font-bold text-ink-soft">Dis-le à voix haute, puis touche le bouton.</p>
          <Button
            variant="grape"
            size="lg"
            onClick={() => {
              setDit(true);
              setModele(true);
              void speech.speak(reponse, { lang: EN });
            }}
            disabled={!actif}
          >
            Je l’ai dit !
          </Button>
        </div>
      )}
      {!etat && !micro && dit && (
        <div className="flex w-full flex-col items-center gap-2">
          <p className="text-center font-bold">Écoute le modèle : as-tu dit pareil ?</p>
          <div className="grid w-full grid-cols-2 gap-3">
            <Button variant="grass" onClick={() => conclure(true, 'auto-évaluation : oui')} disabled={!actif}>
              Oui, pareil 👍
            </Button>
            <Button variant="blanc" onClick={() => conclure(false, 'auto-évaluation : pas encore')} disabled={!actif}>
              Pas encore 🔁
            </Button>
          </div>
        </div>
      )}

      {info && !etat && (
        <p className="rounded-2xl bg-sun/25 px-4 py-2 text-center font-bold" role="status">
          {info}
        </p>
      )}
      {entendu && etat && <p className="text-ink-soft">J’ai entendu : « {entendu} »</p>}
      {etat === 'juste' && <Feedback state="juste" message="Well done! Bravo !" />}
      {etat === 'faux' && (
        <Feedback
          state="faux"
          message="Presque ! Répète avec le modèle :"
          expected={reponse}
          explication={appel.item.explication}
          onContinue={suivant}
        />
      )}
    </section>
  );
}
