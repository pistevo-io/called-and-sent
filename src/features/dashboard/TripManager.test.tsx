import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TripManager from './TripManager';
import { emptyTrip } from './types';
import type { MissionTrip } from '../../shared/types/MissionTrip';

const make = (over: Partial<MissionTrip> = {}): MissionTrip => ({
  ...emptyTrip(),
  id: 't1',
  title: 'Guaimaca Medical',
  location: 'Guaimaca',
  country: 'Honduras',
  date: '2026-01-01',
  ...over,
});

beforeEach(() => cleanup());

describe('TripManager', () => {
  it('shows the empty state when there are no trips', () => {
    render(<TripManager trips={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/no trips yet/i)).toBeInTheDocument();
  });

  it('lists trips newest-first', () => {
    const trips = [
      make({ id: 'old', date: '2025-01-01', title: 'Older Trip' }),
      make({ id: 'new', date: '2026-06-01', title: 'Newer Trip' }),
    ];
    render(<TripManager trips={trips} onChange={vi.fn()} />);
    const titles = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual(['Newer Trip', 'Older Trip']);
  });

  it('confirms and deletes a trip through the confirm dialog', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TripManager trips={[make({ title: 'Doomed Trip' })]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /delete doomed trip/i }));
    expect(
      screen.getByRole('alertdialog', { name: /confirm delete trip/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    const next = onChange.mock.calls[0][0] as MissionTrip[];
    expect(next).toHaveLength(0);
  });

  it('opens the editor modal for a new trip', async () => {
    const user = userEvent.setup();
    render(<TripManager trips={[]} onChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /new trip/i }));
    expect(screen.getByRole('dialog', { name: 'New Trip' })).toBeInTheDocument();
  });
});
