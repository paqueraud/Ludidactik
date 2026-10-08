/**
 * Test de fumée : le Géomètre dans le Labo. Premier exemple : placer le milieu M de [AB] sur le
 * quadrillage (au clavier : flèches + Entrée, puis V), aucune erreur console.
 */
import { expect, test } from '@playwright/test';
import { REPONDU, surveillerErreurs } from './_geometrie';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Géomètre (${niveau}) : placer un point au clavier et valider`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/geometre?niveau=${niveau}`);
    await expect(page.getByText('Place le point M, milieu du segment [AB].')).toBeVisible();
    const valider = page.getByRole('button', { name: '✔ Valider le point M' });
    await expect(valider).toBeDisabled();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');
    await expect(valider).toBeEnabled();
    await valider.click();
    await expect(page.getByText(REPONDU).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
