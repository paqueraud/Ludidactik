/**
 * Le Pâtissier proportionnel (CATALOGUE n° 17, CM1-CM2).
 * Adapter une recette au nombre d'invités : la recette est un tableau de proportionnalité, une case est
 * vide. Raisonnements du BO (sans « règle de trois » ni produit en croix) : « 3 fois plus d'invités →
 * 3 fois plus d'œufs », somme de deux lignes, passage par l'unité.
 * Niveaux : Facile = la flèche d'aide (× 3, + …, pour 1…) est dessinée ; Normal = 1 indice ;
 * Plus loin = sans aide. Chaque recette réussie décore le gâteau final.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level, NumericItem } from '@/content/schemas';
import { checkNumeric, formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { parNiveau } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import { type Aide, type Tableau, aides, lireTableau } from '../_calcul-commun/tableau';
import { aDire } from '../_calcul-commun/tirer';
import { Bandeau, Bulle, type Champ, EtatVide, SaisieChamps, useManches, vide } from '../_calcul-commun/ui';
import { Gateau } from './Gateau';

const MANCHES: Record<Level, number> = { facile: 5, normal: 6, plus_loin: 8 };
const HAUTEUR_LIGNE = 56;

interface Exo {
  item: NumericItem;
  t: Tableau;
  aides: Aide[];
}
const convertir = (it: Item): Exo | null => {
  const t = lireTableau(it);
  return t && it.kind === 'numeric_answer' ? { item: it, t, aides: aides(t) } : null;
};

/** Aide dessinée : la plus simple (× / ÷ depuis une ligne, puis somme, puis unité). */
const meilleureAide = (a: Aide[]) => a[0] ?? null;

