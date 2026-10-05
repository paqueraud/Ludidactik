/**
 * Affichage d'une opération posée (disposition calculée par `_calcul-commun/posee.ts`) : grille de
 * cases, retenues et marques de cassage qui apparaissent au bon moment, traits, potence de la division.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useLayoutEffect, useRef, useState } from 'react';
import type { Cellule, Disposition } from '../_calcul-commun/posee';

const visible = (c: { visibleA?: number; cacheA?: number }, cur: number) =>
  (c.visibleA === undefined || cur >= c.visibleA) && (c.cacheA === undefined || cur < c.cacheA);

export function Grille({
  d,
  cur,
  erreurs,
  saisieCourante,
  masquerAides,
}: {
  d: Disposition;
  /** Étape en cours (d.etapes.length = terminé). */
  cur: number;
  /** Étapes où l'enfant s'est trompé (la case est corrigée en orange). */
  erreurs: Set<number>;
  saisieCourante?: string;
  /** Plus loin : les retenues ne sont pas écrites. */
  masquerAides: boolean;
}) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [taille, setTaille] = useState(48);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const maj = () => setTaille(Math.max(30, Math.min(56, Math.floor((el.clientWidth - 8) / d.colonnes))));
    maj();
    const ro = new ResizeObserver(maj);
    ro.observe(el);
    return () => ro.disconnect();
  }, [d.colonnes]);

  // Lignes « petites » : seulement des retenues ou des marques de cassage
  const petites = new Set<number>();
  for (let l = 0; l < d.lignes; l++) {
    const cs = d.cellules.filter((c) => c.ligne === l && !c.coin);
    if (cs.length > 0 && cs.every((c) => c.type === 'retenue' || c.type === 'casse')) petites.add(l);
    if (cs.length === 0 && d.op !== '÷') petites.add(l);
  }
  const h = (l: number) => (petites.has(l) ? Math.round(taille * 0.6) : taille);
  const tops: number[] = [];
  let y = 0;
  for (let l = 0; l < d.lignes; l++) {
    tops.push(y);
    y += h(l);
  }
  const hauteur = y;

  const rendu = (c: Cellule, i: number) => {
    if (!visible(c, cur)) return null;
    if (masquerAides && c.aide) return null;
    const style = { left: c.col * taille, top: tops[c.ligne], width: taille, height: h(c.ligne) };
    const virgule = (c.virgule || c.virguleA !== undefined) && cur >= (c.virguleA ?? -1);
    if (c.coin) {
      return (
        <span
          key={i}
          className={`pointer-events-none absolute z-10 flex font-titre text-sm font-extrabold text-coral-dark ${c.coin === 'hg' ? 'items-start justify-start pl-0.5' : 'items-end justify-start pb-0.5 pl-0.5'}`}
          style={style}
          aria-hidden
        >
          {c.texte}
        </span>
      );
    }
    if (c.type === 'retenue' || c.type === 'casse') {
      return (
        <motion.span
          key={i}
          initial={reduce ? false : { y: 14, opacity: 0, scale: 0.6 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          className={`absolute flex items-center justify-center font-titre font-extrabold ${c.type === 'retenue' ? 'text-grape' : 'text-coral-dark'}`}
          style={{ ...style, fontSize: taille * 0.42 }}
          aria-label={c.type === 'retenue' ? `retenue ${c.texte}` : `devient ${c.texte}`}
        >
          {c.texte}
        </motion.span>
      );
    }
    if (c.type === 'saisie') {
      const e = c.etape!;
      const fait = e < cur;
      const enCours = e === cur;
      if (!fait && !enCours && !d.casesFuturesVisibles) return null;
      const faux = erreurs.has(e);
      return (
        <span
          key={i}
          className={`absolute flex items-center justify-center rounded-lg font-titre font-extrabold ${
            fait
              ? faux
                ? 'bg-sun/50 text-coral-dark'
                : 'bg-grass/25 text-grass-dark'
              : enCours
                ? 'animate-pulse border-4 border-grape bg-grape/10 text-grape'
                : 'border-2 border-dashed border-ink/20'
          }`}
          style={{ ...style, fontSize: taille * 0.62, width: taille - 3, height: h(c.ligne) - 3 }}
          aria-label={fait ? `${c.texte}${faux ? ' (corrigé)' : ''}` : enCours ? 'case à remplir' : undefined}
        >
          {fait ? c.texte : enCours ? (saisieCourante ?? '') : ''}
          {virgule && <span className="absolute -right-1 bottom-0 text-ink">,</span>}
        </span>
      );
    }
    const barre = c.barreA !== undefined && cur >= c.barreA;
    return (
      <span
        key={i}
        className={`absolute flex items-center justify-center font-titre font-extrabold ${c.type === 'zero' ? 'text-ink/35' : c.type === 'operateur' ? 'text-sky-dark' : 'text-ink'}`}
        style={{ ...style, fontSize: taille * 0.62 }}
      >
        <span className={barre ? 'relative text-ink/40' : ''}>
          {c.texte}
          {barre && (
            <span
              className="absolute left-[-15%] top-1/2 h-[3px] w-[130%] -rotate-12 rounded bg-coral"
              aria-hidden
            />
          )}
        </span>
        {virgule && <span className="absolute -right-0.5 bottom-0">,</span>}
      </span>
    );
  };

  return (
    <div ref={box} className="flex w-full justify-center">
      <div
        className="relative rounded-2xl bg-white"
        style={{
          width: d.colonnes * taille,
          height: hauteur,
          // papier quadrillé (colonnes bien visibles)
          backgroundImage: 'linear-gradient(90deg, rgb(79 195 247 / 0.25) 1px, transparent 1px)',
          backgroundSize: `${taille}px 100%`,
        }}
        role="img"
        aria-label="Opération posée"
      >
        {d.traits.map((t, i) =>
          t.visibleA !== undefined && cur < t.visibleA ? null : t.vertical ? (
            <span
              key={`t${i}`}
              className="absolute w-[3px] rounded bg-ink"
              style={{
                left: t.col0 * taille - 2,
                top: tops[t.ligne],
                height: (tops[t.ligne1 ?? t.ligne] ?? 0) + h(t.ligne1 ?? t.ligne) - (tops[t.ligne] ?? 0),
              }}
              aria-hidden
            />
          ) : (
            <span
              key={`t${i}`}
              className="absolute h-[3px] rounded bg-ink"
              style={{
                left: t.col0 * taille,
                top: (tops[t.ligne] ?? 0) + h(t.ligne) - 1,
                width: (t.col1 - t.col0 + 1) * taille,
              }}
              aria-hidden
            />
          ),
        )}
        {d.cellules.map(rendu)}
      </div>
    </div>
  );
}
