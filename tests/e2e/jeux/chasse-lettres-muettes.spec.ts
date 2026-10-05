/** Test de fumée : La Chasse aux lettres muettes (n° 35). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'normal']) {
  test(`Chasse aux lettres muettes (${niveau}) : choisir une lettre`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/chasse-lettres-muettes?niveau=${niveau}`);
    await expect(page.getByText(/Mot 1 \//)).toBeVisible();
    // Selon l'item : choix (touche 1) ou saisie au clavier
    if (await page.getByRole('group', { name: 'Clavier' }).isVisible()) {
      await page.keyboard.type('zq');
      await page.keyboard.press('Enter');
    } else await page.keyboard.press('1');
    await expect(page.getByText(/Bravo|Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Chasse aux lettres muettes (plus loin) : écrire la lettre', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/chasse-lettres-muettes?niveau=plus_loin');
  await expect(page.getByRole('group', { name: 'Clavier' })).toBeVisible();
  await page.keyboard.type('zq');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Presque/).first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Mot 2 \//)).toBeVisible();
  expect(erreurs).toEqual([]);
});
