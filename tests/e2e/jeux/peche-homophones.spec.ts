/** Test de fumée : La Pêche aux homophones (n° 36). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Pêche aux homophones (${niveau}) : pêcher un poisson`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/peche-homophones?niveau=${niveau}`);
    await expect(page.getByRole('button', { name: /Poisson 1/ })).toBeVisible();
    await page.keyboard.press('2');
    await expect(page.getByText(/Belle prise|Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Pêche aux homophones : toucher un poisson', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/peche-homophones?niveau=facile');
  await page.getByRole('button', { name: /Poisson 1/ }).click({ force: true });
  await expect(page.getByText(/Belle prise|Presque/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
