/** Test de fumée : Le Chocolatier (n° 14). Premier item du Labo : comparer 1/3 et 1/5 (bandes). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

test('Chocolatier (facile) : comparer deux bandes', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/chocolatier?niveau=facile');
  await expect(page.getByRole('img', { name: 'Bande A : 1/3' })).toBeVisible();
  await page.keyboard.press('a');
  await expect(page.getByText(/Bien vu, gourmand/)).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Chocolatier (plus loin) : on imagine les bandes, la correction les montre', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/chocolatier?niveau=plus_loin');
  await expect(page.getByText(/imagine la bande/).first()).toBeVisible();
  await page.keyboard.press('b');
  await expect(page.getByText(/Presque/).first()).toBeVisible();
  await expect(page.getByRole('img', { name: 'Bande B : 1/5' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Commande 2 \//)).toBeVisible();
  expect(erreurs).toEqual([]);
});
