/**
 * Les Lettres en vrac (CATALOGUE n° 31) — anagramme façon Tetris.
 * Les lettres du mot tombent en désordre dans le puits ; l'enfant les touche (ou les tape) dans
 * l'ordre pour reconstruire le mot.
 * Facile : première lettre posée, lettre « aimantée » (une mauvaise lettre rebondit tout de suite),
 *          écoute illimitée. Normal : vérification à la fin du mot, 1 coup de pouce pour la partie,
 *          2 écoutes par mot. Plus loin : lettres intruses dans le tas, aucun coup de pouce, 1 écoute.
 */
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePhysicalKeyboard } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import type { Level, SpellingItem } from '@/content/schemas';
import { checkSpelling } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { Hud } from '../_kit/ui';
import { base, estMot, tirerItem } from '../_orthographe-commun/lettres';
import { BadgeParents, BoutonEntendre, CorrectionMot } from '../_orthographe-commun/ui';
import { TOUCHES_LETTRES } from '../_orthographe-commun/voix';
import { type Case, type Tuile, construireTas, nbIntrus } from './tas';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
const ECOUTES: Record<Level, number> = { facile: Infinity, normal: 2, plus_loin: 1 };
const COULEURS = ['#4FC3F7', '#7BD389', '#FFD45C', '#FF7A6B', '#8E7CFF', '#E0A458', '#3CC8B4'];

type Etape = 'jeu' | 'juste' | 'faux' | 'fini';

const okItem = (it: Parameters<typeof estMot>[0]): it is SpellingItem =>
  estMot(it) && [...it.word].length >= 2 && [...it.word].length <= 14;

function couleurDe(t: Tuile) {
  let h = 0;
  for (const c of t.id + t.ch) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COULEURS[h % COULEURS.length]!;
}

/** Tuile-lettre (bloc façon Tetris). */
function Bloc({
  tuile,
  onClick,
  disabled,
  secoue,
  delai,
  tombe,
  label,
}: {
  tuile: Tuile;
  onClick?: () => void;
  disabled?: boolean;
  secoue?: boolean;
  delai?: number;
  tombe?: boolean;
  label: string;
}) {
  const reduce = useReducedMotion();
  const couleur = couleurDe(tuile);
  return (
    <motion.button
      type="button"
      layoutId={tuile.id}
      initial={tombe && !reduce ? { y: -260, rotate: (delai ?? 0) % 2 ? 18 : -14, opacity: 0 } : false}
      animate={
        secoue && !reduce
          ? { x: [0, -8, 8, -6, 6, 0], y: 0, rotate: 0, opacity: 1 }
          : { x: 0, y: 0, rotate: 0, opacity: 1 }
      }
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 18,
        delay: tombe && !reduce ? (delai ?? 0) * 0.09 : 0,
      }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-titre text-3xl font-extrabold text-ink shadow-pop sm:h-16 sm:w-16 sm:text-4xl"
      style={{
        background: `linear-gradient(180deg, ${couleur} 0%, ${couleur} 70%, rgba(0,0,0,0.12) 100%)`,
        boxShadow: `inset 0 -5px 0 rgba(0,0,0,0.15), inset 0 4px 0 rgba(255,255,255,0.45), 0 4px 0 rgba(0,0,0,0.18)`,
      }}
    >
      {tuile.ch}
    </motion.button>
  );
}

