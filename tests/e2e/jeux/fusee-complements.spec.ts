/** Test de fumée : Fusée des compléments dans le Labo (deux niveaux), une manche jouée, aucune erreur console. */
import { type Page, expect, test } from '@playwright/test';

function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  page.on('pageerror', (e) => erreurs.push(String(e)));
  return erreurs;
}

for (const niveau of ['facile', 'plus_loin']) {
  test(`Fusée des compléments (${niveau}) : une manche se joue sans erreur`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/fusee-complements?niveau=${niveau}`);
    await expect(page.getByLabel(/Ta réponse/)).toBeVisible();
    await page.keyboard.type('9999');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Presque/)).toBeVisible();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByLabel(/Ta réponse : vide/)).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
