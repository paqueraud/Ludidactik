/**
 * Les Crocodiles gloutons (CATALOGUE n°9).
 * Deux nombres sur des nénuphars ; le crocodile ouvre toujours la gueule vers le plus grand.
 * On touche le nombre à croquer (ou « = »), le crocodile se tourne et croque : le signe < ou > apparaît.
 * Items : QCM `choices ⊂ ['<','=','>']` + `meta.gauche` / `meta.droite`. Repli : un calcul comparé à un
 * nombre proche (« 7 × 8 ○ 54 »).
 * Facile : pas de chrono, aide « tableau de numération » (chiffres alignés). Normal : chrono doux, aide
 * sur demande. Plus loin : chrono serré, sans aide.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level } from '@/content/schemas';
import { formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import type { Rng } from '@/engine/rng';
import { useGameSession } from '@/games/_kit/session';
import { Hud } from '@/games/_kit/ui';
import { vibrate } from '@/services/sfx';
import { bravo, dansUnChamp, direNombre, tirer, useBoucle, useRng } from '../_nombres-commun/outils';
import { Bandeau, BarreTemps, Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { Crocodile, type Sens } from './Crocodile';

type Signe = '<' | '=' | '>';
const MANCHES: Record<Level, number> = { facile: 8, normal: 10, plus_loin: 12 };
const CHRONO: Record<Level, number | null> = { facile: null, normal: 15, plus_loin: 8 };

interface Comparaison {
  item: Item;
  gauche: string;
  droite: string;
  bonne: Signe;
  /** Signes autorisés (un QCM peut ne proposer que < et >). */
  signes: Signe[];
  aDire: string;
  explication: string;
}

