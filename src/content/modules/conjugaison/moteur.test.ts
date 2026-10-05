/**
 * Tableaux de référence du moteur de conjugaison : chaque verbe × chaque temps × chaque personne.
 * Les tableaux sont écrits à la main (Bescherelle), indépendamment du moteur.
 */
import { describe, expect, it } from 'vitest';
import {
  type Personne,
  type Temps,
  PERSONNES,
  auxiliaire,
  avecPronom,
  conjuguer,
  decomposer,
  formes,
  groupe,
  participePasse,
} from './moteur';

type Table = Partial<Record<Temps, string>>;

/** Formes séparées par « | » (je | tu | il | nous | vous | ils) ; impératif : tu | nous | vous. */
const REF: Record<string, Table> = {
  être: {
    present: 'suis|es|est|sommes|êtes|sont',
    imparfait: 'étais|étais|était|étions|étiez|étaient',
    futur: 'serai|seras|sera|serons|serez|seront',
    passe_simple: 'fus|fus|fut|fûmes|fûtes|furent',
    conditionnel: 'serais|serais|serait|serions|seriez|seraient',
    passe_compose: 'ai été|as été|a été|avons été|avez été|ont été',
    plus_que_parfait: 'avais été|avais été|avait été|avions été|aviez été|avaient été',
    imperatif: 'sois|soyons|soyez',
  },
  avoir: {
    present: 'ai|as|a|avons|avez|ont',
    imparfait: 'avais|avais|avait|avions|aviez|avaient',
    futur: 'aurai|auras|aura|aurons|aurez|auront',
    passe_simple: 'eus|eus|eut|eûmes|eûtes|eurent',
    conditionnel: 'aurais|aurais|aurait|aurions|auriez|auraient',
    passe_compose: 'ai eu|as eu|a eu|avons eu|avez eu|ont eu',
    plus_que_parfait: 'avais eu|avais eu|avait eu|avions eu|aviez eu|avaient eu',
    imperatif: 'aie|ayons|ayez',
  },
  chanter: {
    present: 'chante|chantes|chante|chantons|chantez|chantent',
    imparfait: 'chantais|chantais|chantait|chantions|chantiez|chantaient',
    futur: 'chanterai|chanteras|chantera|chanterons|chanterez|chanteront',
    passe_simple: 'chantai|chantas|chanta|chantâmes|chantâtes|chantèrent',
    conditionnel: 'chanterais|chanterais|chanterait|chanterions|chanteriez|chanteraient',
    passe_compose: 'ai chanté|as chanté|a chanté|avons chanté|avez chanté|ont chanté',
    plus_que_parfait: 'avais chanté|avais chanté|avait chanté|avions chanté|aviez chanté|avaient chanté',
    imperatif: 'chante|chantons|chantez',
  },
  commencer: {
    present: 'commence|commences|commence|commençons|commencez|commencent',
    imparfait: 'commençais|commençais|commençait|commencions|commenciez|commençaient',
    futur: 'commencerai|commenceras|commencera|commencerons|commencerez|commenceront',
    passe_simple: 'commençai|commenças|commença|commençâmes|commençâtes|commencèrent',
    conditionnel: 'commencerais|commencerais|commencerait|commencerions|commenceriez|commenceraient',
    passe_compose: 'ai commencé|as commencé|a commencé|avons commencé|avez commencé|ont commencé',
    imperatif: 'commence|commençons|commencez',
  },
  manger: {
    present: 'mange|manges|mange|mangeons|mangez|mangent',
    imparfait: 'mangeais|mangeais|mangeait|mangions|mangiez|mangeaient',
    futur: 'mangerai|mangeras|mangera|mangerons|mangerez|mangeront',
    passe_simple: 'mangeai|mangeas|mangea|mangeâmes|mangeâtes|mangèrent',
    conditionnel: 'mangerais|mangerais|mangerait|mangerions|mangeriez|mangeraient',
    passe_compose: 'ai mangé|as mangé|a mangé|avons mangé|avez mangé|ont mangé',
    imperatif: 'mange|mangeons|mangez',
  },
  nettoyer: {
    present: 'nettoie|nettoies|nettoie|nettoyons|nettoyez|nettoient',
    imparfait: 'nettoyais|nettoyais|nettoyait|nettoyions|nettoyiez|nettoyaient',
    futur: 'nettoierai|nettoieras|nettoiera|nettoierons|nettoierez|nettoieront',
    passe_simple: 'nettoyai|nettoyas|nettoya|nettoyâmes|nettoyâtes|nettoyèrent',
    conditionnel: 'nettoierais|nettoierais|nettoierait|nettoierions|nettoieriez|nettoieraient',
    passe_compose: 'ai nettoyé|as nettoyé|a nettoyé|avons nettoyé|avez nettoyé|ont nettoyé',
    imperatif: 'nettoie|nettoyons|nettoyez',
  },
  essuyer: {
    present: 'essuie|essuies|essuie|essuyons|essuyez|essuient',
    futur: 'essuierai|essuieras|essuiera|essuierons|essuierez|essuieront',
  },
  envoyer: {
    present: 'envoie|envoies|envoie|envoyons|envoyez|envoient',
    imparfait: 'envoyais|envoyais|envoyait|envoyions|envoyiez|envoyaient',
    futur: 'enverrai|enverras|enverra|enverrons|enverrez|enverront',
    passe_simple: 'envoyai|envoyas|envoya|envoyâmes|envoyâtes|envoyèrent',
    conditionnel: 'enverrais|enverrais|enverrait|enverrions|enverriez|enverraient',
    passe_compose: 'ai envoyé|as envoyé|a envoyé|avons envoyé|avez envoyé|ont envoyé',
  },
  payer: {
    present: 'paie|paies|paie|payons|payez|paient',
    futur: 'paierai|paieras|paiera|paierons|paierez|paieront',
  },
  appeler: {
    present: 'appelle|appelles|appelle|appelons|appelez|appellent',
    imparfait: 'appelais|appelais|appelait|appelions|appeliez|appelaient',
    futur: 'appellerai|appelleras|appellera|appellerons|appellerez|appelleront',
    passe_simple: 'appelai|appelas|appela|appelâmes|appelâtes|appelèrent',
    conditionnel: 'appellerais|appellerais|appellerait|appellerions|appelleriez|appelleraient',
    passe_compose: 'ai appelé|as appelé|a appelé|avons appelé|avez appelé|ont appelé',
    imperatif: 'appelle|appelons|appelez',
  },
  jeter: {
    present: 'jette|jettes|jette|jetons|jetez|jettent',
    futur: 'jetterai|jetteras|jettera|jetterons|jetterez|jetteront',
    imparfait: 'jetais|jetais|jetait|jetions|jetiez|jetaient',
  },
  acheter: {
    present: 'achète|achètes|achète|achetons|achetez|achètent',
    imparfait: 'achetais|achetais|achetait|achetions|achetiez|achetaient',
    futur: 'achèterai|achèteras|achètera|achèterons|achèterez|achèteront',
    passe_simple: 'achetai|achetas|acheta|achetâmes|achetâtes|achetèrent',
    conditionnel: 'achèterais|achèterais|achèterait|achèterions|achèteriez|achèteraient',
    imperatif: 'achète|achetons|achetez',
  },
  lever: {
    present: 'lève|lèves|lève|levons|levez|lèvent',
    futur: 'lèverai|lèveras|lèvera|lèverons|lèverez|lèveront',
  },
  geler: { present: 'gèle|gèles|gèle|gelons|gelez|gèlent' },
  promener: { present: 'promène|promènes|promène|promenons|promenez|promènent' },
  préférer: {
    present: 'préfère|préfères|préfère|préférons|préférez|préfèrent',
    imparfait: 'préférais|préférais|préférait|préférions|préfériez|préféraient',
    futur: 'préférerai|préféreras|préférera|préférerons|préférerez|préféreront',
    passe_simple: 'préférai|préféras|préféra|préférâmes|préférâtes|préférèrent',
    conditionnel: 'préférerais|préférerais|préférerait|préférerions|préféreriez|préféreraient',
    passe_compose: 'ai préféré|as préféré|a préféré|avons préféré|avez préféré|ont préféré',
    imperatif: 'préfère|préférons|préférez',
  },
  répéter: { present: 'répète|répètes|répète|répétons|répétez|répètent' },
  sécher: { present: 'sèche|sèches|sèche|séchons|séchez|sèchent' },
  protéger: {
    present: 'protège|protèges|protège|protégeons|protégez|protègent',
    imparfait: 'protégeais|protégeais|protégeait|protégions|protégiez|protégeaient',
  },
  plier: {
    present: 'plie|plies|plie|plions|pliez|plient',
    imparfait: 'pliais|pliais|pliait|pliions|pliiez|pliaient',
    futur: 'plierai|plieras|pliera|plierons|plierez|plieront',
    passe_simple: 'pliai|plias|plia|pliâmes|pliâtes|plièrent',
    passe_compose: 'ai plié|as plié|a plié|avons plié|avez plié|ont plié',
  },
  créer: {
    present: 'crée|crées|crée|créons|créez|créent',
    imparfait: 'créais|créais|créait|créions|créiez|créaient',
    futur: 'créerai|créeras|créera|créerons|créerez|créeront',
  },
  jouer: {
    present: 'joue|joues|joue|jouons|jouez|jouent',
    imparfait: 'jouais|jouais|jouait|jouions|jouiez|jouaient',
    futur: 'jouerai|joueras|jouera|jouerons|jouerez|joueront',
  },
  habiter: { present: 'habite|habites|habite|habitons|habitez|habitent' },
  arriver: {
    present: 'arrive|arrives|arrive|arrivons|arrivez|arrivent',
    passe_simple: 'arrivai|arrivas|arriva|arrivâmes|arrivâtes|arrivèrent',
  },
  finir: {
    present: 'finis|finis|finit|finissons|finissez|finissent',
    imparfait: 'finissais|finissais|finissait|finissions|finissiez|finissaient',
    futur: 'finirai|finiras|finira|finirons|finirez|finiront',
    passe_simple: 'finis|finis|finit|finîmes|finîtes|finirent',
    conditionnel: 'finirais|finirais|finirait|finirions|finiriez|finiraient',
    passe_compose: 'ai fini|as fini|a fini|avons fini|avez fini|ont fini',
    plus_que_parfait: 'avais fini|avais fini|avait fini|avions fini|aviez fini|avaient fini',
    imperatif: 'finis|finissons|finissez',
  },
  choisir: {
    present: 'choisis|choisis|choisit|choisissons|choisissez|choisissent',
    passe_simple: 'choisis|choisis|choisit|choisîmes|choisîtes|choisirent',
  },
  aller: {
    present: 'vais|vas|va|allons|allez|vont',
    imparfait: 'allais|allais|allait|allions|alliez|allaient',
    futur: 'irai|iras|ira|irons|irez|iront',
    passe_simple: 'allai|allas|alla|allâmes|allâtes|allèrent',
    conditionnel: 'irais|irais|irait|irions|iriez|iraient',
    imperatif: 'va|allons|allez',
  },
  faire: {
    present: 'fais|fais|fait|faisons|faites|font',
    imparfait: 'faisais|faisais|faisait|faisions|faisiez|faisaient',
    futur: 'ferai|feras|fera|ferons|ferez|feront',
    passe_simple: 'fis|fis|fit|fîmes|fîtes|firent',
    conditionnel: 'ferais|ferais|ferait|ferions|feriez|feraient',
    passe_compose: 'ai fait|as fait|a fait|avons fait|avez fait|ont fait',
    plus_que_parfait: 'avais fait|avais fait|avait fait|avions fait|aviez fait|avaient fait',
    imperatif: 'fais|faisons|faites',
  },
  dire: {
    present: 'dis|dis|dit|disons|dites|disent',
    imparfait: 'disais|disais|disait|disions|disiez|disaient',
    futur: 'dirai|diras|dira|dirons|direz|diront',
    passe_simple: 'dis|dis|dit|dîmes|dîtes|dirent',
    conditionnel: 'dirais|dirais|dirait|dirions|diriez|diraient',
    passe_compose: 'ai dit|as dit|a dit|avons dit|avez dit|ont dit',
    plus_que_parfait: 'avais dit|avais dit|avait dit|avions dit|aviez dit|avaient dit',
    imperatif: 'dis|disons|dites',
  },
  venir: {
    present: 'viens|viens|vient|venons|venez|viennent',
    imparfait: 'venais|venais|venait|venions|veniez|venaient',
    futur: 'viendrai|viendras|viendra|viendrons|viendrez|viendront',
    passe_simple: 'vins|vins|vint|vînmes|vîntes|vinrent',
    conditionnel: 'viendrais|viendrais|viendrait|viendrions|viendriez|viendraient',
    imperatif: 'viens|venons|venez',
  },
  revenir: {
    present: 'reviens|reviens|revient|revenons|revenez|reviennent',
    futur: 'reviendrai|reviendras|reviendra|reviendrons|reviendrez|reviendront',
    passe_simple: 'revins|revins|revint|revînmes|revîntes|revinrent',
  },
  pouvoir: {
    present: 'peux|peux|peut|pouvons|pouvez|peuvent',
    imparfait: 'pouvais|pouvais|pouvait|pouvions|pouviez|pouvaient',
    futur: 'pourrai|pourras|pourra|pourrons|pourrez|pourront',
    passe_simple: 'pus|pus|put|pûmes|pûtes|purent',
    conditionnel: 'pourrais|pourrais|pourrait|pourrions|pourriez|pourraient',
    passe_compose: 'ai pu|as pu|a pu|avons pu|avez pu|ont pu',
    plus_que_parfait: 'avais pu|avais pu|avait pu|avions pu|aviez pu|avaient pu',
  },
  voir: {
    present: 'vois|vois|voit|voyons|voyez|voient',
    imparfait: 'voyais|voyais|voyait|voyions|voyiez|voyaient',
    futur: 'verrai|verras|verra|verrons|verrez|verront',
    passe_simple: 'vis|vis|vit|vîmes|vîtes|virent',
    conditionnel: 'verrais|verrais|verrait|verrions|verriez|verraient',
    passe_compose: 'ai vu|as vu|a vu|avons vu|avez vu|ont vu',
    plus_que_parfait: 'avais vu|avais vu|avait vu|avions vu|aviez vu|avaient vu',
    imperatif: 'vois|voyons|voyez',
  },
  vouloir: {
    present: 'veux|veux|veut|voulons|voulez|veulent',
    imparfait: 'voulais|voulais|voulait|voulions|vouliez|voulaient',
    futur: 'voudrai|voudras|voudra|voudrons|voudrez|voudront',
    passe_simple: 'voulus|voulus|voulut|voulûmes|voulûtes|voulurent',
    conditionnel: 'voudrais|voudrais|voudrait|voudrions|voudriez|voudraient',
    passe_compose: 'ai voulu|as voulu|a voulu|avons voulu|avez voulu|ont voulu',
    plus_que_parfait: 'avais voulu|avais voulu|avait voulu|avions voulu|aviez voulu|avaient voulu',
  },
  prendre: {
    present: 'prends|prends|prend|prenons|prenez|prennent',
    imparfait: 'prenais|prenais|prenait|prenions|preniez|prenaient',
    futur: 'prendrai|prendras|prendra|prendrons|prendrez|prendront',
    passe_simple: 'pris|pris|prit|prîmes|prîtes|prirent',
    conditionnel: 'prendrais|prendrais|prendrait|prendrions|prendriez|prendraient',
    passe_compose: 'ai pris|as pris|a pris|avons pris|avez pris|ont pris',
    plus_que_parfait: 'avais pris|avais pris|avait pris|avions pris|aviez pris|avaient pris',
    imperatif: 'prends|prenons|prenez',
  },
  apprendre: {
    present: 'apprends|apprends|apprend|apprenons|apprenez|apprennent',
    passe_simple: 'appris|appris|apprit|apprîmes|apprîtes|apprirent',
    passe_compose: 'ai appris|as appris|a appris|avons appris|avez appris|ont appris',
  },
  comprendre: {
    imparfait: 'comprenais|comprenais|comprenait|comprenions|compreniez|comprenaient',
    futur: 'comprendrai|comprendras|comprendra|comprendrons|comprendrez|comprendront',
  },
  partir: {
    present: 'pars|pars|part|partons|partez|partent',
    imparfait: 'partais|partais|partait|partions|partiez|partaient',
    futur: 'partirai|partiras|partira|partirons|partirez|partiront',
    passe_simple: 'partis|partis|partit|partîmes|partîtes|partirent',
  },
  sortir: { present: 'sors|sors|sort|sortons|sortez|sortent' },
  dormir: {
    present: 'dors|dors|dort|dormons|dormez|dorment',
    passe_compose: 'ai dormi|as dormi|a dormi|avons dormi|avez dormi|ont dormi',
  },
  mettre: {
    present: 'mets|mets|met|mettons|mettez|mettent',
    futur: 'mettrai|mettras|mettra|mettrons|mettrez|mettront',
    passe_simple: 'mis|mis|mit|mîmes|mîtes|mirent',
  },
  écrire: {
    present: 'écris|écris|écrit|écrivons|écrivez|écrivent',
    imparfait: 'écrivais|écrivais|écrivait|écrivions|écriviez|écrivaient',
    passe_simple: 'écrivis|écrivis|écrivit|écrivîmes|écrivîtes|écrivirent',
  },
  lire: {
    present: 'lis|lis|lit|lisons|lisez|lisent',
    passe_simple: 'lus|lus|lut|lûmes|lûtes|lurent',
    futur: 'lirai|liras|lira|lirons|lirez|liront',
  },
};

