/**
 * L'Horloger (CATALOGUE n° 12) — lire l'heure, régler les aiguilles, calculer des durées.
 * - lire : Facile = 4 propositions ; Normal / Plus loin = écrire les heures et les minutes (et les secondes).
 * - regler : faire glisser les aiguilles (grande = minutes, la petite suit) ou boutons ±1 h / ±min ;
 *   clavier : flèches haut/bas = ±1 h, gauche/droite = ± le pas des minutes.
 *   Pas des minutes : Facile 15 min (5 si besoin), Normal 5 min (1 si besoin), Plus loin 1 min.
 * - duree (« Le train part dans… ») : heure d'arrivée, de départ, ou durée du trajet, sur un quai de gare.
 * Aides : Facile = minutes écrites autour du cadran + « sauts » de durée ; Normal = 1 indice ; Plus loin = aucune.
 * Une horloge à aiguilles ne distingue pas 3 h et 15 h : les deux écritures sont acceptées.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { ClockItem, Item, Level } from '@/content/schemas';
import type { GameProps } from '@/engine/GameModule';
import { parNiveau } from '../_kit/session';
import { ChoiceGrid, Feedback, Hud } from '../_kit/ui';
import {
  type AnalyseDuree,
  type Heure,
  analyserDuree,
  enMinutes,
  formatDuree,
  formatHeure,
  itemHorlogeValide,
  memeCadran,
  propositionsLecture,
} from '../_calcul-commun/horloge';
import { Bandeau, Bulle, type Champ, EtatVide, SaisieChamps, useManches, vide } from '../_calcul-commun/ui';
import { Horloge } from './Horloge';

const MANCHES: Record<Level, number> = { facile: 6, normal: 8, plus_loin: 10 };

interface Exo {
  item: ClockItem;
  cible: Heure;
  duree: AnalyseDuree | null;
}

const convertir = (it: Item): Exo | null => {
  if (it.kind !== 'clock' || !itemHorlogeValide(it)) return null;
  return {
    item: it,
    cible: { h: it.hours, m: it.minutes, s: it.seconds },
    duree: analyserDuree(it),
  };
};

const CH_H: Champ = { cle: 'h', nom: 'heures', suffixe: 'h', max: 2 };
const CH_M: Champ = { cle: 'm', nom: 'minutes', suffixe: 'min', max: 2 };
const CH_S: Champ = { cle: 's', nom: 'secondes', suffixe: 's', max: 2 };

/** Pas de réglage des minutes selon le niveau et l'heure visée. */
function pasMinutes(level: Level, m: number): number {
  if (level === 'facile') return m % 15 === 0 ? 15 : m % 5 === 0 ? 5 : 1;
  if (level === 'normal') return m % 5 === 0 ? 5 : 1;
  return 1;
}

/** Sauts pour calculer une durée : jusqu'à l'heure pile, puis les heures, puis les minutes. */
function sauts(debut: Heure, duree: number): string[] {
  const out: string[] = [formatHeure(debut)];
  let t = enMinutes(debut);
  let reste = duree;
  const versHeure = (60 - (t % 60)) % 60;
  if (versHeure > 0 && versHeure <= reste) {
    t += versHeure;
    reste -= versHeure;
    out.push(`+ ${versHeure} min → ${formatHeure({ h: Math.floor(t / 60) % 24, m: t % 60 })}`);
  }
  if (reste >= 60) {
    const h = Math.floor(reste / 60);
    t += h * 60;
    reste -= h * 60;
    out.push(`+ ${h} h → ${formatHeure({ h: Math.floor(t / 60) % 24, m: t % 60 })}`);
  }
  if (reste > 0) {
    t += reste;
    out.push(`+ ${reste} min → ${formatHeure({ h: Math.floor(t / 60) % 24, m: t % 60 })}`);
  }
  return out;
}

