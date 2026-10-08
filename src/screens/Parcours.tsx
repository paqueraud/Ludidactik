/** Parcours : Classe → Matière → Leçon (badge « en cours », étoiles, maîtrise) → Jeu → Niveau. */
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { Lock, Pin, PinOff, Sparkles } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { Ludo } from '@/components/Ludo';
import { ProgressRing, SpeakButton, Stars } from '@/components/ui';
import { CLASSES_ACTIVES, getLesson, lessonsOf, matieresOf } from '@/content';
import { LEVEL_META, MATIERE_META, MODALITY_META } from '@/content/meta';
import type { ProviderContext } from '@/content/provider';
import { CLASSES, type Classe, LEVELS, type Lesson, type Matiere } from '@/content/schemas';
import { mastery } from '@/engine/score';
import { periodeActuelle } from '@/meta/dates';
import { gamesForLesson } from '@/games/registry';
import {
  type Profile,
  lessonSummary,
  toggleEnCours,
  useCurrentProfile,
  useProgress,
} from '@/services/profiles';
import { sfx } from '@/services/sfx';
import { db } from '@/services/storage/db';
import { dateListe, lessonListesParents, listesDuProfil } from '@/services/wordLists';
import { useSettings } from '@/stores/settings';

/** Garde : exige un profil connecté. */
export function AvecProfil({ children }: { children: (p: Profile) => ReactNode }) {
  const profile = useCurrentProfile();
  if (profile === undefined) return null;
  if (profile === null) return <Navigate to="/profils" replace />;
  return <>{children(profile)}</>;
}

function useProviderContext(profile: Profile): ProviderContext {
  const lists = useLiveQuery(() => db.wordLists.toArray(), []);
  const afficherPuberte = useSettings((s) => s.puberte);
  return useMemo(
    () => ({
      parentLists: listesDuProfil(lists ?? [], profile.id),
      masquerPuberte: !afficherPuberte,
    }),
    [lists, profile.id, afficherPuberte],
  );
}

/** Des mots plus récents que la dernière partie de l'enfant sur « Mes mots de la semaine » ? */
function useNouveauxMots(profile: Profile, classe: Classe, ctx: ProviderContext): boolean {
  const progress = useProgress(profile.id);
  const derniere = Math.max(
    0,
    ...(progress?.get(lessonListesParents(classe)) ?? []).map((r) => r.lastPlayed),
  );
  return progress !== undefined && ctx.parentLists.some((l) => dateListe(l) > derniere);
}

/**
 * Raccourci « Mes mots de la semaine » : les jeux d'orthographe sur les listes des parents,
 * lancés en 2 touches (jeu → « C'est parti ! ») depuis le choix de la classe ou des matières.
 */