/** Temps composés avec l'auxiliaire être : sujet masculin (puis féminin). */
const REF_ETRE: Record<string, { masc: string; fem: string; pqpMasc: string }> = {
  aller: {
    masc: 'suis allé|es allé|est allé|sommes allés|êtes allés|sont allés',
    fem: 'suis allée|es allée|est allée|sommes allées|êtes allées|sont allées',
    pqpMasc: 'étais allé|étais allé|était allé|étions allés|étiez allés|étaient allés',
  },
  venir: {
    masc: 'suis venu|es venu|est venu|sommes venus|êtes venus|sont venus',
    fem: 'suis venue|es venue|est venue|sommes venues|êtes venues|sont venues',
    pqpMasc: 'étais venu|étais venu|était venu|étions venus|étiez venus|étaient venus',
  },
  arriver: {
    masc: 'suis arrivé|es arrivé|est arrivé|sommes arrivés|êtes arrivés|sont arrivés',
    fem: 'suis arrivée|es arrivée|est arrivée|sommes arrivées|êtes arrivées|sont arrivées',
    pqpMasc: 'étais arrivé|étais arrivé|était arrivé|étions arrivés|étiez arrivés|étaient arrivés',
  },
  tomber: {
    masc: 'suis tombé|es tombé|est tombé|sommes tombés|êtes tombés|sont tombés',
    fem: 'suis tombée|es tombée|est tombée|sommes tombées|êtes tombées|sont tombées',
    pqpMasc: 'étais tombé|étais tombé|était tombé|étions tombés|étiez tombés|étaient tombés',
  },
  partir: {
    masc: 'suis parti|es parti|est parti|sommes partis|êtes partis|sont partis',
    fem: 'suis partie|es partie|est partie|sommes parties|êtes parties|sont parties',
    pqpMasc: 'étais parti|étais parti|était parti|étions partis|étiez partis|étaient partis',
  },
  devenir: {
    masc: 'suis devenu|es devenu|est devenu|sommes devenus|êtes devenus|sont devenus',
    fem: 'suis devenue|es devenue|est devenue|sommes devenues|êtes devenues|sont devenues',
    pqpMasc: 'étais devenu|étais devenu|était devenu|étions devenus|étiez devenus|étaient devenus',
  },
};

