/**
 * Le Chocolatier (CATALOGUE n° 14) — fractions avec le modèle de la bande / tablette (BO).
 * - colorier : préparer la commande (« 3/8 de la tablette ») : choisir le bon moule (une tablette de
 *   8 carrés), puis emballer 3 carrés dans du papier doré. Fractions > 1 : plusieurs tablettes.
 *   Les commandes « 1/5 + 2/5 » ou « compléter à 1 » arrivent comme des items `colorier` (le résultat
 *   est le numérateur) : l'énoncé de l'item est affiché tel quel.
 * - lire : quelle fraction de la tablette est emballée ? (Facile : 3 propositions ; sinon on l'écrit.)
 * - comparer : deux bandes de même longueur, l'une sous l'autre : laquelle a le plus de chocolat ?
 *   (Plus loin : on répond d'abord sans voir les bandes, elles apparaissent dans la correction.)
 * Niveaux : Facile = bon moule déjà posé, compteur ; Normal = choisir le moule, compteur ; Plus loin =
 * choisir le moule, sans compteur. Clavier : A/B/C pour le moule, « + » / « − » (ou flèches) pour emballer,
 * Entrée pour valider.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
  grilleTablette,
  propositionsFraction,
  unitesNecessaires,
} from '../_calcul-commun/fractions';
import { aDire } from '../_calcul-commun/tirer';
import { Bandeau, type Champ, EtatVide, SaisieChamps, useManches, vide } from '../_calcul-commun/ui';
import { Tablette } from './Tablette';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
const MAX_DENOM = 60;
const CHAMPS: Champ[] = [
  { cle: 'n', nom: 'numérateur', max: 2 },
  { cle: 'd', nom: 'dénominateur', max: 2 },
];
const PAPIERS = ['#FFD45C', '#FF9AA2', '#8EE3C8', '#B9A7FF'];

const convertir = (it: Item): VisualFractionItem | null =>
  it.kind === 'visual_fraction' && fractionJouable(it, MAX_DENOM) ? it : null;

const remplir = (n: number, d: number, k: number) =>
  Array.from({ length: k }, (_, p) => Array.from({ length: d }, (_, i) => p * d + i < n));

/** Forme d'une tablette : une bande (1 ligne) si l'item le demande ou si la fraction est petite. */
function forme(item: VisualFractionItem, d: number): [number, number] {
  if (item.shape === 'barre' || item.task === 'comparer') return [1, d];
  return grilleTablette(d, 10);
}

/** Trois moules : le bon (d carrés) et deux voisins plausibles. */
function moules(d: number, graine: number): number[] {
  const autres = [d + 1, d - 1, d * 2, d + 2, d - 2, Math.round(d / 2)].filter(
    (x) => x >= 2 && x !== d && x <= MAX_DENOM,
  );
  const out = [d, autres[0], autres[graine % 2 === 0 ? 2 : 1] ?? autres[1]].filter(
    (x): x is number => x !== undefined,
  );
  const uniques = [...new Set(out)].slice(0, 3);
  const r = graine % uniques.length;
  return [...uniques.slice(r), ...uniques.slice(0, r)];
}

