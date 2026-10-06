/** Test de fumée : Tangram & Formes dans le Labo (pièces à placer, puis question), aucune erreur console. */
import { expect, test } from '@playwright/test';
import { REPONDU, surveillerErreurs } from './_geometrie';

test('Tangram (facile) : la silhouette se remplit, puis on répond', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/tangram?niveau=facile');
  await expect(page.getByText('Reconstruis la figure avec les pièces !')).toBeVisible();
  const aide = page.getByRole('button', { name: /Placer une pièce/ });
  for (let k = 0; k < 3 && (await aide.isVisible()); k++) await aide.click();
  // Exemple du Labo : un rectangle de 3 × 2 carrés ; on pose les pièces restantes au clavier
  for (const touche of [
    'Enter',
    'ArrowRight',
    'Enter',
    'ArrowRight',
    'Enter',
    'ArrowDown',
    'Enter',
    'ArrowLeft',
    'Enter',
    'ArrowLeft',
    'Enter',
  ])
    if (!(await page.getByText(/Figure construite/).isVisible())) await page.keyboard.press(touche);
  await expect(page.getByText(/Figure construite/)).toBeVisible();
  await page.keyboard.press('a');
  await expect(page.getByText(REPONDU).last()).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Tangram (plus loin) : une pièce mal placée est refusée gentiment', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/tangram?niveau=plus_loin');
  await expect(page.getByRole('button', { name: /Tourner/ })).toBeVisible();
  await page.keyboard.press('r');
  // Coin en haut à gauche du plateau : en dehors de la silhouette
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/ne rentre pas ici|Tourne ou retourne/)).toBeVisible();
  expect(erreurs).toEqual([]);
});
