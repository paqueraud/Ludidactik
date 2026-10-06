/**
 * Test de fumée : la Roue des probabilités dans le Labo. Les exemples partagés du Labo n'ont pas encore
 * d'évènements à classer (exemples prêts dans src/games/_geometrie-commun/fixtures.ts) : état propre.
 */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_geometrie';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Roue des probabilités (${niveau}) : état propre sans item adapté, aucune erreur`, async ({
    page,
  }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/roue-probabilites?niveau=${niveau}`);
    await expect(page.getByText(/n’a pas d’expérience/)).toBeVisible();
    await page.getByRole('button', { name: 'Terminer' }).click();
    await expect(page.getByTestId('labo-fin')).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
