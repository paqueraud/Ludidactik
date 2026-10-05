/**
 * Le Compte est bon (CATALOGUE n°10, inspiré de Mathador junior).
 * Étape 1 : on calcule la cible (c'est l'item de la leçon : « 7 × 8 » → 56).
 * Étape 2 : avec les nombres tirés, on retombe pile sur la cible en les combinant (+ − × ÷).
 * Bonus « coup de maître » si on utilise toutes les opérations du niveau.
 * Facile : 3 nombres, + et − seulement, pas de chrono. Normal : 4 nombres, + − ×, chrono doux.
 * Plus loin : 5 nombres, les 4 opérations, chrono plus serré.
 * Clavier : 1-9 choisir un nombre, + - * / choisir l'opération, Retour annuler, Échap recommencer.
 */
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { RotateCcw, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keypad } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import type { Level, NumericItem } from '@/content/schemas';
import { checkNumeric, formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { useGameSession } from '@/games/_kit/session';
import { Hud } from '@/games/_kit/ui';
import { vibrate } from '@/services/sfx';
import {
  bravo,
  dansUnChamp,
  direNombre,
  estNumerique,
  tirer,
  useBoucle,
  useRng,
} from '../_nombres-commun/outils';
import { Bandeau, BarreTemps, CaseReponse, Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { useSaisieNumerique } from '../_nombres-commun/useSaisieNumerique';
import { type Etape, OPS_NIVEAU, type Op, calculer, tirage } from './tirage';

const MANCHES: Record<Level, number> = { facile: 4, normal: 5, plus_loin: 6 };
const CHRONO: Record<Level, number | null> = { facile: null, normal: 150, plus_loin: 90 };
const TOUCHES_OP: Record<string, Op> = { '+': '+', '-': '−', '*': '×', x: '×', '/': '÷', ':': '÷' };
const LIRE_OP: Record<Op, string> = { '+': 'plus', '−': 'moins', '×': 'fois', '÷': 'divisé par' };

interface Tuile {
  id: number;
  v: number;
  utilise: boolean;
  /** Résultat d'une étape (et non nombre tiré). */
  resultat: boolean;
}

type Phase =
  | { type: 'cible' }
  | { type: 'cible-faux'; donne: string; hint?: string }
  | { type: 'cible-ok' }
  | { type: 'combiner' }
  | { type: 'gagne'; bonus: boolean }
  | { type: 'solution'; raison: 'abandon' | 'temps' }
  | { type: 'fin' };

export default function CompteEstBon({
  level,
  lesson,
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
  const ops = OPS_NIVEAU[level];

  const [item, setItem] = useState<NumericItem | null>(() => tirer(stream, target(), estNumerique));
  const [manche, setManche] = useState(1);
  const [phase, setPhase] = useState<Phase>({ type: 'cible' });
  const [tuiles, setTuiles] = useState<Tuile[]>([]);
  const [solution, setSolution] = useState<Etape[]>([]);
  const [etapes, setEtapes] = useState<Etape[]>([]);
  const [historique, setHistorique] = useState<Tuile[][]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [info, setInfo] = useState('');
  const [reste, setReste] = useState(1);
  const [reussies, setReussies] = useState(0);
  const score = useRef(0);
  const idSuivant = useRef(100);

  useEffect(() => {
    if (!item) return;
    startQuestion();
    if (lectureAuto && !paused) void speech.speak(`Calcule la cible : ${item.spoken}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  /** Passe à l'étape « combiner » (si la cible s'y prête), sinon manche suivante. */
  const lancerCombinaison = useCallback(() => {
    if (!item) return false;
    const t = tirage(item.answer, level, rng);
    if (!t) return false;
    setTuiles(t.nombres.map((v, i) => ({ id: i, v, utilise: false, resultat: false })));
    setSolution(t.solution);
    setEtapes([]);
    setHistorique([]);
    setSel(null);
    setOp(null);
    setInfo('');
    setReste(1);
    setPhase({ type: 'combiner' });
    return true;
  }, [item, level, rng]);

  const suivant = useCallback(() => {
    if (manche >= N) {
      setPhase({ type: 'fin' });
      const reussi = stats.correct + reussies >= Math.ceil(N * 1.2);
      sfx.play(reussi ? 'fanfare' : 'etoile');
      end({
        won: reussi,
        headline: `${reussies} compte${reussies > 1 ? 's' : ''} bon${reussies > 1 ? 's' : ''} sur ${N} ! 🎯`,
        score: score.current,
        delayMs: 1000,
      });
      return;
    }
    setItem(tirer(stream, target(), estNumerique));
    setManche((m) => m + 1);
    setPhase({ type: 'cible' });
    setInfo('');
  }, [manche, N, stats.correct, reussies, sfx, end, stream, target]);

  const validerCible = useCallback(
    (v: string) => {
      if (!item || phase.type !== 'cible' || paused) return;
      const c = checkNumeric(v, item.answer, { tolerateZeros: level === 'facile', unit: item.unit });
      answer(item, c.correct, v, formatNumber(item.answer));
      if (c.correct) {
        score.current += 100;
        sfx.play('juste');
        if (!lancerCombinaison()) {
          // cible non entière (décimaux) : pas de tirage possible, on passe à la manche suivante
          setInfo(`${bravo(rng)} La réponse est ${formatNumber(item.answer)}.`);
          setPhase({ type: 'cible-ok' });
        }
      } else {
        sfx.play('faux');
        vibrate(60);
        setPhase({ type: 'cible-faux', donne: v, hint: c.hint });
      }
    },
    [item, phase, paused, level, answer, sfx, lancerCombinaison, rng],
  );

  const { valeur, setValeur, handlers } = useSaisieNumerique({
    actif: phase.type === 'cible' && !paused && !!item,
    onValider: validerCible,
  });
  useEffect(() => setValeur(''), [item, setValeur]);

  const atteint = useCallback(
    (ts: Tuile[], es: Etape[]) => {
      if (!item || !ts.some((t) => !t.utilise && t.v === item.answer && (t.resultat || es.length > 0)))
        return;
      const bonus = ops.length > 1 && ops.every((o) => es.some((e) => e.op === o));
      score.current += 150 + (bonus ? 100 : 0) + Math.round(reste * 50);
      setReussies((r) => r + 1);
      sfx.play(bonus ? 'fanfare' : 'etoile');
      setPhase({ type: 'gagne', bonus });
    },
    [item, ops, reste, sfx],
  );

  /** Touche une tuile : 1er nombre, puis (après l'opération) 2e nombre → nouvelle tuile résultat. */
  const toucherTuile = useCallback(
    (id: number) => {
      if (phase.type !== 'combiner' || paused) return;
      const t = tuiles.find((x) => x.id === id);
      if (!t || t.utilise) return;
      if (sel === null || op === null) {
        setSel(id === sel ? null : id);
        setInfo('');
        sfx.play('tic');
        return;
      }
      if (id === sel) return;
      const a = tuiles.find((x) => x.id === sel)!;
      // On range pour la soustraction et la division : grand − petit, grand ÷ petit
      const [x, y] = (op === '−' || op === '÷') && t.v > a.v ? [t.v, a.v] : [a.v, t.v];
      const r = calculer(x, op, y);
      if (r === null) {
        sfx.play('faux');
        setInfo(
          op === '÷'
            ? `${formatNumber(x)} ÷ ${formatNumber(y)} ne tombe pas juste : essaie autre chose !`
            : op === '−'
              ? 'On ne peut pas trouver 0 ou moins : essaie autre chose !'
              : 'Ce nombre devient trop grand : essaie autre chose !',
        );
        setOp(null);
        setSel(null);
        return;
      }
      const e: Etape = { a: x, op, b: y, r };
      const ts = [
        ...tuiles.map((u) => (u.id === a.id || u.id === t.id ? { ...u, utilise: true } : u)),
        { id: idSuivant.current++, v: r, utilise: false, resultat: true },
      ];
      setHistorique((h) => [...h, tuiles]);
      setTuiles(ts);
      const es = [...etapes, e];
      setEtapes(es);
      setSel(null);
      setOp(null);
      setInfo('');
      sfx.play('pop');
      atteint(ts, es);
    },
    [phase, paused, tuiles, sel, op, etapes, sfx, atteint],
  );

  const choisirOp = useCallback(
    (o: Op) => {
      if (phase.type !== 'combiner' || paused || sel === null || !ops.includes(o)) return;
      setOp(o);
      sfx.play('tic');
    },
    [phase, paused, sel, ops, sfx],
  );

  const annuler = useCallback(() => {
    if (phase.type !== 'combiner' || !historique.length) return;
    setTuiles(historique[historique.length - 1]!);
    setHistorique((h) => h.slice(0, -1));
    setEtapes((e) => e.slice(0, -1));
    setSel(null);
    setOp(null);
  }, [phase, historique]);

  const recommencer = useCallback(() => {
    if (phase.type !== 'combiner' || !historique.length) return;
    setTuiles(historique[0]!);
    setHistorique([]);
    setEtapes([]);
    setSel(null);
    setOp(null);
  }, [phase, historique]);

  // Chrono de l'étape « combiner »
  const chrono = CHRONO[level];
  useBoucle(!!chrono && phase.type === 'combiner' && !paused, (dt) =>
    setReste((r) => Math.max(0, r - dt / chrono!)),
  );
  useEffect(() => {
    if (chrono && reste <= 0 && phase.type === 'combiner') setPhase({ type: 'solution', raison: 'temps' });
  }, [reste, chrono, phase]);

  useEffect(() => {
    if (phase.type !== 'cible-ok') return;
    const t = setTimeout(suivant, 1300);
    return () => clearTimeout(t);
  }, [phase, suivant]);

  useEffect(() => {
    if (phase.type !== 'gagne') return;
    const t = setTimeout(suivant, 2200);
    return () => clearTimeout(t);
  }, [phase, suivant]);

  // Clavier de l'étape « combiner »
  useEffect(() => {
    if (phase.type !== 'combiner' || paused) return;
    const libres = tuiles.filter((t) => !t.utilise);
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      if (/^[1-9]$/.test(e.key)) {
        const t = libres[Number(e.key) - 1];
        if (t) toucherTuile(t.id);
      } else if (TOUCHES_OP[e.key]) {
        e.preventDefault();
        choisirOp(TOUCHES_OP[e.key]!);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        annuler();
      } else if (e.key === 'Escape') recommencer();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase, paused, tuiles, toucherTuile, choisirOp, annuler, recommencer]);

  if (!item) {
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de calculs pour le Compte est bon."
        onFin={() => end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const cible = formatNumber(item.answer);
  const enCombinaison = phase.type === 'combiner' || phase.type === 'gagne' || phase.type === 'solution';
  const libres = tuiles.filter((t) => !t.utilise);
  const ecrireEtape = (e: Etape) =>
    `${formatNumber(e.a)} ${e.op} ${formatNumber(e.b)} = ${formatNumber(e.r)}`;

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
        <Bandeau>
          <Hud>
            🎯 {Math.min(manche, N)} / {N}
          </Hud>
          <Hud>✅ {reussies}</Hud>
          {chrono && phase.type === 'combiner' && <BarreTemps reste={reste} />}
        </Bandeau>

        {/* Cible */}
        <section
          className="relative flex flex-col items-center gap-2 overflow-hidden rounded-card border-4 border-white p-4 text-white shadow-soft"
          style={{ background: 'radial-gradient(circle at 50% 0%, #A08CFF 0%, #6A5AE0 55%, #4A3BB8 100%)' }}
          aria-label="La cible"
        >
          <svg
            className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 opacity-20"
            viewBox="0 0 100 100"
            aria-hidden
          >
            {[46, 34, 22, 10].map((r, i) => (
              <circle key={r} cx="50" cy="50" r={r} fill={i % 2 ? '#fff' : '#FF7A6B'} />
            ))}
          </svg>
          {enCombinaison ? (
            <>
              <p className="font-bold opacity-90">Atteins la cible :</p>
              <motion.p
                key={cible}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="flex h-20 min-w-[7rem] items-center justify-center rounded-2xl bg-white px-5 font-titre text-5xl font-extrabold text-grape-dark shadow-pop"
              >
                {cible}
              </motion.p>
              <p className="text-sm opacity-90">
                ({item.prompt} = {cible})
              </p>
            </>
          ) : (
            <>
              <p className="font-bold opacity-90">Étape 1 : calcule la cible</p>
              <div className="flex items-center gap-3">
                <SpeakButton text={item.spoken} label="Écouter le calcul" />
                <p className="font-titre text-4xl font-extrabold sm:text-5xl" aria-live="polite">
                  {item.prompt}
                </p>
              </div>
            </>
          )}
        </section>

        <div className="carte flex flex-col items-center gap-3 p-4 sm:p-6">
          {(phase.type === 'cible' || phase.type === 'cible-faux' || phase.type === 'cible-ok') && (
            <>
              <CaseReponse
                valeur={valeur}
                etat={phase.type === 'cible-faux' ? 'faux' : phase.type === 'cible-ok' ? 'juste' : null}
                unite={item.unit}
              />
              {info && (
                <p className="font-titre text-xl font-extrabold text-grass-dark" role="status">
                  {info}
                </p>
              )}
              <Correction
                ouvert={phase.type === 'cible-faux'}
                bonne={cible}
                aDire={`La cible est ${direNombre(item.answer)}. ${item.explication}`}
                explication={item.explication}
                onContinuer={() => {
                  if (!lancerCombinaison()) suivant();
                }}
                libelle="Continuer avec cette cible"
              >
                {phase.type === 'cible-faux' && phase.hint && <p className="mt-1">{phase.hint}</p>}
              </Correction>
              {phase.type === 'cible' && (
                <Keypad {...handlers} decimal={item.decimals > 0 || lesson.classe === 'CM2'} />
              )}
            </>
          )}

          {enCombinaison && (
            <>
              <p className="text-center font-bold text-ink-soft">
                Étape 2 : touche un nombre, une opération, puis un autre nombre.
              </p>
              <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Nombres">
                <AnimatePresence>
                  {libres.map((t, i) => (
                    <motion.button
                      key={t.id}
                      layout
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      type="button"
                      onClick={() => toucherTuile(t.id)}
                      disabled={phase.type !== 'combiner' || paused}
                      className={`btn-3d relative flex h-16 min-w-[4.5rem] items-center justify-center px-3 font-titre text-3xl font-extrabold ${
                        t.id === sel
                          ? 'bg-sun ring-4 ring-sun-dark'
                          : t.v === item.answer && t.resultat
                            ? 'bg-grass text-white'
                            : t.resultat
                              ? 'bg-sky/30'
                              : 'bg-card'
                      }`}
                      aria-pressed={t.id === sel}
                      aria-label={`Nombre ${formatNumber(t.v)}`}
                    >
                      {formatNumber(t.v)}
                      <span
                        className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-white"
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Opérations">
                {(['+', '−', '×', '÷'] as Op[]).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => choisirOp(o)}
                    disabled={!ops.includes(o) || sel === null || phase.type !== 'combiner' || paused}
                    className={`btn-3d flex h-14 w-14 items-center justify-center font-titre text-3xl font-extrabold ${
                      op === o ? 'bg-grape text-white' : 'bg-card'
                    } ${!ops.includes(o) ? 'hidden' : ''}`}
                    aria-label={LIRE_OP[o]}
                    aria-pressed={op === o}
                  >
                    {o}
                  </button>
                ))}
              </div>
              {info && (
                <p className="text-center font-bold text-coral-dark" role="status">
                  {info}
                </p>
              )}
              {etapes.length > 0 && (
                <ol className="flex flex-col items-center gap-1" aria-label="Tes calculs">
                  {etapes.map((e, i) => (
                    <li key={i} className="rounded-full bg-cream px-4 py-1 font-titre text-xl font-bold">
                      {ecrireEtape(e)}
                    </li>
                  ))}
                </ol>
              )}
              {phase.type === 'combiner' && (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="blanc"
                    onClick={annuler}
                    disabled={!historique.length}
                    icon={<Undo2 size={20} aria-hidden />}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="blanc"
                    onClick={recommencer}
                    disabled={!historique.length}
                    icon={<RotateCcw size={20} aria-hidden />}
                  >
                    Recommencer
                  </Button>
                  <Button variant="fantome" onClick={() => setPhase({ type: 'solution', raison: 'abandon' })}>
                    🐱 Je donne ma langue au chat
                  </Button>
                </div>
              )}
              {phase.type === 'gagne' && (
                <motion.p
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center font-titre text-3xl font-extrabold text-grass-dark"
                  role="status"
                >
                  Le compte est bon ! {phase.bonus && '🏆 Coup de maître : toutes les opérations !'}
                </motion.p>
              )}
              {phase.type === 'solution' && (
                <div className="w-full rounded-2xl bg-sky/10 p-4" role="status">
                  <p className="text-lg font-bold">
                    {phase.raison === 'temps' ? 'Le temps est écoulé ! ' : ''}Voici une façon d’y arriver :
                  </p>
                  <ol className="my-2 flex flex-col items-center gap-1">
                    {solution.map((e, i) => (
                      <li key={i} className="font-titre text-xl font-bold">
                        {ecrireEtape(e)}
                      </li>
                    ))}
                  </ol>
                  <div className="flex items-center gap-2">
                    <SpeakButton
                      text={solution
                        .map(
                          (e) =>
                            `${direNombre(e.a)} ${LIRE_OP[e.op]} ${direNombre(e.b)} égale ${direNombre(e.r)}`,
                        )
                        .join('. ')}
                      size={40}
                      label="Écouter la solution"
                    />
                    <p>Il y a souvent plusieurs chemins : la prochaine fois, ce sera le tien !</p>
                  </div>
                  <Button variant="grass" className="mt-3 w-full" onClick={suivant} autoFocus>
                    Continuer
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
