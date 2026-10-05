/**
 * Le Détective des problèmes (CATALOGUE n° 16) — les 4 phases du BO + régulation :
 * 1. Comprendre : choisir la bonne reformulation de l'histoire (si l'item en fournit) ;
 * 2. Modéliser : compléter le schéma en barre en posant les blocs (toucher le bloc puis la case, ou glisser) ;
 *    Régulation « Est-ce possible ? » (Normal, Plus loin) : un détective distrait propose un résultat ;
 * 3. Calculer : Facile = le calcul est posé, on trouve le résultat ; Normal = choisir l'opération puis
 *    calculer ; Plus loin = écrire directement la réponse ;
 * 4. Répondre : compléter la phrase-réponse (Facile/Normal : choisir le bon nombre ; Plus loin : l'écrire).
 * Les erreurs de compréhension et de modélisation sont corrigées sur place (formatives) ; la manche est
 * réussie si le calcul et la phrase-réponse sont justes.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, SpeakButton } from '@/components/ui';
import type { BarModelItem, Item, Level } from '@/content/schemas';
import { checkNumeric, formatNumber } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { parNiveau } from '../_kit/session';
import { ChoiceGrid, Feedback, Hud } from '../_kit/ui';
import {
  type Analyse,
  type Emplacement,
  aPlacer,
  analyser,
  candidatFaux,
  equations,
  nombresEnonce,
} from '../_calcul-commun/barres';
import { aDire } from '../_calcul-commun/tirer';
import { Bandeau, Bulle, type Champ, EtatVide, SaisieChamps, useManches, vide } from '../_calcul-commun/ui';
import { Schema } from './Schema';

const MANCHES: Record<Level, number> = { facile: 4, normal: 5, plus_loin: 6 };
const A_PLACER: Record<Level, number> = { facile: 1, normal: 3, plus_loin: 99 };
const CHAMP: Champ[] = [{ cle: 'r', nom: 'résultat', max: 9 }];
const OPS = ['+', '−', '×', '÷'] as const;

type Phase = 'comprendre' | 'modeliser' | 'possible' | 'calculer' | 'repondre';
const ETAPES: { id: Phase; nom: string; icone: string }[] = [
  { id: 'comprendre', nom: 'Comprendre', icone: '🔎' },
  { id: 'modeliser', nom: 'Modéliser', icone: '📊' },
  { id: 'possible', nom: 'Possible ?', icone: '🤔' },
  { id: 'calculer', nom: 'Calculer', icone: '🧮' },
  { id: 'repondre', nom: 'Répondre', icone: '✍️' },
];

interface Exo {
  item: BarModelItem;
  analyse: Analyse;
}
const convertir = (it: Item): Exo | null => {
  if (it.kind !== 'bar_model') return null;
  try {
    return { item: it, analyse: analyser(it) };
  } catch {
    return null;
  }
};

interface Bloc {
  id: number;
  texte: string;
  pose: boolean;
}

/** L’énoncé sans la question (si elle y est déjà), pour ne pas la lire deux fois. */
const sansQuestion = (it: BarModelItem) =>
  it.statement.includes(it.question) ? it.statement.replace(it.question, '').trim() : it.statement;
const enonceComplet = (it: BarModelItem) => `${sansQuestion(it)} ${it.question}`;

