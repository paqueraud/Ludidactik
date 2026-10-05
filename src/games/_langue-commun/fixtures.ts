/**
 * Items d'exemple des jeux de langue (n° 39 à 48) qui manquent aux exemples partagés
 * (`src/games/_kit/fixtures.ts`) : textes avec questions (`meta.texte`), phrases à ponctuer
 * (`meta.phrase`), phrases à analyser (Labo des fonctions), etc. Servent aux tests unitaires.
 * Textes originaux, libres de droits.
 */
import type { ItemStream } from '@/content/provider';
import type { Item, ItemKind } from '@/content/schemas';

const L = 'LABO';

const TEXTE_HERISSON =
  'Tous les soirs, un petit hérisson traverse le jardin de Nina. Il cherche des limaces sous les feuilles. ' +
  'Un soir, Nina pose une soucoupe d’eau près de la haie. Le lendemain matin, la soucoupe est vide. ' +
  'Nina sourit : son ami est passé pendant la nuit.';

const TEXTE_PHARE =
  'Au bout de la jetée se dresse un vieux phare blanc et rouge. Autrefois, un gardien y montait chaque soir ' +
  'pour allumer la grande lampe. Aujourd’hui, la lumière s’allume toute seule, mais les marins l’aperçoivent ' +
  'toujours avec soulagement quand la tempête gronde. Pour eux, ce faisceau qui balaie la mer signifie que ' +
  'le port est tout proche.';

