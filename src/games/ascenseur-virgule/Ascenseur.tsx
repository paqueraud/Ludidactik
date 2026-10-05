/**
 * L'Ascenseur de la virgule (CATALOGUE n° 15) — glisse-nombre du BO.
 * Un immeuble-tableau de numération : une tour par rang, d'autant plus haute que le rang est grand.
 * La virgule est un pilier fixe. Multiplier par 10, 100, 1 000 : les chiffres prennent l'ascenseur et
 * montent de 1, 2, 3 rangs (vers la gauche) ; diviser : ils descendent (vers la droite).
 * 1) Faire glisser la rangée de chiffres (doigt, boutons, flèches ← →) puis valider ;
 * 2) écrire le nombre obtenu (en pensant aux zéros).
 * Niveaux : Facile = les zéros utiles apparaissent tout seuls ; Normal = sans aide pour les zéros ;
 * Plus loin = on écrit directement le résultat, le glissement est montré dans la correction.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level, NumericItem } from '@/content/schemas';
import { checkNumeric, formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { parNiveau } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import {
  type Glisse,
  chiffresParRang,
  classeRang,
  colonnesTableau,
  decalage,
  lireGlisse,
  nomRang,
  rangs,
  resultatGlisse,
  zerosAjoutes,
} from '../_calcul-commun/glisse';
import { Bandeau, Bulle, type Champ, EtatVide, SaisieChamps, useManches, vide } from '../_calcul-commun/ui';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
const CHAMP: Champ[] = [{ cle: 'r', nom: 'résultat', max: 12 }];

interface Exo {
  item: NumericItem;
  g: Glisse;
}
const convertir = (it: Item): Exo | null => {
  const g = lireGlisse(it);
  return g && it.kind === 'numeric_answer' ? { item: it, g } : null;
};

const COULEURS: Record<string, string> = {
  millions: '#8E7CFF',
  mille: '#4FC3F7',
  unités: '#7BD389',
  'partie décimale': '#FFD45C',
};

export default function Ascenseur(props: GameProps) {
  const { level, lectureAuto, speech, sfx, paused } = props;
  const reduce = useReducedMotion();
  const jeu = useManches(props, {
    total: parNiveau(level, MANCHES),
    convertir,
    fin: (b, t) => ({ headline: b === t ? 'Liftier en chef ! 🛗' : `${b} voyage${b > 1 ? 's' : ''} réussi${b > 1 ? 's' : ''} sur ${t} !` }),
    delaiJuste: 1500,
  });
  const { courant, manche, total, etat, fini, repondre, suivant, bonnes } = jeu;
  const exo = courant?.valeur ?? null;

  const [phase, setPhase] = useState<'glisser' | 'ecrire'>('glisser');
  const [decal, setDecal] = useState(0);
  const [saisie, setSaisie] = useState<Record<string, string>>(vide(CHAMP));
  const [noteGlisse, setNoteGlisse] = useState<string | null>(null);
  const [message, setMessage] = useState<string | undefined>();
  const [hint, setHint] = useState<string | undefined>();
  const glisseOk = useRef(true);

  const colonnes = useMemo(() => (exo ? colonnesTableau(exo.g) : []), [exo]);
  const chiffres = useMemo(() => (exo ? chiffresParRang(exo.g.nombre) : new Map<number, number>()), [exo]);
  const k = exo ? decalage(exo.g) : 0;
  const haut = colonnes[0] ?? 0;
  const bas = colonnes[colonnes.length - 1] ?? 0;
  const rangsNombre = [...chiffres.keys()];
  const minDecal = bas - Math.min(...rangsNombre, 0);
  const maxDecal = haut - Math.max(...rangsNombre, 0);

  useEffect(() => {
    if (!exo) return;
    setPhase(level === 'plus_loin' ? 'ecrire' : 'glisser');
    setDecal(0);
    setSaisie(vide(CHAMP));
    setNoteGlisse(null);
    setMessage(undefined);
    setHint(undefined);
    glisseOk.current = true;
    if (lectureAuto) void speech.speak(exo.item.spoken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exo]);

  const bloque = !!etat || paused || fini;
  const bouger = useCallback(
    (d: number) => {
      if (bloque || phase !== 'glisser') return;
      setDecal((x) => {
        const n = Math.max(minDecal, Math.min(maxDecal, x + d));
        if (n !== x) sfx.play(d > 0 ? 'monte' : 'glisse');
        return n;
      });
    },
    [bloque, phase, minDecal, maxDecal, sfx],
  );

  const validerGlisse = useCallback(() => {
    if (!exo || bloque || phase !== 'glisser') return;
    if (decal !== k) {
      glisseOk.current = false;
      const n = rangs(exo.g);
      setNoteGlisse(
        `Presque ! ${exo.g.operation === '×' ? 'Multiplier' : 'Diviser'} par ${formatNumber(exo.g.facteur)}, c’est faire ${exo.g.operation === '×' ? 'monter' : 'descendre'} chaque chiffre de ${n} rang${n > 1 ? 's' : ''} : ${exo.g.operation === '×' ? 'vers la gauche' : 'vers la droite'}.`,
      );
      sfx.play('glisse');
    } else setNoteGlisse(null);
    setDecal(k);
    setPhase('ecrire');
  }, [exo, bloque, phase, decal, k, sfx]);

  const validerEcrit = useCallback(() => {
    if (!exo || bloque || phase !== 'ecrire' || !saisie.r) return;
    const c = checkNumeric(saisie.r, exo.item.answer, { tolerateZeros: level === 'facile' });
    setHint(c.hint);
    setDecal(k);
    setMessage(c.correct ? (glisseOk.current ? 'Bravo, l’ascenseur est arrivé !' : 'Bien écrit !') : undefined);
    repondre(c.correct, saisie.r, formatNumber(exo.item.answer));
  }, [exo, bloque, phase, saisie, level, k, repondre]);

  // Clavier pendant le glissement
  useEffect(() => {
    if (phase !== 'glisser' || bloque) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        bouger(1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        bouger(-1);
      } else if (e.key === 'Enter' && (document.activeElement as HTMLElement | null)?.tagName !== 'BUTTON') {
        e.preventDefault();
        validerGlisse();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase, bloque, bouger, validerGlisse]);

  // Glisser au doigt la rangée de chiffres
  const rangee = useRef<HTMLDivElement>(null);
  const depart = useRef<{ x: number; d: number } | null>(null);
  const largeurCol = () => (rangee.current ? rangee.current.clientWidth / Math.max(1, colonnes.length) : 50);

  if (!exo) return <EtatVide icone="🛗" jeu="L’Ascenseur de la virgule" besoin="de calculs × ou ÷ par 10, 100 ou 1 000" />;

  const { g, item } = exo;
  const montrerResultat = phase === 'ecrire' && (level !== 'plus_loin' || !!etat);
  const zeros = new Set(montrerResultat && (level === 'facile' || etat) ? zerosAjoutes(g) : []);
  const position = (r: number) => colonnes.indexOf(r);
  const iUnites = position(0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          Voyage {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🛗</span> {bonnes}
        </Hud>
      </Bandeau>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <section
          className="relative overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-[#BFE6FF] to-[#E6F6FF] p-2 shadow-soft sm:p-3"
          aria-label="L’immeuble des nombres"
        >
          {/* en-têtes de classes */}
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${colonnes.length}, minmax(0, 1fr))` }}>
            {colonnes.map((r, i) => {
              const cl = classeRang(r);
              const debut = i === 0 || classeRang(colonnes[i - 1]!) !== cl;
              return (
                <div key={r} className="h-5 truncate text-center text-[10px] font-bold uppercase text-ink/70 sm:text-xs">
                  {debut ? (cl === 'partie décimale' ? 'décimales' : cl) : ''}
                </div>
              );
            })}
          </div>
          {/* tours */}
          <div className="relative">
            <div className="grid items-end gap-0.5" style={{ gridTemplateColumns: `repeat(${colonnes.length}, minmax(0, 1fr))` }}>
              {colonnes.map((r) => {
                const h = 70 + (r + 3) * 14;
                const c = COULEURS[classeRang(r)]!;
                return (
                  <div key={r} className="relative flex flex-col items-center justify-start rounded-t-lg pt-1" style={{ height: h, background: c }} title={nomRang(r)[1]}>
                    <span className="rounded bg-white/85 px-1 text-[10px] font-extrabold leading-tight sm:text-xs" aria-label={nomRang(r)[1]}>
                      {nomRang(r)[0]}
                    </span>
                    {/* fenêtres */}
                    <div className="mt-1 grid w-full grid-cols-2 gap-1 px-1.5 opacity-70" aria-hidden>
                      {Array.from({ length: Math.max(0, Math.floor((h - 70) / 16)) * 2 }, (_, j) => (
                        <span key={j} className="h-2 rounded-sm bg-white/70" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* rangée des chiffres (la « cabine ») */}
            <div
              ref={rangee}
              className={`relative mt-1 grid h-16 gap-0.5 rounded-xl bg-white/70 ${phase === 'glisser' && !bloque ? 'cursor-grab touch-none' : ''}`}
              style={{ gridTemplateColumns: `repeat(${colonnes.length}, minmax(0, 1fr))` }}
              aria-label={`Le nombre dans le tableau : ${formatNumber(phase === 'ecrire' && montrerResultat ? resultatGlisse(g) : g.nombre)}`}
              role="img"
              onPointerDown={(e) => {
                if (phase !== 'glisser' || bloque) return;
                depart.current = { x: e.clientX, d: decal };
                (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!depart.current) return;
                const n = Math.round((depart.current.x - e.clientX) / largeurCol());
                const v = Math.max(minDecal, Math.min(maxDecal, depart.current.d + n));
                if (v !== decal) {
                  sfx.play('tic');
                  setDecal(v);
                }
              }}
              onPointerUp={() => (depart.current = null)}
              onPointerCancel={() => (depart.current = null)}
            >
              {colonnes.map((r) => (
                <div key={r} className="relative flex items-center justify-center border-x border-dashed border-ink/10">
                  {zeros.has(r) && (
                    <motion.span
                      initial={reduce ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="font-titre text-3xl font-extrabold text-grape sm:text-4xl"
                    >
                      0
                    </motion.span>
                  )}
                </div>
              ))}
              {/* chiffres qui glissent */}
              {[...chiffres.entries()].map(([r, c]) => {
                const p = position(r + (phase === 'ecrire' && !montrerResultat ? 0 : decal));
                if (p < 0) return null;
                const w = 100 / colonnes.length;
                return (
                  <motion.span
                    key={r}
                    className="pointer-events-none absolute top-0 flex h-16 items-center justify-center font-titre text-3xl font-extrabold text-ink sm:text-4xl"
                    style={{ width: `${w}%` }}
                    initial={false}
                    animate={{ left: `${p * w}%` }}
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 18 }}
                  >
                    <span className="rounded-lg bg-sun/60 px-1.5 shadow-pop-sm">{c}</span>
                  </motion.span>
                );
              })}
              {/* la virgule, pilier fixe */}
              {iUnites >= 0 && iUnites < colonnes.length - 1 && (
                <span
                  className="pointer-events-none absolute bottom-2 font-titre text-5xl font-extrabold leading-none text-coral-dark"
                  style={{ left: `calc(${((iUnites + 1) * 100) / colonnes.length}% - 6px)` }}
                  aria-hidden
                >
                  ,
                </span>
              )}
            </div>
          </div>
          <p className="mt-2 text-center font-titre text-lg font-bold text-ink">
            {g.operation === '×' ? '⬆️ ×' : '⬇️ ÷'} {formatNumber(g.facteur)} :{' '}
            {phase === 'glisser'
              ? decal === 0
                ? 'les chiffres attendent l’ascenseur…'
                : `les chiffres ${decal > 0 ? 'sont montés' : 'sont descendus'} de ${Math.abs(decal)} rang${Math.abs(decal) > 1 ? 's' : ''}`
              : `${g.operation === '×' ? 'montée' : 'descente'} de ${rangs(g)} rang${rangs(g) > 1 ? 's' : ''}`}
          </p>
        </section>

        <section className="carte flex min-w-0 flex-col items-center gap-3 p-4">
          <div className="flex items-center gap-3">
            <SpeakButton text={item.spoken} label="Écouter le calcul" />
            <p className="font-titre text-4xl font-extrabold" aria-live="polite">
              {item.prompt}
            </p>
          </div>

          {phase === 'glisser' && (
            <>
              <p className="text-center font-bold">
                Fais glisser les chiffres dans l’immeuble (avec le doigt ou les flèches), puis valide.
              </p>
              <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Ascenseur">
                <Button variant="sky" icon={<ArrowLeft aria-hidden />} onClick={() => bouger(1)} disabled={bloque || decal >= maxDecal}>
                  Monter
                </Button>
                <Button variant="grape" icon={<ArrowRight aria-hidden />} onClick={() => bouger(-1)} disabled={bloque || decal <= minDecal}>
                  Descendre
                </Button>
              </div>
              <Button variant="grass" size="lg" onClick={validerGlisse} disabled={bloque}>
                L’ascenseur est arrivé !
              </Button>
            </>
          )}

          {phase === 'ecrire' && (
            <>
              {noteGlisse && (
                <Bulle>
                  <span aria-hidden>🛗</span>
                  <span>{noteGlisse}</span>
                </Bulle>
              )}
              <p className="text-center font-bold">
                {level === 'plus_loin' ? 'Écris le résultat.' : 'Lis le nombre dans l’immeuble et écris-le.'}
                {level === 'facile' && zeros.size > 0 && ' Les zéros violets gardent les places vides !'}
              </p>
              <SaisieChamps champs={CHAMP} valeurs={saisie} onChange={setSaisie} onValider={validerEcrit} disabled={bloque} etat={etat} decimal />
            </>
          )}

          <AnimatePresence>
            {etat && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                <Feedback
                  state={etat}
                  message={message ?? (hint ? `Presque ! ${hint}` : undefined)}
                  expected={etat === 'faux' ? formatNumber(item.answer) : undefined}
                  explication={etat === 'faux' ? item.explication : undefined}
                  onContinue={suivant}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
