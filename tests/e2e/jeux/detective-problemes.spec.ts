/**
 * Test de fumée : Le Détective des problèmes (n° 16). Premier item du Labo : les billes de Lina
 * (28 + 15 = 43), avec reformulations.
 */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

test('Détective (facile) : une enquête complète en 4 phases', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/detective-problemes?niveau=facile');
  // 1. Comprendre
  await page.getByRole('button', { name: /Lina avait des billes et elle en a eu plus/ }).click();
  // 2. Modéliser : poser le « ? » sur l'accolade du total
  await page.getByRole('button', { name: 'Bloc point d’interrogation' }).click();
  await page.getByRole('button', { name: 'Case vide : pose un bloc ici' }).click();
  // 3. Calculer
  await expect(page.getByText('28 + 15 = ?')).toBeVisible();
  await page.keyboard.type('43');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Continuer l’enquête' }).click();
  // 4. Répondre
  await page.getByRole('button', { name: /43/ }).click();
  await expect(page.getByText(/Enquête résolue/)).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Détective (normal) : une mauvaise reformulation est corrigée', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/detective-problemes?niveau=normal');
  await page.getByRole('button', { name: /Lina a perdu des billes/ }).click();
  await expect(page.getByText(/La bonne façon de raconter l’histoire/)).toBeVisible();
  await page.getByRole('button', { name: 'Continuer l’enquête' }).click();
  await expect(page.getByText(/Complète le schéma/)).toBeVisible();
  expect(erreurs).toEqual([]);
});
