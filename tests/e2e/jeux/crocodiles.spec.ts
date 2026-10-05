/** Test de fumée : Crocodiles gloutons dans le Labo (deux niveaux), une manche jouée, aucune erreur console. */
import { type Page, expect, test } from '@playwright/test';

function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  page.on('pageerror', (e) => erreurs.push(String(e)));
  return erreurs;
}

for (const niveau of ['facile', 'plus_loin']) {
  test(`Crocodiles gloutons (${niveau}) : une manche se joue sans erreur`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/crocodiles?niveau=${niveau}&type=numeric_answer`);
    await expect(page.getByRole('button', { name: 'égal' })).toBeVisible();
    await page.keyboard.press('=');
    await expect(
      page.getByText(/Bravo|Super|Génial|Exactement|Bien joué|Parfait|Presque/).first(),
    ).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Crocodiles : sans comparaison dans la leçon, message bienveillant', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/crocodiles?niveau=normal');
  await expect(page.getByText(/pas de comparaisons/)).toBeVisible();
  expect(erreurs).toEqual([]);
});
