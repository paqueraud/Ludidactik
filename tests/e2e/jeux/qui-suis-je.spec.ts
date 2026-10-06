/** Test de fumée : Qui suis-je ? (n° 52). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_monde';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Qui suis-je ? (${niveau}) : répondre au mystère`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/qui-suis-je?niveau=${niveau}`);
    await expect(page.getByText('Réponds quand tu veux !')).toBeVisible();
    await page.keyboard.press('a');
    await expect(page.getByText(/Bravo|Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Qui suis-je ? : demander un indice au toucher', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/qui-suis-je?niveau=normal');
  const indice = page.getByRole('button', { name: 'Indice suivant' });
  await expect(indice).toBeVisible();
  await indice.click();
  await expect(page.getByText('Indice caché')).toHaveCount(0);
  expect(erreurs).toEqual([]);
});
