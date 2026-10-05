/** Test de fumée : Le Détective du texte (n° 46). Les exemples partagés n'ont pas encore de texte (meta.texte). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'normal']) {
  test(`Détective du texte (${niveau}) : état propre sans texte`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/detective-texte?niveau=${niveau}`);
    await expect(page.getByText(/Pas d’exercice adapté/)).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