export default function Patissier(props: GameProps) {
  const { level, lectureAuto, speech, paused } = props;
  const reduce = useReducedMotion();
  const total = parNiveau(level, MANCHES);
  const jeu = useManches(props, {
    total,
    convertir,
    fin: (b, t) => ({
      headline:
        b === t
          ? 'Chef pâtissier ! Ton gâteau est magnifique 🎂'
          : `Ton gâteau a ${b} décoration${b > 1 ? 's' : ''} !`,
    }),
    delaiJuste: 1600,
  });
  const { courant, manche, etat, fini, repondre, suivant, bonnes } = jeu;
  const exo = courant?.valeur ?? null;
  const champ = useMemo<Champ[]>(
    () => [{ cle: 'r', nom: 'réponse', max: 9, suffixe: exo?.item.unit }],
    [exo],
  );
  const [saisie, setSaisie] = useState<Record<string, string>>({ r: '' });
  const [indice, setIndice] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [hint, setHint] = useState<string | undefined>();

  useEffect(() => {
    if (!exo) return;
    setSaisie(vide(champ));
    setIndice(level === 'facile');
    setMessage(undefined);
    setHint(undefined);
    if (lectureAuto) void speech.speak(aDire(exo.item.spoken));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exo]);

  const bloque = !!etat || paused || fini;

  const valider = useCallback(() => {
    if (!exo || bloque || !saisie.r) return;
    const c = checkNumeric(saisie.r, exo.item.answer, { tolerateZeros: level !== 'plus_loin' });
    setHint(c.hint);
    setMessage(c.correct ? 'Recette réussie ! Une décoration de plus 🍓' : undefined);
    repondre(c.correct, saisie.r, formatNumber(exo.item.answer));
  }, [exo, bloque, saisie, level, repondre]);

  if (!exo)
    return <EtatVide icone="🎂" jeu="Le Pâtissier" besoin="de recettes en tableau de proportionnalité" />;

  const { item, t } = exo;
  const aide = indice || etat === 'faux' ? meilleureAide(exo.aides) : null;
  const aideTexte = etat === 'faux' ? exo.aides[0]?.texte : aide?.indice;
  const lignesAide = aide ? (aide.type === 'somme' ? aide.lignes : [aide.depuis]) : [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          Recette {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🍓</span> {bonnes}
        </Hud>
      </Bandeau>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <section
          className="relative flex flex-col items-center gap-3 overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-[#FFF0F5] to-[#FCE4EC] p-3 shadow-soft"
          aria-label="La cuisine du pâtissier"
        >
          {/* carte de recette = tableau de proportionnalité */}
          <motion.div
            key={manche}
            initial={reduce ? false : { rotate: -3, y: 20, opacity: 0 }}
            animate={{ rotate: 0, y: 0, opacity: 1 }}
            className="relative w-full max-w-md rounded-2xl border-2 border-[#E0A458] bg-[#FFFDF7] p-3 pl-16 shadow-pop-sm"
          >
            <p className="mb-2 text-center font-titre text-lg font-extrabold text-[#8A5A3B]">📜 Ma recette</p>
            <div className="relative">
              <div
                className="grid grid-cols-2 overflow-hidden rounded-xl border-2 border-ink/20"
                role="table"
                aria-label="Tableau de la recette"
              >
                <div role="row" className="contents">
                  {t.entetes.map((e) => (
                    <div
                      key={e}
                      role="columnheader"
                      className="flex h-12 items-center justify-center bg-[#FFE0B2] px-1 text-center font-bold leading-tight"
                    >
                      {e}
                    </div>
                  ))}
                </div>
                {t.lignes.map((l, i) => (
                  <div key={i} role="row" className="contents">
                    {l.map((v, c) => {
                      const trou = i === t.ligne && c === t.col;
                      const surligne = lignesAide.includes(i);
                      return (
                        <div
                          key={c}
                          role="cell"
                          className={`flex items-center justify-center border-t-2 border-ink/10 font-titre text-2xl font-extrabold ${
                            c === 0 ? 'border-r-2' : ''
                          } ${surligne ? 'bg-sun/30' : ''} ${trou ? 'bg-sky/15' : ''}`}
                          style={{ height: HAUTEUR_LIGNE }}
                        >
                          {trou ? (
                            <span
                              className={`rounded-lg border-4 border-dashed px-2 ${etat === 'juste' ? 'border-grass text-grass-dark' : etat === 'faux' ? 'border-coral text-coral-dark' : 'border-sky text-ink/40'}`}
                            >
                              {etat ? formatNumber(item.answer) : saisie.r || '?'}
                            </span>
                          ) : (
                            formatNumber(v!)
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              {/* flèche d'aide entre les lignes (à gauche du tableau) */}
              {aide && aide.type !== 'unite' && (
                <FlecheAide
                  de={aide.type === 'somme' ? aide.lignes : [aide.depuis]}
                  vers={t.ligne}
                  texte={aide.type === 'fois' ? `× ${aide.k}` : aide.type === 'divise' ? `÷ ${aide.k}` : '+'}
                />
              )}
              {aide?.type === 'unite' && (
                <span className="absolute -left-14 top-1/2 -translate-y-1/2 rounded-full bg-grape px-2 py-0.5 text-sm font-bold text-white">
                  pour 1
                </span>
              )}
            </div>
          </motion.div>
          <Gateau reussites={bonnes} total={total} taille={150} />
        </section>

        <section className="carte flex min-w-0 flex-col items-center gap-3 p-4">
          <div className="flex items-start gap-3">
            <SpeakButton text={aDire(item.spoken)} label="Écouter la recette" />
            <p className="font-titre text-xl font-extrabold leading-snug sm:text-2xl" aria-live="polite">
              {item.prompt}
            </p>
          </div>
          {aideTexte && !etat && (
            <Bulle ton="grape">
              <span aria-hidden>👩‍🍳</span>
              <span>{aideTexte}</span>
            </Bulle>
          )}
          {level === 'normal' && !indice && !etat && exo.aides.length > 0 && (
            <Button
              variant="sun"
              icon={<Lightbulb aria-hidden />}
              onClick={() => setIndice(true)}
              disabled={bloque}
            >
              Indice
            </Button>
          )}
          <SaisieChamps
            champs={champ}
            valeurs={saisie}
            onChange={setSaisie}
            onValider={valider}
            disabled={bloque}
            etat={etat}
            decimal
          />
          <AnimatePresence>
            {etat && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                <Feedback
                  state={etat}
                  message={message ?? (hint ? `Presque ! ${hint}` : undefined)}
                  expected={
                    etat === 'faux'
                      ? `${formatNumber(item.answer)}${item.unit ? ` ${item.unit}` : ''}`
                      : undefined
                  }
                  explication={
                    etat === 'faux'
                      ? `${item.explication}${aideTexte && !item.explication.includes(aideTexte) ? ` ${aideTexte}` : ''}`
                      : undefined
                  }
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

/** Flèche courbe à gauche du tableau, d'une (ou deux) ligne(s) vers la ligne à compléter. */
function FlecheAide({ de, vers, texte }: { de: number[]; vers: number; texte: string }) {
  const y = (i: number) => 48 + i * HAUTEUR_LIGNE + HAUTEUR_LIGNE / 2;
  const yv = y(vers);
  return (
    <svg className="pointer-events-none absolute -left-16 top-0 h-full w-16 overflow-visible" aria-hidden>
      {de.map((d) => {
        const yd = y(d);
        const mid = (yd + yv) / 2;
        return (
          <g key={d}>
            <path
              d={`M 60 ${yd} C 10 ${yd}, 10 ${yv}, 56 ${yv}`}
              fill="none"
              stroke="#8E7CFF"
              strokeWidth="3"
            />
            <path
              d={`M 50 ${yv - 6} L 58 ${yv} L 50 ${yv + 6}`}
              fill="none"
              stroke="#8E7CFF"
              strokeWidth="3"
            />
            <foreignObject x="0" y={mid - 14} width="44" height="28">
              <div className="flex h-full items-center justify-center rounded-full bg-grape text-sm font-extrabold text-white">
                {texte}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
