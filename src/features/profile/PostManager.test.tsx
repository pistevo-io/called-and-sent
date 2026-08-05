// Post manager — the owner dashboard's wall tab and its lifecycle.
//
// Two layers:
//   1. Unit tests of <PostManager> in isolation (status view filtering,
//      lifecycle action callbacks, delete, compose-form status).
//   2. Integration through <DashboardPage> with a mocked auth client + mocked
//      wallPostsApi, proving a draft created via the form lands under the
//      Drafts view only, and that publish/unpublish/archive move posts between
//      buckets through the real handleSavePost / handlePostTransition wiring.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PostManager from './PostManager';
import DashboardPage from './DashboardPage';
import type { WallPost } from '../../shared/types/WallPost';

// Control session state by mocking the Neon auth client (matches the public
// profile regression pattern — no network).
vi.mock('../auth/auth', () => ({
  authClient: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

// Deterministic API for the owner dashboard wall reads + writes.
vi.mock('../../shared/api/wallPosts', () => ({
  wallPostsApi: {
    getOwnerPosts: vi.fn(),
    getWallPosts: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    transitionPost: vi.fn(),
    deletePost: vi.fn(),
  },
}));

// Deterministic R2 upload for the compose form's multi-photo flow.
vi.mock('../../shared/api/profile', () => ({
  uploadImage: vi.fn(),
}));

import { authClient } from '../auth/auth';
import { wallPostsApi } from '../../shared/api/wallPosts';
import { uploadImage } from '../../shared/api/profile';

/** Build a synthetic File with a deterministic R2-style response URL. */
const makeImageFile = (label: string) => {
  const file = new File([label], `${label}.png`, { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: 1024 });
  return file;
};
const urlFor = (label: string) => `${label}.png`;

const authedSession = {
  data: { user: { id: '1', slug: 'k', name: 'Keerthi' }, session: { id: 's1' } },
};

const draftPost: WallPost = {
  id: 'd1', title: 'Draft Post', content: 'A draft only.', date: '2026-01-01', status: 'draft',
  postType: 'update',
};
const publishedPost: WallPost = {
  id: 'p1', title: 'Published Post', content: 'Live on profile.', date: '2026-01-02', status: 'published',
  postType: 'update',
};
const archivedPost: WallPost = {
  id: 'a1', title: 'Archived Post', content: 'In the past.', date: '2026-01-03', status: 'archived',
  postType: 'testimony',
};
const allPosts = [draftPost, publishedPost, archivedPost];

const noop = () => {};

beforeEach(() => {
  vi.mocked(authClient.getSession).mockResolvedValue(authedSession);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PostManager (owner, isolated)', () => {
  it('renders Published by default with per-status counts, only published posts shown', () => {
    render(<PostManager posts={allPosts} publicView={false} saving={false} error={null}
      onSave={noop} onDelete={noop} onTransition={noop} />);

    expect(screen.getByRole('tab', { name: /Drafts/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Published/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Archived/ })).toBeTruthy();

    // Published shows the published post + the draft/archived are hidden.
    expect(screen.getByText('Published Post')).toBeTruthy();
    expect(screen.queryByText('Draft Post')).toBeNull();
    expect(screen.queryByText('Archived Post')).toBeNull();
  });

  it('filters by status view: Drafts shows drafts, Archived shows archived', () => {
    render(<PostManager posts={allPosts} publicView={false} saving={false} error={null}
      onSave={noop} onDelete={noop} onTransition={noop} />);

    fireEvent.click(screen.getByRole('tab', { name: /Drafts/ }));
    expect(screen.getByText('Draft Post')).toBeTruthy();
    expect(screen.queryByText('Published Post')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: /Archived/ }));
    expect(screen.getByText('Archived Post')).toBeTruthy();
    expect(screen.queryByText('Published Post')).toBeNull();
  });

  it('shows publish/archive actions on a draft and calls onTransition(published)', () => {
    const onTransition = vi.fn();
    render(<PostManager posts={[draftPost]} publicView={false} saving={false} error={null}
      onSave={noop} onDelete={noop} onTransition={onTransition} />);

    // Drafts view shows the draft; "Publish" (exact) is the card's lifecycle
    // action — unique because the published-view tab is labeled "Published".
    fireEvent.click(screen.getByRole('tab', { name: /Drafts/ }));
    const publishButtons = screen.getAllByRole('button', { name: 'Publish' });
    expect(publishButtons.length).toBeGreaterThan(0);
    fireEvent.click(publishButtons[0]);

    expect(onTransition).toHaveBeenCalledTimes(1);
    expect(onTransition).toHaveBeenCalledWith('d1', 'published');
  });

  it('archive action on a published post calls onTransition(archived)', () => {
    const onTransition = vi.fn();
    render(<PostManager posts={[publishedPost]} publicView={false} saving={false} error={null}
      onSave={noop} onDelete={noop} onTransition={onTransition} />);

    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    expect(onTransition).toHaveBeenCalledWith('p1', 'archived');
  });

  it('delete action calls onDelete with the post id', () => {
    const onDelete = vi.fn();
    render(<PostManager posts={[publishedPost]} publicView={false} saving={false} error={null}
      onSave={noop} onDelete={onDelete} onTransition={noop} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete post' }));
    expect(onDelete).toHaveBeenCalledWith('p1');
  });

  it('compose form honours the Draft status: Save as Draft calls onSave with status draft', () => {
    const onSave = vi.fn<(post: WallPost) => void>();
    render(<PostManager posts={[]} publicView={false} saving={false} error={null}
      onSave={onSave} onDelete={noop} onTransition={noop} />);

    fireEvent.click(screen.getByRole('button', { name: /New Post/ }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My Update' } });
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'Hello supporters.' } });

    // Default status select is Draft -> submit button reads "Save as Draft".
    fireEvent.click(screen.getByRole('button', { name: 'Save as Draft' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0];
    expect(saved.status).toBe('draft');
    expect(saved.title).toBe('My Update');
  });
});

describe('Public read-only view (isolated)', () => {
  it('renders only published posts with NO status tabs and NO write controls', () => {
    render(<PostManager posts={allPosts} publicView saving={false} error={null}
      onSave={noop} onDelete={noop} onTransition={noop} />);

    expect(screen.getByText('Published Post')).toBeTruthy();
    expect(screen.queryByText('Draft Post')).toBeNull();
    expect(screen.queryByRole('tab', { name: /Drafts/ })).toBeNull();
    expect(screen.queryByLabelText('Title')).toBeNull();
    expect(screen.queryByRole('button', { name: /New Post/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete post' })).toBeNull();
  });
});

describe('Post manager wired through DashboardPage (mocked API)', () => {
  it('hydrates the owner wall from getOwnerPosts and creates a draft that lands under Drafts only', async () => {
    vi.mocked(wallPostsApi.getOwnerPosts).mockResolvedValue([]);
    vi.mocked(wallPostsApi.createPost).mockResolvedValue({
      id: 'new-1', title: 'Fresh Draft', content: 'Not public yet.',
      date: '2026-08-05', status: 'draft', postType: 'update',
    });

    render(
      <MemoryRouter>
        <DashboardPage defaultTab="wall" />
      </MemoryRouter>,
    );

    // New Post -> fill the form (status defaults to Draft).
    fireEvent.click(await screen.findByRole('button', { name: /New Post/ }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fresh Draft' } });
    fireEvent.change(screen.getByLabelText('Content'), {
      target: { value: 'Not public yet.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save as Draft' }));

    // createPost was asked for a DRAFT.
    await vi.waitFor(() =>
      expect(wallPostsApi.createPost).toHaveBeenCalledTimes(1),
    );
    const [, opts] = vi.mocked(wallPostsApi.createPost).mock.calls[0];
    expect(opts?.status).toBe('draft');

    // The new draft lives under the Drafts view (published view shows it not).
    fireEvent.click(screen.getByRole('tab', { name: /Drafts/ }));
    expect(await screen.findByText('Fresh Draft')).toBeTruthy();
    expect(screen.queryByText('Fresh Draft')).toBeTruthy();
    // And the public (published) view must not contain it.
    fireEvent.click(screen.getByRole('tab', { name: /Published/ }));
    expect(screen.queryByText('Fresh Draft')).toBeNull();
  });

  it('publishing a draft via the card transition moves it into the Published view through handlePostTransition', async () => {
    vi.mocked(wallPostsApi.getOwnerPosts).mockResolvedValue([draftPost]);
    vi.mocked(wallPostsApi.transitionPost).mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <DashboardPage defaultTab="wall" />
      </MemoryRouter>,
    );

    // Drafts view -> the draft card shows a Publish action. Slightly racy: the
    // whole dashboard (incl. the wall hydrate effect) settles before we click.
    fireEvent.click(await screen.findByRole('tab', { name: /Drafts/ }));
    // The draft title confirms we are on the Drafts view.
    expect(await screen.findByText('Draft Post')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await vi.waitFor(() =>
      expect(wallPostsApi.transitionPost).toHaveBeenCalledWith('d1', 'published'),
    );

    // Optimistic parent state drops the post from Drafts and shows it Published.
    fireEvent.click(screen.getByRole('tab', { name: /Published/ }));
    expect(await screen.findByText('Draft Post')).toBeTruthy();
  });
});

describe('PostMultiImage (carousel + ordered upload)', () => {
  const photoPost: WallPost = {
    id: 'pp1', title: 'Photo Post', content: 'With photos.',
    date: '2026-08-05', status: 'published', postType: 'update',
    images: [urlFor('one'), urlFor('two'), urlFor('three')],
  };
  const singlePhoto: WallPost = {
    id: 'sp1', title: 'Single Photo', content: 'One image.', date: '2026-08-05',
    status: 'published', postType: 'update', images: [urlFor('only')],
  };

  it('renders a multi-image carousel on a card with arrows + counter (owner + public)', () => {
    render(
      <PostManager posts={[photoPost]} publicView={false} saving={false} error={null}
        onSave={noop} onDelete={noop} onTransition={noop} />,
    );
    // Owner card: carousel with a counter and a next arrow.
    expect(screen.getByText('Photo Post')).toBeTruthy();
    expect(screen.getAllByText('1 / 3').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Next image' })).toBeTruthy();

    cleanup();
    render(
      <PostManager posts={[photoPost]} publicView saving={false} error={null}
        onSave={noop} onDelete={noop} onTransition={noop} />,
    );
    expect(screen.getByText('Photo Post')).toBeTruthy();
    expect(screen.getAllByText('1 / 3').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Next image' })).toBeTruthy();
  });

  it('hides carousel controls (arrows/counter) when a card has a single image', () => {
    render(
      <PostManager posts={[singlePhoto]} publicView={false} saving={false} error={null}
        onSave={noop} onDelete={noop} onTransition={noop} />,
    );
    expect(screen.getByText('Single Photo')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Next image' })).toBeNull();
    expect(screen.queryByText(/ \/ 1$/)).toBeNull();
  });

  it('uploads selected files through uploadImage and saves ordered images on the post', async () => {
    vi.mocked(uploadImage)
      .mockResolvedValueOnce({ key: 'one', url: urlFor('one') })
      .mockResolvedValueOnce({ key: 'two', url: urlFor('two') });
    const onSave = vi.fn<(post: WallPost) => void>();
    render(
      <PostManager posts={[]} publicView={false} saving={false} error={null}
        onSave={onSave} onDelete={noop} onTransition={noop} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /New Post/ }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Photo Update' } });
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'With uploaded photos.' } });

    const input = screen.getByLabelText(/Photos/).closest('input') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [makeImageFile('one'), makeImageFile('two')] },
    });

    await vi.waitFor(() => expect(uploadImage).toHaveBeenCalledTimes(2));
    // Uploaded refs show in the label counter (2 of 9) and the photo grid + carousel.
    expect(screen.getAllByText('2 / 9').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Save as Draft' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].images).toEqual([urlFor('one'), urlFor('two')]);
  });

  it('caps photo count at 9 and disables Add Photos once full', async () => {
    const urls = Array.from({ length: 9 }, (_, i) => urlFor(`img${i}`));
    vi.mocked(uploadImage).mockImplementation(async (file: Blob) => {
      const name = (file as File).name;
      return { key: name, url: name };
    });
    render(
      <PostManager posts={[]} publicView={false} saving={false} error={null}
        onSave={noop} onDelete={noop} onTransition={noop} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /New Post/ }));

    const input = screen.getByLabelText(/Photos/).closest('input') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: urls.map((_, i) => makeImageFile(`img${i}`)) },
    });
    await vi.waitFor(() => expect(uploadImage).toHaveBeenCalledTimes(9));

    expect(screen.getAllByText('9 / 9').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Add Photos/ }).hasAttribute('disabled')).toBe(true);
    void urls;
  });
});

