/** Test de fumée : la Station météo dans le Labo. Premier exemple : un diagramme en barres (`meta.graphique`). */
import { expect, test } from '@playwright/test';
import { REPONDU, surveillerErreurs } from './_geometrie';

for (const [niveau, reponse] of [
  ['facile', '5'],
  ['plus_loin', '3'],
] as const) {
  test(`Station météo (${niveau}) : lire un diagramme en barres`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/station-meteo?niveau=${niveau}`);
    await expect(page.getByRole('heading', { name: 'Les déchets ramassés dans la cour' })).toBeVisible();
    await expect(page.getByText('Combien de déchets pour « bouteilles » ?')).toBeVisible();
    const pave = page.getByRole('group', { name: 'Pavé numérique' });
    await pave.getByRole('button', { name: reponse, exact: true }).click();
    await pave.getByRole('button', { name: 'Valider' }).click();
    await expect(page.getByText(REPONDU).first()).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}
