/** Leçons « en cours » de chaque enfant (classe → matière → domaine), synchronisées avec l'épingle 📌. */
import { useState } from 'react';
import { CLASSES_ACTIVES, lessonsOf, matieresOf } from '@/content';
import { MATIERE_META } from '@/content/meta';
import type { Classe } from '@/content/schemas';
import { type Profile, updateProfile } from '@/services/profiles';
import { useSettings } from '@/stores/settings';
import { periodeActuelle } from '@/screens/Parcours';
import { ChoixProfil, Section } from './ui';

export function OngletLecons({ profiles, profil, setProfil }: OngletProfilProps) {
  return (
    <Section
      titre="Leçons en cours"
      intro="Cochez les leçons que l’enfant travaille en ce moment en classe : elles apparaissent épinglées 📌 dans « Mes leçons en cours ». L’enfant peut aussi les épingler lui-même."
    >
      <ChoixProfil profiles={profiles} value={profil?.id ?? null} onChange={setProfil} />
      {profil && <LeconsDuProfil key={profil.id} profile={profil} />}
    </Section>
  );
}

export interface OngletProfilProps {
  profiles: Profile[];
  profil: Profile | null;
  setProfil(id: string): void;
}

function LeconsDuProfil({ profile }: { profile: Profile }) {
  const programmeHG = useSettings((s) => s.programmeHG);
  const [classe, setClasse] = useState<Classe>(profile.classe);
  const p = periodeActuelle();
  const set = (id: string, coche: boolean) => {
    const enCours = coche ? [...new Set([...profile.enCours, id])] : profile.enCours.filter((x) => x !== id);
    void updateProfile(profile.id, { enCours });
  };
  const nb = profile.enCours.filter((id) => id.startsWith(`${classe}.`)).length;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Classe">
        {CLASSES_ACTIVES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={classe === c}
            onClick={() => setClasse(c)}
            className={`min-h-touch rounded-full px-4 font-bold ${classe === c ? 'bg-grape text-white' : 'bg-cream'}`}
          >
            {c}
            {c === profile.classe ? ' (sa classe)' : ''}
          </button>
        ))}
        <span className="text-sm text-ink-soft">
          {nb} leçon{nb > 1 ? 's' : ''} en cours en {classe} · nous sommes en période {p}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {matieresOf(classe, programmeHG).map((m) => {
          const lecons = lessonsOf(classe, programmeHG, m);
          const cochees = lecons.filter((l) => profile.enCours.includes(l.id)).length;
          const domaines = [...new Set(lecons.map((l) => l.domaine))];
          return (
            <details key={m} className="rounded-2xl bg-cream" open={cochees > 0}>
              <summary className="flex min-h-btn cursor-pointer items-center gap-2 px-4 font-titre text-xl font-bold">
                <span aria-hidden>{MATIERE_META[m].icone}</span>
                {MATIERE_META[m].label}
                <span className="ml-auto rounded-full bg-card px-3 text-sm">
                  {cochees} / {lecons.length}
                </span>
              </summary>
              <div className="space-y-3 px-4 pb-4">
                {domaines.map((d) => (
                  <fieldset key={d}>
                    <legend className="mb-1 font-bold text-ink-soft">{d}</legend>
                    <div className="grid gap-1 md:grid-cols-2">
                      {lecons
                        .filter((l) => l.domaine === d)
                        .map((l) => (
                          <label
                            key={l.id}
                            className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl bg-card px-3 py-2"
                          >
                            <input
                              type="checkbox"
                              className="h-5 w-5 shrink-0"
                              checked={profile.enCours.includes(l.id)}
                              onChange={(e) => set(l.id, e.target.checked)}
                            />
                            <span className="min-w-0 flex-1">{l.titre}</span>
                            {l.periodes.includes(p) && (
                              <span className="shrink-0 rounded-full bg-sun/40 px-2 text-xs font-bold">
                                P{p}
                              </span>
                            )}
                          </label>
                        ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
