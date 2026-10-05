/**
 * Le Wordle des mots de la semaine (CATALOGUE n° 33).
 * Un mot de la liste (programme ou parents) se cache ; 6 essais pour le retrouver par déduction.
 * Couleurs : vert = bien placée, jaune = ailleurs dans le mot, gris = absente, vert cerclé de jaune =
 * bonne lettre à la bonne place mais il manque (ou il y a) un accent. Longueur variable.
 * Facile : 1re lettre donnée, liste des mots possibles affichée, mot à entendre après 2 essais.
 * Normal : 1 coup de pouce par mot après 2 essais (définition ou mot à entendre).
 * Plus loin : aucune aide, plus de mots à trouver.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePhysicalKeyboard } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level, SpellingItem } from '@/content/schemas';
import { checkSpelling } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { Hud } from '../_kit/ui';
import { collecterMots, estMot, lettres, motSimple } from '../_orthographe-commun/lettres';
import { BadgeParents, ClavierLettres, CorrectionMot } from '../_orthographe-commun/ui';
import { direMot, peutEntendre, TOUCHES_LETTRES } from '../_orthographe-commun/voix';
import { type EtatLettre, colorer, etatsClavier } from '../_orthographe-commun/wordle';

const ESSAIS = 6;
const MOTS: Record<Level, number> = { facile: 3, normal: 4, plus_loin: 5 };

const okItem = (it: Item): it is SpellingItem =>
  estMot(it) && motSimple(it.word) && [...it.word].length >= 3 && [...it.word].length <= 10;

interface Essai {
  mot: string;
  etats: EtatLettre[];
}

const COULEUR: Record<EtatLettre, string> = {
  bien: 'bg-grass-dark text-white border-grass-dark',
  accent: 'bg-grass/60 text-ink border-sun-dark ring-4 ring-sun ring-inset',
  mal_place: 'bg-sun text-ink border-sun-dark',
  absent: 'bg-ink/50 text-white border-transparent',
};
const LIBELLE: Record<EtatLettre, string> = {
  bien: 'bien placée',
  accent: 'bonne place, attention à l’accent',
  mal_place: 'ailleurs dans le mot',
  absent: 'pas dans le mot',
};

function Case({
  ch,
  etat,
  index,
  donnee,
  active,
}: {
  ch: string;
  etat?: EtatLettre;
  index: number;
  donnee?: boolean;
  active?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={etat && !reduce ? { rotateX: [0, 90, 0] } : { rotateX: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className={`flex aspect-square w-full items-center justify-center rounded-lg border-[3px] font-titre font-extrabold uppercase ${
        etat
          ? COULEUR[etat]
          : donnee
            ? 'border-grass-dark bg-grass/30 text-ink'
            : ch
              ? 'border-ink/50 bg-card text-ink'
              : active
                ? 'border-ink/25 bg-card'
                : 'border-ink/10 bg-card/60'
      }`}
      style={{ fontSize: 'clamp(1rem, 5.2vw, 2rem)' }}
      aria-label={ch ? `${ch}${etat ? `, ${LIBELLE[etat]}` : ''}` : 'case vide'}
    >
      <span className="normal-case">{ch}</span>
    </motion.div>
  );
}

export default function Wordle({ level, stream, paused, onAnswer, onEnd, speech, sfx }: GameProps) {
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const pool = useMemo(() => collecterMots(stream, okItem), [stream]);
  const nbMots = Math.min(parNiveau(level, MOTS), Math.max(1, pool.length));

  const [rang, setRang] = useState(0);
  const item: SpellingItem | undefined = pool[rang];
  const cible = useMemo(() => (item ? lettres(item.word) : []), [item]);
  const L = cible.length;
  const premiere = level === 'facile' ? (cible[0] ?? '') : '';

  const [essais, setEssais] = useState<Essai[]>([]);
  const [saisie, setSaisie] = useState('');
  const [etape, setEtape] = useState<'jeu' | 'gagne' | 'perdu' | 'fini'>('jeu');
  const [alerte, setAlerte] = useState('');
  const [secoue, setSecoue] = useState(0);
  const [aide, setAide] = useState<'aucune' | 'definition' | 'audio'>('aucune');
  const [trouves, setTrouves] = useState(0);

  useEffect(() => {
    session.startQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rang]);

  const ligneCourante = premiere + saisie;
  const dernierEssai = essais[essais.length - 1];

  const valider = useCallback(() => {
    if (etape !== 'jeu' || paused || !item) return;
    const n = lettres(ligneCourante).length;
    if (n !== L) {
      setAlerte(`Il faut un mot de ${L} lettres !`);
      setSecoue((s) => s + 1);
      sfx.play('faux');
      return;
    }
    setAlerte('');
    const etats = colorer(ligneCourante, item.word);
    const nouv = [...essais, { mot: ligneCourante, etats }];
    setEssais(nouv);
    setSaisie('');
    const juste = checkSpelling(ligneCourante, item.word).correct;
    if (juste) {
      session.answer(item, true, ligneCourante, item.word);
      setTrouves((t) => t + 1);
      setEtape('gagne');
      sfx.play('fanfare');
    } else if (nouv.length >= ESSAIS) {
      session.answer(item, false, ligneCourante, item.word);
      setEtape('perdu');
      sfx.play('faux');
      vibrate([40, 40, 40]);
      void speech.speak(`Presque ! Le mot était : ${item.word}`);
    } else {
      sfx.play(etats.some((e) => e === 'bien' || e === 'accent') ? 'pop' : 'tic');
      if (etats.includes('accent')) setAlerte('Une lettre est à la bonne place, mais vérifie son accent !');
    }
  }, [etape, paused, item, ligneCourante, L, essais, session, sfx, speech]);

  const suivant = useCallback(() => {
    if (rang + 1 >= nbMots) {
      setEtape('fini');
      session.end({
        won: trouves >= Math.ceil(nbMots / 2),
        headline: `${trouves} mot${trouves > 1 ? 's' : ''} trouvé${trouves > 1 ? 's' : ''} sur ${nbMots} !`,
        delayMs: 500,
      });
      return;
    }
    setRang((r) => r + 1);
    setEssais([]);
    setSaisie('');
    setAlerte('');
    setAide('aucune');
    setEtape('jeu');
  }, [rang, nbMots, trouves, session]);

  const handlers = {
    onKey: (k: string) => {
      if (etape !== 'jeu') return;
      setAlerte('');
      setSaisie((v) => (lettres(premiere + v).length < L ? v + k : v));
    },
    onDelete: () => etape === 'jeu' && setSaisie((v) => [...v].slice(0, -1).join('')),
    onSubmit: () => {
      if (etape === 'jeu') valider();
      // (mot perdu : Entrée est gérée par le panneau de correction)
      else if (etape === 'gagne') suivant();
    },
    disabled: paused || etape === 'fini',
  };
  usePhysicalKeyboard(handlers, TOUCHES_LETTRES);

  const clavier = useMemo(() => etatsClavier(essais), [essais]);

  if (!item) {
    return (
      <div className="carte mx-auto max-w-md p-6 text-center">
        <p className="text-lg">Il n’y a pas encore de mots pour ce jeu dans cette leçon.</p>
      </div>
    );
  }

  // Mots possibles (facile) : les mots de la liste qui ont la même longueur
  const possibles =
    level === 'facile' ? pool.filter((p) => lettres(p.word).length === L).map((p) => p.word) : [];
  // Un seul mot possible donnerait la réponse : la liste n'apparaît qu'à partir de deux mots
  const listePossibles = possibles.length >= 2 ? possibles : [];
  const aideDispo = level !== 'plus_loin' && essais.length >= 2 && etape === 'jeu';
  const lignes = Array.from({ length: ESSAIS }, (_, i) => i);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row lg:items-start">
      <section className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-3 sm:p-5">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Hud>
            Mot {rang + 1} / {nbMots}
          </Hud>
          <BadgeParents item={item} />
          <Hud>
            <span aria-hidden>🟩</span> {trouves}
          </Hud>
        </div>
        <div className="flex items-center gap-2">
          <SpeakButton
            text={`Trouve le mot de ${L} lettres. Vert : bien placée. Jaune : ailleurs dans le mot. Gris : pas dans le mot.`}
            label="Écouter la consigne"
            size={40}
          />
          <p className="font-titre text-xl font-bold">Un mot de {L} lettres</p>
        </div>

        {/* La grille */}
        <div
          className="flex w-full flex-col gap-1.5"
          style={{ maxWidth: `${Math.min(L * 3.7, 30)}rem` }}
          role="grid"
          aria-label="Grille des essais"
        >
          {lignes.map((i) => {
            const essai = essais[i];
            const courante = i === essais.length && etape === 'jeu';
            const chars = essai ? lettres(essai.mot) : courante ? lettres(ligneCourante) : [];
            return (
              <motion.div
                key={`${rang}-${i}-${courante ? secoue : 0}`}
                role="row"
                animate={courante && secoue ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
                transition={{ duration: 0.4 }}
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${L}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: L }, (_, j) => (
                  <Case
                    key={j}
                    index={j}
                    ch={chars[j] ?? ''}
                    etat={essai?.etats[j]}
                    donnee={courante && j === 0 && !!premiere}
                    active={courante}
                  />
                ))}
              </motion.div>
            );
          })}
        </div>

        <p className="min-h-[1.5rem] text-center font-bold text-coral-dark" role="status" aria-live="polite">
          {alerte}
        </p>

        <AnimatePresence>
          {etape === 'gagne' && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-2 text-center"
              role="status"
            >
              <p className="font-titre text-2xl font-extrabold text-grass-dark">
                Bravo ! Trouvé en {essais.length} essai{essais.length > 1 ? 's' : ''} !
              </p>
              <div className="flex items-center gap-2">
                <span className="font-titre text-3xl font-extrabold">{item.word}</span>
                <SpeakButton text={item.word} size={40} label={`Écouter : ${item.word}`} />
              </div>
              <Button variant="grass" onClick={suivant} autoFocus>
                {rang + 1 >= nbMots ? 'Voir mon score' : 'Mot suivant'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {etape === 'perdu' && (
          <CorrectionMot
            donne={dernierEssai?.mot ?? null}
            attendu={item.word}
            message="Les 6 essais sont utilisés. Voici le mot :"
            explication={item.explication}
            onContinue={suivant}
            libelleContinuer={rang + 1 >= nbMots ? 'Voir mon score' : 'Mot suivant'}
          />
        )}

        {etape === 'jeu' && (
          <ClavierLettres
            onKey={handlers.onKey}
            onDelete={handlers.onDelete}
            onSubmit={handlers.onSubmit}
            etats={clavier}
            disabled={paused}
          />
        )}
      </section>

      {/* Aides et légende */}
      <aside className="carte flex flex-col gap-3 p-4 lg:w-72">
        <h2 className="font-titre text-lg font-bold">Les couleurs</h2>
        <ul className="flex flex-col gap-1.5 text-sm">
          {(['bien', 'mal_place', 'absent', 'accent'] as const).map((e) => (
            <li key={e} className="flex items-center gap-2">
              <span
                className={`inline-block h-7 w-7 shrink-0 rounded-md border-[3px] ${COULEUR[e]}`}
                aria-hidden
              />
              {e === 'bien'
                ? 'Bonne lettre, bonne place'
                : e === 'mal_place'
                  ? 'La lettre est ailleurs dans le mot'
                  : e === 'absent'
                    ? 'La lettre n’est pas dans le mot'
                    : 'Bonne place, mais attention à l’accent'}
            </li>
          ))}
        </ul>
        {listePossibles.length > 0 && etape === 'jeu' && (
          <div>
            <h2 className="font-titre text-lg font-bold">Mots possibles de ta liste</h2>
            <p className="flex flex-wrap gap-1.5">
              {listePossibles.map((m) => (
                <span key={m} className="rounded-full bg-sky/15 px-3 py-1 font-bold">
                  {m}
                </span>
              ))}
            </p>
          </div>
        )}
        {level !== 'plus_loin' && etape === 'jeu' && (
          <div className="flex flex-col gap-2">
            {aide === 'aucune' ? (
              <Button
                variant="grape"
                icon={<Lightbulb aria-hidden />}
                onClick={() => {
                  if (!aideDispo) return;
                  if (item.definition) setAide('definition');
                  else if (peutEntendre(speech, item)) {
                    setAide('audio');
                    void direMot(speech, item);
                  }
                }}
                disabled={!aideDispo || paused || (!item.definition && !peutEntendre(speech, item))}
              >
                Coup de pouce
              </Button>
            ) : aide === 'definition' ? (
              <p className="rounded-2xl bg-grape/10 p-3 font-bold">
                <SpeakButton
                  text={item.definition!}
                  size={32}
                  className="mr-2 align-middle"
                  label="Écouter l’indice"
                />
                {item.definition}
              </p>
            ) : (
              <p className="text-sm">Tu as entendu le mot. Écris-le !</p>
            )}
            {!aideDispo && aide === 'aucune' && (
              <p className="text-sm text-ink-soft">Le coup de pouce arrive après 2 essais.</p>
            )}
            {level === 'facile' && aide === 'definition' && peutEntendre(speech, item) && (
              <Button variant="sun" onClick={() => void direMot(speech, item)}>
                Entendre le mot
              </Button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
