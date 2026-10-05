/**
 * Les Mots croisés automatiques (CATALOGUE n° 34).
 * La grille est générée à partir de la liste de mots (programme ou parents) — voir
 * `_orthographe-commun/mots-croises.ts`. Indice de chaque mot : sa définition si elle existe,
 * sinon le mot à écouter (voix du parent prioritaire), toujours avec son nombre de lettres.
 * Facile : 5 mots, 1re lettre de chaque mot donnée, chaque mot est vérifié dès qu'il est rempli
 *          (les cases fausses sont montrées). Normal : 7 mots, vérification du mot rempli (sans
 *          montrer la case fausse), 2 lettres à révéler. Plus loin : 9 mots, aucune lettre donnée,
 *          vérification de toute la grille à la fin, sans aide.
 */
import { motion } from 'framer-motion';
import { Check, Lightbulb, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LetterKeyboard, usePhysicalKeyboard } from '@/components/Keypads';
import { Button, SpeakButton } from '@/components/ui';
import type { Item, Level, SpellingItem } from '@/content/schemas';
import { checkSpelling, letterDiff } from '@/engine/answer';
import type { GameProps } from '@/engine/GameModule';
import { vibrate } from '@/services/sfx';
import { parNiveau, useGameSession } from '../_kit/session';
import { Hud } from '../_kit/ui';
import { collecterMots, estMot, melanger, motSimple } from '../_orthographe-commun/lettres';
import { type Placement, casesDe, genererGrille, grilleDeLettres } from '../_orthographe-commun/mots-croises';
import { DiffMot } from '../_orthographe-commun/ui';
import { direMot, peutEntendre, TOUCHES_LETTRES } from '../_orthographe-commun/voix';

const NB_MOTS: Record<Level, number> = { facile: 5, normal: 7, plus_loin: 9 };
const REVELER: Record<Level, number> = { facile: 3, normal: 2, plus_loin: 0 };

const okItem = (it: Item): it is SpellingItem =>
  estMot(it) && motSimple(it.word) && [...it.word].length >= 2 && [...it.word].length <= 12;

const k = (l: number, c: number) => `${l},${c}`;

type Resultat = 'juste' | 'faux';

