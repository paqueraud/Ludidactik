/** Test de fumée : Le Karaoké de lecture (n° 44), mode métronome (repli sans micro) et auto-évaluation. */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'normal']) {
  test(`Karaoké (${niveau}) : lecture au métronome puis résultat`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/karaoke-lecture?niveau=${niveau}`);
    await page.getByRole('button', { name: /Lire avec le métronome/ }).click();
    await expect(page.getByRole('button', { name: /J’ai fini/ })).toBeVisible();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /J’ai fini/ }).click();
    await page.getByRole('button', { name: /Non, je me suis arrêté/ }).click();
    await page.getByRole('button', { name: /C’est ce mot-là/ }).click();
    await page.getByRole('button', { name: /Aucun mot raté/ }).click();
    await expect(page.getByText(/mots lus par minute/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Terminer' }).click();
    await expect(page.getByTestId('labo-fin')).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