const IMPERATIF: Personne[] = [1, 3, 4];

describe('moteur de conjugaison — tableaux de référence', () => {
  for (const [verbe, table] of Object.entries(REF)) {
    for (const [temps, ligne] of Object.entries(table)) {
      it(`${verbe} · ${temps}`, () => {
        const attendu = ligne.split('|');
        const personnes = temps === 'imperatif' ? IMPERATIF : PERSONNES;
        expect(attendu.length).toBe(personnes.length);
        personnes.forEach((p, i) => {
          // genre masculin pour les temps composés avec être
          expect(conjuguer(verbe, temps as Temps, p, { fem: false }), `${verbe} ${temps} ${p}`).toBe(attendu[i]);
        });
      });
    }
  }

  for (const [verbe, r] of Object.entries(REF_ETRE)) {
    it(`${verbe} · temps composés avec être (accords)`, () => {
      const m = r.masc.split('|');
      const f = r.fem.split('|');
      const q = r.pqpMasc.split('|');
      for (const p of PERSONNES) {
        expect(conjuguer(verbe, 'passe_compose', p, { fem: false })).toBe(m[p]);
        expect(conjuguer(verbe, 'passe_compose', p, { fem: true })).toBe(f[p]);
        expect(conjuguer(verbe, 'plus_que_parfait', p, { fem: false })).toBe(q[p]);
        // genre inconnu : les deux accords sont admis, le masculin d'abord
        expect(formes(verbe, 'passe_compose', p)).toEqual([m[p], f[p]]);
      }
      expect(auxiliaire(verbe)).toBe('être');
    });
  }
});

