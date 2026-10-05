/**
 * L'Appareil photo (CATALOGUE n° 30) — mémoire visuelle : « photographier le mot ».
 * Clic : flash, le mot s'affiche sur un polaroïd quelques secondes puis s'efface ; l'enfant l'écrit.
 * Facile : 5 s, première lettre donnée, 2 « revoir la photo » par mot.
 * Normal : 3 s, 1 « revoir la photo » pour toute la partie.
 * Plus loin : 2 s, pas de seconde photo.
 * Après une erreur : correction lettre à lettre, puis copie active du mot avant de continuer.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Camera, Eye } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LetterKeyboard, usePhysicalKeyboard } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import type { Level, SpellingItem } from '@/content/schemas';
import { checkSpelling } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { useCompteARebours, useVoixEnPause } from '../_orthographe-commun/hooks';
import { BadgeParents, CorrectionMot } from '../_orthographe-commun/ui';

const DUREE_MS: Record<Level, number> = { facile: 5000, normal: 3000, plus_loin: 2000 };
const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
const TOUCHES = /^[\p{L}'’\- .,]$/u;

type Etape = 'pret' | 'photo' | 'ecrire' | 'correction' | 'fini';

interface Cliche {
  mot: string;
  juste: boolean;
}

/** Appareil photo vectoriel (flash animé). */
function Appareil({ flash }: { flash: number }) {
  return (
    <svg viewBox="0 0 220 150" className="h-full w-full" aria-hidden>
      <rect x="20" y="40" width="180" height="100" rx="22" fill="#24304A" />
      <rect x="20" y="40" width="180" height="26" rx="13" fill="#3A4766" />
      <rect x="40" y="26" width="46" height="22" rx="8" fill="#3A4766" />
      <motion.rect
        key={flash}
        x="150"
        y="50"
        width="34"
        height="16"
        rx="5"
        initial={{ fill: '#FFF8EC' }}
        animate={{ fill: ['#FFFFFF', '#FFD45C', '#FFF8EC'] }}
        transition={{ duration: 0.6 }}
      />
      <circle cx="110" cy="92" r="40" fill="#8E7CFF" />
      <circle cx="110" cy="92" r="31" fill="#24304A" />
      <circle cx="110" cy="92" r="22" fill="#4FC3F7" />
      <circle cx="102" cy="84" r="7" fill="#fff" opacity="0.8" />
      <circle cx="118" cy="100" r="3" fill="#fff" opacity="0.6" />
      <rect x="160" y="20" width="26" height="14" rx="6" fill="#FF7A6B" />
    </svg>
  );
}

