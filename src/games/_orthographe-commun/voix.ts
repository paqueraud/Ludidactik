/** Voix et clavier : utilitaires communs (hors composants, pour le rechargement à chaud). */
import type { SpellingItem } from '@/content/schemas';
import type { SpeechService } from '@/services/speech';

/** Le mot peut-il être entendu (synthèse vocale ou enregistrement du parent) ? */
export const peutEntendre = (speech: SpeechService, item: SpellingItem) =>
  speech.ttsAvailable || !!item.audioKey;

/** Dit le mot (enregistrement du parent s'il existe, sinon synthèse fr-FR), avec sa phrase si demandé. */
export function direMot(speech: SpeechService, item: SpellingItem, avecPhrase = false) {
  return speech.dictate(item.word, avecPhrase && !item.isSentence ? item.sentence : undefined, item.audioKey);
}
/** Lettres acceptées au clavier physique (lettres accentuées comprises, apostrophe, trait d'union). */
export const TOUCHES_LETTRES = /^[\p{L}'’-]$/u;
