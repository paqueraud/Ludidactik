/**
 * Boutique d'avatar : on achète des pièces avec les Ludis gagnés en jouant (jamais d'argent réel,
 * aucun lien externe), on les essaie avant, puis on les porte. Les trésors du coffre s'y équipent aussi.
 */
import { motion } from 'framer-motion';
import { Check, ShoppingBag, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/avatar/Avatar';
import { type AvatarConfig, BOUTIQUE, COFFRE, COMPAGNONS, LIBELLES, avecObjet } from '@/avatar/parts';
import { Screen } from '@/components/Layout';
import { Button, LudiCoin, SpeakButton } from '@/components/ui';
import { acheter, useInventaire } from '@/services/meta';
import { updateProfile } from '@/services/profiles';
import { sfx } from '@/services/sfx';
import type { Profile } from '@/services/storage/db';
import { AvecProfil } from './Parcours';

export function Boutique() {
  return <AvecProfil>{(profile) => <BoutiqueInner key={profile.id} profile={profile} />}</AvecProfil>;
}

const estCompagnon = (id: string) => (COMPAGNONS as readonly string[]).includes(id);
const porte = (a: AvatarConfig, id: string) => a.accessoire === id || a.compagnon === id;

function BoutiqueInner({ profile }: { profile: Profile }) {
  const possedes = useInventaire(profile.id) ?? [];
  const [essai, setEssai] = useState<string | null>(null);
  const [confirmer, setConfirmer] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const apercu = essai ? avecObjet(profile.avatar, essai) : profile.avatar;
  const articles = Object.entries(BOUTIQUE).sort((a, b) => a[1] - b[1]) as [string, number][];
  const intro = `Bienvenue dans la boutique ! Tu as ${profile.ludis} Ludis. Touche un objet pour l’essayer, puis achète-le avec tes Ludis. Ici, tout s’achète seulement avec les Ludis gagnés en jouant.`;

  const equiper = async (id: string) => {
    await updateProfile(profile.id, { avatar: avecObjet(profile.avatar, id) });
    sfx.play('etoile');
    setEssai(null);
    setMessage(`Tu portes maintenant : ${LIBELLES[id] ?? id} !`);
  };
  const retirer = async (id: string) => {
    await updateProfile(profile.id, {
      avatar: estCompagnon(id)
        ? { ...profile.avatar, compagnon: 'aucun' }
        : { ...profile.avatar, accessoire: 'aucun' },
    });
    setMessage(`${LIBELLES[id] ?? id} : rangé dans ton coffre à vêtements.`);
  };

  const acheterArticle = async (id: string) => {
    const r = await acheter(profile.id, id);
    setConfirmer(null);
    if (r === 'ok') {
      sfx.play('piece');
      await updateProfile(profile.id, { avatar: avecObjet(profile.avatar, id) });
      setEssai(null);
      setMessage(`Super ! ${LIBELLES[id] ?? id} est à toi, et ton avatar le porte déjà.`);
    } else if (r === 'solde')
      setMessage('Il te manque encore quelques Ludis : joue une partie pour en gagner !');
    else if (r === 'deja') setMessage('Tu as déjà cet objet !');
  };

  const Carte = ({ id, prix }: { id: string; prix?: number }) => {
    const possede = possedes.includes(id);
    const tresor = prix === undefined;
    const enEssai = essai === id;
    const nom = LIBELLES[id] ?? id;
    const manque = prix !== undefined ? prix - profile.ludis : 0;
    return (
      <li
        className={`carte flex flex-col items-center gap-2 p-3 text-center ${enEssai ? 'ring-4 ring-grape' : ''}`}
      >
        <button
          type="button"
          className="flex flex-col items-center gap-1 rounded-2xl p-1"
          aria-label={tresor && !possede ? `${nom} : trésor à trouver dans le coffre` : `Essayer : ${nom}`}
          aria-pressed={enEssai}
          disabled={tresor && !possede}
          onClick={() => {
            sfx.play('pop');
            setEssai(enEssai ? null : id);
          }}
        >
          <span className={tresor && !possede ? 'opacity-40 grayscale' : ''}>
            <Avatar config={avecObjet(profile.avatar, id)} size={88} fond="rgb(var(--c-sky) / 0.25)" />
          </span>
          <span className="font-titre text-lg font-extrabold leading-tight">
            {tresor && !possede ? '???' : nom}
          </span>
        </button>
        {possede ? (
          porte(profile.avatar, id) ? (
            <Button variant="blanc" onClick={() => void retirer(id)} icon={<Check aria-hidden />}>
              Porté
            </Button>
          ) : (
            <Button variant="grape" onClick={() => void equiper(id)}>
              Porter
            </Button>
          )
        ) : tresor ? (
          <span className="flex min-h-btn items-center px-2 text-sm font-bold text-ink-soft">
            🎁 À trouver dans le coffre des défis
          </span>
        ) : confirmer === id ? (
          <div className="flex flex-col items-center gap-2">
            <span className="flex items-center gap-1 font-bold">
              Acheter pour {prix} <LudiCoin size={18} /> ?
            </span>
            <div className="flex gap-2">
              <Button variant="grass" onClick={() => void acheterArticle(id)} autoFocus>
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
              onClick={() => setConfirmer(id)}
              aria-label={`Acheter ${nom} pour ${prix} Ludis`}
            >
              {prix} <LudiCoin size={20} />
            </Button>
            {manque > 0 && <span className="text-xs font-bold text-ink-soft">Encore {manque} Ludis</span>}
          </>
        )}
      </li>
    );
  };

  return (
    <Screen titre="La boutique" aLire={intro} retour="/accueil" large>
      <div className="grid gap-4 md:grid-cols-[minmax(0,280px),minmax(0,1fr)]">
        <div className="carte flex flex-col items-center gap-3 self-start p-4 text-center md:sticky md:top-24">
          <motion.div key={essai ?? 'actuel'} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <Avatar
              config={apercu}
              size={170}
              fond="rgb(var(--c-sky) / 0.3)"
              humeur={essai ? 'joie' : 'normal'}
            />
          </motion.div>
          <p className="font-bold">{essai ? `Essai : ${LIBELLES[essai] ?? essai}` : 'Mon avatar'}</p>
          <div className="flex items-center gap-2 rounded-full bg-sun/30 px-4 py-2 font-titre text-2xl font-extrabold">
            <LudiCoin size={28} /> {profile.ludis}
          </div>
          <SpeakButton text={intro} />
          <Link to="/profil" className="flex min-h-touch items-center font-bold underline">
            Changer mon avatar (coiffure, couleurs…)
          </Link>
        </div>
        <div className="min-w-0">
          {message && (
            <p role="status" className="carte mb-3 p-3 font-bold">
              {message}
            </p>
          )}
          <h2 className="mb-2 flex items-center gap-2 text-2xl">
            <ShoppingBag aria-hidden /> Costumes et compagnons
          </h2>
          <ul className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {articles.map(([id, prix]) => (
              <Carte key={id} id={id} prix={prix} />
            ))}
          </ul>
          <h2 className="mb-2 flex items-center gap-2 text-2xl">
            <Sparkles aria-hidden /> Trésors du coffre
          </h2>
          <p className="mb-2 text-ink-soft">
            Ils ne s’achètent pas : on les gagne en ouvrant le coffre des défis du jour.
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {COFFRE.map((id) => (
              <Carte key={id} id={id} />
            ))}
          </ul>
          <p className="mt-4 text-center text-sm text-ink-soft">
            Pas d’argent réel ici : seulement des Ludis gagnés en jouant. Une erreur ne fait jamais perdre de
            Ludis.
          </p>
        </div>
      </div>
    </Screen>
  );
}
