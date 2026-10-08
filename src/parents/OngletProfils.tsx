/** Gestion des profils (renommer, classe, mot de passe, suppression) et sauvegarde de l'appareil. */
import { Download, Eye, EyeOff, KeyRound, Pencil, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Avatar } from '@/avatar/Avatar';
import { PicturePassword } from '@/components/PicturePassword';
import { Button } from '@/components/ui';
import { CLASSES_ACTIVES } from '@/content';
import type { Classe } from '@/content/schemas';
import { PICTO_LENGTH, pictoSecret } from '@/services/auth';
import { downloadBackup, exportBackup, importBackup } from '@/services/backup';
import { type Profile, deleteProfile, resetPassword, updateProfile } from '@/services/profiles';
import { useSession } from '@/stores/session';
import { useSettings } from '@/stores/settings';
import { AucunProfil, Section, champ } from './ui';

export function OngletProfils({ profiles }: { profiles: Profile[] }) {
  return (
    <>
      <Section
        titre="Profils des enfants"
        intro="Les mots de passe des enfants sont un verrou familial : en cas d’oubli, choisissez-en un nouveau ici."
      >
        {profiles.length === 0 && <AucunProfil />}
        <div className="flex flex-col gap-4">
          {profiles.map((p) => (
            <CarteProfil key={p.id} profile={p} />
          ))}
        </div>
      </Section>
      <Sauvegarde />
    </>
  );
}

type Mode = null | 'renommer' | 'mdp' | 'supprimer';

