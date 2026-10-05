/**
 * Le Bonhomme de neige qui fond (CATALOGUE n° 32) — pendu bienveillant.
 * On devine le mot lettre par lettre (toucher une lettre de base : « e » révèle e, é, è, ê).
 * Chaque lettre absente fait fondre un peu le bonhomme ; si on trouve, le soleil se couche.
 * Le bonhomme ne « meurt » jamais : il fond en flaque et « reviendra avec la neige ».
 * Facile : 8 gouttes, 1re et dernière lettres données, définition affichée, écoute illimitée.
 * Normal : 6 gouttes, 1re lettre donnée, définition sur demande, 2 écoutes.
 * Plus loin : 5 gouttes, aucune lettre donnée, pas de définition, 1 écoute.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePhysicalKeyboard } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import type { Level, SpellingItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { Hud } from '../_kit/ui';
import { base, estLettre, estMot, lettres, tirerItem } from '../_orthographe-commun/lettres';
import {
  BadgeParents,
  BoutonEntendre,
  ClavierLettres,
  CorrectionMot,
  type EtatTouche,
} from '../_orthographe-commun/ui';
import { TOUCHES_LETTRES } from '../_orthographe-commun/voix';
import { SceneBonhomme } from './Scene';

const MANCHES: Record<Level, number> = { facile: 5, normal: 6, plus_loin: 7 };
const GOUTTES: Record<Level, number> = { facile: 8, normal: 6, plus_loin: 5 };
const ECOUTES: Record<Level, number> = { facile: Infinity, normal: 2, plus_loin: 1 };

type Etape = 'jeu' | 'trouve' | 'fondu' | 'fini';

const okItem = (it: Parameters<typeof estMot>[0]): it is SpellingItem =>
  estMot(it) && [...it.word].length >= 3 && [...it.word].length <= 16;

/** Touche de base qui révèle une lettre du mot (é → e, ç → c, œ → o). */
function cleDe(ch: string) {
  const c = ch.toLowerCase();
  if (c === 'œ') return 'o';
  if (c === 'æ') return 'a';
  return base(c);
}

function lettresDonnees(mot: string, level: Level): string[] {
  const ls = lettres(mot).filter(estLettre);
  if (level === 'plus_loin' || !ls.length) return [];
  const donnees =
    level === 'normal' ? [cleDe(ls[0]!)] : [...new Set([cleDe(ls[0]!), cleDe(ls[ls.length - 1]!)])];
  // Si ces lettres suffisaient à écrire tout le mot (« papa »), on n'en donne aucune
  return ls.every((ch) => donnees.includes(cleDe(ch))) ? [] : donnees;
}

