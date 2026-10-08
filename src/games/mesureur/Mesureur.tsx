/**
 * Le Mesureur (CATALOGUE n°28) — grandeurs et mesures.
 * Selon l'item : mesurer un objet avec une règle qu'on fait glisser, lire une balance, compter les
 * carreaux d'une aire, calculer un périmètre (la fourmi fait le tour) ou une aire, convertir, estimer
 * une mesure, classer des angles avec l'équerre.
 * Facile : objet posé au 0 de la règle, relations entre unités affichées, équerre posée sur les angles.
 * Normal : objet décalé (on fait glisser la règle), aides à la demande. Plus loin : sans aide, bonus.
 */
import { useCallback, useMemo, useState } from 'react';
import { Keypad } from '@/components/Keypads';
import { Button } from '@/components/ui';
import type { ClassificationItem, Item, Level, McqItem, NumericItem } from '@/content/schemas';
import { checkNumeric, formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { useAutoSpeak } from '@/games/_kit/session';
import { CASE_TACTILE, ChoiceGrid, DefilementGrille, Hud } from '@/games/_kit/ui';
import { Bacs } from '../_geometrie-commun/Bacs';
import { type PlanMesure, emojiDe, lireAngles, lireMesure, relation } from '../_geometrie-commun/mesure';
import { Bravo, Consigne, EnTete, Indice, pl } from '../_geometrie-commun/ui';
import { useManches } from '../_geometrie-commun/useManches';
import { bravo, useRng } from '../_nombres-commun/outils';
import { CaseReponse, Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { useSaisieNumerique } from '../_nombres-commun/useSaisieNumerique';
import { estPourMesureur } from './logique';
import {
  AngleVue,
  Balance,
  FigureCotee,
  QuadrillageAire,
  Rectangles,
  RegleVirtuelle,
  Reperes,
} from './Visuels';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 8 };

export default function Mesureur(props: GameProps) {
  const { level, paused, sfx, speech, lectureAuto } = props;
  const rng = useRng();
  const m = useManches(props, estPourMesureur, {
    manches: MANCHES,
    fin: (g, j, n) =>
      g
        ? 'Mesures parfaites ! Tu as l’œil du Mesureur ! 📏'
        : `${j} ${pl(j, 'mesure juste', 'mesures justes')} sur ${n} !`,
    autoSuivant: 1300,
  });
  const { item } = m;
  const texte = item ? (item.kind === 'mcq' ? item.question : 'prompt' in item ? item.prompt : '') : null;
  useAutoSpeak(speech, item ? (item.spoken ?? texte) : null, m.manche, lectureAuto && !paused);
  if (!item)
    return <PasDeQuestion texte="Cette leçon n’a pas de mesure pour le Mesureur." onFin={m.abandonner} />;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <EnTete icone="📏" manche={m.manche} N={m.N} justes={m.stats.correct}>
        <Hud>⭐ {m.score}</Hud>
      </EnTete>
      <Manche
        key={m.manche}
        item={item}
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

interface PropsManche {
  level: Level;
  paused: boolean;
  phase: string;
  sfx: GameProps['sfx'];
  felicitation: string;
  onValider: (correct: boolean, donne: string, attendu: string) => void;
  onSuivant: () => void;
}

function Manche({ item, ...p }: PropsManche & { item: Item }) {
  if (item.kind === 'numeric_answer') return <MancheNumerique item={item} {...p} />;
  if (item.kind === 'classification') return <MancheAngles item={item} {...p} />;
  if (item.kind === 'mcq') return <MancheEstimation item={item} {...p} />;
  return null;
}

/* ------------------------------------------------------------------ */

function MancheNumerique({
  item,
  level,
  paused,
  phase,
  sfx,
  felicitation,
  onValider,
  onSuivant,
}: PropsManche & { item: NumericItem }) {
  const plan = useMemo(() => lireMesure(item)!, [item]) as PlanMesure;
  const actif = phase === 'jeu' && !paused;
  const [aide, setAide] = useState<string | null>(null);
  const [voirAide, setVoirAide] = useState(level === 'facile');
  const [marques, setMarques] = useState<string[]>([]);
  const [coches, setCoches] = useState<Set<number>>(() => new Set());
  const [tour, setTour] = useState(false);
  const [decalage] = useState(() =>
    level === 'facile' ? 0 : 1 + Math.floor(Math.random() * 3) + (level === 'plus_loin' ? 0.5 : 0),
  );

  const repondre = useCallback(
    (v: string) => {
      if (!actif) return;
      const r = checkNumeric(v, item.answer, { unit: item.unit });
      if (!r.correct && r.hint && r.value !== null && Math.abs(r.value - item.answer) < 1e-9) {
        setAide(r.hint);
        return;
      }
      onValider(r.correct, v, formatNumber(item.answer));
    },
    [actif, item, onValider],
  );
  const saisie = useSaisieNumerique({
    actif,
    onValider: repondre,
    onContinuer: phase === 'faux' ? onSuivant : undefined,
  });

  const marquer = (k: string) => {
    if (!actif) return;
    sfx.play('tic');
    setMarques((m) => (m.includes(k) ? m.filter((x) => x !== k) : [...m, k]));
  };

  // Aides contextuelles
  let aideTexte: string | null = null;
  if (plan.type === 'conversion') {
    const c = plan.conversion;
    const rels = [...new Set(c.unites.map((u) => relation(u, c.vers)).filter((x): x is string => !!x))];
    aideTexte = rels.length ? `Rappel : ${rels.join(' ; ')}.` : null;
  } else if (plan.type === 'figure' && /périmètre|tour/.test(item.prompt))
    aideTexte = 'Le périmètre, c’est la longueur du tour de la figure.';
  else if (plan.type === 'figure' && /\baire\b/.test(item.prompt))
    aideTexte = 'L’aire d’un rectangle : on compte les rangées de carrés unités (longueur × largeur).';
  else if (plan.type === 'quadrillage')
    aideTexte = 'Touche chaque carreau pour le compter. Deux demi-carreaux font un carreau.';
  else if (plan.type === 'regle')
    aideTexte = decalage
      ? 'Fais glisser la règle pour mettre le 0 au bout de l’objet.'
      : 'Le 0 de la règle est au bout de l’objet : lis le nombre à l’autre bout.';
  else if (plan.type === 'balance')
    aideTexte = 'La balance est en équilibre : l’objet pèse autant que toutes les masses ensemble.';

  let visuel: JSX.Element | null = null;
  switch (plan.type) {
    case 'regle':
      visuel = (
        <RegleVirtuelle plan={plan.regle} decalage={decalage} actif={actif} corrige={phase === 'faux'} />
      );
      break;
    case 'balance':
      visuel = (
        <div className="flex w-full flex-col items-center gap-1">
          <Balance
            plan={plan.balance}
            coches={coches}
            onCocher={
              actif && level !== 'plus_loin'
                ? (i) => {
                    sfx.play('tic');
                    setCoches((c) => {
                      const n = new Set(c);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    });
                  }
                : undefined
            }
          />
          {level !== 'plus_loin' && (
            <p className="text-center text-sm font-bold text-ink-soft">
              Touche une masse quand tu l’as comptée.
            </p>
          )}
        </div>
      );
      break;
    case 'quadrillage':
      visuel = (
        <div className="flex w-full flex-col items-center gap-1">
          {/* carreaux d'au moins CASE_TACTILE px : défilement dans le cadre sur petit écran */}
          <DefilementGrille largeurMin={(plan.quadrillage.cols + 0.25) * CASE_TACTILE}>
            <QuadrillageAire
              plan={plan.quadrillage}
              marques={marques}
              onMarquer={actif ? marquer : undefined}
            />
          </DefilementGrille>
          {marques.length > 0 && (
            <p className="text-center font-bold" aria-live="polite">
              Tu as touché {marques.length} morceau{marques.length > 1 ? 'x' : ''}.{' '}
              <button type="button" className="underline" onClick={() => setMarques([])}>
                Effacer
              </button>
            </p>
          )}
        </div>
      );
      break;
    case 'rectangles':
      visuel = <Rectangles rects={plan.rectangles} unite={plan.unite} />;
      break;
    case 'figure':
      visuel = (
        <div className="flex w-full flex-col items-center gap-2">
          <FigureCotee
            plan={plan.figure}
            tour={tour}
            onTourFini={() => setTimeout(() => setTour(false), 600)}
          />
          {/périmètre|tour/.test(item.prompt) && phase === 'jeu' && level !== 'plus_loin' && (
            <Button variant="sun" onClick={() => setTour(true)} disabled={!actif || tour}>
              🐜 Faire le tour
            </Button>
          )}
        </div>
      );
      break;
    case 'conversion':
      visuel = (
        <div className="flex w-full flex-col items-center gap-3 py-2">
          <div className="flex flex-wrap items-center justify-center gap-3 font-titre text-3xl font-extrabold">
            <span className="rounded-2xl bg-sky/25 px-4 py-2">{plan.conversion.gauche}</span>
            <span aria-hidden>⚙️</span>
            <span className="rounded-2xl bg-sun/30 px-4 py-2">… {plan.conversion.vers}</span>
          </div>
        </div>
      );
      break;
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <div className="flex flex-col gap-3 lg:w-[58%]">
        <Consigne texte={item.prompt} aDire={item.spoken} petit={item.prompt.length > 90} />
        <section className="carte overflow-hidden p-2 sm:p-3" aria-label="L’atelier de mesure">
          {visuel}
        </section>
      </div>
      <div className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-4">
        {phase === 'jeu' &&
          aideTexte &&
          (voirAide ? (
            <Indice>{aideTexte}</Indice>
          ) : (
            level === 'normal' && (
              <Button variant="blanc" onClick={() => setVoirAide(true)}>
                💡 Un indice
              </Button>
            )
          ))}
        <CaseReponse
          valeur={saisie.valeur}
          unite={item.unit}
          etat={phase === 'faux' ? 'faux' : phase === 'juste' ? 'juste' : null}
        />
        {aide && (
          <p className="font-bold text-coral-dark" role="status">
            {aide}
          </p>
        )}
        {phase === 'jeu' && (
          <Keypad
            {...saisie.handlers}
            decimal={item.decimals > 0 || plan.type === 'conversion' || plan.type === 'figure'}
          />
        )}
        {phase === 'juste' && <Bravo texte={felicitation} />}
        <Correction
          ouvert={phase === 'faux'}
          bonne={`${formatNumber(item.answer)}${item.unit ? ` ${item.unit}` : ''}`}
          explication={item.explication}
          onContinuer={onSuivant}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function MancheAngles({
  item,
  level,
  paused,
  phase,
  sfx,
  felicitation,
  onValider,
  onSuivant,
}: PropsManche & { item: ClassificationItem }) {
  const angles = useMemo(() => lireAngles(item)!, [item]);
  const [rots] = useState(() =>
    angles.map(() => (level === 'facile' ? 0 : Math.floor(Math.random() * 7) * 15)),
  );
  const [equerre, setEquerre] = useState(level === 'facile');
  const actif = phase === 'jeu' && !paused;
  return (
    <div className="flex flex-col gap-3">
      <Consigne texte={item.prompt} aDire={item.spoken} />
      <div className="carte flex flex-col items-center gap-3 p-3 sm:p-4">
        {level === 'normal' && phase === 'jeu' && (
          <Button
            variant={equerre ? 'sun' : 'blanc'}
            onClick={() => setEquerre((e) => !e)}
            disabled={!actif}
            aria-pressed={equerre}
          >
            📐 {equerre ? 'Enlever' : 'Poser'} l’équerre sur les angles
          </Button>
        )}
        <Bacs
          item={item}
          level={level}
          actif={actif}
          sfx={sfx}
          rendu={(i) => <AngleVue mesure={angles[i]!} equerre={equerre || phase !== 'jeu'} rot={rots[i]} />}
          onFini={(r) => onValider(r.correct, r.donne, r.attendu)}
        />
        {phase === 'juste' && <Bravo texte={felicitation} />}
        <Correction ouvert={phase === 'faux'} explication={item.explication} onContinuer={onSuivant} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function MancheEstimation({
  item,
  level,
  paused,
  phase,
  felicitation,
  onValider,
  onSuivant,
}: PropsManche & { item: McqItem }) {
  const [choisi, setChoisi] = useState<number | null>(null);
  const actif = phase === 'jeu' && !paused;
  const emoji = emojiDe(item.question) ?? item.image ?? null;
  const question = emoji ? item.question.replace(emoji, '').trim() : item.question;
  const tout = item.choices.join(' ');
  const famille = /m²/.test(tout)
    ? 'aire'
    : /\b(m?g|kg|t)\b/.test(tout)
      ? 'masse'
      : /L\b/.test(tout)
        ? 'contenance'
        : 'longueur';
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <div className="flex flex-col gap-3 lg:w-[50%]">
        <Consigne texte={question} aDire={item.spoken ?? question} />
        <section className="carte flex flex-col items-center gap-3 p-4" aria-label="L’objet à estimer">
          {emoji && (
            <span className="text-8xl" role="img" aria-hidden>
              {emoji}
            </span>
          )}
          {level !== 'plus_loin' && (
            <Reperes
              famille={famille}
              unites={item.choices.map((c) => c.split(' ').at(-1)!)}
              question={item.question}
            />
          )}
        </section>
      </div>
      <div className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-4">
        <ChoiceGrid
          choices={item.choices}
          onPick={(i) => {
            if (!actif) return;
            setChoisi(i);
            onValider(i === item.answerIndex, item.choices[i]!, item.choices[item.answerIndex]!);
          }}
          reveal={phase !== 'jeu' && choisi !== null ? { correct: item.answerIndex, chosen: choisi } : null}
          disabled={!actif}
        />
        {phase === 'juste' && <Bravo texte={felicitation} />}
        <Correction
          ouvert={phase === 'faux'}
          bonne={item.choices[item.answerIndex]}
          explication={item.explication}
          onContinuer={onSuivant}
        />
      </div>
    </div>
  );
}
