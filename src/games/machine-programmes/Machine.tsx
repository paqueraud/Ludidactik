/**
 * La Machine à programmes de calcul (CATALOGUE n° 18, CM2).
 * - Programme (`meta.programme`) : « choisis un nombre → × 3 → + 5 ». La machine est verticale : le
 *   nombre entre en haut, traverse les engrenages et ressort en bas.
 *   Exécuter (sortie inconnue) ou retrouver l'entrée (on remonte la machine avec les opérations inverses).
 *   Facile = on écrit le nombre après chaque engrenage ; Normal = seulement le résultat, 1 indice ;
 *   Plus loin = seulement le résultat, sans indice.
 * - Suite de motifs (`meta.suite`) : des motifs qui grandissent ; combien à l'étape n ?
 *   Facile = les écarts (+ 4) sont affichés ; Normal = 1 indice ; Plus loin = sans aide.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level, NumericItem } from '@/content/schemas';
import { checkNumeric, formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { parNiveau } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import {
  type Programme,
  type Suite,
  inverse,
  lireProgramme,
  lireSuite,
  texteEtape,
} from '../_calcul-commun/programme';
import { aDire } from '../_calcul-commun/tirer';
import { Bandeau, Bulle, type Champ, EtatVide, SaisieChamps, useManches, vide } from '../_calcul-commun/ui';
import { Engrenage } from './Engrenage';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
const CHAMP: Champ[] = [{ cle: 'r', nom: 'nombre', max: 9 }];
const COULEURS = ['#FFD45C', '#4FC3F7', '#FF7A6B', '#7BD389'];

type Exo =
  | { item: NumericItem; prog: Programme; suite?: undefined }
  | { item: NumericItem; suite: Suite; prog?: undefined };
const convertir = (it: Item): Exo | null => {
  if (it.kind !== 'numeric_answer') return null;
  const prog = lireProgramme(it);
  if (prog) return { item: it, prog };
  const suite = lireSuite(it);
  return suite ? { item: it, suite } : null;
};

export default function Machine(props: GameProps) {
  const { level, lectureAuto, speech, sfx, paused } = props;
  const reduce = useReducedMotion();
  const jeu = useManches(props, {
    total: parNiveau(level, MANCHES),
    convertir,
    fin: (b, t) => ({
      headline:
        b === t
          ? 'Ingénieur des machines ! ⚙️'
          : `${b} machine${b > 1 ? 's' : ''} réparée${b > 1 ? 's' : ''} sur ${t} !`,
    }),
    delaiJuste: 1600,
  });
  const { courant, manche, total, etat, fini, repondre, suivant, bonnes } = jeu;
  const exo = courant?.valeur ?? null;
  const prog = exo?.prog ?? null;
  const suite = exo?.suite ?? null;

  const pasAPas = level === 'facile' && !!prog;
  /** Ordre de remplissage des valeurs (indices dans prog.valeurs). */
  const ordre = useMemo(() => {
    if (!prog) return [];
    const n = prog.valeurs.length;
    if (!pasAPas) return [prog.inconnue === 'sortie' ? n - 1 : 0];
    return prog.inconnue === 'sortie'
      ? Array.from({ length: n - 1 }, (_, i) => i + 1)
      : Array.from({ length: n - 1 }, (_, i) => n - 2 - i);
  }, [prog, pasAPas]);

  const [pos, setPos] = useState(0);
  const [montres, setMontres] = useState<Set<number>>(new Set());
  const [saisie, setSaisie] = useState<Record<string, string>>(vide(CHAMP));
  const [erreurs, setErreurs] = useState(0);
  const [tourne, setTourne] = useState(-1);
  const [indice, setIndice] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!exo) return;
    setPos(0);
    setMontres(new Set(prog ? [prog.inconnue === 'sortie' ? 0 : prog.valeurs.length - 1] : []));
    setSaisie(vide(CHAMP));
    setErreurs(0);
    setTourne(-1);
    setIndice(level === 'facile');
    setNote(null);
    setMessage(undefined);
    if (lectureAuto) void speech.speak(aDire(exo.item.spoken));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exo]);

  useEffect(() => {
    if (tourne < 0) return;
    const t = setTimeout(() => setTourne(-1), 900);
    return () => clearTimeout(t);
  }, [tourne]);

  const bloque = !!etat || paused || fini;

  const valider = useCallback(() => {
    if (!exo || bloque || !saisie.r) return;
    if (suite || !prog) {
      const c = checkNumeric(saisie.r, exo.item.answer, { tolerateZeros: true });
      setMessage(c.correct ? 'Bravo, tu as trouvé la règle !' : undefined);
      repondre(c.correct, saisie.r, formatNumber(exo.item.answer));
      return;
    }
    const cible = ordre[pos]!;
    const attendu = prog.valeurs[cible]!;
    const c = checkNumeric(saisie.r, attendu, { tolerateZeros: true });
    // engrenage traversé : entre cible-1 et cible (exécuter) ou entre cible et cible+1 (remonter)
    setTourne(prog.inconnue === 'sortie' ? cible - 1 : cible);
    setMontres((m) => new Set([...m, cible]));
    setSaisie(vide(CHAMP));
    const dernier = pos >= ordre.length - 1;
    if (!dernier) {
      sfx.play(c.correct ? 'monte' : 'glisse');
      if (!c.correct) {
        setErreurs((e) => e + 1);
        setNote(`Presque ! Ce nombre est ${formatNumber(attendu)}. On continue avec lui.`);
      } else setNote(null);
      setPos((p) => p + 1);
      return;
    }
    const juste = c.correct && erreurs === 0;
    setNote(null);
    setMessage(
      c.correct
        ? erreurs
          ? 'Bon résultat final ! Attention aux étapes.'
          : 'La machine fonctionne parfaitement !'
        : undefined,
    );
    setMontres(new Set(prog.valeurs.map((_, i) => i)));
    repondre(juste, saisie.r, formatNumber(exo.item.answer));
  }, [exo, bloque, saisie, suite, prog, ordre, pos, erreurs, sfx, repondre]);

  if (!exo)
    return (
      <EtatVide
        icone="⚙️"
        jeu="La Machine à programmes"
        besoin="de programmes de calcul ou de suites de motifs"
      />
    );

  const { item } = exo;
  const chaine = prog ? prog.valeurs.map((v) => formatNumber(v)).join(' → ') : '';
  const cibleCourante = prog ? ordre[pos] : undefined;
  const indiceTexte = prog
    ? prog.inconnue === 'entree'
      ? `On remonte la machine en faisant les opérations inverses : ${[...prog.etapes]
          .reverse()
          .map((e) => texteEtape(inverse(e)))
          .join(', puis ')}.`
      : `Fais les calculs dans l’ordre : ${prog.etapes.map(texteEtape).join(', puis ')}.`
    : suite?.ecart !== null && suite?.ecart !== undefined
      ? suite.ecart >= 0
        ? `À chaque étape, on ajoute ${formatNumber(suite.ecart)}.`
        : `À chaque étape, on enlève ${formatNumber(-suite.ecart)}.`
      : 'Regarde comment on passe d’une étape à la suivante.';

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          Machine {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>⚙️</span> {bonnes}
        </Hud>
      </Bandeau>
      <div className="grid gap-3 lg:grid-cols-2">
        <section
          className="relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-[#DDE3F0] to-[#C3CCE0] p-3 shadow-soft"
          aria-label={prog ? 'La machine à calculer' : 'La machine à motifs'}
        >
          {prog ? (
            prog.valeurs.map((v, i) => {
              const connu = montres.has(i);
              const enCours = cibleCourante === i && !etat;
              const estEntree = i === 0;
              const estSortie = i === prog.valeurs.length - 1;
              return (
                <Fragment key={i}>
                  <motion.div
                    layout={!reduce}
                    className={`flex min-h-[52px] min-w-[120px] items-center justify-center gap-2 rounded-2xl border-4 px-3 font-titre text-2xl font-extrabold ${
                      estEntree || estSortie ? 'bg-white' : 'bg-white/80'
                    } ${enCours ? 'border-grape ring-4 ring-grape/30' : connu ? 'border-grass/60' : 'border-dashed border-ink/30'}`}
                    aria-label={`${estEntree ? 'Entrée' : estSortie ? 'Sortie' : `Après l’étape ${i}`} : ${connu ? formatNumber(v) : 'inconnu'}`}
                  >
                    <span className="text-sm font-bold text-ink-soft">
                      {estEntree ? 'Entrée' : estSortie ? 'Sortie' : ''}
                    </span>
                    {connu ? (
                      <motion.span
                        key={`v${i}`}
                        initial={reduce ? false : { scale: 0.3 }}
                        animate={{ scale: 1 }}
                      >
                        {formatNumber(v)}
                      </motion.span>
                    ) : enCours ? (
                      <span className="text-grape">{saisie.r || '?'}</span>
                    ) : (
                      '?'
                    )}
                  </motion.div>
                  {i < prog.etapes.length && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl text-ink/50" aria-hidden>
                        {prog.inconnue === 'entree' && level === 'facile' ? '⇅' : '↓'}
                      </span>
                      <Engrenage
                        texte={texteEtape(prog.etapes[i]!)}
                        couleur={COULEURS[i % COULEURS.length]!}
                        tourne={(tourne === i || (etat === 'juste' && !reduce)) && !paused}
                        sens={i % 2 === 0 ? 1 : -1}
                        taille={84}
                        actif={
                          cibleCourante !== undefined &&
                          (prog.inconnue === 'sortie' ? cibleCourante - 1 === i : cibleCourante === i) &&
                          !etat
                        }
                      />
                      {prog.inconnue === 'entree' && (indice || etat) && (
                        <span
                          className="rounded-full bg-grape px-2 py-0.5 font-titre text-lg font-bold text-white"
                          title="opération inverse"
                        >
                          ↑ {texteEtape(inverse(prog.etapes[i]!))}
                        </span>
                      )}
                    </div>
                  )}
                </Fragment>
              );
            })
          ) : suite ? (
            <Motifs suite={suite} montrerEcarts={indice || !!etat} reponse={etat ? item.answer : null} />
          ) : null}
        </section>

        <section className="carte flex min-w-0 flex-col items-center gap-3 p-4">
          <div className="flex items-start gap-3">
            <SpeakButton text={aDire(item.spoken)} label="Écouter" />
            <p className="font-titre text-xl font-extrabold leading-snug sm:text-2xl" aria-live="polite">
              {item.prompt}
            </p>
          </div>
          {prog && pasAPas && !etat && cibleCourante !== undefined && (
            <p className="text-center font-bold">
              {prog.inconnue === 'sortie'
                ? `Quel nombre sort de l’engrenage « ${texteEtape(prog.etapes[cibleCourante - 1]!)} » ?`
                : `Quel nombre entrait dans l’engrenage « ${texteEtape(prog.etapes[cibleCourante]!)} » ? Fais ${texteEtape(inverse(prog.etapes[cibleCourante]!))}.`}
            </p>
          )}
          {indice && level !== 'facile' && !etat && (
            <Bulle ton="grape">
              <span aria-hidden>⚙️</span>
              <span>{indiceTexte}</span>
            </Bulle>
          )}
          {note && !etat && (
            <Bulle>
              <span aria-hidden>🦉</span>
              <span role="status">{note}</span>
            </Bulle>
          )}
          {level === 'normal' && !indice && !etat && (
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
            champs={CHAMP}
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
                  message={message}
                  expected={etat === 'faux' ? formatNumber(item.answer) : undefined}
                  explication={
                    etat === 'faux' ? `${item.explication}${prog ? ` (${chaine})` : ''}` : undefined
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

/** Les motifs d'une suite : des tas de cubes qui grandissent (ou des cartes si les nombres sont grands). */
function Motifs({
  suite,
  montrerEcarts,
  reponse,
}: {
  suite: Suite;
  montrerEcarts: boolean;
  reponse: number | null;
}) {
  const entiers = suite.termes.every((t) => Number.isInteger(t) && t >= 0 && t <= 30);
  const saut = suite.etape > suite.termes.length + 1;
  return (
    <div className="flex w-full flex-wrap items-end justify-center gap-2">
      {suite.termes.map((t, i) => (
        <Fragment key={i}>
          {i > 0 && montrerEcarts && (
            <span className="mb-10 rounded-full bg-grape px-1.5 text-sm font-bold text-white">
              {t - suite.termes[i - 1]! >= 0 ? '+' : '−'} {formatNumber(Math.abs(t - suite.termes[i - 1]!))}
            </span>
          )}
          <div className="flex flex-col items-center gap-1">
            {entiers ? (
              <div className="grid grid-cols-5 gap-0.5 rounded-lg bg-white/60 p-1" aria-hidden>
                {Array.from({ length: t }, (_, k) => (
                  <span key={k} className="h-3 w-3 rounded-sm bg-sky shadow-sm sm:h-4 sm:w-4" />
                ))}
              </div>
            ) : null}
            <span className="rounded-xl bg-white px-2 font-titre text-xl font-extrabold">
              {formatNumber(t)}
            </span>
            <span className="text-xs font-bold text-ink-soft">étape {i + 1}</span>
          </div>
        </Fragment>
      ))}
      {saut && <span className="mb-8 font-titre text-3xl text-ink/50">…</span>}
      <div className="flex flex-col items-center gap-1">
        <span className="rounded-xl border-4 border-dashed border-grape bg-white px-3 font-titre text-xl font-extrabold">
          {reponse !== null ? formatNumber(reponse) : '?'}
        </span>
        <span className="text-xs font-bold text-ink-soft">étape {suite.etape}</span>
      </div>
    </div>
  );
}
