/**
 * La Station météo (CATALOGUE n°26) — organisation et gestion de données.
 * Les données de la station s'affichent en tableau, diagramme en barres, courbe ou diagramme circulaire
 * (SVG accessibles) ; l'enfant lit, compare, calcule, ou construit une barre en la tirant.
 * Facile : fil de lecture (pointillés jusqu'à l'axe) et noms des parts du disque.
 * Normal : fil de lecture, bonus de rapidité. Plus loin : sans fil de lecture, bonus × 1,5.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keypad } from '@/components/Keypads';
import { Button } from '@/components/ui';
import type { Item, Level } from '@/content/schemas';
import { checkNumeric, formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { useAutoSpeak } from '@/games/_kit/session';
import { ChoiceGrid, Hud } from '@/games/_kit/ui';
import { Bacs } from '../_geometrie-commun/Bacs';
import { type PlanDonnees, estDonnees, lireDonnees } from '../_geometrie-commun/graphique';
import { Bravo, Consigne, EnTete, Indice } from '../_geometrie-commun/ui';
import { useManches } from '../_geometrie-commun/useManches';
import { bravo, dansUnChamp, useRng } from '../_nombres-commun/outils';
import { CaseReponse, Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { useSaisieNumerique } from '../_nombres-commun/useSaisieNumerique';
import { BarreAConstruire, COULEURS, GraphiqueSvg, TableauDoubleVue, TableauSimple } from './Graphique';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 8 };
const estItemDonnees = (it: Item): it is Item => estDonnees(it);

/** La petite station : girouette-anémomètre qui tourne, thermomètre, nuage et soleil. */
function Station({ tourne }: { tourne: boolean }) {
  return (
    <svg viewBox="0 0 90 90" className="h-16 w-16 shrink-0" aria-hidden>
      <circle cx="70" cy="20" r="12" fill="#FFD45C" />
      <path
        d="M50 30 a10 10 0 0 1 18 -6 a9 9 0 0 1 14 8 a8 8 0 0 1 -2 16 h-28 a9 9 0 0 1 -2 -18 z"
        fill="#FFFFFF"
        stroke="#AEB9D2"
        strokeWidth="2"
      />
      <rect x="28" y="38" width="5" height="48" rx="2" fill="#586480" />
      <motion.g
        style={{ transformOrigin: '30.5px 36px' }}
        animate={tourne ? { rotate: 360 } : { rotate: 0 }}
        transition={tourne ? { duration: 2.4, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
      >
        {[0, 120, 240].map((a) => (
          <g key={a} transform={`rotate(${a} 30.5 36)`}>
            <line x1="30.5" y1="36" x2="30.5" y2="18" stroke="#586480" strokeWidth="3" />
            <circle cx="30.5" cy="16" r="5" fill="#FF7A6B" stroke="#24304A" strokeWidth="1.5" />
          </g>
        ))}
      </motion.g>
      <rect x="8" y="48" width="9" height="34" rx="4.5" fill="#FFFFFF" stroke="#24304A" strokeWidth="2" />
      <circle cx="12.5" cy="80" r="6" fill="#FF7A6B" stroke="#24304A" strokeWidth="2" />
      <rect x="10.5" y="60" width="4" height="18" fill="#FF7A6B" />
    </svg>
  );
}

export default function StationMeteo(props: GameProps) {
  const { level, paused, sfx, speech, lectureAuto } = props;
  const rng = useRng();
  const m = useManches(props, estItemDonnees, {
    manches: MANCHES,
    fin: (g, j, n) =>
      g
        ? 'Bulletin parfait ! Tu lis les graphiques comme un météorologue ! 🌈'
        : `${j} bonnes lectures sur ${n} !`,
    autoSuivant: 1300,
  });
  const { item } = m;
  const plan = useMemo(() => (item ? lireDonnees(item) : null), [item]);
  useAutoSpeak(
    speech,
    item ? (item.spoken ?? plan?.question ?? null) : null,
    m.manche,
    lectureAuto && !paused,
  );
  if (!item || !plan) {
    return (
      <PasDeQuestion
        texte="Cette leçon n’a pas de données à lire pour la station météo."
        onFin={m.abandonner}
      />
    );
  }
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <EnTete icone="🌦️" manche={m.manche} N={m.N} justes={m.stats.correct}>
        <Hud>⭐ {m.score}</Hud>
      </EnTete>
      <Manche
        key={m.manche}
        item={item}
        plan={plan}
        level={level}
        paused={paused}
        phase={m.phase}
        sfx={sfx}
        felicitation={bravo(rng)}
        onValider={m.valider}
        onSuivant={m.suivant}
      />
    </div>
  );
}

function Manche({
  item,
  plan,
  level,
  paused,
  phase,
  sfx,
  felicitation,
  onValider,
  onSuivant,
}: {
  item: Item;
  plan: PlanDonnees;
  level: Level;
  paused: boolean;
  phase: string;
  sfx: GameProps['sfx'];
  felicitation: string;
  onValider: (correct: boolean, donne: string, attendu: string) => void;
  onSuivant: () => void;
}) {
  const reduce = useReducedMotion();
  const [guide, setGuide] = useState<number | null>(null);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [barre, setBarre] = useState(0);
  const [coches, setCoches] = useState<Set<number>>(() => new Set());
  const [aide, setAide] = useState<string | null>(null);
  const actif = phase === 'jeu' && !paused;
  const g = plan.graphique;
  const avecGuide = level !== 'plus_loin';
  const construire = item.kind === 'numeric_answer' && (plan.enquete || plan.construire);

  const numerique = item.kind === 'numeric_answer' ? item : null;
  const attenduTexte =
    item.kind === 'mcq'
      ? item.choices[item.answerIndex]!
      : item.kind === 'true_false'
        ? item.answer
          ? 'Vrai'
          : 'Faux'
        : item.kind === 'numeric_answer'
          ? `${formatNumber(item.answer)}${item.unit ? ` ${item.unit}` : ''}`
          : '';

  const repondreNombre = useCallback(
    (v: string) => {
      if (!numerique || !actif) return;
      const r = checkNumeric(v, numerique.answer, { unit: numerique.unit });
      if (!r.correct && r.hint && r.value !== null && Math.abs(r.value - numerique.answer) < 1e-9) {
        setAide(r.hint);
        return;
      }
      onValider(r.correct, v, formatNumber(numerique.answer));
    },
    [numerique, actif, onValider],
  );
  const saisie = useSaisieNumerique({
    actif: actif && !!numerique && !construire,
    onValider: repondreNombre,
    onContinuer: phase === 'faux' ? onSuivant : undefined,
  });

  const validerBarre = useCallback(() => {
    if (!numerique || !actif) return;
    onValider(Math.abs(barre - numerique.answer) < 1e-9, String(barre), formatNumber(numerique.answer));
  }, [numerique, actif, barre, onValider]);

  const titreDouble =
    (item.kind === 'numeric_answer' ? item.prompt : '').match(/«\s*(.+?)\s*»/)?.[1] ?? 'Le tableau';

  // --- Données affichées ---
  let donnees: JSX.Element | null = null;
  if (plan.enquete) {
    const { reponses, cible } = plan.enquete;
    donnees = (
      <div className="flex flex-col items-center gap-2">
        <p className="font-titre text-lg font-bold">Les réponses de l’enquête « fruit préféré »</p>
        <div
          className="flex max-w-xl flex-wrap justify-center gap-1.5"
          role="group"
          aria-label="Réponses de l’enquête"
        >
          {reponses.map((r, i) => (
            <button
              key={i}
              type="button"
              disabled={!actif}
              onClick={() => {
                sfx.play('tic');
                setCoches((c) => {
                  const n = new Set(c);
                  if (n.has(i)) n.delete(i);
                  else n.add(i);
                  return n;
                });
              }}
              className={`relative flex h-12 w-12 items-center justify-center rounded-xl border-2 text-3xl ${
                coches.has(i) ? 'border-grass-dark bg-grass/25' : 'border-ink/15 bg-card'
              }`}
              aria-pressed={coches.has(i)}
              aria-label={`Réponse ${i + 1}${coches.has(i) ? ', cochée' : ''}`}
            >
              {r}
              {coches.has(i) && (
                <span
                  className="absolute -right-1 -top-1 rounded-full bg-grass-dark px-1 text-xs text-white"
                  aria-hidden
                >
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
        {level !== 'plus_loin' && (
          <Indice>Coche chaque {cible} quand tu le comptes : tu n’en oublieras aucun !</Indice>
        )}
      </div>
    );
  } else if (plan.tableauDouble) {
    donnees = <TableauDoubleVue t={plan.tableauDouble} titre={titreDouble} />;
  } else if (g && plan.tableauJuste) {
    donnees = (
      <div className="grid w-full items-start gap-3 md:grid-cols-2">
        <TableauSimple g={g} valeurs={plan.tableauJuste} titre={`Le tableau : ${g.titre}`} />
        <div>
          <p className="text-center font-titre font-bold">Le diagramme construit</p>
          <GraphiqueSvg
            g={{ ...g, type: 'barres' }}
            guide={guide}
            onGuide={avecGuide && actif ? setGuide : null}
            valeurs="illisibles"
            barreFausse={
              phase === 'faux' && item.kind === 'mcq'
                ? g.etiquettes.indexOf(item.choices[item.answerIndex]!)
                : undefined
            }
          />
        </div>
      </div>
    );
  } else if (g && plan.construire) {
    donnees = <TableauSimple g={g} />;
  } else if (g) {
    donnees = (
      <GraphiqueSvg
        g={g}
        guide={guide}
        onGuide={avecGuide && actif && g.type !== 'circulaire' ? setGuide : null}
        valeurs={
          g.type === 'circulaire' ? (item.kind === 'numeric_answer' ? 'aucune' : 'toutes') : 'illisibles'
        }
        partsNommees={level === 'facile'}
      />
    );
  }

  const maxBarre = plan.enquete
    ? Math.max(10, plan.enquete.reponses.length)
    : plan.construire && g
      ? Math.max(8, Math.ceil(Math.max(...g.valeurs) / plan.construire.echelle) + 2)
      : 10;
  const etiquetteBarre = plan.enquete ? plan.enquete.cible : (plan.construire?.etiquette ?? '');

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <div className="carte flex flex-col gap-2 p-3 sm:p-4 lg:w-[58%]">
        <div className="flex items-center gap-3">
          <Station tourne={!reduce && !paused} />
          <h2 className="flex-1 text-lg sm:text-xl">
            {g?.titre ?? (plan.tableauDouble ? titreDouble : 'Enquête de la classe')}
          </h2>
        </div>
        {donnees}
        {avecGuide && g && g.type !== 'tableau' && g.type !== 'circulaire' && !plan.construire && actif && (
          <p className="text-center text-sm font-bold text-ink-soft">
            Touche une barre ou un point : un fil violet te guide jusqu’à l’axe.
          </p>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Consigne texte={plan.question} aDire={item.spoken ?? plan.question} />

        <div className="carte flex flex-col items-center gap-3 p-4">
          {item.kind === 'mcq' && (
            <ChoiceGrid
              choices={item.choices}
              onPick={(i) => {
                if (!actif) return;
                setChoisi(i);
                onValider(i === item.answerIndex, item.choices[i]!, item.choices[item.answerIndex]!);
              }}
              reveal={
                phase !== 'jeu' && choisi !== null ? { correct: item.answerIndex, chosen: choisi } : null
              }
              disabled={!actif}
            />
          )}
          {item.kind === 'true_false' && (
            <VraiFaux
              actif={actif}
              onRepondre={(v) =>
                onValider(v === item.answer, v ? 'Vrai' : 'Faux', item.answer ? 'Vrai' : 'Faux')
              }
            />
          )}
          {item.kind === 'classification' && (
            <Bacs
              item={item}
              level={level}
              actif={actif}
              sfx={sfx}
              onFini={(r) => onValider(r.correct, r.donne, r.attendu)}
            />
          )}
          {numerique && construire && (
            <div className="flex flex-col items-center gap-2">
              <BarreAConstruire
                max={maxBarre}
                valeur={barre}
                onChange={(v) => {
                  if (v !== barre) sfx.play('tic');
                  setBarre(v);
                }}
                etiquette={etiquetteBarre}
                couleur={COULEURS[0]!}
                actif={actif}
                attendu={phase === 'faux' ? numerique.answer : undefined}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="blanc"
                  aria-label="Baisser la barre"
                  onClick={() => actif && setBarre((b) => Math.max(0, b - 1))}
                  disabled={!actif}
                >
                  ▼
                </Button>
                <span className="min-w-[7rem] text-center font-titre text-xl font-bold" aria-live="polite">
                  {barre} carreau{barre > 1 ? 'x' : ''}
                </span>
                <Button
                  variant="blanc"
                  aria-label="Monter la barre"
                  onClick={() => actif && setBarre((b) => Math.min(maxBarre, b + 1))}
                  disabled={!actif}
                >
                  ▲
                </Button>
              </div>
              <Button variant="grass" size="lg" onClick={validerBarre} disabled={!actif}>
                C’est ma barre !
              </Button>
            </div>
          )}
          {numerique && !construire && (
            <div className="flex w-full flex-col items-center gap-3">
              <CaseReponse
                valeur={saisie.valeur}
                unite={numerique.unit}
                etat={phase === 'faux' ? 'faux' : phase === 'juste' ? 'juste' : null}
              />
              {aide && (
                <p className="font-bold text-coral-dark" role="status">
                  {aide}
                </p>
              )}
              {phase === 'jeu' && <Keypad {...saisie.handlers} decimal={numerique.decimals > 0} />}
            </div>
          )}
          {phase === 'juste' && <Bravo texte={felicitation} />}
          <Correction
            ouvert={phase === 'faux'}
            bonne={item.kind === 'classification' ? undefined : attenduTexte}
            explication={item.explication}
            onContinuer={onSuivant}
          />
        </div>
      </div>
    </div>
  );
}

function VraiFaux({ actif, onRepondre }: { actif: boolean; onRepondre: (v: boolean) => void }) {
  const [choix, setChoix] = useState<boolean | null>(null);
  const r = useCallback(
    (v: boolean) => {
      if (!actif) return;
      setChoix(v);
      onRepondre(v);
    },
    [actif, onRepondre],
  );
  useEffect(() => {
    if (!actif) return;
    const h = (e: KeyboardEvent) => {
      if (dansUnChamp(e)) return;
      if (e.key.toLowerCase() === 'v') r(true);
      else if (e.key.toLowerCase() === 'f') r(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [actif, r]);
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-3">
      <Button
        variant="grass"
        size="lg"
        onClick={() => r(true)}
        disabled={!actif}
        aria-pressed={choix === true}
      >
        ✔ Vrai (V)
      </Button>
      <Button
        variant="coral"
        size="lg"
        onClick={() => r(false)}
        disabled={!actif}
        aria-pressed={choix === false}
      >
        ✘ Faux (F)
      </Button>
    </div>
  );
}
