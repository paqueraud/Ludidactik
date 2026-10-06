/** Test de fumée : La Machine à remonter le temps (n° 50). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_monde';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Machine à remonter le temps (${niveau}) : poser les cartes et lancer la machine`, async ({
    page,
  }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/machine-temps?niveau=${niveau}`);
    await expect(page.getByRole('button', { name: /^Carte 1 :/ })).toBeVisible();
    // Au clavier : la carte n° 1 de la réserve, plusieurs fois, remplit toutes les cases
    for (let i = 0; i < 10; i++) {
      if (!(await page.getByRole('button', { name: /^Carte 1 :/ }).count())) break;
      await page.keyboard.press('1');
    }
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Bravo|Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Machine à remonter le temps : au toucher, une case pleine se vide', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/machine-temps?niveau=normal');
  await page.getByRole('button', { name: /^Carte 1 :/ }).click();
  const case1 = page.getByRole('button', { name: /^Case 1 :/ });
  await expect(case1).not.toHaveAccessibleName('Case 1 : vide');
  await case1.click();
  await expect(case1).toHaveAccessibleName('Case 1 : vide');
  expect(erreurs).toEqual([]);
});