export default function BonhommeDeNeige({ level, stream, paused, onAnswer, onEnd, speech, sfx }: GameProps) {
  const total = parNiveau(level, MANCHES);
  const maxGouttes = parNiveau(level, GOUTTES);
  const session = useGameSession({ paused, onAnswer, onEnd });

  const tirer = useCallback(() => tirerItem(stream, okItem) ?? (stream.next() as SpellingItem), [stream]);
  const [item, setItem] = useState<SpellingItem>(tirer);
  const [manche, setManche] = useState(1);
  const [etape, setEtape] = useState<Etape>('jeu');
  const [essayees, setEssayees] = useState<string[]>(() => lettresDonnees(item.word, level));
  const [erreurs, setErreurs] = useState(0);
  const [ecoutes, setEcoutes] = useState(0);
  const [definitionVue, setDefinitionVue] = useState(level === 'facile');
  const [sauves, setSauves] = useState(0);

  const ls = useMemo(() => lettres(item.word), [item]);
  const dansLeMot = useMemo(() => new Set(ls.filter(estLettre).map(cleDe)), [ls]);
  const revelee = (ch: string) => !estLettre(ch) || essayees.includes(cleDe(ch));

  useEffect(() => {
    session.startQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const proposer = (k: string) => {
    if (etape !== 'jeu' || paused) return;
    const c = cleDe(k);
    if (!/^\p{L}$/u.test(c) || essayees.includes(c)) return;
    const nouv = [...essayees, c];
    setEssayees(nouv);
    if (dansLeMot.has(c)) {
      sfx.play('pop');
      if (ls.every((ch) => !estLettre(ch) || nouv.includes(cleDe(ch)))) {
        session.answer(item, true, item.word, item.word);
        setSauves((s) => s + 1);
        setEtape('trouve');
        sfx.play('fanfare');
      }
    } else {
      const e = erreurs + 1;
      setErreurs(e);
      sfx.play('glisse');
      vibrate(40);
      if (e >= maxGouttes) {
        const donne = ls.map((ch) => (revelee(ch) ? ch : '?')).join('');
        session.answer(item, false, donne, item.word);
        setEtape('fondu');
        void speech.speak(`Oh, le bonhomme a fondu ! Le mot était : ${item.word}`);
      }
    }
  };

  const suivant = useCallback(() => {
    if (manche >= total) {
      setEtape('fini');
      session.end({
        won: sauves >= Math.ceil(total / 2),
        headline: `${sauves} bonhomme${sauves > 1 ? 's' : ''} de neige sauvé${sauves > 1 ? 's' : ''} sur ${total} !`,
        delayMs: 600,
      });
      return;
    }
    const it = tirer();
    setItem(it);
    setManche((m) => m + 1);
    setEssayees(lettresDonnees(it.word, level));
    setErreurs(0);
    setEcoutes(0);
    setDefinitionVue(level === 'facile');
    setEtape('jeu');
  }, [manche, total, sauves, session, tirer, level]);

  usePhysicalKeyboard(
    {
      onKey: proposer,
      onDelete: () => {},
      onSubmit: () => {
        if (etape === 'trouve' || etape === 'fondu') suivant();
      },
      disabled: paused || etape === 'fini',
    },
    TOUCHES_LETTRES,
  );

  const etats = useMemo(() => {
    const m = new Map<string, EtatTouche>();
    for (const c of essayees) m.set(c, dansLeMot.has(c) ? 'bien' : 'absent');
    return m;
  }, [essayees, dansLeMot]);

  const fonte = etape === 'fondu' ? 1 : erreurs / maxGouttes;
  const gouttesRestantes = Math.max(0, maxGouttes - erreurs);
  const aDefinition = !!item.definition && level !== 'plus_loin';

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row">
      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[44%] lg:self-start"
        aria-label={
          etape === 'trouve'
            ? 'Le soleil se couche : le bonhomme de neige est sauvé !'
            : `Bonhomme de neige : encore ${gouttesRestantes} lettre${gouttesRestantes > 1 ? 's' : ''} fausse${gouttesRestantes > 1 ? 's' : ''} avant de fondre`
        }
      >
        <SceneBonhomme fonte={fonte} sauve={etape === 'trouve'} />
        <div className="absolute left-2 top-2 flex flex-wrap gap-2">
          <Hud>
            Mot {manche} / {total}
          </Hud>
          <Hud>⛄ {sauves}</Hud>
        </div>
        <div
          className="absolute bottom-2 left-2 flex gap-0.5 rounded-full bg-white/85 px-3 py-1"
          aria-hidden
          title="Gouttes avant de fondre"
        >
          {Array.from({ length: maxGouttes }, (_, i) => (
            <span key={i} className={i < erreurs ? 'opacity-25 grayscale' : ''}>
              ❄️
            </span>
          ))}
        </div>
      </section>

      <section className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <SpeakButton
            text="Touche une lettre. Si elle est dans le mot, elle apparaît. Sinon, le bonhomme fond un peu."
            label="Écouter la consigne"
            size={44}
          />
          <BoutonEntendre
            speech={speech}
            item={item}
            restants={ECOUTES[level] - ecoutes}
            onUse={() => setEcoutes((e) => e + 1)}
            disabled={paused || etape !== 'jeu'}
          />
          {aDefinition && !definitionVue && (
            <Button variant="grape" icon={<BookOpen aria-hidden />} onClick={() => setDefinitionVue(true)}>
              Indice
            </Button>
          )}
          <BadgeParents item={item} />
        </div>

        {aDefinition && definitionVue && (
          <div className="flex items-center gap-2 rounded-2xl bg-grape/10 px-4 py-2">
            <SpeakButton text={item.definition!} size={36} label="Écouter l’indice" />
            <p className="font-bold">Indice : {item.definition}</p>
          </div>
        )}

        {/* Le mot à deviner */}
        <div
          className="flex max-w-full flex-wrap justify-center gap-1.5"
          aria-label={`Mot à deviner : ${ls.map((ch) => (revelee(ch) || etape === 'fondu' ? ch : 'tiret')).join(' ')}`}
          role="img"
        >
          {ls.map((ch, i) => {
            const vue = revelee(ch);
            const montree = vue || etape === 'fondu';
            if (!estLettre(ch))
              return (
                <span
                  key={i}
                  className="flex h-14 w-5 items-end justify-center font-titre text-3xl font-extrabold"
                >
                  {ch}
                </span>
              );
            return (
              <span
                key={i}
                className={`relative flex h-14 items-end justify-center pb-1.5 font-titre font-extrabold ${
                  ls.length > 7 ? 'w-8 text-2xl sm:w-11 sm:text-4xl' : 'w-10 text-3xl sm:w-12 sm:text-4xl'
                } ${etape === 'trouve' ? 'text-grass-dark' : ''}`}
              >
                <span
                  className={`absolute bottom-0 left-0.5 right-0.5 h-1 rounded-full ${etape === 'trouve' ? 'bg-grass' : 'bg-ink/40'}`}
                  aria-hidden
                />
                <AnimatePresence>
                  {montree && (
                    <motion.span
                      initial={{ y: -16, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={!vue ? 'rounded bg-grass/40 px-0.5 text-grass-dark' : ''}
                    >
                      {ch}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            );
          })}
        </div>

        {etape === 'jeu' && (
          <p className="text-ink-soft" aria-live="polite">
            Encore {gouttesRestantes} erreur{gouttesRestantes > 1 ? 's' : ''} possible
            {gouttesRestantes > 1 ? 's' : ''} avant que le bonhomme fonde.
          </p>
        )}

        {etape === 'trouve' && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-2 text-center"
            role="status"
          >
            <p className="font-titre text-2xl font-extrabold text-grass-dark">
              Bravo ! Le soleil se couche : le bonhomme est sauvé !
            </p>
            <div className="flex items-center gap-2">
              <span className="font-titre text-3xl font-extrabold">{item.word}</span>
              <SpeakButton text={item.word} size={40} label={`Écouter : ${item.word}`} />
            </div>
            <Button variant="grass" onClick={suivant} autoFocus>
              {manche >= total ? 'Voir mon score' : 'Mot suivant'}
            </Button>
          </motion.div>
        )}

        {etape === 'fondu' && (
          <CorrectionMot
            donne={null}
            attendu={item.word}
            message="Oh, le bonhomme a fondu… Il reviendra avec la prochaine neige !"
            explication={item.explication}
            onContinue={suivant}
            libelleContinuer={manche >= total ? 'Voir mon score' : 'Nouveau bonhomme'}
          />
        )}

        {etape === 'jeu' && (
          <ClavierLettres
            onKey={proposer}
            etats={etats}
            accents={false}
            desactiverUtilises
            disabled={paused}
          />
        )}
      </section>
    </div>
  );
}
