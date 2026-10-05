/** Test de fumée : Funambule dans le Labo (deux niveaux), une manche jouée, aucune erreur console. */
import { type Page, expect, test } from '@playwright/test';

function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  page.on('pageerror', (e) => erreurs.push(String(e)));
  return erreurs;
}

for (const niveau of ['facile', 'plus_loin']) {
  test(`Funambule (${niveau}) : une manche se joue sans erreur`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/funambule?niveau=${niveau}`);
    await expect(page.getByRole('button', { name: /Marche/ })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Pile sur|plouf/).first()).toBeVisible({ timeout: 10_000 });
    expect(erreurs).toEqual([]);
  });
}
