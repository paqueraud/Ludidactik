/**
 * Test de fumée : Le Détective des problèmes (n° 16). Premier item du Labo : problème de comparaison
 * (257 filles, 211 garçons : 257 − 211 = 46), avec reformulations.
 */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

test('Détective (facile) : comprendre puis passer au schéma', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/detective-problemes?niveau=facile');
  await expect(page.getByText('Dans l’école, il y a 257 filles et 211 garçons.')).toBeVisible();
  // 1. Comprendre : la bonne reformulation
  await page.getByRole('button', { name: /On compare les filles et les garçons/ }).click();
  // 2. Modéliser
  await expect(page.getByText(/Complète le schéma/)).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Détective (normal) : une mauvaise reformulation est corrigée', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/detective-problemes?niveau=normal');
  await page.getByRole('button', { name: 'On cherche combien il y a de garçons.' }).click();
  await expect(page.getByText(/La bonne façon de raconter l’histoire/)).toBeVisible();
  await page.getByRole('button', { name: 'Continuer l’enquête' }).click();
  await expect(page.getByText(/Complète le schéma/)).toBeVisible();
  expect(erreurs).toEqual([]);
});
