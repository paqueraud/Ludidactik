/**
 * Test de fumée : La Machine à programmes de calcul (n° 18). Premier exemple du Labo : la suite
 * 3, 7, 11, 15… (`meta.suite`) ; étape 10 → 39. Logique couverte par src/games/_calcul-commun/calcul.test.ts.
 */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

const pave = (page: import('@playwright/test').Page) => page.getByRole('group', { name: 'Pavé numérique' });

test('Machine à programmes (normal) : la bonne réponse', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/machine-programmes?niveau=normal');
  await expect(page.getByText(/Combien à l’étape 10/)).toBeVisible();
  await pave(page).getByRole('button', { name: '3', exact: true }).click();
  await pave(page).getByRole('button', { name: '9', exact: true }).click();
  await pave(page).getByRole('button', { name: 'Valider' }).click();
  await expect(page.getByText(/Bravo|Super|Génial|Exactement|Bien joué|Parfait/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Machine à programmes (plus loin) : une erreur affiche la correction', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/machine-programmes?niveau=plus_loin');
  await expect(page.getByText(/Combien à l’étape 10/)).toBeVisible();
  await pave(page).getByRole('button', { name: '4', exact: true }).click();
  await pave(page).getByRole('button', { name: 'Valider' }).click();
  await expect(page.getByText(/Presque/).first()).toBeVisible();
  await expect(page.getByText('39').first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
