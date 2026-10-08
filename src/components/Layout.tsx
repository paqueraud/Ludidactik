/** Mise en page commune : ciel à nuages (parallaxe douce), barre du haut avec retour, profil, XP et Ludis. */
import { motion } from 'framer-motion';
import { Sky } from './Sky';
import { ArrowLeft, Home } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '@/avatar/Avatar';
import { playerLevel } from '@/engine/score';
import { PastilleFlamme } from '@/meta/IconeFlamme';
import { useCurrentProfile } from '@/services/profiles';
import { sfx } from '@/services/sfx';
import { LudiCoin, SpeakButton } from './ui';

export { Sky };

interface ScreenProps {
  titre?: string;
  /** Texte lu par le bouton 🔊 du titre. */
  aLire?: string;
  retour?: string | (() => void);
  children: ReactNode;
  hills?: boolean;
  large?: boolean;
  /** Écran adulte (espace parents) : pas de pastille du profil enfant connecté. */
  adulte?: boolean;
  /** Éléments supplémentaires à droite de la barre du haut. */
  actions?: ReactNode;
}

export function Screen({
  titre,
  aLire,
  retour,
  children,
  hills = true,
  large = false,
  adulte = false,
  actions,
}: ScreenProps) {
  const navigate = useNavigate();
  const connecte = useCurrentProfile();
  const profile = adulte ? null : connecte;
  const lvl = profile ? playerLevel(profile.xp) : null;
  return (
    <div className="min-h-dvh pb-28">
      <Sky hills={hills} />
      <header className="sticky top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 rounded-card bg-card/85 p-2 shadow-soft backdrop-blur sm:flex-nowrap">
          {retour ? (
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream text-ink hover:bg-cream-deep"
              aria-label="Retour"
              onClick={() => {
                sfx.play('pop');
                if (typeof retour === 'function') retour();
                else navigate(retour);
              }}
            >
              <ArrowLeft size={26} aria-hidden />
            </button>
          ) : (
            <Link
              to={profile ? '/accueil' : '/'}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream"
              aria-label="Accueil"
            >
              <Home size={24} aria-hidden />
            </Link>
          )}
          {/* Sur téléphone, avec la flamme et le profil, le titre passe sur sa propre ligne. */}
          {profile && titre && <span className="flex-1 sm:hidden" aria-hidden />}
          <div
            className={`flex min-w-0 flex-1 items-center gap-2 ${profile && titre ? 'max-sm:order-last max-sm:basis-full max-sm:pl-1' : ''}`}
          >
            {titre && <h1 className="truncate text-xl sm:text-2xl">{titre}</h1>}
            {titre && <SpeakButton text={aLire ?? titre} size={40} />}
          </div>
          {actions}
          {profile && <PastilleFlamme profileId={profile.id} />}
          {profile && lvl && (
            <Link
              to="/profil"
              className="flex shrink-0 items-center gap-2 rounded-full bg-cream py-1 pl-1 pr-3 hover:bg-cream-deep"
              aria-label={`Mon profil : ${profile.prenom}, niveau ${lvl.niveau}, ${profile.ludis} Ludis`}
            >
              <Avatar config={profile.avatar} size={40} compagnon={false} fond="rgb(var(--c-sky) / 0.35)" />
              <span className="hidden font-titre font-bold sm:inline">{profile.prenom}</span>
              <span className="rounded-full bg-grape px-2 text-sm font-bold text-white">
                Niv. {lvl.niveau}
              </span>
              <span className="flex items-center gap-1 font-bold">
                <LudiCoin size={20} />
                {profile.ludis}
              </span>
            </Link>
          )}
        </div>
      </header>
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`mx-auto mt-4 px-3 sm:px-6 ${large ? 'max-w-6xl' : 'max-w-5xl'}`}
      >
        {children}
      </motion.main>
    </div>
  );
}