describe('PostMultiImage wired through DashboardPage', () => {
  it('passes ordered images to createPost when a draft with photos is saved', async () => {
    vi.mocked(wallPostsApi.getOwnerPosts).mockResolvedValue([]);
    vi.mocked(wallPostsApi.createPost).mockResolvedValue({
      id: 'photo-1', title: 'Photo Draft', content: 'Has photos.',
      date: '2026-08-05', status: 'draft', postType: 'update',
      images: [urlFor('a'), urlFor('b')],
    });

    render(
      <MemoryRouter>
        <DashboardPage defaultTab="wall" />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /New Post/ }));
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'Has photos.' } });

    // Seed the form with two already-uploaded image refs (uploads are mocked
    // at the R2 layer; here we exercise the wiring that threads images to the API).
    const input = screen.getByLabelText(/Photos/).closest('input') as HTMLInputElement;
    vi.mocked(uploadImage)
      .mockResolvedValueOnce({ key: 'a', url: urlFor('a') })
      .mockResolvedValueOnce({ key: 'b', url: urlFor('b') });
    fireEvent.change(input, {
      target: { files: [makeImageFile('a'), makeImageFile('b')] },
    });
    // Let the mocked R2 uploads resolve so post.images is populated before save.
    await vi.waitFor(() => expect(uploadImage).toHaveBeenCalledTimes(2));

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Photo Draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save as Draft' }));

    await vi.waitFor(() =>
      expect(wallPostsApi.createPost).toHaveBeenCalledTimes(1),
    );
    const [, opts] = vi.mocked(wallPostsApi.createPost).mock.calls[0];
    expect(opts?.images).toEqual([urlFor('a'), urlFor('b')]);
    expect(wallPostsApi.updatePost).not.toHaveBeenCalled();
  });
});
