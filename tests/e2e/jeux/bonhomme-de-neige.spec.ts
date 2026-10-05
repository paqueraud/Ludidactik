/** Test de fumée : Le Bonhomme de neige qui fond (n° 32). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['normal', 'plus_loin']) {
  test(`Bonhomme de neige (${niveau}) : deviner jusqu'au bout`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/bonhomme-de-neige?niveau=${niveau}`);
    await expect(page.getByRole('group', { name: 'Clavier' })).toBeVisible();
    // Les lettres rares d'abord : le bonhomme fond (sans jamais « mourir »)
    for (const l of 'zwxkqjyvbfgh') {
      if (
        await page
          .getByText(/Il reviendra|est sauvé/)
          .first()
          .isVisible()
      )
        break;
      await page.keyboard.press(l);
    }
    await expect(page.getByText(/Il reviendra avec la prochaine neige|est sauvé/).first()).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Mot 2 \//)).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Bonhomme de neige (facile) : le clavier à l’écran révèle les lettres', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/bonhomme-de-neige?niveau=facile');
  const clavier = page.getByRole('group', { name: 'Clavier' });
  for (const l of 'eaoiuls') {
    const touche = clavier.getByRole('button', { name: new RegExp(`^${l}`) }).first();
    if (await touche.isEnabled()) await touche.click();
    if (
      await page
        .getByText(/est sauvé|Il reviendra/)
        .first()
        .isVisible()
    )
      break;
  }
  await expect(page.getByLabel(/Mot à deviner/)).toBeVisible();
  expect(erreurs).toEqual([]);
});
