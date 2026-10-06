/**
 * Le Conseil de la classe (CATALOGUE n° 54) — EMC.
 * Une situation de vie est racontée au conseil ; on choisit la réponse la plus respectueuse
 * (ou on dit si une affirmation est vraie ou fausse). Pas de note humiliante : après chaque réponse,
 * le conseil discute (« Pourquoi ? ») avec l'explication, et l'arbre de la classe gagne une feuille
 * à chaque bonne réponse (il n'en perd jamais).
 * Facile : 2 propositions, la discussion se lit toute seule. Normal : toutes les propositions,
 * 1 « conseil d'un ami » (retire une mauvaise proposition) pour la partie. Plus loin : plus de
 * situations, sans aide.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HandHelping, MessageCircleQuestion, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level, McqItem, TrueFalseItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { parNiveau, useGameSession } from '../_kit/session';
import { ChoiceGrid, Hud } from '../_kit/ui';
import { useRng } from '../_monde-commun/hooks';
import { insecable, reduireChoix } from '../_monde-commun/outils';
import { Bulle, EtatVide } from '../_monde-commun/ui';
import { useVoixEnPause } from '../_orthographe-commun/hooks';
import { estSituation } from './filtre';
import { ConseilScene } from './Scene';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
const NB_CHOIX: Record<Level, number> = { facile: 2, normal: 6, plus_loin: 6 };
const CONSEILS: Record<Level, number> = { facile: 0, normal: 1, plus_loin: 0 };

type Situation =
  | { type: 'qcm'; item: McqItem; choices: string[]; answerIndex: number }
  | { type: 'vf'; item: TrueFalseItem };

export default function ConseilClasse({
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
  const reduce = !!useReducedMotion();
  const rng = useRng();
  const dernier = useRef<string | null>(null);

  const tirer = useCallback((): Situation | null => {
    const essais = Math.max(12, Math.min(60, (stream.size ?? 20) * 2));
    let it: Item | null = null;
    for (let i = 0; i < essais; i++) {
      const x = stream.next();
      if (!estSituation(x)) continue;
      it = x;
      if (x.id !== dernier.current || (stream.size ?? 2) < 2) break;
    }
    if (!it) return null;
    dernier.current = it.id;
    if (it.kind === 'true_false') return { type: 'vf', item: it };
    const m = it as McqItem;
    return { type: 'qcm', item: m, ...reduireChoix(m, Math.min(NB_CHOIX[level], m.choices.length), rng) };
  }, [stream, level, rng]);

  const [s, setS] = useState<Situation | null>(tirer);
  const [manche, setManche] = useState(1);
  const [etat, setEtat] = useState<'juste' | 'faux' | null>(null);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [pourquoi, setPourquoi] = useState(false);
  const [retires, setRetires] = useState<number[]>([]);
  const [conseils, setConseils] = useState(CONSEILS[level]);
  const [feuilles, setFeuilles] = useState(0);
  const [fini, setFini] = useState(false);
  const orateur = (manche - 1) % 4;

  const enonce = s ? (s.type === 'qcm' ? s.item.question : s.item.statement) : '';
  const texte = s
    ? s.type === 'qcm'
      ? `${s.item.spoken ?? enonce} ${s.choices.map((c, i) => `${'ABCDEF'[i]} : ${c}.`).join(' ')}`
      : `${s.item.spoken ?? enonce} Vrai ou faux ?`
    : '';

  useEffect(() => {
    session.startQuestion();
    if (lectureAuto && s) void speech.speak(texte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const repondre = useCallback(
    (juste: boolean, donne: string, attendu: string, idx: number | null) => {
      if (!s || etat || paused || fini) return;
      session.answer(s.item, juste, donne, attendu);
      setChoisi(idx);
      setEtat(juste ? 'juste' : 'faux');
      // la discussion s'ouvre toute seule en Facile et après une erreur
      const ouvrir = level === 'facile' || !juste;
      setPourquoi(ouvrir);
      if (juste) {
        sfx.play('etoile');
        setFeuilles((f) => f + 1);
      } else {
        sfx.play('pop');
      }
      if (ouvrir)
        void speech.speak(
          `${juste ? 'Bravo !' : `On en discute : la meilleure réponse est ${attendu}.`} ${s.item.explication}`,
        );
    },
    [s, etat, paused, fini, session, level, sfx, speech],
  );

  const choisirQcm = useCallback(
    (i: number) => {
      if (!s || s.type !== 'qcm' || retires.includes(i)) return;
      repondre(i === s.answerIndex, s.choices[i]!, s.choices[s.answerIndex]!, i);
    },
    [s, retires, repondre],
  );

  const choisirVf = useCallback(
    (v: boolean) => {
      if (!s || s.type !== 'vf') return;
      repondre(v === s.item.answer, v ? 'vrai' : 'faux', s.item.answer ? 'vrai' : 'faux', v ? 0 : 1);
    },
    [s, repondre],
  );

  // Clavier pour vrai / faux : V, F, flèches
  useEffect(() => {
    if (!s || s.type !== 'vf' || etat || paused || fini) return;
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'v' || e.key === 'ArrowRight') {
        e.preventDefault();
        choisirVf(true);
      } else if (k === 'f' || e.key === 'ArrowLeft') {
        e.preventDefault();
        choisirVf(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [s, etat, paused, fini, choisirVf]);

  const conseil = () => {
    if (!s || s.type !== 'qcm' || conseils <= 0 || etat) return;
    const mauvaises = s.choices.map((_, i) => i).filter((i) => i !== s.answerIndex && !retires.includes(i));
    if (mauvaises.length <= 1) return;
    setRetires((r) => [...r, rng.pick(mauvaises)]);
    setConseils((c) => c - 1);
    sfx.play('pop');
  };

  const suivant = useCallback(() => {
    if (fini) return;
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      session.end({
        won: feuilles >= Math.ceil(total / 2),
        headline: `L’arbre de la classe a ${feuilles} feuille${feuilles > 1 ? 's' : ''} !`,
        score: feuilles * 100,
      });
      return;
    }
    setS(tirer());
    setManche((m) => m + 1);
    setEtat(null);
    setChoisi(null);
    setPourquoi(false);
    setRetires([]);
  }, [fini, manche, total, feuilles, session, sfx, tirer]);

  // Entrée : continuer après la discussion
  useEffect(() => {
    if (!etat || paused) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!pourquoi) setPourquoi(true);
        else suivant();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [etat, paused, pourquoi, suivant]);

  const choix = useMemo(
    () => (s?.type === 'qcm' ? s.choices.map((c, i) => (retires.includes(i) ? `— ${c}` : c)) : []),
    [s, retires],
  );

  if (!s) {
    return (
      <EtatVide
        icone="🤝"
        jeu="Le Conseil de la classe"
        besoin="de situations ou d’affirmations à discuter"
      />
    );
  }

  const bonne = s.type === 'qcm' ? s.choices[s.answerIndex]! : s.item.answer ? 'C’est vrai.' : 'C’est faux.';

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <Hud>
          Situation {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🌳</span> {feuilles} feuille{feuilles > 1 ? 's' : ''}
        </Hud>
      </div>
      <section
        className="mx-auto w-full max-w-3xl overflow-hidden rounded-card border-4 border-white shadow-soft"
        aria-label={`L’arbre de la classe a ${feuilles} feuille${feuilles > 1 ? 's' : ''}`}
      >
        <ConseilScene
          orateur={orateur}
          humeur={etat === 'juste' ? 'content' : etat ? 'pense' : 'calme'}
          feuilles={feuilles}
          maxFeuilles={total}
          reduce={reduce}
        />
      </section>

      <section className="carte flex w-full flex-col items-center gap-4 p-4 sm:p-6">
        <Bulle className="w-full border-2 border-emc/30">
          <div className="flex items-start gap-3">
            {s.item.image && (
              <span className="text-5xl leading-none" aria-hidden>
                {s.item.image}
              </span>
            )}
            <p
              className="flex-1 font-titre text-xl font-extrabold leading-snug sm:text-2xl"
              aria-live="polite"
            >
              {insecable(enonce)}
            </p>
            <SpeakButton text={texte} label="Écouter la situation" />
          </div>
        </Bulle>

        {s.type === 'qcm' ? (
          <>
            <ChoiceGrid
              choices={choix}
              onPick={choisirQcm}
              reveal={etat ? { correct: s.answerIndex, chosen: choisi } : null}
              disabled={paused || fini}
            />
            {conseils > 0 && !etat && s.choices.length - retires.length > 2 && (
              <Button variant="sun" icon={<HandHelping aria-hidden />} onClick={conseil} disabled={paused}>
                Le conseil d’un ami
              </Button>
            )}
          </>
        ) : (
          <div className="grid w-full grid-cols-2 gap-3">
            {[true, false].map((v) => {
              const bon = s.item.answer === v;
              const pris = choisi === (v ? 0 : 1);
              const style = !etat
                ? ''
                : bon
                  ? 'ring-4 ring-grass bg-grass/20'
                  : pris
                    ? 'ring-4 ring-coral bg-coral/15'
                    : 'opacity-50';
              return (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => choisirVf(v)}
                  disabled={!!etat || paused || fini}
                  className={`btn-3d flex min-h-[4.5rem] items-center justify-center gap-2 bg-card text-xl font-extrabold ${style}`}
                >
                  {v ? (
                    <ThumbsUp className="text-grass-dark" aria-hidden />
                  ) : (
                    <ThumbsDown className="text-coral-dark" aria-hidden />
                  )}
                  {v ? 'C’est vrai' : 'C’est faux'}
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {etat && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`w-full rounded-2xl p-4 ${etat === 'juste' ? 'bg-grass/15' : 'bg-sun/20'}`}
              role="status"
            >
              <p className="font-titre text-xl font-extrabold">
                {etat === 'juste'
                  ? 'Bravo ! Le conseil est d’accord avec toi. 🌱'
                  : 'Presque ! On en discute ensemble.'}
              </p>
              {etat === 'faux' && (
                <p className="mt-1 text-lg font-bold">
                  La réponse la plus juste : <span className="text-grass-dark">{bonne}</span>
                </p>
              )}
              {pourquoi ? (
                <div className="mt-2 flex items-start gap-2">
                  <SpeakButton text={s.item.explication} size={40} label="Écouter l’explication" />
                  <p>
                    <strong>Pourquoi ? </strong>
                    {s.item.explication}
                  </p>
                </div>
              ) : (
                <Button
                  variant="blanc"
                  className="mt-3"
                  icon={<MessageCircleQuestion aria-hidden />}
                  onClick={() => {
                    setPourquoi(true);
                    void speech.speak(s.item.explication);
                  }}
                >
                  Pourquoi ?
                </Button>
              )}
              {pourquoi && (
                <Button variant="grass" className="mt-3 w-full" onClick={suivant} disabled={paused} autoFocus>
                  Continuer
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
