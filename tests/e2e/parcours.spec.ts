import { type Page, expect, test } from '@playwright/test';

/** Résout les énoncés de calcul affichés (« 47 + 9 », « 4 + … = 12 », « … − 3 = 5 »…). */
function solve(prompt: string): string {
  const n = (s: string) => Number(s.replace(/[\s  ]/g, '').replace(',', '.'));
  const p = prompt.replace(/[\s  ]+/g, ' ').trim();
  let m = p.match(/^([\d ,]+) \+ … = ([\d ,]+)$/);
  if (m) return String(n(m[2]!) - n(m[1]!));
  m = p.match(/^… − ([\d ,]+) = ([\d ,]+)$/);
  if (m) return String(n(m[1]!) + n(m[2]!));
  m = p.match(/^… × ([\d ,]+) = ([\d ,]+)$/);
  if (m) return String(n(m[2]!) / n(m[1]!));
  m = p.match(/^([\d ,]+) ([+−×÷]) ([\d ,]+)$/);
  if (m) {
    const a = n(m[1]!);
    const b = n(m[3]!);
    const r = m[2] === '+' ? a + b : m[2] === '−' ? a - b : m[2] === '×' ? a * b : a / b;
    return String(Math.round(r * 1000) / 1000).replace('.', ',');
  }
  throw new Error(`énoncé non reconnu : ${prompt}`);
}

async function creerProfil(page: Page, prenom: string, classe: 'CE1' | 'CM2') {
  await page.goto('/');
  await page.getByRole('button', { name: 'Jouer' }).click();
  await page.getByRole('button', { name: 'Nouveau profil' }).click();
  await page.getByLabel('Ton prénom').fill(prenom);
  await page.getByRole('radio', { name: classe }).click();
  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.getByRole('button', { name: /suivant/i }).click();
  await page.getByRole('radio', { name: /Avec des lettres/ }).click();
  await page.getByLabel(/Mot de passe \(4/).fill('soleil');
  await page.getByLabel('Encore une fois').fill('soleil');
  await page.getByRole('button', { name: 'Créer mon profil' }).click();
  await expect(page).toHaveURL(/\/accueil$/);
  // tableau de bord de l'enfant → ses leçons
  await page.getByRole('button', { name: /Mes leçons/ }).click();
  await expect(page).toHaveURL(/\/jouer$/);
}

async function ouvrirJeu(
  page: Page,
  classe: string,
  matiere: RegExp,
  lecon: RegExp,
  jeu: RegExp,
  niveau: RegExp,
) {
  await page.getByRole('button', { name: classe, exact: false }).first().click();
  await page.getByRole('button', { name: matiere }).click();
  await page.getByRole('button', { name: lecon }).first().click();
  await page.getByRole('button', { name: jeu }).click();
  await page.getByRole('button', { name: niveau }).click();
  await page.getByRole('button', { name: 'C’est parti !' }).click();
}

test.describe('parcours principal', () => {
  let erreurs: string[];
  test.beforeEach(({ page }) => {
    erreurs = [];
    page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
    page.on('pageerror', (e) => erreurs.push(String(e)));
  });
  test.afterEach(() => expect(erreurs, erreurs.join('\n')).toEqual([]));

  test('profil CE1 → Grand Prix facile jusqu’à l’arrivée → bilan', async ({ page }) => {
    test.setTimeout(120_000);
    await creerProfil(page, 'Léa', 'CE1');
    await ouvrirJeu(page, 'CE1', /Mathématiques/, /Tables d['’]addition/, /Le Grand Prix/, /^Facile/);
    for (let i = 0; i < 6; i++) {
      const prompt = page.locator('p.font-titre').first();
      await expect(prompt).toBeVisible({ timeout: 10_000 });
      const txt = (await prompt.textContent())!;
      for (const ch of solve(txt)) await page.keyboard.press(ch === ',' ? 'Comma' : ch);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(150);
    }
    await expect(page.getByRole('button', { name: 'Rejouer' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('100 %')).toBeVisible();
    // la progression est conservée : étoiles visibles sur la carte de la leçon
    await page.getByRole('button', { name: 'Autres jeux' }).click();
    await expect(page.getByRole('heading', { name: 'Choisis ton jeu' })).toBeVisible();
  });

  test('Ascension : une faute → différence + copie active → mot suivant', async ({ page }) => {
    test.setTimeout(120_000);
    await creerProfil(page, 'Tom', 'CE1');
    await ouvrirJeu(page, 'CE1', /Français/, /Les mots à savoir écrire/, /L'Ascension/, /^Normal/);
    await expect(page.getByText(/Écris le mot que tu entends/)).toBeVisible({ timeout: 10_000 });
    await page.keyboard.type('zzz');
    await page.keyboard.press('Enter');
    const juste = await page.locator('span.text-grass-dark.font-titre').first().textContent();
    expect(juste).toBeTruthy();
    // recopie avec le clavier à l'écran (lettres accentuées comprises)
    for (const ch of juste!) {
      if (ch === "'") await page.getByRole('button', { name: 'apostrophe' }).click();
      else if (ch === '-') await page.getByRole('button', { name: 'trait d’union' }).click();
      else if (ch === ' ') await page.getByRole('button', { name: 'espace' }).click();
      else
        await page
          .getByRole('group', { name: 'Clavier' })
          .getByRole('button', { name: ch, exact: true })
          .click();
    }
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Écris le mot que tu entends/)).toBeVisible();
    await expect(page.getByText('Camp 0 / 12')).toBeVisible();
    // pause → quitter
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.getByRole('button', { name: 'Quitter la partie' }).click();
    await expect(page.getByRole('heading', { name: 'Choisis ton jeu' })).toBeVisible();
  });

  test('Guillotine CM2 : on joue jusqu’au verdict', async ({ page }) => {
    test.setTimeout(120_000);
    await creerProfil(page, 'Nour', 'CM2');
    await ouvrirJeu(page, 'CM2', /Histoire/, /Rappel du CM1/, /La Guillotine/, /^Normal/);
    for (let i = 0; i < 40; i++) {
      if (await page.getByRole('button', { name: 'Rejouer' }).isVisible()) break;
      const cont = page.getByRole('button', { name: 'Continuer' });
      if (await cont.isVisible()) {
        await cont.click();
        continue;
      }
      const choix = page.locator('button:has(span.rounded-full)').filter({ hasText: /\S/ }).first();
      if (await choix.isEnabled().catch(() => false)) await page.keyboard.press('a');
      await page.waitForTimeout(400);
    }
    await expect(page.getByRole('button', { name: 'Rejouer' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /acquitte|perdu la tête/ })).toBeVisible();
  });
});
