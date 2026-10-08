import { Check, Eye, EyeOff, Image, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarEditor } from '@/avatar/AvatarEditor';
import { randomAvatar } from '@/avatar/parts';
import { Screen } from '@/components/Layout';
import { PicturePassword } from '@/components/PicturePassword';
import { Button, SpeakButton } from '@/components/ui';
import { CLASSES_ACTIVES } from '@/content';
import { CLASSES, type Classe } from '@/content/schemas';
import { PICTO_LENGTH, pictoSecret } from '@/services/auth';
import { createProfile } from '@/services/profiles';
import { sfx } from '@/services/sfx';
import { useSession } from '@/stores/session';

type Etape = 1 | 2 | 3;

export function CreerProfil() {
  const navigate = useNavigate();
  const login = useSession((s) => s.login);
  const [etape, setEtape] = useState<Etape>(1);
  const [prenom, setPrenom] = useState('');
  const [classe, setClasse] = useState<Classe>('CE1');
  const [avatar, setAvatar] = useState(() => randomAvatar());
  const [authType, setAuthType] = useState<'texte' | 'image'>('image');
  const [mdp, setMdp] = useState('');
  const [mdp2, setMdp2] = useState('');
  const [voir, setVoir] = useState(false);
  const [pictos, setPictos] = useState<string[]>([]);
  const [pictos2, setPictos2] = useState<string[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const prenomOk = prenom.trim().length >= 2 && prenom.trim().length <= 20;
  const texteOk = mdp.trim().length >= 4 && mdp === mdp2;
  const imageOk = pictos.length === PICTO_LENGTH && pictos2 !== null && pictos2.join() === pictos.join();

  const creer = async () => {
    setEnCours(true);
    const p = await createProfile({
      prenom,
      avatar,
      classe,
      authType,
      secret: authType === 'texte' ? mdp : pictoSecret(pictos),
    });
    sfx.play('fanfare');
    login(p.id);
    navigate('/accueil', { replace: true });
  };

  const titres: Record<Etape, string> = {
    1: 'Comment t’appelles-tu ?',
    2: 'Crée ton avatar',
    3: 'Ton mot de passe secret',
  };

  return (
    <Screen
      titre={titres[etape]}
      retour={etape === 1 ? '/profils' : () => setEtape((e) => (e - 1) as Etape)}
      large={etape === 2}
    >
      <ol className="mb-5 flex justify-center gap-2" aria-label={`Étape ${etape} sur 3`}>
        {[1, 2, 3].map((i) => (
          <li
            key={i}
            className={`h-3 w-16 rounded-full ${i <= etape ? 'bg-grape' : 'bg-ink/10'}`}
            aria-current={i === etape ? 'step' : undefined}
          />
        ))}
      </ol>

      {etape === 1 && (
        <div className="carte mx-auto flex max-w-xl flex-col gap-5 p-6">
          <label className="flex flex-col gap-2 text-lg font-bold">
            Ton prénom
            <input
              className="min-h-btn rounded-2xl border-4 border-sky bg-cream px-4 font-titre text-3xl outline-none focus:border-grape"
              value={prenom}
              maxLength={20}
              autoComplete="off"
              autoFocus
              onChange={(e) => setPrenom(e.target.value.replace(/[^\p{L}\s'-]/gu, ''))}
              onKeyDown={(e) => e.key === 'Enter' && prenomOk && setEtape(2)}
            />
          </label>
          <fieldset>
            <legend className="mb-2 flex items-center gap-2 text-lg font-bold">
              Ta classe <SpeakButton text="Choisis ta classe." size={36} />
            </legend>
            <div className="grid grid-cols-5 gap-2" role="radiogroup">
              {CLASSES.map((c) => {
                const active = CLASSES_ACTIVES.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={classe === c}
                    disabled={!active}
                    className={`btn-3d min-h-btn text-xl ${classe === c ? 'bg-grape text-white' : 'bg-cream'} ${active ? '' : 'opacity-40'}`}
                    onClick={() => setClasse(c)}
                    title={active ? c : `${c} : bientôt`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <Button size="lg" variant="grass" disabled={!prenomOk} onClick={() => setEtape(2)}>
            Suivant
          </Button>
        </div>
      )}

      {etape === 2 && (
        <div className="flex flex-col gap-4">
          <AvatarEditor value={avatar} onChange={setAvatar} />
          <Button size="lg" variant="grass" className="self-center" onClick={() => setEtape(3)}>
            Il est super, suivant !
          </Button>
        </div>
      )}

      {etape === 3 && (
        <div className="carte mx-auto flex max-w-2xl flex-col items-center gap-5 p-6">
          <div className="flex gap-2" role="radiogroup" aria-label="Type de mot de passe">
            <button
              type="button"
              role="radio"
              aria-checked={authType === 'image'}
              className={`btn-3d flex min-h-btn items-center gap-2 px-4 ${authType === 'image' ? 'bg-grape text-white' : 'bg-cream'}`}
              onClick={() => setAuthType('image')}
            >
              <Image aria-hidden /> Avec des images
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={authType === 'texte'}
              className={`btn-3d flex min-h-btn items-center gap-2 px-4 ${authType === 'texte' ? 'bg-grape text-white' : 'bg-cream'}`}
              onClick={() => setAuthType('texte')}
            >
              <KeyRound aria-hidden /> Avec des lettres
            </button>
          </div>

          {authType === 'image' ? (
            <>
              <p className="flex items-center gap-2 text-lg font-bold">
                {pictos2 === null ? 'Touche 4 images dans l’ordre.' : 'Encore une fois pour vérifier !'}
                <SpeakButton
                  text={
                    pictos2 === null
                      ? 'Touche 4 images dans l’ordre. Retiens-les bien !'
                      : 'Touche les mêmes images, dans le même ordre.'
                  }
                  size={36}
                />
              </p>
              {pictos2 === null ? (
                <PicturePassword value={pictos} onChange={setPictos} />
              ) : (
                <PicturePassword
                  value={pictos2}
                  onChange={setPictos2}
                  erreur={pictos2.length === PICTO_LENGTH && !imageOk}
                  masque
                />
              )}
              {pictos2 === null && pictos.length === PICTO_LENGTH && (
                <Button variant="sky" onClick={() => setPictos2([])}>
                  J’ai retenu !
                </Button>
              )}
              {pictos2 !== null && pictos2.length === PICTO_LENGTH && !imageOk && (
                <p className="font-bold text-coral-dark" role="alert">
                  Ce n’est pas le même ordre. On recommence ?{' '}
                  <button type="button" className="underline" onClick={() => setPictos2([])}>
                    Réessayer
                  </button>
                </p>
              )}
            </>
          ) : (
            <div className="flex w-full max-w-sm flex-col gap-3">
              <label className="flex flex-col gap-1 font-bold">
                Mot de passe (4 caractères ou plus)
                <span className="flex gap-2">
                  <input
                    className="min-h-btn flex-1 rounded-2xl border-4 border-sky bg-cream px-4 text-2xl outline-none focus:border-grape"
                    type={voir ? 'text' : 'password'}
                    value={mdp}
                    autoComplete="new-password"
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
              </label>
              <label className="flex flex-col gap-1 font-bold">
                Encore une fois
                <input
                  className="min-h-btn rounded-2xl border-4 border-sky bg-cream px-4 text-2xl outline-none focus:border-grape"
                  type={voir ? 'text' : 'password'}
                  value={mdp2}
                  autoComplete="new-password"
                  onChange={(e) => setMdp2(e.target.value)}
                />
              </label>
              {mdp2.length >= mdp.length && mdp2 && mdp !== mdp2 && (
                <p className="font-bold text-coral-dark">Les deux mots de passe sont différents.</p>
              )}
            </div>
          )}
          {erreur && <p role="alert">{erreur}</p>}
          <Button
            size="lg"
            variant="grass"
            icon={<Check aria-hidden />}
            disabled={enCours || !(authType === 'texte' ? texteOk : imageOk)}
            onClick={() =>
              creer().catch(() => {
                setErreur('Oups, la création a échoué. Réessaie.');
                setEnCours(false);
              })
            }
          >
            Créer mon profil
          </Button>
          <p className="text-center text-sm text-ink-soft">
            Si tu l’oublies, un parent pourra le changer dans l’espace parents.
          </p>
        </div>
      )}
    </Screen>
  );
}
