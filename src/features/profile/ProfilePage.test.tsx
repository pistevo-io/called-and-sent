import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';

function renderProfile(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/${slug}`]}>
      <ProfilePage slug={slug} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  // jsdom has no layout; force the collapse hook's desktop path so the hero
  // state stays deterministic regardless of scroll/resize listeners.
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1280 });
  window.scrollY = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProfilePage — known missionary slug', () => {
  it('renders the identity header with name, location, and stats', () => {
    renderProfile('kelsey');
    // The name renders in both the mobile hero (h1) and the desktop rail (h2);
    // CSS hides exactly one per breakpoint, but jsdom applies no CSS, so both
    // are present in the DOM. Assert the first heading carries the name.
    expect(screen.getAllByRole('heading', { name: 'Kelsey' }).length).toBeGreaterThan(0);
    // Handle, bio, and stats render in BOTH the mobile hero and the desktop
    // rail (CSS hides one per breakpoint; jsdom applies no CSS, so both exist).
    expect(screen.getAllByText(/@kelsey · Honduras/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Medical missionary sharing the Gospel through hands-on care/).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Partners').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Missions').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Updates').length).toBeGreaterThan(0);
  });

  it('renders the three tabs and switches content panels', () => {
    renderProfile('kelsey');
    const missionsTab = screen.getByRole('tab', { name: 'Missions' });
    const updatesTab = screen.getByRole('tab', { name: 'Updates' });
    const aboutTab = screen.getByRole('tab', { name: 'About' });
    expect(missionsTab.getAttribute('aria-selected')).toBe('true');

    // Missions panel: seed trips render (4 trips in missionTrips).
    expect(screen.getByText('Guaimaca Medical Mission & Follow-Up')).toBeTruthy();

    fireEvent.click(updatesTab);
    expect(updatesTab.getAttribute('aria-selected')).toBe('true');
    // Updates panel: seed profile has 2 updates.
    expect(screen.getByText('Back in Guatemala — ready for round two')).toBeTruthy();

    fireEvent.click(aboutTab);
    expect(aboutTab.getAttribute('aria-selected')).toBe('true');
    // About panel shows the calling statement + field rows.
    expect(screen.getByText('Calling & mission')).toBeTruthy();
    expect(screen.getByText('Field')).toBeTruthy();
    expect(screen.getByText('Medical · Evangelism · Discipleship')).toBeTruthy();
  });

  it('opens and closes the partner modal', () => {
    renderProfile('kelsey');
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: /Partner With Me/i })[0]!);
    const dialog = screen.getByRole('dialog', { name: 'Partner with Kelsey' });
    expect(dialog).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes the partner modal on Escape', () => {
    renderProfile('kelsey');
    fireEvent.click(screen.getAllByRole('button', { name: /Partner With Me/i })[0]!);
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the mobile bottom nav with Profile marked current', () => {
    renderProfile('kelsey');
    const profileLink = screen.getByRole('link', { name: 'Profile' });
    expect(profileLink.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Trips' })).toBeTruthy();
  });
});

describe('ProfilePage — unknown slug', () => {
  it('renders the ContentState error instead of a crash', () => {
    renderProfile('nobody');
    expect(screen.getByText('Profile not found.')).toBeTruthy();
  });
});
