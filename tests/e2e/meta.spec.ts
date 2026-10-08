import { type Page, expect, test } from '@playwright/test';

/** Résout les énoncés de calcul affichés (« 47 + 9 », « 4 + … = 12 »…). */
function solve(prompt: string): string {
  const n = (s: string) => Number(s.replace(/[\s  ]/g, '').replace(',', '.'));
  const p = prompt.replace(/[\s  ]+/g, ' ').trim();
  let m = p.match(/^([\d ,]+) \+ … = ([\d ,]+)$/);
  if (m) return String(n(m[2]!) - n(m[1]!));
  m = p.match(/^… − ([\d ,]+) = ([\d ,]+)$/);
  if (m) return String(n(m[1]!) + n(m[2]!));
  m = p.match(/^… \+ ([\d ,]+) = ([\d ,]+)$/);
  if (m) return String(n(m[2]!) - n(m[1]!));
  m = p.match(/^([\d ,]+) ([+−×÷]) ([\d ,]+)$/);
  if (m) {
    const a = n(m[1]!);
    const b = n(m[3]!);
    const r = m[2] === '+' ? a + b : m[2] === '−' ? a - b : m[2] === '×' ? a * b : a / b;
    return String(Math.round(r * 1000) / 1000).replace('.', ',');
  }
  throw new Error(`énoncé non reconnu : ${prompt}`);
}

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

/** Transforme chaque ligne d'une table IndexedDB (sans passer par Dexie) — exécuté dans la page. */
function patchIdb<T>(table: string, transform: (row: T) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('ludidactik');
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const idb = req.result;
      const tx = idb.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      const all = store.getAll();
      all.onsuccess = () => {
        for (const row of all.result as T[]) {
          transform(row);
          store.put(row);
        }
      };
      tx.oncomplete = () => {
        idb.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
  });
}

/** Modifie la base puis recharge la page (Dexie ne voit pas les écritures directes). */
async function modifierTable<T>(page: Page, table: string, transform: (row: T) => void) {
  await page.evaluate(`(${patchIdb.toString()})(${JSON.stringify(table)}, ${transform.toString()})`);
  await page.reload();
}

interface DefiBrut {
  lessonId: string;
  gameId: string;
  level: string;
  fait: boolean;
  stars: number;
}

test.describe('méta-jeu', () => {
  let erreurs: string[];
  test.beforeEach(({ page }) => {
    erreurs = [];
    page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
    page.on('pageerror', (e) => erreurs.push(String(e)));
  });
  test.afterEach(() => expect(erreurs, erreurs.join('\n')).toEqual([]));

  test('défi du jour joué → flamme → coffre → boutique → île, badges, scores', async ({ page }) => {
    test.setTimeout(150_000);
    await creerProfil(page, 'Zoé');

    // Tableau de bord → Défis du jour (3 défis tirés)
    await page.getByRole('button', { name: /Défis du jour/ }).click();
    await expect(page).toHaveURL(/\/defis$/);
    const cartes = page.getByRole('listitem', { name: /^Défi \d/ });
    await expect(cartes).toHaveCount(3, { timeout: 15_000 });

    // Défi 1 forcé sur le Grand Prix (tables d'addition, Facile) pour pouvoir le jouer au clavier
    await modifierTable(page, 'dailyChallenges', (row: { defis: DefiBrut[] }) => {
      Object.assign(row.defis[0]!, {
        lessonId: 'CE1.MA.CM.TABLES_ADD',
        gameId: 'grand-prix',
        level: 'facile',
      });
    });
    await expect(page.getByRole('button', { name: 'Jouer' }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Jouer' }).first().click();
    await page.getByRole('button', { name: 'C’est parti !' }).click();
    for (let i = 0; i < 8; i++) {
      if (await page.getByRole('button', { name: 'Rejouer' }).isVisible()) break;
      const prompt = page.locator('p.font-titre').first();
      await expect(prompt).toBeVisible({ timeout: 10_000 });
      const txt = (await prompt.textContent())!;
      for (const ch of solve(txt)) await page.keyboard.press(ch === ',' ? 'Comma' : ch);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(150);
    }
    await expect(page.getByRole('button', { name: 'Rejouer' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Défi 1 réussi/)).toBeVisible();
    await expect(page.getByText(/Nouveau badge : Premier galop/)).toBeVisible();

    // Retour aux défis : défi réussi, flamme allumée
    await page.getByRole('button', { name: 'Mes défis' }).click();
    await expect(page).toHaveURL(/\/defis$/);
    await expect(page.getByText('Réussi !')).toBeVisible();
    await expect(page.getByRole('link', { name: /Flamme : 1 jour de défis/ })).toBeVisible();

    // Les deux autres défis réussis (base) → coffre
    await modifierTable(page, 'dailyChallenges', (row: { defis: DefiBrut[] }) => {
      for (const d of row.defis) {
        d.fait = true;
        d.stars = d.stars || 1;
      }
    });
    await page.getByRole('button', { name: 'Ouvrir le coffre !' }).click();
    await expect(page.getByText(/Trésor :/)).toBeVisible();
    await expect(page.getByText('+30')).toBeVisible();

    // Boutique : des Ludis en plus, achat puis équipement
    await modifierTable(page, 'profiles', (row: { ludis: number }) => {
      row.ludis = 200;
    });
    await page.goto('/boutique');
    await page.getByRole('button', { name: 'Acheter Casque de jockey pour 80 Ludis' }).click();
    await page.getByRole('button', { name: 'Oui' }).click();
    await expect(page.getByRole('status')).toContainText('Casque de jockey est à toi');
    await expect(page.getByRole('button', { name: 'Porté' })).toBeVisible();
    await expect(page.getByRole('link', { name: /120 Ludis/ })).toBeVisible();

    // Mon île, badges, scores
    await page.goto('/accueil');
    await page.getByRole('button', { name: /Mon île/ }).click();
    await expect(page.getByRole('group', { name: 'Carte de mon île' })).toBeVisible();
    await page
      .getByRole('button', { name: /Village des Nombres/ })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: 'Village des Nombres' })).toBeVisible();

    await page.goto('/badges');
    await expect(page.getByRole('listitem', { name: /Premier galop.*Obtenu le/ })).toBeVisible();
    await expect(page.getByRole('listitem', { name: /Chasseur de trésors.*Obtenu le/ })).toBeVisible();

    await page.goto('/scores');
    await expect(page.getByText('Le Grand Prix').first()).toBeVisible();
    await page.getByRole('tab', { name: /Ma semaine/ }).click();
    await expect(page.getByText(/Ligue/).first()).toBeVisible();
  });

  test('duel Vrai ou Faux sur le même écran', async ({ page }) => {
    test.setTimeout(90_000);
    await creerProfil(page, 'Max');
    await page.getByRole('button', { name: /Duel à deux/ }).click();
    await page.getByRole('button', { name: /Vrai ou Faux en duel/ }).click();
    await page.getByRole('button', { name: 'C’est parti !' }).click();
    await expect(page.getByText(/carte 1\/10/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vrai (Max)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vrai (Invité)' })).toBeVisible();
    // Max répond, l'invité aussi : la carte suivante finit par arriver
    await page.getByRole('button', { name: 'Vrai (Max)' }).click();
    if (await page.getByRole('button', { name: 'Faux (Invité)' }).isVisible())
      await page.getByRole('button', { name: 'Faux (Invité)' }).click();
    await expect(page.getByText(/carte 2\/10/)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Arrêter le duel' }).click();
    await expect(page.getByRole('heading', { name: 'Vrai ou Faux en duel' })).toBeVisible();
  });
});
