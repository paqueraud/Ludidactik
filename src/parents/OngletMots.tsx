/** Listes de mots de la semaine : création, modification, suppression, collage, voix du parent. */
import { useLiveQuery } from 'dexie-react-hooks';
import { ClipboardPaste, Pencil, Plus, Save, Trash2, Volume2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { useProfiles } from '@/services/profiles';
import { speech } from '@/services/speech';
import { type ParentWord, type ParentWordList, type Profile, db } from '@/services/storage/db';
import { dayKey } from '@/services/screenTime';
import { deleteRecording, deleteWordList, destinataires, saveWordList } from '@/services/wordLists';
import { Enregistreur, enregistrementPossible } from './Enregistreur';
import { Section, champ } from './ui';
import { cleMot, nettoyerMot, parseWordPaste } from './wordPaste';

/** Lundi de la semaine en cours (AAAA-MM-JJ). */
function lundi(d = new Date()): string {
  const decalage = (d.getDay() + 6) % 7;
  return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - decalage));
}

function libelleSemaine(semaine?: string): string | null {
  if (!semaine) return null;
  const m = semaine.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return semaine;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `Semaine du ${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
}

const nouvelleListe = (): ParentWordList => ({
  id: crypto.randomUUID(),
  titre: 'Mots de la semaine',
  semaine: lundi(),
  profileIds: [],
  mots: [],
  creeLe: Date.now(),
});

export function OngletMots() {
  const listes = useLiveQuery(() => db.wordLists.orderBy('creeLe').reverse().toArray(), []);
  const profiles = useProfiles() ?? [];
  const [edition, setEdition] = useState<ParentWordList | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  if (edition)
    return (
      <EditeurListe
        initiale={edition}
        profiles={profiles}
        nouvelle={!listes?.some((l) => l.id === edition.id)}
        onFermer={() => setEdition(null)}
      />
    );

  return (
    <Section
      titre="Mots de la semaine"
      intro={
        <>
          Ajoutez les mots que votre enfant apprend en classe. Il les retrouve tout en haut de son écran, dans
          « Mes mots de la semaine », avec les jeux d’orthographe (L’Ascension, l’Appareil photo, le Wordle,
          les Mots croisés…).
        </>
      }
      actions={
        <Button variant="grass" icon={<Plus aria-hidden />} onClick={() => setEdition(nouvelleListe())}>
          Nouvelle liste
        </Button>
      }
    >
      {listes && listes.length === 0 && (
        <p className="rounded-2xl bg-cream p-4">Aucune liste pour le moment. Créez la première !</p>
      )}
      <ul className="grid gap-3 md:grid-cols-2">
        {listes?.map((l) => (
          <li key={l.id} className="flex flex-col gap-2 rounded-2xl border-2 border-ink/10 bg-cream p-4">
            <div className="font-titre text-xl font-bold">{l.titre}</div>
            <div className="text-sm text-ink-soft">
              {[libelleSemaine(l.semaine), destinataires(l, profiles)].filter(Boolean).join(' · ')}
            </div>
            <p>
              <strong>
                {l.mots.length} mot{l.mots.length > 1 ? 's' : ''}
              </strong>{' '}
              :{' '}
              {l.mots
                .slice(0, 8)
                .map((m) => m.mot)
                .join(', ')}
              {l.mots.length > 8 ? '…' : ''}
            </p>
            {aSupprimer === l.id ? (
              <div className="flex flex-wrap items-center gap-2" role="alert">
                <span className="font-bold">Supprimer cette liste et ses enregistrements ?</span>
                <Button
                  variant="coral"
                  onClick={async () => {
                    await deleteWordList(l.id);
                    setASupprimer(null);
                  }}
                >
                  Oui, supprimer
                </Button>
                <Button variant="blanc" onClick={() => setASupprimer(null)}>
                  Annuler
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button variant="sky" icon={<Pencil size={18} aria-hidden />} onClick={() => setEdition(l)}>
                  Modifier
                </Button>
                <Button
                  variant="blanc"
                  icon={<Trash2 size={18} aria-hidden />}
                  onClick={() => setASupprimer(l.id)}
                  aria-label={`Supprimer la liste « ${l.titre} »`}
                >
                  Supprimer
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function EditeurListe({
  initiale,
  profiles,
  nouvelle,
  onFermer,
}: {
  initiale: ParentWordList;
  profiles: Profile[];
  nouvelle: boolean;
  onFermer(): void;
}) {
  const [liste, setListe] = useState<ParentWordList>(initiale);
  const [motSaisi, setMotSaisi] = useState('');
  const [collage, setCollage] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [alerte, setAlerte] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  /** Enregistrements créés pendant cette édition (nettoyés s'ils ne servent plus). */
  const nouvellesCles = useRef<string[]>([]);

  const setMots = (f: (mots: ParentWord[]) => ParentWord[]) => setListe((l) => ({ ...l, mots: f(l.mots) }));
  const existants = liste.mots.map((m) => m.mot);

  const ajouterMot = () => {
    const mot = nettoyerMot(motSaisi);
    if (!mot) return;
    if (existants.some((m) => cleMot(m) === cleMot(mot))) {
      setMessage(`« ${mot} » est déjà dans la liste.`);
      return;
    }
    setMots((ms) => [...ms, { mot }]);
    setMotSaisi('');
    setMessage(`« ${mot} » ajouté.`);
  };

  const ajouterCollage = () => {
    const r = parseWordPaste(collage, existants);
    setMots((ms) => [...ms, ...r.mots.map((mot) => ({ mot }))]);
    const parts = [
      `${r.mots.length} mot${r.mots.length > 1 ? 's' : ''} ajouté${r.mots.length > 1 ? 's' : ''}`,
    ];
    if (r.doublons.length)
      parts.push(
        `doublon${r.doublons.length > 1 ? 's' : ''} ignoré${r.doublons.length > 1 ? 's' : ''} : ${r.doublons.join(', ')}`,
      );
    if (r.tropLongs.length)
      parts.push(
        `trop long${r.tropLongs.length > 1 ? 's' : ''} (40 caractères au plus) : ${r.tropLongs.join(' / ')}`,
      );
    setMessage(parts.join(' · '));
    if (r.mots.length) setCollage('');
  };

  const nettoyerNouvelles = async (gardees: Set<string>) => {
    for (const k of nouvellesCles.current) if (!gardees.has(k)) await deleteRecording(k);
    nouvellesCles.current = [];
  };

  const enregistrer = async () => {
    const mots = liste.mots
      .map((m) => ({ ...m, mot: nettoyerMot(m.mot), phrase: m.phrase?.trim() || undefined }))
      .filter((m) => m.mot);
    if (!mots.length) return;
    setEnCours(true);
    await saveWordList({ ...liste, titre: liste.titre.trim() || 'Mots de la semaine', mots });
    await nettoyerNouvelles(new Set(mots.map((m) => m.audioKey).filter((k): k is string => !!k)));
    onFermer();
  };

  const annuler = async () => {
    await nettoyerNouvelles(new Set());
    onFermer();
  };

  const certains = liste.profileIds.length > 0;

  return (
    <Section
      titre={nouvelle ? 'Nouvelle liste de mots' : `Modifier « ${initiale.titre} »`}
      intro="Les modifications sont enregistrées quand vous touchez « Enregistrer la liste »."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="liste-titre" className="font-bold">
            Titre
          </label>
          <input
            id="liste-titre"
            className={champ}
            value={liste.titre}
            maxLength={60}
            onChange={(e) => setListe({ ...liste, titre: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="liste-semaine" className="font-bold">
            Semaine du
          </label>
          <input
            id="liste-semaine"
            type="date"
            className={champ}
            value={liste.semaine ?? ''}
            onChange={(e) => setListe({ ...liste, semaine: e.target.value || undefined })}
          />
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="font-bold">Pour quels enfants ?</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          <label className="flex min-h-touch cursor-pointer items-center gap-2 rounded-full bg-cream px-4">
            <input
              type="radio"
              name="destinataires"
              className="h-5 w-5"
              checked={!certains}
              onChange={() => setListe({ ...liste, profileIds: [] })}
            />
            Tous les enfants
          </label>
          {profiles.map((p) => (
            <label
              key={p.id}
              className="flex min-h-touch cursor-pointer items-center gap-2 rounded-full bg-cream px-4"
            >
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={liste.profileIds.includes(p.id)}
                onChange={(e) =>
                  setListe({
                    ...liste,
                    profileIds: e.target.checked
                      ? [...liste.profileIds, p.id]
                      : liste.profileIds.filter((id) => id !== p.id),
                  })
                }
              />
              {p.prenom} ({p.classe})
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <form
          className="flex flex-col gap-2 rounded-2xl bg-cream p-4"
          onSubmit={(e) => {
            e.preventDefault();
            ajouterMot();
          }}
        >
          <label htmlFor="mot-saisi" className="font-bold">
            Ajouter un mot
          </label>
          <span className="flex gap-2">
            <input
              id="mot-saisi"
              className={`${champ} bg-card`}
              value={motSaisi}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={40}
              onChange={(e) => setMotSaisi(e.target.value)}
            />
            <Button type="submit" variant="grass" disabled={!motSaisi.trim()} aria-label="Ajouter le mot">
              <Plus aria-hidden />
            </Button>
          </span>
        </form>
        <div className="flex flex-col gap-2 rounded-2xl bg-cream p-4">
          <label htmlFor="collage" className="font-bold">
            Ou collez une liste
          </label>
          <textarea
            id="collage"
            className={`${champ} min-h-[96px] bg-card`}
            placeholder={'un mot par ligne, ou séparés par des virgules :\nmaison, chocolat, Paris'}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={collage}
            onChange={(e) => setCollage(e.target.value)}
          />
          <Button
            variant="sky"
            icon={<ClipboardPaste size={18} aria-hidden />}
            disabled={!collage.trim()}
            onClick={ajouterCollage}
          >
            Ajouter ces mots
          </Button>
        </div>
      </div>
      {message && (
        <p role="status" className="mt-3 font-bold">
          {message}
        </p>
      )}

      <h3 className="mb-2 mt-5 text-xl">
        {liste.mots.length} mot{liste.mots.length > 1 ? 's' : ''} dans la liste
      </h3>
      {!enregistrementPossible() && (
        <p className="mb-3 rounded-2xl bg-sun/25 p-3 text-sm">
          L’enregistrement de votre voix n’est pas disponible sur ce navigateur : les mots seront lus par la
          voix de synthèse.
        </p>
      )}
      {alerte && (
        <p role="alert" className="mb-3 rounded-2xl bg-coral/15 p-3 text-sm font-bold">
          {alerte}
        </p>
      )}
      <ol className="flex flex-col gap-2">
        {liste.mots.map((m, i) => (
          <li
            key={i}
            className="flex flex-col gap-2 rounded-2xl border-2 border-ink/10 p-3 lg:flex-row lg:items-center"
          >
            <span className="flex flex-1 flex-col gap-2 sm:flex-row">
              <input
                className={`${champ} font-bold sm:max-w-[220px]`}
                value={m.mot}
                aria-label={`Mot n° ${i + 1}`}
                autoCapitalize="none"
                spellCheck={false}
                maxLength={40}
                onChange={(e) =>
                  setMots((ms) => ms.map((x, j) => (j === i ? { ...x, mot: e.target.value } : x)))
                }
              />
              <input
                className={champ}
                value={m.phrase ?? ''}
                placeholder="Phrase-contexte (facultatif)"
                aria-label={`Phrase-contexte pour « ${m.mot} » (facultatif)`}
                maxLength={160}
                onChange={(e) =>
                  setMots((ms) => ms.map((x, j) => (j === i ? { ...x, phrase: e.target.value } : x)))
                }
              />
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Enregistreur
                mot={m.mot}
                audioKey={m.audioKey}
                nouvelleCle={() => {
                  const k = `parent:${liste.id}:${crypto.randomUUID()}`;
                  nouvellesCles.current.push(k);
                  return k;
                }}
                onChange={(audioKey) => setMots((ms) => ms.map((x, j) => (j === i ? { ...x, audioKey } : x)))}
                onErreur={setAlerte}
              />
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sun"
                aria-label={`Écouter « ${m.mot} » comme dans le jeu`}
                onClick={() => void speech.dictate(m.mot, m.phrase || undefined, m.audioKey)}
              >
                <Volume2 size={20} aria-hidden />
              </button>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/10"
                aria-label={`Retirer « ${m.mot} » de la liste`}
                onClick={() => setMots((ms) => ms.filter((_, j) => j !== i))}
              >
                <X size={20} aria-hidden />
              </button>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          variant="grass"
          size="lg"
          icon={<Save aria-hidden />}
          disabled={!liste.mots.some((m) => m.mot.trim()) || enCours}
          onClick={() => void enregistrer()}
        >
          Enregistrer la liste
        </Button>
        <Button variant="blanc" size="lg" onClick={() => void annuler()}>
          Annuler
        </Button>
      </div>
    </Section>
  );
}
