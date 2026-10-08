/**
 * Garde de chargement : avant d'afficher un écran, charge le contenu des classes dont il a besoin
 * (classe de l'URL, de la leçon jouée ou de l'enfant connecté ; tout pour l'espace parents, le labo,
 * les scores et le duel). Les écrans d'accueil et de profils n'en ont pas besoin.
 */
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { CLASSES_ACTIVES, classeDeLecon, reessayerChargement, useContenuPret } from '@/content';
import type { Classe } from '@/content/schemas';
import { useCurrentProfile } from '@/services/profiles';
import { Chargement } from './Chargement';

const TOUT = /^\/(parents|labo|scores|duel)(\/|$)/;
const SANS_CONTENU = /^\/(profils(\/.*)?)?$/;

function classesRequises(chemin: string, profilClasse: Classe | null | undefined): Classe[] | undefined {
  if (SANS_CONTENU.test(chemin)) return [];
  if (TOUT.test(chemin)) return CLASSES_ACTIVES;
  const out = new Set<Classe>();
  const seg = chemin.split('/').map((s) => decodeURIComponent(s));
  if (seg[1] === 'jouer' && seg[2] && CLASSES_ACTIVES.includes(seg[2] as Classe)) out.add(seg[2] as Classe);
  if (seg[1] === 'partie' && seg[2]) {
    const c = classeDeLecon(seg[2]);
    if (c) out.add(c);
  }
  if (profilClasse === undefined && !out.size) return undefined; // profil en cours de lecture
  if (profilClasse) out.add(profilClasse);
  return [...out];
}

export function ContenuRequis({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const profile = useCurrentProfile();
  const classes = classesRequises(pathname, profile === undefined ? undefined : (profile?.classe ?? null));
  const { pret, erreur } = useContenuPret(classes ?? []);
  if (classes === undefined) return <Chargement />;
  if (erreur)
    return (
      <Chargement
        erreur="Les leçons n'ont pas pu être chargées. Vérifie la connexion à Internet."
        onReessayer={reessayerChargement}
      />
    );
  if (!pret) return <Chargement />;
  return <>{children}</>;
}
