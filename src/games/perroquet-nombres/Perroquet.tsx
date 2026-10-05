/**
 * Le Perroquet des nombres (CATALOGUE n°5) — dictée de nombres.
 * Le perroquet dit un nombre (synthèse vocale) ; l'enfant l'écrit en chiffres. Mode inverse : le nombre
 * est affiché, on choisit son écriture en lettres (pièges : « vingts », « cents », « mille », « et »).
 * Items : `numeric_answer` (`meta.dictee` ou leçons NUM.ECRIRE / NUM.GRANDS), et `fill_blank` / `mcq`
 * avec `meta.lettres`.
 * Facile : voix lente, réécoute illimitée, cases qui montrent le nombre de chiffres. Normal : 3 réécoutes,
 * un mode inverse de temps en temps. Plus loin : une seule réécoute, voix normale, plus de mode inverse.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keypad, LetterKeyboard, usePhysicalKeyboard } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level } from '@/content/schemas';
import { acceptedSpellings, checkNumeric, formatNumber, normalizeText } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { nombreEnLettres } from '@/engine/nombres';
import { useGameSession } from '@/games/_kit/session';
import { ChoiceGrid, Hud } from '@/games/_kit/ui';
import { vibrate } from '@/services/sfx';
import { bravo, direNombre, tirer, useRng } from '../_nombres-commun/outils';
import { Bandeau, CaseReponse, Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { useSaisieNumerique } from '../_nombres-commun/useSaisieNumerique';
import { propositionsLettres } from './lettres';

const MANCHES: Record<Level, number> = { facile: 6, normal: 10, plus_loin: 12 };
const REECOUTES: Record<Level, number> = { facile: Infinity, normal: 3, plus_loin: 1 };
const DEBIT: Record<Level, number> = { facile: 0.7, normal: 0.85, plus_loin: 1 };
const PLUMES = ['#FF5A4E', '#FFD45C', '#4FC3F7', '#7BD389', '#8E7CFF', '#FF9DD2'];

type Question =
  | { mode: 'dictee'; item: Item & { kind: 'numeric_answer' }; aDire: string }
  | {
      mode: 'choix';
      item: Item;
      texte: string;
      aDire: string;
      choix: string[];
      bonne: number;
      explication: string;
    }
  | { mode: 'ecrire'; item: Item & { kind: 'fill_blank' }; texte: string; aDire: string; acceptes: string[] };

/** « 312 s'écrit « trois-cent-douze » (ou « trois cent douze »). » — calculé, jamais écrit en dur. */
function ecritureLettres(n: number): string | null {
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999) return null;
  const [rect, trad] = [nombreEnLettres(n, 'rectifiee'), nombreEnLettres(n, 'traditionnelle')];
  return `${formatNumber(n)} s’écrit « ${rect} »${trad !== rect ? ` (ou « ${trad} »)` : ''}.`;
}

