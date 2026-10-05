/**
 * Labo : joue n'importe quel mini-jeu avec des items d'exemple (src/games/_kit/fixtures.ts),
 * sans profil ni leçon. Sert au développement et aux tests E2E de fumée (un test par jeu).
 * URL : /labo/<id-jeu>?niveau=facile|normal|plus_loin&type=<ItemKind>
 */
import { Suspense, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { DEFAULT_AVATAR } from '@/avatar/parts';
import { Screen } from '@/components/Layout';
import { Button } from '@/components/ui';
import type { ItemStream } from '@/content/provider';
import { type Item, type ItemKind, LEVELS, type Lesson, type Level } from '@/content/schemas';
import type { GameSummary } from '@/engine/GameModule';
import { createRng } from '@/engine/rng';
import { FIXTURES } from '@/games/_kit/fixtures';
import { GAMES, getGame } from '@/games/registry';
import { sfx } from '@/services/sfx';
import { speech } from '@/services/speech';
import type { Profile } from '@/services/storage/db';

const PROFIL_LABO: Profile = {
  id: 'labo',
  prenom: 'Testeur',
  avatar: DEFAULT_AVATAR,
  classe: 'CE1',
  auth: { type: 'texte', hash: '', salt: '' },
  xp: 0,
  ludis: 0,
  enCours: [],
  creeLe: 0,
  derniereConnexion: 0,
};

const LECON_LABO: Lesson = {
  id: 'CE1.LABO',
  classe: 'CE1',
  matiere: 'maths',
  domaine: 'Labo',
  titre: 'Leçon d’essai',
  programme: '2024',
  boRef: 'Labo de développement (aucune référence)',
  periodes: [1],
  niveaux: { facile: 'facile', normal: 'normal', plus_loin: 'plus loin' },
  itemKinds: ['mcq'],
  jeuxSuggeres: [],
  source: { kind: 'generator', generator: 'TODO:labo' },
  rappel: 'Règle d’essai.',
};

function fixtureStream(kind: ItemKind, filter?: (i: Item) => boolean): ItemStream {
  const rng = createRng(42);
  const filtered = filter ? FIXTURES[kind].filter(filter) : FIXTURES[kind];
  // sans item adapté, on garde tous les exemples : le jeu doit afficher un état propre
  const pool = filtered.length ? filtered : FIXTURES[kind];
  let queue = rng.shuffle(pool);
  return {
    size: pool.length,
    next() {
      if (!queue.length) queue = rng.shuffle(pool);
      return queue.shift()!;
    },
  };
}

export function Labo() {
  const { gameId } = useParams();
  const [params] = useSearchParams();
  const [partie, setPartie] = useState(0);
  const [fin, setFin] = useState<GameSummary | null>(null);
  const game = gameId ? getGame(gameId) : undefined;
  const level = (LEVELS as readonly string[]).includes(params.get('niveau') ?? '')
    ? (params.get('niveau') as Level)
    : 'normal';
  const kind = (params.get('type') as ItemKind | null) ?? game?.accepts[0];
  const stream = useMemo(() => (kind ? fixtureStream(kind, game?.filterItem) : null), [kind, partie]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!game || !kind || !stream) {
    return (
      <Screen titre="Labo des jeux" retour="/">
        <p className="mb-4">Chaque jeu avec des questions d’exemple (pour les développeurs et les tests).</p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g) => (
            <li key={g.id}>
              <Link className="carte flex items-center gap-3 p-3 font-bold" to={`/labo/${g.id}`}>
                <span className="text-3xl" aria-hidden>
                  {g.icone}
                </span>
                {g.numero}. {g.titre}
              </Link>
            </li>
          ))}
        </ul>
      </Screen>
    );
  }

  const Game = game.component;
  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky/40 to-cream" data-testid="labo">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <Link to="/labo" className="rounded-full bg-card px-3 py-1 font-bold">
          ← Labo
        </Link>
        <span className="font-titre font-bold">
          {game.icone} {game.titre} — {level} — {kind}
        </span>
      </div>
      {fin ? (
        <div className="carte mx-auto max-w-md p-6 text-center" data-testid="labo-fin">
          <h1 className="text-3xl">{fin.headline}</h1>
          <p className="my-2">
            {fin.correct} / {fin.total} — score {fin.score}
          </p>
          <Button
            onClick={() => {
              setFin(null);
              setPartie((p) => p + 1);
            }}
          >
            Rejouer
          </Button>
        </div>
      ) : (
        <Suspense fallback={<p className="p-6">Chargement…</p>}>
          <Game
            key={partie}
            lesson={LECON_LABO}
            level={level}
            profile={PROFIL_LABO}
            stream={stream}
            kind={kind}
            record={null}
            lectureAuto={false}
            target={() => 0.5}
            paused={false}
            onAnswer={() => {}}
            onEnd={setFin}
            speech={speech}
            sfx={sfx}
          />
        </Suspense>
      )}
    </div>
  );
}
