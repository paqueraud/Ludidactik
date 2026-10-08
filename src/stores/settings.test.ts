import { beforeEach, describe, expect, it, vi } from 'vitest';
import { musique } from '@/services/musique';
import { haptique, vibrate } from '@/services/sfx';
import { db } from '@/services/storage/db';
import { DEFAULT_SETTINGS, useSettings } from './settings';

describe('réglages : musique, vibrations, apparence', () => {
  beforeEach(async () => {
    await db.settings.clear();
    await useSettings.getState().load();
    document.head.innerHTML =
      '<meta name="theme-color" content="#4FC3F7" media="(prefers-color-scheme: light)">' +
      '<meta name="theme-color" content="#16243A" media="(prefers-color-scheme: dark)">';
  });

  it('valeurs par défaut : musique coupée, vibrations actives, thème automatique', () => {
    expect(DEFAULT_SETTINGS.musique).toBe(false);
    expect(DEFAULT_SETTINGS.musiqueEnJeu).toBe(false);
    expect(DEFAULT_SETTINGS.vibrations).toBe(true);
    expect(DEFAULT_SETTINGS.theme).toBe('auto');
    expect(musique.enabled).toBe(false);
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('la musique est persistée et rechargée', async () => {
    await useSettings.getState().update({ musique: true });
    expect(musique.enabled).toBe(true);
    useSettings.setState({ musique: false });
    await useSettings.getState().load();
    expect(useSettings.getState().musique).toBe(true);
    expect(musique.enabled).toBe(true);
    await useSettings.getState().update({ musique: false });
    expect(musique.enabled).toBe(false);
  });

  it('vibrations : coupées par le réglage, sans effet sans support', async () => {
    const spy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: spy, configurable: true });
    vibrate(30);
    expect(spy).toHaveBeenCalledTimes(1);
    await useSettings.getState().update({ vibrations: false });
    expect(haptique.enabled).toBe(false);
    vibrate(30);
    expect(spy).toHaveBeenCalledTimes(1);
    await useSettings.getState().update({ vibrations: true });
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
    expect(() => vibrate(30)).not.toThrow();
  });

  it('apparence : thème forcé sur <html> et couleur de la barre du navigateur', async () => {
    await useSettings.getState().update({ theme: 'sombre' });
    expect(document.documentElement.dataset.theme).toBe('sombre');
    const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
    expect(metas.every((m) => m.content === '#16243A' && !m.hasAttribute('media'))).toBe(true);
    await useSettings.getState().update({ theme: 'clair' });
    expect(document.documentElement.dataset.theme).toBe('clair');
    await useSettings.getState().update({ theme: 'auto' });
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(metas.map((m) => m.getAttribute('media'))).toEqual([
      '(prefers-color-scheme: light)',
      '(prefers-color-scheme: dark)',
    ]);
  });
});
