/** Test de fumée : Le Dobble des mots (n° 47). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Dobble des mots (${niveau}) : choisir un mot sur chaque carte`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/dobble-mots?niveau=${niveau}`);
    await expect(page.getByRole('group', { name: 'Carte 1' })).toBeVisible();
    await page.keyboard.press('1');
    await page.keyboard.press('a');
    await expect(page.getByText(/Bien vu|Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
