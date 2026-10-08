/**
 * Espace parents (Phase 6) : accès protégé par le code parent + une question de calcul, session qui
 * expire après 10 minutes d'inactivité, puis six onglets.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { useProfiles } from '@/services/profiles';
import { hasParentCode } from '@/services/parentCode';
import { useParentSession } from '@/stores/parentSession';
import { CreerCode, Deverrouiller } from './Acces';
import { OngletLecons } from './OngletLecons';
import { OngletMots } from './OngletMots';
import { OngletProfils } from './OngletProfils';
import { OngletProgression } from './OngletProgression';
import { OngletReglages } from './OngletReglages';
import { OngletTemps } from './OngletTemps';
import { AucunProfil } from './ui';

const ONGLETS = [
  { id: 'mots', label: 'Mots de la semaine', icone: '📝' },
  { id: 'lecons', label: 'Leçons en cours', icone: '📌' },
  { id: 'temps', label: 'Temps d’écran', icone: '⏱️' },
  { id: 'progression', label: 'Progression', icone: '📈' },
  { id: 'reglages', label: 'Réglages', icone: '⚙️' },
  { id: 'profils', label: 'Profils et sauvegarde', icone: '👨‍👩‍👧' },
] as const;
type Onglet = (typeof ONGLETS)[number]['id'];

/** Ouvre / referme la session parent selon l'activité (10 min d'inactivité). */
function useSessionParent(): boolean {
  const { expire, touch, lock } = useParentSession();
  const [now, setNow] = useState(() => Date.now());
  const ouverte = expire > now;
  useEffect(() => {
    if (!ouverte) return;
    const actif = () => touch();
    const evts = ['pointerdown', 'keydown', 'scroll'] as const;
    evts.forEach((e) => window.addEventListener(e, actif, { passive: true }));
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (useParentSession.getState().expire <= n) lock();
    }, 5_000);
    return () => {
      evts.forEach((e) => window.removeEventListener(e, actif));
      clearInterval(t);
    };
  }, [ouverte, touch, lock]);
  // à l'ouverture, on resynchronise l'horloge
  useEffect(() => setNow(Date.now()), [expire]);
  return ouverte;
}

export function EspaceParents() {
  const codeExiste = useLiveQuery(() => hasParentCode(), []);
  const ouverte = useSessionParent();
  const lock = useParentSession((s) => s.lock);

  if (codeExiste === undefined) return null;
  if (!codeExiste || !ouverte)
    return (
      <Screen titre="Espace parents" retour="/" adulte>
        {!codeExiste ? <CreerCode /> : <Deverrouiller />}
      </Screen>
    );

  return (
    <Screen
      titre="Espace parents"
      retour="/"
      adulte
      large
      actions={
        <button
          type="button"
          onClick={lock}
          className="flex min-h-touch shrink-0 items-center gap-2 rounded-full bg-ink px-4 font-bold text-cream"
        >
          <Lock size={18} aria-hidden /> <span className="hidden sm:inline">Verrouiller</span>
          <span className="sr-only sm:hidden">Verrouiller l’espace parents</span>
        </button>
      }
    >
      <ContenuParents />
    </Screen>
  );
}

function ContenuParents() {
  const { onglet: param } = useParams();
  const onglet: Onglet = ONGLETS.some((o) => o.id === param) ? (param as Onglet) : 'mots';
  const profiles = useProfiles();
  const [profilId, setProfilId] = useState<string | null>(null);
  if (!profiles) return null;
  const profil = profiles.find((p) => p.id === profilId) ?? profiles[0] ?? null;
  const props = { profiles, profil, setProfil: setProfilId };
  const besoinProfil = onglet === 'lecons' || onglet === 'temps' || onglet === 'progression';

  return (
    <>
      <nav aria-label="Rubriques de l’espace parents" className="-mx-1 mb-4 overflow-x-auto pb-1">
        <ul className="flex gap-2 px-1 lg:flex-wrap">
          {ONGLETS.map((o) => (
            <li key={o.id} className="shrink-0">
              <Link
                to={`/parents/${o.id}`}
                replace
                className={`flex min-h-btn items-center gap-2 rounded-full px-4 font-titre text-lg font-bold ${o.id === onglet ? 'bg-ink text-cream' : 'bg-card shadow-soft'}`}
                aria-current={o.id === onglet ? 'page' : undefined}
              >
                <span aria-hidden>{o.icone}</span>
                {o.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {besoinProfil && profiles.length === 0 ? (
        <AucunProfil />
      ) : onglet === 'mots' ? (
        <OngletMots />
      ) : onglet === 'lecons' ? (
        <OngletLecons {...props} />
      ) : onglet === 'temps' ? (
        <OngletTemps {...props} />
      ) : onglet === 'progression' ? (
        <OngletProgression {...props} />
      ) : onglet === 'reglages' ? (
        <OngletReglages />
      ) : (
        <OngletProfils profiles={profiles} />
      )}
    </>
  );
}