export default function MotsCroises({ level, stream, paused, onAnswer, onEnd, speech, sfx }: GameProps) {
  const session = useGameSession({ paused, onAnswer, onEnd });

  const { grille, items } = useMemo(() => {
    const pool = collecterMots(stream, okItem, 30);
    // Les mots à revoir (en tête du flux) d'abord, puis un peu de variété
    const choisis = [...pool.slice(0, 4), ...melanger(pool.slice(4))];
    const g = genererGrille(
      choisis.map((p) => p.word),
      Math.random,
      { max: parNiveau(level, NB_MOTS), taille: level === 'facile' ? 11 : 13 },
    );
    return { grille: g, items: g.placements.map((p) => choisis[p.source]!) };
  }, [stream, level]);

  const lettresAttendues = useMemo(() => grilleDeLettres(grille), [grille]);
  const placements = grille.placements;

  /** Cases données d'office (facile : 1re lettre de chaque mot) ou révélées. */
  const [donnees, setDonnees] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (level === 'facile') for (const p of placements) s.add(k(p.ligne, p.col));
    return s;
  });
  const [saisie, setSaisie] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>();
    if (level === 'facile') for (const p of placements) m.set(k(p.ligne, p.col), p.cases[0]!);
    return m;
  });
  const [sel, setSel] = useState(0);
  const [curseur, setCurseur] = useState(level === 'facile' ? 1 : 0);
  const [resultats, setResultats] = useState<Map<number, Resultat>>(new Map());
  const [faussesVues, setFaussesVues] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [revelations, setRevelations] = useState(parNiveau(level, REVELER));
  const [fini, setFini] = useState<null | 'gagne' | 'solution'>(null);
  const [enregistres] = useState(() => new Set<number>());

  const p = placements[sel];

  useEffect(() => {
    session.startQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const motDe = useCallback(
    (pl: Placement, m: Map<string, string> = saisie) =>
      casesDe(pl)
        .map(([l, c]) => m.get(k(l, c)) ?? '')
        .join(''),
    [saisie],
  );
  const estJuste = useCallback(
    (i: number, m: Map<string, string> = saisie) => {
      const pl = placements[i]!;
      const ecrit = motDe(pl, m);
      return [...ecrit].length === pl.cases.length && checkSpelling(ecrit, pl.mot).correct;
    },
    [placements, motDe, saisie],
  );

  const verrouillee = (l: number, c: number) =>
    donnees.has(k(l, c)) ||
    placements.some(
      (pl, i) => resultats.get(i) === 'juste' && casesDe(pl).some(([a, b]) => a === l && b === c),
    );

  /** Enregistre (une seule fois par mot) la réponse auprès du moteur. */
  const enregistrer = (i: number, juste: boolean, ecrit: string) => {
    if (enregistres.has(i)) return;
    enregistres.add(i);
    session.answer(items[i]!, juste, ecrit, placements[i]!.mot);
  };

  const terminerSiComplet = (res: Map<number, Resultat>) => {
    if (placements.every((_, i) => res.get(i) === 'juste')) {
      setFini('gagne');
      sfx.play('fanfare');
      session.end({
        won: true,
        headline: `Grille terminée : ${placements.length} mots croisés !`,
        delayMs: 2200,
      });
    }
  };

  /** Vérification d'un mot complet (facile / normal). */
  const verifierMot = (i: number, m: Map<string, string>) => {
    const pl = placements[i]!;
    const ecrit = motDe(pl, m);
    if ([...ecrit].length < pl.cases.length || resultats.get(i) === 'juste') return;
    const juste = estJuste(i, m);
    enregistrer(i, juste, ecrit);
    const res = new Map(resultats);
    // Un mot croisé peut avoir été complété en même temps
    placements.forEach((_, j) => {
      if (res.get(j) !== 'juste' && estJuste(j, m)) res.set(j, 'juste');
    });
    if (juste) {
      res.set(i, 'juste');
      sfx.play('juste');
      setMessage(`Bravo : « ${pl.mot} » !`);
    } else {
      res.set(i, 'faux');
      sfx.play('faux');
      vibrate(40);
      if (level === 'facile') {
        const fausses = new Set(faussesVues);
        casesDe(pl).forEach(([l, c], n) => {
          if ((m.get(k(l, c)) ?? '').toLowerCase() !== pl.cases[n]) fausses.add(k(l, c));
        });
        setFaussesVues(fausses);
        setMessage('Presque ! Change les cases orange.');
      } else setMessage('Presque ! Une lettre n’est pas encore juste dans ce mot.');
    }
    setResultats(res);
    terminerSiComplet(res);
  };

  const ecrire = (ch: string) => {
    if (!p || fini || paused) return;
    const cases = casesDe(p);
    let pos = curseur;
    // Sauter les cases verrouillées
    while (pos < cases.length && verrouillee(...cases[pos]!)) pos++;
    if (pos >= cases.length) return;
    const [l, c] = cases[pos]!;
    const m = new Map(saisie);
    m.set(k(l, c), ch.toLowerCase());
    setSaisie(m);
    if (faussesVues.has(k(l, c))) {
      const f = new Set(faussesVues);
      f.delete(k(l, c));
      setFaussesVues(f);
    }
    let next = pos + 1;
    while (next < cases.length && verrouillee(...cases[next]!)) next++;
    setCurseur(Math.min(next, cases.length - 1));
    setMessage('');
    if (level !== 'plus_loin' && cases.every(([a, b]) => m.get(k(a, b)))) verifierMot(sel, m);
  };

  const effacer = () => {
    if (!p || fini || paused) return;
    const cases = casesDe(p);
    let pos = Math.min(curseur, cases.length - 1);
    const m = new Map(saisie);
    // Efface la case courante si elle est remplie, sinon la précédente
    if (!m.get(k(...cases[pos]!)) || verrouillee(...cases[pos]!)) {
      pos--;
      while (pos >= 0 && verrouillee(...cases[pos]!)) pos--;
    }
    if (pos < 0) return;
    m.delete(k(...cases[pos]!));
    setSaisie(m);
    setCurseur(pos);
    if (resultats.get(sel) === 'faux') {
      const r = new Map(resultats);
      r.delete(sel);
      setResultats(r);
    }
  };

  const choisirMot = (i: number) => {
    const pl = placements[i];
    if (!pl) return;
    setSel(i);
    const cases = casesDe(pl);
    const premiere = cases.findIndex(([l, c]) => !saisie.get(k(l, c)) && !verrouillee(l, c));
    setCurseur(premiere >= 0 ? premiere : 0);
    if (!items[i]?.definition && peutEntendre(speech, items[i]!)) void direMot(speech, items[i]!);
  };

  const toucherCase = (l: number, c: number) => {
    if (fini) return;
    const idx = placements
      .map((pl, i) => ({ pl, i }))
      .filter(({ pl }) => casesDe(pl).some(([a, b]) => a === l && b === c));
    if (!idx.length) return;
    const dejaSel = idx.find(({ i }) => i === sel);
    const autre = idx.find(({ i }) => i !== sel);
    const cible =
      dejaSel && (!autre || curseur !== casesDe(dejaSel.pl).findIndex(([a, b]) => a === l && b === c))
        ? dejaSel
        : (autre ?? idx[0]!);
    setSel(cible.i);
    setCurseur(casesDe(cible.pl).findIndex(([a, b]) => a === l && b === c));
  };

  const reveler = () => {
    if (!p || revelations <= 0 || fini) return;
    const cases = casesDe(p);
    let pos = cases.findIndex(([l, c], n) => (saisie.get(k(l, c)) ?? '') !== p.cases[n]);
    if (pos < 0) return;
    const [l, c] = cases[pos]!;
    const m = new Map(saisie);
    m.set(k(l, c), p.cases[pos]!);
    setSaisie(m);
    setDonnees(new Set(donnees).add(k(l, c)));
    setRevelations((r) => r - 1);
    sfx.play('etoile');
    pos++;
    setCurseur(Math.min(pos, cases.length - 1));
    if (level !== 'plus_loin' && cases.every(([a, b]) => m.get(k(a, b)))) verifierMot(sel, m);
  };

  /** Plus loin : vérification de toute la grille. */
  const verifierGrille = () => {
    if (fini) return;
    const res = new Map(resultats);
    let fausses = 0;
    placements.forEach((pl, i) => {
      const ecrit = motDe(pl);
      const complet = [...ecrit].length === pl.cases.length;
      const juste = complet && estJuste(i);
      if (complet) enregistrer(i, juste, ecrit);
      if (juste) res.set(i, 'juste');
      else if (complet) {
        res.set(i, 'faux');
        fausses++;
      }
    });
    setResultats(res);
    const manquants = placements.filter((_, i) => res.get(i) !== 'juste' && res.get(i) !== 'faux').length;
    if (fausses || manquants) {
      sfx.play('faux');
      setMessage(
        fausses
          ? `Presque ! ${fausses} mot${fausses > 1 ? 's ne sont' : ' n’est'} pas encore juste${fausses > 1 ? 's' : ''}.`
          : 'Il reste des mots à écrire.',
      );
    }
    terminerSiComplet(res);
  };

  const voirSolution = () => {
    if (fini) return;
    placements.forEach((pl, i) => {
      if (resultats.get(i) !== 'juste') enregistrer(i, false, motDe(pl));
    });
    setFini('solution');
    sfx.play('glisse');
    void speech.speak('Voici la solution. Regarde bien les mots à revoir.');
  };

  const terminer = () => {
    const justes = placements.filter((_, i) => resultats.get(i) === 'juste').length;
    session.end({
      won: justes >= Math.ceil(placements.length / 2),
      headline: `${justes} mot${justes > 1 ? 's' : ''} sur ${placements.length} dans la grille !`,
      delayMs: 200,
    });
  };

  usePhysicalKeyboard(
    {
      onKey: ecrire,
      onDelete: effacer,
      onSubmit: () => (level === 'plus_loin' ? verifierGrille() : p && verifierMot(sel, saisie)),
      disabled: paused || !!fini,
    },
    TOUCHES_LETTRES,
  );

  if (!placements.length) {
    return (
      <div className="carte mx-auto max-w-md p-6 text-center">
        <p className="text-lg">Il faut au moins deux mots pour fabriquer une grille.</p>
      </div>
    );
  }

  const casesSel = new Set(p ? casesDe(p).map(([l, c]) => k(l, c)) : []);
  const caseCurseur = p ? casesDe(p)[curseur] : undefined;
  const numeros = new Map(placements.map((pl) => [k(pl.ligne, pl.col), pl.numero]));
  const justes = placements.filter((_, i) => resultats.get(i) === 'juste').length;

  const indice = (i: number) => {
    const pl = placements[i]!;
    const it = items[i]!;
    const n = pl.cases.length;
    const etat = resultats.get(i);
    return (
      <li key={i}>
        <button
          type="button"
          onClick={() => choisirMot(i)}
          className={`flex min-h-[48px] w-full items-center gap-2 rounded-xl px-2 py-1 text-left ${
            i === sel ? 'bg-sky/25 ring-2 ring-sky-dark' : 'hover:bg-ink/5'
          } ${etat === 'juste' ? 'text-grass-dark line-through decoration-2' : ''}`}
          aria-label={`${pl.numero} ${pl.dir === 'h' ? 'horizontal' : 'vertical'} : ${it.definition ?? 'écoute le mot'}, ${n} lettres`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky font-titre font-bold text-white">
            {pl.numero}
          </span>
          <span className="min-w-0 flex-1">
            {it.definition ?? (
              <span className="inline-flex items-center gap-1 font-bold">
                <Volume2 size={18} aria-hidden /> Écoute le mot
              </span>
            )}{' '}
            <span className="text-sm text-ink-soft">({n} lettres)</span>
          </span>
          {etat === 'juste' && <Check className="text-grass-dark" aria-hidden />}
        </button>
      </li>
    );
  };

  const horizontaux = placements.map((pl, i) => ({ pl, i })).filter(({ pl }) => pl.dir === 'h');
  const verticaux = placements.map((pl, i) => ({ pl, i })).filter(({ pl }) => pl.dir === 'v');
  const itemSel = p ? items[sel]! : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 pb-6 pt-2 sm:px-6 lg:flex-row lg:items-start">
      <section className="carte flex min-w-0 flex-1 flex-col items-center gap-3 p-3 sm:p-5">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Hud>
            ✏️ {justes} / {placements.length} mots
          </Hud>
          <SpeakButton
            text="Touche une case ou un indice, puis écris le mot avec le clavier."
            label="Écouter la consigne"
            size={40}
          />
        </div>

        {/* La grille */}
        <div
          className="grid w-full gap-[3px] rounded-xl bg-ink/80 p-[3px]"
          style={{
            gridTemplateColumns: `repeat(${grille.cols}, minmax(0, 1fr))`,
            maxWidth: `${grille.cols * 3.2}rem`,
          }}
          role="grid"
          aria-label={`Grille de mots croisés : ${grille.lignes} lignes et ${grille.cols} colonnes`}
        >
          {lettresAttendues.map((ligne, l) =>
            ligne.map((attendue, c) => {
              if (!attendue)
                return <div key={k(l, c)} className="aspect-square rounded-[3px] bg-ink/0" aria-hidden />;
              const cle = k(l, c);
              const valeur = fini === 'solution' ? attendue : (saisie.get(cle) ?? '');
              const ecrite = saisie.get(cle) ?? '';
              const dansSel = casesSel.has(cle);
              const estCurseur = caseCurseur && caseCurseur[0] === l && caseCurseur[1] === c;
              const juste = placements.some(
                (pl, i) => resultats.get(i) === 'juste' && casesDe(pl).some(([a, b]) => a === l && b === c),
              );
              const fausse = faussesVues.has(cle) || (fini === 'solution' && ecrite && ecrite !== attendue);
              const corrigee = fini === 'solution' && !juste && ecrite !== attendue;
              return (
                <button
                  key={cle}
                  type="button"
                  onClick={() => toucherCase(l, c)}
                  className={`relative flex aspect-square items-center justify-center rounded-[3px] font-titre font-extrabold leading-none ${
                    juste
                      ? 'bg-grass/40 text-grass-dark'
                      : fausse && fini !== 'solution'
                        ? 'bg-sun text-ink'
                        : estCurseur
                          ? 'bg-sun/60 text-ink'
                          : dansSel
                            ? 'bg-sky/30 text-ink'
                            : 'bg-card text-ink'
                  } ${donnees.has(cle) && !juste ? 'text-grape' : ''} ${corrigee ? 'text-coral-dark' : ''}`}
                  style={{ fontSize: `clamp(0.85rem, ${Math.min(5.5, 62 / grille.cols)}vw, 1.6rem)` }}
                  aria-label={`Case ${l + 1}-${c + 1}${valeur ? ` : ${valeur}` : ' vide'}`}
                >
                  {numeros.has(cle) && (
                    <span className="absolute left-0.5 top-0 text-[0.6rem] font-bold leading-tight text-ink-soft sm:text-xs">
                      {numeros.get(cle)}
                    </span>
                  )}
                  <motion.span key={valeur} initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                    {valeur}
                  </motion.span>
                </button>
              );
            }),
          )}
        </div>

        {/* Mot sélectionné */}
        {p && itemSel && !fini && (
          <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-sky/10 p-2 text-center">
            <span className="font-titre font-bold">
              {p.numero} {p.dir === 'h' ? '→' : '↓'}
            </span>
            {itemSel.definition ? (
              <>
                <SpeakButton text={itemSel.definition} size={36} label="Écouter la définition" />
                <span className="font-bold">{itemSel.definition}</span>
              </>
            ) : (
              <span className="font-bold">Écoute le mot :</span>
            )}
            {peutEntendre(speech, itemSel) && (!itemSel.definition || level === 'facile') && (
              <Button
                variant="sun"
                size="md"
                icon={<Volume2 aria-hidden />}
                onClick={() => void direMot(speech, itemSel)}
              >
                Écouter
              </Button>
            )}
            <span className="text-sm text-ink-soft">({p.cases.length} lettres)</span>
          </div>
        )}

        <p className="min-h-[1.5rem] text-center font-bold" role="status" aria-live="polite">
          {message}
        </p>

        {fini === 'gagne' && (
          <motion.p
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            className="font-titre text-3xl font-extrabold text-grass-dark"
          >
            🎉 Grille complète, bravo !
          </motion.p>
        )}

        {fini === 'solution' && (
          <div className="w-full rounded-2xl bg-coral/10 p-3" role="status">
            <p className="text-center text-lg font-bold">
              Voici la solution. Regarde bien les mots à revoir :
            </p>
            <ul className="mt-2 flex flex-col items-center gap-2">
              {placements.map((pl, i) =>
                resultats.get(i) === 'juste' ? null : (
                  <li key={i} className="flex flex-wrap items-center justify-center gap-2">
                    {motDe(pl).trim() ? (
                      <DiffMot diff={letterDiff(motDe(pl), pl.mot)} className="text-2xl" />
                    ) : null}
                    <span className="font-titre text-2xl font-extrabold text-grass-dark">→ {pl.mot}</span>
                    <SpeakButton text={pl.mot} size={36} label={`Écouter : ${pl.mot}`} />
                  </li>
                ),
              )}
            </ul>
            {items[0]?.explication && <p className="mt-2 text-center">{items[0].explication}</p>}
            <div className="mt-3 flex justify-center">
              <Button variant="grass" onClick={terminer} autoFocus>
                J’ai compris, terminer
              </Button>
            </div>
          </div>
        )}

        {!fini && (
          <>
            <div className="flex flex-wrap justify-center gap-2">
              {level === 'plus_loin' && (
                <Button
                  variant="grass"
                  icon={<Check aria-hidden />}
                  onClick={verifierGrille}
                  disabled={paused}
                >
                  Vérifier la grille
                </Button>
              )}
              {revelations > 0 && (
                <Button variant="grape" icon={<Lightbulb aria-hidden />} onClick={reveler} disabled={paused}>
                  Révéler une lettre ({revelations})
                </Button>
              )}
              <Button variant="blanc" onClick={voirSolution} disabled={paused}>
                Voir la solution
              </Button>
            </div>
            <LetterKeyboard
              onKey={ecrire}
              onDelete={effacer}
              onSubmit={() => (level === 'plus_loin' ? verifierGrille() : p && verifierMot(sel, saisie))}
              disabled={paused}
            />
          </>
        )}
      </section>

      <aside className="carte flex flex-col gap-3 p-4 lg:w-80" aria-label="Indices">
        {horizontaux.length > 0 && (
          <div>
            <h2 className="font-titre text-lg font-bold">Horizontalement →</h2>
            <ul className="flex flex-col gap-1">{horizontaux.map(({ i }) => indice(i))}</ul>
          </div>
        )}
        {verticaux.length > 0 && (
          <div>
            <h2 className="font-titre text-lg font-bold">Verticalement ↓</h2>
            <ul className="flex flex-col gap-1">{verticaux.map(({ i }) => indice(i))}</ul>
          </div>
        )}
      </aside>
    </div>
  );
}
