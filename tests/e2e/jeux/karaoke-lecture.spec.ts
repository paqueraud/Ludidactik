/** Test de fumée : Le Karaoké de lecture (n° 44), repli sans micro (lecture au chrono + auto-évaluation) et métronome. */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'normal']) {
  test(`Karaoké (${niveau}) : lecture au chrono puis résultat`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/karaoke-lecture?niveau=${niveau}`);
    await page.getByRole('button', { name: /Lire à mon rythme/ }).click();
    await expect(page.getByRole('button', { name: /J’ai fini/ })).toBeVisible();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /J’ai fini/ }).click();
    await page.getByRole('button', { name: /Non, pas jusqu’au bout/ }).click();
    await page.getByRole('button', { name: /C’est ce mot-là/ }).click();
    await page.getByRole('button', { name: /Aucun mot raté/ }).click();
    await expect(page.getByText(/mots lus par minute/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Terminer' }).click();
    await expect(page.getByTestId('labo-fin')).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Karaoké (plus loin) : entraînement au métronome', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/karaoke-lecture?niveau=plus_loin');
  await page.getByRole('button', { name: /métronome/ }).click();
  await expect(page.getByRole('button', { name: /J’ai fini/ })).toBeVisible();
  await page.getByRole('button', { name: /J’ai fini/ }).click();
  await expect(page.getByText(/Bel entraînement/)).toBeVisible();
  expect(erreurs).toEqual([]);
});