export default function Horloger(props: GameProps) {
  const { level, lectureAuto, speech, sfx, paused, lesson } = props;
  const reduce = useReducedMotion();
  const jeu = useManches(props, {
    total: parNiveau(level, MANCHES),
    convertir,
    fin: (b, t) => ({ headline: b === t ? 'Maître horloger ! ⏰' : `${b} horloge${b > 1 ? 's' : ''} sur ${t} !` }),
  });
  const { courant, manche, total, etat, fini, repondre, suivant, bonnes } = jeu;
  const exo = courant?.valeur ?? null;
  const item = exo?.item ?? null;
  const task = item?.task ?? 'lire';
  const avecSecondes = (item?.seconds ?? 0) > 0 || (lesson.classe === 'CM2' && level === 'plus_loin' && item?.seconds !== undefined);

  const [reglage, setReglage] = useState(0); // minutes 0..719
  const [saisie, setSaisie] = useState<Record<string, string>>({});
  const [indice, setIndice] = useState(false);
  const [indiceUtilise, setIndiceUtilise] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const champs = useMemo<Champ[]>(() => {
    if (task === 'duree' && exo?.duree?.mode === 'duree') return [CH_H, CH_M];
    return avecSecondes && task === 'lire' ? [CH_H, CH_M, CH_S] : [CH_H, CH_M];
  }, [task, exo, avecSecondes]);

  const propositions = useMemo(() => {
    if (!exo || task !== 'lire') return [];
    const p = propositionsLecture(exo.cible, 4);
    // ordre mélangé mais stable pour la manche
    const k = (manche * 5 + exo.cible.m) % p.length;
    return [...p.slice(k), ...p.slice(0, k)];
  }, [exo, task, manche]);

  const pas = exo ? pasMinutes(level, exo.cible.m) : 5;

  // Nouvelle manche
  useEffect(() => {
    if (!exo) return;
    setSaisie(vide(champs));
    setIndice(false);
    setIndiceUtilise(false);
    setMessage(undefined);
    // horloge à régler : on part de midi (ou d'une heure éloignée de la cible)
    const depart = ((exo.cible.h % 12) * 60 + 380) % 720;
    setReglage(depart - (depart % pas));
    if (lectureAuto) void speech.speak(exo.item.spoken ?? exo.item.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exo]);

  const bloque = !!etat || paused || fini;
  const aideVisible = level === 'facile' || indice;

  const valider = useCallback(
    (choix?: number) => {
      if (!exo || bloque) return;
      const { item: it, cible, duree } = exo;
      if (it.task === 'lire') {
        if (level === 'facile' && choix !== undefined) {
          const juste = propositions[choix] === formatHeure({ h: cible.h % 12 === 0 ? 12 : cible.h % 12, m: cible.m, s: cible.s });
          setMessage(juste ? 'Bravo, tu sais lire l’heure !' : undefined);
          repondre(juste, propositions[choix] ?? '', it.answerText);
          return;
        }
        const h = Number(saisie.h || NaN);
        const m = Number(saisie.m || 0);
        const s = champs.length === 3 ? Number(saisie.s || 0) : cible.s;
        if (Number.isNaN(h)) return;
        const donne: Heure = { h, m, s: champs.length === 3 ? s : undefined };
        const juste = memeCadran(donne, { ...cible, s: champs.length === 3 ? cible.s : undefined });
        setMessage(juste ? 'Exact !' : undefined);
        repondre(juste, formatHeure(donne), it.answerText);
        return;
      }
      if (it.task === 'regler') {
        const donne: Heure = { h: Math.floor(reglage / 60), m: reglage % 60 };
        const juste = memeCadran(donne, { h: cible.h, m: cible.m });
        setMessage(juste ? 'L’horloge est à l’heure !' : `Presque ! Ton horloge montre ${formatHeure({ h: donne.h === 0 ? 12 : donne.h, m: donne.m })}.`);
        repondre(juste, formatHeure(donne), it.answerText);
        return;
      }
      if (!duree) return;
      if (duree.mode === 'duree') {
        const min = Number(saisie.h || 0) * 60 + Number(saisie.m || 0);
        if (!saisie.h && !saisie.m) return;
        const juste = min === duree.duree;
        setMessage(juste ? 'Exact, bon voyage ! 🚆' : undefined);
        repondre(juste, formatDuree(min), it.answerText);
        return;
      }
      const attendu = duree.mode === 'fin' ? duree.fin : duree.debut;
      const h = Number(saisie.h || NaN);
      const m = Number(saisie.m || 0);
      if (Number.isNaN(h)) return;
      const donne: Heure = { h, m };
      const exact = h === attendu.h && m === attendu.m;
      const juste = exact || memeCadran(donne, attendu);
      setMessage(
        juste
          ? exact
            ? 'Exact, bon voyage ! 🚆'
            : `Juste ! On peut aussi dire ${formatHeure(attendu)}.`
          : undefined,
      );
      repondre(juste, formatHeure(donne), it.answerText);
    },
    [exo, bloque, level, propositions, saisie, champs, reglage, repondre],
  );

  // Clavier pour régler les aiguilles
  useEffect(() => {
    if (task !== 'regler' || bloque) return;
    const h = (e: KeyboardEvent) => {
      const map: Record<string, number> = { ArrowUp: 60, ArrowDown: -60, ArrowRight: pas, ArrowLeft: -pas };
      if (e.key in map) {
        e.preventDefault();
        setReglage((r) => (((r + map[e.key]!) % 720) + 720) % 720);
        sfx.play('tic');
      } else if (e.key === 'Enter' && (document.activeElement as HTMLElement | null)?.tagName !== 'BUTTON') {
        e.preventDefault();
        valider();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [task, bloque, pas, sfx, valider]);

  if (!exo || !item) return <EtatVide icone="⏰" jeu="L’Horloger" besoin="d’exercices sur l’heure et les durées" />;

  const { cible, duree } = exo;
  const montreSec = avecSecondes || (item.seconds ?? 0) > 0;
  const heureAffichee: Heure =
    task === 'regler' ? { h: Math.floor(reglage / 60), m: reglage % 60 } : task === 'duree' && duree ? (duree.mode === 'debut' ? duree.fin : duree.debut) : cible;
  const reponseTexte =
    task === 'duree' && duree
      ? duree.mode === 'duree'
        ? formatDuree(duree.duree)
        : formatHeure(duree.mode === 'fin' ? duree.fin : duree.debut)
      : item.answerText;
  const bouger = (d: number) => {
    if (bloque) return;
    sfx.play('tic');
    setReglage((r) => (((r + d) % 720) + 720) % 720);
  };

  const scene =
    task === 'duree' && duree ? (
      <Gare duree={duree} montrerArrivee={duree.mode === 'duree' || duree.mode === 'debut'} etat={etat} reduce={!!reduce} />
    ) : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          Horloge {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>⏰</span> {bonnes}
        </Hud>
      </Bandeau>
      <div className="grid gap-3 lg:grid-cols-2">
        <section
          className="relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-card border-4 border-white bg-gradient-to-b from-[#8A5A3B] to-[#5A3D2B] p-3 shadow-soft"
          aria-label="L’atelier de l’horloger"
        >
          {scene}
          <motion.div
            key={`${manche}-${task}`}
            initial={reduce ? false : { scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: etat === 'juste' && !reduce ? [0, -4, 4, 0] : 0 }}
            className="flex flex-col items-center"
          >
            <Horloge
              heure={heureAffichee}
              taille={task === 'duree' ? 200 : 280}
              secondes={montreSec}
              aideMinutes={aideVisible && task !== 'duree'}
              interactif={task === 'regler' && !bloque}
              pas={pas}
              onChange={(t) => {
                setReglage(t);
              }}
              couleur={task === 'regler' ? '#FFD45C' : '#4FC3F7'}
              label={task === 'regler' ? 'Horloge à régler : fais glisser les aiguilles' : `Horloge`}
            />
            {task === 'duree' && duree && (
              <p className="mt-1 rounded-full bg-white/90 px-3 font-titre font-bold text-ink">
                {duree.mode === 'debut' ? 'Arrivée' : 'Départ'} : {formatHeure(duree.mode === 'debut' ? duree.fin : duree.debut)}
              </p>
            )}
          </motion.div>
          {task === 'regler' && (
            <div className="grid w-full max-w-sm grid-cols-4 gap-2" role="group" aria-label="Régler les aiguilles">
              <Button variant="blanc" className="whitespace-nowrap !px-1" onClick={() => bouger(-60)} disabled={bloque} aria-label="Reculer d’une heure">
                −1 h
              </Button>
              <Button variant="blanc" className="whitespace-nowrap !px-1" onClick={() => bouger(60)} disabled={bloque} aria-label="Avancer d’une heure">
                +1 h
              </Button>
              <Button variant="blanc" className="whitespace-nowrap !px-1" onClick={() => bouger(-pas)} disabled={bloque} aria-label={`Reculer de ${pas} minutes`}>
                −{pas}
              </Button>
              <Button variant="blanc" className="whitespace-nowrap !px-1" onClick={() => bouger(pas)} disabled={bloque} aria-label={`Avancer de ${pas} minutes`}>
                +{pas}
              </Button>
            </div>
          )}
        </section>

        <section className="carte flex min-w-0 flex-col items-center gap-3 p-4">
          <div className="flex items-start gap-3">
            <SpeakButton text={item.spoken ?? item.prompt} label="Écouter la consigne" />
            <p className="font-titre text-xl font-extrabold leading-snug sm:text-2xl" aria-live="polite">
              {item.prompt}
            </p>
          </div>

          {aideVisible && task === 'duree' && duree && duree.mode !== 'debut' && (
            <Bulle ton="sky">
              <span aria-hidden>🦉</span>
              <span>
                On avance par sauts : {sauts(duree.debut, duree.duree).join(' ')}
                {duree.mode === 'duree' ? ` (jusqu’à ${formatHeure(duree.fin)})` : ''}
              </span>
            </Bulle>
          )}
          {aideVisible && task === 'duree' && duree?.mode === 'debut' && (
            <Bulle ton="sky">
              <span aria-hidden>🦉</span>
              <span>On remonte le temps : on enlève {formatDuree(duree.duree)} à {formatHeure(duree.fin)}.</span>
            </Bulle>
          )}
          {aideVisible && task !== 'duree' && level !== 'facile' && (
            <Bulle ton="sky">
              <span aria-hidden>🦉</span>
              <span>La petite aiguille montre les heures, la grande les minutes : regarde les nombres bleus autour du cadran.</span>
            </Bulle>
          )}
          {level === 'normal' && !indiceUtilise && !etat && (
            <Button
              variant="sun"
              icon={<Lightbulb aria-hidden />}
              onClick={() => {
                setIndice(true);
                setIndiceUtilise(true);
              }}
              disabled={bloque}
            >
              Indice
            </Button>
          )}

          {task === 'lire' && level === 'facile' ? (
            <ChoiceGrid
              choices={propositions}
              onPick={(i) => valider(i)}
              reveal={
                etat
                  ? {
                      correct: propositions.indexOf(formatHeure({ h: cible.h % 12 === 0 ? 12 : cible.h % 12, m: cible.m, s: cible.s })),
                      chosen: null,
                    }
                  : null
              }
              disabled={bloque}
            />
          ) : task === 'regler' ? (
            <Button variant="grass" size="lg" onClick={() => valider()} disabled={bloque}>
              C’est réglé !
            </Button>
          ) : (
            <SaisieChamps
              champs={champs}
              valeurs={saisie}
              onChange={setSaisie}
              onValider={() => valider()}
              disabled={bloque}
              etat={etat}
            />
          )}

          <AnimatePresence>
            {etat && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                <Feedback
                  state={etat}
                  message={message}
                  expected={etat === 'faux' ? reponseTexte : undefined}
                  explication={
                    etat === 'faux'
                      ? `${item.explication}${task === 'duree' && duree && duree.mode !== 'debut' ? ` (${sauts(duree.debut, duree.duree).join(' ')})` : ''}`
                      : undefined
                  }
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

/** Quai de gare : panneau des départs et petit train (mode « Le train part dans… »). */
function Gare({
  duree,
  montrerArrivee,
  etat,
  reduce,
}: {
  duree: AnalyseDuree;
  montrerArrivee: boolean;
  etat: 'juste' | 'faux' | null;
  reduce: boolean;
}) {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-[#BFE6FF]">
      <div className="mx-auto mt-2 flex w-fit gap-4 rounded-xl bg-ink px-4 py-1 font-mono text-sm text-sun sm:text-base" aria-hidden>
        <span>DÉPART {duree.mode === 'debut' ? '??' : formatHeure(duree.debut)}</span>
        <span>ARRIVÉE {montrerArrivee ? formatHeure(duree.fin) : '??'}</span>
      </div>
      <svg viewBox="0 0 400 70" className="block h-16 w-full" aria-hidden>
        <rect x="0" y="58" width="400" height="12" fill="#8A5A3B" />
        {Array.from({ length: 20 }, (_, i) => (
          <rect key={i} x={i * 20 + 4} y="56" width="10" height="4" fill="#5A3D2B" />
        ))}
        <g
          style={{
            transform: `translateX(${etat === 'juste' ? 260 : 0}px)`,
            transition: reduce ? undefined : 'transform 1.2s ease-in',
          }}
        >
          <rect x="20" y="18" width="70" height="36" rx="8" fill="#FF7A6B" />
          <rect x="30" y="24" width="18" height="14" rx="3" fill="#fff" />
          <rect x="56" y="24" width="18" height="14" rx="3" fill="#fff" />
          <rect x="92" y="26" width="56" height="28" rx="6" fill="#4FC3F7" />
          <rect x="100" y="31" width="14" height="11" rx="3" fill="#fff" />
          <rect x="124" y="31" width="14" height="11" rx="3" fill="#fff" />
          {[34, 76, 108, 136].map((x) => (
            <circle key={x} cx={x} cy="56" r="6" fill="#24304A" />
          ))}
          <rect x="22" y="8" width="10" height="12" rx="2" fill="#24304A" />
        </g>
      </svg>
    </div>
  );
}
