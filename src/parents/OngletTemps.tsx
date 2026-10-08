/** Temps d'écran : limite quotidienne par enfant, temps joué aujourd'hui, 7 derniers jours, bonus. */
import { useLiveQuery } from 'dexie-react-hooks';
import { Timer } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { type Profile, updateProfile } from '@/services/profiles';
import { dayKey, formatDuree, grantBonus, lastDays, limitStatus, limiteDe } from '@/services/screenTime';
import { db } from '@/services/storage/db';
import { BarresJours } from './Graphiques';
import type { OngletProfilProps } from './OngletLecons';
import { ChoixProfil, Section } from './ui';

const CHOIX: (number | null)[] = [15, 20, 30, 45, 60, 90, 120, null];

export function OngletTemps({ profiles, profil, setProfil }: OngletProfilProps) {
  return (
    <Section
      titre="Temps d’écran"
      intro="Le temps compté est celui des parties (hors pauses). Quand la limite est atteinte, la partie en cours se termine normalement, puis un écran de pause douce invite l’enfant à faire autre chose."
    >
      <ChoixProfil profiles={profiles} value={profil?.id ?? null} onChange={setProfil} />
      {profil && <TempsDuProfil key={profil.id} profile={profil} />}
    </Section>
  );
}

function TempsDuProfil({ profile }: { profile: Profile }) {
  const lignes = useLiveQuery(
    () => db.screenTime.where('profileId').equals(profile.id).toArray(),
    [profile.id],
  );
  const [message, setMessage] = useState<string | null>(null);
  const limite = limiteDe(profile);
  const auj = lignes?.find((r) => r.day === dayKey());
  const etat = limitStatus(limite, auj?.ms ?? 0, auj?.bonusMs ?? 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <fieldset>
          <legend className="mb-2 font-bold">Limite quotidienne pour {profile.prenom}</legend>
          <div className="flex flex-wrap gap-2">
            {CHOIX.map((c) => (
              <label
                key={String(c)}
                className={`flex min-h-touch cursor-pointer items-center rounded-full px-4 font-bold has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-grape ${limite === c ? 'bg-ink text-cream' : 'bg-cream'}`}
              >
                <input
                  type="radio"
                  name={`limite-${profile.id}`}
                  className="sr-only"
                  checked={limite === c}
                  onChange={() => void updateProfile(profile.id, { limiteMinutes: c })}
                />
                {c === null ? 'Illimité' : `${c} min`}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="rounded-2xl bg-cream p-4">
          <p className="text-lg">
            Aujourd’hui : <strong>{formatDuree(etat.usedMs)}</strong> de jeu
            {etat.limitMs !== null && (
              <>
                {' '}
                sur <strong>{formatDuree(etat.limitMs)}</strong>
                {auj?.bonusMs ? ` (dont ${formatDuree(auj.bonusMs)} accordées en plus)` : ''}
              </>
            )}
            .
          </p>
          {etat.reached ? (
            <p className="mt-1 font-bold text-coral-dark">La limite du jour est atteinte.</p>
          ) : etat.limitMs !== null ? (
            <p className="mt-1 text-ink-soft">Il reste {formatDuree(etat.remainingMs)}.</p>
          ) : null}
          {etat.limitMs !== null && (
            <Button
              className="mt-3"
              variant="sky"
              icon={<Timer size={18} aria-hidden />}
              onClick={async () => {
                await grantBonus(profile.id, 10);
                setMessage('10 minutes accordées pour aujourd’hui.');
              }}
            >
              Accorder 10 minutes aujourd’hui
            </Button>
          )}
          {message && (
            <p role="status" className="mt-2 font-bold">
              {message}
            </p>
          )}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xl">Les 7 derniers jours</h3>
        <BarresJours jours={lastDays(lignes ?? [], 7)} limiteMin={limite} />
      </div>
    </div>
  );
}
