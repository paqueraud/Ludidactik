/**
 * Test de fumée : le Robot codeur dans le Labo. Premier exemple (CE1, `meta.robot`) : le robot part
 * de la colonne 2, ligne 3, le trésor est colonne 4, ligne 2 → → → ↑.
 */
import { expect, test } from '@playwright/test';
import { REPONDU, surveillerErreurs } from './_geometrie';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Robot codeur (${niveau}) : programmer et lancer le robot`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/robot-codeur?niveau=${niveau}`);
    await expect(page.getByRole('img', { name: /Le robot part de la colonne 2, ligne 3/ })).toBeVisible();
    const instr = page.getByRole('group', { name: 'Instructions' });
    await instr.getByRole('button', { name: /^Droite/ }).click();
    await instr.getByRole('button', { name: /^Droite/ }).click();
    await instr.getByRole('button', { name: /^Haut/ }).click();
    await expect(page.getByLabel(/^Programme : /)).toHaveAttribute('aria-label', /→.*→.*↑/);
    await page.getByRole('button', { name: '▶ Lancer' }).click();
    // message de réussite, ou déjà la manche suivante (bonne réponse comptée)
    await expect(
      page
        .getByText(REPONDU)
        .or(page.getByText(/ 2 \/ \d+$/))
        .filter({ visible: true })
        .first(),
    ).toBeVisible({ timeout: 15_000 });
    expect(erreurs).toEqual([]);
  });
}
