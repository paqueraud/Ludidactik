/** Test de fumée : Memory des familles & affixes (n° 48). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Memory (${niveau}) : retourner deux cartes`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/memory-familles?niveau=${niveau}`);
    await expect(page.getByRole('grid', { name: /cartes du Memory/ })).toBeVisible();
    if (niveau === 'facile')
      await expect(page.getByText(/Regarde bien toutes les cartes/)).toBeHidden({ timeout: 6000 });
    await page.getByRole('button', { name: /^Carte 1, face cachée/ }).click();
    await page.getByRole('button', { name: /^Carte 2, face cachée/ }).click();
    await expect(page.getByText(/1 coup/)).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
