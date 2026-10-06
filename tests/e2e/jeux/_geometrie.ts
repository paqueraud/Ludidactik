/** Aide commune aux tests de fumée des jeux de géométrie, mesures et données (n° 21 à 28). */
import type { Page } from '@playwright/test';

export function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  page.on('pageerror', (e) => erreurs.push(String(e)));
  return erreurs;
}

export const REPONDU = /Bravo|Super|Génial|Exactement|Bien joué|Parfait|Presque/;
