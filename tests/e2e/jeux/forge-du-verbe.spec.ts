/** Test de fumée : La Forge du verbe (n° 39). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['normal', 'plus_loin']) {
  test(`Forge du verbe (${niveau}) : une forme fausse affiche la correction`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/forge-du-verbe?niveau=${niveau}`);
    await expect(page.getByText('Sujet', { exact: true })).toBeVisible();
    await page.waitForTimeout(1800); // les rouleaux s'arrêtent
    await page.keyboard.type('zz');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Forge du verbe (facile) : forger une forme', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/forge-du-verbe?niveau=facile');
  await expect(page.getByText('Sujet', { exact: true })).toBeVisible();
  await page.waitForTimeout(1800);
  // choix (touche A) ou clavier (lettre a puis Entrée) selon l'item
  await page.keyboard.press('a');
  if (await page.getByRole('group', { name: 'Clavier' }).isVisible()) await page.keyboard.press('Enter');
  await expect(page.getByText(/Forgé|Presque/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