export const LANGUE_FIXTURES: Partial<Record<ItemKind, Item[]>> = {
  mcq: [
    {
      kind: 'mcq',
      id: 'det1',
      lessonId: L,
      question: 'Que cherche le hérisson dans le jardin ?',
      choices: ['des limaces', 'des pommes', 'de l’eau'],
      answerIndex: 0,
      explication: 'Le texte dit : « Il cherche des limaces sous les feuilles. »',
      guillotine: false,
      meta: {
        titre: 'Le visiteur du soir',
        texte: TEXTE_HERISSON,
        preuve: 'Il cherche des limaces sous les feuilles.',
      },
    },
    {
      kind: 'mcq',
      id: 'det2',
      lessonId: L,
      question: 'Dans le texte, qui est « son ami » ?',
      choices: ['le hérisson', 'un chat', 'le jardinier'],
      answerIndex: 0,
      explication: 'Celui qui passe la nuit et boit l’eau de la soucoupe, c’est le hérisson.',
      guillotine: false,
      meta: {
        titre: 'Le visiteur du soir',
        texte: TEXTE_HERISSON,
        preuve: 'Nina sourit : son ami est passé pendant la nuit.',
      },
    },
    {
      kind: 'mcq',
      id: 'det3',
      lessonId: L,
      question: 'Pourquoi la soucoupe est-elle vide le matin ?',
      choices: ['Le hérisson a bu l’eau.', 'Nina l’a vidée.', 'Il a plu.'],
      answerIndex: 0,
      explication: 'Le texte ne le dit pas directement : on le devine, car le hérisson est passé la nuit.',
      guillotine: false,
      meta: {
        titre: 'Le visiteur du soir',
        texte: TEXTE_HERISSON,
        preuve: 'Nina sourit : son ami est passé pendant la nuit.',
      },
    },
    {
      kind: 'mcq',
      id: 'det4',
      lessonId: L,
      question: 'Que ressentent les marins quand ils voient la lumière du phare pendant la tempête ?',
      choices: ['du soulagement', 'de la colère', 'de l’ennui'],
      answerIndex: 0,
      explication:
        'Les marins aperçoivent la lumière « avec soulagement » : elle leur montre que le port est proche.',
      guillotine: false,
      meta: {
        titre: 'Le phare',
        texte: TEXTE_PHARE,
        preuve: 'les marins l’aperçoivent toujours avec soulagement quand la tempête gronde',
      },
    },
    {
      kind: 'mcq',
      id: 'det5',
      lessonId: L,
      question: 'Qui allume la lampe du phare aujourd’hui ?',
      choices: ['personne : elle s’allume toute seule', 'le gardien', 'les marins'],
      answerIndex: 0,
      explication: 'Autrefois c’était le gardien ; aujourd’hui, la lumière s’allume toute seule.',
      guillotine: false,
      meta: {
        titre: 'Le phare',
        texte: TEXTE_PHARE,
        preuve: 'Aujourd’hui, la lumière s’allume toute seule',
      },
    },
    // Feu tricolore de la ponctuation
    {
      kind: 'mcq',
      id: 'feu1',
      lessonId: L,
      question: 'Quel signe termine la phrase ?',
      choices: ['.', '?', '!'],
      answerIndex: 1,
      explication: 'La voix monte à la fin : c’est une question, on met un point d’interrogation.',
      guillotine: true,
      spoken: 'Est-ce que tu viens jouer avec nous ?',
      meta: { phrase: 'Est-ce que tu viens jouer avec nous' },
    },
    {
      kind: 'mcq',
      id: 'feu2',
      lessonId: L,
      question: 'Quel signe termine la phrase ?',
      choices: ['.', '?', '!'],
      answerIndex: 2,
      explication: 'On montre sa surprise : c’est une phrase exclamative, avec un point d’exclamation.',
      guillotine: true,
      spoken: 'Quel magnifique arc-en-ciel !',
      meta: { phrase: 'Quel magnifique arc-en-ciel' },
    },
    {
      kind: 'mcq',
      id: 'feu3',
      lessonId: L,
      question: 'Quel signe termine la phrase ?',
      choices: ['.', '?', '!'],
      answerIndex: 0,
      explication: 'La phrase donne une information et la voix descend : on met un point.',
      guillotine: true,
      spoken: 'Le train part à huit heures.',
      meta: { phrase: 'Le train part à huit heures' },
    },
  ],
  classification: [
    {
      kind: 'classification',
      id: 'fn1',
      lessonId: L,
      prompt: 'Trouve la fonction de chaque groupe.',
      categories: ['sujet', 'COD', 'CC de temps'],
      elements: [
        { label: 'Ce matin', category: 2 },
        { label: 'les enfants', category: 0 },
        { label: 'un gâteau', category: 1 },
      ],
      explication:
        'Le sujet s’encadre par « c’est… qui » ; le COD ne se déplace pas ; le CC se déplace et se supprime.',
      meta: { phrase: 'Ce matin, les enfants préparent un gâteau.' },
    },
    {
      kind: 'classification',
      id: 'fn2',
      lessonId: L,
      prompt: 'Trouve la fonction de chaque groupe.',
      categories: ['sujet', 'COI', 'CC de lieu'],
      elements: [
        { label: 'Malo', category: 0 },
        { label: 'à sa grand-mère', category: 1 },
        { label: 'dans le jardin', category: 2 },
      ],
      explication:
        'Le COI est introduit par une préposition (à, de) et ne se supprime pas ici sans changer le sens.',
      meta: {
        phrase: 'Malo obéit à sa grand-mère dans le jardin.',
        remplacements: {
          Malo: 'Il obéit à sa grand-mère dans le jardin.',
          'à sa grand-mère': 'Malo lui obéit dans le jardin.',
          'dans le jardin': 'Malo obéit à sa grand-mère là-bas.',
        },
      },
    },
    {
      kind: 'classification',
      id: 'fn3',
      lessonId: L,
      prompt: 'Trouve la fonction de chaque groupe.',
      categories: ['sujet', 'COD', 'attribut du sujet'],
      elements: [
        { label: 'Mon frère', category: 0 },
        { label: 'fatigué', category: 2 },
      ],
      explication:
        'Après un verbe d’état (être, sembler, devenir…), le groupe qui dit comment est le sujet est un attribut.',
      meta: { phrase: 'Mon frère semble fatigué.' },
    },
    {
      kind: 'classification',
      id: 'fn4',
      lessonId: L,
      prompt: 'Trouve la fonction de chaque groupe.',
      categories: ['sujet', 'CC de lieu', 'CC de cause'],
      elements: [
        { label: 'Les élèves', category: 0 },
        { label: 'en classe', category: 1 },
        { label: 'à cause de la pluie', category: 2 },
      ],
      explication: 'Le CC de cause répond à la question « pourquoi ? » ; le CC de lieu à « où ? ».',
      meta: { phrase: 'Les élèves jouent en classe à cause de la pluie.' },
    },
    // Chef d'orchestre (CM2)
    {
      kind: 'classification',
      id: 'cl2',
      lessonId: L,
      prompt: 'Range chaque mot dans sa classe.',
      categories: ['préposition', 'conjonction de subordination', 'pronom personnel'],
      elements: [
        { label: 'dans', category: 0 },
        { label: 'avec', category: 0 },
        { label: 'quand', category: 1 },
        { label: 'parce que', category: 1 },
        { label: 'nous', category: 2 },
        { label: 'lui', category: 2 },
      ],
      explication:
        'La préposition introduit un groupe (dans la boîte) ; la conjonction de subordination introduit une proposition (quand il pleut) ; le pronom personnel désigne une personne (je, tu, nous…) ou remplace un groupe nominal (lui = à Paul).',
    },
  ],
  ordering: [
    {
      kind: 'ordering',
      id: 'pz1',
      lessonId: L,
      prompt: 'Remets les mots dans l’ordre pour faire une question.',
      elements: ['Où', 'as-tu', 'caché', 'ton', 'cahier', '?'],
      mode: 'phrase',
      explication: 'Une phrase interrogative se termine par un point d’interrogation.',
    },
    {
      kind: 'ordering',
      id: 'pz2',
      lessonId: L,
      prompt: 'Remets les mots dans l’ordre.',
      elements: ['Ne', 'cours', 'pas', 'dans', 'le', 'couloir.'],
      mode: 'phrase',
      explication:
        'Phrase impérative à la forme négative : « ne » et « pas » encadrent le verbe. Elle finit par un point (ou un point d’exclamation).',
      meta: { ponctuationsAcceptees: ['.', '!'] },
    },
    {
      kind: 'ordering',
      id: 'pz3',
      lessonId: L,
      prompt: 'Remets les mots dans l’ordre.',
      elements: ['Quel', 'beau', 'château', 'de', 'sable', '!'],
      mode: 'phrase',
      explication: 'Une phrase exclamative se termine par un point d’exclamation.',
    },
  ],
  read_aloud: [
    {
      kind: 'read_aloud',
      id: 'ra2',
      lessonId: L,
      title: 'Le phare',
      text: TEXTE_PHARE,
      nbMots: 57,
      targetMCLM: 120,
      explication: 'Respire aux points et fais les liaisons.',
    },
  ],
  oral_answer: [
    {
      kind: 'oral_answer',
      id: 'pr1',
      lessonId: L,
      prompt: 'Lis cette syllabe : pra',
      answer: 'pra',
      accepted: ['pra', 'prat', 'pras'],
      explication: 'p-r-a : pra.',
    },
    {
      kind: 'oral_answer',
      id: 'pr2',
      lessonId: L,
      prompt: 'Lis ce pseudo-mot : stag',
      answer: 'stag',
      accepted: ['stag', 'stague'],
      explication: 's-t-a-g : stag.',
    },
    {
      kind: 'oral_answer',
      id: 'pr3',
      lessonId: L,
      prompt: 'Lis ce mot : grenouille',
      answer: 'grenouille',
      accepted: ['grenouille'],
      explication: '« ouille » se lit comme dans « fouille » : gre-nouille.',
    },
    {
      kind: 'oral_answer',
      id: 'pr4',
      lessonId: L,
      prompt: 'Lis ce mot : champignon',
      answer: 'champignon',
      accepted: ['champignon', 'champignons'],
      explication: '« am » se lit comme dans « jambe », « gn » comme dans « montagne » : cham-pi-gnon.',
    },
  ],
  pairing: [
    {
      kind: 'pairing',
      id: 'fam1',
      lessonId: L,
      prompt: 'Associe chaque mot au mot de sa famille.',
      pairs: [
        { left: 'jardin', right: 'jardinier' },
        { left: 'lait', right: 'laitier' },
        { left: 'dent', right: 'dentiste' },
        { left: 'fleur', right: 'fleuriste' },
        { left: 'chant', right: 'chanteur' },
        { left: 'nage', right: 'nageuse' },
      ],
      relation: 'mot → mot de la même famille',
      explication: 'Les mots d’une même famille ont le même radical : jardin, jardinier.',
    },
    {
      kind: 'pairing',
      id: 'fam2',
      lessonId: L,
      prompt: 'Associe chaque préfixe à son sens.',
      pairs: [
        { left: 're-', right: 'de nouveau (refaire)' },
        { left: 'in-', right: 'pas (invisible)' },
        { left: 'dé-', right: 'défaire ce qui est fait (démonter)' },
        { left: 'multi-', right: 'plusieurs (multicolore)' },
        { left: 'anti-', right: 'contre (antivol)' },
        { left: 'para-', right: 'qui protège de (parapluie)' },
      ],
      relation: 'préfixe → sens',
      explication: 'Le préfixe se place devant le radical et change le sens du mot.',
    },
  ],
  fill_blank: [
    {
      kind: 'fill_blank',
      id: 'fg1',
      lessonId: L,
      sentence: 'Autrefois, tu ___ dans la chorale.',
      answer: 'chantais',
      conjugaison: { sujet: 'tu', verbe: 'chanter', temps: 'imparfait' },
      explication: 'À l’imparfait, avec tu : marque du temps -ai- et marque de la personne -s : tu chantais.',
    },
    {
      kind: 'fill_blank',
      id: 'fg2',
      lessonId: L,
      sentence: 'Demain, ils ___ leur dessin.',
      answer: 'finiront',
      conjugaison: { sujet: 'ils', verbe: 'finir', temps: 'futur' },
      explication: 'Au futur, on entend la marque -r- puis -ont avec ils : ils finiront.',
    },
    {
      kind: 'fill_blank',
      id: 'fg3',
      lessonId: L,
      sentence: 'Hier, nous ___ une bonne note.',
      answer: 'avons eu',
      conjugaison: { sujet: 'nous', verbe: 'avoir', temps: 'passé composé' },
      explication: 'Passé composé = auxiliaire au présent + participe passé : nous avons eu.',
    },
    {
      kind: 'fill_blank',
      id: 'fg4',
      lessonId: L,
      sentence: 'Je ___ content de te voir.',
      answer: 'suis',
      choices: ['suis', 'es', 'est'],
      conjugaison: { sujet: 'je', verbe: 'être', temps: 'présent' },
      explication: 'Être au présent : je suis, tu es, il est.',
    },
  ],
};

/** Flux cyclique sur une liste d'items (tests). */
export function fluxDe(items: Item[]): ItemStream {
  let i = 0;
  return {
    size: items.length,
    next() {
      const it = items[i % items.length]!;
      i++;
      return it;
    },
  };
}
