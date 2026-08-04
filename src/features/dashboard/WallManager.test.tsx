import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WallManager from './WallManager';
import type { WallPost } from './types';

const makePost = (over: Partial<WallPost> = {}): WallPost => ({
  id: 'p1',
  type: 'testimony',
  title: 'God provided',
  body: 'Details',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

beforeEach(() => cleanup());

describe('WallManager', () => {
  it('shows the empty state when there are no posts', () => {
    render(<WallManager posts={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/no wall posts yet/i)).toBeInTheDocument();
  });

  it('lists posts newest-first with the correct type label', () => {
    const posts = [
      makePost({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z', title: 'Older' }),
      makePost({ id: 'new', createdAt: '2026-03-01T00:00:00.000Z', title: 'Newer' }),
    ];
    render(<WallManager posts={posts} onChange={vi.fn()} />);
    const titles = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual(['Newer', 'Older']);
    // The type badge label lives inside each post list item (not the editor dropdown).
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Testimony')).toBeInTheDocument();
  });

  it('creates a new post via the editor modal', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<WallManager posts={[]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /new post/i }));
    await user.type(screen.getByLabelText(/title/i), 'Answered prayer');
    await user.type(screen.getByLabelText(/body/i), 'He showed up');
    await user.click(screen.getByRole('button', { name: /create post/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as WallPost[];
    expect(next).toHaveLength(1);
    expect(next[0].title).toBe('Answered prayer');
    expect(next[0].body).toBe('He showed up');
  });

  it('edits an existing post and replaces it in place', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<WallManager posts={[makePost({ title: 'Original' })]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /edit post/i }));
    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated');
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    const next = onChange.mock.calls[0][0] as WallPost[];
    expect(next).toHaveLength(1);
    expect(next[0].title).toBe('Updated');
  });

  it('confirms and deletes a post', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<WallManager posts={[makePost({ title: 'Doomed' })]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /delete post/i }));
    expect(
      screen.getByRole('alertdialog', { name: /confirm delete post/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    const next = onChange.mock.calls[0][0] as WallPost[];
    expect(next).toHaveLength(0);
  });

  it('renders user-controlled titles as escaped text (XSS regression)', () => {
    const xss = '<img src=x onerror="alert(1)">';
    render(<WallManager posts={[makePost({ title: xss })]} onChange={vi.fn()} />);
    // The raw payload appears as a text node, not as a parsed element.
    expect(screen.getByText(xss)).toBeInTheDocument();
    expect(document.querySelector('img[onerror]')).toBeNull();
  });
});
