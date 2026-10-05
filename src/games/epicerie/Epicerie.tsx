/**
 * La Petite Épicerie (CATALOGUE n° 11) — monnaie.
 * Payer : réunir exactement le prix avec les pièces et billets de la caisse.
 * Rendre : le client donne une somme ; on lui rend la monnaie (on peut compter « en complétant »).
 * Manipulation : glisser une pièce de la caisse sur le comptoir, ou la toucher (toucher une pièce du
 * comptoir la reprend). Clavier : Tab + Entrée sur les pièces, Retour arrière = reprendre la dernière,
 * Entrée (hors bouton) ou « Valider ».
 * Niveaux : Facile = total du comptoir affiché, « il manque… » ; Normal = total caché, 1 indice « Compter » ;
 * Plus loin = sans indice, et défi « le moins de pièces possible » (exigé si `meta.optimal`).
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Calculator, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level, MoneyItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { parNiveau } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import { Client } from '../_calcul-commun/Client';
import {
  decompositionOptimale,
  etapesCompleter,
  eurosADire,
  formatEuros,
  itemMonnaieValide,
  libelleValeur,
  montantCible,
  somme,
  valeursProposees,
} from '../_calcul-commun/monnaie';
import { Bandeau, EtatVide, useManches } from '../_calcul-commun/ui';
import { Argent } from './Argent';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };
/** Articles de la vitrine (décor seulement : le prix vient de l'item). */
const ARTICLES = ['🍎', '🥖', '🧃', '🧸', '📒', '✏️', '🍫', '🧀', '🪁', '🥕', '⚽', '🎨'];

const convertir = (it: Item): MoneyItem | null =>
  it.kind === 'money' && itemMonnaieValide(it) && valeursProposees(it).length > 0 ? it : null;

interface Pose {
  id: number;
  v: number;
}

