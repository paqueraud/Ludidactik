/**
 * Le Pizzaïolo des fractions (CATALOGUE n° 13).
 * - colorier : la commande du client (« 3/8 de pizza ») → couper la pizza en parts égales, puis garnir le
 *   bon nombre de parts. Fractions > 1 : plusieurs pizzas (7/4 = une pizza entière et 3 quarts).
 * - lire : quelle fraction de la pizza est garnie ? (Facile : 3 propositions ; sinon on écrit la fraction).
 * - comparer : deux commandes, laquelle a le plus de pizza ?
 * Niveaux : Facile = pizza déjà coupée, compteur de parts ; Normal = on coupe soi-même, compteur ;
 * Plus loin = on coupe, sans compteur. Clavier : flèches pour choisir le nombre de parts, Tab + Espace sur
 * une part, « + » / « − » pour garnir ou enlever une part, Entrée pour servir.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Minus, Plus, Scissors } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level, VisualFractionItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { parNiveau } from '../_kit/session';
import { ChoiceGrid, Feedback, Hud } from '../_kit/ui';
import { Client } from '../_calcul-commun/Client';
import {
  type Frac,
  adapterEnonce,
  comparer,
  formatFrac,
  fracEnMots,
  fractionJouable,
  propositionsFraction,
  unitesNecessaires,
} from '../_calcul-commun/fractions';
import { aDire } from '../_calcul-commun/tirer';
import { Bandeau, Bulle, type Champ, EtatVide, SaisieChamps, useManches, vide } from '../_calcul-commun/ui';
import { GARNITURES, type Garniture, Pizza } from './Pizza';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
const MAX_DENOM = 12;
const CHAMPS: Champ[] = [
  { cle: 'n', nom: 'numérateur', max: 2 },
  { cle: 'd', nom: 'dénominateur', max: 2 },
];

const convertir = (it: Item): VisualFractionItem | null =>
  it.kind === 'visual_fraction' && fractionJouable(it, MAX_DENOM) ? it : null;

/** Répartit `n` parts garnies sur `k` pizzas coupées en `d`. */
const remplir = (n: number, d: number, k: number) =>
  Array.from({ length: k }, (_, p) => Array.from({ length: d }, (_, i) => p * d + i < n));

