import { expect, test } from '@playwright/test';

/**
 * Hors ligne (PWA) : après un premier chargement (service worker installé, contenu en precache),
 * on coupe le réseau : l'application se recharge, on navigue dans les leçons et on joue une partie.
 */
test('après une première visite, l’application fonctionne sans réseau', async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  // service worker installé (precache terminé) ; au rechargement suivant, il contrôle la page
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  // profil créé en ligne
  await page.getByRole('button', { name: 'Jouer' }).click();
  await page.getByRole('button', { name: 'Nouveau profil' }).click();
  await page.getByLabel('Ton prénom').fill('Zoé');
  await page.getByRole('radio', { name: 'CM2' }).click();
  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.getByRole('button', { name: /suivant/i }).click();
  await page.getByRole('radio', { name: /Avec des lettres/ }).click();
  await page.getByLabel(/Mot de passe \(4/).fill('soleil');
  await page.getByLabel('Encore une fois').fill('soleil');
  await page.getByRole('button', { name: 'Créer mon profil' }).click();
  await expect(page).toHaveURL(/\/accueil$/);

  // première partie en ligne : le chunk du jeu est mis en cache à cette première ouverture
  await page.goto('/partie/CM2.MA.CM.FAITS/grand-prix/facile');
  await page.getByRole('button', { name: 'C’est parti !' }).click();
  await expect(page.getByRole('group', { name: /Pavé|clavier/i }).first()).toBeVisible({ timeout: 15_000 });
  await page.goto('/accueil');

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: /Défis du jour/ })).toBeVisible();

  // navigation : leçons de maths du CM2, puis choix du jeu (contenu servi par le cache)
  await page.goto('/jouer/CM2/maths');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/jouer/CM2/maths/CM2.MA.CM.FAITS');
  await expect(page.getByRole('button', { name: /Grand Prix/ }).first()).toBeVisible();

  // une partie hors ligne : le jeu vient du cache
  await page.goto('/partie/CM2.MA.CM.FAITS/grand-prix/facile');
  await page.getByRole('button', { name: 'C’est parti !' }).click();
  await expect(page.getByRole('group', { name: /Pavé|clavier/i }).first()).toBeVisible({ timeout: 15_000 });
  await context.setOffline(false);
});
