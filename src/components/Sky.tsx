/** Fond ciel (dégradé, nuages, collines) : fichier à part pour rester léger sur l'écran d'accueil. */
import { useReducedMotion } from 'framer-motion';

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