export default function Pizzaiolo(props: GameProps) {
  const { level, lectureAuto, speech, sfx, paused } = props;
  const reduce = useReducedMotion();
  const jeu = useManches(props, {
    total: parNiveau(level, MANCHES),
    convertir,
    fin: (b, t) => ({
      headline:
        b === t
          ? 'Pizzaïolo d’or ! 🍕'
          : `${b} pizza${b > 1 ? 's' : ''} servie${b > 1 ? 's' : ''} sur ${t} !`,
    }),
    delaiJuste: 1700,
  });
  const { courant, manche, total, etat, fini, repondre, suivant, bonnes } = jeu;
  const item = courant?.valeur ?? null;
  const f: Frac = item ? { n: item.numerator, d: item.denominator } : { n: 0, d: 1 };
  const o: Frac | null = item?.other ? { n: item.other.numerator, d: item.other.denominator } : null;
  const garniture: Garniture = GARNITURES[(manche * 3 + f.n + f.d) % GARNITURES.length]!.id;
  const nomGarniture = GARNITURES.find((g) => g.id === garniture)!;
  const k = unitesNecessaires(f);

  const [phase, setPhase] = useState<'couper' | 'garnir'>('garnir');
  const [coupe, setCoupe] = useState(1);
  const [garnies, setGarnies] = useState<boolean[][]>([]);
  const [saisie, setSaisie] = useState<Record<string, string>>(vide(CHAMPS));
  const [message, setMessage] = useState<string | undefined>();
  const [aideCoupe, setAideCoupe] = useState<string | null>(null);

  const propositions = useMemo(() => {
    if (!item || item.task !== 'lire') return [];
    const p = propositionsFraction(f, 3);
    const r = (manche + f.n) % p.length;
    return [...p.slice(r), ...p.slice(0, r)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, manche]);

  const choixComparer = useMemo(() => (o ? [formatFrac(f), formatFrac(o), 'Autant'] : []), [item]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!item) return;
    const doitCouper = item.task === 'colorier' && level !== 'facile';
    setPhase(doitCouper ? 'couper' : 'garnir');
    setCoupe(1);
    setGarnies(item.task === 'colorier' ? remplir(0, f.d, k) : remplir(f.n, f.d, k));
    setSaisie(vide(CHAMPS));
    setMessage(undefined);
    setAideCoupe(null);
    if (lectureAuto) void speech.speak(aDire(adapterEnonce(item.spoken ?? item.prompt, 'pizza')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const bloque = !!etat || paused || fini;
  const nbGarnies = garnies.flat().filter(Boolean).length;

  const couper = useCallback(() => {
    if (bloque || phase !== 'couper') return;
    sfx.play('lame');
    if (coupe !== f.d) {
      setAideCoupe(
        `Presque ! Le dénominateur est ${f.d} : on coupe chaque pizza en ${f.d} parts égales (des ${fracEnMots({ n: 2, d: f.d }).split(' ').slice(1).join(' ')}).`,
      );
      sfx.play('glisse');
    } else setAideCoupe(null);
    setCoupe(f.d);
    setGarnies(remplir(0, f.d, k));
    setPhase('garnir');
  }, [bloque, phase, coupe, f.d, k, sfx]);

  const servir = useCallback(() => {
    if (!item || bloque) return;
    if (item.task === 'colorier') {
      if (phase !== 'garnir') return couper();
      const juste = nbGarnies === f.n;
      setMessage(
        juste
          ? `Miam ! ${formatFrac(f)} de pizza ${nomGarniture.nom}.`
          : nbGarnies < f.n
            ? `Presque ! Il manque ${f.n - nbGarnies} part${f.n - nbGarnies > 1 ? 's' : ''}.`
            : `Presque ! Il y a ${nbGarnies - f.n} part${nbGarnies - f.n > 1 ? 's' : ''} de trop.`,
      );
      if (!juste) setGarnies(remplir(f.n, f.d, k));
      repondre(juste, `${nbGarnies}/${f.d}`, formatFrac(f));
    }
  }, [item, bloque, phase, couper, nbGarnies, f, k, nomGarniture, repondre]);

  const lire = useCallback(
    (choix?: number) => {
      if (!item || bloque) return;
      let donne: Frac;
      if (choix !== undefined) {
        const [n, d] = (propositions[choix] ?? '0/1').split('/').map(Number) as [number, number];
        donne = { n, d };
      } else {
        if (!saisie.n || !saisie.d) return;
        donne = { n: Number(saisie.n), d: Number(saisie.d) };
      }
      const exact = donne.n === f.n && donne.d === f.d;
      const juste = exact || (donne.d > 0 && comparer(donne, f) === 0);
      setMessage(
        juste ? (exact ? 'Exact !' : `Juste ! ${formatFrac(donne)} = ${formatFrac(f)}.`) : undefined,
      );
      repondre(juste, formatFrac(donne), formatFrac(f));
    },
    [item, bloque, propositions, saisie, f, repondre],
  );

  const comparerChoix = useCallback(
    (i: number) => {
      if (!item || !o || bloque) return;
      const c = comparer(f, o);
      const bon = c > 0 ? 0 : c < 0 ? 1 : 2;
      setMessage(i === bon ? 'Bien vu !' : undefined);
      repondre(i === bon, choixComparer[i] ?? '', choixComparer[bon] ?? '');
    },
    [item, o, bloque, f, choixComparer, repondre],
  );

  // Clavier : flèches pour couper, + / − pour garnir, Entrée pour servir
  useEffect(() => {
    if (!item || item.task !== 'colorier' || bloque) return;
    const h = (e: KeyboardEvent) => {
      if (phase === 'couper') {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === '+') {
          e.preventDefault();
          setCoupe((c) => Math.min(MAX_DENOM, c + 1));
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === '-') {
          e.preventDefault();
          setCoupe((c) => Math.max(1, c - 1));
        } else if (
          e.key === 'Enter' &&
          (document.activeElement as HTMLElement | null)?.tagName !== 'BUTTON'
        ) {
          e.preventDefault();
          couper();
        }
        return;
      }
      if (e.key === '+') {
        e.preventDefault();
        setGarnies((g) => {
          const n = g.flat().filter(Boolean).length;
          return remplir(Math.min(f.d * k, n + 1), f.d, k);
        });
      } else if (e.key === '-') {
        e.preventDefault();
        setGarnies((g) => remplir(Math.max(0, g.flat().filter(Boolean).length - 1), f.d, k));
      } else if (e.key === 'Enter' && (document.activeElement as HTMLElement | null)?.tagName !== 'BUTTON') {
        e.preventDefault();
        servir();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [item, bloque, phase, couper, servir, f.d, k]);

  if (!item)
    return <EtatVide icone="🍕" jeu="Le Pizzaïolo" besoin="d’exercices de fractions avec des pizzas" />;

  const enonce = adapterEnonce(item.prompt, 'pizza');
  const parle = aDire(adapterEnonce(item.spoken ?? item.prompt, 'pizza'));
  const taille = k > 1 ? 150 : 230;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          Commande {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🍕</span> {bonnes}
        </Hud>
      </Bandeau>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <section
          className="relative flex flex-col items-center gap-2 overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-[#FCE3B8] to-[#E8B87E] p-3 shadow-soft"
          aria-label="La pizzeria"
        >
          {/* four et client */}
          <div className="flex w-full items-end justify-between">
            <svg viewBox="0 0 120 80" className="h-16 w-24" aria-hidden>
              <path d="M10 78 V40 a50 36 0 0 1 100 0 V78 Z" fill="#B0563B" />
              <path d="M30 78 V52 a30 22 0 0 1 60 0 V78 Z" fill="#2B1D14" />
              <path d="M40 78 q8 -18 20 -6 q10 -16 20 6 Z" fill={reduce ? '#FF7A6B' : '#FFB74D'}>
                {!reduce && !paused && (
                  <animate
                    attributeName="d"
                    dur="1.2s"
                    repeatCount="indefinite"
                    values="M40 78 q8 -18 20 -6 q10 -16 20 6 Z;M40 78 q8 -12 20 -10 q10 -10 20 10 Z;M40 78 q8 -18 20 -6 q10 -16 20 6 Z"
                  />
                )}
              </path>
            </svg>
            <div className="flex items-end gap-1">
              <div className="mb-8 rounded-2xl bg-white px-3 py-1 font-titre text-lg font-extrabold shadow-pop-sm">
                {item.task === 'comparer' && o ? (
                  <span>
                    {formatFrac(f)} ou {formatFrac(o)} ?
                  </span>
                ) : item.task === 'colorier' ? (
                  <span>
                    {formatFrac(f)} {nomGarniture.emoji}
                  </span>
                ) : (
                  <span>? {nomGarniture.emoji}</span>
                )}
              </div>
              <Client
                graine={(manche * 11 + f.d) % 50}
                humeur={etat === 'juste' ? 'content' : etat === 'faux' ? 'pense' : 'neutre'}
                taille={90}
              />
            </div>
          </div>

          {item.task === 'comparer' && o ? (
            <div className="flex w-full flex-wrap items-start justify-center gap-4">
              {[f, o].map((x, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="rounded-full bg-white px-3 font-titre text-lg font-extrabold">
                    {i === 0 ? 'Commande A' : 'Commande B'} : {formatFrac(x)}
                  </span>
                  <div className="flex flex-wrap justify-center gap-1">
                    {remplir(x.n, x.d, unitesNecessaires(x)).map((g, p) => (
                      <Pizza
                        key={p}
                        parts={x.d}
                        garnies={g}
                        garniture={garniture}
                        taille={unitesNecessaires(x) > 1 ? 110 : 150}
                        label={`Pizza de la commande ${i === 0 ? 'A' : 'B'} : ${formatFrac(x)}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              key={`${manche}`}
              className="flex flex-wrap items-center justify-center gap-2"
              initial={reduce ? false : { scale: 0.8, opacity: 0 }}
              animate={
                etat === 'juste' && !reduce
                  ? { scale: [1, 1.08, 0.9], y: [0, -10, 30], opacity: [1, 1, 0.4] }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ duration: etat === 'juste' ? 1.2 : 0.35 }}
            >
              {(phase === 'couper' ? [Array(1).fill(false) as boolean[]] : garnies).map((g, p) =>
                Array.from({ length: phase === 'couper' ? k : 1 }, (_, q) => (
                  <Pizza
                    key={`${p}-${q}`}
                    parts={phase === 'couper' ? 1 : f.d}
                    garnies={phase === 'couper' ? [false] : g}
                    garniture={garniture}
                    taille={taille}
                    apercuCoupe={phase === 'couper' ? coupe : undefined}
                    interactif={item.task === 'colorier' && phase === 'garnir' && !bloque}
                    onChange={(ng) => {
                      sfx.play('pop');
                      setGarnies((all) => all.map((x, i) => (i === p ? ng : x)));
                    }}
                    label={
                      item.task === 'colorier'
                        ? `Pizza ${p + 1} : touche les parts pour les garnir`
                        : `Pizza coupée en ${f.d} parts, ${g.filter(Boolean).length} garnies`
                    }
                    etat={etat}
                  />
                )),
              )}
            </motion.div>
          )}
        </section>

        <section className="carte flex min-w-0 flex-col items-center gap-3 p-4">
          <div className="flex items-start gap-3">
            <SpeakButton text={parle} label="Écouter la commande" />
            <p className="font-titre text-xl font-extrabold leading-snug sm:text-2xl" aria-live="polite">
              {enonce}
            </p>
          </div>

          {item.task === 'colorier' && phase === 'couper' && (
            <div className="flex flex-col items-center gap-2">
              <p className="font-bold">En combien de parts égales je coupe chaque pizza ?</p>
              <div className="flex items-center gap-3" role="group" aria-label="Nombre de parts">
                <Button
                  variant="blanc"
                  onClick={() => setCoupe((c) => Math.max(1, c - 1))}
                  disabled={bloque}
                  aria-label="Une part de moins"
                >
                  <Minus aria-hidden />
                </Button>
                <span
                  className="min-w-[3ch] text-center font-titre text-4xl font-extrabold"
                  aria-live="polite"
                >
                  {coupe}
                </span>
                <Button
                  variant="blanc"
                  onClick={() => setCoupe((c) => Math.min(MAX_DENOM, c + 1))}
                  disabled={bloque}
                  aria-label="Une part de plus"
                >
                  <Plus aria-hidden />
                </Button>
              </div>
              <Button
                variant="coral"
                size="lg"
                icon={<Scissors aria-hidden />}
                onClick={couper}
                disabled={bloque}
              >
                Couper !
              </Button>
            </div>
          )}

          {aideCoupe && phase === 'garnir' && !etat && (
            <Bulle>
              <span aria-hidden>🔪</span>
              <span>{aideCoupe}</span>
            </Bulle>
          )}

          {item.task === 'colorier' && phase === 'garnir' && (
            <>
              <p className="text-center font-bold">
                Touche les parts pour les garnir {nomGarniture.emoji}
                {level !== 'plus_loin' && (
                  <span className="mt-1 block font-titre text-2xl" aria-live="polite">
                    {nbGarnies} part{nbGarnies > 1 ? 's' : ''} garnie{nbGarnies > 1 ? 's' : ''}
                    {level === 'facile' ? ` sur ${f.n} demandée${f.n > 1 ? 's' : ''}` : ''}
                  </span>
                )}
              </p>
              <Button variant="grass" size="lg" onClick={servir} disabled={bloque}>
                Servir !
              </Button>
            </>
          )}

          {item.task === 'lire' &&
            (level === 'facile' ? (
              <ChoiceGrid
                choices={propositions}
                onPick={(i) => lire(i)}
                reveal={etat ? { correct: propositions.indexOf(formatFrac(f)), chosen: null } : null}
                disabled={bloque}
              />
            ) : (
              <SaisieChamps
                champs={CHAMPS}
                valeurs={saisie}
                onChange={setSaisie}
                onValider={() => lire()}
                disabled={bloque}
                etat={etat}
                disposition="fraction"
              />
            ))}

          {item.task === 'comparer' && (
            <ChoiceGrid
              choices={choixComparer}
              onPick={comparerChoix}
              reveal={
                etat && o
                  ? { correct: comparer(f, o) > 0 ? 0 : comparer(f, o) < 0 ? 1 : 2, chosen: null }
                  : null
              }
              disabled={bloque}
            />
          )}

          <AnimatePresence>
            {etat && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                <Feedback
                  state={etat}
                  message={message}
                  expected={
                    etat === 'faux'
                      ? item.task === 'comparer' && o
                        ? comparer(f, o) === 0
                          ? 'autant'
                          : formatFrac(comparer(f, o) > 0 ? f : o)
                        : `${formatFrac(f)} (${fracEnMots(f)})`
                      : undefined
                  }
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
