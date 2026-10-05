/** Test de fumée : Le Feu tricolore de la ponctuation (n° 43). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Feu tricolore (${niveau}) : allumer un feu`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/feu-ponctuation?niveau=${niveau}`);
    await page.getByRole('button', { name: /Point d’interrogation/ }).click();
    await expect(page.getByText(/Feu vert|Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
