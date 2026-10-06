/**
 * Test de fumée : le Robot codeur dans le Labo. Les exemples partagés du Labo n'ont pas encore d'item
 * `meta.robot` (exemples prêts dans src/games/_geometrie-commun/fixtures.ts) : état propre attendu.
 */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_geometrie';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Robot codeur (${niveau}) : état propre sans item adapté, aucune erreur`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/robot-codeur?niveau=${niveau}`);
    await expect(page.getByText(/n’a pas de robot/)).toBeVisible();
    await page.getByRole('button', { name: 'Terminer' }).click();
    await expect(page.getByTestId('labo-fin')).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
