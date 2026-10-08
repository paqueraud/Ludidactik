import { Dices, Lock } from 'lucide-react';
import { useState } from 'react';
import { LudiCoin } from '@/components/ui';
import { sfx } from '@/services/sfx';
import { Avatar, CompanionSvg } from './Avatar';
import {
  ACCESSOIRES,
  type AvatarConfig,
  BOUCHES,
  BOUTIQUE,
  COIFFURES,
  COMPAGNONS,
  COULEURS_CHEVEUX,
  COULEURS_HAUT,
  LIBELLES,
  PIECES_VERROUILLEES,
  TEINTS,
  VISAGES,
  YEUX,
  randomAvatar,
} from './parts';

type Onglet = 'visage' | 'cheveux' | 'habits' | 'accessoire' | 'compagnon';

const ONGLETS: { id: Onglet; label: string; icone: string }[] = [
  { id: 'visage', label: 'Visage', icone: '🙂' },
  { id: 'cheveux', label: 'Cheveux', icone: '💇' },
  { id: 'habits', label: 'Habits', icone: '👕' },
  { id: 'accessoire', label: 'Accessoires', icone: '🎩' },
  { id: 'compagnon', label: 'Compagnon', icone: '🐾' },
];

interface Props {
  value: AvatarConfig;
  onChange(v: AvatarConfig): void;
  /** Pièces de boutique déjà possédées. */
  possedes?: string[];
}

function Swatches({
  colors,
  value,
  onPick,
  label,
}: {
  colors: string[];
  value: string;
  onPick(c: string): void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={`${label} ${c}`}
          className={`h-12 w-12 rounded-full border-4 shadow-pop-sm ${value === c ? 'scale-110 border-ink' : 'border-white'}`}
          style={{ background: c }}
          onClick={() => {
            sfx.play('pop');
            onPick(c);
          }}
        />
      ))}
    </div>
  );
}

export function AvatarEditor({ value, onChange, possedes = [] }: Props) {
  const [onglet, setOnglet] = useState<Onglet>('visage');
  const set = <K extends keyof AvatarConfig>(k: K, v: AvatarConfig[K]) => onChange({ ...value, [k]: v });

  const Options = <K extends keyof AvatarConfig>({
    k,
    options,
    preview,
  }: {
    k: K;
    options: readonly AvatarConfig[K][];
    preview?: (o: AvatarConfig[K]) => JSX.Element;
  }) => (
    <div role="radiogroup" aria-label={String(k)} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {options.map((o) => {
        const prix = BOUTIQUE[o as keyof typeof BOUTIQUE];
        const verrou = PIECES_VERROUILLEES.has(String(o)) && !possedes.includes(String(o));
        return (
          <button
            key={String(o)}
            type="button"
            role="radio"
            aria-checked={value[k] === o}
            disabled={verrou}
            title={
              verrou
                ? prix !== undefined
                  ? `À acheter dans la boutique (${prix} Ludis)`
                  : 'Un trésor à trouver dans le coffre des défis du jour'
                : undefined
            }
            className={`relative flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-2xl border-4 bg-cream p-1 text-sm font-bold ${
              value[k] === o ? 'border-grape' : 'border-transparent'
            } ${verrou ? 'opacity-60' : ''}`}
            onClick={() => {
              sfx.play('pop');
              set(k, o);
            }}
          >
            {preview ? preview(o) : <Avatar config={{ ...value, [k]: o }} size={56} compagnon={false} />}
            <span>{LIBELLES[String(o)] ?? String(o)}</span>
            {verrou && (
              <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded-full bg-ink/80 px-1.5 text-xs text-white">
                <Lock size={11} aria-hidden />
                {prix !== undefined ? (
                  <>
                    {prix} <LudiCoin size={12} />
                  </>
                ) : (
                  <span aria-label="trésor du coffre">🎁</span>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[auto,minmax(0,1fr)]">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-sky/30 p-2">
          <Avatar config={value} size={180} />
        </div>
        <button
          type="button"
          className="btn-3d flex min-h-touch items-center gap-2 bg-sun px-4"
          onClick={() => {
            sfx.play('pop');
            onChange(randomAvatar());
          }}
        >
          <Dices aria-hidden /> Au hasard
        </button>
      </div>
      <div className="carte min-w-0 p-3">
        <div className="mb-3 flex gap-1 overflow-x-auto pb-1" role="tablist">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={onglet === o.id}
              className={`flex min-h-touch shrink-0 items-center gap-1 rounded-full px-4 font-bold ${onglet === o.id ? 'bg-grape text-white' : 'bg-cream'}`}
              onClick={() => setOnglet(o.id)}
            >
              <span aria-hidden>{o.icone}</span> {o.label}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {onglet === 'visage' && (
            <>
              <Swatches
                colors={TEINTS}
                value={value.teint}
                onPick={(c) => set('teint', c)}
                label="Couleur de peau"
              />
              <Options k="visage" options={VISAGES} />
              <Options k="yeux" options={YEUX} />
              <Options k="bouche" options={BOUCHES} />
            </>
          )}
          {onglet === 'cheveux' && (
            <>
              <Swatches
                colors={COULEURS_CHEVEUX}
                value={value.couleurCheveux}
                onPick={(c) => set('couleurCheveux', c)}
                label="Couleur des cheveux"
              />
              <Options k="coiffure" options={COIFFURES} />
            </>
          )}
          {onglet === 'habits' && (
            <Swatches
              colors={COULEURS_HAUT}
              value={value.haut}
              onPick={(c) => set('haut', c)}
              label="Couleur du haut"
            />
          )}
          {onglet === 'accessoire' && <Options k="accessoire" options={ACCESSOIRES} />}
          {onglet === 'compagnon' && (
            <Options
              k="compagnon"
              options={COMPAGNONS}
              preview={(o) => (
                <svg viewBox="0 0 50 50" width={52} height={52} aria-hidden>
                  {o === 'aucun' ? (
                    <text x="25" y="32" textAnchor="middle" fontSize="20">
                      ∅
                    </text>
                  ) : (
                    <CompanionSvg type={o} />
                  )}
                </svg>
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