export default function LettresEnVrac({ level, stream, paused, onAnswer, onEnd, speech, sfx }: GameProps) {
  const total = parNiveau(level, MANCHES);
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);

  const tirer = useCallback(() => tirerItem(stream, okItem) ?? (stream.next() as SpellingItem), [stream]);
  const [item, setItem] = useState<SpellingItem>(tirer);
  const [manche, setManche] = useState(1);
  const [etape, setEtape] = useState<Etape>('jeu');
  const [tas, setTas] = useState(() =>
    construireTas(item.word, { intrus: level === 'plus_loin' ? nbIntrus(item.word) : 0 }),
  );
  /** Pour chaque case, l'id de la tuile posée (ou null). */
  const [poses, setPoses] = useState<(string | null)[]>([]);
  const [secoue, setSecoue] = useState<string | null>(null);
  const [ecoutes, setEcoutes] = useState(0);
  const [coupsDePouce, setCoupsDePouce] = useState(level === 'normal' ? 1 : 0);
  const [donne, setDonne] = useState('');
  const [message, setMessage] = useState('');
  const [justes, setJustes] = useState(0);
  /** Les lettres tombent au début de chaque manche (pas quand on en retire une). */
  const [chute, setChute] = useState(true);

  /** Indices des cases-lettres (les signes fixes sont déjà en place). */
  const casesLettres = useMemo(
    () => tas.cases.map((c, i) => (c.type === 'lettre' ? i : -1)).filter((i) => i >= 0),
    [tas],
  );

  // Nouvelle manche : facile → la première lettre est déjà posée
  useEffect(() => {
    const p: (string | null)[] = tas.cases.map(() => null);
    if (level === 'facile') {
      const i0 = casesLettres[0];
      if (i0 !== undefined) {
        const t = tas.tuiles.find((x) => !x.intrus && x.ch === tas.cases[i0]!.ch);
        if (t) p[i0] = t.id;
      }
    }
    setPoses(p);
    setChute(true);
    session.startQuestion();
    const t = setTimeout(() => setChute(false), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tas]);

  const tuileDe = (id: string | null) => (id ? (tas.tuiles.find((t) => t.id === id) ?? null) : null);
  const utilisees = new Set(poses.filter(Boolean) as string[]);
  const libres = tas.tuiles.filter((t) => !utilisees.has(t.id));
  const prochaine = casesLettres.find((i) => !poses[i]);

  const motForme = (p: (string | null)[]) =>
    tas.cases.map((c, i) => (c.type === 'fixe' ? c.ch : (tuileDe(p[i] ?? null)?.ch ?? ''))).join('');

  const verifier = useCallback(
    (p: (string | null)[]) => {
      const given = tas.cases
        .map((c, i) => (c.type === 'fixe' ? c.ch : (tas.tuiles.find((t) => t.id === p[i])?.ch ?? '')))
        .join('');
      const res = checkSpelling(given, item.word);
      session.answer(item, res.correct, given, item.word);
      if (res.correct) {
        sfx.play('juste');
        setJustes((j) => j + 1);
        setEtape('juste');
      } else {
        sfx.play('faux');
        vibrate([40, 40, 40]);
        setDonne(given);
        setMessage(
          res.verdict === 'accent'
            ? res.message
            : p.some((id) => tas.tuiles.find((t) => t.id === id)?.intrus)
              ? 'Presque ! Une lettre intruse s’est glissée dans ton mot.'
              : 'Presque ! Les lettres sont là, mais pas dans le bon ordre.',
        );
        setEtape('faux');
        void speech.speak(`Presque ! On écrit : ${item.word}`);
      }
    },
    [tas, item, session, sfx, speech],
  );

  const poser = (t: Tuile) => {
    if (etape !== 'jeu' || paused || prochaine === undefined) return;
    // Facile : la lettre est « aimantée » — une mauvaise lettre rebondit aussitôt
    if (level === 'facile' && t.ch !== tas.cases[prochaine]!.ch) {
      setSecoue(t.id);
      sfx.play('faux');
      setTimeout(() => setSecoue(null), 450);
      return;
    }
    sfx.play('pop');
    const p = [...poses];
    p[prochaine] = t.id;
    setPoses(p);
    if (casesLettres.every((i) => p[i])) setTimeout(() => verifier(p), 250);
  };

  const retirer = (i: number) => {
    if (etape !== 'jeu' || paused) return;
    if (level === 'facile' && i === casesLettres[0]) return; // lettre offerte
    const p = [...poses];
    p[i] = null;
    setPoses(p);
    sfx.play('glisse');
  };

  const retirerDerniere = () => {
    const derniere = [...casesLettres].reverse().find((i) => poses[i]);
    if (derniere !== undefined) retirer(derniere);
  };

  const coupDePouce = () => {
    if (coupsDePouce <= 0 || prochaine === undefined || etape !== 'jeu') return;
    setCoupsDePouce((n) => n - 1);
    // On enlève les lettres mal placées à partir de la première erreur, puis on pose la bonne
    const p = [...poses];
    let k = 0;
    for (const i of casesLettres) {
      const t = tuileDe(p[i] ?? null);
      if (t && t.ch !== tas.cases[i]!.ch) {
        for (const j of casesLettres.slice(k)) p[j] = null;
        break;
      }
      k++;
    }
    const cible = casesLettres.find((i) => !p[i]);
    if (cible === undefined) return;
    const deja = new Set(p.filter(Boolean) as string[]);
    const t = tas.tuiles.find((x) => !deja.has(x.id) && !x.intrus && x.ch === tas.cases[cible]!.ch);
    if (t) p[cible] = t.id;
    setPoses(p);
    sfx.play('etoile');
    if (casesLettres.every((i) => p[i])) setTimeout(() => verifier(p), 250);
  };

  const suivant = useCallback(() => {
    if (manche >= total) {
      setEtape('fini');
      sfx.play('fanfare');
      session.end({
        won: justes >= Math.ceil(total / 2),
        headline: `${justes} mot${justes > 1 ? 's' : ''} reconstruit${justes > 1 ? 's' : ''} sur ${total} !`,
        delayMs: 1200,
      });
      return;
    }
    const it = tirer();
    setItem(it);
    setManche((m) => m + 1);
    setEcoutes(0);
    setEtape('jeu');
    setTas(construireTas(it.word, { intrus: level === 'plus_loin' ? nbIntrus(it.word) : 0 }));
  }, [manche, total, justes, session, sfx, tirer, level]);

  // Mot juste : on passe au suivant après la petite fête
  useEffect(() => {
    if (etape !== 'juste' || paused) return;
    const t = setTimeout(suivant, 1100);
    return () => clearTimeout(t);
  }, [etape, paused, suivant]);

  // Clavier physique : une lettre tapée prend la première tuile identique (sinon même lettre sans accent)
  usePhysicalKeyboard(
    {
      onKey: (k) => {
        const exacte =
          libres.find((t) => t.ch === k) ?? libres.find((t) => t.ch.toLowerCase() === k.toLowerCase());
        const proche = exacte ?? libres.find((t) => base(t.ch) === base(k));
        if (proche) poser(proche);
      },
      onDelete: retirerDerniere,
      // Entrée après une erreur : géré par le panneau de correction
      onSubmit: () => {},
      disabled: paused || etape === 'fini',
    },
    TOUCHES_LETTRES,
  );

  const forme = motForme(poses);

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <Hud>
          Mot {manche} / {total}
        </Hud>
        <div className="flex flex-wrap items-center gap-2">
          <BadgeParents item={item} />
          <Hud>
            <span aria-hidden>⭐</span> {justes}
          </Hud>
        </div>
      </div>

      <section className="carte flex w-full flex-col items-center gap-4 p-3 sm:p-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <SpeakButton
            text="Touche les lettres dans le bon ordre pour reconstruire le mot."
            label="Écouter la consigne"
            size={44}
          />
          <BoutonEntendre
            speech={speech}
            item={item}
            restants={ECOUTES[level] - ecoutes}
            onUse={() => setEcoutes((e) => e + 1)}
            disabled={paused || etape === 'fini'}
          />
          {level === 'normal' && (
            <Button
              variant="grape"
              icon={<Lightbulb aria-hidden />}
              onClick={coupDePouce}
              disabled={coupsDePouce <= 0 || etape !== 'jeu' || paused}
            >
              Coup de pouce ({coupsDePouce})
            </Button>
          )}
        </div>

        <LayoutGroup>
          {/* Le mot à reconstruire */}
          <div
            className="flex max-w-full flex-wrap justify-center gap-1.5 sm:gap-2"
            role="group"
            aria-label={`Mot en construction : ${forme || 'vide'}`}
          >
            {tas.cases.map((c: Case, i) => {
              if (c.type === 'fixe')
                return (
                  <div
                    key={i}
                    className="flex h-14 w-6 items-center justify-center font-titre text-3xl font-extrabold sm:h-16"
                  >
                    {c.ch}
                  </div>
                );
              const t = tuileDe(poses[i] ?? null);
              const offerte = level === 'facile' && i === casesLettres[0];
              return (
                <div
                  key={i}
                  className={`flex h-14 w-14 items-center justify-center rounded-xl border-4 border-dashed sm:h-16 sm:w-16 ${
                    etape === 'juste' ? 'border-grass' : i === prochaine ? 'border-grape' : 'border-ink/20'
                  }`}
                >
                  {t && (
                    <Bloc
                      tuile={t}
                      onClick={() => retirer(i)}
                      disabled={etape !== 'jeu' || offerte}
                      label={offerte ? `${t.ch}, lettre offerte` : `${t.ch}, retirer cette lettre`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Le puits où les lettres sont tombées en vrac */}
          <div
            className="relative w-full overflow-hidden rounded-2xl p-3 pt-8"
            style={{
              background:
                'linear-gradient(180deg,#2E3A57 0%,#3D4C70 100%), repeating-linear-gradient(90deg, transparent 0 63px, rgba(255,255,255,0.05) 63px 64px)',
              backgroundBlendMode: 'overlay',
              minHeight: '9.5rem',
            }}
          >
            <span className="absolute left-3 top-2 text-sm font-bold text-white/80">
              {level === 'plus_loin' ? 'Le tas (attention aux intruses !)' : 'Le tas de lettres'}
            </span>
            <div
              className="flex min-h-[4.5rem] flex-wrap-reverse content-start items-end justify-center gap-2"
              role="group"
              aria-label="Lettres en vrac"
            >
              <AnimatePresence>
                {libres.map((t, k) => (
                  <Bloc
                    key={t.id}
                    tuile={t}
                    tombe={chute}
                    delai={k}
                    secoue={secoue === t.id}
                    onClick={() => poser(t)}
                    disabled={etape !== 'jeu' || paused}
                    label={`Lettre ${t.ch}`}
                  />
                ))}
              </AnimatePresence>
            </div>
            {etape === 'jeu' && (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="blanc"
                  icon={<Undo2 aria-hidden />}
                  onClick={retirerDerniere}
                  disabled={paused}
                >
                  Enlever la dernière
                </Button>
              </div>
            )}
          </div>
        </LayoutGroup>

        <AnimatePresence>
          {etape === 'juste' && (
            <motion.p
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center font-titre text-2xl font-extrabold text-grass-dark"
              role="status"
            >
              Bravo ! « {item.word} » est reconstruit !
            </motion.p>
          )}
        </AnimatePresence>
        {etape === 'faux' && (
          <CorrectionMot
            donne={donne}
            attendu={item.word}
            message={message}
            explication={item.explication}
            onContinue={suivant}
          />
        )}
        {etape === 'fini' && (
          <p className="font-titre text-3xl font-extrabold text-grass-dark" role="status">
            🔤 Tous les mots sont rangés !
          </p>
        )}
      </section>
    </div>
  );
}
