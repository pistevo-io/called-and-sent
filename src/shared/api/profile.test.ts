// Unit tests for the profile + upload API client.
// Network is mocked via global fetch; no live backend required.
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import {
  getProfile,
  upsertProfile,
  uploadImage,
  ProfileApiError,
} from './profile';

function mockFetch(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  const status = init.status ?? 200;
  const ok = init.ok ?? (status >= 200 && status < 300);
  const res = {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
  const fetchMock = vi.fn().mockResolvedValue(res) as Mock;
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubGlobal('FormData', FormData);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getProfile', () => {
  it('GETs /api/profile?slug= and maps the backend shape', async () => {
    const fetchMock = mockFetch({
      profile: {
        slug: 'k',
        displayName: 'Keerthi',
        bio: 'Missionary',
        photoUrl: 'https://cdn/x.png',
        theme: 'dark',
      },
    });

    const profile = await getProfile('k');

    expect(profile).not.toBeNull();
    expect(profile!.slug).toBe('k');
    expect(profile!.displayName).toBe('Keerthi');
    expect(profile!.bio).toBe('Missionary');
    expect(profile!.photoUrl).toBe('https://cdn/x.png');
    expect(profile!.theme).toBe('dark');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/profile?slug=k',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('URL-encodes the slug', async () => {
    const fetchMock = mockFetch({ profile: { slug: 'a b', theme: 'dark' } });
    await getProfile('a b');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/profile?slug=a%20b',
      expect.any(Object),
    );
  });

  it('returns null when the profile is missing (404)', async () => {
    mockFetch({ profile: null }, { status: 404, ok: false });
    expect(await getProfile('ghost')).toBeNull();
  });

  it('throws ProfileApiError on a server error', async () => {
    mockFetch({ error: 'boom' }, { status: 500, ok: false });
    await expect(getProfile('k')).rejects.toBeInstanceOf(ProfileApiError);
    await expect(getProfile('k')).rejects.toMatchObject({
      status: 500,
      message: 'boom',
    });
  });
});

describe('upsertProfile', () => {
  it('POSTs JSON and returns the persisted slug', async () => {
    const fetchMock = mockFetch({ ok: true, slug: 'k' }, { status: 200 });
    const slug = await upsertProfile({ displayName: 'Keerthi', bio: 'hi' });
    expect(slug).toBe('k');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/profile');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual({
      displayName: 'Keerthi',
      bio: 'hi',
    });
  });

  it('honors a PUT override', async () => {
    const fetchMock = mockFetch({ ok: true, slug: 'k' });
    await upsertProfile({ slug: 'k' }, 'PUT');
    expect((fetchMock.mock.calls[0] as [string, RequestInit])[1].method).toBe(
      'PUT',
    );
  });

  it('throws ProfileApiError on failure', async () => {
    mockFetch({ error: 'Unauthorized' }, { status: 401, ok: false });
    await expect(upsertProfile({})).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized',
    });
  });
});

describe('uploadImage', () => {
  it('POSTs multipart/form-data with the file under `file`', async () => {
    const fetchMock = mockFetch({ key: 'u/1.png', url: 'u/1.png' }, {
      status: 201,
    });
    const blob = new Blob(['img'], { type: 'image/png' });
    const result = await uploadImage(blob);

    expect(result).toEqual({ key: 'u/1.png', url: 'u/1.png' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/upload');
    expect(init.method).toBe('POST');
    // No Content-Type header set manually — the browser sets the multipart boundary.
    expect((init.headers as Record<string, string> | undefined)?.['Content-Type']).toBeUndefined();
    const form = init.body as FormData;
    const file = form.get('file');
    expect(file).toBeInstanceOf(Blob);
    expect((file as Blob).type).toBe('image/png');
  });

  it('preserves the original filename for File inputs', async () => {
    const fetchMock = mockFetch({ key: 'u/1.png', url: 'u/1.png' }, {
      status: 201,
    });
    const file = new File(['img'], 'headshot.png', { type: 'image/png' });
    await uploadImage(file);
    const [_, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;
    expect((form.get('file') as File).name).toBe('headshot.png');
  });

  it('throws ProfileApiError on upload failure', async () => {
    mockFetch({ error: 'Unsupported file type' }, { status: 400, ok: false });
    await expect(uploadImage(new Blob(['x']))).rejects.toMatchObject({
      status: 400,
      message: 'Unsupported file type',
    });
  });
});
