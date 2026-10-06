/**
 * La Roue des probabilités (CATALOGUE n°27) — le hasard : impossible, peu probable, probable, certain.
 * L'expérience de l'énoncé (dé, pièces, cartes, sac de billes, roue) est dessinée et peut être testée
 * (tirages animés, tableau des résultats). On range les évènements sur l'échelle des probabilités, ou
 * on répond à la question.
 * Facile : tests illimités, vérification immédiate de chaque étiquette. Normal : tests illimités.
 * Plus loin : 10 tests seulement, bonus de rapidité.
 */
import { useMemo } from 'react';
import type { Item, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { useAutoSpeak } from '@/games/_kit/session';
import { ChoiceGrid, Hud } from '@/games/_kit/ui';
import { useState } from 'react';
import { Bacs } from '../_geometrie-commun/Bacs';
import { lireExperience } from '../_geometrie-commun/proba';
import { Bravo, Consigne, EnTete } from '../_geometrie-commun/ui';
import { useManches } from '../_geometrie-commun/useManches';
import { bravo, useRng } from '../_nombres-commun/outils';
import { Correction, PasDeQuestion } from '../_nombres-commun/ui';
import { ExperienceVue } from './Experience';
import { estProba } from './logique';

const MANCHES: Record<Level, number> = { facile: 5, normal: 6, plus_loin: 7 };

const PICTOS: Record<string, string> = {
  impossible: '⛔',
  'peu probable': '🤏',
  probable: '👍',
  certain: '✅',
  'possible mais pas certain': '🤔',
};
const TEINTES = ['bg-coral/20', 'bg-sun/25', 'bg-sky/20', 'bg-grass/25'];

/** L'énoncé sans la consigne de rangement (pour l'affichage de l'expérience). */
const enonce = (it: Item) =>
  it.kind === 'mcq' ? it.question : it.kind === 'classification' ? it.prompt : '';

export default function RoueProbabilites(props: GameProps) {
  const { level, paused, sfx, speech, lectureAuto } = props;
  const rng = useRng();
  const m = useManches(props, estProba, {
    manches: MANCHES,
    fin: (g, j, n) =>
      g ? 'Le hasard n’a plus de secret pour toi ! 🎡' : `${j} bonnes prédictions sur ${n} !`,
    autoSuivant: 1500,
  });
  const { item } = m;
  useAutoSpeak(speech, item ? (item.spoken ?? enonce(item)) : null, m.manche, lectureAuto && !paused);
  if (!item)
    return (
      <PasDeQuestion texte="Cette leçon n’a pas d’expérience de hasard pour la roue." onFin={m.abandonner} />
    );
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <EnTete icone="🎡" manche={m.manche} N={m.N} justes={m.stats.correct}>
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

function Manche({
  item,
  level,
  paused,
  phase,
  sfx,
  felicitation,
  onValider,
  onSuivant,
}: {
  item: Item;
  level: Level;
  paused: boolean;
  phase: string;
  sfx: GameProps['sfx'];
  felicitation: string;
  onValider: (correct: boolean, donne: string, attendu: string) => void;
  onSuivant: () => void;
}) {
  const rng = useRng();
  const texte = enonce(item);
  const x = useMemo(() => lireExperience(texte), [texte]);
  const actif = phase === 'jeu' && !paused;
  const [choisi, setChoisi] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <div className="flex flex-col gap-3 lg:w-[42%]">
        <Consigne texte={texte} aDire={item.spoken ?? texte} petit />
        {x && (
          <section
            className="carte flex flex-col items-center gap-2 bg-gradient-to-b from-grape/15 to-card p-3"
            aria-label="Tester l’expérience"
          >
            <ExperienceVue
              x={x}
              rng={rng}
              sfx={sfx}
              actif={!paused}
              limite={level === 'plus_loin' ? 10 : null}
            />
          </section>
        )}
      </div>
      <div className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-3 sm:p-4">
        {item.kind === 'classification' && (
          <>
            <div
              className="h-3 w-full rounded-full bg-gradient-to-r from-coral via-sun to-grass"
              role="img"
              aria-label="Échelle des probabilités : de impossible à certain"
            />
            <Bacs
              item={item}
              level={level}
              actif={actif}
              sfx={sfx}
              teintes={item.categories.length === 3 ? ['bg-coral/20', 'bg-sun/25', 'bg-grass/25'] : TEINTES}
              enTeteBac={(c) => <span aria-hidden>{PICTOS[item.categories[c]!] ?? ''}</span>}
              onFini={(r) => onValider(r.correct, r.donne, r.attendu)}
            />
          </>
        )}
        {item.kind === 'mcq' && (
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
        )}
        {phase === 'juste' && <Bravo texte={felicitation} />}
        <Correction
          ouvert={phase === 'faux'}
          bonne={item.kind === 'mcq' ? item.choices[item.answerIndex] : undefined}
          explication={item.explication}
          onContinuer={onSuivant}
        />
      </div>
    </div>
  );
}
