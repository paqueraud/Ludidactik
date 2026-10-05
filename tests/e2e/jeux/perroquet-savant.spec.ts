/** Test de fumée : Le Perroquet savant (n° 45), repli sans micro (« Je l'ai dit ! » + auto-évaluation). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Perroquet savant (${niveau}) : lire puis s’auto-évaluer`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/perroquet-savant?niveau=${niveau}`);
    await page.getByRole('button', { name: /Je l’ai dit/ }).click();
    await page.getByRole('button', { name: /J’ai bien lu/ }).click();
    await expect(page.getByText(/Une plume de plus/)).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
