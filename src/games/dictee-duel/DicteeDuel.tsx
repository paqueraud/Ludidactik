/**
 * La Dictée-duel (CATALOGUE n° 38) — 2 joueurs sur le même appareil.
 * Même mot dicté pour les deux (voix du parent prioritaire), chacun écrit sur son propre clavier
 * à l'écran ; le premier qui écrit le mot sans faute marque le point.
 * Tablette / téléphone : écran partagé haut / bas, le joueur du haut a son côté retourné (face à
 * face). Ordinateur : côte à côte. Le clavier physique écrit pour le joueur 1.
 * Facile : 1re lettre donnée, 3 essais, écoute illimitée. Normal : 2 essais, 3 écoutes.
 * Plus loin : 1 seul essai, 2 écoutes.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpDown, Ear, Trophy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LetterKeyboard, usePhysicalKeyboard } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level, SpellingItem } from '@/content/schemas';
import { checkSpelling, letterDiff } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { tirerItem } from '../_orthographe-commun/lettres';
import { BadgeParents, DiffMot } from '../_orthographe-commun/ui';
import { direMot, peutEntendre } from '../_orthographe-commun/voix';

const MOTS: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
const ESSAIS: Record<Level, number> = { facile: 3, normal: 2, plus_loin: 1 };
const ECOUTES: Record<Level, number> = { facile: Infinity, normal: 3, plus_loin: 2 };
const TOUCHES = /^[\p{L}'’\- ]$/u;

const okItem = (it: Item): it is SpellingItem => it.kind === 'spelling_word' && !it.isSentence;

interface Joueur {
  saisie: string;
  essais: number;
  dernier: string;
  juste: boolean;
  secoue: number;
}
const neuf = (): Joueur => ({ saisie: '', essais: 0, dernier: '', juste: false, secoue: 0 });

function PanneauJoueur({
  nom,
  couleur,
  j,
  prefixe,
  maxEssais,
  bloque,
  retourne,
  gagnant,
  onKey,
  onDelete,
  onSubmit,
  disabled,
}: {
  nom: string;
  couleur: 'sky' | 'coral';
  j: Joueur;
  prefixe: string;
  maxEssais: number;
  bloque: boolean;
  retourne: boolean;
  gagnant: boolean;
  onKey(k: string): void;
  onDelete(): void;
  onSubmit(): void;
  disabled: boolean;
}) {
  const reduce = useReducedMotion();
  const restants = maxEssais - j.essais;
  const bord = couleur === 'sky' ? 'border-sky' : 'border-coral';
  const fond = couleur === 'sky' ? 'bg-sky' : 'bg-coral';
  return (
    <section
      className={`carte flex min-w-0 flex-1 flex-col items-center gap-2 border-4 p-3 ${bord} ${retourne ? 'rotate-180' : ''}`}
      aria-label={`Côté de ${nom}`}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1 font-titre text-lg font-bold text-white ${fond}`}>
          {nom}
        </span>
        <span className="text-sm font-bold text-ink-soft">
          {j.juste
            ? 'Juste !'
            : bloque
              ? 'Plus d’essai pour ce mot'
              : `Essai${restants > 1 ? 's' : ''} : ${restants}`}
        </span>
      </div>
      <motion.div
        key={j.secoue}
        animate={j.secoue && !reduce ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
        transition={{ duration: 0.4 }}
        className={`flex min-h-[3.75rem] w-full items-center justify-center rounded-2xl border-4 px-3 font-titre text-3xl font-extrabold ${
          gagnant
            ? 'border-grass bg-grass/15'
            : j.dernier && !j.juste
              ? 'border-sun bg-sun/10'
              : `${bord} bg-cream`
        }`}
        aria-label={`${nom} a écrit : ${prefixe + j.saisie || 'rien pour l’instant'}`}
      >
        {prefixe && <span className="text-grape">{prefixe}</span>}
        <span className="break-all">{j.saisie}</span>
        {!disabled && <span className="ml-0.5 inline-block h-8 w-1 animate-pulse bg-ink/40" aria-hidden />}
      </motion.div>
      {j.dernier && !j.juste && !disabled && (
        <p className="text-sm font-bold text-coral-dark" role="status">
          Presque ! Relis ton mot et corrige-le.
        </p>
      )}
      <LetterKeyboard onKey={onKey} onDelete={onDelete} onSubmit={onSubmit} disabled={disabled} />
    </section>
  );
}

export default function DicteeDuel({
  level,
  profile,
  stream,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
}: GameProps) {
  const total = parNiveau(level, MOTS);
  const maxEssais = parNiveau(level, ESSAIS);
  const session = useGameSession({ paused, onAnswer, onEnd });
  const noms = [profile.prenom || 'Joueur 1', 'Joueur 2'] as const;

  const tirer = useCallback(() => tirerItem(stream, okItem) ?? (stream.next() as SpellingItem), [stream]);
  const [item, setItem] = useState<SpellingItem>(tirer);
  const [manche, setManche] = useState(1);
  const [joueurs, setJoueurs] = useState<[Joueur, Joueur]>([neuf(), neuf()]);
  const [gagnant, setGagnant] = useState<0 | 1 | null>(null);
  const [revele, setRevele] = useState(false);
  const [points, setPoints] = useState<[number, number]>([0, 0]);
  const [ecoutes, setEcoutes] = useState(0);
  const [flash, setFlash] = useState(false);
  const [fini, setFini] = useState(false);
  const [faceAFace, setFaceAFace] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(pointer: coarse)').matches &&
      !window.matchMedia?.('(min-width: 1024px)').matches,
  );
  const [large, setLarge] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 1024px)').matches,
  );
  const rapporte = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(min-width: 1024px)');
    if (!mq) return;
    const h = () => setLarge(mq.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);

  const prefixe = level === 'facile' ? ([...item.word][0] ?? '') : '';
  const sansVoix = !peutEntendre(speech, item);

  const dicter = useCallback(async () => {
    if (sansVoix) {
      // Repli sans voix : le mot s'affiche 3 secondes au centre
      setFlash(true);
      setTimeout(() => setFlash(false), 3000);
      return;
    }
    await direMot(speech, item, true);
  }, [speech, item, sansVoix]);

  useEffect(() => {
    if (paused) return;
    session.startQuestion();
    void dicter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  useEffect(() => {
    if (paused) speech.stop();
  }, [paused, speech]);

  /** Fin d'une manche : on enregistre le résultat du joueur 1 (le profil) s'il a essayé. */
  const finirManche = (js: [Joueur, Joueur], g: 0 | 1 | null) => {
    setRevele(true);
    if (!rapporte.current && (js[0].essais > 0 || js[0].juste)) {
      rapporte.current = true;
      session.answer(item, js[0].juste, prefixe + (js[0].juste ? js[0].saisie : js[0].dernier), item.word);
    }
    if (g === null) void speech.speak(`Personne n’a trouvé. On écrit : ${item.word}`);
    else void speech.speak(`Point pour ${noms[g]} ! On écrit : ${item.word}`);
  };

  const valider = (p: 0 | 1) => {
    if (revele || paused || fini) return;
    const j = joueurs[p];
    if (j.juste || j.essais >= maxEssais || !j.saisie.trim()) return;
    const donne = prefixe + j.saisie;
    const res = checkSpelling(donne, item.word);
    const maj: Joueur = {
      ...j,
      essais: j.essais + 1,
      dernier: donne,
      juste: res.correct,
      secoue: res.correct ? j.secoue : j.secoue + 1,
    };
    const js: [Joueur, Joueur] = p === 0 ? [maj, joueurs[1]] : [joueurs[0], maj];
    setJoueurs(js);
    if (res.correct) {
      sfx.play('etoile');
      setGagnant(p);
      setPoints((pt) => (p === 0 ? [pt[0] + 1, pt[1]] : [pt[0], pt[1] + 1]));
      finirManche(js, p);
    } else {
      sfx.play('faux');
      vibrate(40);
      const bloques = js.every((x) => x.essais >= maxEssais);
      if (bloques) finirManche(js, null);
    }
  };

  const suivant = () => {
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      const [a, b] = points;
      session.end({
        won: a >= b,
        headline:
          a === b
            ? `Égalité, ${a} partout !`
            : `Victoire de ${a > b ? noms[0] : noms[1]}, ${Math.max(a, b)} à ${Math.min(a, b)} !`,
        score: a * 100,
        delayMs: 1200,
      });
      return;
    }
    rapporte.current = false;
    setItem(tirer());
    setManche((m) => m + 1);
    setJoueurs([neuf(), neuf()]);
    setGagnant(null);
    setRevele(false);
    setEcoutes(0);
  };

  const ecrire = (p: 0 | 1) => (k: string) => {
    if (revele || paused) return;
    setJoueurs((js) => {
      const j = js[p];
      if (j.juste || j.essais >= maxEssais || j.saisie.length >= 40) return js;
      const maj = { ...j, saisie: j.saisie + k };
      return p === 0 ? [maj, js[1]] : [js[0], maj];
    });
  };
  const effacer = (p: 0 | 1) => () => {
    if (revele || paused) return;
    setJoueurs((js) => {
      const maj = { ...js[p], saisie: js[p].saisie.slice(0, -1) };
      return p === 0 ? [maj, js[1]] : [js[0], maj];
    });
  };

  // Clavier physique : joueur 1 (ou « Mot suivant » quand le mot est révélé)
  usePhysicalKeyboard(
    {
      onKey: ecrire(0),
      onDelete: effacer(0),
      onSubmit: () => (revele ? suivant() : valider(0)),
      disabled: paused || fini,
    },
    TOUCHES,
  );

  const reecouter = () => {
    if (ecoutes >= ECOUTES[level] || paused) return;
    setEcoutes((e) => e + 1);
    void dicter();
  };

  const bloque = (p: 0 | 1) => joueurs[p].juste || joueurs[p].essais >= maxEssais;
  const panneau = (p: 0 | 1) => (
    <PanneauJoueur
      key={p}
      nom={noms[p]}
      couleur={p === 0 ? 'sky' : 'coral'}
      j={joueurs[p]}
      prefixe={prefixe}
      maxEssais={maxEssais}
      bloque={bloque(p)}
      retourne={p === 1 && faceAFace && !large}
      gagnant={gagnant === p}
      onKey={ecrire(p)}
      onDelete={effacer(p)}
      onSubmit={() => valider(p)}
      disabled={paused || fini || revele || bloque(p)}
    />
  );

  const restantes = ECOUTES[level] - ecoutes;
  const centre = (
    <section className="carte flex w-full flex-col items-center gap-2 p-3" aria-label="Le mot dicté">
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        <span
          className="rounded-full bg-sky px-3 py-1 font-titre text-xl font-extrabold text-white"
          aria-label={`${noms[0]} : ${points[0]} points`}
        >
          {points[0]}
        </span>
        <span className="font-titre font-bold">
          Mot {manche} / {total}
        </span>
        <span
          className="rounded-full bg-coral px-3 py-1 font-titre text-xl font-extrabold text-white"
          aria-label={`${noms[1]} : ${points[1]} points`}
        >
          {points[1]}
        </span>
        <Button
          variant="sun"
          icon={<Ear aria-hidden />}
          onClick={reecouter}
          disabled={restantes <= 0 || paused || revele}
        >
          Réécouter{Number.isFinite(restantes) ? ` (${restantes})` : ''}
        </Button>
        {!large && (
          <Button
            variant="blanc"
            icon={<ArrowUpDown aria-hidden />}
            onClick={() => setFaceAFace((f) => !f)}
            aria-pressed={faceAFace}
            aria-label="Retourner le côté du joueur 2 (face à face)"
          >
            Face à face
          </Button>
        )}
        <BadgeParents item={item} />
      </div>
      {flash && (
        <p className="font-titre text-4xl font-extrabold" aria-live="assertive">
          {item.word}
        </p>
      )}
      <AnimatePresence>
        {revele && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex w-full flex-col items-center gap-2 rounded-2xl p-3 text-center ${gagnant === null ? 'bg-coral/10' : 'bg-grass/15'}`}
            role="status"
          >
            <p className="flex items-center gap-2 font-titre text-2xl font-extrabold">
              {gagnant !== null ? (
                <>
                  <Trophy className="text-sun-dark" aria-hidden /> Point pour {noms[gagnant]} !
                </>
              ) : (
                'Presque ! Personne n’a trouvé ce mot.'
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-ink-soft">On écrit :</span>
              <span className="font-titre text-3xl font-extrabold text-grass-dark">{item.word}</span>
              <SpeakButton text={item.word} size={40} label={`Écouter : ${item.word}`} />
            </div>
            {([0, 1] as const).map((p) =>
              joueurs[p].dernier && !joueurs[p].juste ? (
                <div key={p} className="flex flex-wrap items-center justify-center gap-2 text-sm">
                  <span className="font-bold">{noms[p]} :</span>
                  <DiffMot diff={letterDiff(joueurs[p].dernier, item.word)} className="text-2xl" />
                </div>
              ) : null,
            )}
            <p className="text-sm">{item.explication}</p>
            <Button variant="grass" onClick={suivant} autoFocus>
              {manche >= total ? 'Voir le résultat' : 'Mot suivant'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      {!revele && large && (
        <p className="text-sm text-ink-soft">Le clavier de l’ordinateur écrit pour {noms[0]}.</p>
      )}
    </section>
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-2 px-2 pb-6 pt-1 sm:px-4">
      {large ? (
        <>
          {centre}
          <div className="flex gap-3">
            {panneau(0)}
            {panneau(1)}
          </div>
        </>
      ) : (
        <>
          {panneau(1)}
          {centre}
          {panneau(0)}
        </>
      )}
    </div>
  );
}
