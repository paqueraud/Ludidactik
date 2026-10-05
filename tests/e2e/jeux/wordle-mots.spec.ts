/** Test de fumée : Le Wordle des mots de la semaine (n° 33). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs, toucheEcran } from './_orthographe';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Wordle (${niveau}) : longueur contrôlée puis 6 essais`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/wordle-mots?niveau=${niveau}`);
    const titre = page.getByText(/Un mot de \d+ lettres/);
    await expect(titre).toBeVisible();
    const n = Number((await titre.textContent())!.match(/\d+/)![0]);
    // Trop court : message bienveillant
    await page.keyboard.type('zz');
    await page.keyboard.press('Enter');
    await expect(page.getByText(`Il faut un mot de ${n} lettres !`)).toBeVisible();
    for (let i = 0; i < 2; i++) await page.keyboard.press('Backspace');
    const aTaper = niveau === 'facile' ? n - 1 : n;
    for (let essai = 0; essai < 6; essai++) {
      // une lettre accentuée au clavier à l'écran, le reste au clavier physique
      await toucheEcran(page, /^é(,|$)/);
      await page.keyboard.type('z'.repeat(aTaper - 1));
      await page.keyboard.press('Enter');
    }
    await expect(page.getByText('Presque ! Les 6 essais sont passés.')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Mot 2 \//)).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
