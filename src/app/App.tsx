import { MotionConfig } from 'framer-motion';
import { type ComponentType, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Accueil } from '@/screens/Accueil';
import { ContenuRequis } from './ContenuRequis';
import { Chargement } from './Chargement';
import { MiseAJour } from './MiseAJour';

/** Écrans chargés à la demande (seul l'accueil fait partie du JS initial). */
const ecran = <K extends string>(load: () => Promise<Record<K, ComponentType>>, nom: K) =>
  lazy(() => load().then((m) => ({ default: m[nom] })));

const GameHost = ecran(() => import('@/engine/GameHost'), 'GameHost');
const Badges = ecran(() => import('@/screens/Badges'), 'Badges');
const Boss = ecran(() => import('@/screens/Boss'), 'Boss');
const Boutique = ecran(() => import('@/screens/Boutique'), 'Boutique');
const Connexion = ecran(() => import('@/screens/Connexion'), 'Connexion');
const CreerProfil = ecran(() => import('@/screens/CreerProfil'), 'CreerProfil');
const Defis = ecran(() => import('@/screens/Defis'), 'Defis');
const DuelAccueil = ecran(() => import('@/screens/Duel'), 'DuelAccueil');
const DuelJeu = ecran(() => import('@/screens/Duel'), 'DuelJeu');
const MonIle = ecran(() => import('@/screens/MonIle'), 'MonIle');
const MonProfil = ecran(() => import('@/screens/MonProfil'), 'MonProfil');
const Parents = ecran(() => import('@/screens/Parents'), 'Parents');
const Classes = ecran(() => import('@/screens/Parcours'), 'Classes');
const Matieres = ecran(() => import('@/screens/Parcours'), 'Matieres');
const Lecons = ecran(() => import('@/screens/Parcours'), 'Lecons');
const ChoixJeu = ecran(() => import('@/screens/Parcours'), 'ChoixJeu');
const ChoixNiveau = ecran(() => import('@/screens/Parcours'), 'ChoixNiveau');
const Labo = ecran(() => import('@/screens/Labo'), 'Labo');
const Profils = ecran(() => import('@/screens/Profils'), 'Profils');
const SalleDeJeux = ecran(() => import('@/screens/SalleDeJeux'), 'SalleDeJeux');
const JeuLecons = ecran(() => import('@/screens/SalleDeJeux'), 'JeuLecons');
const Scores = ecran(() => import('@/screens/Scores'), 'Scores');
const TableauDeBord = ecran(() => import('@/screens/TableauDeBord'), 'TableauDeBord');
import { useSettings } from '@/stores/settings';

export function App() {
  const load = useSettings((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ContenuRequis>
          <Suspense fallback={<Chargement />}>
            <Routes>
              <Route path="/" element={<Accueil />} />
              <Route path="/profils" element={<Profils />} />
              <Route path="/profils/nouveau" element={<CreerProfil />} />
              <Route path="/profils/:profileId/connexion" element={<Connexion />} />
              <Route path="/profil" element={<MonProfil />} />
              <Route path="/accueil" element={<TableauDeBord />} />
              <Route path="/defis" element={<Defis />} />
              <Route path="/defis/boss" element={<Boss />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="/boutique" element={<Boutique />} />
              <Route path="/ile" element={<MonIle />} />
              <Route path="/scores" element={<Scores />} />
              <Route path="/duel" element={<DuelAccueil />} />
              <Route path="/duel/:jeu" element={<DuelJeu />} />
              <Route path="/parents" element={<Parents />} />
              <Route path="/parents/:onglet" element={<Parents />} />
              <Route path="/jouer" element={<Classes />} />
              <Route path="/jouer/:classe" element={<Matieres />} />
              <Route path="/jouer/:classe/:matiere" element={<Lecons />} />
              <Route path="/jouer/:classe/:matiere/:lessonId" element={<ChoixJeu />} />
              <Route path="/jouer/:classe/:matiere/:lessonId/:gameId" element={<ChoixNiveau />} />
              <Route path="/jeux" element={<SalleDeJeux />} />
              <Route path="/jeux/:gameId" element={<JeuLecons />} />
              <Route path="/labo" element={<Labo />} />
              <Route path="/labo/:gameId" element={<Labo />} />
              <Route path="/partie/:lessonId/:gameId/:level" element={<GameHost />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ContenuRequis>
        <MiseAJour />
      </BrowserRouter>
    </MotionConfig>
  );
}
