/**
 * Tableau des scores (GAMIFICATION §6) : mes records, top 10 des profils de l'appareil par
 * jeu × niveau × leçon, et la semaine (classement d'XP remis à zéro le lundi si le parent autorise
 * la compétition ; sinon « contre soi-même »).
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { Medal, Trophy, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '@/avatar/Avatar';
import { Screen } from '@/components/Layout';
import { SpeakButton } from '@/components/ui';
import { getLesson } from '@/content';
import { LEVEL_META } from '@/content/meta';
import { formatNumber } from '@/engine/answer';
import { getGame } from '@/games/registry';
import {
  type CleScore,
  type Ligue,
  classementHebdo,
  cleScore,
  contreSoiMeme,
  tableauxDisponibles,
  top10,
} from '@/meta/scores';
import { useProfiles } from '@/services/profiles';
import { type Profile, db } from '@/services/storage/db';
import { useSettings } from '@/stores/settings';
import { AvecProfil } from './Parcours';

export function Scores() {
  return <AvecProfil>{(profile) => <ScoresInner key={profile.id} profile={profile} />}</AvecProfil>;
}

type Onglet = 'records' | 'top' | 'semaine';

const dateCourte = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

const nomTableau = (c: CleScore) =>
  `${getGame(c.gameId)?.titre ?? c.gameId} · ${getLesson(c.lessonId)?.titre ?? c.lessonId} · ${LEVEL_META[c.level].court}`;

const LIGUES: Record<Ligue, { label: string; icone: string; couleur: string; phrase: string }> = {
  or: {
    label: 'Ligue Or',
    icone: '🥇',
    couleur: 'from-sun to-sun-dark',
    phrase: 'Tu fais au moins autant que la semaine dernière. Bravo !',
  },
  argent: {
    label: 'Ligue Argent',
    icone: '🥈',
    couleur: 'from-cream-deep to-ink-soft/40',
    phrase: 'Tu es en bonne route : encore quelques parties pour égaler ta semaine dernière.',
  },
  bronze: {
    label: 'Ligue Bronze',
    icone: '🥉',
    couleur: 'from-sun/50 to-coral/60',
    phrase: 'Chaque partie compte : on avance à son rythme !',
  },
};

function ScoresInner({ profile }: { profile: Profile }) {
  const competition = useSettings((s) => s.competition);
  const [onglet, setOnglet] = useState<Onglet>('records');
  const profils = useProfiles() ?? [];
  const records = useLiveQuery(() => db.records.toArray(), []) ?? [];
  const attempts =
    useLiveQuery(
      () =>
        db.attempts
          .where('date')
          .above(Date.now() - 15 * 86_400_000)
          .toArray(),
      [],
    ) ?? [];

  const mesRecords = records.filter((r) => r.profileId === profile.id).sort((a, b) => b.date - a.date);
  const miens = new Set(mesRecords.map(cleScore));
  const tous = tableauxDisponibles(records);
  // mes tableaux d'abord ; sans compétition, seulement les miens
  const tableaux = [
    ...tous.filter((t) => miens.has(cleScore(t))),
    ...(competition ? tous.filter((t) => !miens.has(cleScore(t))) : []),
  ];
  const [tableau, setTableau] = useState<string | null>(null);
  const choisi = tableaux.find((t) => cleScore(t) === tableau) ?? tableaux[0];
  const parId = new Map(profils.map((p) => [p.id, p]));

  const ONGLETS: { id: Onglet; label: string; icone: JSX.Element }[] = [
    { id: 'records', label: 'Mes records', icone: <Trophy aria-hidden size={20} /> },
    { id: 'top', label: competition ? 'Top 10' : 'Mes meilleurs', icone: <Medal aria-hidden size={20} /> },
    { id: 'semaine', label: 'Ma semaine', icone: <TrendingUp aria-hidden size={20} /> },
  ];

  const soi = contreSoiMeme(profile.id, attempts);
  const ligue = LIGUES[soi.ligue];
  const intro =
    'Ici, tu retrouves tes records. ' +
    (competition
      ? 'Tu peux aussi comparer tes scores avec les autres joueurs de cet appareil.'
      : 'Tu te compares seulement à toi-même : c’est toi contre tes records !');

  return (
    <Screen titre="Scores" aLire={intro} retour="/accueil" large>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Scores">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={onglet === o.id}
            onClick={() => setOnglet(o.id)}
            className={`flex min-h-touch items-center gap-2 rounded-full px-4 font-bold ${onglet === o.id ? 'bg-ink text-cream' : 'bg-card'}`}
          >
            {o.icone} {o.label}
          </button>
        ))}
        <SpeakButton text={intro} size={48} className="ml-auto" />
      </div>

      {onglet === 'records' && (
        <section aria-label="Mes records">
          {mesRecords.length === 0 ? (
            <p className="carte p-5 text-lg">Joue une partie pour inscrire ton premier record !</p>
          ) : (
            <ul className="grid gap-2 md:grid-cols-2">
              {mesRecords.map((r) => {
                const g = getGame(r.gameId);
                const lv = LEVEL_META[r.level];
                return (
                  <li key={r.key} className="carte flex items-center gap-3 p-3">
                    <span className="text-3xl" aria-hidden>
                      {g?.icone ?? '🎮'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-titre text-lg font-extrabold leading-tight">
                        {g?.titre}
                      </span>
                      <span className="block truncate text-sm text-ink-soft">
                        {getLesson(r.lessonId)?.titre}
                      </span>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 text-xs font-bold text-white ${lv.couleur}`}
                      >
                        {lv.icone} {lv.court}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-titre text-2xl font-extrabold">
                        {formatNumber(r.score)}
                      </span>
                      <span className="text-xs text-ink-soft">{dateCourte(r.date)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {onglet === 'top' && (
        <section aria-label={competition ? 'Top 10 de l’appareil' : 'Mes meilleurs scores'}>
          {!competition && (
            <p className="carte mb-3 p-4 font-bold">
              Ici, chacun joue contre ses propres records : bats ton meilleur score !
            </p>
          )}
          {!choisi ? (
            <p className="carte p-5 text-lg">Pas encore de scores sur cet appareil.</p>
          ) : (
            <>
              <label htmlFor="tableau" className="mb-1 block font-bold">
                Jeu, leçon et niveau
              </label>
              <select
                id="tableau"
                className="mb-3 min-h-btn w-full rounded-2xl border-4 border-sky bg-card px-3 text-lg"
                value={cleScore(choisi)}
                onChange={(e) => setTableau(e.target.value)}
              >
                {tableaux.map((t) => (
                  <option key={cleScore(t)} value={cleScore(t)}>
                    {nomTableau(t)}
                  </option>
                ))}
              </select>
              <ol className="flex flex-col gap-2">
                {top10(competition ? records : mesRecords, choisi).map((r, i) => {
                  const p = parId.get(r.profileId);
                  const moi = r.profileId === profile.id;
                  return (
                    <li
                      key={r.key}
                      className={`carte flex items-center gap-3 p-2 pr-4 ${moi ? 'ring-4 ring-grape' : ''}`}
                    >
                      <span className="w-10 text-center font-titre text-2xl font-extrabold">
                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                      </span>
                      {p && (
                        <Avatar
                          config={p.avatar}
                          size={48}
                          compagnon={false}
                          fond="rgb(var(--c-sky) / 0.3)"
                        />
                      )}
                      <span className="flex-1 font-bold">
                        {p?.prenom ?? 'Ancien joueur'}
                        {moi && ' (moi)'}
                      </span>
                      <span className="text-right">
                        <span className="block font-titre text-xl font-extrabold">
                          {formatNumber(r.score)}
                        </span>
                        <span className="text-xs text-ink-soft">{dateCourte(r.date)}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </section>
      )}

      {onglet === 'semaine' && (
        <section aria-label="Ma semaine" className="flex flex-col gap-4">
          <div className={`carte flex flex-wrap items-center gap-4 bg-gradient-to-br p-5 ${ligue.couleur}`}>
            <span className="text-6xl" aria-hidden>
              {ligue.icone}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl">{ligue.label} (contre moi-même)</h2>
              <p className="font-bold">{ligue.phrase}</p>
              <p className="mt-1">
                Cette semaine : <strong>{soi.cetteSemaine} XP</strong> · semaine dernière :{' '}
                {soi.semaineDerniere} XP
              </p>
            </div>
            <SpeakButton
              text={`${ligue.label}. ${ligue.phrase} Cette semaine, tu as ${soi.cetteSemaine} XP. La semaine dernière, ${soi.semaineDerniere}.`}
            />
          </div>
          {competition && (
            <div className="carte p-4">
              <h2 className="mb-1 text-2xl">Classement de la semaine</h2>
              <p className="mb-3 text-sm text-ink-soft">
                XP gagnée depuis lundi par les joueurs de cet appareil. Tout repart à zéro chaque lundi.
              </p>
              <ol className="flex flex-col gap-2">
                {classementHebdo(
                  profils.map((p) => p.id),
                  attempts,
                ).map((l) => {
                  const p = parId.get(l.profileId)!;
                  const moi = l.profileId === profile.id;
                  return (
                    <li
                      key={l.profileId}
                      className={`flex items-center gap-3 rounded-2xl bg-cream p-2 pr-4 ${moi ? 'ring-4 ring-grape' : ''}`}
                    >
                      <span className="w-8 text-center font-titre text-xl font-extrabold">{l.rang}</span>
                      <Avatar config={p.avatar} size={44} compagnon={false} />
                      <span className="flex-1 font-bold">
                        {p.prenom}
                        {moi && ' (moi)'}
                      </span>
                      <span className="font-titre text-xl font-extrabold">{l.xp} XP</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </section>
      )}
    </Screen>
  );
}
