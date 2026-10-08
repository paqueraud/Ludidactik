/**
 * Test de fumée : L'Ascenseur de la virgule (n° 15). Premier exemple du Labo : « 3,45 × 100 »
 * (`meta.glisse`). Les algorithmes sont couverts par src/games/_calcul-commun/calcul.test.ts.
 */
import { type Page, expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

async function ecrire(page: Page, chiffres: string) {
  const pave = page.getByRole('group', { name: 'Pavé numérique' });
  for (const c of chiffres) await pave.getByRole('button', { name: c, exact: true }).click();
  await pave.getByRole('button', { name: 'Valider' }).click();
}

test('Ascenseur de la virgule (normal) : monter de 2 étages puis lire 345', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/ascenseur-virgule?niveau=normal');
  await expect(page.getByText('3,45 × 100')).toBeVisible();
  await page.getByRole('button', { name: 'Monter' }).click();
  await page.getByRole('button', { name: 'Monter' }).click();
  await page.getByRole('button', { name: 'L’ascenseur est arrivé !' }).click();
  await expect(page.getByText('Lis le nombre dans l’immeuble et écris-le.')).toBeVisible();
  await ecrire(page, '345');
  await expect(page.getByText(/Voyage 2 \//)).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Ascenseur de la virgule (plus loin) : une erreur montre la règle', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/ascenseur-virgule?niveau=plus_loin');
  await expect(page.getByText('3,45 × 100')).toBeVisible();
  await expect(page.getByText('Écris le résultat.')).toBeVisible();
  await ecrire(page, '34');
  await expect(page.getByText(/Presque/).first()).toBeVisible();
  expect(erreurs).toEqual([]);
});