function Perroquet({ parle, content }: { parle: boolean; content: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 220 260"
      className="h-full w-auto"
      aria-hidden
      animate={!reduce && content ? { y: [0, -16, 0], rotate: [0, -4, 4, 0] } : { y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* perchoir */}
      <rect x="20" y="214" width="180" height="12" rx="6" fill="#8D5A3B" />
      <rect x="104" y="226" width="12" height="34" fill="#6D4C2F" />
      {/* queue */}
      <path d="M96 190 L 70 252 L 92 248 L 104 196 Z" fill="#4FC3F7" />
      <path d="M108 192 L 104 258 L 124 250 L 118 194 Z" fill="#FFD45C" />
      {/* corps */}
      <ellipse cx="112" cy="150" rx="46" ry="62" fill="#FF5A4E" />
      <ellipse cx="120" cy="160" rx="26" ry="40" fill="#FF8A6B" />
      {/* aile */}
      <motion.path
        d="M76 120 C 60 160 70 200 100 206 C 96 170 98 140 92 116 Z"
        fill="#2FA5E0"
        style={{ originX: '90px', originY: '120px' }}
        animate={!reduce && content ? { rotate: [0, -30, 0, -30, 0] } : { rotate: 0 }}
        transition={{ duration: 0.8 }}
      />
      <path
        d="M80 150 C 74 170 80 190 96 198"
        stroke="#7BD389"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      {/* pattes */}
      <path d="M100 206 l -6 12 M 124 206 l 6 12" stroke="#5A5A5A" strokeWidth="6" strokeLinecap="round" />
      {/* tête */}
      <circle cx="128" cy="78" r="38" fill="#FF5A4E" />
      <ellipse cx="140" cy="76" rx="18" ry="16" fill="#FFF3E6" />
      <circle cx="142" cy="74" r="7" fill="#24304A" />
      <circle cx="144" cy="71" r="2.5" fill="#fff" />
      {/* bec (deux mâchoires) */}
      <motion.path
        d="M156 74 C 186 70 194 92 176 106 C 174 94 166 86 156 88 Z"
        fill="#3A3A3A"
        style={{ originX: '158px', originY: '82px' }}
        animate={!reduce && parle ? { rotate: [0, -10, 0] } : { rotate: 0 }}
        transition={{ duration: 0.3, repeat: parle ? Infinity : 0 }}
      />
      <motion.path
        d="M156 92 C 166 92 172 98 172 106 C 164 108 158 102 156 96 Z"
        fill="#5A5A5A"
        style={{ originX: '158px', originY: '94px' }}
        animate={!reduce && parle ? { rotate: [0, 16, 0] } : { rotate: 0 }}
        transition={{ duration: 0.3, repeat: parle ? Infinity : 0 }}
      />
      {/* huppe */}
      <path d="M110 44 C 100 20 118 18 122 40 C 124 18 142 20 132 44 Z" fill="#FFD45C" />
    </motion.svg>
  );
}

/** Cases d'aide : autant de cases que de chiffres attendus, groupées par 3 (classes). */
function CasesChiffres({ n, saisie }: { n: number; saisie: string }) {
  const ent = String(Math.trunc(Math.abs(n)));
  const dec = String(n).includes('.') ? String(n).split('.')[1]! : '';
  const brut = saisie.replace(/[\s  ]/g, '');
  const [se = '', sd = ''] = brut.split(',');
  return (
    <div
      className="flex items-end justify-center gap-1"
      aria-label={`Le nombre a ${ent.length + dec.length} chiffres`}
    >
      {ent.split('').map((_, i) => (
        <span
          key={`e${i}`}
          className={`flex h-10 w-7 items-center justify-center rounded-lg border-2 border-dashed border-sky font-titre text-xl font-bold ${
            (ent.length - i) % 3 === 0 && i > 0 ? 'ml-2' : ''
          }`}
        >
          {se[i] ?? ''}
        </span>
      ))}
      {dec && <span className="font-titre text-2xl font-bold">,</span>}
      {dec.split('').map((_, i) => (
        <span
          key={`d${i}`}
          className="flex h-10 w-7 items-center justify-center rounded-lg border-2 border-dashed border-grape font-titre text-xl font-bold"
        >
          {sd[i] ?? ''}
        </span>
      ))}
    </div>
  );
}

export default function PerroquetNombres({
  level,
  lesson,
  stream,
  target,
  paused,
  onAnswer,
  onEnd,
  speech,
  sfx,
}: GameProps) {
  const rng = useRng();
  const { stats, answer, startQuestion, end } = useGameSession({ paused, onAnswer, onEnd });
  const N = MANCHES[level];

  const versQuestion = useCallback(
    (it: Item, manche: number): Question | null => {
      if (it.kind === 'numeric_answer') {
        // Mode inverse de temps en temps (Normal) : écrire en lettres le nombre affiché
        const inverse = level === 'normal' && manche % 3 === 0;
        if (inverse) {
          const p = propositionsLettres(it.answer, rng);
          if (p)
            return {
              mode: 'choix',
              item: it,
              texte: `Comment s’écrit ${formatNumber(it.answer)} en lettres ?`,
              aDire: `Comment s’écrit ${direNombre(it.answer)} en lettres ?`,
              choix: p.choix,
              bonne: p.bonne,
              explication: ecritureLettres(it.answer) ?? it.explication,
            };
        }
        const dictee = it.meta?.dictee === true;
        return { mode: 'dictee', item: it, aDire: dictee ? it.spoken : direNombre(it.answer) };
      }
      if (it.kind === 'mcq' && it.meta?.lettres === true)
        return {
          mode: 'choix',
          item: it,
          texte: it.question,
          aDire: it.spoken ?? it.question,
          choix: it.choices,
          bonne: it.answerIndex,
          explication: it.explication,
        };
      if (it.kind === 'fill_blank' && it.meta?.lettres === true) {
        if (it.choices)
          return {
            mode: 'choix',
            item: it,
            texte: it.sentence,
            aDire: it.spoken ?? it.sentence.replace('___', 'blanc'),
            choix: it.choices,
            bonne: it.choices.indexOf(it.answer),
            explication: it.explication,
          };
        return {
          mode: 'ecrire',
          item: it,
          texte: it.sentence,
          aDire: it.spoken ?? it.sentence.replace('___', 'blanc'),
          acceptes: [it.answer, ...(it.accepted ?? [])].flatMap((a) => acceptedSpellings(a)),
        };
      }
      return null;
    },
    [level, rng],
  );

  const nouvelle = useCallback(
    (manche: number): Question | null => {
      for (let i = 0; i < 30; i++) {
        const it = tirer(
          stream,
          target(),
          (x): x is Item => ['numeric_answer', 'mcq', 'fill_blank'].includes(x.kind),
          1,
        );
        const q = it && versQuestion(it, manche);
        if (q) return q;
      }
      return null;
    },
    [stream, target, versQuestion],
  );

  const [manche, setManche] = useState(1);
  const [q, setQ] = useState<Question | null>(() => nouvelle(1));
  const [etat, setEtat] = useState<'jeu' | 'juste' | 'faux' | 'fin'>('jeu');
  const [parle, setParle] = useState(false);
  const [reecoutes, setReecoutes] = useState(0);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [mot, setMot] = useState('');
  const [plumes, setPlumes] = useState(0);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState<string | undefined>();
  const verrou = useRef(false);

  const dire = useCallback(
    async (texte: string) => {
      setParle(true);
      await speech.speak(texte, { rate: DEBIT[level] });
      setParle(false);
    },
    [speech, level],
  );

  useEffect(() => {
    if (!q) return;
    startQuestion();
    if (!paused) void dire(q.aDire);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const conclure = useCallback(
    (juste: boolean, donne: string, attendu: string) => {
      if (!q || verrou.current) return;
      verrou.current = true;
      answer(q.item, juste, donne, attendu);
      if (juste) {
        setPlumes((p) => p + 1);
        sfx.play('juste');
        setMessage(`${bravo(rng)} Le perroquet te donne une plume !`);
        setEtat('juste');
        void speech.speak(rng.pick(['Bravo !', 'Coco est content !', 'Super !']), { rate: 1.1 });
      } else {
        sfx.play('faux');
        vibrate(60);
        setEtat('faux');
      }
    },
    [q, answer, sfx, rng, speech],
  );

  const validerNombre = useCallback(
    (v: string) => {
      if (!q || q.mode !== 'dictee' || etat !== 'jeu' || paused) return;
      const c = checkNumeric(v, q.item.answer);
      setHint(c.hint);
      conclure(c.correct, v, formatNumber(q.item.answer));
    },
    [q, etat, paused, conclure],
  );

  const { valeur, setValeur, handlers } = useSaisieNumerique({
    actif: q?.mode === 'dictee' && etat === 'jeu' && !paused,
    onValider: validerNombre,
  });

  const validerMot = useCallback(() => {
    if (!q || q.mode !== 'ecrire' || etat !== 'jeu' || !mot.trim()) return;
    const g = normalizeText(mot).toLowerCase();
    conclure(
      q.acceptes.some((a) => normalizeText(a).toLowerCase() === g),
      mot,
      q.item.answer,
    );
  }, [q, etat, mot, conclure]);

  const lettres = {
    onKey: (k: string) => setMot((m) => (m.length < 60 ? m + k : m)),
    onDelete: () => setMot((m) => m.slice(0, -1)),
    onSubmit: validerMot,
    disabled: q?.mode !== 'ecrire' || etat !== 'jeu' || paused,
  };
  usePhysicalKeyboard(lettres, /[a-zàâçéèêëîïôûùüœ' -]/i);

  const suivant = useCallback(() => {
    if (manche >= N) {
      setEtat('fin');
      const reussi = stats.correct >= Math.ceil(N * 0.6);
      sfx.play(reussi ? 'fanfare' : 'etoile');
      end({
        won: reussi,
        headline: reussi
          ? `Quelle belle collection : ${stats.correct} plumes ! 🦜`
          : `${stats.correct} plumes gagnées sur ${N} !`,
        delayMs: 1000,
      });
      return;
    }
    const m = manche + 1;
    setManche(m);
    setQ(nouvelle(m));
    setValeur('');
    setMot('');
    setChoisi(null);
    setReecoutes(0);
    setMessage('');
    setHint(undefined);
    verrou.current = false;
    setEtat('jeu');
  }, [manche, N, stats.correct, sfx, end, nouvelle, setValeur]);

  useEffect(() => {
    if (etat !== 'juste') return;
    const t = setTimeout(suivant, 1400);
    return () => clearTimeout(t);
  }, [etat, suivant]);

  if (!q) {
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de nombres à dicter pour le perroquet."
        onFin={() => end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const peutReecouter = reecoutes < REECOUTES[level] && etat === 'jeu';
  const bonneDictee = q.mode === 'dictee' ? formatNumber(q.item.answer) : '';
  const enLettres = q.mode === 'dictee' ? ecritureLettres(q.item.answer) : null;
  const decimal = (q.mode === 'dictee' && q.item.decimals > 0) || lesson.classe === 'CM2';

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row">
      <section
        className="relative overflow-hidden rounded-card border-4 border-white shadow-soft lg:w-[40%] lg:self-start"
        aria-label="Le perroquet"
        style={{ background: 'linear-gradient(180deg,#C8F1D2 0%,#8FD9A8 100%)' }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 200 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          {[
            [10, 30],
            [170, 20],
            [30, 160],
            [180, 150],
          ].map(([x, y], i) => (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx="40"
              ry="18"
              fill="#5DBB63"
              opacity="0.5"
              transform={`rotate(${i * 40} ${x} ${y})`}
            />
          ))}
        </svg>
        <div className="relative flex h-[220px] items-end justify-center sm:h-[320px]">
          <Perroquet parle={parle} content={etat === 'juste'} />
          <AnimatePresence>
            {parle && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-3 top-3 rounded-2xl rounded-bl-none bg-white px-3 py-1 font-titre text-2xl font-extrabold shadow-pop-sm"
                aria-hidden
              >
                🔊 …
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute left-2 top-2">
          <Hud>
            🦜 {Math.min(manche, N)} / {N}
          </Hud>
        </div>
        <div className="absolute bottom-2 left-2 flex gap-0.5" aria-label={`${plumes} plumes`}>
          {Array.from({ length: plumes }, (_, i) => (
            <motion.svg
              key={i}
              width="16"
              height="34"
              viewBox="0 0 16 34"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              aria-hidden
            >
              <path d="M8 0 C 18 10 14 26 8 34 C 2 26 -2 10 8 0 Z" fill={PLUMES[i % PLUMES.length]} />
              <line x1="8" y1="4" x2="8" y2="34" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
            </motion.svg>
          ))}
        </div>
      </section>

      <section className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-4 sm:p-6">
        <Bandeau>
          <Hud>✅ {stats.correct}</Hud>
        </Bandeau>

        {q.mode === 'dictee' ? (
          <>
            <p className="text-center font-titre text-2xl font-extrabold sm:text-3xl">
              Écris le nombre que tu entends
            </p>
            <Button
              variant="sun"
              size="lg"
              onClick={() => {
                setReecoutes((r) => r + 1);
                void dire(q.aDire);
              }}
              disabled={!peutReecouter || paused}
            >
              🔊 Répète, Coco !
              {Number.isFinite(REECOUTES[level]) && (
                <span className="text-sm">({Math.max(0, REECOUTES[level] - reecoutes)})</span>
              )}
            </Button>
            {level === 'facile' && etat === 'jeu' && <CasesChiffres n={q.item.answer} saisie={valeur} />}
            <CaseReponse
              valeur={valeur}
              etat={etat === 'faux' ? 'faux' : etat === 'juste' ? 'juste' : null}
              unite={q.item.unit}
            />
          </>
        ) : (
          <div className="flex items-start justify-center gap-3">
            <SpeakButton text={q.aDire} label="Écouter la question" />
            <p
              className="whitespace-pre-line text-center font-titre text-2xl font-extrabold sm:text-3xl"
              aria-live="polite"
            >
              {q.texte}
            </p>
          </div>
        )}

        <p
          className="min-h-[1.75rem] text-center font-titre text-xl font-extrabold text-grass-dark"
          aria-live="polite"
        >
          {etat === 'juste' ? message : ''}
        </p>

        {q.mode === 'choix' && (
          <ChoiceGrid
            choices={q.choix}
            onPick={(i) => {
              if (verrou.current || paused) return;
              setChoisi(i);
              conclure(i === q.bonne, q.choix[i]!, q.choix[q.bonne]!);
            }}
            reveal={etat === 'jeu' ? null : { correct: q.bonne, chosen: choisi }}
            disabled={paused}
          />
        )}
        {q.mode === 'ecrire' && (
          <>
            <CaseReponse
              valeur={mot}
              etat={etat === 'faux' ? 'faux' : etat === 'juste' ? 'juste' : null}
              label="Ton écriture"
            />
            {etat === 'jeu' && <LetterKeyboard {...lettres} />}
          </>
        )}

        <Correction
          ouvert={etat === 'faux'}
          bonne={q.mode === 'dictee' ? bonneDictee : q.mode === 'choix' ? q.choix[q.bonne] : q.item.answer}
          aDire={
            q.mode === 'dictee'
              ? `Le perroquet a dit ${q.aDire}. Cela s’écrit ${bonneDictee.split('').join(' ')}. ${q.item.explication}`
              : undefined
          }
          explication={q.mode === 'choix' ? q.explication : q.item.explication}
          onContinuer={suivant}
        >
          {hint && <p className="mt-1">{hint}</p>}
          {enLettres && <p className="mt-1">{enLettres}</p>}
        </Correction>

        {q.mode === 'dictee' && etat !== 'faux' && <Keypad {...handlers} decimal={decimal} />}
      </section>
    </div>
  );
}
