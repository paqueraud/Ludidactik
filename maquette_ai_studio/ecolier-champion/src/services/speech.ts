// Text-to-Speech Engine for French Primary Dictation and Oral Exercises

class FrenchSpeechEngine {
  private voices: SpeechSynthesisVoice[] = [];
  public enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
  }

  public getFrenchVoice(): SpeechSynthesisVoice | null {
    if (this.voices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
    // Prefer fr-FR or fr voice
    const frVoice = this.voices.find(v => v.lang === 'fr-FR' || v.lang.startsWith('fr'));
    return frVoice || null;
  }

  public speak(text: string, rate: number = 0.85, onEnd?: () => void) {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = rate; // 0.85 is ideal for children learning spelling
      utterance.pitch = 1.05;

      const voice = this.getFrenchVoice();
      if (voice) {
        utterance.voice = voice;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const frenchSpeech = new FrenchSpeechEngine();
