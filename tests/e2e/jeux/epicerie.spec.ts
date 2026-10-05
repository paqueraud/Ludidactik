/** Test de fumée : La Petite Épicerie (n° 11). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Épicerie (${niveau}) : poser une pièce, la reprendre, valider`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/epicerie?niveau=${niveau}`);
    const caisse = page.getByRole('group', { name: 'Caisse' });
    await caisse.getByRole('button', { name: 'Ajouter 2 €' }).click();
    await caisse.getByRole('button', { name: 'Ajouter 50 c' }).click();
    // toucher une pièce du comptoir la reprend
    await page.getByRole('button', { name: 'Reprendre 50 c' }).click();
    await expect(page.getByRole('button', { name: 'Reprendre 50 c' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Valider' }).click();
    // 2 € ne fait ni 3,50 € ni 1,80 € : correction bienveillante
    await expect(page.getByText(/Presque/).first()).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Client 2 \//)).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
