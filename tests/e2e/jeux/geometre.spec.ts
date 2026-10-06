/** Test de fumée : le Géomètre dans le Labo (figure à nommer, instruments), aucune erreur console. */
import { expect, test } from '@playwright/test';
import { REPONDU, surveillerErreurs } from './_geometrie';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Géomètre (${niveau}) : nommer une figure avec les instruments`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/geometre?niveau=${niveau}`);
    await expect(page.getByText('Comment s’appelle cette figure ?')).toBeVisible();
    await page.getByRole('button', { name: /Équerre/ }).click();
    await expect(page.getByText(/Touche un sommet/)).toBeVisible();
    await page
      .getByRole('button', { name: /rectangle/ })
      .first()
      .click();
    await expect(page.getByText(REPONDU).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
