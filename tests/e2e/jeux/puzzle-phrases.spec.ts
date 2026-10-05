/** Test de fumée : Le Puzzle de phrases (n° 42). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Puzzle de phrases (${niveau}) : poser toutes les étiquettes et vérifier`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/puzzle-phrases?niveau=${niveau}`);
    await expect(page.getByRole('group', { name: 'Étiquettes à placer' })).toBeVisible();
    for (let i = 0; i < 10; i++) await page.keyboard.press('1');
    await page.keyboard.press('.');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Presque|Une pièce de plus/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
