/** Test de fumée : Les Mots croisés automatiques (n° 34). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs, toucheEcran } from './_orthographe';

for (const niveau of ['facile', 'normal']) {
  test(`Mots croisés (${niveau}) : grille générée, saisie, solution`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/mots-croises?niveau=${niveau}`);
    await expect(page.getByRole('grid', { name: /Grille de mots croisés/ })).toBeVisible();
    await expect(page.getByText('Horizontalement →')).toBeVisible();
    // Choisir un indice puis écrire (lettre accentuée au clavier à l'écran)
    await page.getByRole('listitem').first().getByRole('button').click();
    await toucheEcran(page, 'é');
    await page.keyboard.type('zzzzzzzzzzzz');
    await page.getByRole('button', { name: 'Voir la solution' }).click();
    await expect(page.getByText('Voici la solution. Regarde bien les mots à revoir :')).toBeVisible();
    await page.getByRole('button', { name: /terminer/ }).click();
    await expect(page.getByTestId('labo-fin')).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Mots croisés (plus loin) : vérification de la grille', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/mots-croises?niveau=plus_loin');
  await page.getByRole('button', { name: 'Vérifier la grille' }).click();
  await expect(page.getByText('Il reste des mots à écrire.')).toBeVisible();
  expect(erreurs).toEqual([]);
});