/** Polaroïd : le mot (photo développée), ou un brouillard quand il a disparu. */
function Polaroid({
  mot,
  visible,
  restant,
  reveleJuste,
  pret,
  phrase,
}: {
  pret: boolean;
  phrase: boolean;
  mot: string;
  visible: boolean;
  restant: number;
  reveleJuste: boolean | null;
}) {
  const reduce = useReducedMotion();
  const long = [...mot].length > 14;
  return (
    <motion.div
      className="relative w-full max-w-md rounded-md bg-white p-3 pb-10 shadow-soft"
      initial={reduce ? false : { rotate: -2 }}
      animate={reduce ? undefined : { rotate: reveleJuste === null ? -2 : reveleJuste ? 2 : -3 }}
    >
      <div
        className="relative flex min-h-[7.5rem] items-center justify-center overflow-hidden rounded-sm px-3 sm:min-h-[9rem]"
        style={{ background: 'linear-gradient(160deg,#BEE9FF 0%,#E6F7FF 55%,#FFF1C9 100%)' }}
      >
        <AnimatePresence mode="wait">
          {visible ? (
            <motion.p
              key="mot"
              initial={{ opacity: 0, filter: 'blur(6px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`break-words text-center font-titre font-extrabold text-ink ${long ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'}`}
              aria-live="assertive"
            >
              {mot}
            </motion.p>
          ) : (
            <motion.div
              key="flou"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-1 text-ink-soft"
            >
              <svg viewBox="0 0 120 50" className="h-12 w-28" aria-hidden>
                <ellipse cx="40" cy="28" rx="34" ry="14" fill="#fff" opacity="0.9" />
                <ellipse cx="78" cy="22" rx="30" ry="15" fill="#fff" opacity="0.85" />
                <ellipse cx="60" cy="34" rx="40" ry="10" fill="#fff" opacity="0.7" />
              </svg>
              <span className="font-titre text-lg font-bold">
                {pret
                  ? 'C’est parti ? Regarde bien…'
                  : phrase
                    ? 'La phrase s’est envolée !'
                    : 'Le mot s’est envolé !'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Temps restant : la bande du bas se vide */}
      <div className="absolute bottom-3 left-3 right-3 h-3 overflow-hidden rounded-full bg-cream-deep">
        {visible && (
          <div
            className="h-full rounded-full bg-grape"
            style={{ width: `${restant * 100}%`, transition: 'width 50ms linear' }}
          />
        )}
      </div>
    </motion.div>
  );
}

export default function AppareilPhoto({
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
  const dureeBase = parNiveau(level, DUREE_MS);
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduce = useReducedMotion();

  const [item, setItem] = useState(() => stream.next() as SpellingItem);
  const [etape, setEtape] = useState<Etape>('pret');
  const [input, setInput] = useState('');
  const [copie, setCopie] = useState('');
  const [donne, setDonne] = useState('');
  const [message, setMessage] = useState('');
  const [cliches, setCliches] = useState<Cliche[]>([]);
  const [flash, setFlash] = useState(0);
  const [revoirMot, setRevoirMot] = useState(0);
  const [revoirPartie, setRevoirPartie] = useState(0);

  const duree = item.isSentence ? dureeBase * 2 : dureeBase;
  const prefixe = level === 'facile' && !item.isSentence ? [...item.word][0]! : '';
  const revoirRestants = level === 'facile' ? 2 - revoirMot : level === 'normal' ? 1 - revoirPartie : 0;

  const restant = useCompteARebours({
    actif: etape === 'photo',
    dureeMs: duree,
    paused,
    cle: flash,
    onFin: () => {
      setEtape('ecrire');
      session.startQuestion();
    },
  });

  const declencher = useCallback(() => {
    if (paused) return;
    sfx.play('pop');
    setFlash((f) => f + 1);
    setEtape('photo');
  }, [paused, sfx]);

  useEffect(() => {
    if (etape === 'pret' && lectureAuto) void speech.speak('Appuie sur le déclencheur !');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const revoir = () => {
    if (revoirRestants <= 0 || etape !== 'ecrire') return;
    if (level === 'facile') setRevoirMot((n) => n + 1);
    else setRevoirPartie((n) => n + 1);
    declencher();
  };

  const suivant = useCallback(
    (nbCliches: number, justes: number) => {
      if (nbCliches >= total) {
        setEtape('fini');
        sfx.play('fanfare');
        session.end({
          won: true,
          headline: `Ton album compte ${justes} photo${justes > 1 ? 's' : ''} réussie${justes > 1 ? 's' : ''} !`,
          delayMs: 1400,
        });
        return;
      }
      setItem(stream.next() as SpellingItem);
      setInput('');
      setCopie('');
      setDonne('');
      setRevoirMot(0);
      setEtape('pret');
    },
    [total, session, sfx, stream],
  );

  const valider = () => {
    if (etape !== 'ecrire' || paused) return;
    const given = prefixe + input;
    if (!input.trim()) return;
    const res = checkSpelling(given, item.word, { isSentence: item.isSentence });
    session.answer(item, res.correct, given, item.word);
    const nb = cliches.length + 1;
    const nbJustes = cliches.filter((c) => c.juste).length + (res.correct ? 1 : 0);
    setCliches((c) => [...c, { mot: item.word, juste: res.correct }]);
    if (res.correct) {
      sfx.play('juste');
      setDonne(given);
      setEtape('correction');
      setMessage('');
      setTimeout(() => suivant(nb, nbJustes), 900);
    } else {
      sfx.play('faux');
      vibrate([40, 40, 40]);
      setDonne(given);
      setMessage(res.message);
      setEtape('correction');
      void speech.speak(`${res.message} On écrit : ${item.word}`);
    }
  };

  const enErreur = etape === 'correction' && !!message;
  const copieOk = enErreur && checkSpelling(copie, item.word, { isSentence: item.isSentence }).correct;
  const continuer = () => {
    if (!copieOk) return;
    suivant(cliches.length, cliches.filter((c) => c.juste).length);
  };

  const handlers = {
    onKey: (k: string) => {
      if (etape === 'ecrire') setInput((v) => (v.length < 80 ? v + k : v));
      else if (enErreur) setCopie((v) => (v.length < 80 ? v + k : v));
    },
    onDelete: () => (etape === 'ecrire' ? setInput((v) => v.slice(0, -1)) : setCopie((v) => v.slice(0, -1))),
    onSubmit: () => {
      if (etape === 'pret') declencher();
      else if (etape === 'ecrire') valider();
      else if (enErreur) continuer();
    },
    disabled: paused || etape === 'fini' || etape === 'photo',
  };
  usePhysicalKeyboard(handlers, TOUCHES);

  const justes = useMemo(() => cliches.filter((c) => c.juste).length, [cliches]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row">
      {/* Studio : l'appareil et l'album */}
      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[40%] lg:self-start"
        aria-label={`Album : ${justes} photos réussies sur ${cliches.length}`}
        style={{ background: 'linear-gradient(180deg,#2E3A57 0%,#46557A 100%)' }}
      >
        <div className="flex items-center gap-3 p-3 lg:flex-col">
          <div className="h-24 w-32 shrink-0 sm:h-28 sm:w-40 lg:h-40 lg:w-56">
            <Appareil flash={flash} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-2 font-titre text-lg font-bold text-white">
              Album : {cliches.length} / {total}
            </p>
            <ul className="flex flex-wrap gap-1.5" aria-label="Photos de l’album">
              {Array.from({ length: total }, (_, i) => {
                const c = cliches[i];
                return (
                  <motion.li
                    key={i}
                    initial={c && !reduce ? { scale: 0.4, rotate: -20 } : false}
                    animate={{ scale: 1, rotate: c ? (i % 2 ? 4 : -4) : 0 }}
                    className={`flex h-10 w-9 items-start justify-center rounded-sm p-0.5 pb-2 shadow-pop-sm sm:h-12 sm:w-11 ${c ? 'bg-white' : 'bg-white/15'}`}
                    aria-label={c ? `${c.mot} : ${c.juste ? 'réussie' : 'à revoir'}` : 'photo à prendre'}
                  >
                    {c && (
                      <span
                        className={`flex h-full w-full items-center justify-center rounded-[2px] text-base ${c.juste ? 'bg-grass/60' : 'bg-sun/60'}`}
                        aria-hidden
                      >
                        {c.juste ? '★' : '↺'}
                      </span>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="carte relative flex min-w-0 flex-1 flex-col items-center gap-3 p-4 sm:p-6">
        {/* Flash plein panneau */}
        <AnimatePresence>
          {etape === 'photo' && !reduce && (
            <motion.div
              key={flash}
              className="pointer-events-none absolute inset-0 z-10 rounded-card bg-white"
              initial={{ opacity: 0.95 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              aria-hidden
            />
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {etape !== 'photo' && etape !== 'fini' && (
            <SpeakButton
              text={
                etape === 'pret'
                  ? 'Appuie sur le déclencheur pour voir le mot.'
                  : 'Écris le mot que tu as photographié.'
              }
              label="Écouter la consigne"
              size={40}
            />
          )}
          <BadgeParents item={item} />
          {item.isSentence && (
            <span className="rounded-full bg-sky/20 px-3 py-1 text-sm font-bold">Une phrase entière !</span>
          )}
        </div>

        <Polaroid
          pret={etape === 'pret'}
          phrase={item.isSentence}
          mot={item.word}
          visible={etape === 'photo' || (etape === 'correction' && !message)}
          restant={etape === 'photo' ? restant : 0}
          reveleJuste={etape === 'correction' ? !message : null}
        />

        {etape === 'pret' && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-center text-lg">
              Prépare tes yeux : le mot restera <strong>{duree / 1000} secondes</strong>.
            </p>
            <Button size="lg" variant="grape" icon={<Camera aria-hidden />} onClick={declencher}>
              Clic ! Prendre la photo
            </Button>
          </div>
        )}

        {etape === 'photo' && (
          <p className="font-titre text-xl font-bold text-grape-dark" role="status">
            Photographie le mot dans ta tête…
          </p>
        )}

        {etape === 'ecrire' && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <p className="text-ink-soft">{item.isSentence ? 'Écris la phrase.' : 'Écris le mot.'}</p>
              {revoirRestants > 0 && (
                <Button variant="sun" icon={<Eye aria-hidden />} onClick={revoir} disabled={paused}>
                  Revoir la photo ({revoirRestants})
                </Button>
              )}
            </div>
            <div
              className="flex min-h-[4.25rem] w-full max-w-xl flex-wrap items-center justify-center rounded-2xl border-4 border-grape bg-cream px-4 py-2 font-titre text-3xl font-extrabold sm:text-4xl"
              aria-label={`Ce que tu as écrit : ${prefixe + input || 'rien pour l’instant'}`}
              aria-live="polite"
            >
              {prefixe && <span className="text-grape">{prefixe}</span>}
              <span className="whitespace-pre-wrap break-all">{input}</span>
              <span className="ml-0.5 inline-block h-9 w-1 animate-pulse bg-ink/40" aria-hidden />
            </div>
          </>
        )}

        {etape === 'correction' && !message && (
          <p className="font-titre text-2xl font-extrabold text-grass-dark" role="status">
            Photo parfaite ! ★
          </p>
        )}

        {enErreur && (
          <CorrectionMot donne={donne} attendu={item.word} message={message} explication={item.explication}>
            <p className="font-bold">
              {item.isSentence ? 'Recopie-la en la regardant bien :' : 'Recopie-le en le regardant bien :'}
            </p>
            <div
              className={`flex min-h-[3.75rem] w-full max-w-xl items-center justify-center rounded-2xl border-4 px-4 font-titre text-3xl font-extrabold ${copieOk ? 'border-grass bg-grass/10' : 'border-sun bg-cream'}`}
              aria-label={`Ta copie : ${copie || 'vide'}`}
            >
              <span className="break-all">{copie}</span>
              <span className="ml-0.5 inline-block h-8 w-1 animate-pulse bg-ink/40" aria-hidden />
            </div>
            <Button variant="grass" onClick={continuer} disabled={!copieOk}>
              {copieOk ? 'Bravo ! Photo suivante' : item.isSentence ? 'Recopie la phrase' : 'Recopie le mot'}
            </Button>
          </CorrectionMot>
        )}

        {(etape === 'ecrire' || enErreur) && <LetterKeyboard {...handlers} ponctuation={item.isSentence} />}

        {etape === 'fini' && (
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="font-titre text-3xl font-extrabold text-grass-dark"
          >
            📸 Album terminé !
          </motion.p>
        )}
      </section>
    </div>
  );
}
