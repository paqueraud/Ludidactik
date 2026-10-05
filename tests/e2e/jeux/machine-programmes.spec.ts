/**
 * Test de fumée : La Machine à programmes de calcul (n° 18). Les items du Labo n'ont ni
 * `meta.programme` ni `meta.suite` : état calme attendu. Logique couverte par
 * src/games/_calcul-commun/calcul.test.ts.
 */
import { test } from '@playwright/test';
import { verifierEtatVide } from './_calcul';

for (const niveau of ['normal', 'plus_loin'])
  test(`Machine à programmes (${niveau}) : pas d’exercice adapté, sans erreur`, async ({ page }) => {
    await verifierEtatVide(page, 'machine-programmes', niveau);
  });
