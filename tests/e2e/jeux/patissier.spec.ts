/**
 * Test de fumée : Le Pâtissier proportionnel (n° 17). Premier exemple du Labo : 5 gâteaux → 400 g de
 * sucre, combien pour 1 gâteau ? (`meta.tableau`, réponse 80). Logique couverte par
 * src/games/_calcul-commun/calcul.test.ts.
 */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

for (const [niveau, saisie, attendu] of [
  ['facile', ['8', '0'], /Recette 2 \//],
  ['normal', ['9'], /Presque/],
] as const)
  test(`Pâtissier (${niveau}) : une recette jouée`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/patissier?niveau=${niveau}`);
    await expect(page.getByRole('table', { name: 'Tableau de la recette' })).toBeVisible();
    const pave = page.getByRole('group', { name: 'Pavé numérique' });
    for (const c of saisie) await pave.getByRole('button', { name: c, exact: true }).click();
    await pave.getByRole('button', { name: 'Valider' }).click();
    await expect(page.getByText(attendu).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
