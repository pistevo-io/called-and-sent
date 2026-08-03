import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileEditor from './ProfileEditor';
import { EMPTY_PROFILE, type Profile } from './types';

const base: Profile = { ...EMPTY_PROFILE, username: 'jane-doe', displayName: 'Jane Doe' };

beforeEach(() => cleanup());

describe('ProfileEditor', () => {
  it('renders the current profile values', () => {
    render(<ProfileEditor profile={base} onSave={vi.fn()} />);
    expect(screen.getByLabelText(/display name/i)).toHaveValue('Jane Doe');
    expect(screen.getByLabelText(/username/i)).toHaveValue('jane-doe');
  });

  it('saves a valid profile and shows the saved state', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<ProfileEditor profile={base} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: /save profile/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].username).toBe('jane-doe');
    expect(screen.getAllByRole('button', { name: /saved/i })).toHaveLength(2);
  });

  it('normalizes the username to lowercase and spaces to hyphens', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<ProfileEditor profile={EMPTY_PROFILE} onSave={onSave} />);
    const username = screen.getByLabelText(/username/i);
    await user.type(username, 'Jane Doe');
    expect(username).toHaveValue('jane-doe');
  });

  it('blocks saving and shows an error for an invalid username', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<ProfileEditor profile={EMPTY_PROFILE} onSave={onSave} />);
    await user.type(screen.getByLabelText(/username/i), 'jane_doe');
    await user.click(screen.getByRole('button', { name: /save profile/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/lowercase letters, numbers, and hyphens/i);
  });

  it('blocks saving when the username is empty', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(
      <ProfileEditor profile={{ ...EMPTY_PROFILE, displayName: 'Jane' }} onSave={onSave} />,
    );
    await user.click(screen.getByRole('button', { name: /save profile/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/username is required/i);
  });

  it('keeps user-entered text as a string value (no HTML parsing in the input)', async () => {
    const user = userEvent.setup();
    render(<ProfileEditor profile={EMPTY_PROFILE} onSave={vi.fn()} />);
    const payload = '<img src=x onerror="alert(1)">';
    await user.type(screen.getByLabelText(/tagline/i), payload);
    expect((screen.getByLabelText(/tagline/i) as HTMLInputElement).value).toBe(payload);
    expect(document.querySelector('img[onerror]')).toBeNull();
  });
});
