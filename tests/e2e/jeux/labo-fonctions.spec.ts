/** Test de fumée : Le Labo des fonctions (n° 41). Les exemples partagés n'ont pas encore de phrase à analyser. */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Labo des fonctions (${niveau}) : état propre sans phrase à analyser`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/labo-fonctions?niveau=${niveau}`);
    await expect(page.getByText(/Pas d’exercice adapté/)).toBeVisible();
    await page.getByRole('button', { name: 'Terminer' }).click();
    await expect(page.getByTestId('labo-fin')).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
