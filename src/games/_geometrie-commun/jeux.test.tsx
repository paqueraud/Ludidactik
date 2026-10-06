/**
 * Les 8 jeux s'affichent avec chacun des items d'exemple RÉELS qu'ils acceptent (et ignorent proprement
 * les autres), sans erreur, à chaque niveau.
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import type { FC } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ItemStream } from '@/content/provider';
import type { Item, ItemKind, Lesson, Level } from '@/content/schemas';
import type { GameModule, GameProps } from '@/engine/GameModule';
import Geometre from '../geometre/Geometre';
import geometre from '../geometre/index';
import Mesureur from '../mesureur/Mesureur';
import mesureur from '../mesureur/index';
import MiroirMagique from '../miroir-magique/MiroirMagique';
import miroir from '../miroir-magique/index';
import RobotCodeur from '../robot-codeur/RobotCodeur';
import robot from '../robot-codeur/index';
import RoueProbabilites from '../roue-probabilites/RoueProbabilites';
import roue from '../roue-probabilites/index';
import StationMeteo from '../station-meteo/StationMeteo';
import station from '../station-meteo/index';
import Tangram from '../tangram/Tangram';
import tangram from '../tangram/index';
import UsinePatrons from '../usine-patrons/UsinePatrons';
import usine from '../usine-patrons/index';
import { EXEMPLES } from './fixtures';

const JEUX: [GameModule, FC<GameProps>][] = [
  [geometre, Geometre],
  [miroir, MiroirMagique],
  [tangram, Tangram],
  [usine, UsinePatrons],
  [robot, RobotCodeur],
  [station, StationMeteo],
  [roue, RoueProbabilites],
  [mesureur, Mesureur],
];

const flux = (it: Item): ItemStream => ({ size: 1, next: () => it });
const props = (stream: ItemStream, level: Level, kind: ItemKind): GameProps => ({
  lesson: { id: 'TEST' } as Lesson,
  level,
  profile: {} as GameProps['profile'],
  stream,
  kind,
  record: null,
  lectureAuto: false,
  target: () => 0.5,
  paused: false,
  onAnswer: vi.fn(),
  onEnd: vi.fn(),
  speech: { speak: vi.fn(async () => {}) } as unknown as GameProps['speech'],
  sfx: { play: vi.fn() } as unknown as GameProps['sfx'],
});

afterEach(cleanup);

describe('Jeux 21 à 28 avec les items réels', () => {
  for (const [jeu, Composant] of JEUX) {
    const items = jeu.accepts.flatMap((k) => (EXEMPLES[k] ?? []).filter((x) => jeu.filterItem!(x)));
    it(`${jeu.titre} : au moins un exemple réel`, () => expect(items.length).toBeGreaterThan(0));
    for (const item of items)
      for (const level of ['facile', 'plus_loin'] as Level[])
        it(`${jeu.id} ${level} : ${item.id.slice(0, 70)}`, async () => {
          await act(async () => {
            render(<Composant {...props(flux(item), level, item.kind)} />);
          });
          expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
          expect(screen.queryByText(/n’a pas d/)).toBeNull();
        });

    it(`${jeu.id} : un item étranger affiche un état propre`, async () => {
      const etranger =
        (EXEMPLES.mcq ?? []).find((x) => !jeu.filterItem!(x)) ??
        (EXEMPLES.numeric_answer ?? []).find((x) => !jeu.filterItem!(x))!;
      await act(async () => {
        render(<Composant {...props(flux(etranger), 'normal', etranger.kind)} />);
      });
      expect(screen.getByText(/n’a pas d/)).toBeTruthy();
    });
  }
});
