/** Test de fumée : Attrape-Bulles dans le Labo (deux niveaux), une manche jouée, aucune erreur console. */
import { type Page, expect, test } from '@playwright/test';

function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  page.on('pageerror', (e) => erreurs.push(String(e)));
  return erreurs;
}

for (const niveau of ['facile', 'normal']) {
  test(`Attrape-Bulles (${niveau}) : une manche se joue sans erreur`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/attrape-bulles?niveau=${niveau}`);
    await expect(page.getByRole('button', { name: /^Bulle A/ })).toBeAttached();
    await page.keyboard.press('a');
    await expect(page.getByText(/\+10|Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
