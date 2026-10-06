/** Test de fumée : Le Vrai ou Faux express (n° 56). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_monde';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Vrai ou Faux express (${niveau}) : répondre aux flèches`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/vrai-faux?niveau=${niveau}`);
    await expect(page.getByRole('button', { name: 'Écouter l’affirmation' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText(/Bravo|Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Vrai ou Faux express : glisser la carte', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/vrai-faux?niveau=facile');
  const carte = page.getByRole('button', { name: 'Écouter l’affirmation' });
  await expect(carte).toBeVisible();
  const boite = (await carte.boundingBox())!;
  const x = boite.x + boite.width / 2;
  const y = boite.y - 40;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(x - i * 22, y, { steps: 2 });
  await page.mouse.up();
  await expect(page.getByText(/Bravo|Presque/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Vrai ou Faux express : boutons', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/vrai-faux?niveau=normal');
  await page.getByRole('button', { name: /Faux/ }).click();
  await expect(page.getByText(/Bravo|Presque/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
