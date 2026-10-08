import { writeFileSync } from 'node:fs';
import { test } from '@playwright/test';

const DIR =
  'C:/Users/paque/AppData/Local/Temp/claude/D--Claude-Code-Ludidactik/c4a0f6d4-5678-434a-8c56-8f7e38602995/scratchpad/snap';
const JEUX = (process.env.JEUX ?? '').split(',').filter(Boolean);
const NIVEAU = process.env.NIVEAU ?? 'normal';

for (const jeu of JEUX)
  test(`snap ${jeu}`, async ({ page }, info) => {
    await page.goto(`/labo/${jeu}?niveau=${NIVEAU}`);
    await page.waitForTimeout(1500);
    const snap = await page.locator('body').ariaSnapshot();
    writeFileSync(`${DIR}/${jeu}-${NIVEAU}-${info.project.name}.txt`, snap);
    await page.screenshot({ path: `${DIR}/${jeu}-${NIVEAU}-${info.project.name}.png`, fullPage: true });
  });
