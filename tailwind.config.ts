import type { Config } from 'tailwindcss';

// Les couleurs passent par des variables CSS (canaux RGB) pour le mode sombre automatique.
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sky: { DEFAULT: token('sky'), dark: token('sky-dark') },
        grass: { DEFAULT: token('grass'), dark: token('grass-dark') },
        sun: { DEFAULT: token('sun'), dark: token('sun-dark') },
        coral: { DEFAULT: token('coral'), dark: token('coral-dark') },
        grape: { DEFAULT: token('grape'), dark: token('grape-dark') },
        ink: { DEFAULT: token('ink'), soft: token('ink-soft') },
        cream: { DEFAULT: token('cream'), deep: token('cream-deep') },
        card: token('card'),
        // Matières
        maths: token('maths'),
        francais: token('francais'),
        histoire: token('histoire'),
        geographie: token('geographie'),
        sciences: token('sciences'),
        emc: token('emc'),
        anglais: token('anglais'),
        // Niveaux
        facile: token('grass'),
        normal: token('sky-dark'),
        plusloin: token('grape'),
      },
      fontFamily: {
        titre: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        texte: ['Andika', 'system-ui', 'sans-serif'],
        dys: ['OpenDyslexic', 'Andika', 'sans-serif'],
      },
      fontSize: { base: ['1.125rem', { lineHeight: '1.5' }] },
      borderRadius: { card: '24px', btn: '18px' },
      minHeight: { touch: '48px', btn: '56px' },
      minWidth: { touch: '48px', btn: '56px' },
      boxShadow: {
        pop: '0 6px 0 0 rgb(0 0 0 / 0.18)',
        'pop-sm': '0 3px 0 0 rgb(0 0 0 / 0.18)',
        soft: '0 10px 30px -10px rgb(36 48 74 / 0.35)',
      },
      keyframes: {
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        drift: { from: { transform: 'translateX(-20vw)' }, to: { transform: 'translateX(120vw)' } },
        wiggle: { '0%,100%': { transform: 'rotate(-4deg)' }, '50%': { transform: 'rotate(4deg)' } },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%,60%': { transform: 'translateX(-8px)' },
          '40%,80%': { transform: 'translateX(8px)' },
        },
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
        drift: 'drift linear infinite',
        wiggle: 'wiggle 1.2s ease-in-out infinite',
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
