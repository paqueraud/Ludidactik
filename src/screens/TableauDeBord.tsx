/**
 * Tableau de bord de l'enfant (accueil après connexion) : défis du jour, leçons, salle de jeux,
 * île, badges, boutique, scores, duel. Pas de FOMO : aucun compte à rebours, aucun « dépêche-toi ».
 */
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/avatar/Avatar';
import { Screen } from '@/components/Layout';
import { SpeakButton } from '@/components/ui';
import { dayKey } from '@/meta/dates';
import { IconeFlamme } from '@/meta/IconeFlamme';
import { Coffre, Duel, Echoppe, Livres, Manette, Medaille, MiniIle, Podium } from '@/meta/Illustrations';
import { bossDisponible, defisFaits, useDefisDuJourRow, useFlamme } from '@/services/meta';
import { sfx } from '@/services/sfx';
import type { Profile } from '@/services/storage/db';
import { AvecProfil } from './Parcours';

export function TableauDeBord() {
  return <AvecProfil>{(profile) => <Tableau profile={profile} />}</AvecProfil>;
}

function Tuile({
  to,
  titre,
  sousTitre,
  couleur,
  illustration,
  className = '',
  i,
}: {
  to: string;
  titre: string;
  sousTitre?: string;
  couleur: string;
  illustration: ReactNode;
  className?: string;
  i: number;
}) {
  const navigate = useNavigate();
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * i }}
      onClick={() => {
        sfx.play('pop');
        navigate(to);
      }}
      className={`btn-3d flex min-h-[132px] flex-col items-center justify-center gap-1 bg-gradient-to-br p-3 text-center ${couleur} ${className}`}
    >
      {illustration}
      <span className="font-titre text-xl font-extrabold leading-tight sm:text-2xl">{titre}</span>
      {sousTitre && <span className="text-sm font-bold opacity-80">{sousTitre}</span>}
    </motion.button>
  );
}

function Tableau({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const flamme = useFlamme(profile.id);
  const row = useDefisDuJourRow(profile.id);
  const faits = defisFaits(row ?? undefined);
  const total = row?.defis.length || 3;
  const boss = bossDisponible(profile.classe, dayKey()) && !row?.boss?.gagne;
  const coffreAOuvrir = !!row && row.defis.length > 0 && faits === total && !row.coffre;

  const etatDefis = !row
    ? '3 petits défis t’attendent'
    : coffreAOuvrir
      ? 'Bravo ! Viens ouvrir ton coffre'
      : faits === total
        ? 'Tous réussis, bravo !'
        : `${faits} sur ${total} réussi${faits > 1 ? 's' : ''}`;
  const bonjour = `Bonjour ${profile.prenom} ! ${
    flamme && flamme.jours > 0
      ? `Ta flamme brille depuis ${flamme.jours} jour${flamme.jours > 1 ? 's' : ''}.`
      : 'Prête ou prêt pour une petite aventure ?'
  } Que veux-tu faire ?`;

  return (
    <Screen large>
      <div className="carte mb-4 flex items-center gap-3 p-3 sm:p-4">
        <Avatar config={profile.avatar} size={72} fond="rgb(var(--c-sky) / 0.3)" humeur="joie" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl">Bonjour {profile.prenom} !</h1>
          <p className="flex items-center gap-1 font-bold text-ink-soft">
            {flamme && flamme.jours > 0 ? (
              <>
                <IconeFlamme size={24} vive={flamme.aujourdhui} /> {flamme.jours} jour
                {flamme.jours > 1 ? 's' : ''} de suite
              </>
            ) : (
              'Que veux-tu faire aujourd’hui ?'
            )}
          </p>
        </div>
        <SpeakButton text={bonjour} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => {
            sfx.play('pop');
            navigate('/defis');
          }}
          className="btn-3d col-span-2 flex min-h-[150px] items-center gap-3 bg-gradient-to-br from-coral to-sun p-4 text-left text-ink lg:row-span-2"
          aria-label={`Défis du jour : ${etatDefis}`}
        >
          <Coffre size={104} ouvert={!!row?.coffre} />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-titre text-2xl font-extrabold leading-tight sm:text-3xl">
              Défis du jour
            </span>
            <span className="font-bold">{etatDefis}</span>
            <span className="flex gap-1.5" aria-hidden>
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  className={`h-4 w-4 rounded-full border-2 border-ink/40 ${i < faits ? 'bg-grass-dark' : 'bg-card/70'}`}
                />
              ))}
            </span>
            {boss && (
              <span className="mt-1 w-fit rounded-full bg-grass-dark px-3 py-0.5 text-sm font-bold text-white">
                🐉 Défi bonus du week-end !
              </span>
            )}
          </span>
        </motion.button>
        <Tuile
          i={1}
          to="/jouer"
          titre="Mes leçons"
          sousTitre="Réviser en classe"
          couleur="from-sky/70 to-sky text-ink"
          illustration={<Livres size={64} />}
        />
        <Tuile
          i={2}
          to="/jeux"
          titre="Salle de jeux"
          sousTitre="Tous les jeux"
          couleur="from-grape/60 to-grape text-white"
          illustration={<Manette size={64} />}
        />
        <Tuile
          i={3}
          to="/ile"
          titre="Mon île"
          sousTitre="Ce que je sais"
          couleur="from-grass/70 to-sky/60 text-ink"
          illustration={<MiniIle size={72} />}
        />
        <Tuile
          i={4}
          to="/badges"
          titre="Mes badges"
          couleur="from-sun/80 to-sun text-ink"
          illustration={<Medaille size={56} />}
        />
        <Tuile
          i={5}
          to="/boutique"
          titre="Boutique"
          sousTitre="Habille ton avatar"
          couleur="from-coral/60 to-coral text-ink"
          illustration={<Echoppe size={64} />}
        />
        <Tuile
          i={6}
          to="/scores"
          titre="Scores"
          sousTitre="Mes records"
          couleur="from-cream-deep to-sun/60 text-ink"
          illustration={<Podium size={64} />}
        />
        <Tuile
          i={7}
          to="/duel"
          titre="Duel à deux"
          sousTitre="Sur le même écran"
          couleur="from-sky/60 to-coral/70 text-ink"
          illustration={<Duel size={64} />}
        />
        <Tuile
          i={8}
          to="/profil"
          titre="Mon profil"
          couleur="from-card to-cream-deep text-ink"
          illustration={<Avatar config={profile.avatar} size={60} compagnon />}
        />
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Les erreurs ne font jamais perdre de Ludis : on apprend en se trompant !
      </p>
    </Screen>
  );
}
