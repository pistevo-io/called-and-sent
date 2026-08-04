import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TripEditorModal from './TripEditorModal';
import { emptyTrip } from './types';
import type { MissionTrip } from '../../shared/types/MissionTrip';

beforeEach(() => cleanup());

describe('TripEditorModal', () => {
  it('renders in create mode with empty defaults', () => {
    render(<TripEditorModal open trip={null} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'New Trip' })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
  });

  it('renders in edit mode pre-filled from the trip', () => {
    const trip: MissionTrip = {
      ...emptyTrip(),
      id: 't1',
      title: 'Honduras Outreach',
      location: 'Guaimaca',
      country: 'Honduras',
    };
    render(<TripEditorModal open trip={trip} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByLabelText(/title/i)).toHaveValue('Honduras Outreach');
    expect(screen.getByLabelText(/location/i)).toHaveValue('Guaimaca');
  });

  it('blocks saving and shows an error when the title is empty', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<TripEditorModal open trip={null} onClose={vi.fn()} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: /create trip/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
  });

  it('shows an error for an out-of-range longitude and blocks saving', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<TripEditorModal open trip={null} onClose={vi.fn()} onSave={onSave} />);
    await user.type(screen.getByLabelText(/title/i), 'My Trip');
    await user.type(screen.getByLabelText(/longitude/i), '250');
    await user.click(screen.getByRole('button', { name: /create trip/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/longitude must be -180 to 180/i)).toBeInTheDocument();
  });

  it('accepts boundary coordinates (180 / 90) and saves', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<TripEditorModal open trip={null} onClose={vi.fn()} onSave={onSave} />);
    await user.type(screen.getByLabelText(/title/i), 'Edge Trip');
    await user.type(screen.getByLabelText(/longitude/i), '180');
    await user.type(screen.getByLabelText(/latitude/i), '90');
    await user.click(screen.getByRole('button', { name: /create trip/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0] as MissionTrip;
    expect(saved.coordinates.lng).toBe(180);
    expect(saved.coordinates.lat).toBe(90);
    expect(saved.title).toBe('Edge Trip');
  });

  it('adds an image URL via the input + Add button', async () => {
    const user = userEvent.setup();
    render(<TripEditorModal open trip={null} onClose={vi.fn()} onSave={vi.fn()} />);
    await user.type(screen.getByLabelText(/add image url/i), 'https://example.com/pic.jpg');
    await user.click(screen.getAllByRole('button', { name: /^add$/i })[0]);
    expect(screen.getByText('https://example.com/pic.jpg')).toBeInTheDocument();
  });

  it('saves a trip with a trimmed title and empty arrays filtered out', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<TripEditorModal open trip={null} onClose={vi.fn()} onSave={onSave} />);
    await user.type(screen.getByLabelText(/title/i), '  Trim Me  ');
    await user.click(screen.getByRole('button', { name: /create trip/i }));
    const saved = onSave.mock.calls[0][0] as MissionTrip;
    expect(saved.title).toBe('Trim Me');
    expect(saved.images).toEqual([]);
    expect(saved.highlights).toEqual([]);
  });
});
