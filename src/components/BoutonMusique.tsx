/** Bouton rapide 🎵 (barre du haut de l'enfant) : allume ou coupe la musique de fond (réglage persistant). */
import { Music, Music2 } from 'lucide-react';
import { useSettings } from '@/stores/settings';

export function BoutonMusique({ className = '' }: { className?: string }) {
  const musique = useSettings((s) => s.musique);
  const update = useSettings((s) => s.update);
  return (
    <button
      type="button"
      aria-pressed={musique}
      aria-label={musique ? 'Couper la musique' : 'Mettre la musique'}
      title={musique ? 'Couper la musique' : 'Mettre la musique'}
      onClick={() => void update({ musique: !musique })}
      className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${musique ? 'bg-grape text-white' : 'bg-cream text-ink-soft hover:bg-cream-deep'} ${className}`}
    >
      {musique ? <Music2 size={22} aria-hidden /> : <Music size={22} aria-hidden />}
      {!musique && <span aria-hidden className="absolute h-0.5 w-7 rotate-45 rounded bg-current" />}
    </button>
  );
}
