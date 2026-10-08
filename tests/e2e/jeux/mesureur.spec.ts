/** Test de fumée : le Mesureur dans le Labo. Premier exemple : mesurer le crayon (`meta.mesure`). */
import { expect, test } from '@playwright/test';
import { REPONDU, surveillerErreurs } from './_geometrie';

for (const niveau of ['facile', 'plus_loin']) {
  test(`Mesureur (${niveau}) : mesurer un objet avec la règle`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/mesureur?niveau=${niveau}`);
    await expect(page.getByText('Mesure le crayon avec la règle.')).toBeVisible();
    await page.getByRole('button', { name: 'Glisser la règle vers la gauche' }).click();
    const pave = page.getByRole('group', { name: 'Pavé numérique' });
    await pave.getByRole('button', { name: '1', exact: true }).click();
    await pave.getByRole('button', { name: '2', exact: true }).click();
    await pave.getByRole('button', { name: 'Valider' }).click();
    await expect(page.getByText(REPONDU).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
