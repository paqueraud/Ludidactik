/** Test de fumée : Les Lettres en vrac (n° 31). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Lettres en vrac (${niveau}) : on pose toutes les lettres`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/lettres-en-vrac?niveau=${niveau}`);
    const tas = page.getByRole('group', { name: 'Lettres en vrac' });
    await expect(tas.getByRole('button').first()).toBeVisible();
    await page.waitForTimeout(1800); // fin de la chute des lettres
    const fin = page.getByText(/est reconstruit|Presque/).first();
    // Facile : une mauvaise lettre rebondit, on essaie donc les tuiles une à une
    for (let i = 0; i < 120 && !(await fin.isVisible()); i++) {
      const tuiles = tas.getByRole('button');
      const n = await tuiles.count();
      if (!n) break;
      await tuiles.nth(i % n).click();
      await page.waitForTimeout(niveau === 'facile' ? 480 : 120);
    }
    await expect(fin).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
