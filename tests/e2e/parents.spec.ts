import { type Page, expect, test } from '@playwright/test';

const LISTE = ['maison', 'chocolat', 'école', 'jardin', 'Paris'];

async function creerProfil(page: Page, prenom: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Jouer' }).click();
  await page.getByRole('button', { name: 'Nouveau profil' }).click();
  await page.getByLabel('Ton prénom').fill(prenom);
  await page.getByRole('radio', { name: 'CE1' }).click();
  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.getByRole('button', { name: /suivant/i }).click();
  await page.getByRole('radio', { name: /Avec des lettres/ }).click();
  await page.getByLabel(/Mot de passe \(4/).fill('soleil');
  await page.getByLabel('Encore une fois').fill('soleil');
  await page.getByRole('button', { name: 'Créer mon profil' }).click();
  await expect(page).toHaveURL(/\/accueil$/);
}

/** Résout la question « adulte » affichée (« Combien font 7 × 8 + 13 ? »). */
async function repondreCalcul(page: Page) {
  const label = (await page.locator('label[for="calcul-adulte"]').textContent())!;
  const m = label.match(/(\d) × (\d) ([+−]) (\d+)/)!;
  const r = Number(m[1]) * Number(m[2]) + (m[3] === '+' ? 1 : -1) * Number(m[4]);
  await page.locator('#calcul-adulte').fill(String(r));
}

test.describe('espace parents', () => {
  let erreurs: string[];
  test.beforeEach(({ page }) => {
    erreurs = [];
    page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
    page.on('pageerror', (e) => erreurs.push(String(e)));
  });
  test.afterEach(() => expect(erreurs, erreurs.join('\n')).toEqual([]));

  test('code parent, liste collée, réglage, mot de passe, puis l’enfant joue ses mots', async ({ page }) => {
    test.setTimeout(150_000);
    await creerProfil(page, 'Inès');

    // 1. Création du code parent
    await page.goto('/');
    await page.getByRole('button', { name: 'Espace parents' }).click();
    await expect(page.getByRole('heading', { name: 'Créer le code parent' })).toBeVisible();
    await page.getByLabel('Code parent', { exact: true }).fill('2468');
    await page.getByLabel('Confirmez le code').fill('2468');
    await page.getByRole('button', { name: 'Créer le code et entrer' }).click();
    await expect(page.getByRole('heading', { name: 'Mots de la semaine' })).toBeVisible();

    // 2. Liste de 5 mots par collage
    await page.getByRole('button', { name: 'Nouvelle liste' }).click();
    await page.getByLabel('Ou collez une liste').fill('maison, chocolat\nécole; jardin\n  Paris  \nmaison');
    await page.getByRole('button', { name: 'Ajouter ces mots' }).click();
    await expect(page.getByRole('status')).toContainText('5 mots ajoutés');
    await expect(page.getByRole('status')).toContainText('doublon ignoré : maison');
    await expect(page.getByRole('heading', { name: '5 mots dans la liste' })).toBeVisible();
    // classe de la dictée et texte complet
    await page.getByRole('radio', { name: 'CE1', exact: true }).check();
    await page.getByLabel('Dictée complète (facultatif)').fill('La maison est grande. Le chocolat est bon !');
    await expect(page.getByText('2 phrases')).toBeVisible();
    await expect(page.getByText(/absents du texte/)).toContainText('école, jardin, Paris');
    await page.getByRole('button', { name: 'Enregistrer la liste' }).click();
    await expect(page.getByText('Dictée CE1')).toBeVisible();
    await expect(page.locator('p', { hasText: 'Dictée complète :' })).toContainText('2 phrases');
    await expect(page.getByText('maison, chocolat, école, jardin, Paris')).toBeVisible();

    // 3. Un réglage : couper les sons (conservé après rechargement + déverrouillage)
    await page.getByRole('link', { name: /Réglages/ }).click();
    const sons = page.getByRole('switch', { name: 'Sons du jeu' });
    await expect(sons).toHaveAttribute('aria-checked', 'true');
    await sons.click();
    await expect(sons).toHaveAttribute('aria-checked', 'false');

    // 4. Réinitialiser le mot de passe de l'enfant
    await page.getByRole('link', { name: /Profils et sauvegarde/ }).click();
    const carte = page.getByRole('article', { name: 'Profil de Inès' });
    await carte.getByRole('button', { name: 'Nouveau mot de passe' }).click();
    await carte.getByRole('radio', { name: 'Avec des lettres' }).click();
    await carte.getByLabel(/Nouveau mot de passe \(4/).fill('lune22');
    await carte.getByRole('button', { name: 'Enregistrer le mot de passe' }).click();
    await expect(carte.getByRole('status')).toContainText('Nouveau mot de passe enregistré');

    // 5. Rechargement : la session parent est refermée → code + question de calcul
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Accès réservé aux adultes' })).toBeVisible();
    await page.getByLabel('Code parent', { exact: true }).fill('2469');
    await repondreCalcul(page);
    await page.getByRole('button', { name: 'Entrer' }).click();
    await expect(page.getByRole('alert')).toContainText('n’est pas correct');
    await page.getByLabel('Code parent', { exact: true }).fill('2468');
    await repondreCalcul(page);
    await page.getByRole('button', { name: 'Entrer' }).click();
    await page.getByRole('link', { name: /Réglages/ }).click();
    await expect(page.getByRole('switch', { name: 'Sons du jeu' })).toHaveAttribute('aria-checked', 'false');
    await page.getByRole('button', { name: /Verrouiller/ }).click();
    await expect(page.getByRole('heading', { name: 'Accès réservé aux adultes' })).toBeVisible();

    // 6. L'enfant se reconnecte avec son nouveau mot de passe
    await page.goto('/profils');
    await page.getByRole('button', { name: /Inès/ }).click();
    await page.getByLabel('Mot de passe').fill('lune22');
    await page.getByRole('button', { name: 'Entrer' }).click();
    await expect(page).toHaveURL(/\/accueil$/);

    // 7. Écran des matières : « Mes mots de la semaine » en tête → L'Ascension en 2 touches
    await page.goto('/jouer/CE1');
    const raccourci = page.getByRole('region', { name: 'Mes mots de la semaine' });
    await expect(raccourci).toBeVisible();
    await expect(raccourci.getByText('Nouveaux mots !')).toBeVisible();
    await raccourci.getByRole('button', { name: "L'Ascension" }).click(); // 1
    await page.getByRole('button', { name: 'C’est parti !' }).click(); // 2
    await expect(page.getByText(/Écris (le mot|la phrase) que tu entends/)).toBeVisible({ timeout: 10_000 });
    // une réponse fausse révèle le mot attendu : il vient bien de la liste des parents
    await page.keyboard.type('zzz');
    await page.keyboard.press('Enter');
    const attendu = await page.locator('span.text-grass-dark.font-titre').first().textContent();
    // un mot de la liste ou une phrase de la dictée complète
    expect([...LISTE, 'La maison est grande.', 'Le chocolat est bon !']).toContain(attendu?.trim());

    // la leçon apparaît aussi en tête de la liste des leçons de français
    await page.goto('/jouer/CE1/francais');
    await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(
      'Orthographe lexicale (dictée)',
      {
        timeout: 15_000,
      },
    );
  });
});
