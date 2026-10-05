/** Tous les modules de contenu. Chaque dossier appartient à un domaine (ne modifier que le sien). */
import { mergeModules } from '../registry';
import { contenu as calculMental } from './calcul-mental';
import { contenu as conjugaison } from './conjugaison';
import { contenu as francais } from './francais';
import { contenu as mathsCe1 } from './maths-ce1';
import { contenu as mathsCm2 } from './maths-cm2';
import { contenu as mondeCe1 } from './monde-ce1';
import { contenu as mondeCm2 } from './monde-cm2';

export const CONTENU = mergeModules(
  calculMental,
  mathsCe1,
  mathsCm2,
  conjugaison,
  francais,
  mondeCe1,
  mondeCm2,
);
