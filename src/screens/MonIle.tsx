/**
 * « Mon île » : la progression scolaire sous forme de monde. Chaque matière est un quartier ;
 * chaque leçon maîtrisée à 80 % rapporte une gemme qui construit (puis agrandit) un bâtiment.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Screen } from '@/components/Layout';
import { SpeakButton } from '@/components/ui';
import { lessonsOf } from '@/content';
import { Batiment } from '@/meta/Batiments';
import { type QuartierEtat, SEUIL_GEMME, etatIle } from '@/meta/ile';
import { maitriseLecon, synchroniserGemmes } from '@/services/meta';
import { useProgress } from '@/services/profiles';
import { type Profile, db } from '@/services/storage/db';
import { useSettings } from '@/stores/settings';
import { AvecProfil } from './Parcours';

export function MonIle() {
  return <AvecProfil>{(profile) => <IleInner key={profile.id} profile={profile} />}</AvecProfil>;
}

type Place = { x: number; y: number };
/** Emplacement des quartiers sur la carte (viewBox 800 × 500), selon leur nombre dans la classe. */
const DISPOSITIONS: Record<number, Place[]> = {
  1: [{ x: 400, y: 260 }],
  2: [
    { x: 260, y: 260 },
    { x: 540, y: 260 },
  ],
  3: [
    { x: 240, y: 190 },
    { x: 560, y: 190 },
    { x: 400, y: 370 },
  ],
  4: [
    { x: 240, y: 180 },
    { x: 560, y: 180 },
    { x: 240, y: 370 },
    { x: 560, y: 370 },
  ],
  5: [
    { x: 220, y: 165 },
    { x: 580, y: 165 },
    { x: 400, y: 285 },
    { x: 220, y: 395 },
    { x: 580, y: 395 },
  ],
  6: [
    { x: 205, y: 170 },
    { x: 405, y: 130 },
    { x: 605, y: 170 },
    { x: 205, y: 370 },
    { x: 405, y: 330 },
    { x: 605, y: 370 },
  ],
  7: [
    { x: 205, y: 165 },
    { x: 410, y: 120 },
    { x: 610, y: 170 },
    { x: 195, y: 335 },
    { x: 405, y: 295 },
    { x: 620, y: 345 },
    { x: 405, y: 430 },
  ],
};
/** Bâtiments : 2 rangées de 3 sur la parcelle. */
const SLOTS = [
  { dx: -52, dy: -4 },
  { dx: 0, dy: -10 },
  { dx: 52, dy: -4 },
  { dx: -48, dy: 36 },
  { dx: 4, dy: 32 },
  { dx: 52, dy: 36 },
];

const NIVEAUX = ['Terrain libre', 'Construit', 'Agrandi', 'Drapeau doré'];

