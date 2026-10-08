/** Test de fumée : Le Pizzaïolo des fractions (n° 13). Premier item du Labo : garnir 3/8 de pizza. */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

test('Pizzaïolo (facile) : garnir 3 parts sur 8 au toucher', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/pizzaiolo?niveau=facile');
  await expect(page.getByText('Garnis 3/8 de la pizza.')).toBeVisible();
  for (const n of [1, 2, 3]) await page.getByRole('checkbox', { name: `Part ${n}`, exact: true }).click();
  await expect(page.getByText(/3 parts garnies sur 3/)).toBeVisible();
  await page.getByRole('button', { name: 'Servir !' }).click();
  await expect(page.getByText(/Exact|Juste|Commande 2 \//).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Pizzaïolo (normal) : couper en 8 parts égales, puis garnir', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/pizzaiolo?niveau=normal');
  for (let i = 0; i < 7; i++) await page.getByRole('button', { name: 'Une part de plus' }).click();
  await expect(page.getByRole('group', { name: 'Nombre de parts' }).getByText('8')).toBeVisible();
  await page.getByRole('button', { name: 'Couper !' }).click();
  await expect(page.getByRole('checkbox', { name: 'Part 8', exact: true })).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Pizzaïolo (plus loin) : une mauvaise découpe explique le dénominateur', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/pizzaiolo?niveau=plus_loin');
  await page.getByRole('button', { name: 'Couper !' }).click();
  await expect(page.getByText(/Presque ! Le dénominateur est 8/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
