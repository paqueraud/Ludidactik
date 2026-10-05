export interface AvatarItem {
  id: string;
  name: string;
  category: 'character' | 'hat' | 'accessory' | 'horseColor';
  icon: string;
  cost: number;
  description: string;
}

export const AVATAR_CHARACTERS: AvatarItem[] = [
  { id: 'fox', name: 'Renard Rusé', category: 'character', icon: '🦊', cost: 0, description: 'Le renard savant qui adore le calcul mental !' },
  { id: 'owl', name: 'Chouette Sage', category: 'character', icon: '🦉', cost: 0, description: 'L\'alpiniste vigilante des mots de français.' },
  { id: 'cat', name: 'Minou Écolier', category: 'character', icon: '🐱', cost: 10, description: 'Un petit félin agile et plein d\'astuces.' },
  { id: 'panda', name: 'Panda Zen', category: 'character', icon: '🐼', cost: 15, description: 'Garde son calme même devant la guillotine !' },
  { id: 'lion', name: 'Lion Héroïque', category: 'character', icon: '🦁', cost: 25, description: 'Le champion courageux de l\'Histoire.' },
  { id: 'astro', name: 'Astronaute', category: 'character', icon: '🧑‍🚀', cost: 30, description: 'Prêt à explorer les confins du système solaire.' }
];

export const AVATAR_HATS: AvatarItem[] = [
  { id: 'none', name: 'Cheveux au vent', category: 'hat', icon: '✨', cost: 0, description: 'Simple et décontracté.' },
  { id: 'phrygian', name: 'Bonnet Phrygien 1789', category: 'hat', icon: '🔴', cost: 10, description: 'L\'emblème de la liberté des Sans-Culottes !' },
  { id: 'climb_helmet', name: 'Casque d\'alpiniste', category: 'hat', icon: '⛑️', cost: 10, description: 'Pour grimper au sommet de la montagne des mots.' },
  { id: 'mortarboard', name: 'Toque d\'Académicien', category: 'hat', icon: '🎓', cost: 20, description: 'Pour les grands maîtres de l\'orthographe.' },
  { id: 'crown', name: 'Couronne Royale', category: 'hat', icon: '👑', cost: 25, description: 'Digne d\'un roi ou d\'une reine d\'autrefois.' },
  { id: 'beret', name: 'Béret d\'écolier', category: 'hat', icon: '🎨', cost: 15, description: 'Le classique des salles de classe d\'autrefois.' }
];

export const HORSE_COLORS: AvatarItem[] = [
  { id: 'brown', name: 'Marron Caramel', category: 'horseColor', icon: '🐎', cost: 0, description: 'Le fougueux étalon des plaines.' },
  { id: 'white', name: 'Blanc Neige', category: 'horseColor', icon: '🦄', cost: 15, description: 'Le pur-sang des champions.' },
  { id: 'black', name: 'Noir Ébène', category: 'horseColor', icon: '🖤', cost: 20, description: 'Rapide comme l\'éclair.' },
  { id: 'golden', name: 'Doré Magique', category: 'horseColor', icon: '⭐', cost: 35, description: 'Le cheval mythique des médaillés d\'or.' }
];
