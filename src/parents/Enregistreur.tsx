/**
 * Enregistrement de la voix du parent pour un mot (MediaRecorder → Blob dans la table `audio`).
 * Écouter / réenregistrer / supprimer (l'audio remplacé est nettoyé quand la liste est enregistrée). Repli propre si le micro est absent ou refusé :
 * la voix de synthèse lira alors le mot.
 */
import { Mic, Play, Square, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { speech } from '@/services/speech';
import { saveRecording } from '@/services/wordLists';

const DUREE_MAX_MS = 6000;

export const enregistrementPossible = () =>
  typeof window !== 'undefined' &&
  typeof window.MediaRecorder !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia;

function mimeSupporte(): string | undefined {
  const candidats = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return candidats.find((m) => MediaRecorder.isTypeSupported?.(m));
}

export function Enregistreur({
  mot,
  audioKey,
  nouvelleCle,
  onChange,
  onErreur,
}: {
  mot: string;
  audioKey?: string;
  /** Fabrique une clé unique pour un nouvel enregistrement. */
  nouvelleCle(): string;
  onChange(key: string | undefined): void;
  onErreur(message: string): void;
}) {
  const [etat, setEtat] = useState<'repos' | 'enregistre' | 'ecoute'>('repos');
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
    },
    [],
  );

  if (!enregistrementPossible()) return null;

  const demarrer = async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onErreur(
        'Le micro n’est pas accessible (refusé ou absent). Les mots seront lus par la voix de synthèse ; vous pouvez autoriser le micro dans les réglages du navigateur.',
      );
      return;
    }
    const mime = mimeSupporte();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const morceaux: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setEtat('repos');
      if (!morceaux.length) return;
      const blob = new Blob(morceaux, { type: rec.mimeType || mime || 'audio/webm' });
      const cle = nouvelleCle();
      await saveRecording(cle, blob);
      onChange(cle);
    };
    recorder.current = rec;
    rec.start();
    setEtat('enregistre');
    timer.current = setTimeout(() => rec.state === 'recording' && rec.stop(), DUREE_MAX_MS);
  };

  const arreter = () => {
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
  };

  const bouton =
    'flex h-12 min-w-12 items-center justify-center gap-1 rounded-2xl px-3 text-sm font-bold disabled:opacity-40';

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Voix pour « ${mot} »`}>
      {etat === 'enregistre' ? (
        <button
          type="button"
          className={`${bouton} animate-pulse bg-coral text-white`}
          onClick={arreter}
          aria-label={`Arrêter l’enregistrement de « ${mot} »`}
        >
          <Square size={18} aria-hidden /> Stop
        </button>
      ) : (
        <button
          type="button"
          className={`${bouton} bg-coral/15`}
          onClick={() => void demarrer()}
          disabled={!mot.trim() || etat !== 'repos'}
          aria-label={
            audioKey ? `Réenregistrer votre voix pour « ${mot} »` : `Enregistrer votre voix pour « ${mot} »`
          }
          title="Dites le mot, puis la phrase si vous le souhaitez (6 secondes au plus)"
        >
          <Mic size={18} aria-hidden /> {audioKey ? 'Refaire' : 'Ma voix'}
        </button>
      )}
      {audioKey && (
        <>
          <button
            type="button"
            className={`${bouton} bg-sky/20`}
            disabled={etat !== 'repos'}
            onClick={async () => {
              setEtat('ecoute');
              const ok = await speech.playRecording(audioKey);
              if (!ok) onErreur('Cet enregistrement est introuvable.');
              setEtat('repos');
            }}
            aria-label={`Écouter votre voix pour « ${mot} »`}
          >
            <Play size={18} aria-hidden />
          </button>
          <button
            type="button"
            className={`${bouton} bg-ink/10`}
            disabled={etat !== 'repos'}
            // l'enregistrement est effacé de la base à l'enregistrement de la liste (annulation possible)
            onClick={() => onChange(undefined)}
            aria-label={`Supprimer votre voix pour « ${mot} »`}
          >
            <Trash2 size={18} aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}
