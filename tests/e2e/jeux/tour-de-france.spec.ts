/** Test de fumée : Le Tour de France (n° 51). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_monde';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Tour de France (${niveau}) : toucher une zone de la carte`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/tour-de-france?niveau=${niveau}`);
    const zone = page.locator('[data-zone]').first();
    await expect(zone).toBeVisible();
    await zone.click({ force: true });
    await expect(page.getByText(/Bravo|Tu as touché|Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Tour de France : au clavier (Tab, flèches, Entrée)', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/tour-de-france?niveau=normal');
  await expect(page.locator('[data-zone]').first()).toBeVisible();
  await page.locator('[data-zone]').first().focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Bravo|Tu as touché|Presque/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
