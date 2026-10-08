/** Test de fumée : l'Usine à patrons dans le Labo (solide qu'on fait tourner), aucune erreur console. */
import { expect, test } from '@playwright/test';
import { REPONDU, surveillerErreurs } from './_geometrie';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Usine à patrons (${niveau}) : faire tourner le solide et répondre`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/usine-patrons?niveau=${niveau}`);
    await expect(page.getByText('Combien cette pyramide à base carrée a-t-elle de sommets ?')).toBeVisible();
    await page.getByRole('button', { name: 'Tourner vers la droite' }).click();
    await page.keyboard.press('ArrowLeft');
    await page.getByRole('button', { name: '5', exact: true }).click();
    await expect(page.getByText(REPONDU).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
