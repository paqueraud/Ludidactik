/** Test de fumée : L'Appareil photo (n° 30). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs, toucheEcran } from './_orthographe';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Appareil photo (${niveau}) : photo, saisie fausse, correction et copie`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/appareil-photo?niveau=${niveau}`);
    await page.getByRole('button', { name: /Prendre la photo/ }).click();
    await expect(page.getByText('Photographie le mot dans ta tête…')).toBeVisible();
    // Le mot disparaît (2 à 5 s selon le niveau) : on peut écrire
    await expect(page.getByText('Écris le mot.')).toBeVisible({ timeout: 8000 });
    await page.keyboard.type('zz');
    await toucheEcran(page, 'é');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Presque/).first()).toBeVisible();
    await expect(page.getByText('Recopie-le en le regardant bien :')).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
