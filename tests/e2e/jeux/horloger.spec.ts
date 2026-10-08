/** Test de fumée : L'Horloger (n° 12). Premier item du Labo : « Quelle heure est-il ? » (3 h 15). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

test('Horloger (facile) : choisir la bonne heure', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/horloger?niveau=facile');
  await expect(page.getByText('Quelle heure est-il ?')).toBeVisible();
  await page.getByRole('button', { name: '3 h 15' }).click();
  await expect(page.getByText(/Bravo, tu sais lire l’heure|Horloge 2 \//).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Horloger (normal) : saisie au pavé et correction', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/horloger?niveau=normal');
  const pave = page.getByRole('group', { name: 'Pavé numérique' });
  await pave.getByRole('button', { name: '9', exact: true }).click();
  await pave.getByRole('button', { name: 'Valider' }).click();
  await expect(page.getByText(/Presque/).first()).toBeVisible();
  await expect(page.getByText('3 h 15').first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Horloge 2 \//)).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Horloger (plus loin) : lire l’heure au clavier', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/horloger?niveau=plus_loin');
  await expect(page.getByText('Quelle heure est-il ?')).toBeVisible();
  await page.keyboard.type('03');
  await page.keyboard.type('15');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Bravo|Exact|Horloge 2 \//).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
