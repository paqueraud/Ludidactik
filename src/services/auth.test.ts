import { describe, expect, it } from 'vitest';
import { createAuth, pictoSecret, verifyAuth } from './auth';

describe('auth locale', () => {
  it('vérifie un mot de passe texte', async () => {
    const auth = await createAuth('texte', 'soleil');
    expect(auth.hash).not.toContain('soleil');
    expect(await verifyAuth(auth, 'soleil')).toBe(true);
    expect(await verifyAuth(auth, ' soleil ')).toBe(true);
    expect(await verifyAuth(auth, 'Soleil')).toBe(false);
  });
  it('vérifie un mot de passe image (ordre compris)', async () => {
    const auth = await createAuth('image', pictoSecret(['chat', 'pomme', 'fusee', 'chat']));
    expect(await verifyAuth(auth, pictoSecret(['chat', 'pomme', 'fusee', 'chat']))).toBe(true);
    expect(await verifyAuth(auth, pictoSecret(['pomme', 'chat', 'fusee', 'chat']))).toBe(false);
  });
  it('deux profils au même mot de passe ont des hachages différents (sel)', async () => {
    const a = await createAuth('texte', 'abc');
    const b = await createAuth('texte', 'abc');
    expect(a.hash).not.toBe(b.hash);
  });
});