export default function Chocolatier(props: GameProps) {
  const { level, lectureAuto, speech, sfx, paused } = props;
  const reduce = useReducedMotion();
  const jeu = useManches(props, {
    total: parNiveau(level, MANCHES),
    convertir,
    fin: (b, t) => ({
      headline:
        b === t
          ? 'Grand maître chocolatier ! 🍫'
          : `${b} commande${b > 1 ? 's' : ''} réussie${b > 1 ? 's' : ''} sur ${t} !`,
    }),
    delaiJuste: 1600,
  });
  const { courant, manche, total, etat, fini, repondre, suivant, bonnes } = jeu;
  const item = courant?.valeur ?? null;
  const f: Frac = item ? { n: item.numerator, d: item.denominator } : { n: 0, d: 1 };
  const o: Frac | null = item?.other ? { n: item.other.numerator, d: item.other.denominator } : null;
  const k = unitesNecessaires(f);
  const papier = PAPIERS[manche % PAPIERS.length]!;

  const [phase, setPhase] = useState<'moule' | 'emballer'>('emballer');
  const [pris, setPris] = useState<boolean[][]>([]);
  const [saisie, setSaisie] = useState<Record<string, string>>(vide(CHAMPS));
  const [message, setMessage] = useState<string | undefined>();
  const [noteMoule, setNoteMoule] = useState<string | null>(null);

  const listeMoules = useMemo(() => moules(f.d, manche + f.n), [item, manche]); // eslint-disable-line react-hooks/exhaustive-deps
  const propositions = useMemo(() => {
    if (!item || item.task !== 'lire') return [];
    const p = propositionsFraction(f, 3);
    const r = (manche + f.d) % p.length;
    return [...p.slice(r), ...p.slice(0, r)];
  }, [item, manche]); // eslint-disable-line react-hooks/exhaustive-deps
  const choixComparer = useMemo(
    () => (o ? [`A : ${formatFrac(f)}`, `B : ${formatFrac(o)}`, 'Autant'] : []),
    [item],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!item) return;
    setPhase(item.task === 'colorier' && level !== 'facile' ? 'moule' : 'emballer');
    setPris(item.task === 'colorier' ? remplir(0, f.d, k) : remplir(f.n, f.d, k));
    setSaisie(vide(CHAMPS));
    setMessage(undefined);
    setNoteMoule(null);
    if (lectureAuto) void speech.speak(aDire(adapterEnonce(item.spoken ?? item.prompt, 'tablette')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const bloque = !!etat || paused || fini;
  const nbPris = pris.flat().filter(Boolean).length;

  const choisirMoule = useCallback(
    (i: number) => {
      if (bloque || phase !== 'moule') return;
      const m = listeMoules[i]!;
      if (m !== f.d)
        setNoteMoule(
          `Presque ! Ce moule a ${m} carrés. Le dénominateur est ${f.d} : il faut une tablette de ${f.d} carrés égaux.`,
        );
      else setNoteMoule(null);
      sfx.play(m === f.d ? 'pop' : 'glisse');
      setPhase('emballer');
    },
    [bloque, phase, listeMoules, f.d, sfx],
  );

  const valider = useCallback(() => {
    if (!item || bloque) return;
    if (item.task === 'colorier' && phase === 'emballer') {
      const juste = nbPris === f.n;
      setMessage(
        juste
          ? `Délicieux ! ${formatFrac(f)} de la tablette.`
          : nbPris < f.n
            ? `Presque ! Il manque ${f.n - nbPris} carré${f.n - nbPris > 1 ? 's' : ''}.`
            : `Presque ! Il y a ${nbPris - f.n} carré${nbPris - f.n > 1 ? 's' : ''} de trop.`,
      );
      if (!juste) setPris(remplir(f.n, f.d, k));
      repondre(juste, `${nbPris}/${f.d}`, formatFrac(f));
    }
  }, [item, bloque, phase, nbPris, f, k, repondre]);

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

  const bonComparer = o ? (comparer(f, o) > 0 ? 0 : comparer(f, o) < 0 ? 1 : 2) : 0;
  const choisirComparer = useCallback(
    (i: number) => {
      if (!item || bloque) return;
      setMessage(i === bonComparer ? 'Bien vu, gourmand !' : undefined);
      repondre(i === bonComparer, choixComparer[i] ?? '', choixComparer[bonComparer] ?? '');
    },
    [item, bloque, bonComparer, choixComparer, repondre],
  );

  // Clavier : + / − (ou flèches) pour emballer, Entrée pour valider
  useEffect(() => {
    if (!item || item.task !== 'colorier' || phase !== 'emballer' || bloque) return;
    const h = (e: KeyboardEvent) => {
      if (['+', 'ArrowRight', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        sfx.play('pop');
        setPris((p) => remplir(Math.min(f.d * k, p.flat().filter(Boolean).length + 1), f.d, k));
      } else if (['-', 'ArrowLeft', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        setPris((p) => remplir(Math.max(0, p.flat().filter(Boolean).length - 1), f.d, k));
      } else if (e.key === 'Enter' && (document.activeElement as HTMLElement | null)?.tagName !== 'BUTTON') {
        e.preventDefault();
        valider();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [item, phase, bloque, f.d, k, sfx, valider]);

  if (!item) return <EtatVide icone="🍫" jeu="Le Chocolatier" besoin="d’exercices de fractions" />;

  const [lignes, colonnes] = forme(item, f.d);
  const enonce = adapterEnonce(item.prompt, 'tablette');
  const parle = aDire(adapterEnonce(item.spoken ?? item.prompt, 'tablette'));
  const montrerBandes = !(item.task === 'comparer' && level === 'plus_loin' && !etat);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          Commande {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🍫</span> {bonnes}
        </Hud>
      </Bandeau>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <section
          className="relative flex flex-col items-center gap-3 overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-[#FBE3EC] to-[#F3C6D6] p-3 shadow-soft"
          aria-label="La chocolaterie"
        >
          <div className="flex w-full items-end justify-between">
            <div className="flex gap-1 text-3xl" aria-hidden>
              <span>🍫</span>
              <span>🍬</span>
              <span>🧁</span>
            </div>
            <Client
              graine={(manche * 13 + f.d) % 50}
              humeur={etat === 'juste' ? 'content' : etat === 'faux' ? 'pense' : 'neutre'}
              taille={86}
            />
          </div>

          {item.task === 'colorier' && phase === 'moule' ? (
            <div className="flex w-full flex-wrap items-end justify-center gap-3" aria-hidden>
              {listeMoules.map((m, i) => {
                const [l, c] = grilleTablette(m, 10);
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="rounded-full bg-white px-2 font-titre font-extrabold">
                      {['A', 'B', 'C'][i]}
                    </span>
                    <Tablette
                      d={m}
                      lignes={item.shape === 'barre' ? 1 : l}
                      colonnes={item.shape === 'barre' ? m : c}
                      pris={[]}
                      largeurMax={100}
                      label={`Moule de ${m} carrés`}
                    />
                  </div>
                );
              })}
            </div>
          ) : item.task === 'comparer' && o ? (
            <div className="flex w-full flex-col gap-3">
              {[f, o].map((x, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 font-titre text-2xl font-extrabold">
                    {i === 0 ? 'A' : 'B'}
                  </span>
                  <div className="min-w-0 flex-1">
                    {montrerBandes ? (
                      <Tablette
                        d={x.d * unitesNecessaires(x)}
                        lignes={1}
                        colonnes={x.d * unitesNecessaires(x)}
                        pris={remplir(x.n, x.d * unitesNecessaires(x), 1)[0]!}
                        largeurFixe={
                          (340 / Math.max(unitesNecessaires(f), unitesNecessaires(o))) * unitesNecessaires(x)
                        }
                        label={`Bande ${i === 0 ? 'A' : 'B'} : ${formatFrac(x)}`}
                        couleur={i === 0 ? '#FFD45C' : '#8EE3C8'}
                      />
                    ) : (
                      <div className="flex h-12 items-center justify-center rounded-xl bg-[#5D3420]/20 font-titre text-xl font-bold">
                        {formatFrac(x)} — imagine la bande !
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              key={`${manche}-${phase}`}
              className="flex w-full flex-wrap items-center justify-center gap-2"
              initial={reduce ? false : { y: 20, opacity: 0 }}
              animate={
                etat === 'juste' && !reduce ? { scale: [1, 1.06, 1], opacity: 1, y: 0 } : { opacity: 1, y: 0 }
              }
            >
              {pris.map((p, i) => (
                <Tablette
                  key={i}
                  d={f.d}
                  lignes={lignes}
                  colonnes={colonnes}
                  pris={p}
                  interactif={item.task === 'colorier' && !bloque}
                  onChange={(np) => {
                    sfx.play('pop');
                    setPris((all) => all.map((x, j) => (j === i ? np : x)));
                  }}
                  largeurMax={k > 1 ? 220 : 360}
                  label={
                    item.task === 'colorier'
                      ? `Tablette ${i + 1} de ${f.d} carrés : touche les carrés pour les emballer`
                      : `Tablette de ${f.d} carrés, ${p.filter(Boolean).length} emballés`
                  }
                  couleur={papier}
                  etat={etat}
                />
              ))}
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

          {item.task === 'colorier' && phase === 'moule' && (
            <>
              <p className="font-bold">Choisis le bon moule à chocolat :</p>
              <ChoiceGrid
                choices={listeMoules.map((m) => `${m} carrés`)}
                onPick={choisirMoule}
                disabled={bloque}
              />
            </>
          )}

          {item.task === 'colorier' && phase === 'emballer' && (
            <>
              {noteMoule && (
                <p className="w-full rounded-2xl bg-sun/25 px-4 py-2 font-bold" role="status">
                  🍫 {noteMoule}
                </p>
              )}
              <p className="text-center font-bold">
                Touche les carrés pour les emballer
                {level !== 'plus_loin' && (
                  <span className="mt-1 block font-titre text-2xl" aria-live="polite">
                    {nbPris} carré{nbPris > 1 ? 's' : ''} emballé{nbPris > 1 ? 's' : ''} sur {f.d * k}
                  </span>
                )}
              </p>
              <Button variant="grass" size="lg" onClick={valider} disabled={bloque}>
                C’est prêt !
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
              onPick={choisirComparer}
              reveal={etat ? { correct: bonComparer, chosen: null } : null}
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
                        ? bonComparer === 2
                          ? 'autant'
                          : formatFrac(bonComparer === 0 ? f : o)
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
