/** Tests (Vitest) : tout le contenu est chargé avant chaque fichier de test, comme avant le découpage. */
import { chargerTout } from '@/content';

await chargerTout();
