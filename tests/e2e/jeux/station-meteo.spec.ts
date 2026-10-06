/**
 * Test de fumée : la Station météo dans le Labo. Les exemples partagés du Labo n'ont pas encore d'item
 * `meta.graphique` (exemples prêts dans src/games/_geometrie-commun/fixtures.ts) : état propre attendu.
 */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_geometrie';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Station météo (${niveau}) : état propre sans item adapté, aucune erreur`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/station-meteo?niveau=${niveau}`);
    await expect(page.getByText(/n’a pas de données/)).toBeVisible();
    await page.getByRole('button', { name: 'Terminer' }).click();
    await expect(page.getByTestId('labo-fin')).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
