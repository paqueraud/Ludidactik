/** Test de fumée : Le Train des accords (n° 37). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['facile', 'normal']) {
  test(`Train des accords (${niveau}) : accrocher un wagon`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/train-accords?niveau=${niveau}`);
    await page.getByRole('button', { name: /Wagon 1/ }).click();
    await expect(page.getByText(/Tchou tchou|Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Train des accords (plus loin) : écrire le mot accordé', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/train-accords?niveau=plus_loin');
  await expect(page.getByText(/Écris le mot .*bien accordé :/)).toBeVisible();
  await page.keyboard.type('zz');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Presque/).first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Train 2 \//)).toBeVisible();
  expect(erreurs).toEqual([]);
});
