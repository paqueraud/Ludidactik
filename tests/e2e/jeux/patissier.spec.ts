/**
 * Test de fumée : Le Pâtissier proportionnel (n° 17). Les items du Labo n'ont pas de `meta.tableau` :
 * état calme attendu. Logique couverte par src/games/_calcul-commun/calcul.test.ts.
 */
import { test } from '@playwright/test';
import { verifierEtatVide } from './_calcul';

for (const niveau of ['facile', 'normal'])
  test(`Pâtissier (${niveau}) : pas d’exercice adapté, sans erreur`, async ({ page }) => {
    await verifierEtatVide(page, 'patissier', niveau);
  });
