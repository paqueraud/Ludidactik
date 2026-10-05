/**
 * Authentification locale (ARCHITECTURE §7). PBKDF2-SHA256, 100 000 itérations, sel de 16 octets.
 * Ce n'est PAS une sécurité forte : un verrou « familial » pour séparer les profils sur l'appareil.
 */
import type { ProfileAuth } from './storage/db';

const ITERATIONS = 100_000;

const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
};
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function derive(secret: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITERATIONS },
    key,
    256,
  );
  return toB64(bits);
}

/** Normalise un mot de passe texte (espaces autour ignorés). */
const normalizeSecret = (type: ProfileAuth['type'], secret: string) =>
  type === 'texte' ? secret.trim() : secret;

export async function createAuth(type: ProfileAuth['type'], secret: string): Promise<ProfileAuth> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { type, salt: toB64(salt), hash: await derive(normalizeSecret(type, secret), salt) };
}

export async function verifyAuth(auth: ProfileAuth, secret: string): Promise<boolean> {
  const hash = await derive(normalizeSecret(auth.type, secret), fromB64(auth.salt));
  // comparaison à temps constant
  if (hash.length !== auth.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ auth.hash.charCodeAt(i);
  return diff === 0;
}

/** Mot de passe image : 4 pictogrammes parmi 12. */
export const PICTOS = [
  { id: 'chien', emoji: '🐶', label: 'chien' },
  { id: 'chat', emoji: '🐱', label: 'chat' },
  { id: 'pomme', emoji: '🍎', label: 'pomme' },
  { id: 'etoile', emoji: '⭐', label: 'étoile' },
  { id: 'voiture', emoji: '🚗', label: 'voiture' },
  { id: 'arc', emoji: '🌈', label: 'arc-en-ciel' },
  { id: 'glace', emoji: '🍦', label: 'glace' },
  { id: 'ballon', emoji: '⚽', label: 'ballon' },
  { id: 'fleur', emoji: '🌻', label: 'fleur' },
  { id: 'poisson', emoji: '🐟', label: 'poisson' },
  { id: 'fusee', emoji: '🚀', label: 'fusée' },
  { id: 'cadeau', emoji: '🎁', label: 'cadeau' },
] as const;
export const PICTO_LENGTH = 4;

export const pictoSecret = (ids: string[]) => ids.join('-');
