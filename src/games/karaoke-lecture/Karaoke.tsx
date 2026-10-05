/**
 * Le Karaoké de lecture (CATALOGUE n° 44) — fluence (BO : CE1 70 mots/min, CM2 120 en fin d'année).
 * Avec le micro (seulement si le parent l'a autorisé, et si le navigateur sait reconnaître la voix) :
 * la reconnaissance vocale suit la lecture, les mots lus s'allument et on mesure les mots correctement
 * lus par minute (MCLM). Sans micro (repli) : mode « métronome » — les mots s'allument au rythme visé,
 * l'enfant lit avec, puis s'auto-évalue (où il s'est arrêté, quels mots l'ont gêné) → MCLM approximatif.
 * Courbe de progrès (scores gardés sur l'appareil) et meilleur score.
 * Rythme visé : Facile 60 % de l'objectif du texte, Normal 100 %, Plus loin 120 %. Facile : on peut écouter
 * le modèle avant de lire et la phrase en cours est mise en valeur.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Flag, Mic, Music, RotateCcw, SkipForward, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, SpeakButton, Stars } from '@/components/ui';
import type { Item, Level, ReadAloudItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { useSettings } from '@/stores/settings';
import { useGameSession } from '../_kit/session';
import { Hud } from '../_kit/ui';
import { ecouterEnContinu, recoDisponible } from '../_langue-commun/ecoute';
import {
  alignerLecture,
  calculerMCLM,
  etoilesFluence,
  horaireMetronome,
  mclmMetronome,
  motAuTemps,
  rythmeCible,
} from '../_langue-commun/lecture';
import { decouperMots } from '../_langue-commun/texte';
import { collecterItems } from '../_langue-commun/tirage';
import { PasDExercice } from '../_langue-commun/ui';
import { useBoucle } from '../_nombres-commun/outils';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { Courbe, ajouterProgres, lireProgres } from './progres';

type Phase = 'accueil' | 'decompte' | 'lecture' | 'auto' | 'resultat';
type Mode = 'micro' | 'metronome';
type EtapeAuto = 'suivi' | 'dernier' | 'erreurs';

const LECTURES_MAX = 3;
const estTexte = (it: Item): it is ReadAloudItem => it.kind === 'read_aloud';
const LIBELLE_NIVEAU: Record<Level, string> = {
  facile: 'objectif du jour',
  normal: 'attendu de fin d’année',
  plus_loin: 'défi : plus vite que l’attendu',
};

export default function Karaoke({ level, profile, stream, paused, onAnswer, onEnd, speech, sfx }: GameProps) {
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduite = !!useReducedMotion();
  const microAutorise = useSettings((s) => s.micro);
  const microDispo = microAutorise && recoDisponible();

  const textes = useMemo(() => collecterItems(stream, estTexte, 4), [stream]);
  const [iTexte, setITexte] = useState(0);
  const item = textes[iTexte] ?? null;
  const mots = useMemo(() => (item ? decouperMots(item.text) : []), [item]);
  const objectif = item ? rythmeCible(item.targetMCLM, level) : 0;
  const horaire = useMemo(() => horaireMetronome(mots, Math.max(objectif, 1)), [mots, objectif]);

  const [phase, setPhase] = useState<Phase>('accueil');
  const [mode, setMode] = useState<Mode>(microDispo ? 'micro' : 'metronome');
  const [compte, setCompte] = useState(3);
  const [ecoule, setEcoule] = useState(0);
  const [transcrit, setTranscrit] = useState('');
  const [info, setInfo] = useState('');
  const [etapeAuto, setEtapeAuto] = useState<EtapeAuto>('suivi');
  const [atteints, setAtteints] = useState(0);
  const [erreurs, setErreurs] = useState<Set<number>>(new Set());
  const [finLecture, setFinLecture] = useState(0);
  const [resultat, setResultat] = useState<{ mclm: number; corrects: number; duree: number } | null>(null);
  const [lectures, setLectures] = useState(0);
  const [meilleur, setMeilleur] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const prefixe = useRef('');
  const transcritRef = useRef('');
  transcritRef.current = transcrit;
  const motsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (item) setScores(lireProgres(profile.id, item.id));
  }, [item, profile.id]);

  const alignement = useMemo(
    () => (mode === 'micro' ? alignerLecture(mots, transcrit) : null),
    [mode, mots, transcrit],
  );
  const courantMetronome = motAuTemps(horaire.debuts, horaire.dureeTotale, ecoule);
  const courant = mode === 'micro' ? (alignement?.position ?? 0) : courantMetronome;

  /* --------------------------- déroulement --------------------------- */

  const commencer = useCallback(
    (m: Mode) => {
      speech.stop();
      setMode(m);
      setInfo('');
      setTranscrit('');
      prefixe.current = '';
      setEcoule(0);
      setCompte(3);
      setErreurs(new Set());
      setEtapeAuto('suivi');
      setPhase('decompte');
    },
    [speech],
  );

  // 3, 2, 1… (figé pendant la pause)
  useEffect(() => {
    if (phase !== 'decompte' || paused) return;
    const t = setTimeout(() => {
      if (compte > 1) {
        sfx.play('tic');
        setCompte((c) => c - 1);
      } else {
        sfx.play('monte');
        session.startQuestion();
        setPhase('lecture');
      }
    }, 800);
    return () => clearTimeout(t);
  }, [phase, compte, paused, sfx, session]);

  // Le temps de lecture (pauses exclues)
  useBoucle(phase === 'lecture' && !paused, (dt) => setEcoule((e) => e + dt * 1000));

  const terminerLecture = useCallback(() => {
    if (phase !== 'lecture') return;
    if (mode === 'micro') {
      const a = alignerLecture(mots, transcritRef.current);
      const mclm = calculerMCLM(a.corrects, ecoule);
      setResultat({ mclm, corrects: a.corrects, duree: ecoule });
      setPhase('resultat');
    } else {
      // Métronome : auto-évaluation
      const atteint = Math.min(mots.length, Math.max(0, courantMetronome));
      setAtteints(atteint);
      setFinLecture(ecoule);
      setEtapeAuto('suivi');
      setPhase('auto');
    }
  }, [phase, mode, mots, ecoule, courantMetronome]);

  // Fin naturelle : le métronome a tout allumé, ou le micro a entendu le dernier mot
  const toutLu = phase === 'lecture' && courant >= mots.length;
  const terminerRef = useRef(terminerLecture);
  terminerRef.current = terminerLecture;
  useEffect(() => {
    if (!toutLu) return;
    const t = setTimeout(() => terminerRef.current(), mode === 'micro' ? 500 : 300);
    return () => clearTimeout(t);
  }, [toutLu, mode]);
  // sécurité : on ne lit pas indéfiniment (micro qui n'entend plus rien)
  const tropLong = phase === 'lecture' && mode === 'micro' && ecoule > Math.max(120_000, horaire.dureeTotale * 3);
  useEffect(() => {
    if (tropLong) terminerRef.current();
  }, [tropLong]);

  // Écoute continue (micro) — coupée pendant la pause, reprise ensuite
  useEffect(() => {
    if (phase !== 'lecture' || mode !== 'micro' || paused) return;
    const e = ecouterEnContinu({
      lang: 'fr-FR',
      onTexte: (t) => setTranscrit(`${prefixe.current} ${t}`.trim()),
      onErreur: () => {
        setInfo('Le micro ne répond pas : on lit avec le métronome !');
        commencer('metronome');
      },
    });
    if (!e) {
      setInfo('La reconnaissance de la voix n’est pas disponible : on lit avec le métronome !');
      commencer('metronome');
      return;
    }
    return () => {
      e.arreter();
      prefixe.current = transcritRef.current;
    };
  }, [phase, mode, paused, commencer]);

  // Le mot en cours reste visible (textes longs)
  useEffect(() => {
    if (phase !== 'lecture') return;
    motsRef.current[courant]?.scrollIntoView?.({ block: 'nearest', behavior: reduite ? 'auto' : 'smooth' });
  }, [courant, phase, reduite]);

  const validerAuto = useCallback(() => {
    // Tout lu : la durée du métronome (ou moins si l'enfant a fini avant) ; sinon l'instant où le mot suivant s'allumait
    const duree =
      atteints >= mots.length
        ? Math.min(finLecture, horaire.dureeTotale)
        : Math.min(finLecture, horaire.debuts[atteints] ?? finLecture);
    const nbErreurs = [...erreurs].filter((i) => i < atteints).length;
    const mclm = mclmMetronome(atteints, nbErreurs, duree);
    setResultat({ mclm, corrects: Math.max(0, atteints - nbErreurs), duree });
    setPhase('resultat');
  }, [atteints, mots.length, finLecture, horaire.debuts, erreurs]);

  // Résultat : on l'enregistre une fois
  const enregistre = useRef<unknown>(null);
  useEffect(() => {
    if (phase !== 'resultat' || !resultat || !item || enregistre.current === resultat) return;
    enregistre.current = resultat;
    const atteint = resultat.mclm >= objectif;
    session.answer(item, atteint, `${resultat.mclm} mots/min`, `${objectif} mots/min`);
    setScores(ajouterProgres(profile.id, item.id, resultat.mclm));
    setMeilleur((m) => Math.max(m, resultat.mclm));
    setLectures((l) => l + 1);
    sfx.play(atteint ? 'fanfare' : 'etoile');
  }, [phase, resultat, item, objectif, session, profile.id, sfx]);

  const finir = useCallback(() => {
    const best = Math.max(meilleur, resultat?.mclm ?? 0);
    session.end({
      won: best >= objectif,
      headline: best ? `${best} mots lus par minute ! 🎤` : 'Bravo pour ta lecture !',
      score: best,
      correct: best >= objectif ? 1 : 0,
      total: 1,
      delayMs: 300,
    });
  }, [meilleur, resultat, objectif, session]);

  if (!item || !mots.length) {
    return (
      <PasDExercice
        texte="Cette leçon n’a pas de texte à lire à voix haute."
        onFin={() => session.end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  /* ------------------------------ affichage ------------------------------ */

  const phraseCourante = mots[Math.min(courant, mots.length - 1)]?.phrase ?? 0;
  const enLecture = phase === 'lecture';
  const choixMots = phase === 'auto' && etapeAuto !== 'suivi';

  const styleMot = (i: number): string => {
    if (phase === 'auto') {
      if (etapeAuto === 'erreurs') {
        if (i >= atteints) return 'text-ink/30';
        return erreurs.has(i) ? 'bg-coral/30 line-through decoration-coral decoration-2' : 'hover:bg-sky/20';
      }
      if (etapeAuto === 'dernier') return i < atteints ? 'bg-grass/15 hover:bg-sky/20' : 'hover:bg-sky/20';
      return '';
    }
    if (!enLecture) return '';
    const focus = level === 'facile' && mots[i]!.phrase !== phraseCourante ? 'opacity-40' : '';
    if (mode === 'micro' && alignement) {
      const e = alignement.etats[i];
      if (e === 'lu') return `text-grass-dark ${focus}`;
      if (e === 'saute') return `text-coral-dark underline decoration-dotted decoration-coral ${focus}`;
      if (i === courant) return 'bg-sun/70';
      return focus;
    }
    if (i < courant) return `text-ink/55 ${focus}`;
    if (i === courant) return 'bg-sun';
    return focus;
  };

  const texteAffiche = (
    <p className="relative font-texte text-2xl leading-[2.4] sm:text-3xl sm:leading-[2.3]" aria-label={item.text}>
      {mots.map((m, i) => {
        const contenu = (
          <>
            {i === courant && enLecture && !reduite && (
              <motion.span
                layoutId="balle-karaoke"
                className="absolute -top-2.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-coral shadow-pop-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                aria-hidden
              />
            )}
            {m.affiche}
          </>
        );
        return (
          <span key={i}>
            {choixMots ? (
              <button
                type="button"
                ref={(el) => {
                  motsRef.current[i] = el;
                }}
                className={`relative rounded-lg px-1 transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-sky ${styleMot(i)}`}
                onClick={() => {
                  sfx.play('pop');
                  if (etapeAuto === 'dernier') setAtteints(i + 1);
                  else if (i < atteints)
                    setErreurs((s) => {
                      const n = new Set(s);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    });
                }}
                aria-pressed={etapeAuto === 'erreurs' ? erreurs.has(i) : undefined}
              >
                {m.affiche}
              </button>
            ) : (
              <span
                ref={(el) => {
                  motsRef.current[i] = el;
                }}
                className={`relative rounded-lg px-1 transition-colors duration-150 ${styleMot(i)}`}
                aria-hidden
              >
                {contenu}
              </span>
            )}{' '}
          </span>
        );
      })}
    </p>
  );

  const etoiles = resultat ? etoilesFluence(resultat.mclm, objectif) : 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <Hud>
          🎤 {mode === 'micro' ? 'Micro' : 'Métronome'}
        </Hud>
        <Hud>
          🎯 {objectif} mots/min
        </Hud>
      </div>

      <section className="relative w-full overflow-hidden rounded-card border-4 border-white bg-card shadow-soft">
        {/* bandeau de scène */}
        <div
          className="flex items-center gap-3 px-4 py-3 text-white"
          style={{ background: 'linear-gradient(90deg,#8E7CFF 0%,#FF7A6B 100%)' }}
        >
          <SpeakButton text={item.title} label="Écouter le titre" size={40} />
          <h2 className="min-w-0 flex-1 font-titre text-2xl font-extrabold [text-shadow:0_2px_0_rgb(0_0_0/0.15)]">{item.title}</h2>
          {enLecture && (
            <span className="rounded-full bg-white/25 px-3 py-1 font-titre font-bold tabular-nums" aria-label="Temps de lecture">
              ⏱ {Math.floor(ecoule / 1000)} s
            </span>
          )}
        </div>

        <div className="max-h-[52vh] overflow-y-auto px-4 py-4 sm:px-8">
          {phase === 'accueil' || phase === 'decompte' ? (
            <div className="relative">
              <div className={phase === 'decompte' ? 'opacity-30 blur-[2px]' : level === 'plus_loin' ? 'opacity-0' : 'opacity-30 blur-[3px]'} aria-hidden>
                {texteAffiche}
              </div>
              <AnimatePresence>
                {phase === 'decompte' && (
                  <motion.span
                    key={compte}
                    initial={reduite ? { opacity: 0 } : { scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center font-titre text-8xl font-extrabold text-grape"
                    role="status"
                  >
                    {compte}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          ) : (
            texteAffiche
          )}
        </div>
      </section>

      {/* Accueil : choix du mode */}
      {phase === 'accueil' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="carte flex w-full flex-col items-center gap-3 p-4 text-center">
          <p className="text-lg font-bold">
            Objectif : <span className="text-grape-dark">{objectif} mots par minute</span>{' '}
            <span className="text-sm font-normal text-ink-soft">({LIBELLE_NIVEAU[level]})</span>
          </p>
          {info && (
            <p className="font-bold text-coral-dark" role="status">
              {info}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {microDispo && (
              <Button variant="grape" size="lg" icon={<Mic aria-hidden />} onClick={() => commencer('micro')} disabled={paused}>
                Lire avec le micro
              </Button>
            )}
            <Button
              variant={microDispo ? 'blanc' : 'grape'}
              size="lg"
              icon={<Music aria-hidden />}
              onClick={() => commencer('metronome')}
              disabled={paused}
            >
              Lire avec le métronome
            </Button>
            {level === 'facile' && (
              <Button variant="sun" icon={<Volume2 aria-hidden />} onClick={() => void speech.speak(item.text)} disabled={paused}>
                Écouter le modèle
              </Button>
            )}
          </div>
          <p className="text-sm text-ink-soft">
            {microDispo
              ? 'Avec le micro, les mots s’allument quand tu les lis. Lis bien fort !'
              : microAutorise
                ? 'Le micro n’est pas disponible sur cet appareil : lis avec le métronome, les mots s’allument à ton rythme d’objectif.'
                : 'Les mots vont s’allumer au rythme de ton objectif : lis chaque mot quand il s’allume. Un adulte peut t’écouter et t’aider à la fin.'}
          </p>
          {scores.length > 0 && <Courbe scores={scores} objectif={objectif} />}
        </motion.div>
      )}

      {/* Pendant la lecture */}
      {enLecture && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {mode === 'micro' && (
            <span className="flex items-center gap-2 rounded-full bg-coral/15 px-4 py-2 font-bold text-coral-dark" role="status">
              <motion.span
                className="inline-block h-3 w-3 rounded-full bg-coral"
                animate={reduite || paused ? {} : { scale: [1, 1.5, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                aria-hidden
              />
              Je t’écoute… {alignement?.corrects ?? 0} mots lus
            </span>
          )}
          <Button variant="grass" icon={<Flag aria-hidden />} onClick={terminerLecture}>
            J’ai fini
          </Button>
        </div>
      )}

      {/* Auto-évaluation (métronome) */}
      {phase === 'auto' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="carte flex w-full flex-col items-center gap-3 p-4 text-center" role="status">
          {etapeAuto === 'suivi' && (
            <>
              <p className="font-titre text-xl font-extrabold">As-tu réussi à suivre le métronome jusqu’au bout ?</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="grass"
                  onClick={() => {
                    setAtteints(Math.max(atteints, mots.length));
                    setEtapeAuto('erreurs');
                  }}
                >
                  Oui, jusqu’au bout !
                </Button>
                <Button variant="blanc" onClick={() => setEtapeAuto('dernier')}>
                  Non, je me suis arrêté avant
                </Button>
              </div>
            </>
          )}
          {etapeAuto === 'dernier' && (
            <>
              <p className="font-titre text-xl font-extrabold">Touche, dans le texte, le dernier mot que tu as lu.</p>
              <Button variant="grass" onClick={() => setEtapeAuto('erreurs')}>
                C’est ce mot-là : « {mots[Math.max(0, atteints - 1)]?.affiche} »
              </Button>
            </>
          )}
          {etapeAuto === 'erreurs' && (
            <>
              <p className="font-titre text-xl font-extrabold">Touche les mots que tu as mal lus (ou pas du tout).</p>
              <p className="text-sm text-ink-soft">Sois honnête : c’est pour voir tes progrès. Un adulte peut t’aider.</p>
              <Button variant="grass" onClick={validerAuto}>
                {erreurs.size ? `Voilà, ${[...erreurs].filter((i) => i < atteints).length} mot(s) difficile(s)` : 'Aucun mot raté !'}
              </Button>
            </>
          )}
        </motion.div>
      )}

      {/* Résultat */}
      {phase === 'resultat' && resultat && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="carte flex w-full flex-col items-center gap-3 p-4 text-center" role="status">
          <p className="font-titre text-2xl font-extrabold">
            {resultat.mclm >= objectif ? 'Objectif atteint ! 🎉' : etoiles >= 2 ? 'Presque l’objectif, bravo !' : 'Belle lecture ! On progresse à chaque fois.'}
          </p>
          <div className="flex items-end justify-center gap-2">
            <span className="font-titre text-6xl font-extrabold text-grape">{resultat.mclm}</span>
            <span className="pb-2 font-bold">mots lus par minute{mode === 'metronome' ? ' (environ)' : ''}</span>
          </div>
          <Stars value={etoiles} size={30} />
          <p className="text-sm text-ink-soft">
            {resultat.corrects} mots bien lus en {Math.round(resultat.duree / 1000)} secondes · objectif {objectif}
          </p>
          <Courbe scores={scores} objectif={objectif} />
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="sun" icon={<Volume2 aria-hidden />} onClick={() => void speech.speak(item.text)}>
              Écouter le modèle
            </Button>
            {lectures < LECTURES_MAX && (
              <Button variant="blanc" icon={<RotateCcw aria-hidden />} onClick={() => setPhase('accueil')}>
                Relire
              </Button>
            )}
            {lectures < LECTURES_MAX && iTexte + 1 < textes.length && (
              <Button
                variant="blanc"
                icon={<SkipForward aria-hidden />}
                onClick={() => {
                  setITexte((x) => x + 1);
                  setPhase('accueil');
                }}
              >
                Texte suivant
              </Button>
            )}
            <Button variant="grass" onClick={finir}>
              Terminer
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
