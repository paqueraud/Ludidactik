import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { Play, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sky } from '@/components/Layout';
import { Ludo } from '@/components/Ludo';
import { Button, SpeakButton } from '@/components/ui';
import { useSession } from '@/stores/session';

const BIENVENUE = 'Bonjour ! Je suis Ludo. On révise les leçons de l’école en jouant ?';
const LETTRES = [...'Ludidactik'];
const COULEURS = ['text-coral', 'text-sun-dark', 'text-grass-dark', 'text-sky-dark', 'text-grape'];

/** Île flottante dessinée (décor de l'accueil). */
function Ile() {
  return (
    <svg viewBox="0 0 400 180" className="w-full max-w-md" aria-hidden>
      <ellipse cx="200" cy="168" rx="150" ry="10" fill="rgba(36,48,74,0.12)" />
      <path d="M40 90 C40 60 360 60 360 90 C350 130 260 160 200 162 C140 160 50 130 40 90 Z" fill="#C8873A" />
      <path d="M40 90 C40 60 360 60 360 90 C330 104 70 104 40 90 Z" fill="#7BD389" />
      <path
        d="M60 86 C80 70 120 68 150 78"
        stroke="#5DB86E"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* arbres */}
      <rect x="296" y="40" width="10" height="40" rx="4" fill="#8D5A3B" />
      <circle cx="301" cy="36" r="24" fill="#4CAF50" />
      <circle cx="320" cy="50" r="16" fill="#66BB6A" />
      {/* maisonnette-école */}
      <rect x="84" y="46" width="56" height="36" rx="4" fill="#FFF8EC" />
      <path d="M78 50 L112 22 L146 50 Z" fill="#FF7A6B" />
      <rect x="104" y="60" width="16" height="22" rx="3" fill="#8E7CFF" />
      <path d="M112 22 L112 6 L126 11 L112 16" stroke="#24304A" strokeWidth="2" fill="#4FC3F7" />
    </svg>
  );
}

export function Accueil() {
  const navigate = useNavigate();
  const connecte = useSession((s) => s.profileId);
  const reduce = useReducedMotion();
  // Parallaxe légère selon le pointeur
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const lx = useTransform(sx, (v) => v * 18);
  const ly = useTransform(sy, (v) => v * 10);

  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden px-4 py-10 text-center"
      onPointerMove={(e) => {
        if (reduce) return;
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      }}
    >
      <Sky />
      <h1 className="font-titre text-6xl font-extrabold drop-shadow-sm sm:text-8xl" aria-label="Ludidactik">
        {LETTRES.map((l, i) => (
          <motion.span
            key={i}
            className={`inline-block ${COULEURS[i % COULEURS.length]}`}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 12 }}
            aria-hidden
          >
            {l}
          </motion.span>
        ))}
      </h1>
      <p className="-mt-3 text-xl font-bold text-ink-soft">Réviser ses leçons en s’amusant</p>

      <motion.div style={{ x: lx, y: ly }} className="relative flex w-full flex-col items-center">
        <div className="carte relative z-10 mb-2 flex max-w-md items-center gap-3 px-5 py-3 text-left text-lg">
          <p>{BIENVENUE}</p>
          <SpeakButton text={BIENVENUE} />
          <span
            className="absolute -bottom-3 left-1/2 h-6 w-6 -translate-x-1/2 rotate-45 bg-card"
            aria-hidden
          />
        </div>
        <div className="relative -mb-16 mt-2">
          <Ludo pose="salut" size={150} />
        </div>
        <Ile />
      </motion.div>

      <Button
        size="xl"
        variant="grass"
        icon={<Play size={30} aria-hidden />}
        onClick={() => navigate(connecte ? '/accueil' : '/profils')}
        autoFocus
      >
        Jouer
      </Button>
      <button
        type="button"
        className="flex min-h-touch items-center gap-2 rounded-full bg-card/80 px-4 font-bold text-ink-soft"
        onClick={() => navigate('/parents')}
      >
        <ShieldCheck size={20} aria-hidden /> Espace parents
      </button>
      <p className="max-w-md text-sm text-ink-soft">
        Sans publicité, sans achat, et tout reste sur cet appareil.
      </p>
    </div>
  );
}
