/** Test de fumée : Le Chocolatier (n° 14). Premier item du Labo : « Colorie 3/8 » (tablette de 8 carrés). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

test('Chocolatier (facile) : une tablette vide est corrigée avec douceur', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/chocolatier?niveau=facile');
  await expect(page.getByText('Colorie 3/8 de la tablette.')).toBeVisible();
  await expect(page.getByText(/0 carré emballé sur 8/)).toBeVisible();
  await page.getByRole('button', { name: 'C’est prêt !' }).click();
  await expect(page.getByText(/Presque/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Chocolatier (normal) : choisir le moule de 8 carrés', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/chocolatier?niveau=normal');
  await expect(page.getByText('Choisis le bon moule à chocolat :')).toBeVisible();
  await page.getByRole('button', { name: '8 carrés' }).click();
  await expect(page.getByText(/Touche les carrés pour les emballer/)).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Chocolatier (plus loin) : un mauvais moule explique le dénominateur', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/chocolatier?niveau=plus_loin');
  await page.getByRole('button', { name: '9 carrés' }).click();
  await expect(page.getByText(/Presque ! Ce moule a 9 carrés/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