/** Mélange stable (déterministe) pour une manche. */
function melange<T>(l: T[], graine: number): T[] {
  const out = [...l];
  let s = graine + 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export default function Detective(props: GameProps) {
  const { level, lectureAuto, speech, sfx, paused, lesson } = props;
  const ops = lesson.classe === 'CE1' ? OPS.filter((o) => o !== '÷') : [...OPS];
  const reduce = useReducedMotion();
  const jeu = useManches(props, {
    total: parNiveau(level, MANCHES),
    convertir,
    fin: (b, t) => ({
      headline:
        b === t
          ? 'Enquêtes toutes résolues ! 🕵️'
          : `${b} enquête${b > 1 ? 's' : ''} résolue${b > 1 ? 's' : ''} sur ${t} !`,
    }),
    delaiJuste: 2200,
  });
  const { courant, manche, total, etat, fini, repondre, suivant, bonnes } = jeu;
  const exo = courant?.valeur ?? null;
  const item = exo?.item ?? null;

  const [phase, setPhase] = useState<Phase>('comprendre');
  const [note, setNote] = useState<{ texte: string; ton: 'sun' | 'sky' | 'grape' } | null>(null);
  const [attente, setAttente] = useState<Phase | null>(null); // phase suivante après une note à lire
  const [remplis, setRemplis] = useState<Record<string, string>>({});
  const [actifs, setActifs] = useState<Set<string>>(new Set());
  const [blocs, setBlocs] = useState<Bloc[]>([]);
  const [selection, setSelection] = useState<number | null>(null);
  const [eqIndex, setEqIndex] = useState(0);
  const [eqPhase, setEqPhase] = useState<'op' | 'res'>('op');
  const [saisie, setSaisie] = useState<Record<string, string>>(vide(CHAMP));
  const [erreurCalcul, setErreurCalcul] = useState(false);
  const [loupes, setLoupes] = useState(0);
  const [message, setMessage] = useState<string | undefined>();

  const eqs = useMemo(() => (item ? equations(item.operation) : []), [item]);
  const reformulations = useMemo(
    () =>
      item?.reformulations
        ? melange(
            item.reformulations.map((t, i) => ({ t, bon: i === 0 })),
            manche * 7,
          )
        : [],
    [item, manche],
  );
  const candidat = useMemo(() => {
    if (!item) return null;
    const faux = candidatFaux(item);
    if (faux === null) return null;
    return (manche + item.answer) % 2 === 0
      ? { valeur: item.answer, possible: true }
      : { valeur: faux, possible: false };
  }, [item, manche]);
  const optionsReponse = useMemo(() => {
    if (!item) return [];
    const autres = [...nombresEnonce(item.statement), ...eqs.map((e) => e.resultat)].filter(
      (x) => x !== item.answer,
    );
    const uniq = [...new Set(autres)].slice(0, 2);
    return melange(
      [item.answer, ...uniq].map((x) => formatNumber(x)),
      manche * 3 + 1,
    );
  }, [item, eqs, manche]);

  const phaseApresModele = useCallback(
    (): Phase => (level !== 'facile' && candidat ? 'possible' : 'calculer'),
    [level, candidat],
  );

  // Nouvelle enquête
  useEffect(() => {
    if (!exo) return;
    const { item: it, analyse } = exo;
    const places = aPlacer(analyse, A_PLACER[level]);
    const ids = new Set(places.map((p) => p.id));
    const pre: Record<string, string> = {};
    for (const e of analyse.emplacements) if (!ids.has(e.id)) pre[e.id] = e.attendu;
    setRemplis(pre);
    // blocs : un par emplacement à remplir (les parts égales répétées sont aussi à poser)
    const aRemplir = analyse.emplacements.filter((e) => !pre[e.id]);
    setActifs(new Set(aRemplir.map((e) => e.id)));
    setBlocs(
      melange(
        aRemplir.map((e, i) => ({ id: i, texte: e.attendu, pose: false })),
        manche * 5 + 2,
      ),
    );
    setSelection(null);
    setEqIndex(0);
    setEqPhase(level === 'normal' ? 'op' : 'res');
    setSaisie(vide(CHAMP));
    setErreurCalcul(false);
    setNote(null);
    setAttente(null);
    setMessage(undefined);
    setPhase(
      it.reformulations && it.reformulations.length >= 2
        ? 'comprendre'
        : aRemplir.length
          ? 'modeliser'
          : phaseApresModele(),
    );
    if (lectureAuto) void speech.speak(aDire(enonceComplet(it)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exo]);

  const bloque = !!etat || paused || fini;

  const passer = useCallback((p: Phase, texte?: string, ton: 'sun' | 'sky' | 'grape' = 'sky') => {
    if (texte) {
      setNote({ texte, ton });
      setAttente(p);
    } else {
      setNote(null);
      setAttente(null);
      setPhase(p);
    }
  }, []);
  const continuerNote = useCallback(() => {
    if (!attente) return;
    setPhase(attente);
    setAttente(null);
    setNote(null);
  }, [attente]);

  /* ---------- 1. Comprendre ---------- */
  const comprendre = (i: number) => {
    if (bloque || attente) return;
    const r = reformulations[i];
    if (!r) return;
    const suite: Phase = blocs.length ? 'modeliser' : phaseApresModele();
    if (r.bon) {
      sfx.play('etoile');
      passer(suite);
    } else {
      sfx.play('glisse');
      passer(
        suite,
        `Presque ! La bonne façon de raconter l’histoire : « ${reformulations.find((x) => x.bon)?.t} »`,
        'sun',
      );
    }
  };

  /* ---------- 2. Modéliser ---------- */
  const poser = useCallback(
    (e: Emplacement, blocId?: number) => {
      if (bloque || phase !== 'modeliser') return;
      const id = blocId ?? selection;
      if (id === null || id === undefined) return;
      const b = blocs.find((x) => x.id === id);
      if (!b || b.pose) return;
      if (b.texte !== e.attendu) {
        sfx.play('glisse');
        setNote({
          texte:
            b.texte === '?'
              ? 'Pas ici : le « ? » se met là où se cache le nombre qu’on cherche.'
              : `Pas ici : relis l’histoire, où va ${b.texte} ?`,
          ton: 'sun',
        });
        setSelection(null);
        return;
      }
      sfx.play('pop');
      setNote(null);
      const nb = blocs.map((x) => (x.id === id ? { ...x, pose: true } : x));
      setBlocs(nb);
      setRemplis((r) => ({ ...r, [e.id]: b.texte }));
      setSelection(null);
      if (nb.every((x) => x.pose)) {
        sfx.play('etoile');
        setTimeout(() => setPhase(phaseApresModele()), 700);
      }
    },
    [bloque, phase, selection, blocs, sfx, phaseApresModele],
  );

  /* ---------- Régulation ---------- */
  const possible = (i: number) => {
    if (bloque || attente || !candidat || !item) return;
    const ditPossible = i === 0;
    const juste = ditPossible === candidat.possible;
    if (juste) {
      setLoupes((l) => l + 1);
      sfx.play('etoile');
    } else sfx.play('glisse');
    const raison = candidat.possible
      ? 'C’est possible : le schéma le montre, on va le vérifier en calculant.'
      : candidat.valeur < item.answer
        ? `Impossible : ${formatNumber(candidat.valeur)}, c’est trop petit. Regarde le schéma : le nombre cherché est plus grand.`
        : `Impossible : ${formatNumber(candidat.valeur)}, c’est trop grand. Regarde le schéma : le nombre cherché est plus petit.`;
    passer('calculer', `${juste ? 'Bien raisonné ! 🔍 ' : 'Presque ! '}${raison}`, juste ? 'sky' : 'sun');
  };

  /* ---------- 3. Calculer ---------- */
  const eq = eqs[eqIndex];
  const direct = level === 'plus_loin' || eqs.length === 0;
  const choisirOp = (i: number) => {
    if (bloque || attente || !eq) return;
    const op = ops[i]!;
    if (op === eq.op) {
      sfx.play('pop');
      setEqPhase('res');
      setNote(null);
    } else {
      sfx.play('glisse');
      setErreurCalcul(true);
      setNote({
        texte: `Presque ! Ici, il faut faire ${formatNumber(eq.gauche)} ${eq.op} ${formatNumber(eq.droite)}.`,
        ton: 'sun',
      });
      setEqPhase('res');
    }
  };

  const validerCalcul = useCallback(() => {
    if (bloque || attente || !item || !saisie.r) return;
    if (direct) {
      const c = checkNumeric(saisie.r, item.answer, { tolerateZeros: true });
      if (!c.correct) setErreurCalcul(true);
      setSaisie(vide(CHAMP));
      passer(
        'repondre',
        c.correct ? 'Bravo, ton calcul est juste !' : `Presque ! Le calcul : ${item.operation}.`,
        c.correct ? 'sky' : 'sun',
      );
      sfx.play(c.correct ? 'juste' : 'glisse');
      return;
    }
    if (!eq) return;
    const c = checkNumeric(saisie.r, eq.resultat, { tolerateZeros: true });
    if (!c.correct) setErreurCalcul(true);
    sfx.play(c.correct ? 'juste' : 'glisse');
    setSaisie(vide(CHAMP));
    const fin = eqIndex >= eqs.length - 1;
    const suite = () => {
      if (fin) return;
      setEqIndex((x) => x + 1);
      setEqPhase(level === 'normal' ? 'op' : 'res');
    };
    if (c.correct) {
      if (fin) passer('repondre', `Exact : ${eq.texte}`, 'sky');
      else {
        suite();
        setNote({ texte: `Exact : ${eq.texte}. Étape suivante !`, ton: 'sky' });
      }
    } else {
      if (fin) passer('repondre', `Presque ! ${eq.texte}`, 'sun');
      else {
        suite();
        setNote({ texte: `Presque ! ${eq.texte}. On continue avec ce résultat.`, ton: 'sun' });
      }
    }
  }, [bloque, attente, item, saisie, direct, eq, eqIndex, eqs.length, level, passer, sfx]);

  /* ---------- 4. Répondre ---------- */
  const terminer = useCallback(
    (donne: string) => {
      if (!item || bloque) return;
      const c = checkNumeric(donne, item.answer, { tolerateZeros: true });
      const juste = c.correct && !erreurCalcul;
      setMessage(
        juste
          ? 'Enquête résolue ! 🕵️'
          : c.correct
            ? 'Ta phrase est juste ! Attention, il y a eu une petite erreur de calcul en route.'
            : undefined,
      );
      setNote(null);
      repondre(juste, donne, formatNumber(item.answer));
    },
    [item, bloque, erreurCalcul, repondre],
  );

  // Entrée pour continuer après une note
  useEffect(() => {
    if (!attente || bloque) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        continuerNote();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [attente, bloque, continuerNote]);

  if (!exo || !item)
    return (
      <EtatVide icone="🕵️" jeu="Le Détective des problèmes" besoin="de problèmes avec un schéma en barre" />
    );

  const phrase = item.answerSentence.split('___');
  const etapes = ETAPES.filter((e) =>
    e.id === 'comprendre'
      ? !!item.reformulations
      : e.id === 'possible'
        ? level !== 'facile' && !!candidat
        : true,
  );
  const iPhase = etapes.findIndex((e) => e.id === phase);
  const enonceDit = aDire(enonceComplet(item));
  const montrerSchema = phase !== 'comprendre';

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6">
      <Bandeau>
        <Hud>
          Enquête {manche} / {total}
        </Hud>
        <Hud>
          <span aria-hidden>🔍</span> {loupes} · <span aria-hidden>🕵️</span> {bonnes}
        </Hud>
      </Bandeau>

      {/* étapes */}
      <ol className="flex w-full flex-wrap justify-center gap-1.5" aria-label="Étapes de l’enquête">
        {etapes.map((e, i) => (
          <li
            key={e.id}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
              i === iPhase
                ? 'bg-grape text-white shadow-pop-sm'
                : i < iPhase || etat
                  ? 'bg-grass/30'
                  : 'bg-white/70 text-ink-soft'
            }`}
            aria-current={i === iPhase ? 'step' : undefined}
          >
            <span aria-hidden>{e.icone}</span> {e.nom}
          </li>
        ))}
      </ol>

      <div className="grid gap-3 lg:grid-cols-2">
        <section
          className="relative flex flex-col gap-3 overflow-hidden rounded-card border-4 border-white bg-gradient-to-br from-[#FFF3D6] to-[#F7E1B5] p-3 shadow-soft"
          aria-label="Le dossier de l’enquête"
        >
          <div className="flex items-start gap-2">
            <span className="text-4xl" aria-hidden>
              🕵️
            </span>
            <div className="flex-1 rounded-2xl bg-white p-3 shadow-pop-sm">
              <div className="flex items-start gap-2">
                <SpeakButton text={enonceDit} label="Écouter le problème" size={40} />
                <p className="text-lg leading-snug">
                  {sansQuestion(item)} <strong>{item.question}</strong>
                </p>
              </div>
            </div>
          </div>
          {montrerSchema && (
            <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Schema
                item={item}
                analyse={exo.analyse}
                remplis={remplis}
                actifs={phase === 'modeliser' ? actifs : new Set()}
                selection={selection !== null}
                onPoser={(e) => poser(e)}
                etat={blocs.every((b) => b.pose) ? 'ok' : null}
              />
            </motion.div>
          )}
          {phase === 'modeliser' && (
            <div
              className="flex flex-wrap items-center justify-center gap-2"
              role="group"
              aria-label="Blocs à poser"
            >
              {blocs
                .filter((b) => !b.pose)
                .map((b) => (
                  <motion.button
                    key={b.id}
                    type="button"
                    drag={!bloque && !reduce}
                    dragSnapToOrigin
                    whileDrag={{ scale: 1.15, zIndex: 40 }}
                    onDragEnd={(_, info) => {
                      const x = info.point.x - window.scrollX;
                      const y = info.point.y - window.scrollY;
                      const el = document
                        .elementsFromPoint(x, y)
                        .find((n) => (n as HTMLElement).dataset?.emplacement) as HTMLElement | undefined;
                      const e = exo.analyse.emplacements.find((x2) => x2.id === el?.dataset.emplacement);
                      if (e && actifs.has(e.id) && !remplis[e.id]) poser(e, b.id);
                    }}
                    onClick={() => {
                      sfx.play('tic');
                      setSelection((s) => (s === b.id ? null : b.id));
                    }}
                    disabled={bloque}
                    className={`min-h-[52px] min-w-[64px] touch-none rounded-2xl px-3 font-titre text-2xl font-extrabold shadow-pop ${
                      selection === b.id ? 'bg-grape text-white ring-4 ring-grape/40' : 'bg-sun text-ink'
                    }`}
                    aria-pressed={selection === b.id}
                    aria-label={`Bloc ${b.texte === '?' ? 'point d’interrogation' : b.texte}`}
                  >
                    {b.texte}
                  </motion.button>
                ))}
            </div>
          )}
        </section>

        <section className="carte flex min-w-0 flex-col items-center gap-3 p-4">
          {phase === 'comprendre' && (
            <>
              <p className="text-center font-titre text-xl font-extrabold">
                🔎 Quelle phrase raconte bien l’histoire ?
              </p>
              <ChoiceGrid
                choices={reformulations.map((r) => r.t)}
                onPick={comprendre}
                disabled={bloque || !!attente}
              />
            </>
          )}
          {phase === 'modeliser' && (
            <p className="text-center font-titre text-xl font-extrabold">
              📊 Complète le schéma : touche un bloc, puis la case où il va (ou fais-le glisser).
              {level === 'facile' && (
                <span className="mt-1 block text-base font-bold text-ink-soft">
                  Le « ? », c’est ce qu’on cherche.
                </span>
              )}
            </p>
          )}
          {phase === 'possible' && candidat && (
            <>
              <p className="text-center font-titre text-xl font-extrabold">
                🤔 Le détective Hibou, un peu distrait, annonce : « La réponse est{' '}
                {formatNumber(candidat.valeur)} ! » Est-ce possible ?
              </p>
              <SpeakButton
                text={`Le détective Hibou annonce : la réponse est ${aDire(formatNumber(candidat.valeur))}. Est-ce possible ?`}
                label="Écouter la question"
              />
              <ChoiceGrid
                choices={['Oui, c’est possible', 'Non, impossible']}
                onPick={possible}
                disabled={bloque || !!attente}
              />
            </>
          )}
          {phase === 'calculer' && (
            <>
              {direct ? (
                <p className="text-center font-titre text-xl font-extrabold">🧮 Calcule : {item.question}</p>
              ) : (
                eq && (
                  <>
                    <p className="text-center font-titre text-xl font-extrabold">
                      🧮 Calcul {eqs.length > 1 ? `${eqIndex + 1} / ${eqs.length}` : ''}
                    </p>
                    <p className="font-titre text-4xl font-extrabold" aria-live="polite">
                      {formatNumber(eq.gauche)} {level === 'normal' && eqPhase === 'op' ? '?' : eq.op}{' '}
                      {formatNumber(eq.droite)} = ?
                    </p>
                    {level === 'normal' && eqPhase === 'op' && (
                      <>
                        <p className="font-bold">Quelle opération ?</p>
                        <ChoiceGrid choices={ops} onPick={choisirOp} disabled={bloque || !!attente} />
                      </>
                    )}
                  </>
                )
              )}
              {(direct || eqPhase === 'res') && !attente && (
                <SaisieChamps
                  champs={CHAMP}
                  valeurs={saisie}
                  onChange={setSaisie}
                  onValider={validerCalcul}
                  disabled={bloque || !!attente}
                  decimal
                />
              )}
            </>
          )}
          {phase === 'repondre' && (
            <>
              <p className="text-center font-titre text-xl font-extrabold">✍️ Complète la phrase-réponse :</p>
              <div className="flex items-center gap-2">
                <SpeakButton
                  text={aDire(item.answerSentence.replace('___', 'combien'))}
                  label="Écouter la phrase"
                  size={40}
                />
                <p className="text-center text-xl font-bold">
                  {phrase[0]}
                  <span className="mx-1 inline-block min-w-[3ch] rounded-lg border-4 border-dashed border-sky px-2 text-center">
                    {etat ? formatNumber(item.answer) : '?'}
                  </span>
                  {phrase[1]}
                </p>
              </div>
              {!etat &&
                (level === 'plus_loin' ? (
                  <SaisieChamps
                    champs={CHAMP}
                    valeurs={saisie}
                    onChange={setSaisie}
                    onValider={() => saisie.r && terminer(saisie.r)}
                    disabled={bloque || !!attente}
                    decimal
                  />
                ) : (
                  <ChoiceGrid
                    choices={optionsReponse}
                    onPick={(i) => terminer(optionsReponse[i] ?? '')}
                    disabled={bloque || !!attente}
                  />
                ))}
            </>
          )}

          {note && (
            <Bulle ton={note.ton}>
              <span aria-hidden>🦉</span>
              <span className="flex-1" role="status">
                {note.texte}
              </span>
            </Bulle>
          )}
          {attente && !etat && (
            <Button variant="grass" onClick={continuerNote} autoFocus>
              Continuer l’enquête
            </Button>
          )}

          <AnimatePresence>
            {etat && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                <Feedback
                  state={etat}
                  message={message}
                  expected={
                    etat === 'faux'
                      ? `${formatNumber(item.answer)}${item.unit ? ` ${item.unit}` : ''} (${item.operation})`
                      : undefined
                  }
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
