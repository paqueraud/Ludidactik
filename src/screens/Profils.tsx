import { Plus, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/avatar/Avatar';
import { Screen } from '@/components/Layout';
import { Ludo } from '@/components/Ludo';
import { Button } from '@/components/ui';
import { importBackup } from '@/services/backup';
import { useProfiles } from '@/services/profiles';
import { sfx } from '@/services/sfx';

export function Profils() {
  const navigate = useNavigate();
  const profiles = useProfiles();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Screen titre="Qui joue ?" aLire="Qui joue ? Touche ton avatar." retour="/">
      {profiles && profiles.length === 0 && (
        <div className="carte mb-6 flex items-center gap-4 p-5">
          <Ludo pose="salut" size={90} />
          <p className="text-lg">
            Bienvenue ! Crée ton profil pour garder tes étoiles, tes records et ton avatar.
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {profiles?.map((p) => (
          <button
            key={p.id}
            type="button"
            className="carte flex flex-col items-center gap-2 p-4 transition-transform hover:-translate-y-1 active:scale-95"
            onClick={() => {
              sfx.play('pop');
              navigate(`/profils/${p.id}/connexion`);
            }}
          >
            <Avatar config={p.avatar} size={120} fond="rgb(var(--c-sky) / 0.3)" />
            <span className="font-titre text-2xl font-bold">{p.prenom}</span>
            <span className="rounded-full bg-cream px-3 text-sm font-bold">{p.classe}</span>
          </button>
        ))}
        <button
          type="button"
          className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-card border-4 border-dashed border-ink/20 bg-card/50 p-4 font-titre text-xl font-bold hover:bg-card"
          onClick={() => navigate('/profils/nouveau')}
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-grass text-white shadow-pop-sm">
            <Plus size={44} aria-hidden />
          </span>
          Nouveau profil
        </button>
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <Button variant="blanc" icon={<Upload aria-hidden />} onClick={() => fileRef.current?.click()}>
          Importer une sauvegarde
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const r = await importBackup(JSON.parse(await f.text()), { remplacer: false });
              setMessage(`Sauvegarde importée : ${r.profils} profil(s).`);
            } catch {
              setMessage('Ce fichier n’est pas une sauvegarde Ludidactik.');
            }
            e.target.value = '';
          }}
        />
        {message && (
          <p role="status" className="font-bold">
            {message}
          </p>
        )}
      </div>
    </Screen>
  );
}
