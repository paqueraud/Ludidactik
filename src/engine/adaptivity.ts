/**
 * Adaptativité intra-niveau (ARCHITECTURE §5) : 3 bonnes réponses d'affilée → items plus exigeants,
 * 2 erreurs d'affilée → items plus simples. Le niveau choisi par l'enfant ne change jamais.
 */
export class Adaptivity {
  target: number;
  private ok = 0;
  private ko = 0;

  constructor(start = 0.4) {
    this.target = start;
  }

  record(correct: boolean) {
    if (correct) {
      this.ok++;
      this.ko = 0;
      if (this.ok >= 3) {
        this.target = Math.min(1, this.target + 0.2);
        this.ok = 0;
      }
    } else {
      this.ko++;
      this.ok = 0;
      if (this.ko >= 2) {
        this.target = Math.max(0, this.target - 0.2);
        this.ko = 0;
      }
    }
  }
}
