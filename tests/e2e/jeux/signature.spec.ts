/** Tests de fumée des jeux signature dans le Labo (modèle pour les tests des autres jeux). */
import { type Page, expect, test } from '@playwright/test';

function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  page.on('pageerror', (e) => erreurs.push(String(e)));
  return erreurs;
}

test('Labo : la liste des jeux s’affiche', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo');
  await expect(page.getByRole('link', { name: /Le Grand Prix/ })).toBeVisible();
  expect(erreurs).toEqual([]);
});

for (const niveau of ['facile', 'normal', 'plus_loin']) {
  test(`Grand Prix (${niveau}) : une réponse fausse affiche la correction`, async ({ page }) => {
    const erreurs = surveillerErreurs(page);
    await page.goto(`/labo/grand-prix?niveau=${niveau}`);
    await expect(page.getByLabel(/Ta réponse/)).toBeVisible();
    await page.keyboard.type('9999');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Presque/)).toBeVisible();
    expect(erreurs).toEqual([]);
  });
}

test('Ascension : saisie au clavier', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/ascension?niveau=normal');
  await expect(page.getByText(/Écris le mot/)).toBeVisible();
  await page.keyboard.type('zzz');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Recopie-le/)).toBeVisible();
  expect(erreurs).toEqual([]);
});

test('Guillotine : répondre fait avancer', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto('/labo/guillotine?niveau=normal');
  await expect(page.getByRole('button', { name: 'Écouter la question' })).toBeVisible();
  await page.keyboard.press('a');
  await expect(page.getByText(/Bravo|Presque/)).toBeVisible();
  expect(erreurs).toEqual([]);
});
