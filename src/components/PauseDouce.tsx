/**
 * Pause douce (GAMIFICATION §8) : affichée quand la limite de temps du jour est atteinte, jamais
 * en pleine partie. Un parent peut accorder 10 minutes de plus avec son code.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { Home, Timer } from 'lucide-react';
import { useState } from 'react';
import { formatDuree, grantBonus } from '@/services/screenTime';
import { hasParentCode, verifyParentCode } from '@/services/parentCode';
import type { Profile } from '@/services/storage/db';
import { CodeParentInput } from './CodeParentInput';
import { Sky } from './Layout';
import { Ludo } from './Ludo';
import { Button, SpeakButton } from './ui';

const MESSAGE =
  'Ton cerveau a bien travaillé ! Tu as assez joué pour aujourd’hui. Va boire un verre d’eau, bouge un peu, et on se retrouve demain pour de nouvelles aventures.';

export function PauseDouce({
  profile,
  usedMs,
  onQuit,
}: {
  profile: Profile;
  usedMs: number;
  onQuit(): void;
}) {
  const codeExiste = useLiveQuery(() => hasParentCode(), []);
  const [ouvert, setOuvert] = useState(false);
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState(false);
  const [verif, setVerif] = useState(false);

  const accorder = async () => {
    setVerif(true);
    const ok = await verifyParentCode(code);
    setVerif(false);
    if (!ok) {
      setErreur(true);
      setCode('');
      setTimeout(() => setErreur(false), 900);
      return;
    }
    await grantBonus(profile.id, 10);
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-5 px-4 py-8 text-center">
      <Sky />
      <Ludo pose="calme" size={140} />
      <h1 className="text-4xl sm:text-5xl">Ton cerveau a bien travaillé !</h1>
      <div className="carte flex max-w-xl items-start gap-3 p-5 text-left text-lg">
        <SpeakButton text={MESSAGE} label="Écouter le message" />
        <p>
          Bravo {profile.prenom} ! Tu as joué {formatDuree(usedMs)} aujourd’hui. Va boire un verre d’eau,
          bouge un peu, et on se retrouve demain pour de nouvelles aventures.
        </p>
      </div>
      <Button variant="grass" size="lg" icon={<Home aria-hidden />} onClick={onQuit} autoFocus>
        À demain !
      </Button>

      {!ouvert ? (
        <button
          type="button"
          className="flex min-h-touch items-center gap-2 rounded-full bg-card/80 px-4 font-bold text-ink-soft"
          onClick={() => setOuvert(true)}
        >
          <Timer size={20} aria-hidden /> Pour les parents : accorder 10 minutes
        </button>
      ) : codeExiste ? (
        <form
          className="carte flex w-full max-w-sm flex-col gap-3 p-5 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            void accorder();
          }}
        >
          <CodeParentInput
            id="code-bonus"
            label="Code parent"
            value={code}
            onChange={setCode}
            erreur={erreur}
            autoFocus
          />
          {erreur && (
            <p role="alert" className="font-bold text-coral-dark">
              Ce n’est pas le bon code.
            </p>
          )}
          <Button type="submit" variant="sky" disabled={code.length < 4 || verif}>
            Accorder 10 minutes
          </Button>
        </form>
      ) : (
        <p className="carte max-w-sm p-4 text-sm">
          Aucun code parent n’est encore créé. Un adulte peut le créer dans l’espace parents, depuis
          l’accueil, puis accorder du temps ou changer la limite.
        </p>
      )}
    </div>
  );
}
