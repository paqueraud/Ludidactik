/** Aide commune aux tests de fumée des jeux d'orthographe (n° 30 à 38). */
import type { Page } from '@playwright/test';

export function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  page.on('pageerror', (e) => erreurs.push(String(e)));
  return erreurs;
}

/** Clique une touche du clavier à l'écran (utile pour les lettres accentuées). */
export async function toucheEcran(page: Page, touche: string | RegExp, groupe = 'Clavier') {
  await page
    .getByRole('group', { name: groupe })
    .first()
    .getByRole('button', typeof touche === 'string' ? { name: touche, exact: true } : { name: touche })
    .first()
    .click();
}
