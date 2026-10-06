/** Aide commune aux tests de fumée des jeux n° 50 à 56. */
import type { Page } from '@playwright/test';

export function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  page.on('pageerror', (e) => erreurs.push(String(e)));
  return erreurs;
}
