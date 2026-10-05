/** Test de fumée : Les Diviseurs mystères (n° 19). Item du Labo : divisible par 5 (35, 42, 100, 73). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

for (const niveau of ['facile', 'normal']) {
  test(`Diviseurs (${niveau}) : ranger tous les œufs`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/diviseurs-mysteres?niveau=${niveau}`);
    const rangement: [string, string][] = [
      ['35', '1'],
      ['42', '2'],
      ['100', '1'],
      ['73', '2'],
    ];
    for (const [oeuf, panier] of rangement) {
      await page.getByRole('button', { name: `Œuf ${oeuf}`, exact: true }).click();
      await page.keyboard.press(panier);
    }
    await expect(page.getByText(/Tous les œufs sont dans le bon panier/)).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Diviseurs (plus loin) : un œuf mal rangé est corrigé', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/diviseurs-mysteres?niveau=plus_loin');
  await page.getByRole('button', { name: 'Œuf 42', exact: true }).click();
  await page.getByRole('button', { name: /^Panier 1 : divisible par 5/ }).click();
  await expect(page.getByText(/Presque ! 42 va dans « non divisible par 5 »/)).toBeVisible();
  expect(erreurs).toEqual([]);
});
