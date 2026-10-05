/** Test de fumée : Perroquet des nombres dans le Labo (deux niveaux), une manche jouée, aucune erreur console. */
import { type Page, expect, test } from '@playwright/test';

function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  page.on('pageerror', (e) => erreurs.push(String(e)));
  return erreurs;
}

for (const niveau of ['facile', 'plus_loin']) {
  test(`Perroquet des nombres (${niveau}) : une manche se joue sans erreur`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/perroquet-nombres?niveau=${niveau}`);
    await expect(page.getByText('Écris le nombre que tu entends')).toBeVisible();
    await page.keyboard.type('9999');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Presque/)).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
