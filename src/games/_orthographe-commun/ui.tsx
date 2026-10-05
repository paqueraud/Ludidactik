/**
 * Composants communs aux jeux d'orthographe : correction lettre à lettre bienveillante,
 * clavier à l'écran coloré (Wordle, bonhomme de neige), bouton « entendre le mot ».
 */
import { motion } from 'framer-motion';
import { ArrowBigUp, CornerDownLeft, Delete, Ear } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { SpellingItem } from '@/content/schemas';
import { type DiffOp, letterDiff } from '@/engine/answer';
import type { SpeechService } from '@/services/speech';
import { sfx } from '@/services/sfx';
import { direMot, peutEntendre } from './voix';

/* ------------------------------------------------------------------ */
/* Correction lettre à lettre                                          */
/* ------------------------------------------------------------------ */

/** Ce que l'enfant a écrit, corrigé : lettres oubliées (vert souligné), à changer (jaune), en trop (barrées). */
export function DiffMot({ diff, className = '' }: { diff: DiffOp[]; className?: string }) {
  return (
    <span
      className={`inline-flex flex-wrap justify-center font-titre text-3xl font-extrabold tracking-wide ${className}`}
      aria-hidden
    >
      {diff.map((op, i) => {
        if (op.type === 'ok') return <span key={i}>{op.char === ' ' ? ' ' : op.char}</span>;
        if (op.type === 'missing')
          return (
            <span key={i} className="rounded bg-grass/40 px-0.5 text-grass-dark underline decoration-4">
              {op.char === ' ' ? ' ' : op.char}
            </span>
          );
        if (op.type === 'sub')
          return (
            <span key={i} className="rounded bg-sun/70 px-0.5">
              {op.char}
            </span>
          );
        return (
          <span key={i} className="px-0.5 text-coral line-through">
            {op.given}
          </span>
        );
      })}
    </span>
  );
}

/** Légende de la correction (lisible à voix haute). */
export function LegendeDiff() {
  return (
    <p className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-ink-soft">
      <span>
        <span className="rounded bg-sun/70 px-1 font-bold text-ink">a</span> à changer
      </span>
      <span>
        <span className="rounded bg-grass/40 px-1 font-bold text-grass-dark underline">a</span> oubliée
      </span>
      <span>
        <span className="px-1 font-bold text-coral line-through">a</span> en trop
      </span>
    </p>
  );
}

/**
 * Panneau de correction après une erreur sur un mot : message encourageant, ce que l'enfant a
 * écrit corrigé lettre à lettre, le mot juste (🔊), l'explication et « Continuer » (Entrée).
 */
