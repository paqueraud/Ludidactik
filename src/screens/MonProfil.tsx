import { Download, LogOut, Save } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarEditor } from '@/avatar/AvatarEditor';
import type { AvatarConfig } from '@/avatar/parts';
import { Screen } from '@/components/Layout';
import { Button, LudiCoin } from '@/components/ui';
import { playerLevel } from '@/engine/score';
import { downloadBackup, exportBackup } from '@/services/backup';
import { updateProfile } from '@/services/profiles';
import { useSession } from '@/stores/session';
import { AvecProfil } from './Parcours';

export function MonProfil() {
  return <AvecProfil>{(profile) => <MonProfilInner key={profile.id} profile={profile} />}</AvecProfil>;
}

function MonProfilInner({ profile }: { profile: import('@/services/storage/db').Profile }) {
  const navigate = useNavigate();
  const logout = useSession((s) => s.logout);
  const [avatar, setAvatar] = useState<AvatarConfig>(profile.avatar);
  const [message, setMessage] = useState<string | null>(null);
  const lvl = playerLevel(profile.xp);
  const modifie = JSON.stringify(avatar) !== JSON.stringify(profile.avatar);

  return (
    <Screen titre={`Mon profil : ${profile.prenom}`} retour="/jouer" large>
      <div className="carte mb-5 flex flex-wrap items-center gap-4 p-4">
        <div className="flex-1">
          <div className="font-titre text-2xl font-extrabold">
            Niveau {lvl.niveau} · {lvl.titre}
          </div>
          <div
            className="mt-2 h-4 overflow-hidden rounded-full bg-ink/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={lvl.xpPourSuivant}
            aria-valuenow={lvl.xpDansNiveau}
            aria-label="Expérience"
          >
            <div
              className="h-full rounded-full bg-grape transition-all"
              style={{ width: `${(lvl.xpDansNiveau / lvl.xpPourSuivant) * 100}%` }}
            />
          </div>
          <div className="mt-1 text-sm text-ink-soft">
            {lvl.xpDansNiveau} / {lvl.xpPourSuivant} XP avant le niveau {lvl.niveau + 1}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-sun/30 px-4 py-2 font-titre text-2xl font-extrabold">
          <LudiCoin size={30} /> {profile.ludis}
        </div>
      </div>

      <h2 className="mb-2 text-2xl">Mon avatar</h2>
      <AvatarEditor value={avatar} onChange={setAvatar} />
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Button
          variant="grass"
          size="lg"
          icon={<Save aria-hidden />}
          disabled={!modifie}
          onClick={async () => {
            await updateProfile(profile.id, { avatar });
            setMessage('Avatar enregistré !');
          }}
        >
          Enregistrer l’avatar
        </Button>
        <Button
          variant="blanc"
          icon={<Download aria-hidden />}
          onClick={async () => {
            downloadBackup(await exportBackup());
            setMessage('Sauvegarde téléchargée. Garde ce fichier pour changer d’appareil !');
          }}
        >
          Sauvegarder (fichier)
        </Button>
        <Button
          variant="coral"
          icon={<LogOut aria-hidden />}
          onClick={() => {
            logout();
            navigate('/profils', { replace: true });
          }}
        >
          Changer de joueur
        </Button>
      </div>
      {message && (
        <p role="status" className="mt-3 text-center font-bold">
          {message}
        </p>
      )}
    </Screen>
  );
}
