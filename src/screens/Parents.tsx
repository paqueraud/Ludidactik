import { Screen } from '@/components/Layout';
import { Ludo } from '@/components/Ludo';

/** Espace parents — construit en Phase 6 (code parent, listes de mots, réglages, statistiques). */
export function Parents() {
  return (
    <Screen titre="Espace parents" retour="/">
      <div className="carte flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <Ludo pose="pense" size={110} />
        <div className="space-y-2">
          <p className="text-lg font-bold">L’espace parents arrive bientôt.</p>
          <p>
            Il permettra d’ajouter les listes de mots de la semaine (avec votre voix), de choisir les leçons
            en cours, de limiter le temps de jeu, de régler le programme d’histoire-géographie (2020 ou 2026)
            et de suivre la progression.
          </p>
          <p className="text-sm text-ink-soft">
            Les mots de passe des profils sont un verrou familial : toutes les données restent sur cet
            appareil.
          </p>
        </div>
      </div>
    </Screen>
  );
}
