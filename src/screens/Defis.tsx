/**
 * Défis du jour (GAMIFICATION §4) : 3 vraies parties tirées selon les leçons en cours, les items à
 * revoir et une révision ancienne, aux modalités variées ; coffre au trésor quand les 3 sont réussis ;
 * flamme de la semaine (avec jours gelés) ; défi bonus « Boss » le week-end.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/avatar/Avatar';
import { LIBELLES, avecObjet } from '@/avatar/parts';
import { Confetti } from '@/components/Confetti';
import { Screen } from '@/components/Layout';
import { Ludo } from '@/components/Ludo';
import { Button, LudiCoin, SpeakButton, Stars } from '@/components/ui';
import { getLesson } from '@/content';
import { LEVEL_META } from '@/content/meta';
import { getGame } from '@/games/registry';
import { dayKey } from '@/meta/dates';
import { FAMILLE_META, MOTIF_META } from '@/meta/defis';
import { IconeFlamme } from '@/meta/IconeFlamme';
import { Coffre, Dragon } from '@/meta/Illustrations';
import {
  bossDisponible,
  defisDuJour,
  defisFaits,
  joursDeLaSemaine,
  ouvrirCoffre,
  useDefisDuJourRow,
  useFlamme,
  useJoursActifs,
} from '@/services/meta';
import { sfx } from '@/services/sfx';
import type { CoffreContenu, DefiRow, Profile } from '@/services/storage/db';
import { useSettings } from '@/stores/settings';
import { AvecProfil } from './Parcours';

export function Defis() {
  return <AvecProfil>{(profile) => <DefisInner key={profile.id} profile={profile} />}</AvecProfil>;
}

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const JOURS_LONGS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

function DefisInner({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const settings = useSettings();
  const today = dayKey();
  const row = useDefisDuJourRow(profile.id, today);
  const flamme = useFlamme(profile.id);
  const actifs = useJoursActifs(profile.id);
  const [erreur, setErreur] = useState(false);
  const [coffre, setCoffre] = useState<CoffreContenu | null>(null);

  // Tirage (une fois par jour, enregistré) dès que les réglages sont chargés.
  useEffect(() => {
    if (!settings.loaded || row !== null) return;
    defisDuJour(profile, {
      programmeHG: settings.programmeHG,
      micro: settings.micro,
      masquerPuberte: !settings.puberte,
    }).catch(() => setErreur(true));
  }, [settings.loaded, settings.programmeHG, settings.micro, settings.puberte, profile, row]);

  const faits = defisFaits(row ?? undefined);
  const defis = row?.defis ?? [];
  const tousFaits = defis.length > 0 && faits === defis.length;
  const boss = bossDisponible(profile.classe, today);
  const consigne = tousFaits
    ? 'Bravo, tu as réussi tes trois défis du jour !'
    : 'Voici tes trois défis du jour. Réussis-les pour ouvrir le coffre au trésor. Une étoile suffit pour réussir un défi !';

  const lancer = (d: DefiRow) => {
    sfx.play('pop');
    navigate(`/partie/${encodeURIComponent(d.lessonId)}/${d.gameId}/${d.level}`, {
      state: { retour: '/defis', retourLabel: 'Mes défis' },
    });
  };

  const semaine = joursDeLaSemaine(today);

  return (
    <Screen titre="Défis du jour" aLire={consigne} retour="/accueil" large>
      {/* Flamme de la semaine */}
      <section aria-labelledby="flamme-titre" className="carte mb-4 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <IconeFlamme size={40} vive={!!flamme?.aujourdhui} />
          <h2 id="flamme-titre" className="text-2xl">
            {flamme && flamme.jours > 0
              ? `Ta flamme : ${flamme.jours} jour${flamme.jours > 1 ? 's' : ''}`
              : 'Allume ta flamme !'}
          </h2>
          {flamme?.enVacances && (
            <p role="status" className="w-full rounded-2xl bg-sky/30 px-3 py-2 font-bold">
              🏖️ C’est les vacances, ta flamme se repose ! Elle ne s’éteindra pas, même sans défi.
            </p>
          )}
          <span className="text-sm text-ink-soft">
            Un défi réussi par jour l’entretient. 2 jours de repos par semaine sont gelés : elle ne s’éteint
            pas.
          </span>
        </div>
        <ol className="grid grid-cols-7 gap-1 sm:gap-2" aria-label="Ta semaine">
          {semaine.map((d, i) => {
            const actif = !!actifs?.has(d);
            const gele = !!flamme?.gels.includes(d);
            const estAujourdhui = d === today;
            const vacances = !!flamme?.vacances.includes(d) || (d === today && !!flamme?.enVacances);
            const etat = actif
              ? 'défi réussi'
              : vacances
                ? 'vacances, flamme au repos'
                : gele
                  ? 'jour gelé'
                  : d > today
                    ? 'à venir'
                    : 'pas de défi';
            return (
              <li
                key={d}
                className={`flex flex-col items-center gap-1 rounded-2xl py-2 ${estAujourdhui ? 'bg-sun/40 ring-2 ring-sun-dark' : 'bg-cream'}`}
                aria-label={`${JOURS_LONGS[i]} : ${etat}`}
              >
                <span className="text-sm font-bold">{JOURS[i]}</span>
                {actif ? (
                  <IconeFlamme size={26} vive />
                ) : gele ? (
                  <IconeFlamme size={26} vive={false} gelee />
                ) : (
                  <span className="h-[26px] w-[26px] rounded-full border-2 border-dashed border-ink/20" />
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {erreur && (
        <p className="carte mb-4 p-4 font-bold" role="alert">
          Oups, les défis n’ont pas pu être préparés. Recharge la page pour réessayer.
        </p>
      )}

      {!row && !erreur && (
        <div className="carte flex items-center gap-4 p-5" role="status">
          <Ludo pose="pense" size={80} />
          <p className="text-lg">Ludo prépare tes défis…</p>
        </div>
      )}

      {row && defis.length === 0 && (
        <div className="carte flex items-center gap-4 p-5">
          <Ludo pose="pense" size={80} />
          <p className="text-lg">
            Pas de défi possible aujourd’hui : demande à un parent de choisir tes leçons en cours.
          </p>
        </div>
      )}

      {defis.length > 0 && (
        <>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-2xl">
              Mes 3 défis · {faits}/{defis.length}
            </h2>
            <SpeakButton text={consigne} size={40} />
          </div>
          <ol className="grid gap-3 md:grid-cols-3">
            {defis.map((d, i) => (
              <CarteDefi
                key={`${d.lessonId}-${d.gameId}`}
                defi={d}
                numero={i + 1}
                onJouer={() => lancer(d)}
              />
            ))}
          </ol>
        </>
      )}

      {defis.length > 0 && (
        <section
          aria-labelledby="coffre-titre"
          className="carte mt-4 flex flex-col items-center gap-3 p-5 text-center"
        >
          <h2 id="coffre-titre" className="text-2xl">
            Le coffre au trésor
          </h2>
          {row?.coffre || coffre ? (
            <ContenuCoffre contenu={(coffre ?? row?.coffre)!} profile={profile} ouvertMaintenant={!!coffre} />
          ) : tousFaits ? (
            <>
              <motion.div
                animate={{ rotate: [0, -4, 4, -4, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
              >
                <Coffre size={140} />
              </motion.div>
              <Button
                variant="sun"
                size="xl"
                autoFocus
                onClick={async () => {
                  const c = await ouvrirCoffre(profile.id, today);
                  if (c) {
                    sfx.play('fanfare');
                    setCoffre(c);
                  }
                }}
              >
                Ouvrir le coffre !
              </Button>
            </>
          ) : (
            <>
              <Coffre size={110} className="opacity-80" />
              <p className="font-bold text-ink-soft">
                Encore {defis.length - faits} défi{defis.length - faits > 1 ? 's' : ''} pour l’ouvrir. Il
                contient des Ludis et un trésor pour ton avatar !
              </p>
            </>
          )}
        </section>
      )}

      {boss && (
        <section className="carte mt-4 flex flex-wrap items-center gap-4 bg-gradient-to-r from-grass/40 to-sky/30 p-5">
          <Dragon size={110} />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl">Défi bonus du week-end : le Dragon des tables</h2>
            <p>
              {row?.boss?.gagne
                ? 'Tu as vaincu le dragon ce week-end. Tu peux le défier encore pour t’entraîner !'
                : '30 calculs pour vider sa barre de vie. Prends ton temps : il n’y a pas de chrono.'}
            </p>
          </div>
          <Button
            variant="grass"
            size="lg"
            icon={<Play aria-hidden />}
            onClick={() => navigate('/defis/boss')}
          >
            {row?.boss?.gagne ? 'Rejouer' : 'Affronter le dragon'}
          </Button>
        </section>
      )}
    </Screen>
  );
}

function CarteDefi({ defi, numero, onJouer }: { defi: DefiRow; numero: number; onJouer(): void }) {
  const lesson = getLesson(defi.lessonId);
  const game = getGame(defi.gameId);
  if (!lesson || !game) return null;
  const motif = MOTIF_META[defi.motif];
  const famille = FAMILLE_META[defi.famille];
  const niveau = LEVEL_META[defi.level];
  const texte = `Défi ${numero} : ${game.titre}. ${lesson.titre}. Niveau ${niveau.label}.`;
  return (
    <li
      className={`carte flex flex-col gap-2 overflow-hidden p-0 ${defi.fait ? 'ring-4 ring-grass-dark' : ''}`}
      aria-label={`${texte}${defi.fait ? ' Réussi !' : ''}`}
    >
      <div className={`flex items-center gap-3 bg-gradient-to-br p-3 ${game.couleur}`}>
        <span className="text-5xl" aria-hidden>
          {game.icone}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-ink/80">Défi {numero}</div>
          <div className="font-titre text-xl font-extrabold leading-tight">{game.titre}</div>
        </div>
        {defi.fait && (
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full bg-grass-dark text-white"
            aria-hidden
          >
            <Check size={30} />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3">
        <p className="font-bold leading-snug">{lesson.titre}</p>
        <div className="flex flex-wrap gap-1.5 text-sm font-bold">
          <span className="rounded-full bg-cream px-2 py-0.5">
            {motif.icone} {motif.label}
          </span>
          <span className="rounded-full bg-cream px-2 py-0.5">
            {famille.icone} {famille.label}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-white ${niveau.couleur}`}>
            {niveau.icone} {niveau.court}
          </span>
        </div>
        <div className="mt-auto flex items-center gap-2">
          {defi.fait ? (
            <>
              <Stars value={defi.stars} />
              <span className="font-bold text-grass-dark">Réussi !</span>
              <Button variant="blanc" className="ml-auto" onClick={onJouer}>
                Rejouer
              </Button>
            </>
          ) : (
            <>
              <SpeakButton text={texte} size={44} />
              <Button variant="grass" className="ml-auto" icon={<Play aria-hidden />} onClick={onJouer}>
                Jouer
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function ContenuCoffre({
  contenu,
  profile,
  ouvertMaintenant,
}: {
  contenu: CoffreContenu;
  profile: Profile;
  ouvertMaintenant: boolean;
}) {
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(!ouvertMaintenant);
  useEffect(() => {
    if (!ouvertMaintenant) return;
    const t = setTimeout(() => setOuvert(true), 250);
    return () => clearTimeout(t);
  }, [ouvertMaintenant]);
  const nom = contenu.objet ? (LIBELLES[contenu.objet] ?? contenu.objet) : null;
  const texte = `Dans le coffre : ${contenu.ludis} Ludis${nom ? ` et un trésor : ${nom} !` : '.'}`;
  return (
    <div className="flex flex-col items-center gap-3">
      {ouvertMaintenant && <Confetti />}
      <div className="relative">
        <Coffre size={140} ouvert={ouvert} />
        <AnimatePresence>
          {ouvert && (
            <motion.div
              key="pieces"
              className="absolute inset-x-0 top-0 flex justify-center"
              initial={{ y: 30, opacity: 0, scale: 0.4 }}
              animate={{ y: -40, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.2 }}
            >
              <LudiCoin size={40} />
              <LudiCoin size={34} />
              <LudiCoin size={40} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.div
        initial={ouvertMaintenant ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap items-center justify-center gap-4"
        role="status"
      >
        <span className="flex items-center gap-1 rounded-full bg-sun/40 px-4 py-2 font-titre text-2xl font-extrabold">
          +{contenu.ludis} <LudiCoin size={28} />
        </span>
        {contenu.objet && (
          <span className="flex items-center gap-2 rounded-2xl bg-grape/15 p-2 pr-4 font-bold">
            <Avatar
              config={avecObjet(profile.avatar, contenu.objet)}
              size={72}
              fond="rgb(var(--c-sky) / 0.3)"
            />
            Trésor : {nom}
          </span>
        )}
        <SpeakButton text={texte} />
      </motion.div>
      {contenu.objet && (
        <Button variant="grape" onClick={() => navigate('/boutique')}>
          Essayer mon trésor
        </Button>
      )}
      <p className="text-sm text-ink-soft">Reviens demain pour de nouveaux défis !</p>
    </div>
  );
}
