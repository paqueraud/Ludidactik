/**
 * Test de fumée : Le Grand Huit des opérations posées (n° 20). Premier exemple du Labo :
 * « 503 − 278 » par cassage (`meta.posee`). Les algorithmes (addition, soustraction par cassage,
 * multiplication, division) sont testés chiffre par chiffre dans src/games/_calcul-commun/calcul.test.ts.
 */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_calcul';

for (const niveau of ['facile', 'plus_loin'])
  test(`Grand Huit (${niveau}) : un chiffre faux est corrigé avec douceur`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/grand-huit-operations?niveau=${niveau}`);
    await expect(page.getByText('503 − 278')).toBeVisible();
    // 13 − 8 = 5 : on tape 9, ce n'est pas le bon chiffre des unités
    await page
      .getByRole('group', { name: 'Chiffres' })
      .getByRole('button', { name: '9', exact: true })
      .click();
    await expect(page.getByText(/Presque/).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
