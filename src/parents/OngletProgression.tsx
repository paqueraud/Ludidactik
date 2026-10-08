/** Progression et statistiques d'un enfant : maîtrise par matière, étoiles, compétences fragiles, mots ratés. */
import { useLiveQuery } from 'dexie-react-hooks';
import { Stars } from '@/components/ui';
import { getLesson, lessonsOf } from '@/content';
import { LEVEL_META, MATIERE_META } from '@/content/meta';
import { LEVELS } from '@/content/schemas';
import { mastery } from '@/engine/score';
import type { Profile } from '@/services/profiles';
import { formatDuree, lastDays, limiteDe } from '@/services/screenTime';
import { db } from '@/services/storage/db';
import { useSettings } from '@/stores/settings';
import { BarreProportion, BarresJours } from './Graphiques';
import type { OngletProfilProps } from './OngletLecons';
import {
  competencesFragiles,
  derniersRates,
  etoilesParNiveau,
  leconsTravaillees,
  maitriseParMatiere,
} from './stats';
import { ChoixProfil, Section } from './ui';

export function OngletProgression({ profiles, profil, setProfil }: OngletProfilProps) {
  return (
    <>
      <ChoixProfil profiles={profiles} value={profil?.id ?? null} onChange={setProfil} />
      {profil && <ProgressionDuProfil key={profil.id} profile={profil} />}
    </>
  );
}

const titreLecon = (id: string) => getLesson(id)?.titre ?? id;
const dateCourte = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

function ProgressionDuProfil({ profile }: { profile: Profile }) {
  const programmeHG = useSettings((s) => s.programmeHG);
  const data = useLiveQuery(async () => {
    const [progress, attempts, leitner, temps] = await Promise.all([
      db.progress.where('profileId').equals(profile.id).toArray(),
      db.attempts.where('profileId').equals(profile.id).toArray(),
      db.leitner.where('profileId').equals(profile.id).toArray(),
      db.screenTime.where('profileId').equals(profile.id).toArray(),
    ]);
    return { progress, attempts, leitner, temps };
  }, [profile.id]);
  if (!data) return null;

  const lecons = leconsTravaillees(data.progress);
  const etoiles = etoilesParNiveau(data.progress);
  const matieres = maitriseParMatiere(data.progress, lessonsOf(profile.classe, programmeHG));
  const fragiles = competencesFragiles(data.attempts);
  const mots = derniersRates(data.leitner, 'mot');
  const calculs = derniersRates(data.leitner, 'calcul', 10);
  const jours = lastDays(data.temps, 7);
  const tempsSemaine = jours.reduce((s, j) => s + j.ms, 0);

  return (
    <>
      <Section titre={`Vue d’ensemble de ${profile.prenom}`}>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Leçons travaillées', String(lecons.length)],
            ['Parties jouées', String(data.attempts.length)],
            ['Temps de jeu (7 jours)', formatDuree(tempsSemaine)],
            ['Éléments à revoir', String(data.leitner.filter((r) => r.box === 1).length)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-cream p-3">
              <dt className="text-sm text-ink-soft">{k}</dt>
              <dd className="font-titre text-3xl font-extrabold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xl">Maîtrise par matière ({profile.classe})</h3>
            <div className="flex flex-col gap-2">
              {matieres.map((m) => (
                <BarreProportion
                  key={m.matiere}
                  label={MATIERE_META[m.matiere].label}
                  valeur={m.maitrise}
                  detail={`${m.travaillees}/${m.total} leçons`}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xl">Temps de jeu</h3>
            <BarresJours jours={jours} limiteMin={limiteDe(profile)} />
          </div>
        </div>
        <h3 className="mb-2 mt-4 text-xl">Étoiles par niveau</h3>
        <div className="flex flex-col gap-2">
          {LEVELS.map((lv) => (
            <BarreProportion
              key={lv}
              label={`${LEVEL_META[lv].icone} ${LEVEL_META[lv].label}`}
              valeur={etoiles[lv].max ? etoiles[lv].etoiles / etoiles[lv].max : 0}
              detail={`${etoiles[lv].etoiles} ★ sur ${etoiles[lv].max}`}
              couleur="rgb(var(--c-sun-dark))"
            />
          ))}
        </div>
      </Section>

      <Section
        titre="Compétences fragiles"
        intro="Leçons des 30 derniers jours où l’enfant réussit moins de 70 % des réponses. Une bonne idée : y rejouer au niveau Facile, ou en parler ensemble."
      >
        {fragiles.length === 0 ? (
          <p className="rounded-2xl bg-grass/20 p-3">Rien à signaler pour le moment : bravo !</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left">
              <thead>
                <tr className="border-b-2 border-ink/10 text-sm text-ink-soft">
                  <th className="py-2 pr-2">Leçon</th>
                  <th className="px-2">Réussite</th>
                  <th className="px-2">Réponses</th>
                  <th className="pl-2">Parties</th>
                </tr>
              </thead>
              <tbody>
                {fragiles.slice(0, 12).map((f) => (
                  <tr key={f.lessonId} className="border-b border-ink/5">
                    <td className="py-2 pr-2">{titreLecon(f.lessonId)}</td>
                    <td className="px-2 font-bold text-coral-dark">{Math.round(f.taux * 100)} %</td>
                    <td className="px-2">
                      {f.correct} / {f.total}
                    </td>
                    <td className="pl-2">{f.parties}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xl">Derniers mots ratés</h3>
            {mots.length ? (
              <ul className="flex flex-wrap gap-2">
                {mots.map((m) => (
                  <li key={m} className="rounded-full bg-coral/15 px-3 py-1 font-bold">
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-soft">Aucun mot à revoir.</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-xl">Calculs à revoir</h3>
            {calculs.length ? (
              <ul className="flex flex-wrap gap-2">
                {calculs.map((c) => (
                  <li key={c} className="rounded-full bg-sky/20 px-3 py-1 font-bold">
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-soft">Aucun calcul à revoir.</p>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          Ces éléments reviennent automatiquement plus souvent dans les jeux (répétition espacée).
        </p>
      </Section>

      <Section titre="Leçons travaillées">
        {lecons.length === 0 ? (
          <p className="text-ink-soft">{profile.prenom} n’a pas encore joué.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b-2 border-ink/10 text-sm text-ink-soft">
                  <th className="py-2 pr-2">Leçon</th>
                  {LEVELS.map((lv) => (
                    <th key={lv} className="px-2" title={LEVEL_META[lv].label}>
                      <span aria-hidden>{LEVEL_META[lv].icone}</span>
                      <span className="sr-only">{LEVEL_META[lv].label}</span>
                    </th>
                  ))}
                  <th className="px-2">Maîtrise</th>
                  <th className="px-2">Parties</th>
                  <th className="pl-2">Dernière fois</th>
                </tr>
              </thead>
              <tbody>
                {lecons.map((l) => (
                  <tr key={l.lessonId} className="border-b border-ink/5">
                    <td className="py-2 pr-2">{titreLecon(l.lessonId)}</td>
                    {LEVELS.map((lv) => (
                      <td key={lv} className="px-2">
                        <Stars value={l.stars[lv]} size={14} />
                      </td>
                    ))}
                    <td className="px-2 font-bold">{Math.round(mastery(l.best) * 100)} %</td>
                    <td className="px-2">{l.plays}</td>
                    <td className="pl-2">{dateCourte(l.lastPlayed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}