describe('moteur de conjugaison — cas particuliers', () => {
  it('variantes admises', () => {
    expect(formes('payer', 'present', 0)).toEqual(['paie', 'paye']);
    expect(formes('payer', 'futur', 3)).toEqual(['paierons', 'payerons']);
    expect(formes('préférer', 'futur', 0)).toEqual(['préférerai', 'préfèrerai']);
    expect(formes('épeler', 'present', 0)).toEqual(['épelle', 'épèle']);
    expect(formes('pouvoir', 'present', 0)).toEqual(['peux', 'puis']);
    expect(formes('chanter', 'present', 0)).toEqual(['chante']);
  });

  it('impératif : pas de forme pour je/il/ils ni pour pouvoir', () => {
    expect(formes('chanter', 'imperatif', 0)).toEqual([]);
    expect(formes('pouvoir', 'imperatif', 1)).toEqual([]);
    expect(conjuguer('aller', 'imperatif', 1)).toBe('va');
  });

  it('négation des temps composés', () => {
    expect(conjuguer('chanter', 'passe_compose', 0, { negation: true })).toBe('n’ai pas chanté');
    expect(conjuguer('aller', 'passe_compose', 3, { negation: true, fem: true })).toBe('ne sommes pas allées');
    expect(conjuguer('finir', 'plus_que_parfait', 5, { negation: true })).toBe('n’avaient pas fini');
  });

  it('participes passés', () => {
    const pp: Record<string, string> = {
      être: 'été',
      avoir: 'eu',
      chanter: 'chanté',
      finir: 'fini',
      aller: 'allé',
      faire: 'fait',
      dire: 'dit',
      venir: 'venu',
      pouvoir: 'pu',
      voir: 'vu',
      vouloir: 'voulu',
      prendre: 'pris',
      comprendre: 'compris',
      mettre: 'mis',
      écrire: 'écrit',
      lire: 'lu',
      partir: 'parti',
      dormir: 'dormi',
    };
    for (const [v, p] of Object.entries(pp)) expect(participePasse(v), v).toBe(p);
    expect(participePasse('prendre', { fem: true, plur: true })).toBe('prises');
    expect(participePasse('prendre', { plur: true })).toBe('pris');
    expect(participePasse('faire', { fem: true })).toBe('faite');
    expect(participePasse('être', { fem: true, plur: true })).toBe('été');
  });

  it('groupes et auxiliaires', () => {
    expect(groupe('chanter')).toBe(1);
    expect(groupe('finir')).toBe(2);
    expect(groupe('aller')).toBe(3);
    expect(groupe('prendre')).toBe(3);
    expect(groupe('être')).toBe(0);
    expect(auxiliaire('chanter')).toBe('avoir');
    expect(auxiliaire('rester')).toBe('être');
    expect(auxiliaire('comprendre')).toBe('avoir');
  });

  it('élision du pronom je', () => {
    expect(avecPronom(0, 'aime')).toBe('j’aime');
    expect(avecPronom(0, 'habite')).toBe('j’habite');
    expect(avecPronom(0, 'chante')).toBe('je chante');
    expect(avecPronom(0, 'n’ai pas chanté')).toBe('je n’ai pas chanté');
  });

  it('marques du temps et de la personne', () => {
    expect(decomposer('chanter', 'imparfait', 3)).toEqual({ radical: 'chant', temps: 'i', personne: 'ons' });
    expect(decomposer('chanter', 'imparfait', 2)).toEqual({ radical: 'chant', temps: 'ai', personne: 't' });
    expect(decomposer('finir', 'futur', 5)).toEqual({ radical: 'fini', temps: 'r', personne: 'ont' });
    expect(decomposer('aller', 'futur', 0)).toEqual({ radical: 'i', temps: 'r', personne: 'ai' });
    expect(decomposer('chanter', 'conditionnel', 4)).toEqual({ radical: 'chante', temps: 'ri', personne: 'ez' });
    expect(decomposer('chanter', 'present', 5)).toEqual({ radical: 'chant', temps: '', personne: 'ent' });
    expect(decomposer('appeler', 'present', 5)).toEqual({ radical: 'appell', temps: '', personne: 'ent' });
    expect(decomposer('faire', 'present', 0)).toBeNull();
  });
});