function MotsDeLaSemaine({ profile, classe }: { profile: Profile; classe: Classe }) {
  const navigate = useNavigate();
  const ctx = useProviderContext(profile);
  const nouveaux = useNouveauxMots(profile, classe, ctx);
  const lesson = getLesson(lessonListesParents(classe));
  if (!lesson || !ctx.parentLists.length) return null;
  const tous = gamesForLesson(lesson, ctx);
  if (!tous.length) return null;
  // les jeux d'orthographe « natifs » d'abord (Ascension, Appareil photo…), 4 au plus : l'écran reste court
  const jeux = [
    ...tous.filter((j) => j.game.accepts[0] === 'spelling_word'),
    ...tous.filter((j) => j.game.accepts[0] !== 'spelling_word'),
  ].slice(0, 4);
  const nbMots = new Set(ctx.parentLists.flatMap((l) => l.mots.map((m) => m.mot.toLowerCase()))).size;
  const lessonUrl = `/jouer/${classe}/${lesson.matiere}/${encodeURIComponent(lesson.id)}`;
  return (
    <section
      aria-labelledby="mots-semaine-titre"
      className="carte mb-4 bg-gradient-to-r from-coral/25 to-sun/30 p-4"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-3xl" aria-hidden>
          📝
        </span>
        <h2 id="mots-semaine-titre" className="font-titre text-2xl font-extrabold">
          Mes mots de la semaine
        </h2>
        {nouveaux && (
          <span className="animate-wiggle rounded-full bg-coral px-3 py-0.5 text-sm font-bold text-white">
            Nouveaux mots !
          </span>
        )}
        <span className="text-sm font-bold text-ink-soft">
          {nbMots} mot{nbMots > 1 ? 's' : ''} préparé{nbMots > 1 ? 's' : ''} par tes parents
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {jeux.map(({ game }) => (
          <button
            key={game.id}
            type="button"
            onClick={() => {
              sfx.play('pop');
              navigate(`/partie/${encodeURIComponent(lesson.id)}/${game.id}/normal`);
            }}
            className="btn-3d flex min-h-btn items-center gap-2 bg-card px-3 text-left text-base leading-tight sm:px-4 sm:text-lg"
          >
            <span aria-hidden>{game.icone}</span>
            {game.titre}
          </button>
        ))}
        <Link
          to={lessonUrl}
          className="col-span-2 flex min-h-btn items-center rounded-btn px-4 font-bold text-ink-soft underline"
        >
          {tous.length > jeux.length ? `Les ${tous.length} jeux et les niveaux` : 'Choisir le niveau'}
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function Classes() {
  const navigate = useNavigate();
  return (
    <AvecProfil>
      {(profile) => (
        <Screen titre="Choisis ta classe" retour="/accueil">
          <MotsDeLaSemaine profile={profile} classe={profile.classe} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CLASSES.map((c, i) => {
              const active = CLASSES_ACTIVES.includes(c);
              const mienne = profile.classe === c;
              return (
                <motion.button
                  key={c}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  disabled={!active}
                  onClick={() => {
                    sfx.play('pop');
                    navigate(`/jouer/${c}`);
                  }}
                  className={`carte relative flex aspect-square flex-col items-center justify-center gap-2 p-4 ${active ? 'hover:-translate-y-1' : 'opacity-50'} ${mienne ? 'ring-4 ring-grape' : ''}`}
                >
                  <span className="font-titre text-5xl font-extrabold">{c}</span>
                  {mienne && (
                    <span className="rounded-full bg-grape px-3 text-sm font-bold text-white">Ma classe</span>
                  )}
                  {!active && <span className="rounded-full bg-ink/10 px-3 text-sm font-bold">Bientôt</span>}
                </motion.button>
              );
            })}
          </div>
        </Screen>
      )}
    </AvecProfil>
  );
}

/* ------------------------------------------------------------------ */

export function Matieres() {
  const { classe = 'CE1' } = useParams();
  const navigate = useNavigate();
  const programmeHG = useSettings((s) => s.programmeHG);
  if (!CLASSES_ACTIVES.includes(classe as Classe)) return <Navigate to="/jouer" replace />;
  const matieres = matieresOf(classe as Classe, programmeHG);
  return (
    <AvecProfil>
      {(profile) => (
        <MatieresInner
          profile={profile}
          classe={classe as Classe}
          matieres={matieres}
          navigate={navigate}
          programmeHG={programmeHG}
        />
      )}
    </AvecProfil>
  );
}

function MatieresInner({
  profile,
  classe,
  matieres,
  navigate,
  programmeHG,
}: {
  profile: Profile;
  classe: Classe;
  matieres: Matiere[];
  navigate: ReturnType<typeof useNavigate>;
  programmeHG: '2020' | '2026';
}) {
  const progress = useProgress(profile.id);
  return (
    <Screen titre={`${classe} : choisis une matière`} retour="/jouer">
      <MotsDeLaSemaine profile={profile} classe={classe} />
      <Link
        to="/jeux"
        className="carte mb-4 flex items-center gap-3 bg-gradient-to-r from-grape/40 to-sky/40 p-4 font-titre text-xl font-bold"
      >
        <span className="text-3xl" aria-hidden>
          🎮
        </span>
        La salle de jeux : tous les jeux pour réviser
      </Link>
      {profile.enCours.length > 0 && (
        <Link
          to={`/jouer/${classe}/en-cours`}
          className="carte mb-4 flex items-center gap-3 bg-gradient-to-r from-sun/40 to-coral/30 p-4 font-titre text-xl font-bold"
        >
          <Pin aria-hidden /> Mes leçons en cours (
          {profile.enCours.filter((id) => id.startsWith(classe)).length})
        </Link>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {matieres.map((m, i) => {
          const meta = MATIERE_META[m];
          const lecons = lessonsOf(classe, programmeHG, m);
          const maitrise = lecons.length
            ? lecons.reduce((s, l) => s + mastery(lessonSummary(progress?.get(l.id)).best), 0) / lecons.length
            : 0;
          return (
            <motion.button
              key={m}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => {
                sfx.play('pop');
                navigate(`/jouer/${classe}/${m}`);
              }}
              className={`btn-3d flex min-h-[150px] flex-col items-start justify-between p-4 text-left text-white ${meta.couleur}`}
            >
              <span className="text-5xl" aria-hidden>
                {meta.icone}
              </span>
              <span className="font-titre text-2xl font-extrabold leading-tight [text-shadow:0_2px_0_rgb(0_0_0/0.2)]">
                {meta.label}
              </span>
              <span className="flex w-full items-center justify-between text-sm font-bold">
                {lecons.length} leçons
                <ProgressRing
                  value={maitrise}
                  size={40}
                  stroke={5}
                  color="#fff"
                  label={`Maîtrise ${Math.round(maitrise * 100)} %`}
                >
                  {Math.round(maitrise * 100)}
                </ProgressRing>
              </span>
            </motion.button>
          );
        })}
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */

export function Lecons() {
  const { classe = 'CE1', matiere = '' } = useParams();
  const programmeHG = useSettings((s) => s.programmeHG);
  return (
    <AvecProfil>
      {(profile) => (
        <LeconsInner
          profile={profile}
          classe={classe as Classe}
          matiere={matiere}
          programmeHG={programmeHG}
        />
      )}
    </AvecProfil>
  );
}

function LeconsInner({
  profile,
  classe,
  matiere,
  programmeHG,
}: {
  profile: Profile;
  classe: Classe;
  matiere: string;
  programmeHG: '2020' | '2026';
}) {
  const navigate = useNavigate();
  const progress = useProgress(profile.id);
  const ctx = useProviderContext(profile);
  const nouveauxMots = useNouveauxMots(profile, classe, ctx);
  const [periode, setPeriode] = useState<number | 'toutes'>('toutes');
  const enCoursSeul = matiere === 'en-cours';
  const meta = enCoursSeul ? { label: 'Mes leçons en cours', icone: '📌' } : MATIERE_META[matiere as Matiere];
  if (!meta) return <Navigate to={`/jouer/${classe}`} replace />;

  let lecons = enCoursSeul
    ? profile.enCours.map(getLesson).filter((l): l is Lesson => !!l && l.classe === classe)
    : lessonsOf(classe, programmeHG, matiere as Matiere);
  if (periode !== 'toutes') lecons = lecons.filter((l) => l.periodes.includes(periode));
  // « Mes mots de la semaine » en tête quand les parents ont préparé une liste
  const idListes = lessonListesParents(classe);
  if (ctx.parentLists.length) {
    const i = lecons.findIndex((l) => l.id === idListes);
    if (i > 0) lecons = [lecons[i]!, ...lecons.slice(0, i), ...lecons.slice(i + 1)];
  }
  const domaines = [...new Set(lecons.map((l) => l.domaine))];
  const pActuelle = periodeActuelle();

  return (
    <Screen titre={meta.label} retour={`/jouer/${classe}`}>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Période">
        {(['toutes', 1, 2, 3, 4, 5] as const).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={periode === p}
            onClick={() => setPeriode(p)}
            className={`min-h-touch rounded-full px-4 font-bold ${periode === p ? 'bg-ink text-cream' : 'bg-card'} ${p === pActuelle ? 'ring-2 ring-sun' : ''}`}
          >
            {p === 'toutes' ? 'Toute l’année' : `Période ${p}`}
          </button>
        ))}
      </div>
      {lecons.length === 0 && (
        <div className="carte flex items-center gap-4 p-5">
          <Ludo pose="pense" size={80} />
          <p className="text-lg">
            {enCoursSeul
              ? 'Aucune leçon en cours. Touche 📌 sur une leçon pour l’ajouter ici.'
              : 'Pas de leçon ici pour cette période.'}
          </p>
        </div>
      )}
      <div className="space-y-6">
        {domaines.map((d) => (
          <section key={d}>
            <h2 className="mb-2 text-2xl">{d}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {lecons
                .filter((l) => l.domaine === d)
                .map((l) => {
                  const { stars, best } = lessonSummary(progress?.get(l.id));
                  const jeux = gamesForLesson(l, ctx);
                  const jouable = jeux.length > 0;
                  const enCours = profile.enCours.includes(l.id);
                  const m = mastery(best);
                  return (
                    <div
                      key={l.id}
                      className={`carte flex items-stretch gap-3 p-3 ${enCours ? 'ring-4 ring-sun' : ''}`}
                    >
                      <button
                        type="button"
                        disabled={!jouable}
                        onClick={() => {
                          sfx.play('pop');
                          navigate(`/jouer/${classe}/${l.matiere}/${encodeURIComponent(l.id)}`);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-60"
                      >
                        <ProgressRing value={m} size={52} label={`Maîtrise ${Math.round(m * 100)} %`}>
                          {Math.round(m * 100)}
                        </ProgressRing>
                        <span className="min-w-0">
                          <span className="block text-lg font-bold leading-snug">
                            {l.titre}
                            {l.id === idListes && nouveauxMots && (
                              <span className="ml-2 inline-block rounded-full bg-coral px-2 align-middle text-sm text-white">
                                Nouveaux mots !
                              </span>
                            )}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                            {LEVELS.map((lv) => (
                              <span
                                key={lv}
                                className="flex items-center gap-0.5"
                                title={LEVEL_META[lv].label}
                              >
                                <span aria-hidden>{LEVEL_META[lv].icone}</span>
                                <Stars value={stars[lv]} size={14} />
                              </span>
                            ))}
                            {jouable ? (
                              <span className="rounded-full bg-cream px-2 font-bold">
                                {jeux.length} jeu{jeux.length > 1 ? 'x' : ''}
                              </span>
                            ) : (
                              <span className="rounded-full bg-ink/10 px-2 font-bold">Bientôt</span>
                            )}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleEnCours(profile, l.id)}
                        className={`flex w-12 shrink-0 items-center justify-center rounded-2xl ${enCours ? 'bg-sun' : 'bg-cream'}`}
                        aria-pressed={enCours}
                        aria-label={
                          enCours
                            ? `Retirer « ${l.titre} » des leçons en cours`
                            : `Marquer « ${l.titre} » comme leçon en cours`
                        }
                        title={enCours ? 'Leçon en cours' : 'J’apprends cette leçon en ce moment'}
                      >
                        {enCours ? <Pin aria-hidden /> : <PinOff className="opacity-40" aria-hidden />}
                      </button>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */

export function ChoixJeu() {
  const { lessonId = '' } = useParams();
  const lesson = getLesson(decodeURIComponent(lessonId));
  if (!lesson) return <Navigate to="/jouer" replace />;
  return <AvecProfil>{(profile) => <ChoixJeuInner profile={profile} lesson={lesson} />}</AvecProfil>;
}

function ChoixJeuInner({ profile, lesson }: { profile: Profile; lesson: Lesson }) {
  const navigate = useNavigate();
  const ctx = useProviderContext(profile);
  const progress = useProgress(profile.id);
  const jeux = gamesForLesson(lesson, ctx);
  const rows = progress?.get(lesson.id) ?? [];
  const rappel = lesson.rappel.startsWith('TODO') ? null : lesson.rappel;

  return (
    <Screen titre={lesson.titre} retour={`/jouer/${lesson.classe}/${lesson.matiere}`}>
      {rappel && (
        <div className="carte mb-5 flex items-start gap-3 bg-sun/20 p-4">
          <Ludo pose="pense" size={64} />
          <div className="flex-1">
            <div className="text-sm font-bold uppercase tracking-wide text-ink-soft">La règle à retenir</div>
            <p className="text-lg">{rappel}</p>
          </div>
          <SpeakButton text={rappel} label="Écouter la règle" />
        </div>
      )}
      <h2 className="mb-3 flex items-center gap-2 text-2xl">
        <Sparkles aria-hidden /> Choisis ton jeu
      </h2>
      {jeux.length === 0 && <p className="carte p-5 text-lg">Les jeux de cette leçon arrivent bientôt !</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jeux.map(({ game }, i) => {
          const best = Math.max(0, ...rows.filter((r) => r.gameId === game.id).map((r) => r.stars));
          return (
            <motion.button
              key={game.id}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => {
                sfx.play('pop');
                navigate(
                  `/jouer/${lesson.classe}/${lesson.matiere}/${encodeURIComponent(lesson.id)}/${game.id}`,
                );
              }}
              className="carte group flex flex-col overflow-hidden text-left transition-transform hover:-translate-y-1"
            >
              <div
                className={`flex h-28 items-center justify-center bg-gradient-to-br text-7xl ${game.couleur}`}
                aria-hidden
              >
                <span className="transition-transform group-hover:scale-110">{game.icone}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-titre text-2xl font-extrabold">{game.titre}</span>
                  {game.signature && (
                    <span className="rounded-full bg-sun px-2 text-xs font-bold">★ Signature</span>
                  )}
                </span>
                <span>{game.description}</span>
                <span className="mt-auto flex flex-wrap items-center gap-1.5">
                  {game.modalites.map((m) => (
                    <span key={m} className="rounded-full bg-cream px-2 py-0.5 text-sm font-bold">
                      {MODALITY_META[m].icone} {MODALITY_META[m].label}
                    </span>
                  ))}
                  <Stars value={best} size={16} className="ml-auto" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
      {jeux.length === 1 && (
        <p className="mt-4 text-center text-ink-soft">
          D’autres jeux pour cette leçon arrivent dans les prochaines versions.
        </p>
      )}
      <details className="mt-6 text-sm text-ink-soft">
        <summary className="cursor-pointer">Pour les adultes : référence au programme</summary>
        <p className="mt-1">{lesson.boRef}</p>
      </details>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */

export function ChoixNiveau() {
  const { lessonId = '', gameId = '' } = useParams();
  const lesson = getLesson(decodeURIComponent(lessonId));
  if (!lesson) return <Navigate to="/jouer" replace />;
  return (
    <AvecProfil>
      {(profile) => <ChoixNiveauInner profile={profile} lesson={lesson} gameId={gameId} />}
    </AvecProfil>
  );
}

function ChoixNiveauInner({ profile, lesson, gameId }: { profile: Profile; lesson: Lesson; gameId: string }) {
  const navigate = useNavigate();
  const progress = useProgress(profile.id);
  const rows = (progress?.get(lesson.id) ?? []).filter((r) => r.gameId === gameId);
  const etoiles = (lv: string) => rows.find((r) => r.level === lv)?.stars ?? 0;
  // « Pour aller plus loin » se débloque avec 1 étoile en Normal sur la leçon (tous jeux)
  const plusLoinOuvert = (progress?.get(lesson.id) ?? []).some((r) => r.level === 'normal' && r.stars >= 1);
  const texte = `Choisis ton niveau. ${LEVELS.map((lv) => `${LEVEL_META[lv].label} : ${lesson.niveaux[lv]}.`).join(' ')}`;

  return (
    <Screen
      titre="Choisis ton niveau"
      aLire={texte}
      retour={`/jouer/${lesson.classe}/${lesson.matiere}/${encodeURIComponent(lesson.id)}`}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {LEVELS.map((lv, i) => {
          const meta = LEVEL_META[lv];
          const verrou = lv === 'plus_loin' && !plusLoinOuvert;
          return (
            <motion.button
              key={lv}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              disabled={verrou}
              onClick={() => {
                sfx.play('pop');
                navigate(`/partie/${encodeURIComponent(lesson.id)}/${gameId}/${lv}`);
              }}
              className={`btn-3d flex min-h-[220px] flex-col items-center justify-center gap-3 p-5 text-center text-white ${meta.couleur} ${verrou ? 'grayscale' : ''}`}
            >
              <span className="text-6xl" aria-hidden>
                {verrou ? <Lock size={56} /> : meta.icone}
              </span>
              <span className="font-titre text-3xl font-extrabold [text-shadow:0_2px_0_rgb(0_0_0/0.2)]">
                {meta.label}
              </span>
              <span className="text-base font-bold opacity-95">{lesson.niveaux[lv]}</span>
              <span className="text-sm opacity-90">
                {verrou ? 'Gagne 1 étoile au niveau Normal pour débloquer !' : meta.regle}
              </span>
              <Stars value={etoiles(lv)} size={22} className="rounded-full bg-white/80 px-2 py-0.5" />
            </motion.button>
          );
        })}
      </div>
    </Screen>
  );
}
