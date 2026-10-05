/**
 * Test de fumée : Le Grand Huit des opérations posées (n° 20). Les items du Labo n'ont pas de
 * `meta.posee` : état calme attendu. Les algorithmes (addition, soustraction par cassage,
 * multiplication, division) sont testés chiffre par chiffre dans src/games/_calcul-commun/calcul.test.ts.
 */
import { test } from '@playwright/test';
import { verifierEtatVide } from './_calcul';

for (const niveau of ['facile', 'plus_loin'])
  test(`Grand Huit (${niveau}) : pas d’exercice adapté, sans erreur`, async ({ page }) => {
    await verifierEtatVide(page, 'grand-huit-operations', niveau);
  });
