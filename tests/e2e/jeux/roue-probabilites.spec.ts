/** Test de fumée : la Roue des probabilités dans le Labo. Premier exemple : le dé à 6 faces. */
import { expect, test } from '@playwright/test';
import { REPONDU, surveillerErreurs } from './_geometrie';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Roue des probabilités (${niveau}) : ranger les évènements du dé`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/roue-probabilites?niveau=${niveau}`);
    await expect(page.getByText(/On lance un dé à 6 faces/)).toBeVisible();
    await page.getByRole('button', { name: '🎲 Tester' }).click();
    const ranger = async (evenement: string, case_: RegExp) => {
      await page.getByRole('button', { name: evenement, exact: true }).click();
      await page.getByRole('button', { name: case_ }).click();
    };
    await ranger('Obtenir 1 ou 2', /^Ranger dans « possible mais pas certain »/);
    await ranger('Obtenir un nombre de 1 à 6', /^Ranger dans « certain »/);
    await ranger('Obtenir un nombre plus petit que 7', /^Ranger dans « certain »/);
    await ranger('Obtenir 0', /^Ranger dans « impossible »/);
    // Facile vérifie tout seul quand tout est rangé ; sinon, bouton Vérifier
    const verifier = page.getByRole('button', { name: 'Vérifier' });
    if (await verifier.isVisible()) await verifier.click();
    await expect(
      page
        .getByText(REPONDU)
        .or(page.getByText(/ 2 \/ \d+$/))
        .first(),
    ).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
