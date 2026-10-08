/** Test de fumée : La Dictée-duel (n° 38). */
import { expect, test } from '@playwright/test';
import { surveillerErreurs } from './_orthographe';

for (const niveau of ['normal', 'plus_loin']) {
  test(`Dictée-duel (${niveau}) : deux joueurs, deux claviers`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/dictee-duel?niveau=${niveau}`);
    const j1 = page.getByRole('region', { name: 'Côté de Testeur' });
    const j2 = page.getByRole('region', { name: 'Côté rouge' });
    await expect(j1).toBeVisible();
    await expect(j2).toBeVisible();
    // Personne n'a le clavier physique au départ : taper ne fait qu'afficher un rappel
    await page.keyboard.type('a');
    await expect(page.getByText(/Qui écrit avec le clavier/)).toBeVisible();
    await expect(j1.getByLabel(/a écrit : rien/)).toBeVisible();
    await expect(j2.getByLabel(/a écrit : rien/)).toBeVisible();
    // Le joueur 2 prend le clavier puis le rend ; le joueur 1 le prend
    await j2.getByRole('button', { name: 'Je joue au clavier' }).click();
    await page.keyboard.type('b');
    await expect(j2.getByLabel(/a écrit : b/)).toBeVisible();
    await page.keyboard.press('Backspace');
    await j1.getByRole('button', { name: 'Je joue au clavier' }).click();
    await expect(j2.getByRole('button', { name: 'Je joue au clavier' })).toBeVisible();
    // Joueur 1 : clavier physique ; joueur 2 : son clavier à l'écran (avec une lettre accentuée)
    await page.keyboard.type('zz');
    await page.keyboard.press('Enter');
    await expect(j1.getByText(/Presque|Essais terminés/)).toBeVisible();
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
