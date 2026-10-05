/**
 * Chaque jeu, branché sur le VRAI contenu d'une leçon (Labo ?source=contenu), s'affiche sans erreur.
 * Garantit que les formats produits par les modules de contenu sont bien compris par les jeux.
 */
import { expect, test } from '@playwright/test';

test('tous les jeux s’ouvrent avec le contenu réel, sans erreur console', async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto('/labo');
  const hrefs = await page
    .locator('a[href^="/labo/"]')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  expect(hrefs.length).toBeGreaterThan(10);
  const problemes: string[] = [];
  for (const href of hrefs) {
    const erreurs: string[] = [];
    const onConsole = (m: import('@playwright/test').ConsoleMessage) =>
      m.type() === 'error' && erreurs.push(m.text());
    const onError = (e: Error) => erreurs.push(String(e));
    page.on('console', onConsole);
    page.on('pageerror', onError);
    await page.goto(`${href}?source=contenu&niveau=normal`);
    await expect(page.getByTestId('labo')).toBeVisible();
    await page.waitForTimeout(1200);
    page.off('console', onConsole);
    page.off('pageerror', onError);
    if (erreurs.length) problemes.push(`${href} : ${erreurs.join(' | ')}`);
  }
  expect(problemes, problemes.join('\n')).toEqual([]);
});