export default function Epicerie(props: GameProps) {
  const { level, lectureAuto, speech, sfx, paused } = props;
  const reduce = useReducedMotion();
  const jeu = useManches(props, {
    total: parNiveau(level, MANCHES),
    convertir,
    fin: (b, t) => ({
      headline: b === t ? 'Tous les clients sont ravis ! 🛒' : `${b} client${b > 1 ? 's' : ''} servi${b > 1 ? 's' : ''} sur ${t} !`,
    }),
    delaiJuste: 1600,
  });
  const { courant, manche, total, etat, fini, repondre, suivant, bonnes } = jeu;
  const item = courant?.valeur ?? null;
  const [poses, setPoses] = useState<Pose[]>([]);
  const [indice, setIndice] = useState(false);
  const [indiceUtilise, setIndiceUtilise] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const comptoir = useRef<HTMLDivElement>(null);
  const prochainId = useRef(1);
  const glisse = useRef(false);

  const cible = item ? montantCible(item) : 0;
  const valeurs = useMemo(() => (item ? valeursProposees(item) : []), [item]);
  const surComptoir = somme(poses.map((p) => p.v));
  const optimalExige = !!item?.meta?.optimal;
  const mini = useMemo(() => (item ? (decompositionOptimale(cible, valeurs) ?? []) : []), [item, cible, valeurs]);
  const graine = (manche * 7 + (item?.priceCents ?? 0)) % 97;
  const article = ARTICLES[graine % ARTICLES.length]!;
  const bloque = !!etat || paused || fini;

  // Nouvelle manche
  useEffect(() => {
    setPoses([]);
    setIndice(false);
    setIndiceUtilise(false);
    setMessage(undefined);
    if (lectureAuto && item) void speech.speak(item.spoken ?? item.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const ajouter = useCallback(
    (v: number) => {
      if (bloque) return;
      sfx.play('piece');
      setPoses((p) => (p.length >= 30 ? p : [...p, { id: prochainId.current++, v }]));
    },
    [bloque, sfx],
  );
  const retirer = useCallback(
    (id: number) => {
      if (bloque) return;
      sfx.play('pop');
      setPoses((p) => p.filter((x) => x.id !== id));
    },
    [bloque, sfx],
  );

  const valider = useCallback(() => {
    if (!item || bloque || poses.length === 0) return;
    const juste = surComptoir === cible;
    const tropDePieces = juste && mini.length > 0 && poses.length > mini.length;
    const donne = `${formatEuros(surComptoir)} (${poses.map((p) => libelleValeur(p.v)).join(' + ')})`;
    if (juste && tropDePieces && optimalExige) {
      setMessage(`C’est la bonne somme, mais on pouvait utiliser moins de pièces et de billets (${mini.length}).`);
      repondre(false, donne, formatEuros(cible));
      return;
    }
    if (juste) {
      setMessage(
        tropDePieces && level === 'plus_loin'
          ? `Bravo ! Défi : tu pouvais le faire avec ${mini.length} pièces et billets.`
          : poses.length === mini.length && level !== 'facile'
            ? 'Parfait, et avec le moins de pièces possible ! ⭐'
            : 'Merci, c’est le compte juste !',
      );
    } else
      setMessage(
        surComptoir < cible
          ? `Presque ! Il manque ${formatEuros(cible - surComptoir)}.`
          : `Presque ! Il y a ${formatEuros(surComptoir - cible)} de trop.`,
      );
    repondre(juste, donne, formatEuros(cible));
  }, [item, bloque, poses, surComptoir, cible, mini, optimalExige, level, repondre]);

  // Clavier : Entrée (hors bouton) = valider, Retour arrière = reprendre la dernière pièce
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (bloque) return;
      const t = document.activeElement as HTMLElement | null;
      if (e.key === 'Enter' && (!t || t.tagName !== 'BUTTON')) {
        e.preventDefault();
        valider();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPoses((p) => p.slice(0, -1));
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [bloque, valider]);

  if (!item) return <EtatVide icone="🛒" jeu="La Petite Épicerie" besoin="d’exercices de monnaie (payer, rendre)" />;

  const donneParClient = item.task === 'rendre' ? (decompositionOptimale(item.givenCents ?? 0, [500, 1000, 2000, 5000, 10000, 100, 200, 50, 20, 10, 5, 2, 1]) ?? []) : [];
  const expected =
    `${formatEuros(cible)}` + (mini.length ? ` (par exemple ${mini.map(libelleValeur).join(' + ')})` : '');
  const strategie =
    item.task === 'rendre' && item.givenCents
      ? etapesCompleter(item.priceCents, item.givenCents, valeurs)
          .map(([x]) => formatEuros(x))
          .join(' → ')
      : null;
  const afficheTotal = level === 'facile' || indice;
  const enAttente = surComptoir < cible;

  // Regrouper le comptoir par valeur (du plus grand au plus petit)
  const groupes = [...poses].sort((a, b) => b.v - a.v);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          Client {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>😊</span> {bonnes} servi{bonnes > 1 ? 's' : ''}
        </Hud>
      </Bandeau>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Boutique */}
        <section
          className="relative overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-[#FFF3D6] to-[#FCE3B8] shadow-soft"
          aria-label="L’épicerie"
        >
          <svg viewBox="0 0 400 36" className="block h-9 w-full" preserveAspectRatio="none" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <path
                key={i}
                d={`M${i * 40} 0 h40 v24 a20 12 0 0 1 -40 0 Z`}
                fill={i % 2 ? '#FFF8EC' : '#FF7A6B'}
              />
            ))}
          </svg>
          <div className="flex items-end gap-2 px-3 pb-0 pt-2">
            <Client graine={graine} humeur={etat === 'juste' ? 'content' : etat === 'faux' ? 'pense' : 'neutre'} taille={110} />
            <motion.div
              key={manche}
              initial={reduce ? false : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mb-6 flex-1 rounded-3xl bg-white p-3 shadow-pop-sm"
            >
              <span className="absolute -left-2 bottom-4 h-4 w-4 rotate-45 bg-white" aria-hidden />
              <div className="flex items-center gap-2">
                <span className="text-4xl" aria-hidden>
                  {article}
                </span>
                <span className="rounded-xl bg-sun/40 px-2 py-0.5 font-titre text-2xl font-extrabold">
                  {formatEuros(item.priceCents)}
                </span>
              </div>
              {item.task === 'rendre' && (
                <div className="mt-2">
                  <p className="text-sm font-bold text-ink-soft">Je te donne {formatEuros(item.givenCents ?? 0)} :</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {donneParClient.map((v, i) => (
                      <Argent key={i} valeur={v} echelle={0.75} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
          {/* Comptoir */}
          <div
            ref={comptoir}
            className={`relative mx-2 mb-2 min-h-[132px] rounded-2xl border-4 border-dashed p-2 transition-colors ${
              etat === 'juste' ? 'border-grass bg-grass/20' : etat === 'faux' ? 'border-coral bg-coral/10' : 'border-[#C9965B] bg-[#E8B87E]/60'
            }`}
            aria-label={`Comptoir : ${poses.length ? poses.map((p) => libelleValeur(p.v)).join(', ') : 'vide'}`}
            role="group"
          >
            <p className="mb-1 flex items-center justify-between text-sm font-bold text-ink/70">
              <span>{item.task === 'rendre' ? 'La monnaie que tu rends' : 'Ce que tu paies'}</span>
              {afficheTotal && (
                <span className="rounded-full bg-white/80 px-2 font-titre text-base text-ink" aria-live="polite">
                  {formatEuros(surComptoir)}
                </span>
              )}
            </p>
            {poses.length === 0 && (
              <p className="py-6 text-center text-ink/60">Glisse ou touche les pièces et les billets de la caisse.</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <AnimatePresence initial={false}>
                {groupes.map((p) => (
                  <motion.button
                    key={p.id}
                    type="button"
                    layout={!reduce}
                    initial={reduce ? false : { scale: 0.3, y: -30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.3, opacity: 0 }}
                    onClick={() => retirer(p.id)}
                    disabled={bloque}
                    className="rounded-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-grape"
                    aria-label={`Reprendre ${libelleValeur(p.v)}`}
                  >
                    <Argent valeur={p.v} echelle={1} />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
            {level === 'facile' && poses.length > 0 && !etat && (
              <p className="mt-1 text-center font-bold" aria-live="polite">
                {enAttente
                  ? `Il manque encore ${formatEuros(cible - surComptoir)}.`
                  : surComptoir === cible
                    ? 'C’est le compte juste ! Valide.'
                    : `Oups, ${formatEuros(surComptoir - cible)} de trop : reprends une pièce.`}
              </p>
            )}
          </div>
        </section>

        {/* Consigne + caisse */}
        <section className="carte flex min-w-0 flex-col items-center gap-3 p-4">
          <div className="flex items-start gap-3">
            <SpeakButton text={item.spoken ?? item.prompt} label="Écouter la consigne" />
            <p className="font-titre text-xl font-extrabold leading-snug sm:text-2xl" aria-live="polite">
              {item.prompt}
            </p>
          </div>
          <div
            className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#5A3D2B]/10 p-2"
            role="group"
            aria-label="Caisse"
          >
            {[...valeurs].reverse().map((v) => (
              <motion.button
                key={v}
                type="button"
                drag={!bloque && !reduce}
                dragSnapToOrigin
                dragElastic={0.6}
                whileDrag={{ scale: 1.15, zIndex: 30 }}
                whileTap={{ scale: 0.92 }}
                onDragStart={() => {
                  glisse.current = true;
                }}
                onDragEnd={(_, info) => {
                  const r = comptoir.current?.getBoundingClientRect();
                  const x = info.point.x - window.scrollX;
                  const y = info.point.y - window.scrollY;
                  if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) ajouter(v);
                  setTimeout(() => (glisse.current = false), 0);
                }}
                onClick={() => {
                  if (glisse.current) return;
                  ajouter(v);
                }}
                disabled={bloque}
                className="relative flex min-h-[56px] min-w-[56px] touch-none items-center justify-center rounded-xl p-1 hover:bg-white/60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-grape"
                aria-label={`Ajouter ${libelleValeur(v)}`}
              >
                <Argent valeur={v} echelle={1.15} />
              </motion.button>
            ))}
          </div>
          <div className="flex w-full flex-wrap justify-center gap-2">
            <Button variant="blanc" icon={<RotateCcw aria-hidden />} onClick={() => setPoses([])} disabled={bloque || !poses.length}>
              Tout reprendre
            </Button>
            {level === 'normal' && !indiceUtilise && (
              <Button
                variant="sun"
                icon={<Calculator aria-hidden />}
                onClick={() => {
                  setIndice(true);
                  setIndiceUtilise(true);
                  void speech.speak(`Sur le comptoir, il y a ${eurosADire(surComptoir)}.`);
                }}
                disabled={bloque}
              >
                Compter
              </Button>
            )}
            <Button variant="grass" size="lg" onClick={valider} disabled={bloque || !poses.length}>
              Valider
            </Button>
          </div>
          {level === 'plus_loin' && !etat && (
            <p className="text-center text-sm font-bold text-grape-dark">
              🚀 Défi : utilise le moins de pièces et de billets possible{optimalExige ? ' (obligatoire ici)' : ''}.
            </p>
          )}
          {etat && (
            <div className="w-full">
              <Feedback
                state={etat}
                message={message}
                expected={etat === 'faux' ? expected : undefined}
                explication={
                  etat === 'faux'
                    ? `${item.explication}${strategie ? ` En complétant : ${strategie}.` : ''}`
                    : undefined
                }
                onContinue={suivant}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
