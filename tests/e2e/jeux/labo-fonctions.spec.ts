/** Test de fumée : Le Labo des fonctions (n° 41). Les exemples du Labo ont une phrase (`meta.phrase`). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Labo des fonctions (${niveau}) : verser une fiole`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/labo-fonctions?niveau=${niveau}`);
    await expect(page.getByRole('region', { name: 'La phrase à analyser' })).toBeVisible();
    await page.getByRole('button', { name: /^Fiole 1 :/ }).click();
    // bonne fiole, ou « Presque ! » (nouvel essai ou correction)
    await expect(page.getByText(/Bonne fiole|Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
