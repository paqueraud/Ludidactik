/** Rayon « Écurie » de la boutique : robes du cheval du Grand Prix, achetées avec les Ludis. */
import { Check } from 'lucide-react';
import { useState } from 'react';
import { Button, LudiCoin } from '@/components/ui';
import { Horse } from '@/games/grand-prix/Horse';
import { acheterRobe, porterRobe } from '@/services/meta';
import { sfx } from '@/services/sfx';
import type { Profile } from '@/services/storage/db';
import { ROBES, possedeRobe, robeParId } from './robes';

export function BoutiqueRobes({
  profile,
  possedes,
  onMessage,
}: {
  profile: Profile;
  possedes: string[];
  onMessage(m: string): void;
}) {
  const [confirmer, setConfirmer] = useState<string | null>(null);
  const portee = robeParId(profile.robe).id;

  const porter = async (id: string) => {
    if (await porterRobe(profile.id, id)) {
      sfx.play('etoile');
      onMessage(`Ton cheval porte maintenant la robe ${robeParId(id).nom} !`);
    }
  };
  const acheterR = async (id: string) => {
    const r = await acheterRobe(profile.id, id);
    setConfirmer(null);
    if (r === 'ok') {
      sfx.play('piece');
      onMessage(`Super ! La robe ${robeParId(id).nom} est à toi : ton cheval la porte déjà.`);
    } else if (r === 'solde')
      onMessage('Il te manque encore quelques Ludis : joue une partie pour en gagner !');
    else if (r === 'deja') onMessage('Tu as déjà cette robe !');
  };

  return (
    <ul className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-label="Robes de cheval">
      {ROBES.map((r) => {
        const possede = possedeRobe(r.id, possedes);
        const manque = r.prix - profile.ludis;
        return (
          <li
            key={r.id}
            className={`carte flex flex-col items-center gap-2 p-3 text-center ${portee === r.id ? 'ring-4 ring-sun' : ''}`}
          >
            <div className="flex h-[88px] w-full items-end justify-center rounded-2xl bg-[#7BC96F]/40 pb-1">
              <Horse
                robe={r.robe}
                criniere={r.criniere}
                tapis={profile.avatar.haut}
                motif={r.motif}
                motifCouleur={r.motifCouleur}
                gait="arret"
                className="w-24"
              />
            </div>
            <span className="font-titre text-lg font-extrabold leading-tight">{r.nom}</span>
            {possede ? (
              portee === r.id ? (
                <span className="flex min-h-btn items-center gap-1 font-bold">
                  <Check aria-hidden /> Portée
                </span>
              ) : (
                <Button
                  variant="grape"
                  onClick={() => void porter(r.id)}
                  aria-label={`Mettre la robe ${r.nom} à mon cheval`}
                >
                  Choisir
                </Button>
              )
            ) : confirmer === r.id ? (
              <div className="flex flex-col items-center gap-2">
                <span className="flex items-center gap-1 font-bold">
                  Acheter pour {r.prix} <LudiCoin size={18} /> ?
                </span>
                <div className="flex gap-2">
                  <Button variant="grass" onClick={() => void acheterR(r.id)} autoFocus>
                    Oui
                  </Button>
                  <Button variant="blanc" onClick={() => setConfirmer(null)}>
                    Non
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button
                  variant="sun"
                  disabled={manque > 0}
                  onClick={() => setConfirmer(r.id)}
                  aria-label={`Acheter la robe ${r.nom} pour ${r.prix} Ludis`}
                >
                  {r.prix} <LudiCoin size={20} />
                </Button>
                {manque > 0 && <span className="text-xs font-bold text-ink-soft">Encore {manque} Ludis</span>}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