function IleInner({ profile }: { profile: Profile }) {
  const programmeHG = useSettings((s) => s.programmeHG);
  const progress = useProgress(profile.id);
  const gemRows = useLiveQuery(() => db.gems.where('profileId').equals(profile.id).toArray(), [profile.id]);
  const [choisi, setChoisi] = useState<string | null>(null);

  useEffect(() => {
    void synchroniserGemmes(profile.id);
  }, [profile.id]);

  const lecons = useMemo(() => lessonsOf(profile.classe, programmeHG), [profile.classe, programmeHG]);
  const maitrises = useMemo(() => {
    const m = new Map<string, number>();
    for (const [id, rows] of progress ?? []) m.set(id, maitriseLecon(rows));
    return m;
  }, [progress]);
  const gemmes = useMemo(() => new Set((gemRows ?? []).map((g) => g.lessonId)), [gemRows]);
  const ile = useMemo(() => etatIle(lecons, gemmes, maitrises), [lecons, gemmes, maitrises]);
  const total = ile.reduce((n, q) => n + q.gemmes, 0);
  const intro = `Voici ton île ! Tu as ${total} gemme${total > 1 ? 's' : ''}. Chaque leçon que tu maîtrises à 80 pour cent construit un bâtiment dans le quartier de sa matière.`;

  const selection = ile.find((q) => q.def.id === choisi) ?? null;

  return (
    <Screen titre="Mon île" aLire={intro} retour="/accueil" large>
      <div className="carte mb-4 flex flex-wrap items-center gap-3 p-4">
        <span className="text-4xl" aria-hidden>
          💎
        </span>
        <p className="flex-1 text-lg font-bold">
          {total} gemme{total > 1 ? 's' : ''} de maîtrise · {lecons.length} leçons à explorer
        </p>
        <SpeakButton text={intro} />
      </div>

      <div className="carte mx-auto mb-4 max-w-3xl overflow-hidden bg-sky/30 p-1">
        <svg viewBox="0 0 800 500" className="h-auto w-full" role="group" aria-label="Carte de mon île">
          <CarteFond />
          {ile.map((q, i) => (
            <Quartier
              key={q.def.id}
              q={q}
              place={DISPOSITIONS[ile.length]?.[i] ?? { x: 400, y: 250 }}
              actif={choisi === q.def.id}
              onChoisir={() => setChoisi(choisi === q.def.id ? null : q.def.id)}
            />
          ))}
        </svg>
      </div>

      {selection && <DetailQuartier q={selection} profile={profile} maitrises={maitrises} gemmes={gemmes} />}

      <h2 className="mb-2 mt-2 text-2xl">Les quartiers</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ile.map((q) => (
          <li key={q.def.id}>
            <button
              type="button"
              onClick={() => setChoisi(q.def.id)}
              aria-pressed={choisi === q.def.id}
              className={`carte flex w-full flex-col gap-2 p-3 text-left ${choisi === q.def.id ? 'ring-4 ring-grape' : ''}`}
            >
              <span className="flex items-center gap-2 font-titre text-xl font-extrabold">
                <span aria-hidden>{q.def.icone}</span> {q.def.nom}
              </span>
              <svg
                viewBox="-80 -52 160 64"
                className="h-20 w-full rounded-xl"
                style={{ background: q.def.sol }}
                aria-hidden
              >
                {q.batiments.slice(0, 6).map((b, i) => (
                  <Batiment key={i} {...b} x={-65 + i * 26} y={4} s={0.62} toit={q.def.toit} />
                ))}
              </svg>
              <span className="text-sm font-bold text-ink-soft">
                {q.gemmes} gemme{q.gemmes > 1 ? 's' : ''} sur {q.lecons} leçon{q.lecons > 1 ? 's' : ''}
                {q.chantiers > 0 && ` · ${q.chantiers} en chantier`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Screen>
  );
}

function CarteFond() {
  return (
    <g aria-hidden>
      <rect width="800" height="500" fill="#8FD8F8" />
      {[60, 140, 420, 470].map((y, i) => (
        <path
          key={y}
          d={`M${20 + i * 30} ${y} q12 -8 24 0 t24 0`}
          stroke="#fff"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
          strokeLinecap="round"
        />
      ))}
      <path
        d="M110 90 C200 30 600 20 700 80 C780 130 790 300 740 400 C690 480 520 495 400 492 C260 490 110 470 70 390 C30 300 40 140 110 90 Z"
        fill="#F3DBA5"
      />
      <path
        d="M125 100 C210 50 590 40 685 95 C760 140 765 300 720 390 C675 465 515 478 400 476 C270 474 130 455 92 382 C55 300 65 150 125 100 Z"
        fill="#9EDC8F"
      />
      {/* arbres décoratifs */}
      {[
        [110, 250],
        [300, 230],
        [520, 230],
        [705, 260],
        [300, 400],
        [520, 400],
        [140, 140],
        [690, 120],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <rect x="-2" y="-6" width="4" height="10" fill="#8D5A3B" />
          <circle cx="0" cy="-12" r="10" fill="#4CAF50" />
          <circle cx="6" cy="-6" r="6" fill="#66BB6A" />
        </g>
      ))}
    </g>
  );
}

function Quartier({
  q,
  place,
  actif,
  onChoisir,
}: {
  q: QuartierEtat;
  place: Place;
  actif: boolean;
  onChoisir(): void;
}) {
  const label = `${q.def.nom} : ${q.gemmes} gemme${q.gemmes > 1 ? 's' : ''} sur ${q.lecons} leçons`;
  return (
    <g
      transform={`translate(${place.x} ${place.y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={actif}
      onClick={onChoisir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChoisir();
        }
      }}
      className="cursor-pointer outline-none [&:focus-visible>ellipse]:stroke-grape"
    >
      <ellipse
        cx="0"
        cy="12"
        rx="92"
        ry="56"
        fill={q.def.sol}
        stroke={actif ? '#8E7CFF' : 'rgba(36,48,74,0.15)'}
        strokeWidth={actif ? 6 : 3}
      />
      {q.def.id === 'sciences' && <ellipse cx="-62" cy="30" rx="22" ry="10" fill="#4FC3F7" opacity="0.8" />}
      {q.def.id === 'langues' && (
        <path d="M60 50 q10 -6 20 0 t20 0" stroke="#4FC3F7" strokeWidth="4" fill="none" />
      )}
      {q.batiments.map((b, i) => (
        <Batiment key={i} {...b} x={SLOTS[i]!.dx} y={SLOTS[i]!.dy} toit={q.def.toit} />
      ))}
      <g transform="translate(0 -62)">
        <rect x="-78" y="-15" width="156" height="26" rx="13" fill="#fff" opacity="0.92" />
        <text
          x="0"
          y="3"
          textAnchor="middle"
          fontSize="15"
          fontWeight="800"
          fill="#24304A"
          fontFamily="Baloo 2, sans-serif"
        >
          {q.def.icone} {q.def.nom}
        </text>
      </g>
      {q.gemmes > 0 && (
        <g transform="translate(78 -40)">
          <circle r="15" fill="#8E7CFF" />
          <text y="5" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">
            {q.gemmes}
          </text>
        </g>
      )}
    </g>
  );
}

function DetailQuartier({
  q,
  profile,
  maitrises,
  gemmes,
}: {
  q: QuartierEtat;
  profile: Profile;
  maitrises: Map<string, number>;
  gemmes: Set<string>;
}) {
  const programmeHG = useSettings((s) => s.programmeHG);
  const lecons = lessonsOf(profile.classe, programmeHG).filter((l) => q.def.matieres.includes(l.matiere));
  const maitrisees = lecons.filter((l) => gemmes.has(l.id));
  const enRoute = lecons
    .filter((l) => !gemmes.has(l.id) && (maitrises.get(l.id) ?? 0) > 0)
    .sort((a, b) => (maitrises.get(b.id) ?? 0) - (maitrises.get(a.id) ?? 0));
  const texte = `${q.def.nom}. ${q.gemmes} gemme${q.gemmes > 1 ? 's' : ''} sur ${q.lecons} leçons.`;
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="carte mb-4 p-4"
      aria-labelledby="quartier-titre"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-3xl" aria-hidden>
          {q.def.icone}
        </span>
        <h2 id="quartier-titre" className="flex-1 text-2xl">
          {q.def.nom}
        </h2>
        <SpeakButton text={texte} size={40} />
      </div>
      <div
        className="mb-3 h-4 overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-label="Leçons maîtrisées"
        aria-valuemin={0}
        aria-valuemax={q.lecons}
        aria-valuenow={q.gemmes}
      >
        <div className="h-full rounded-full bg-grape" style={{ width: `${(q.gemmes / q.lecons) * 100}%` }} />
      </div>
      <ul className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {q.batiments.map((b, i) => (
          <li key={i} className="flex items-center gap-2 rounded-2xl bg-cream p-2">
            <svg viewBox="-24 -48 48 52" width={48} height={52} aria-hidden>
              <Batiment {...b} x={0} y={0} toit={q.def.toit} />
            </svg>
            <span className="text-sm leading-tight">
              <span className="block font-bold">{b.niveau > 0 ? b.nom : '?'}</span>
              {b.chantier && b.niveau === 0 ? 'En chantier' : NIVEAUX[b.niveau]}
            </span>
          </li>
        ))}
      </ul>
      {maitrisees.length > 0 && (
        <>
          <h3 className="mb-1 text-lg">💎 Leçons maîtrisées</h3>
          <ul className="mb-3 flex flex-wrap gap-2">
            {maitrisees.map((l) => (
              <li key={l.id} className="rounded-full bg-grape/15 px-3 py-1 text-sm font-bold">
                {l.titre}
              </li>
            ))}
          </ul>
        </>
      )}
      <h3 className="mb-1 text-lg">🏗️ En route vers une gemme</h3>
      {enRoute.length ? (
        <ul className="flex flex-col gap-1">
          {enRoute.slice(0, 6).map((l) => (
            <li key={l.id}>
              <Link
                to={`/jouer/${l.classe}/${l.matiere}/${encodeURIComponent(l.id)}`}
                className="flex min-h-touch items-center gap-2 rounded-2xl bg-cream px-3 font-bold hover:bg-cream-deep"
              >
                <span className="flex-1">{l.titre}</span>
                <span className="text-sm text-ink-soft">
                  {Math.round((maitrises.get(l.id) ?? 0) * 100)} % / {Math.round(SEUIL_GEMME * 100)} %
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-soft">Joue une leçon de ce quartier pour lancer un chantier !</p>
      )}
      <p className="mt-2 text-sm text-ink-soft">
        Astuce : la maîtrise compte surtout le niveau Normal, puis « Pour aller plus loin ».
      </p>
    </motion.section>
  );
}
