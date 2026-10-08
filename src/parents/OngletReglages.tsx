/** Réglages de l'appareil (useSettings) : programme, micro, police, sons, voix, département, contenus. */
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { speech } from '@/services/speech';
import { useSettings } from '@/stores/settings';
import { DEPARTEMENTS } from './departements';
import { Interrupteur, Section, champ } from './ui';

function Choix<T extends string>({
  name,
  legende,
  value,
  options,
  onChange,
}: {
  name: string;
  legende: string;
  value: T;
  options: { v: T; label: string; detail?: string }[];
  onChange(v: T): void;
}) {
  return (
    <fieldset className="py-2">
      <legend className="mb-2 font-bold">{legende}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.v}
            className={`flex min-h-touch cursor-pointer items-start gap-3 rounded-2xl p-3 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-grape ${value === o.v ? 'bg-grape/15 ring-2 ring-grape' : 'bg-cream'}`}
          >
            <input
              type="radio"
              name={name}
              className="mt-1 h-5 w-5 shrink-0"
              checked={value === o.v}
              onChange={() => onChange(o.v)}
            />
            <span>
              <span className="block font-bold">{o.label}</span>
              {o.detail && <span className="block text-sm text-ink-soft">{o.detail}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const PHRASE_ESSAI = 'Bonjour ! Écoute bien : le petit chat boit son lait.';

export function OngletReglages() {
  const s = useSettings();
  const update = s.update;

  return (
    <>
      <Section titre="Programmes">
        <Choix
          name="programme"
          legende="Programme d’histoire-géographie et de sciences"
          value={s.programmeHG}
          onChange={(v) => void update({ programmeHG: v })}
          options={[
            {
              v: '2020',
              label: 'Programme 2020',
              detail: 'En vigueur pendant l’année scolaire 2026-2027 (recommandé).',
            },
            {
              v: '2026',
              label: 'Programme 2026',
              detail: 'Nouveaux programmes applicables à la rentrée 2027.',
            },
          ]}
        />
        <div className="flex flex-col gap-1 py-2">
          <label htmlFor="departement" className="font-bold">
            Département de l’élève
          </label>
          <select
            id="departement"
            className={`${champ} sm:max-w-md`}
            value={s.departement ?? ''}
            onChange={(e) => void update({ departement: e.target.value || null })}
          >
            <option value="">Non précisé</option>
            {DEPARTEMENTS.map(([code, nom]) => (
              <option key={code} value={code}>
                {code} – {nom}
              </option>
            ))}
          </select>
          <span className="text-sm text-ink-soft">
            Sert aux leçons de géographie « là où j’habite » (programme 2026). Il reste sur cet appareil.
          </span>
        </div>
        <Interrupteur
          checked={s.puberte}
          onChange={(v) => void update({ puberte: v })}
          label="Afficher les questions sur la puberté (sciences CM2)"
          description="Deux questions sobres et scientifiques sur les transformations du corps. Masquées par défaut : à vous de choisir le bon moment."
        />
        <Interrupteur
          checked={s.competition}
          onChange={(v) => void update({ competition: v })}
          label="Classements entre les enfants de l’appareil"
          description="Désactivé, chaque enfant ne se compare qu’à ses propres records."
        />
      </Section>

      <Section titre="Voix et micro">
        <div className="flex flex-col gap-2 py-2">
          <label htmlFor="debit" className="font-bold">
            Débit de la voix : {s.debitVoix.toFixed(2).replace('.', ',')}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="debit"
              type="range"
              min={0.7}
              max={1}
              step={0.05}
              className="h-12 w-full max-w-xs accent-grape"
              value={s.debitVoix}
              onChange={(e) => void update({ debitVoix: Number(e.target.value) })}
            />
            <Button
              variant="sun"
              icon={<Volume2 size={18} aria-hidden />}
              disabled={!speech.ttsAvailable}
              onClick={() => void speech.speak(PHRASE_ESSAI)}
            >
              Essayer
            </Button>
          </div>
          {!speech.ttsAvailable && (
            <span className="text-sm text-coral-dark">
              La synthèse vocale n’est pas disponible sur ce navigateur.
            </span>
          )}
        </div>
        <Choix
          name="lecture-auto"
          legende="Lecture automatique des consignes"
          value={s.lectureAuto}
          onChange={(v) => void update({ lectureAuto: v })}
          options={[
            { v: 'auto', label: 'Automatique', detail: 'Activée pour le CP et le CE1.' },
            { v: 'oui', label: 'Toujours' },
            { v: 'non', label: 'Jamais', detail: 'Le bouton 🔊 reste disponible partout.' },
          ]}
        />
        <Interrupteur
          checked={s.micro}
          onChange={(v) => void update({ micro: v })}
          label="Micro et reconnaissance vocale (jeux où l’on parle)"
          description={
            <>
              <strong>Attention : l’audio peut être traité en ligne par le navigateur</strong> (par exemple
              par Google pour Chrome). Désactivé, les jeux oraux proposent une autre façon de répondre.
              {!speech.sttAvailable && ' Ce navigateur ne propose pas la reconnaissance vocale.'}
            </>
          }
        />
      </Section>

      <Section titre="Confort">
        <Interrupteur
          checked={s.sons}
          onChange={(v) => void update({ sons: v })}
          label="Sons du jeu"
          description="Les sons ont toujours un équivalent visuel."
        />
        <Interrupteur
          checked={s.police === 'dyslexie'}
          onChange={(v) => void update({ police: v ? 'dyslexie' : 'normale' })}
          label="Police adaptée à la dyslexie (OpenDyslexic)"
        />
      </Section>
    </>
  );
}
