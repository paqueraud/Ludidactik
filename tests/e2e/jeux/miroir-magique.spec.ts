/** Test de fumée : le Miroir magique dans le Labo (cases à colorier, vérification), aucune erreur console. */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_geometrie';

test('Miroir magique (facile) : le bon dessin fait s’envoler le papillon', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/miroir-magique?niveau=facile');
  await expect(page.getByRole('button', { name: /Vérifier/ })).toBeVisible();
  // Exemple du Labo : cases (1,1) (2,1) (2,2) (3,3), axe vertical sur 8 colonnes
  for (const c of ['6,1', '5,1', '5,2', '4,3'])
    await page.locator(`[data-case="${c}"]`).click({ force: true });
  await page.getByRole('button', { name: /Vérifier/ }).click();
  await expect(page.getByText(/papillon s’envole/)).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Miroir magique (plus loin) : au clavier, une erreur affiche la correction', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/miroir-magique?niveau=plus_loin');
  await expect(page.getByRole('button', { name: /Vérifier/ })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.keyboard.press('v');
  await expect(page.getByText(/Presque/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Continuer' }).click();
  expect(erreurs).toEqual([]);
});
