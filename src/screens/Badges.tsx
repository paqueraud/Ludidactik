/** « Mes badges » : les badges obtenus (avec la date) et ceux à venir, avec l'avancement. */
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useEffect } from 'react';
import { Screen } from '@/components/Layout';
import { SpeakButton } from '@/components/ui';
import { BADGES } from '@/meta/badges';
import { statsBadges, useBadges, verifierBadges } from '@/services/meta';
import type { Profile } from '@/services/storage/db';
import { AvecProfil } from './Parcours';

export function Badges() {
  return <AvecProfil>{(profile) => <BadgesInner key={profile.id} profile={profile} />}</AvecProfil>;
}

const dateCourte = (t: number) =>
  new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function BadgesInner({ profile }: { profile: Profile }) {
  // rattrapage : badges mérités avant leur création (parties d'une version précédente)
  useEffect(() => {
    void verifierBadges(profile.id);
  }, [profile.id]);
  const obtenus = useBadges(profile.id);
  const stats = useLiveQuery(() => statsBadges(profile.id), [profile.id]);
  const parId = new Map((obtenus ?? []).map((b) => [b.badgeId, b.date]));
  const nb = parId.size;
  const intro = `Tu as ${nb} badge${nb > 1 ? 's' : ''} sur ${BADGES.length}. Chaque badge récompense tes efforts : aucun ne se perd !`;

  const tries = [...BADGES].sort((a, b) => Number(parId.has(b.id)) - Number(parId.has(a.id)));

  return (
    <Screen titre="Mes badges" aLire={intro} retour="/accueil" large>
      <p className="carte mb-4 p-4 text-lg font-bold">{intro}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tries.map((b, i) => {
          const date = parId.get(b.id);
          const p = stats ? b.progression(stats) : null;
          const texte = `${b.titre}. ${b.description}${date ? ` Obtenu le ${dateCourte(date)}.` : ''}`;
          return (
            <motion.li
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              className={`carte flex flex-col items-center gap-2 p-3 text-center ${date ? '' : 'opacity-75'}`}
              aria-label={`${texte}${date ? '' : ' Pas encore obtenu.'}`}
            >
              <span
                className={`relative flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-pop-sm ${
                  date ? `bg-gradient-to-br ${b.couleur}` : 'bg-ink/10 grayscale'
                }`}
                aria-hidden
              >
                {b.icone}
                {!date && (
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-card text-ink-soft shadow">
                    <Lock size={14} />
                  </span>
                )}
              </span>
              <span className="font-titre text-lg font-extrabold leading-tight">{b.titre}</span>
              <span className="text-sm leading-snug text-ink-soft">{b.description}</span>
              {date ? (
                <span className="text-sm font-bold text-grass-dark">Obtenu le {dateCourte(date)}</span>
              ) : (
                p && (
                  <span className="w-full">
                    <span
                      className="block h-3 overflow-hidden rounded-full bg-ink/10"
                      role="progressbar"
                      aria-label={`Avancement : ${Math.min(p.n, p.but)} sur ${p.but}`}
                      aria-valuemin={0}
                      aria-valuemax={p.but}
                      aria-valuenow={Math.min(p.n, p.but)}
                    >
                      <span
                        className="block h-full rounded-full bg-grape"
                        style={{ width: `${Math.min(1, p.n / p.but) * 100}%` }}
                      />
                    </span>
                    <span className="text-xs font-bold text-ink-soft">
                      {Math.min(p.n, p.but)} / {p.but}
                    </span>
                  </span>
                )
              )}
              <SpeakButton text={texte} size={40} />
            </motion.li>
          );
        })}
      </ul>
    </Screen>
  );
}