const lire = (s: string) => s.replace(/,/g, ' virgule ').replace(/\//g, ' sur ');

function depuisItem(it: Item, rng: Rng): Comparaison | null {
  if (it.kind === 'mcq') {
    const g = it.meta?.gauche;
    const d = it.meta?.droite;
    if (typeof g !== 'string' || typeof d !== 'string') return null;
    if (!it.choices.every((c) => c === '<' || c === '=' || c === '>')) return null;
    return {
      item: it,
      gauche: g,
      droite: d,
      bonne: it.choices[it.answerIndex] as Signe,
      signes: it.choices as Signe[],
      aDire: it.spoken ?? `Compare ${lire(g)} et ${lire(d)}.`,
      explication: it.explication,
    };
  }
  if (it.kind === 'numeric_answer') {
    if (/[=?…_]/.test(it.prompt)) return null; // énoncé à trou : pas une expression simple
    const a = it.answer;
    const pas = it.decimals > 0 ? 10 ** -it.decimals : 1;
    const r = rng.next();
    const ecart = rng.pick([1, 2, 10]) * pas;
    const v = r < 0.3 ? a : r < 0.65 ? a + ecart : Math.max(0, a - ecart);
    const valeur = Math.round(v * 1000) / 1000;
    const bonne: Signe = a < valeur ? '<' : a > valeur ? '>' : '=';
    const droite = formatNumber(valeur);
    const gaucheAGauche = rng.chance(0.5);
    const signeFinal: Signe = gaucheAGauche ? bonne : bonne === '<' ? '>' : bonne === '>' ? '<' : '=';
    return {
      item: it,
      gauche: gaucheAGauche ? it.prompt : droite,
      droite: gaucheAGauche ? droite : it.prompt,
      bonne: signeFinal,
      signes: ['<', '=', '>'],
      aDire: gaucheAGauche
        ? `Compare ${it.spoken} et ${direNombre(valeur)}.`
        : `Compare ${direNombre(valeur)} et ${it.spoken}.`,
      explication: it.explication.includes(formatNumber(a))
        ? it.explication
        : `${it.prompt} = ${formatNumber(a)}. ${it.explication}`,
    };
  }
  return null;
}

const propre = (s: string) => s.replace(/[\s  ]/g, '');
/** Deux écritures décimales simples (l'aide d'alignement a du sens). */
const alignable = (g: string, d: string) => [g, d].every((s) => /^\d+(,\d+)?$/.test(propre(s)));

/** Aide : chiffres alignés comme dans un tableau de numération (seulement pour deux nombres décimaux simples). */
function Alignement({ gauche, droite }: { gauche: string; droite: string }) {
  if (!alignable(gauche, droite)) return null;
  const [ge = '', gd = ''] = propre(gauche).split(',');
  const [de = '', dd = ''] = propre(droite).split(',');
  const nE = Math.max(ge.length, de.length);
  const nD = Math.max(gd.length, dd.length);
  const ligne = (e: string, d: string) => [
    ...Array.from({ length: nE - e.length }, () => ''),
    ...e.split(''),
    ...(nD ? [','] : []),
    ...d.split(''),
    ...Array.from({ length: nD - d.length }, () => ''),
  ];
  const couleurs = ['bg-sky/25', 'bg-grass/25', 'bg-sun/30', 'bg-coral/20', 'bg-grape/20'];
  const rang = (i: number) => {
    if (i < nE) return nE - 1 - i; // rang des unités = 0
    return -1;
  };
  return (
    <div className="flex flex-col items-center gap-1" aria-label="Aide : les chiffres alignés par rang">
      <p className="text-sm font-bold text-ink-soft">Compare rang par rang, en partant de la gauche :</p>
      {[ligne(ge, gd), ligne(de, dd)].map((l, k) => (
        <div key={k} className="flex gap-1">
          {l.map((c, i) => (
            <span
              key={i}
              className={`flex h-9 w-7 items-center justify-center rounded-lg font-titre text-xl font-bold ${
                c === ',' ? '' : rang(i) >= 0 ? couleurs[rang(i) % couleurs.length] : 'bg-ink/10'
              }`}
            >
              {c}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Crocodiles({
  level,
  stream,
  target,
  lectureAuto,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
}: GameProps) {
  const rng = useRng();
  const { stats, answer, startQuestion, end } = useGameSession({ paused, onAnswer, onEnd });
  const N = MANCHES[level];

  const nouvelle = useCallback((): Comparaison | null => {
    for (let i = 0; i < 40; i++) {
      const it = tirer(
        stream,
        target(),
        (x): x is Item => x.kind === 'mcq' || x.kind === 'numeric_answer',
        1,
      );
      const c = it && depuisItem(it, rng);
      if (c) return c;
    }
    return null;
  }, [stream, target, rng]);

  const [q, setQ] = useState(() => nouvelle());
  const [manche, setManche] = useState(1);
  const [choix, setChoix] = useState<Signe | null>(null);
  const [etat, setEtat] = useState<'jeu' | 'juste' | 'faux' | 'fin'>('jeu');
  const [aide, setAide] = useState(level === 'facile');
  const [message, setMessage] = useState('');
  const [reste, setReste] = useState(1);
  const verrou = useRef(false);
  const score = useRef(0);

  useEffect(() => {
    if (!q) return;
    startQuestion();
    setReste(1);
    if (lectureAuto && !paused) void speech.speak(q.aDire);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const repondre = useCallback(
    (s: Signe | null) => {
      if (!q || etat !== 'jeu' || paused || verrou.current) return;
      if (s && !q.signes.includes(s)) return;
      verrou.current = true;
      const juste = s === q.bonne;
      setChoix(s);
      answer(q.item, juste, s ?? '(temps écoulé)', q.bonne);
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
    [q, etat, paused, answer, reste, sfx, rng],
  );

  const chrono = CHRONO[level];
  useBoucle(!!chrono && etat === 'jeu' && !paused && !!q, (dt) => {
    setReste((r) => {
      const n = r - dt / chrono!;
      return n <= 0 ? 0 : n;
    });
  });
  useEffect(() => {
    if (reste <= 0 && etat === 'jeu') repondre(null);
  }, [reste, etat, repondre]);

  const suivant = useCallback(() => {
    if (manche >= N) {
      setEtat('fin');
      const reussi = stats.correct >= Math.ceil(N * 0.6);
      sfx.play(reussi ? 'fanfare' : 'etoile');
      end({
        won: reussi,
        headline: reussi
          ? 'Les crocodiles sont repus ! 🐊'
          : `${stats.correct} bonnes comparaisons sur ${N} !`,
        score: score.current,
        delayMs: 1000,
      });
      return;
    }
    setQ(nouvelle());
    setManche((m) => m + 1);
    setChoix(null);
    setMessage('');
    setAide(level === 'facile');
    verrou.current = false;
    setEtat('jeu');
  }, [manche, N, stats.correct, sfx, end, nouvelle, level]);

  useEffect(() => {
    if (etat !== 'juste') return;
    const t = setTimeout(suivant, 1100);
    return () => clearTimeout(t);
  }, [etat, suivant]);

  // Clavier : ← (croque à gauche : >), → (croque à droite : <), = ; ou directement < et >
  useEffect(() => {
    if (etat !== 'jeu' || paused) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      const m: Record<string, Signe> = { ArrowLeft: '>', ArrowRight: '<', '=': '=', '<': '<', '>': '>' };
      const s = m[e.key];
      if (s) {
        e.preventDefault();
        repondre(s);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [etat, paused, repondre]);

  if (!q) {
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de comparaisons pour les crocodiles."
        onFin={() => end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const montre = etat === 'jeu' ? null : etat === 'faux' ? q.bonne : choix;
  const sens: Sens =
    montre === '>' ? 'gauche' : montre === '<' ? 'droite' : montre === '=' ? 'egal' : 'attend';
  const croque = etat === 'juste';
  const taillePolice = (s: string) =>
    s.length > 9 ? 'text-base sm:text-2xl' : s.length > 5 ? 'text-xl sm:text-3xl' : 'text-3xl sm:text-4xl';

  const nenuphar = (texte: string, cote: 'gauche' | 'droite') => {
    const signe: Signe = cote === 'gauche' ? '>' : '<';
    const mange = croque && sens === cote;
    return (
      <motion.button
        key={cote}
        type="button"
        onClick={() => repondre(signe)}
        disabled={etat !== 'jeu' || paused || !q.signes.includes(signe)}
        className="relative flex min-h-[96px] min-w-0 flex-1 items-center justify-center rounded-[50%] px-2 focus-visible:outline focus-visible:outline-4 focus-visible:outline-sun"
        style={{
          background: 'radial-gradient(circle at 40% 35%, #8EE08A 0 40%, #5DBB63 70%, #3E9B45 100%)',
          boxShadow: '0 8px 0 rgba(30,90,60,0.35)',
        }}
        aria-label={`${texte} : le crocodile croque ce nombre`}
        animate={mange ? { scale: [1, 0.85, 1] } : { scale: 1 }}
        whileTap={{ scale: 0.95 }}
      >
        <span
          className={`whitespace-nowrap rounded-2xl bg-white/95 px-2 py-1 text-center font-titre font-extrabold text-ink shadow-pop-sm sm:px-3 ${taillePolice(texte)}`}
        >
          {texte}
        </span>
      </motion.button>
    );
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          🐊 {Math.min(manche, N)} / {N}
        </Hud>
        <Hud>✅ {stats.correct}</Hud>
      </Bandeau>

      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft"
        aria-label="Le marais des crocodiles"
        style={{ background: 'linear-gradient(180deg,#BFEFFF 0%,#8FD6E8 40%,#4FB0C6 41%,#3C97B0 100%)' }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 400 260"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <path d="M0 106 Q 50 80 100 100 T 200 96 T 300 102 T 400 94 L400 108 L0 108 Z" fill="#7CC77F" />
          {[30, 70, 330, 370].map((x, i) => (
            <g key={x}>
              <rect x={x} y={40 + i * 6} width="4" height="70" fill="#5E9441" />
              <ellipse cx={x + 2} cy={40 + i * 6} rx="5" ry="14" fill="#8B5A2B" />
            </g>
          ))}
          {[60, 140, 250, 330].map((x, i) => (
            <ellipse key={x} cx={x} cy={150 + (i % 2) * 60} rx="26" ry="4" fill="#fff" opacity="0.25" />
          ))}
        </svg>

        <div className="relative flex flex-col items-center gap-2 px-3 pb-4 pt-3">
          <div className="flex items-center gap-2 rounded-full bg-white/90 py-1 pl-1 pr-4 shadow-pop-sm">
            <SpeakButton text={q.aDire} label="Écouter la comparaison" size={40} />
            <span className="font-bold">Qui le crocodile va-t-il croquer ?</span>
          </div>

          <div className="flex w-full items-center gap-2 pt-6 sm:gap-4">
            {nenuphar(q.gauche, 'gauche')}
            <div className="flex w-[100px] shrink-0 flex-col items-center sm:w-[220px]">
              <Crocodile sens={sens} croque={croque} />
              <AnimatePresence>
                {montre && (
                  <motion.span
                    key={montre}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`-mt-2 flex h-14 w-14 items-center justify-center rounded-full font-titre text-4xl font-extrabold shadow-pop ${
                      etat === 'faux' ? 'bg-grass text-white' : 'bg-sun text-ink'
                    }`}
                    aria-label={`Signe : ${montre === '<' ? 'plus petit que' : montre === '>' ? 'plus grand que' : 'égal'}`}
                  >
                    {montre}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {nenuphar(q.droite, 'droite')}
          </div>

          <div className="mt-2 flex gap-3">
            {(['<', '=', '>'] as Signe[])
              .filter((s) => q.signes.includes(s))
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => repondre(s)}
                  disabled={etat !== 'jeu' || paused}
                  className="btn-3d flex h-16 w-16 items-center justify-center bg-card font-titre text-4xl font-extrabold"
                  aria-label={s === '<' ? 'plus petit que' : s === '>' ? 'plus grand que' : 'égal'}
                >
                  {s}
                </button>
              ))}
          </div>
          <p className="min-h-[1.75rem] font-titre text-xl font-extrabold text-grass-dark" aria-live="polite">
            {etat === 'juste' ? message : ''}
          </p>
        </div>
      </section>

      {chrono && etat === 'jeu' && (
        <div className="flex justify-center">
          <BarreTemps reste={reste} />
        </div>
      )}

      {(etat === 'faux' || level !== 'plus_loin') &&
        (alignable(q.gauche, q.droite) || level === 'facile' || etat === 'faux') && (
          <div className="carte flex flex-col items-center gap-3 p-4">
            {!alignable(q.gauche, q.droite) ? null : aide ? (
              <Alignement gauche={q.gauche} droite={q.droite} />
            ) : (
              level === 'normal' &&
              etat === 'jeu' && (
                <Button variant="blanc" onClick={() => setAide(true)}>
                  💡 Aide
                </Button>
              )
            )}
            {level === 'facile' && (
              <p className="text-center text-sm font-bold text-ink-soft">
                Le crocodile a toujours faim : sa gueule s’ouvre vers le plus grand. Si les deux sont égaux,
                choisis « = ».
              </p>
            )}
            <Correction
              ouvert={etat === 'faux'}
              titre={choix === null ? 'Le temps est écoulé !' : 'Presque !'}
              bonne={`${q.gauche} ${q.bonne} ${q.droite}`.replace(/ /g, ' ')}
              aDire={`La bonne réponse est : ${lire(q.gauche)} ${q.bonne === '<' ? 'est plus petit que' : q.bonne === '>' ? 'est plus grand que' : 'est égal à'} ${lire(q.droite)}. ${q.explication}`}
              explication={q.explication}
              onContinuer={suivant}
            />
          </div>
        )}
    </div>
  );
}
