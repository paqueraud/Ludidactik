/** Test de fumée : La Dictée-duel (n° 38). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['normal', 'plus_loin']) {
  test(`Dictée-duel (${niveau}) : deux joueurs, deux claviers`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/dictee-duel?niveau=${niveau}`);
    const j1 = page.getByRole('region', { name: 'Côté de Testeur' });
    const j2 = page.getByRole('region', { name: 'Côté de Joueur 2' });
    await expect(j1).toBeVisible();
    await expect(j2).toBeVisible();
    // Joueur 1 : clavier physique ; joueur 2 : son clavier à l'écran (avec une lettre accentuée)
    await page.keyboard.type('zz');
    await page.keyboard.press('Enter');
    await expect(j1.getByText(/Presque|Plus d’essai/)).toBeVisible();
    for (const t of ['z', 'é', 'z']) await j2.getByRole('button', { name: t, exact: true }).click();
    await j2.getByRole('button', { name: 'Valider' }).click();
    if (niveau === 'plus_loin') {
      await expect(page.getByText('Presque ! Personne n’a trouvé ce mot.')).toBeVisible();
      await page.getByRole('button', { name: 'Mot suivant' }).click();
      await expect(page.getByText(/Mot 2 \//)).toBeVisible();
    } else {
      await expect(j2.getByText(/Presque/)).toBeVisible();
    }
    expect(erreurs).toEqual([]);
  });
}
