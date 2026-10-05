/** Test de fumée : Bâtisseur dans le Labo (deux niveaux), une manche jouée, aucune erreur console. */
import { type Page, expect, test } from '@playwright/test';

function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  page.on('pageerror', (e) => erreurs.push(String(e)));
  return erreurs;
}

for (const niveau of ['facile', 'plus_loin']) {
  test(`Bâtisseur (${niveau}) : une manche se joue sans erreur`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/batisseur?niveau=${niveau}`);
    await expect(page.getByText(/Construis/)).toBeVisible();
    await page.getByRole('button', { name: /^Ajouter 1 unité/ }).click();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Presque/)).toBeVisible();
    await expect(page.getByText(/Ta construction valait/)).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
