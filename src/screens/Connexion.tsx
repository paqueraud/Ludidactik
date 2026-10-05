import { useLiveQuery } from 'dexie-react-hooks';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '@/avatar/Avatar';
import { Screen } from '@/components/Layout';
import { PicturePassword } from '@/components/PicturePassword';
import { Button, SpeakButton } from '@/components/ui';
import { PICTO_LENGTH, pictoSecret, verifyAuth } from '@/services/auth';
import { sfx } from '@/services/sfx';
import { db } from '@/services/storage/db';
import { useSession } from '@/stores/session';

export function Connexion() {
  const { profileId = '' } = useParams();
  const navigate = useNavigate();
  const login = useSession((s) => s.login);
  const profile = useLiveQuery(() => db.profiles.get(profileId), [profileId]);
  const [mdp, setMdp] = useState('');
  const [voir, setVoir] = useState(false);
  const [pictos, setPictos] = useState<string[]>([]);
  const [erreur, setErreur] = useState(false);
  const [verif, setVerif] = useState(false);

  const essayer = async (secret: string) => {
    if (!profile || verif) return;
    setVerif(true);
    const ok = await verifyAuth(profile.auth, secret);
    setVerif(false);
    if (ok) {
      sfx.play('juste');
      await db.profiles.update(profile.id, { derniereConnexion: Date.now() });
      login(profile.id);
      navigate('/jouer', { replace: true });
    } else {
      sfx.play('faux');
      setErreur(true);
      setTimeout(() => {
        setErreur(false);
        setPictos([]);
      }, 900);
    }
  };

  // Validation automatique dès que 4 images sont choisies
  useEffect(() => {
    if (profile?.auth.type === 'image' && pictos.length === PICTO_LENGTH) void essayer(pictoSecret(pictos));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pictos]);

  if (profile === undefined) return null;
  if (profile === null) {
    navigate('/profils', { replace: true });
    return null;
  }

  const consigne =
    profile.auth.type === 'image'
      ? `Bonjour ${profile.prenom} ! Touche tes 4 images secrètes.`
      : `Bonjour ${profile.prenom} ! Écris ton mot de passe.`;

  return (
    <Screen titre={`Bonjour ${profile.prenom} !`} aLire={consigne} retour="/profils">
      <div className="carte mx-auto flex max-w-2xl flex-col items-center gap-5 p-6">
        <Avatar
          config={profile.avatar}
          size={130}
          fond="rgb(var(--c-sky) / 0.3)"
          humeur={erreur ? 'inquiet' : 'normal'}
        />
        <p className="flex items-center gap-2 text-lg font-bold">
          {profile.auth.type === 'image' ? 'Touche tes 4 images secrètes.' : 'Écris ton mot de passe.'}
          <SpeakButton text={consigne} size={36} />
        </p>
        {profile.auth.type === 'image' ? (
          <PicturePassword value={pictos} onChange={setPictos} erreur={erreur} masque />
        ) : (
          <form
            className="flex w-full max-w-sm flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void essayer(mdp);
            }}
          >
            <span className="flex gap-2">
              <input
                className={`min-h-btn flex-1 rounded-2xl border-4 bg-cream px-4 text-2xl outline-none focus:border-grape ${erreur ? 'animate-shake border-coral' : 'border-sky'}`}
                type={voir ? 'text' : 'password'}
                value={mdp}
                autoFocus
                autoComplete="current-password"
                aria-label="Mot de passe"
                onChange={(e) => setMdp(e.target.value)}
              />
              <button
                type="button"
                className="flex w-14 items-center justify-center rounded-2xl bg-cream"
                aria-label={voir ? 'Cacher' : 'Montrer'}
                onClick={() => setVoir((v) => !v)}
              >
                {voir ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              </button>
            </span>
            <Button
              variant="grass"
              size="lg"
              icon={<LogIn aria-hidden />}
              onClick={() => void essayer(mdp)}
              disabled={!mdp || verif}
            >
              Entrer
            </Button>
          </form>
        )}
        {erreur && (
          <p className="font-bold text-coral-dark" role="alert">
            Oups, ce n’est pas ça. On réessaie ?
          </p>
        )}
        <p className="text-sm text-ink-soft">
          Mot de passe oublié ? Demande à un parent : il peut le changer dans l’espace parents.
        </p>
      </div>
    </Screen>
  );
}
