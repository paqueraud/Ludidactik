/** Test de fumée : Le Laboratoire des sciences (n° 53). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_monde';

for (const niveau of ['normal', 'plus_loin']) {
  test(`Laboratoire (${niveau}) : ranger tous les spécimens au clavier`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/laboratoire?niveau=${niveau}`);
    await expect(page.getByRole('button', { name: /^Bocal A/ })).toBeVisible();
    for (let i = 0; i < 16; i++) {
      if (!(await page.getByRole('button', { name: /^Spécimen 1 :/ }).count())) break;
      await page.keyboard.press('a');
    }
    if (niveau === 'plus_loin') await page.keyboard.press('Enter');
    await expect(page.getByText(/Expérience réussie|Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Laboratoire (facile) : toucher un spécimen puis un bocal', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/laboratoire?niveau=facile');
  await page.getByRole('button', { name: /^Spécimen 2 :/ }).click();
  await page.getByRole('button', { name: /^Bocal B/ }).click();
  await expect(page.getByRole('button', { name: /^Bocal A/ })).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Laboratoire : remettre les étapes d’un cycle dans l’ordre', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/laboratoire?niveau=normal&type=ordering');
  await expect(page.getByRole('button', { name: /^Carte 1 :/ })).toBeVisible();
  for (let i = 0; i < 10; i++) {
    if (!(await page.getByRole('button', { name: /^Carte 1 :/ }).count())) break;
    await page.keyboard.press('1');
  }
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Expérience réussie|Presque/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
