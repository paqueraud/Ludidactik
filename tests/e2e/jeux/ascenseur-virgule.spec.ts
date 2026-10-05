/**
 * Test de fumée : L'Ascenseur de la virgule (n° 15). Les items du Labo n'ont pas de `meta.glisse` (ni
 * d'énoncé « n × 10 ») : le jeu affiche un état calme. La logique est couverte par
 * src/games/_calcul-commun/calcul.test.ts.
 */
import { test } from '@playwright/test';
import { verifierEtatVide } from './_calcul';

for (const niveau of ['facile', 'plus_loin'])
  test(`Ascenseur de la virgule (${niveau}) : pas d’exercice adapté, sans erreur`, async ({ page }) => {
    await verifierEtatVide(page, 'ascenseur-virgule', niveau);
  });
