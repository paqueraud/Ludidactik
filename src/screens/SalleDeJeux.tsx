/** Salle de jeux : tous les mini-jeux en un coup d'œil, puis les leçons de ma classe où jouer à ce jeu. */
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { Ludo } from '@/components/Ludo';
import { lessonsOf } from '@/content';
import { MATIERE_META, MODALITY_META } from '@/content/meta';
import { MODALITIES, type Modality } from '@/content/schemas';
import { GAMES, gamesForLesson, getGame } from '@/games/registry';
import { sfx } from '@/services/sfx';
import { db } from '@/services/storage/db';
import { useSettings } from '@/stores/settings';
import { AvecProfil } from './Parcours';

export function SalleDeJeux() {
  const navigate = useNavigate();
  const [modalite, setModalite] = useState<Modality | 'toutes'>('toutes');
  const jeux = GAMES.filter((g) => modalite === 'toutes' || g.modalites.includes(modalite));
  return (
    <AvecProfil>
      {() => (
        <Screen titre={`La salle de jeux (${GAMES.length} jeux)`} retour="/accueil" large>
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Comment veux-tu apprendre ?">
            {(['toutes', ...MODALITIES] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={modalite === m}
                onClick={() => setModalite(m)}
                className={`min-h-touch rounded-full px-4 font-bold ${modalite === m ? 'bg-ink text-cream' : 'bg-card'}`}
              >
                {m === 'toutes' ? '🌈 Tous' : `${MODALITY_META[m].icone} ${MODALITY_META[m].label}`}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {jeux.map((g, i) => (
              <motion.button
                key={g.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                onClick={() => {
                  sfx.play('pop');
                  navigate(`/jeux/${g.id}`);
                }}
                className="carte flex flex-col overflow-hidden text-left transition-transform hover:-translate-y-1"
              >
                <span
                  className={`flex h-20 items-center justify-center bg-gradient-to-br text-5xl ${g.couleur}`}
                  aria-hidden
                >
                  {g.icone}
                </span>
                <span className="flex flex-1 flex-col gap-1 p-3">
                  <span className="font-titre text-lg font-extrabold leading-tight">{g.titre}</span>
                  <span className="text-sm">{g.modalites.map((m) => MODALITY_META[m].icone).join(' ')}</span>
                </span>
              </motion.button>
            ))}
          </div>
        </Screen>
      )}
    </AvecProfil>
  );
}

export function JeuLecons() {
  const { gameId = '' } = useParams();
  const game = getGame(gameId);
  const navigate = useNavigate();
  const programmeHG = useSettings((s) => s.programmeHG);
  const lists = useLiveQuery(() => db.wordLists.toArray(), []);
  if (!game) return <Navigate to="/jeux" replace />;
  return (
    <AvecProfil>
      {(profile) => (
        <JeuLeconsInner
          profile={profile}
          game={game}
          navigate={navigate}
          programmeHG={programmeHG}
          lists={lists ?? []}
        />
      )}
    </AvecProfil>
  );
}

function JeuLeconsInner({
  profile,
  game,
  navigate,
  programmeHG,
  lists,
}: {
  profile: import('@/services/storage/db').Profile;
  game: NonNullable<ReturnType<typeof getGame>>;
  navigate: ReturnType<typeof useNavigate>;
  programmeHG: '2020' | '2026';
  lists: import('@/services/storage/db').ParentWordList[];
}) {
  const ctx = useMemo(
    () => ({
      parentLists: lists.filter((l) => l.profileIds.length === 0 || l.profileIds.includes(profile.id)),
    }),
    [lists, profile.id],
  );
  const lecons = useMemo(
    () =>
      lessonsOf(profile.classe, programmeHG).filter((l) =>
        gamesForLesson(l, ctx).some((g) => g.game.id === game.id),
      ),
    [profile.classe, programmeHG, ctx, game.id],
  );
  const enCours = lecons.filter((l) => profile.enCours.includes(l.id));
  const autres = lecons.filter((l) => !profile.enCours.includes(l.id));
  return (
    <Screen titre={`${game.icone} ${game.titre}`} aLire={`${game.titre}. ${game.description}`} retour="/jeux">
      <p className="carte mb-4 p-4 text-lg">{game.description}</p>
      {lecons.length === 0 ? (
        <div className="carte flex items-center gap-4 p-5">
          <Ludo pose="pense" size={80} />
          <p>Ce jeu n’a pas encore de leçon en {profile.classe}. Il arrive bientôt !</p>
        </div>
      ) : (
        <>
          <h2 className="mb-2 text-2xl">Choisis la leçon à réviser</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {[...enCours, ...autres].map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() =>
                  navigate(`/jouer/${l.classe}/${l.matiere}/${encodeURIComponent(l.id)}/${game.id}`)
                }
                className={`carte flex items-center gap-3 p-3 text-left ${profile.enCours.includes(l.id) ? 'ring-4 ring-sun' : ''}`}
              >
                <span className="text-2xl" aria-hidden>
                  {MATIERE_META[l.matiere].icone}
                </span>
                <span className="font-bold">{l.titre}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}
