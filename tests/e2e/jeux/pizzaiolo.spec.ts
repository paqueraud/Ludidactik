/**
 * Test de fumée : Le Pizzaïolo des fractions (n° 13). Premier item du Labo : comparer 1/3 et 1/5 ;
 * le deuxième : garnir 3/8 de pizza (colorier).
 */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

test('Pizzaïolo (facile) : comparer deux commandes, puis garnir au toucher', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/pizzaiolo?niveau=facile');
  await expect(page.getByRole('button', { name: 'Autant' })).toBeVisible();
  await page.keyboard.press('a');
  await expect(page.getByText('Bien vu !')).toBeVisible();
  await expect(page.getByText(/Commande 2 \//)).toBeVisible();
  const parts = page.getByRole('checkbox', { name: /^Part \d/ });
  if ((await parts.count()) > 0) {
    await expect(page.getByText(/garnie/).first()).toBeVisible();
  }
  expect(erreurs).toEqual([]);
});

test('Pizzaïolo (normal) : une erreur de comparaison est corrigée', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/pizzaiolo?niveau=normal');
  await expect(page.getByRole('button', { name: 'Autant' })).toBeVisible();
  await page.keyboard.press('b');
  await expect(page.getByText(/Presque/).first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Commande 2 \//)).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Pizzaïolo (plus loin) : « autant » n’est pas juste ici', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/pizzaiolo?niveau=plus_loin');
  await page.getByRole('button', { name: 'Autant' }).click();
  await expect(page.getByText(/Presque/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
