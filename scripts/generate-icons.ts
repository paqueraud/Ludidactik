/**
 * Génère les icônes PNG de la PWA à partir de public/icons/ludo.svg (rendu par Chromium/Playwright).
 * Usage : npx tsx scripts/generate-icons.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const root = join(import.meta.dirname, '..');
const svg = readFileSync(join(root, 'public/icons/ludo.svg'), 'utf8');

const targets = [
  { file: 'icon-192.png', size: 192, padding: 0 },
  { file: 'icon-512.png', size: 512, padding: 0 },
  // « maskable » : marge de sécurité de 10 % sur fond plein
  { file: 'icon-maskable-512.png', size: 512, padding: 0.1 },
  { file: 'icon-maskable-192.png', size: 192, padding: 0.1 },
  // iOS : écran d'accueil (fond opaque obligatoire, coins arrondis par le système)
  { file: 'apple-touch-icon.png', size: 180, padding: 0.08 },
  { file: 'favicon-32.png', size: 32, padding: 0 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const t of targets) {
  const inner = Math.round(t.size * (1 - 2 * t.padding));
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:#4FC3F7;display:flex;align-items:center;justify-content:center;width:${t.size}px;height:${t.size}px">
      <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`,
  );
  await page.screenshot({ path: join(root, 'public/icons', t.file), omitBackground: t.padding === 0 });
  console.log('✓', t.file);
}
await browser.close();
