/** Test de fumée : Jacques a dit / Simon says (n° 55). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_monde';

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Jacques a dit (${niveau}) : toucher une image`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/jacques-a-dit?niveau=${niveau}`);
    await expect(page.getByRole('button', { name: 'Image 1' })).toBeVisible();
    await page.keyboard.press('1');
    await expect(page.getByText(/Yes!|Presque|Bien vu|Oups/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Jacques a dit : QCM d’anglais', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/jacques-a-dit?niveau=normal&type=mcq');
  await expect(page.getByRole('button', { name: 'Écouter les mots en anglais' })).toBeVisible();
  await page.keyboard.press('a');
  await expect(page.getByText(/Yes!|Presque/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Jacques a dit : parler sans micro (repli « Je l’ai dit ! »)', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/jacques-a-dit?niveau=normal&type=oral_answer');
  await page.getByRole('button', { name: 'Je l’ai dit !' }).click();
  await page.getByRole('button', { name: /Oui, pareil/ }).click();
  await expect(page.getByText(/Well done/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