function CarteProfil({ profile }: { profile: Profile }) {
  const [mode, setMode] = useState<Mode>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fermer = (m?: string) => {
    setMode(null);
    setMessage(m ?? null);
  };

  return (
    <article
      className="rounded-2xl border-2 border-ink/10 bg-cream p-4"
      aria-label={`Profil de ${profile.prenom}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Avatar config={profile.avatar} size={64} compagnon={false} fond="rgb(var(--c-sky) / 0.35)" />
        <div className="min-w-0 flex-1">
          <div className="font-titre text-2xl font-extrabold">{profile.prenom}</div>
          <div className="text-sm text-ink-soft">
            Mot de passe {profile.auth.type === 'image' ? 'image' : 'texte'} · créé le{' '}
            {new Date(profile.creeLe).toLocaleDateString('fr-FR')}
          </div>
        </div>
        <label className="flex w-full items-center gap-2 font-bold sm:w-auto">
          Classe
          <select
            className={`${champ} w-auto bg-card`}
            value={profile.classe}
            onChange={(e) => {
              void updateProfile(profile.id, { classe: e.target.value as Classe });
              setMessage(`Classe de ${profile.prenom} : ${e.target.value}.`);
            }}
          >
            {CLASSES_ACTIVES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="blanc" icon={<Pencil size={18} aria-hidden />} onClick={() => setMode('renommer')}>
          Renommer
        </Button>
        <Button variant="sky" icon={<KeyRound size={18} aria-hidden />} onClick={() => setMode('mdp')}>
          Nouveau mot de passe
        </Button>
        <Button variant="blanc" icon={<Trash2 size={18} aria-hidden />} onClick={() => setMode('supprimer')}>
          Supprimer
        </Button>
      </div>
      {message && (
        <p role="status" className="mt-2 font-bold">
          {message}
        </p>
      )}
      {mode === 'renommer' && <Renommer profile={profile} onFin={fermer} />}
      {mode === 'mdp' && <NouveauMotDePasse profile={profile} onFin={fermer} />}
      {mode === 'supprimer' && <Supprimer profile={profile} onFin={fermer} />}
    </article>
  );
}

function Renommer({ profile, onFin }: { profile: Profile; onFin(m?: string): void }) {
  const [prenom, setPrenom] = useState(profile.prenom);
  const ok = prenom.trim().length >= 2 && prenom.trim().length <= 20;
  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!ok) return;
        await updateProfile(profile.id, { prenom: prenom.trim() });
        onFin(`Profil renommé : ${prenom.trim()}.`);
      }}
    >
      <label className="flex min-w-0 flex-1 flex-col gap-1 font-bold">
        Nouveau prénom
        <input
          className={`${champ} bg-card`}
          value={prenom}
          maxLength={20}
          autoFocus
          onChange={(e) => setPrenom(e.target.value)}
        />
      </label>
      <Button type="submit" variant="grass" disabled={!ok}>
        Enregistrer
      </Button>
      <Button variant="blanc" onClick={() => onFin()}>
        Annuler
      </Button>
    </form>
  );
}

function NouveauMotDePasse({ profile, onFin }: { profile: Profile; onFin(m?: string): void }) {
  const [type, setType] = useState<'texte' | 'image'>(profile.auth.type);
  const [mdp, setMdp] = useState('');
  const [voir, setVoir] = useState(true);
  const [pictos, setPictos] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);
  const ok = type === 'texte' ? mdp.trim().length >= 4 : pictos.length === PICTO_LENGTH;

  return (
    <form
      className="mt-3 flex flex-col gap-3 rounded-2xl bg-card p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!ok) return;
        setEnCours(true);
        await resetPassword(profile.id, type, type === 'texte' ? mdp : pictoSecret(pictos));
        onFin(`Nouveau mot de passe enregistré pour ${profile.prenom}. Montrez-le-lui !`);
      }}
    >
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Type de mot de passe">
        {(['texte', 'image'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            className={`min-h-touch rounded-full px-4 font-bold ${type === t ? 'bg-ink text-cream' : 'bg-cream'}`}
          >
            {t === 'texte' ? 'Avec des lettres' : 'Avec des images'}
          </button>
        ))}
      </div>
      {type === 'texte' ? (
        <label className="flex flex-col gap-1 font-bold">
          Nouveau mot de passe (4 caractères ou plus)
          <span className="flex gap-2">
            <input
              className={`${champ} bg-cream`}
              type={voir ? 'text' : 'password'}
              value={mdp}
              autoComplete="new-password"
              autoCapitalize="none"
              onChange={(e) => setMdp(e.target.value)}
            />
            <button
              type="button"
              className="flex min-h-touch w-14 shrink-0 items-center justify-center rounded-2xl bg-cream"
              aria-label={voir ? 'Cacher' : 'Montrer'}
              onClick={() => setVoir((v) => !v)}
            >
              {voir ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            </button>
          </span>
        </label>
      ) : (
        <div>
          <p className="mb-2 font-bold">Touchez 4 images dans l’ordre (à montrer ensuite à l’enfant).</p>
          <PicturePassword value={pictos} onChange={setPictos} />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="grass" disabled={!ok || enCours}>
          Enregistrer le mot de passe
        </Button>
        <Button variant="blanc" onClick={() => onFin()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function Supprimer({ profile, onFin }: { profile: Profile; onFin(m?: string): void }) {
  const session = useSession();
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-coral/15 p-4" role="alert">
      <p className="font-bold">
        Supprimer définitivement le profil de {profile.prenom} ? Sa progression, ses records et son temps de
        jeu seront effacés ; les listes de mots destinées à lui seul aussi. Pensez à faire une sauvegarde
        avant.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="coral"
          icon={<Trash2 size={18} aria-hidden />}
          onClick={async () => {
            if (session.profileId === profile.id) session.logout();
            await deleteProfile(profile.id);
            onFin();
          }}
        >
          Oui, supprimer {profile.prenom}
        </Button>
        <Button variant="blanc" onClick={() => onFin()}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

function Sauvegarde() {
  const fichier = useRef<HTMLInputElement>(null);
  const [remplacer, setRemplacer] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const charger = useSettings((s) => s.load);

  return (
    <Section
      titre="Sauvegarde"
      intro="Rien n’est stocké en ligne. Pour changer d’appareil, téléchargez une sauvegarde (profils, progression, listes de mots et enregistrements de voix, réglages, code parent) puis importez-la sur le nouvel appareil."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="grass"
          icon={<Download size={18} aria-hidden />}
          onClick={async () => {
            downloadBackup(await exportBackup());
            setMessage('Sauvegarde téléchargée.');
          }}
        >
          Télécharger une sauvegarde
        </Button>
        <Button
          variant="sky"
          icon={<Upload size={18} aria-hidden />}
          onClick={() => fichier.current?.click()}
        >
          Importer une sauvegarde
        </Button>
        <input
          ref={fichier}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Fichier de sauvegarde"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              const r = await importBackup(JSON.parse(await f.text()), { remplacer });
              await charger();
              setMessage(`Sauvegarde importée : ${r.profils} profil${r.profils > 1 ? 's' : ''}.`);
            } catch {
              setMessage('Ce fichier n’est pas une sauvegarde Ludidactik valide. Rien n’a été modifié.');
            }
          }}
        />
      </div>
      <label className="mt-3 flex min-h-touch cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={remplacer}
          onChange={(e) => setRemplacer(e.target.checked)}
        />
        <span>
          Remplacer toutes les données de cet appareil par la sauvegarde (sinon, les données sont fusionnées).
        </span>
      </label>
      {message && (
        <p role="status" className="mt-2 font-bold">
          {message}
        </p>
      )}
    </Section>
  );
}
