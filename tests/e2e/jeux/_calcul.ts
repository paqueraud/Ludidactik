/** Aide commune aux tests de fumée des jeux de calcul (n° 11 à 20). */
import { type Page, expect } from '@playwright/test';

export function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  page.on('pageerror', (e) => erreurs.push(String(e)));
  return erreurs;
}

/**
 * Jeux qui ont besoin d'un `meta` particulier (glisse, posee, tableau, programme…) : les items
 * d'exemple du Labo n'en ont pas, le jeu doit afficher un état calme, sans erreur.
 */
export async function verifierEtatVide(page: Page, jeu: string, niveau: string) {
  const erreurs = surveillerErreurs(page);
  await page.goto(`/labo/${jeu}?niveau=${niveau}`);
  await expect(page.getByText('Pas d’exercice adapté pour l’instant')).toBeVisible();
  expect(erreurs).toEqual([]);
}
