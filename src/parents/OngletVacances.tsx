/**
 * Vacances scolaires : zone (A, B, C ou aucune) et périodes personnalisées. Pendant les vacances,
 * la flamme des défis est gelée (GAMIFICATION §4) : l'enfant peut se reposer sans la perdre.
 */
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { parseDay } from '@/meta/dates';
import {
  ACADEMIES,
  type PeriodeVacances,
  type ReglageVacances,
  type ZoneOuAucune,
  vacancesOfficielles,
} from '@/meta/vacances';
import { ecrireReglageVacances, useReglageVacances } from '@/services/vacances';
import { Section, champ } from './ui';

const ZONES: { id: ZoneOuAucune; label: string }[] = [
  { id: 'A', label: 'Zone A' },
  { id: 'B', label: 'Zone B' },
  { id: 'C', label: 'Zone C' },
  { id: 'aucune', label: 'Aucune' },
];

const dateFr = (day: string) =>
  parseDay(day).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export function OngletVacances() {
  const reglage = useReglageVacances();
  if (!reglage) return null;
  return <Vacances reglage={reglage} />;
}

function Vacances({ reglage }: { reglage: ReglageVacances }) {
  const [nom, setNom] = useState('');
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const officielles = vacancesOfficielles(reglage.zone);

  const enregistrer = (r: ReglageVacances) => void ecrireReglageVacances(r);
  const ajouter = () => {
    if (!debut || !fin) return setErreur('Choisissez une date de début et une date de fin.');
    if (fin < debut) return setErreur('La date de fin doit être après la date de début.');
    const p: PeriodeVacances = { nom: nom.trim() || 'Vacances', debut, fin };
    enregistrer({ ...reglage, perso: [...reglage.perso, p].sort((a, b) => a.debut.localeCompare(b.debut)) });
    setNom('');
    setDebut('');
    setFin('');
    setErreur(null);
  };

  return (
    <Section
      titre="Vacances scolaires"
      intro="Pendant les vacances, la flamme des défis est gelée : votre enfant peut se reposer sans la perdre. Calendrier officiel 2026-2027 (métropole)."
    >
      <fieldset className="mb-5">
        <legend className="mb-2 font-bold">Zone de vacances scolaires</legend>
        <div className="flex flex-wrap gap-2">
          {ZONES.map((z) => (
            <label
              key={z.id}
              className={`flex min-h-touch cursor-pointer items-center rounded-full px-4 font-bold has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-grape ${reglage.zone === z.id ? 'bg-ink text-cream' : 'bg-cream'}`}
            >
              <input
                type="radio"
                name="zone-vacances"
                className="sr-only"
                checked={reglage.zone === z.id}
                onChange={() => enregistrer({ ...reglage, zone: z.id })}
              />
              {z.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          {reglage.zone === 'aucune'
            ? 'Aucune vacance officielle : seules vos périodes personnalisées gèlent la flamme.'
            : `Académies : ${ACADEMIES[reglage.zone]}.`}
        </p>
      </fieldset>

      {officielles.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-2 text-xl">Vacances officielles (zone {reglage.zone})</h3>
          <ul className="grid gap-1">
            {officielles.map((p) => (
              <li key={p.nom + p.debut} className="rounded-2xl bg-cream px-3 py-2">
                <span className="font-bold">{p.nom}</span> : du {dateFr(p.debut)} au {dateFr(p.fin)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="mb-2 text-xl">Périodes personnalisées</h3>
      {reglage.perso.length > 0 ? (
        <ul className="mb-3 grid gap-1">
          {reglage.perso.map((p, i) => (
            <li
              key={`${p.debut}-${p.fin}-${i}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream px-3 py-1"
            >
              <span>
                <span className="font-bold">{p.nom}</span> : du {dateFr(p.debut)} au {dateFr(p.fin)}
              </span>
              <button
                type="button"
                className="flex min-h-touch min-w-touch items-center justify-center rounded-full"
                aria-label={`Supprimer la période ${p.nom}`}
                onClick={() => enregistrer({ ...reglage, perso: reglage.perso.filter((_, j) => j !== i) })}
              >
                <Trash2 aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-ink-soft">Aucune période ajoutée.</p>
      )}
      <form
        className="grid gap-2 sm:grid-cols-[minmax(0,2fr),minmax(0,1fr),minmax(0,1fr),auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          ajouter();
        }}
      >
        <label className="flex flex-col gap-1 font-bold">
          Nom (facultatif)
          <input
            className={champ}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Séjour chez les grands-parents"
          />
        </label>
        <label className="flex flex-col gap-1 font-bold">
          Début
          <input type="date" className={champ} value={debut} onChange={(e) => setDebut(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 font-bold">
          Fin
          <input type="date" className={champ} value={fin} onChange={(e) => setFin(e.target.value)} />
        </label>
        <Button type="submit" variant="grape">
          Ajouter
        </Button>
      </form>
      {erreur && (
        <p role="alert" className="mt-2 font-bold">
          {erreur}
        </p>
      )}
    </Section>
  );
}
