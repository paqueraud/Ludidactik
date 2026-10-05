import { defineConfig, devices } from '@playwright/test';

/** Port du serveur de test (E2E_PORT pour faire tourner plusieurs copies du projet en parallèle). */
const port = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure', locale: 'fr-FR' },
  projects: [
    { name: 'tablette', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    port,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
