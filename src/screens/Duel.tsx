/**
 * Duel à deux sur le même appareil (Phase 5) : Grand Prix et Vrai ou Faux express en écran partagé
 * (enveloppes de `src/meta/duel/` qui réutilisent les items des leçons), et la Dictée-duel (jeu existant).
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { Swords, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '@/avatar/Avatar';
import { Confetti } from '@/components/Confetti';
import { Screen } from '@/components/Layout';
import { Ludo } from '@/components/Ludo';
import { Button, SpeakButton } from '@/components/ui';
import { content, getLesson, lessonsOf } from '@/content';
import { LEVEL_META, MATIERE_META } from '@/content/meta';
import type { Item } from '@/content/items';
import { type ItemStream, type ProviderContext, countItems, createStream } from '@/content/provider';
import { LEVELS, type Level } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { gamesForLesson, getGame } from '@/games/registry';
import type { Joueur } from '@/meta/duel/DuelEcran';
import { DuelGrandPrix } from '@/meta/duel/DuelGrandPrix';
import { DuelVraiFaux } from '@/meta/duel/DuelVraiFaux';
import { useProfiles } from '@/services/profiles';
import { addPlayTime } from '@/services/screenTime';
import { sfx } from '@/services/sfx';
import { type Profile, db } from '@/services/storage/db';
import { listesDuProfil } from '@/services/wordLists';
import { useSettings } from '@/stores/settings';
import { AvecProfil } from './Parcours';

const DUELS = [
  {
    id: 'grand-prix',
    titre: 'Grand Prix à deux',
    description: 'Chacun son pavé, les mêmes calculs : le premier cheval à l’arrivée gagne !',
  },
  {
    id: 'vrai-faux',
    titre: 'Vrai ou Faux en duel',
    description: 'La même carte pour les deux : le premier qui répond juste marque le point.',
  },
  {
    id: 'dictee-duel',
    titre: 'La Dictée-duel',
    description: 'Le même mot est dicté : le premier qui l’écrit sans faute marque le point.',
  },
] as const;

export function DuelAccueil() {
  const navigate = useNavigate();
  const consigne =
    'Le duel se joue à deux sur le même écran. Posez la tablette à plat entre vous : chacun a sa moitié. Choisissez un jeu !';
  return (
    <AvecProfil>
      {() => (
        <Screen titre="Duel à deux" aLire={consigne} retour="/accueil">
          <div className="carte mb-4 flex items-center gap-3 p-4">
            <Ludo pose="joie" size={70} />
            <p className="flex-1 text-lg">{consigne}</p>
            <SpeakButton text={consigne} />
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {DUELS.map((d) => {
              const g = getGame(d.id);
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.play('pop');
                      navigate(d.id === 'dictee-duel' ? '/jeux/dictee-duel' : `/duel/${d.id}`);
                    }}
                    className="carte flex w-full flex-col overflow-hidden text-left transition-transform hover:-translate-y-1"
                  >
                    <span
                      className={`flex h-24 items-center justify-center bg-gradient-to-br text-6xl ${g?.couleur ?? 'from-sky to-coral'}`}
                      aria-hidden
                    >
                      {g?.icone ?? '⚔️'}
                    </span>
                    <span className="flex flex-col gap-1 p-3">
                      <span className="font-titre text-xl font-extrabold">{d.titre}</span>
                      <span className="text-sm">{d.description}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Screen>
      )}
    </AvecProfil>
  );
}

export function DuelJeu() {
  const { jeu = '' } = useParams();
  const duel = DUELS.find((d) => d.id === jeu && d.id !== 'dictee-duel');
  if (!duel) return <Navigate to="/duel" replace />;
  return (
    <AvecProfil>
      {(profile) => <DuelInner key={profile.id} profile={profile} jeu={duel.id} titre={duel.titre} />}
    </AvecProfil>
  );
}

function useCtx(profile: Profile): ProviderContext {
  const lists = useLiveQuery(() => db.wordLists.toArray(), []);
  const puberte = useSettings((s) => s.puberte);
  return useMemo(
    () => ({ parentLists: listesDuProfil(lists ?? [], profile.id, profile.classe), masquerPuberte: !puberte }),
    [lists, profile.id, puberte],
  );
}

type Phase =
  | { etape: 'reglages' }
  | { etape: 'jeu'; graine: number }
  | { etape: 'fin'; gagnant: 0 | 1 | null; scores: [number, number] };

function DuelInner({ profile, jeu, titre }: { profile: Profile; jeu: string; titre: string }) {
  const navigate = useNavigate();
  const programmeHG = useSettings((s) => s.programmeHG);
  const ctx = useCtx(profile);
  const profils = useProfiles() ?? [];
  const game = getGame(jeu)!;
  // En duel, l'énoncé doit se lire à l'écran (pas de dictée de nombres : un seul haut-parleur pour deux).
  const filtre = useMemo(
    () => (it: Item) =>
      (!game.filterItem || game.filterItem(it)) && (it.kind !== 'numeric_answer' || /\d/.test(it.prompt)),
    [game],
  );

  const lecons = useMemo(
    () =>
      lessonsOf(profile.classe, programmeHG)
        .map((l) => ({ l, kind: gamesForLesson(l, ctx).find((g) => g.game.id === jeu)?.kind }))
        .filter((x) => !!x.kind && countItems(content, x.l, x.kind, 'normal', createRng(1), ctx, filtre) > 0),
    [profile.classe, programmeHG, ctx, jeu, filtre],
  );
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>('normal');
  const [adversaire, setAdversaire] = useState<string>('invite');
  const [phase, setPhase] = useState<Phase>({ etape: 'reglages' });

  const choix =
    lecons.find((x) => x.l.id === lessonId) ??
    lecons.find((x) => profile.enCours.includes(x.l.id)) ??
    lecons[0];
  const autre = profils.find((p) => p.id === adversaire);
  const joueurs: [Joueur, Joueur] = [
    { nom: profile.prenom, avatar: profile.avatar, couleur: 'bg-sky/30' },
    { nom: autre?.prenom ?? 'Invité', avatar: autre?.avatar ?? null, couleur: 'bg-coral/25' },
  ];

  // temps de jeu de l'enfant connecté
  const debut = useRef<number | null>(null);
  useEffect(() => {
    if (phase.etape === 'jeu') debut.current = Date.now();
    else if (debut.current) {
      void addPlayTime(profile.id, Math.min(Date.now() - debut.current, 20 * 60_000));
      debut.current = null;
    }
  }, [phase.etape, profile.id]);

  const streams = useMemo(() => {
    if (phase.etape !== 'jeu' || !choix?.kind) return null;
    const mk = () => createStream(content, choix.l, choix.kind!, level, createRng(phase.graine), ctx, filtre);
    const a = mk();
    const b = mk();
    return a && b ? ([a, b] as [ItemStream, ItemStream]) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const quitter = (
    <button
      type="button"
      className="flex h-12 w-12 items-center justify-center rounded-full bg-cream"
      aria-label="Arrêter le duel"
      onClick={() => setPhase({ etape: 'reglages' })}
    >
      <X aria-hidden />
    </button>
  );

  if (phase.etape === 'jeu' && streams) {
    return jeu === 'grand-prix' ? (
      <DuelGrandPrix
        joueurs={joueurs}
        streams={streams}
        centre={quitter}
        onFin={(gagnant, scores) => setPhase({ etape: 'fin', gagnant, scores })}
      />
    ) : (
      <DuelVraiFaux
        joueurs={joueurs}
        stream={streams[0]}
        centre={quitter}
        onFin={(gagnant, scores) => setPhase({ etape: 'fin', gagnant, scores })}
      />
    );
  }

  if (phase.etape === 'fin') {
    const g = phase.gagnant;
    const texte =
      g === null
        ? 'Égalité ! Bravo à tous les deux !'
        : `${joueurs[g].nom} gagne le duel ! Bravo à tous les deux !`;
    return (
      <Screen titre={titre} retour="/duel">
        {g !== null && <Confetti />}
        <div
          className="carte mx-auto flex max-w-xl flex-col items-center gap-4 p-6 text-center"
          role="status"
        >
          <Ludo pose="joie" size={100} />
          <h2 className="text-3xl">{texte}</h2>
          <div className="flex items-center gap-6">
            {joueurs.map((j, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                {j.avatar ? (
                  <Avatar config={j.avatar} size={64} fond="rgb(var(--c-sky) / 0.3)" />
                ) : (
                  <span className="text-5xl">🙂</span>
                )}
                <span className="font-bold">{j.nom}</span>
                <span className="font-titre text-3xl font-extrabold">{phase.scores[i]}</span>
              </div>
            ))}
          </div>
          <SpeakButton text={texte} />
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="grass"
              size="lg"
              onClick={() => setPhase({ etape: 'jeu', graine: Date.now() })}
              autoFocus
            >
              Revanche !
            </Button>
            <Button variant="blanc" size="lg" onClick={() => setPhase({ etape: 'reglages' })}>
              Changer de leçon
            </Button>
            <Button variant="fantome" onClick={() => navigate('/duel')}>
              Autre duel
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  const consigne = `${titre}. Choisis la leçon, le niveau et ton adversaire, puis posez l’appareil entre vous.`;
  return (
    <Screen titre={titre} aLire={consigne} retour="/duel">
      {lecons.length === 0 ? (
        <div className="carte flex items-center gap-4 p-5">
          <Ludo pose="pense" size={80} />
          <p>Pas encore de leçon pour ce duel en {profile.classe}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="carte p-4">
            <label htmlFor="duel-lecon" className="mb-1 block text-xl font-bold">
              1. La leçon
            </label>
            <select
              id="duel-lecon"
              className="min-h-btn w-full rounded-2xl border-4 border-sky bg-card px-3 text-lg"
              value={choix?.l.id}
              onChange={(e) => setLessonId(e.target.value)}
            >
              {lecons.map(({ l }) => (
                <option key={l.id} value={l.id}>
                  {MATIERE_META[l.matiere].icone} {l.titre}
                </option>
              ))}
            </select>
          </div>
          <div className="carte p-4">
            <h2 className="mb-2 text-xl">2. Le niveau</h2>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Niveau">
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  role="radio"
                  aria-checked={level === lv}
                  onClick={() => setLevel(lv)}
                  className={`min-h-btn rounded-full px-4 font-bold ${level === lv ? `${LEVEL_META[lv].couleur} text-white` : 'bg-cream'}`}
                >
                  {LEVEL_META[lv].icone} {LEVEL_META[lv].label}
                </button>
              ))}
            </div>
          </div>
          <div className="carte p-4">
            <h2 className="mb-2 text-xl">3. Ton adversaire</h2>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Adversaire">
              {[
                ...profils
                  .filter((p) => p.id !== profile.id)
                  .map((p) => ({ id: p.id, nom: p.prenom, avatar: p.avatar })),
                { id: 'invite', nom: 'Un invité', avatar: null },
              ].map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={adversaire === a.id}
                  onClick={() => setAdversaire(a.id)}
                  className={`flex min-h-btn items-center gap-2 rounded-full py-1 pl-1 pr-4 font-bold ${adversaire === a.id ? 'bg-coral text-white' : 'bg-cream'}`}
                >
                  {a.avatar ? (
                    <Avatar config={a.avatar} size={44} compagnon={false} />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center text-2xl">🙂</span>
                  )}
                  {a.nom}
                </button>
              ))}
            </div>
          </div>
          {choix && getLesson(choix.l.id) && (
            <Button
              variant="grass"
              size="xl"
              icon={<Swords aria-hidden />}
              className="self-center"
              onClick={() => setPhase({ etape: 'jeu', graine: Date.now() })}
            >
              C’est parti !
            </Button>
          )}
        </div>
      )}
    </Screen>
  );
}