export function CorrectionMot({
  donne,
  attendu,
  message,
  explication,
  onContinue,
  libelleContinuer = 'Continuer',
  children,
}: {
  donne: string | null;
  attendu: string;
  message: string;
  explication?: string;
  onContinue?: () => void;
  libelleContinuer?: string;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!onContinue) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onContinue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col items-center gap-2 rounded-2xl bg-coral/10 p-3 text-center"
      role="status"
    >
      <p className="text-xl font-bold">{message}</p>
      {donne && donne.trim() && (
        <div className="max-w-full rounded-2xl bg-card px-4 py-2">
          <div className="text-sm text-ink-soft">Ce que tu as écrit, corrigé :</div>
          <DiffMot diff={letterDiff(donne, attendu)} />
          <LegendeDiff />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-ink-soft">On écrit :</span>
        <span className="break-all font-titre text-4xl font-extrabold text-grass-dark">{attendu}</span>
        <SpeakButton text={attendu} size={44} label={`Écouter : ${attendu}`} />
      </div>
      {explication && (
        <div className="flex items-start gap-2 text-left">
          <SpeakButton text={explication} size={40} label="Écouter l’explication" />
          <p>{explication}</p>
        </div>
      )}
      {children}
      {onContinue && (
        <Button variant="grass" className="mt-1 w-full max-w-xs" onClick={onContinue} autoFocus>
          {libelleContinuer}
        </Button>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Entendre le mot (voix du parent prioritaire)                        */
/* ------------------------------------------------------------------ */

export function BoutonEntendre({
  speech,
  item,
  restants,
  onUse,
  disabled,
  avecPhrase = false,
  label = 'Entendre le mot',
}: {
  speech: SpeechService;
  item: SpellingItem;
  /** Nombre d'écoutes restantes (Infinity = illimité). */
  restants: number;
  onUse?: () => void;
  disabled?: boolean;
  avecPhrase?: boolean;
  label?: string;
}) {
  if (!peutEntendre(speech, item)) return null;
  const epuise = restants <= 0;
  return (
    <Button
      variant="sun"
      icon={<Ear aria-hidden />}
      disabled={disabled || epuise}
      onClick={() => {
        onUse?.();
        void direMot(speech, item, avecPhrase);
      }}
      aria-label={label}
    >
      {label}
      {Number.isFinite(restants) ? ` (${restants})` : ''}
    </Button>
  );
}

/** Badge « Mot de la semaine » pour les listes des parents. */
export function BadgeParents({ item }: { item: SpellingItem }) {
  if (item.source !== 'parents') return null;
  return (
    <span className="rounded-full bg-grape/15 px-3 py-1 text-sm font-bold text-grape-dark">
      Mot de la semaine
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Clavier coloré                                                      */
/* ------------------------------------------------------------------ */

export type EtatTouche = 'bien' | 'accent' | 'mal_place' | 'absent' | 'utilise';

const STYLE_TOUCHE: Record<EtatTouche, string> = {
  bien: 'bg-grass-dark text-white',
  accent: 'bg-grass/50 text-ink ring-2 ring-sun-dark',
  mal_place: 'bg-sun text-ink',
  absent: 'bg-ink/25 text-ink/60',
  utilise: 'bg-ink/15 text-ink/40',
};

const RANGS = [
  ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
  ['w', 'x', 'c', 'v', 'b', 'n'],
];
const ACCENTS = ['é', 'è', 'ê', 'à', 'â', 'ç', 'ù', 'û', 'î', 'ô', 'ë', 'ï', 'œ'];
const toucheBase =
  'btn-3d flex min-w-0 flex-1 items-center justify-center rounded-xl font-titre shadow-pop-sm active:translate-y-[3px] active:shadow-none';

/**
 * Clavier AZERTY à l'écran dont chaque touche peut porter un état (couleur + libellé lisible).
 * `accents=false` : pas de rangée d'accents (bonhomme de neige : on devine les lettres de base).
 */
export function ClavierLettres({
  onKey,
  onDelete,
  onSubmit,
  etats,
  disabled,
  accents = true,
  majuscule = false,
  label = 'Clavier',
  desactiverUtilises = false,
}: {
  onKey(k: string): void;
  onDelete?: () => void;
  onSubmit?: () => void;
  etats?: Map<string, EtatTouche>;
  disabled?: boolean;
  accents?: boolean;
  majuscule?: boolean;
  label?: string;
  /** Les touches déjà jouées ne peuvent plus être touchées (bonhomme de neige). */
  desactiverUtilises?: boolean;
}) {
  const [maj, setMaj] = useState(false);
  const libelle: Record<EtatTouche, string> = {
    bien: 'bien placée',
    accent: 'il manque l’accent',
    mal_place: 'mal placée',
    absent: 'absente',
    utilise: 'déjà jouée',
  };
  const touche = (c: string, extra = '') => {
    const etat = etats?.get(c);
    const out = maj ? c.toUpperCase() : c;
    const bloque = !!disabled || (desactiverUtilises && !!etat);
    return (
      <button
        key={c}
        type="button"
        className={`${toucheBase} h-12 text-xl sm:h-14 ${etat ? STYLE_TOUCHE[etat] : `bg-card text-ink ${extra}`}`}
        onClick={() => {
          if (bloque) return;
          sfx.play('tic');
          onKey(out);
          setMaj(false);
        }}
        disabled={bloque}
        aria-label={etat ? `${out}, ${libelle[etat]}` : out}
      >
        {out}
      </button>
    );
  };
  return (
    <div className="flex w-full max-w-3xl flex-col gap-1.5" role="group" aria-label={label}>
      {accents && <div className="flex gap-1">{ACCENTS.map((c) => touche(c, 'bg-sun/30'))}</div>}
      {RANGS.slice(0, 2).map((r, i) => (
        <div key={i} className="flex gap-1">
          {r.map((c) => touche(c))}
        </div>
      ))}
      <div className="flex gap-1">
        {majuscule && (
          <button
            type="button"
            className={`${toucheBase} h-12 flex-[1.2] sm:h-14 ${maj ? 'bg-grape text-white' : 'bg-card'}`}
            onClick={() => !disabled && setMaj((m) => !m)}
            disabled={disabled}
            aria-label="Majuscule"
            aria-pressed={maj}
          >
            <ArrowBigUp size={24} aria-hidden />
          </button>
        )}
        {RANGS[2]!.map((c) => touche(c))}
        {onDelete && (
          <button
            type="button"
            className={`${toucheBase} h-12 flex-[1.4] bg-coral/15 sm:h-14`}
            onClick={() => {
              if (disabled) return;
              sfx.play('tic');
              onDelete();
            }}
            disabled={disabled}
            aria-label="Effacer"
          >
            <Delete size={24} aria-hidden />
          </button>
        )}
        {onSubmit && (
          <button
            type="button"
            className={`${toucheBase} h-12 flex-[1.8] bg-grass-dark text-white sm:h-14`}
            onClick={() => {
              if (disabled) return;
              sfx.play('tic');
              onSubmit();
            }}
            disabled={disabled}
            aria-label="Valider"
          >
            <CornerDownLeft size={22} aria-hidden /> OK
          </button>
        )}
      </div>
    </div>
  );
}
