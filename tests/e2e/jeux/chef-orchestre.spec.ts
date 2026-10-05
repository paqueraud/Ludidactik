/** Test de fumée : Le Chef d'orchestre des classes de mots (n° 40). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Chef d’orchestre (${niveau}) : ranger une note`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/chef-orchestre?niveau=${niveau}`);
    await page.getByRole('button', { name: /Pupitre 1/ }).click();
    await expect(page.getByText(/Presque|Essaie un autre pupitre|✅ 1/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
