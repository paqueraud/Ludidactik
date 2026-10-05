/**
 * Le Grand Huit des opérations posées (CATALOGUE n° 20).
 * On pose et on calcule en colonnes, chiffre par chiffre : à chaque bon chiffre, le wagonnet avance d'une
 * case sur les montagnes russes ; les retenues (et les marques de cassage) s'écrivent toutes seules.
 * Un seul algorithme par opération (voir `_calcul-commun/posee.ts`) : soustraction par cassage, sauf si
 * le contenu demande la compensation.
 * Niveaux : Facile = l'aide de la colonne est toujours affichée ; Normal = 1 indice par opération ;
 * Plus loin = sans indice et sans retenues écrites (on les garde en tête).
 * Une erreur sur un chiffre : le bon chiffre est écrit en orange avec l'explication, et on continue.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level, NumericItem } from '@/content/schemas';
import { formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau } from '../_kit/session';
import { Feedback, Hud } from '../_kit/ui';
import { type Disposition, type Posee, disposer, enLigne, lirePosee } from '../_calcul-commun/posee';
import { aDire } from '../_calcul-commun/tirer';
import { Bandeau, Bulle, EtatVide, useManches } from '../_calcul-commun/ui';
import { Grille } from './Grille';

const MANCHES: Record<Level, number> = { facile: 4, normal: 5, plus_loin: 6 };
const NOMS_OP: Record<Posee['op'], string> = {
  '+': 'addition',
  '−': 'soustraction',
  '×': 'multiplication',
  '÷': 'division',
};

interface Exo {
  item: NumericItem;
  p: Posee;
  d: Disposition;
}
const convertir = (it: Item): Exo | null => {
  const p = lirePosee(it);
  if (!p || it.kind !== 'numeric_answer') return null;
  return { item: it, p, d: disposer(p) };
};

/** Le circuit des montagnes russes (avec un looping). */
const CIRCUIT =
  'M 8 92 C 40 92 52 28 88 28 C 120 28 128 92 160 88 C 196 84 200 30 232 30 C 262 30 270 78 248 82 C 226 86 222 46 252 44 C 290 42 300 92 336 90 C 360 88 372 60 392 60';

function MontagnesRusses({ progres, enLooping }: { progres: number; enLooping: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGPathElement>(null);
  const [pos, setPos] = useState({ x: 8, y: 92, a: 0 });
  useLayoutEffect(() => {
    const p = ref.current;
    if (!p) return;
    const L = p.getTotalLength();
    const l = Math.max(0, Math.min(1, progres)) * L;
    const a = p.getPointAtLength(l);
    const b = p.getPointAtLength(Math.min(L, l + 1));
    setPos({ x: a.x, y: a.y, a: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI });
  }, [progres]);
  return (
    <svg viewBox="0 0 400 110" className="block h-28 w-full sm:h-36" aria-hidden>
      <defs>
        <linearGradient id="ciel-gh" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#BFE6FF" />
          <stop offset="1" stopColor="#FFF3D6" />
        </linearGradient>
      </defs>
      <rect width="400" height="110" fill="url(#ciel-gh)" />
      <rect y="100" width="400" height="10" fill="#7BC96F" />
      {/* piliers */}
      {[40, 88, 130, 175, 232, 300, 350].map((x) => (
        <line key={x} x1={x} y1="100" x2={x} y2="60" stroke="#C9965B" strokeWidth="3" opacity="0.7" />
      ))}
      <path d={CIRCUIT} fill="none" stroke="#8E7CFF" strokeWidth="7" strokeLinecap="round" />
      <path d={CIRCUIT} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="4 6" />
      <path ref={ref} d={CIRCUIT} fill="none" stroke="none" />
      <motion.g
        animate={{ x: pos.x, y: pos.y, rotate: pos.a }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 15 }}
      >
        <g transform="translate(-14 -18)">
          <rect x="0" y="6" width="28" height="12" rx="4" fill="#FF7A6B" />
          <circle cx="9" cy="4" r="4.5" fill="#F6D2B5" />
          <circle cx="20" cy="4" r="4.5" fill="#B9784F" />
          {enLooping && <path d="M5 1 l-3 -4 M24 1 l3 -4" stroke="#24304A" strokeWidth="1.5" />}
          <circle cx="7" cy="19" r="3" fill="#24304A" />
          <circle cx="21" cy="19" r="3" fill="#24304A" />
        </g>
      </motion.g>
      <text
        x="392"
        y="54"
        textAnchor="end"
        fontSize="12"
        fontFamily="Baloo 2, sans-serif"
        fontWeight="800"
        fill="#2E8C48"
      >
        🏁
      </text>
    </svg>
  );
}

