/**
 * Test de fumée : L'Horloger (n° 12). Premier item du Labo : « Le film commence à 14 h 20 et dure
 * 45 min. À quelle heure finit-il ? » (15 h 05).
 */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

test('Horloger (facile) : calculer l’heure de fin au clavier', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/horloger?niveau=facile');
  await expect(page.getByText('Départ : 14 h 20')).toBeVisible();
  await expect(page.getByText(/On avance par sauts/)).toBeVisible();
  await page.keyboard.type('15');
  await page.keyboard.type('05');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Exact, bon voyage/)).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Horloger (normal) : saisie au pavé et correction', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/horloger?niveau=normal');
  const pave = page.getByRole('group', { name: 'Pavé numérique' });
  await pave.getByRole('button', { name: '1', exact: true }).click();
  await pave.getByRole('button', { name: '5', exact: true }).click();
  await pave.getByRole('button', { name: 'Valider' }).click();
  await expect(page.getByText(/Presque/).first()).toBeVisible();
  await expect(page.getByText('15 h 05').first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Horloge 2 \//)).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Horloger (plus loin) : une erreur montre la bonne heure', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/horloger?niveau=plus_loin');
  await expect(page.getByText('Départ : 14 h 20')).toBeVisible();
  await expect(page.getByText(/On avance par sauts/)).toHaveCount(0);
  await page.keyboard.type('9');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Presque/).first()).toBeVisible();
  await expect(page.getByText('15 h 05').first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
