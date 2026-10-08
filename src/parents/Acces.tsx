/** Accès à l'espace parents : création du code (1re visite), puis code + question de calcul « adulte ». */
import { KeyRound, LockOpen, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CodeParentInput } from '@/components/CodeParentInput';
import { Button } from '@/components/ui';
import { createRng } from '@/engine/rng';
import { adultQuestion, isValidParentCode, setParentCode, verifyParentCode } from '@/services/parentCode';
import { useParentSession } from '@/stores/parentSession';
import { champ } from './ui';

export function MentionVerrou() {
  return (
    <p className="flex items-start gap-2 rounded-2xl bg-sky/15 p-3 text-sm">
      <ShieldCheck size={20} className="mt-0.5 shrink-0" aria-hidden />
      <span>
        Le code parent et les mots de passe des enfants sont un <strong>verrou familial</strong>, pas une
        sécurité forte : ils évitent les fausses manipulations, mais une personne qui maîtrise le navigateur
        peut lire les données. Rien n’est envoyé sur Internet : tout reste sur cet appareil.
      </span>
    </p>
  );
}

export function CreerCode() {
  const unlock = useParentSession((s) => s.unlock);
  const [code, setCode] = useState('');
  const [code2, setCode2] = useState('');
  const [enCours, setEnCours] = useState(false);
  const valide = isValidParentCode(code);
  const identiques = code === code2;

  return (
    <form
      className="carte mx-auto flex max-w-lg flex-col gap-4 p-5 sm:p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valide || !identiques) return;
        setEnCours(true);
        await setParentCode(code);
        unlock();
      }}
    >
      <h2 className="flex items-center gap-2 text-2xl">
        <KeyRound aria-hidden /> Créer le code parent
      </h2>
      <p>
        Bienvenue ! Choisissez un code de <strong>4 à 6 chiffres</strong>, connu des seuls adultes. Il protège
        l’espace parents et permet d’accorder du temps de jeu supplémentaire.
      </p>
      <CodeParentInput id="code-nouveau" label="Code parent" value={code} onChange={setCode} autoFocus />
      <CodeParentInput id="code-confirmation" label="Confirmez le code" value={code2} onChange={setCode2} />
      {code2.length >= code.length && code2 && !identiques && (
        <p role="alert" className="font-bold text-coral-dark">
          Les deux codes ne sont pas identiques.
        </p>
      )}
      <MentionVerrou />
      <Button type="submit" variant="grass" size="lg" disabled={!valide || !identiques || enCours}>
        Créer le code et entrer
      </Button>
    </form>
  );
}

export function Deverrouiller() {
  const unlock = useParentSession((s) => s.unlock);
  const [graine, setGraine] = useState(() => Date.now());
  const question = useMemo(() => adultQuestion(createRng(graine)), [graine]);
  const [code, setCode] = useState('');
  const [reponse, setReponse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [echecs, setEchecs] = useState(0);
  const [bloqueJusqua, setBloqueJusqua] = useState(0);
  const [enCours, setEnCours] = useState(false);

  const essayer = async () => {
    if (Date.now() < bloqueJusqua) {
      setErreur('Trop d’essais : patientez 30 secondes avant de réessayer.');
      return;
    }
    setEnCours(true);
    const codeOk = await verifyParentCode(code);
    setEnCours(false);
    const calculOk = Number(reponse.trim()) === question.reponse && reponse.trim() !== '';
    if (codeOk && calculOk) {
      unlock();
      return;
    }
    const n = echecs + 1;
    setEchecs(n);
    if (n % 3 === 0) setBloqueJusqua(Date.now() + 30_000);
    setErreur(
      !codeOk
        ? 'Le code ou le calcul n’est pas correct. Une nouvelle question vous est proposée.'
        : 'Le résultat du calcul n’est pas correct. Une nouvelle question vous est proposée.',
    );
    setCode('');
    setReponse('');
    setGraine(Date.now());
  };

  return (
    <form
      className="carte mx-auto flex max-w-lg flex-col gap-4 p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void essayer();
      }}
    >
      <h2 className="flex items-center gap-2 text-2xl">
        <LockOpen aria-hidden /> Accès réservé aux adultes
      </h2>
      <CodeParentInput
        id="code-parent"
        label="Code parent"
        value={code}
        onChange={setCode}
        erreur={!!erreur}
        autoFocus
      />
      <div className="flex flex-col gap-1">
        <label htmlFor="calcul-adulte" className="font-bold">
          Combien font {question.texte} ?
        </label>
        <input
          id="calcul-adulte"
          className={`${champ} font-titre text-2xl`}
          inputMode="numeric"
          autoComplete="off"
          value={reponse}
          onChange={(e) => setReponse(e.target.value.replace(/[^\d-]/g, '').slice(0, 4))}
        />
      </div>
      {erreur && (
        <p role="alert" className="font-bold text-coral-dark">
          {erreur}
        </p>
      )}
      <Button type="submit" variant="grass" size="lg" disabled={code.length < 4 || !reponse || enCours}>
        Entrer
      </Button>
      <details className="text-sm text-ink-soft">
        <summary className="min-h-touch cursor-pointer py-3">Code parent oublié ?</summary>
        <p>
          Le code ne peut pas être retrouvé : il n’est enregistré que sous une forme chiffrée. Pour repartir
          de zéro, effacez les données de ce site dans les réglages du navigateur : attention, cela efface
          aussi les profils, la progression et les listes de mots.
        </p>
      </details>
      <MentionVerrou />
    </form>
  );
}
