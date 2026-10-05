/**
 * Tests de composants des jeux qui n'ont pas d'exemple dans le Labo partagé (meta.texte, meta.phrase) :
 * on joue une manche avec les exemples de `fixtures.ts`.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Item, Lesson } from '@/content/schemas';
import type { GameModule, GameProps } from '@/engine/GameModule';
import detective from '../detective-texte';
import feu from '../feu-ponctuation';
import labo from '../labo-fonctions';
import { LANGUE_FIXTURES, fluxDe } from './fixtures';

const lecon = { id: 'CM2.TEST', classe: 'CM2', matiere: 'francais' } as unknown as Lesson;

function props(items: Item[], extra: Partial<GameProps> = {}): GameProps {
  return {
    lesson: lecon,
    level: 'normal',
    profile: { id: 'test' } as GameProps['profile'],
    stream: fluxDe(items),
    kind: items[0]!.kind,
    record: null,
    lectureAuto: false,
    target: () => 0.5,
    paused: false,
    onAnswer: vi.fn(),
    onEnd: vi.fn(),
    speech: {
      speak: vi.fn(() => Promise.resolve()),
      stop: vi.fn(),
      listen: vi.fn(() => Promise.resolve(null)),
      ttsAvailable: false,
      sttAvailable: false,
    } as unknown as GameProps['speech'],
    sfx: { play: vi.fn() } as unknown as GameProps['sfx'],
    ...extra,
  };
}

async function monter(Comp: GameModule['component'], p: GameProps) {
  render(
    <Suspense fallback="…">
      <Comp {...p} />
    </Suspense>,
  );
}

describe('jeux de langue (composants)', () => {
  it('Détective : une bonne réponse demande la preuve, la preuve est récompensée', async () => {
    const items = (LANGUE_FIXTURES.mcq ?? []).filter((i) => i.id.startsWith('det'));
    const p = props(items);
    await monter(detective.component, p);
    const q = await screen.findByText(/Question 1 \//, {}, { timeout: 8000 });
    expect(q).toBeInTheDocument();
    // la question affichée et sa bonne réponse (1er choix des exemples)
    const item = items.find((i) => screen.queryByText(i.kind === 'mcq' ? i.question : '')) as Extract<
      Item,
      { kind: 'mcq' }
    >;
    fireEvent.click(screen.getByRole('button', { name: new RegExp(item.choices[item.answerIndex]!) }));
    expect(p.onAnswer).toHaveBeenCalledWith(expect.objectContaining({ correct: true }));
    expect(screen.getByText(/Un vrai détective le prouve/)).toBeInTheDocument();
    const preuve = String(item.meta!.preuve).slice(0, 12);
    const phrase = screen
      .getAllByRole('button', { name: /^Phrase \d/ })
      .find((b) => b.textContent!.includes(preuve))!;
    fireEvent.click(phrase);
    expect(screen.getByText(/Preuve trouvée/)).toBeInTheDocument();
  });

  it('Détective : un QCM sans texte est ignoré (état propre)', async () => {
    const sansTexte = (LANGUE_FIXTURES.mcq ?? []).filter((i) => i.id.startsWith('feu'));
    await monter(detective.component, props(sansTexte));
    expect(await screen.findByText(/Pas d’exercice adapté/)).toBeInTheDocument();
    expect(detective.filterItem!(sansTexte[0]!)).toBe(false);
  });

  it('Labo des fonctions : encadrer le sujet, puis le verser dans la bonne fiole', async () => {
    const items = (LANGUE_FIXTURES.classification ?? []).filter((i) => i.id === 'fn2');
    const p = props(items, { kind: 'classification' });
    await monter(labo.component, p);
    await screen.findByText(/1 \/ 3/);
    fireEvent.click(screen.getByRole('button', { name: /C’est… qui/ }));
    expect(screen.getByText(/C’est Malo qui parle à sa grand-mère dans le jardin\./)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Fiole 1 : sujet/ }));
    expect(p.onAnswer).toHaveBeenCalledWith(expect.objectContaining({ correct: true }));
    expect(screen.getByText(/Bonne fiole/)).toBeInTheDocument();
  });

  it('Feu tricolore : la bonne ponctuation fait passer la voiture', async () => {
    const items = (LANGUE_FIXTURES.mcq ?? []).filter((i) => i.id === 'feu2');
    const p = props(items);
    await monter(feu.component, p);
    fireEvent.click(await screen.findByRole('button', { name: /Point d’exclamation/ }));
    expect(p.onAnswer).toHaveBeenCalledWith(expect.objectContaining({ correct: true }));
    expect(screen.getByText(/Feu vert/)).toBeInTheDocument();
  });
});
