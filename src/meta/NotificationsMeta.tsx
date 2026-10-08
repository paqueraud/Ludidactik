/** Notifications douces du bilan : défi du jour réussi, nouvelle gemme pour l'île, nouveaux badges. */
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LudiCoin, SpeakButton } from '@/components/ui';
import { getLesson } from '@/content';
import type { ApresPartie } from '@/services/meta';
import { vibrate } from '@/services/sfx';
import { getBadge } from './badges';
import { quartierDe } from './ile';

export function NotificationsMeta({ meta }: { meta: ApresPartie }) {
  // nouveau badge : petite vibration après la fanfare du bilan
  const nbBadges = meta.badges.length;
  useEffect(() => {
    if (!nbBadges) return;
    const t = setTimeout(() => vibrate([30, 40, 30, 40, 90]), 1200);
    return () => clearTimeout(t);
  }, [nbBadges]);
  const lignes: { cle: string; icone: string; texte: string; lien?: { to: string; label: string } }[] = [];
  if (meta.defi) {
    const tous = meta.defi.faits === meta.defi.total;
    lignes.push({
      cle: 'defi',
      icone: '🎯',
      texte: tous
        ? `Défi ${meta.defi.numero} réussi ! Les ${meta.defi.total} défis du jour sont faits : le coffre t’attend !`
        : `Défi ${meta.defi.numero} réussi ! (${meta.defi.faits} sur ${meta.defi.total})`,
      lien: tous ? { to: '/defis', label: 'Ouvrir le coffre' } : undefined,
    });
  }
  if (meta.gemme) {
    const l = getLesson(meta.gemme);
    const q = l ? quartierDe(l.matiere) : undefined;
    lignes.push({
      cle: 'gemme',
      icone: '💎',
      texte: `Nouvelle gemme ! Tu maîtrises « ${l?.titre ?? 'cette leçon'} » : un bâtiment pousse${q ? ` dans le ${q.nom}` : ' sur ton île'}.`,
      lien: { to: '/ile', label: 'Voir mon île' },
    });
  }
  for (const id of meta.badges) {
    const b = getBadge(id);
    if (b)
      lignes.push({
        cle: id,
        icone: b.icone,
        texte: `Nouveau badge : ${b.titre} ! ${b.description}`,
        lien: { to: '/badges', label: 'Mes badges' },
      });
  }
  if (!lignes.length) return null;
  return (
    <div className="flex w-full flex-col gap-2" role="status">
      {lignes.map((l, i) => (
        <motion.div
          key={l.cle}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.25, type: 'spring', stiffness: 220, damping: 18 }}
          className="carte flex items-center gap-3 bg-gradient-to-r from-sun/30 to-grape/20 p-3 text-left"
        >
          <span className="text-4xl" aria-hidden>
            {l.icone}
          </span>
          <p className="flex-1 font-bold">
            {l.texte}
            {l.cle === 'defi' && meta.defi && (
              <span className="ml-2 inline-flex items-center gap-1 whitespace-nowrap">
                +{meta.defi.ludis} <LudiCoin size={18} />
              </span>
            )}
          </p>
          <SpeakButton text={l.texte} size={40} />
          {l.lien && (
            <Link
              to={l.lien.to}
              className="hidden min-h-touch items-center rounded-full bg-card px-3 font-bold underline sm:flex"
            >
              {l.lien.label}
            </Link>
          )}
        </motion.div>
      ))}
    </div>
  );
}
