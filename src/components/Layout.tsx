/** Mise en page commune : ciel à nuages (parallaxe douce), barre du haut avec retour, profil, XP et Ludis. */
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '@/avatar/Avatar';
import { playerLevel } from '@/engine/score';
import { PastilleFlamme } from '@/meta/IconeFlamme';
import { useCurrentProfile } from '@/services/profiles';
import { sfx } from '@/services/sfx';
import { LudiCoin, SpeakButton } from './ui';

function Cloud({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 60" className={className} style={style} aria-hidden>
      <path
        d="M20 50 C4 50 4 30 20 30 C20 14 44 8 54 22 C62 8 92 10 92 30 C110 28 114 50 98 50 Z"
        fill="white"
      />
    </svg>
  );
}

/** Fond ciel : dégradé, nuages qui dérivent et collines. */
export function Sky({ hills = true }: { hills?: boolean }) {
  const reduce = useReducedMotion();
  const clouds = [
    { top: '8%', w: 140, dur: 70, delay: -10, op: 0.9 },
    { top: '18%', w: 90, dur: 95, delay: -50, op: 0.7 },
    { top: '30%', w: 120, dur: 80, delay: -30, op: 0.6 },
    { top: '5%', w: 70, dur: 110, delay: -80, op: 0.5 },
  ];
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-sky/70 via-sky/25 to-cream"
      aria-hidden
    >
      {clouds.map((c, i) => (
        <div
          key={i}
          className={reduce ? 'absolute' : 'absolute animate-drift'}
          style={{
            top: c.top,
            left: reduce ? `${i * 25}%` : 0,
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
            opacity: c.op,
          }}
        >
          <Cloud style={{ width: c.w }} />
        </div>
      ))}
      {hills && (
        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="absolute bottom-0 h-32 w-full sm:h-40"
        >
          <path
            d="M0 120 C240 40 480 160 720 100 C960 40 1200 140 1440 80 L1440 200 L0 200 Z"
            fill="rgb(var(--c-grass) / 0.45)"
          />
          <path
            d="M0 160 C300 110 600 190 900 140 C1140 100 1300 170 1440 140 L1440 200 L0 200 Z"
            fill="rgb(var(--c-grass) / 0.7)"
          />
        </svg>
      )}
    </div>
  );
}

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
