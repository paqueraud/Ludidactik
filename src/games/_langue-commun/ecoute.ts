/**
 * Écoute continue (Karaoké de lecture) : la reconnaissance vocale du navigateur suit la lecture et
 * renvoie au fur et à mesure tout ce qui a été entendu (résultats intermédiaires compris).
 * `speech.listen()` ne renvoie qu'un résultat final : pour suivre une lecture mot à mot, il faut le mode
 * continu. À n'utiliser QUE si le parent a autorisé le micro (`useSettings().micro`).
 * Renvoie null si la reconnaissance est indisponible : le jeu passe alors au mode métronome.
 */

interface ResultatReco {
  isFinal: boolean;
  0: { transcript: string };
}

interface RecoContinue {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ResultatReco> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface EcouteContinue {
  /** Arrête l'écoute (définitivement). */
  arreter(): void;
}

export function recoDisponible(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function ecouterEnContinu({
  lang = 'fr-FR',
  onTexte,
  onErreur,
}: {
  lang?: string;
  /** Tout ce qui a été entendu depuis le début (finals + intermédiaire en cours). */
  onTexte: (texte: string) => void;
  /** Micro refusé ou reconnaissance en panne : passer au repli. */
  onErreur: (raison: string) => void;
}): EcouteContinue | null {
  if (!recoDisponible()) return null;
  const w = window as unknown as Record<string, new () => RecoContinue>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;

  let finals = '';
  let arrete = false;
  let rec: RecoContinue | null = null;
  let relances = 0;

  const demarrer = () => {
    const r = new Ctor();
    rec = r;
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    // finals déjà acquis par cette instance (la liste des résultats repart de zéro à chaque relance)
    const base = finals;
    r.onresult = (e) => {
      let fin = '';
      let inter = '';
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i]!;
        if (res.isFinal) fin += ` ${res[0].transcript}`;
        else inter += ` ${res[0].transcript}`;
      }
      finals = `${base}${fin}`;
      onTexte(`${finals}${inter}`.trim());
    };
    r.onerror = (e) => {
      const err = e?.error ?? 'inconnue';
      // « no-speech » / « aborted » : simple silence ou arrêt volontaire, on relance
      if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') {
        arrete = true;
        onErreur(err);
      }
    };
    r.onend = () => {
      // le navigateur coupe après un silence : on relance tant que la lecture n'est pas finie
      if (arrete) return;
      if (relances++ > 30) {
        arrete = true;
        onErreur('trop de relances');
        return;
      }
      try {
        demarrer();
      } catch {
        arrete = true;
        onErreur('relance impossible');
      }
    };
    r.start();
  };

  try {
    demarrer();
  } catch {
    return null;
  }

  return {
    arreter() {
      arrete = true;
      try {
        rec?.stop();
      } catch {
        /* déjà arrêtée */
      }
    },
  };
}
