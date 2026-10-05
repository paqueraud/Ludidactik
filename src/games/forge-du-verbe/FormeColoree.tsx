/** Forme conjuguée colorée : radical, marque du temps, marque de la personne (CM2) ; auxiliaire + participe. */
import { LIBELLE_ROLE, type Morceau, type Role } from '../_langue-commun/conjugaison';

const STYLE: Record<Role, string> = {
  radical: 'text-ink',
  temps:
    'rounded bg-grape/20 px-0.5 text-grape-dark underline decoration-grape decoration-4 underline-offset-4',
  personne:
    'rounded bg-coral/20 px-0.5 text-coral-dark underline decoration-coral decoration-4 underline-offset-4',
  terminaison: 'rounded bg-coral/20 px-0.5 text-coral-dark',
  auxiliaire: 'rounded bg-sky/25 px-1 text-ink underline decoration-sky decoration-4 underline-offset-4',
  participe:
    'rounded bg-grass/25 px-1 text-grass-dark underline decoration-grass decoration-4 underline-offset-4',
};

export function FormeColoree({ morceaux, sujet }: { morceaux: Morceau[]; sujet: string }) {
  const roles = [...new Set(morceaux.filter((m) => m.texte.trim()).map((m) => m.role))];
  const lecture = morceaux
    .filter((m) => m.texte.trim())
    .map((m) => `${LIBELLE_ROLE[m.role]} : ${m.texte}`)
    .join(', ');
  return (
    <div className="flex flex-col items-center gap-1" aria-label={`Décomposition : ${lecture}`} role="img">
      <p className="font-titre text-3xl font-extrabold" aria-hidden>
        <span className={`text-ink-soft ${/['’]$/.test(sujet) ? '' : 'mr-2'}`}>{sujet}</span>
        {morceaux.map((m, i) => (
          <span key={i} className={STYLE[m.role]}>
            {m.texte}
          </span>
        ))}
      </p>
      <p className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm" aria-hidden>
        {roles.map((r) => (
          <span key={r} className={`${STYLE[r]} !text-sm !no-underline`}>
            {LIBELLE_ROLE[r]}
          </span>
        ))}
      </p>
    </div>
  );
}
