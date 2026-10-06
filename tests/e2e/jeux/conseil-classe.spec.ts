/** Test de fumée : Le Conseil de la classe (n° 54). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_monde';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Conseil de la classe (${niveau}) : choisir une réponse puis discuter`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/conseil-classe?niveau=${niveau}`);
    await expect(page.getByRole('button', { name: 'Écouter la situation' })).toBeVisible();
    await page.keyboard.press('a');
    await expect(page.getByText(/Bravo|Presque/).first()).toBeVisible();
    // la discussion « Pourquoi ? » s'ouvre (tout de suite en Facile ou après une erreur)
    const pourquoi = page.getByRole('button', { name: 'Pourquoi ?' });
    if (await pourquoi.count()) await pourquoi.click();
    await expect(page.getByText('Pourquoi ?', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByText(/Situation 2/)).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Conseil de la classe : vrai ou faux au clavier', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/conseil-classe?niveau=normal&type=true_false');
  await expect(page.getByRole('button', { name: /C’est vrai/ })).toBeVisible();
  await page.keyboard.press('v');
  await expect(page.getByText(/Bravo|Presque/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