/** Pavé de chiffres (chaque chiffre est vérifié tout de suite : pas besoin de « valider »). */
function PaveChiffres({ onChiffre, disabled }: { onChiffre: (k: string) => void; disabled: boolean }) {
  return (
    <div className="grid w-full max-w-xs grid-cols-5 gap-2" role="group" aria-label="Chiffres">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((k) => (
        <button
          key={k}
          type="button"
          className="btn-3d flex h-14 items-center justify-center bg-card font-titre text-3xl text-ink shadow-pop-sm active:translate-y-[3px] active:shadow-none sm:h-16"
          onClick={() => onChiffre(k)}
          disabled={disabled}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

export default function GrandHuit(props: GameProps) {
  const { level, lectureAuto, speech, sfx, paused } = props;
  const jeu = useManches(props, {
    total: parNiveau(level, MANCHES),
    convertir,
    fin: (b, t) => ({
      headline:
        b === t ? 'Champion du Grand Huit ! 🎢' : `${b} tour${b > 1 ? 's' : ''} sans faute sur ${t} !`,
    }),
    delaiJuste: 2000,
  });
  const { courant, manche, total, etat, fini, repondre, suivant, bonnes } = jeu;
  const exo = courant?.valeur ?? null;
  const [cur, setCur] = useState(0);
  const [erreurs, setErreurs] = useState<Set<number>>(new Set());
  const [aide, setAide] = useState<string | null>(null);
  const [indiceUtilise, setIndiceUtilise] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!exo) return;
    setCur(0);
    setErreurs(new Set());
    setAide(null);
    setIndiceUtilise(false);
    setMessage(undefined);
    if (lectureAuto) void speech.speak(`Pose et calcule ${aDire(enLigne(exo.p))}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exo]);

  const bloque = !!etat || paused || fini;
  const n = exo?.d.etapes.length ?? 0;
  const etape = exo && cur < n ? exo.d.etapes[cur] : null;

  const attendu = useMemo(() => {
    if (!exo) return '';
    return `${formatNumber(exo.d.resultat)}${exo.d.reste ? ` (reste ${exo.d.reste})` : ''}`;
  }, [exo]);

  const taper = useCallback(
    (k: string) => {
      if (!exo || bloque || !etape || !/^\d$/.test(k)) return;
      const juste = k === etape.attendu;
      const nErr = new Set(erreurs);
      if (juste) {
        sfx.play(cur === n - 1 ? 'monte' : 'tic');
        setAide(null);
      } else {
        sfx.play('glisse');
        vibrate(40);
        nErr.add(cur);
        setErreurs(nErr);
        setAide(`Presque ! ${etape.aide}`);
      }
      const suivantCur = cur + 1;
      setCur(suivantCur);
      if (suivantCur >= n) {
        const ok = nErr.size === 0;
        setMessage(
          ok
            ? `Sans faute ! ${exo.d.conclusion}`
            : `${nErr.size} chiffre${nErr.size > 1 ? 's' : ''} corrigé${nErr.size > 1 ? 's' : ''}. ${exo.d.conclusion}`,
        );
        repondre(ok, ok ? attendu : `${nErr.size} erreur${nErr.size > 1 ? 's' : ''}`, attendu);
      }
    },
    [exo, bloque, etape, erreurs, cur, n, sfx, attendu, repondre],
  );

  // Clavier physique : chiffres
  useEffect(() => {
    if (bloque) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        taper(e.key);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [bloque, taper]);

  if (!exo)
    return (
      <EtatVide
        icone="🎢"
        jeu="Le Grand Huit"
        besoin="d’opérations à poser (addition, soustraction, multiplication, division)"
      />
    );

  const { item, p, d } = exo;
  const aideVisible = level === 'facile' ? etape?.aide : null;
  const progres = n ? cur / n : 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          Tour {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🎢</span> {bonnes}
        </Hud>
      </Bandeau>
      <section
        className="overflow-hidden rounded-card border-4 border-white bg-[#BFE6FF] shadow-soft"
        aria-label="Les montagnes russes"
      >
        <MontagnesRusses progres={progres} enLooping={etat === 'juste'} />
      </section>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section className="carte flex min-w-0 flex-col items-center gap-3 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <SpeakButton text={`Pose et calcule ${aDire(enLigne(p))}.`} label="Écouter l’opération" />
            <p className="font-titre text-2xl font-extrabold sm:text-3xl" aria-live="polite">
              {item.prompt.startsWith('Pose') ? item.prompt : enLigne(p)}
            </p>
          </div>
          <p className="text-sm font-bold text-ink-soft">
            {NOMS_OP[p.op]} posée{p.op === '−' ? ` — par ${p.methode}` : ''}
            {p.op === '÷' && d.reste !== undefined ? ' — division euclidienne' : ''}
          </p>
          <Grille d={d} cur={cur} erreurs={erreurs} masquerAides={level === 'plus_loin' && !etat} />
        </section>
        <section className="carte flex min-w-0 flex-col items-center gap-3 p-4">
          {(aide || aideVisible) && !etat && (
            <Bulle ton={aide ? 'sun' : 'sky'}>
              <span aria-hidden>🎢</span>
              <span role="status">{aide ?? aideVisible}</span>
            </Bulle>
          )}
          {!etat && etape && (
            <p className="text-center font-bold">
              {p.op === '÷' && etape.ligne === 1
                ? 'Écris le chiffre du quotient.'
                : p.op === '÷'
                  ? 'Écris le reste.'
                  : 'Écris le chiffre dans la case violette.'}
            </p>
          )}
          {level === 'normal' && !indiceUtilise && !etat && etape && (
            <Button
              variant="sun"
              icon={<Lightbulb aria-hidden />}
              onClick={() => {
                setIndiceUtilise(true);
                setAide(etape.aide);
              }}
              disabled={bloque}
            >
              Indice
            </Button>
          )}
          {!etat && <PaveChiffres onChiffre={taper} disabled={bloque} />}
          <AnimatePresence>
            {etat && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                <Feedback
                  state={etat}
                  message={etat === 'juste' ? `${message} 🎢` : `Presque ! ${message}`}
                  expected={etat === 'faux' ? attendu : undefined}
                  explication={etat === 'faux' ? item.explication : undefined}
                  onContinue={suivant}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
