/**
 * Le Dobble des mots (CATALOGUE n° 47) — lexique : synonymes, contraires, familles, générique/spécifique…
 * Deux cartes rondes portent chacune plusieurs mots ; UNE seule paire de l'item relie un mot de la
 * première carte à un mot de la seconde. On touche les deux mots (ou touches 1-5 puis A-E).
 * Facile : 3 mots par carte, pas de chrono, 2 essais. Normal : 4 mots, sablier doux.
 * Plus loin : 5 mots, sablier rapide. Le sablier qui se vide n'enlève rien : on montre la paire.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SpeakButton } from '@/components/ui';
import type { Level, PairingItem } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { createRng } from '@/engine/rng';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { Hud } from '../_kit/ui';
import {
  type MancheDobble,
  collecterPaires,
  dispositionCarte,
  estLaPaire,
  genererMancheDobble,
} from '../_langue-commun/paires';
import { collecterItems } from '../_langue-commun/tirage';
import { PasDExercice, useTouches } from '../_langue-commun/ui';
import { useRng } from '../_nombres-commun/outils';
import { BarreTemps, Correction } from '../_nombres-commun/ui';
import { useCompteARebours, useVoixEnPause } from '../_orthographe-commun/hooks';

const MANCHES: Record<Level, number> = { facile: 8, normal: 10, plus_loin: 12 };
const MOTS: Record<Level, number> = { facile: 3, normal: 4, plus_loin: 5 };
const CHRONO_MS: Record<Level, number> = { facile: Infinity, normal: 20_000, plus_loin: 11_000 };
const ESSAIS: Record<Level, number> = { facile: 2, normal: 1, plus_loin: 1 };
const LETTRES = ['A', 'B', 'C', 'D', 'E'];
// teintes foncées : contraste AA sur fond blanc
const TEINTES = ['#1A6E99', '#B8372B', '#25703A', '#5B45C9', '#8A5410'];

function Carte({
  mots,
  cote,
  selection,
  bon,
  rate,
  onPick,
  disabled,
  seed,
  reduite,
}: {
  mots: string[];
  cote: 'A' | 'B';
  selection: string | null;
  bon: string | null;
  rate: string | null;
  onPick: (m: string) => void;
  disabled: boolean;
  seed: number;
  reduite: boolean;
}) {
  const places = useMemo(() => dispositionCarte(mots.length, createRng(seed)), [mots.length, seed]);
  return (
    <motion.div
      className="relative aspect-square w-[min(70vw,270px)] rounded-full border-[6px] border-white shadow-soft sm:w-[340px]"
      style={{
        background: `radial-gradient(circle at 35% 30%, #FFFFFF 0%, #FFF8EC 55%, ${cote === 'A' ? '#DDF3FF' : '#FFE3DF'} 100%)`,
      }}
      initial={reduite ? { opacity: 0 } : { rotate: cote === 'A' ? -120 : 120, scale: 0.4, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ type: reduite ? 'tween' : 'spring', stiffness: 140, damping: 16 }}
      role="group"
      aria-label={`Carte ${cote === 'A' ? '1' : '2'}`}
    >
      <div className="absolute inset-3 rounded-full border-2 border-dashed border-ink/10" aria-hidden />
      {mots.map((m, i) => {
        const p = places[i]!;
        const choisi = selection === m;
        const estBon = bon === m;
        const estRate = rate === m;
        const touche = cote === 'A' ? String(i + 1) : LETTRES[i]!;
        return (
          <div
            key={m}
            className="absolute max-w-[62%]"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <motion.button
              type="button"
              onClick={() => onPick(m)}
              disabled={disabled}
              className={`flex items-center gap-1 rounded-2xl px-2.5 py-1.5 font-titre font-extrabold leading-tight shadow-pop-sm focus-visible:outline focus-visible:outline-4 focus-visible:outline-sun ${
                estBon
                  ? 'bg-grass ring-4 ring-grass/40'
                  : estRate
                    ? 'bg-coral/30'
                    : choisi
                      ? 'bg-sun ring-4 ring-sun-dark'
                      : 'bg-white'
              }`}
              style={{
                rotate: p.rot,
                fontSize: `${(mots.length >= 5 ? 1.05 : 1.25) * p.taille}rem`,
                minHeight: 48,
              }}
              whileTap={reduite ? undefined : { scale: 0.9 }}
              animate={estRate && !reduite ? { x: [0, -6, 6, -3, 0] } : { x: 0 }}
              aria-label={`${m} (touche ${touche})`}
              aria-pressed={choisi}
            >
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink/80 px-1 text-[0.65rem] text-white"
                aria-hidden
              >
                {touche}
              </span>
              <span
                className="[overflow-wrap:anywhere]"
                style={{ color: estBon ? '#fff' : TEINTES[i % TEINTES.length] }}
              >
                {m}
              </span>
            </motion.button>
          </div>
        );
      })}
    </motion.div>
  );
}

export default function DobbleMots({ level, stream, paused, onAnswer, onEnd, speech, sfx }: GameProps) {
  const total = parNiveau(level, MANCHES);
  const session = useGameSession({ paused, onAnswer, onEnd });
  useVoixEnPause(paused, speech);
  const reduite = !!useReducedMotion();
  const rng = useRng();

  // Le réservoir : les paires de la relation la mieux fournie (pour ne pas mélanger contraires et familles)
  const pool = useMemo(() => {
    const items = collecterItems(
      stream,
      (x): x is PairingItem =>
        x.kind === 'pairing' && x.pairs.every((p) => p.left.length <= 24 && p.right.length <= 24),
      8,
    );
    const parRelation = new Map<string, PairingItem[]>();
    for (const it of items) {
      const k = it.relation ?? it.prompt;
      parRelation.set(k, [...(parRelation.get(k) ?? []), it]);
    }
    const groupes = [...parRelation.values()].map((g) => collecterPaires(g, 24));
    groupes.sort((a, b) => b.length - a.length);
    const meilleur = groupes[0] ?? [];
    return meilleur.length >= 3 ? meilleur : collecterPaires(items, 24);
  }, [stream]);

  const [manche, setManche] = useState(1);
  const [jeu, setJeu] = useState<MancheDobble | null>(() => genererMancheDobble(pool, MOTS[level], rng));
  const [selA, setSelA] = useState<string | null>(null);
  const [selB, setSelB] = useState<string | null>(null);
  const [etat, setEtat] = useState<'jeu' | 'juste' | 'faux' | 'reessai'>('jeu');
  const [essais, setEssais] = useState(0);
  const [trouves, setTrouves] = useState(0);
  const [serie, setSerie] = useState(0);
  const [fini, setFini] = useState(false);
  const [graine, setGraine] = useState(() => Math.floor(Math.random() * 1e9));

  useEffect(() => {
    session.startQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jeu]);

  const verifier = useCallback(
    (a: string | null, b: string | null, tempsEcoule = false) => {
      if (!jeu || (etat !== 'jeu' && etat !== 'reessai') || paused || fini) return;
      const juste = !!a && !!b && estLaPaire(jeu, a, b);
      const essai = essais + 1;
      setEssais(essai);
      if (!juste && !tempsEcoule && essai < ESSAIS[level]) {
        sfx.play('glisse');
        setEtat('reessai');
        setTimeout(() => {
          setSelA(null);
          setSelB(null);
          setEtat('jeu');
        }, 700);
        return;
      }
      session.answer(
        jeu.cible.item,
        juste,
        a && b ? `${a} + ${b}` : '(temps écoulé)',
        `${jeu.cible.gauche} + ${jeu.cible.droite}`,
      );
      if (juste) {
        sfx.play(serie >= 2 ? 'etoile' : 'juste');
        setTrouves((t) => t + 1);
        setSerie((s) => s + 1);
        setEtat('juste');
      } else {
        sfx.play('faux');
        vibrate(50);
        setSerie(0);
        setEtat('faux');
      }
    },
    [jeu, etat, paused, fini, essais, level, session, sfx, serie],
  );

  const choisir = useCallback(
    (cote: 'A' | 'B', mot: string) => {
      if (etat !== 'jeu' || paused || fini) return;
      sfx.play('pop');
      if (cote === 'A') {
        const a = selA === mot ? null : mot;
        setSelA(a);
        if (a && selB) verifier(a, selB);
      } else {
        const b = selB === mot ? null : mot;
        setSelB(b);
        if (b && selA) verifier(selA, b);
      }
    },
    [etat, paused, fini, selA, selB, sfx, verifier],
  );

  const restant = useCompteARebours({
    actif: etat === 'jeu' && Number.isFinite(CHRONO_MS[level]) && !!jeu,
    dureeMs: CHRONO_MS[level],
    paused,
    cle: manche,
    onFin: () => verifier(selA, selB, true),
  });

  const suivant = useCallback(() => {
    if (manche >= total) {
      setFini(true);
      sfx.play('fanfare');
      session.end({
        won: trouves >= Math.ceil(total * 0.6),
        headline: `${trouves} paire${trouves > 1 ? 's' : ''} trouvée${trouves > 1 ? 's' : ''} ! 🔵`,
        delayMs: 900,
      });
      return;
    }
    setJeu((j) => genererMancheDobble(pool, MOTS[level], rng, j?.cible));
    setManche((m) => m + 1);
    setSelA(null);
    setSelB(null);
    setEssais(0);
    setEtat('jeu');
    setGraine((g) => g + 7919);
  }, [manche, total, trouves, session, sfx, pool, level, rng]);

  useEffect(() => {
    if (etat !== 'juste' || paused) return;
    const t = setTimeout(suivant, 1200);
    return () => clearTimeout(t);
  }, [etat, paused, suivant]);

  useTouches(etat === 'jeu' && !paused && !fini && !!jeu, (e) => {
    if (!jeu) return false;
    if (/^[1-5]$/.test(e.key)) {
      const m = jeu.carteA[Number(e.key) - 1];
      if (m) choisir('A', m);
      return true;
    }
    const i = LETTRES.indexOf(e.key.toUpperCase());
    if (i >= 0) {
      const m = jeu.carteB[i];
      if (m) choisir('B', m);
      return true;
    }
    return false;
  });

  if (!jeu) {
    return (
      <PasDExercice
        texte="Il faut au moins trois paires de mots courts (contraires, synonymes, familles…) pour jouer au Dobble."
        onFin={() => session.end({ won: false, headline: 'À bientôt !', delayMs: 0 })}
      />
    );
  }

  const montrer = etat === 'faux' || etat === 'juste';
  const lien = jeu.cible.item.relation;

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-3 pb-6 pt-2 sm:px-6">
      <div className="flex w-full items-center justify-between gap-2">
        <Hud>
          🔵 {Math.min(manche, total)} / {total}
        </Hud>
        {serie >= 2 && <Hud className="bg-sun">🔥 Série de {serie}</Hud>}
        <Hud>✅ {trouves}</Hud>
      </div>
      <div className="flex items-center justify-center gap-2 text-center">
        <SpeakButton
          text={`Trouve les deux mots qui vont ensemble.${lien ? ` Le lien : ${lien}.` : ''}`}
          label="Écouter la consigne"
          size={40}
        />
        <p className="font-titre text-xl font-bold">
          Trouve les deux mots qui vont ensemble
          {lien && (
            <span className="ml-2 rounded-full bg-grape/15 px-2 py-0.5 text-base text-grape-dark">
              lien : {lien}
            </span>
          )}
        </p>
      </div>
      {Number.isFinite(CHRONO_MS[level]) && etat === 'jeu' && <BarreTemps reste={restant} label="Sablier" />}

      <AnimatePresence mode="wait">
        <motion.div
          key={manche}
          className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6"
          exit={reduite ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        >
          <Carte
            mots={jeu.carteA}
            cote="A"
            selection={selA}
            bon={montrer ? jeu.motA : null}
            rate={etat !== 'jeu' && selA !== jeu.motA ? selA : null}
            onPick={(m) => choisir('A', m)}
            disabled={etat !== 'jeu' || paused}
            seed={graine}
            reduite={reduite}
          />
          <span className="font-titre text-3xl font-extrabold text-grape" aria-hidden>
            ⇄
          </span>
          <Carte
            mots={jeu.carteB}
            cote="B"
            selection={selB}
            bon={montrer ? jeu.motB : null}
            rate={etat !== 'jeu' && selB !== jeu.motB ? selB : null}
            onPick={(m) => choisir('B', m)}
            disabled={etat !== 'jeu' || paused}
            seed={graine + 1}
            reduite={reduite}
          />
        </motion.div>
      </AnimatePresence>

      {etat === 'reessai' && (
        <p className="font-bold text-coral-dark" role="status">
          Presque&nbsp;! Ces deux mots ne vont pas ensemble. On réessaie ?
        </p>
      )}
      {etat === 'juste' && (
        <p className="font-titre text-2xl font-extrabold text-grass-dark" role="status">
          Bien vu&nbsp;! « {jeu.cible.gauche} » et « {jeu.cible.droite} » 🎉
        </p>
      )}
      <Correction
        ouvert={etat === 'faux'}
        titre={selA && selB ? 'Presque !' : 'Le sablier est vide !'}
        bonne={`« ${jeu.cible.gauche} » et « ${jeu.cible.droite} »`}
        explication={jeu.cible.item.explication}
        onContinuer={suivant}
      />
    </div>
  );
}
