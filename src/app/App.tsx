import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GameHost } from '@/engine/GameHost';
import { Accueil } from '@/screens/Accueil';
import { Badges } from '@/screens/Badges';
import { Boss } from '@/screens/Boss';
import { Boutique } from '@/screens/Boutique';
import { Connexion } from '@/screens/Connexion';
import { CreerProfil } from '@/screens/CreerProfil';
import { Defis } from '@/screens/Defis';
import { DuelAccueil, DuelJeu } from '@/screens/Duel';
import { MonIle } from '@/screens/MonIle';
import { MonProfil } from '@/screens/MonProfil';
import { Parents } from '@/screens/Parents';
import { ChoixJeu, ChoixNiveau, Classes, Lecons, Matieres } from '@/screens/Parcours';
import { Labo } from '@/screens/Labo';
import { Profils } from '@/screens/Profils';
import { JeuLecons, SalleDeJeux } from '@/screens/SalleDeJeux';
import { Scores } from '@/screens/Scores';
import { TableauDeBord } from '@/screens/TableauDeBord';
import { useSettings } from '@/stores/settings';

export function App() {
  const load = useSettings((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
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
      </BrowserRouter>
    </MotionConfig>
  );
}
