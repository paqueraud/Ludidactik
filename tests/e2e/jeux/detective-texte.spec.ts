/** Test de fumée : Le Détective du texte (n° 46). Premier exemple du Labo : « Le visiteur du soir ». */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const [niveau, choix, attendu] of [
  ['facile', 'des limaces', /Bravo|Super|Génial|Exactement|Bien joué|Parfait|preuve|Question 2/],
  ['normal', 'des pommes', /Presque/],
] as const) {
  test(`Détective du texte (${niveau}) : répondre à une question sur le texte`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/detective-texte?niveau=${niveau}`);
    await expect(page.getByRole('heading', { name: 'Le visiteur du soir' })).toBeVisible();
    await expect(page.getByText('Que cherche le hérisson dans le jardin ?')).toBeVisible();
    await page.getByRole('button', { name: choix, exact: true }).click();
    await expect(page.getByText(attendu).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
