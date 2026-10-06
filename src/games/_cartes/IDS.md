# Cartes cliquables — identifiants stables

Ces identifiants sont utilisés par les items `map_point` : `map` = id de la carte, `target` = id d'une
zone **ou d'un groupe**. Ils ne changeront pas. Les tracés sont dans `src/games/_cartes/` (données en
longitude/latitude, projetées à l'affichage) ; `cartes.test.ts` vérifie la géographie (chefs-lieux dans la
bonne région, capitales dans le bon pays, points des continents et des océans).

Tolérances de `resoudreCible` : majuscules et accents ignorés, article initial ignoré (« la Seine »),
espaces → tirets, et `atlantique` = `ocean-atlantique`. Utiliser de préférence l'id exact.

`targetLabel` porte **toujours l'article** quand le nom en a un (« la Bretagne », « les Alpes »,
« l'océan Pacifique », mais « Mayotte ») : le jeu affiche « Bravo, c'est bien la Bretagne ! ».

Exemple :

```json
{
  "kind": "map_point",
  "map": "france-regions",
  "target": "bretagne",
  "targetLabel": "la Bretagne",
  "prompt": "Touche la Bretagne.",
  "explication": "La Bretagne est la région tout à l'ouest, entourée par la mer."
}
```

## `france-regions` — les 18 régions (découpage de 2016)

| id                           | nom                        |
| ---------------------------- | -------------------------- |
| `hauts-de-france`            | Hauts-de-France            |
| `normandie`                  | Normandie                  |
| `ile-de-france`              | Île-de-France              |
| `grand-est`                  | Grand Est                  |
| `bretagne`                   | Bretagne                   |
| `pays-de-la-loire`           | Pays de la Loire           |
| `centre-val-de-loire`        | Centre-Val de Loire        |
| `bourgogne-franche-comte`    | Bourgogne-Franche-Comté    |
| `nouvelle-aquitaine`         | Nouvelle-Aquitaine         |
| `auvergne-rhone-alpes`       | Auvergne-Rhône-Alpes       |
| `occitanie`                  | Occitanie                  |
| `provence-alpes-cote-d-azur` | Provence-Alpes-Côte d'Azur |
| `corse`                      | Corse                      |
| `guadeloupe`                 | Guadeloupe (encart)        |
| `martinique`                 | Martinique (encart)        |
| `guyane`                     | Guyane (encart)            |
| `la-reunion`                 | La Réunion (encart)        |
| `mayotte`                    | Mayotte (encart)           |

Les encarts d'outre-mer ne sont pas à la même échelle que la métropole (c'est écrit sur la carte).

Groupe : `outre-mer` (les 5 régions d'outre-mer : toucher l'une d'elles est accepté).

## `france-fleuves` — les fleuves

| id                    | nom                                                   |
| --------------------- | ----------------------------------------------------- |
| `seine`               | Seine                                                 |
| `loire`               | Loire                                                 |
| `garonne`             | Garonne                                               |
| `rhone`               | Rhône (le lac Léman est dessiné en décor)             |
| `rhin`                | Rhin                                                  |
| `maroni`              | Maroni (encart Guyane — programme 2026)               |
| `lac-leman`           | Lac Léman (lac naturel — programme 2026)              |
| `lac-de-serre-poncon` | Lac de Serre-Ponçon (lac artificiel — programme 2026) |

## `france-massifs` — les massifs montagneux

| id               | nom                                           |
| ---------------- | --------------------------------------------- |
| `alpes`          | Alpes                                         |
| `pyrenees`       | Pyrénées (de part et d'autre de la frontière) |
| `massif-central` | Massif central                                |
| `jura`           | Jura                                          |
| `vosges`         | Vosges                                        |
| `massif-corse`   | Massif corse                                  |

## `europe` — les pays

Pays de l'Union européenne (27) — groupe `union-europeenne` :

`allemagne`, `autriche`, `belgique`, `bulgarie`, `chypre`, `croatie`, `danemark`, `espagne`, `estonie`,
`finlande`, `france`, `grece`, `hongrie`, `irlande`, `italie`, `lettonie`, `lituanie`, `luxembourg`,
`malte`, `pays-bas`, `pologne`, `portugal`, `republique-tcheque`, `roumanie`, `slovaquie`, `slovenie`,
`suede`.

Voisins hors Union européenne, cliquables (pour « l'Europe n'est pas l'Union européenne ») :
`royaume-uni`, `norvege`, `suisse`.

Les autres terres (Balkans hors UE, Ukraine, Biélorussie, Russie, Turquie, Afrique du Nord) sont du décor
non cliquable. Les très petits pays (Luxembourg, Malte, Chypre, Slovénie) ont un cercle de touche.

## `monde` — continents et océans

| id                 | nom                                                                       |
| ------------------ | ------------------------------------------------------------------------- |
| `afrique`          | Afrique                                                                   |
| `amerique-du-nord` | Amérique du Nord (avec l'Amérique centrale, les Caraïbes et le Groenland) |
| `amerique-du-sud`  | Amérique du Sud                                                           |
| `asie`             | Asie                                                                      |
| `europe`           | Europe                                                                    |
| `oceanie`          | Océanie                                                                   |
| `antarctique`      | Antarctique                                                               |
| `ocean-atlantique` | Océan Atlantique                                                          |
| `ocean-pacifique`  | Océan Pacifique                                                           |
| `ocean-indien`     | Océan Indien                                                              |
| `ocean-arctique`   | Océan Arctique                                                            |
| `ocean-austral`    | Océan Austral                                                             |

Groupe : `amerique` (Amérique du Nord + Amérique du Sud) → pour les « 6 continents » de l'école :
`afrique`, `amerique`, `antarctique`, `asie`, `europe`, `oceanie`.
Les mers fermées (Méditerranée, mer Noire, Caspienne) ne sont rattachées à aucun océan.
