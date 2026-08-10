import { useState, useRef } from 'react';
import {
  Plus, Save, X, Trash2, Edit3, Share2, Send, Archive, RotateCcw, Calendar,
  ImagePlus, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import type { WallPost, WallPostStatus } from '../../shared/types/WallPost';
import SocialShare from '../../shared/ui/SocialShare';
import { uploadImage } from '../../shared/api/profile';

/** Cap for images per post (matches the wall-posts multi-image spec of up to 9). */
const MAX_IMAGES = 9;

/** Ordered lifecycle views for the owner post manager. Public (read-only) view
 *  always lists published posts with no tabs / no actions. */
type WallView = 'draft' | 'published' | 'archived';

const VIEWS: { key: WallView; label: string; accent: string; badge: string }[] = [
  { key: 'draft', label: 'Drafts', accent: 'bg-gray-600', badge: 'text-gray-400' },
  { key: 'published', label: 'Published', accent: 'bg-mission-600', badge: 'text-mission-300' },
  { key: 'archived', label: 'Archived', accent: 'bg-gray-600', badge: 'text-gray-400' },
];

const POST_TYPES = ['update', 'testimony', 'prayer', 'praise', 'scripture'] as const;

/** Visitor-facing type filter on the public wall. `all` shows every published post. */
type TypeFilter = 'all' | (typeof POST_TYPES)[number];

/** Label helper for a post type (chip / card copy). `updates` -> `Updates` etc. */
const typeLabel = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : 'Update');

function statusOf(post: WallPost): WallPostStatus {
  return post.status ?? 'draft';
}

interface PostManagerProps {
  /** All posts (owner: every status) or published-only (public view). */
  posts: WallPost[];
  /** Read-only / no auth when true — hides tabs and all write controls. */
  publicView: boolean;
  /** Visitor-facing theme for public surfaces (profile.theme). The owner post
   *  manager always stays dark; only the public wall flips with the theme. */
  theme?: 'dark' | 'light';
  saving: boolean;
  error: string | null;
  onSave: (post: WallPost, isEdit: boolean) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onTransition: (id: string, status: WallPostStatus) => void | Promise<void>;
}

export default function PostManager({
  posts,
  publicView,
  theme = 'dark',
  saving,
  error,
  onSave,
  onDelete,
  onTransition,
}: PostManagerProps) {
  const [view, setView] = useState<WallView>('published');
  // Visitor-facing type filter — only used in the public wall.
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<WallPost | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const counts = VIEWS.reduce<Record<WallView, number>>(
    (acc, v) => {
      acc[v.key] = posts.filter((p) => statusOf(p) === v.key).length;
      return acc;
    },
    { draft: 0, published: 0, archived: 0 },
  );

  const visiblePosts = publicView
    ? posts.filter(
        (p) => statusOf(p) === 'published' && (typeFilter === 'all' || p.postType === typeFilter),
      )
    : posts.filter((p) => statusOf(p) === view);

  const openNew = () => {
    setEditingPost(null);
    setShowForm(true);
    setSharingId(null);
  };

  const openEdit = (post: WallPost) => {
    setEditingPost(post);
    setShowForm(true);
    setSharingId(null);
  };

  const toggleShare = (id: string) => setSharingId((cur) => (cur === id ? null : id));

  if (publicView) {
    const light = theme === 'light';
    return (
      <div className="space-y-4">
        {/* Visitor-facing type filter chips (All / Testimony / Prayer / …). */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter posts by type">
          <FilterChip
            label="All"
            active={typeFilter === 'all'}
            onClick={() => setTypeFilter('all')}
            light={light}
          />
          {POST_TYPES.map((t) => (
            <FilterChip
              key={t}
              label={typeLabel(t)}
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
              light={light}
            />
          ))}
        </div>
        {visiblePosts.length === 0 ? (
          <div className={`text-center py-12 ${light ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-2xl`}>
            <Send className={`w-12 h-12 mx-auto mb-3 ${light ? 'text-gray-300' : 'text-gray-600'}`} />
            <p className="text-gray-500">
              {typeFilter === 'all'
                ? 'No published updates yet.'
                : `No ${typeLabel(typeFilter).toLowerCase()} posts yet.`}
            </p>
          </div>
        ) : (
          visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              publicView
              light={light}
              sharing={sharingId === post.id}
              onToggleShare={() => toggleShare(post.id)}
            />
          ))
        )}
      </div>
    );
  }

  const activeView = VIEWS.find((v) => v.key === view) ?? VIEWS[1];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">
          {activeView.label}
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({counts[view]})
          </span>
        </h2>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Status views */}
      <div className="flex gap-1 bg-gray-800 rounded-xl p-1 mb-6 w-fit" role="tablist" aria-label="Post status views">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            role="tab"
            aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === v.key ? 'bg-mission-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            {v.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${view === v.key ? 'bg-white/20 text-white' : v.badge}`}>
              {counts[v.key]}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-400 mb-4" role="alert">{error}</p>
      )}

      {showForm && (
        <PostForm
          post={editingPost}
          saving={saving}
          onSave={(post) => {
            onSave(post, Boolean(editingPost));
            setShowForm(false);
            setEditingPost(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingPost(null);
          }}
        />
      )}

      {visiblePosts.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-2xl">
          <Send className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">
            {view === 'draft'
              ? 'No drafts yet. Start a post and it will show up here.'
              : view === 'archived'
                ? 'Nothing archived.'
                : 'No published posts yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              saving={saving}
              sharing={sharingId === post.id}
              onToggleShare={() => toggleShare(post.id)}
              onEdit={() => openEdit(post)}
              onDelete={() => onDelete(post.id)}
              onTransition={(s) => onTransition(post.id, s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  publicView = false,
  saving = false,
  sharing = false,
  light = false,
  onToggleShare,
  onEdit,
  onDelete,
  onTransition,
}: {
  post: WallPost;
  publicView?: boolean;
  saving?: boolean;
  sharing?: boolean;
  light?: boolean;
  onToggleShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTransition?: (s: WallPostStatus) => void;
}) {
  const status = statusOf(post);
  const surface = light ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700';
  const divider = light ? 'border-gray-200' : 'border-gray-700';
  return (
    <div className={`${surface} border rounded-xl p-5 flex flex-col gap-3`}>
      <div className="flex items-start justify-between group">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {post.postType && (
              <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wide ${light ? 'bg-gray-100 text-gray-600' : 'bg-gray-700 text-gray-300'}`}>
                {post.postType}
              </span>
            )}
            <h3 className="font-semibold">{post.title}</h3>
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">{post.date}</span>
          </div>
          <p className={`text-sm line-clamp-2 ${light ? 'text-gray-600' : 'text-gray-400'}`}>{post.content}</p>
        </div>
        {!publicView && onEdit && (
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              type="button"
              onClick={onToggleShare}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Share post"
            >
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Edit post"
            >
              <Edit3 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="p-2 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Delete post"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}
      </div>

      {/* Ordered image carousel — renders on owner + public cards. */}
      {post.images && post.images.length > 0 && (
        <PostCarousel images={post.images} alt={post.title} />
      )}

      {/* Lifecycle actions — only the transitions valid from the current status. */}
      {!publicView && onTransition && status !== 'draft' && (
        <div className={`flex items-center gap-3 border-t pt-3 ${divider}`}>
          {status === 'archived'
            ? (
              <>
                <StatusAction
                  icon={RotateCcw}
                  label="Restore to Drafts"
                  onClick={() => onTransition('draft')}
                  disabled={saving}
                />
                <StatusAction
                  icon={Send}
                  label="Publish"
                  onClick={() => onTransition('published')}
                  disabled={saving}
                />
              </>
            )
            : (
              <>
                <StatusAction
                  icon={Send}
                  label="Publish"
                  onClick={() => onTransition('published')}
                  disabled={saving}
                  primary
                />
                <StatusAction
                  icon={Archive}
                  label="Archive"
                  onClick={() => onTransition('archived')}
                  disabled={saving}
                />
              </>
            )}
        </div>
      )}
      {!publicView && onTransition && status === 'draft' && (
        <div className={`flex items-center gap-3 border-t pt-3 ${divider}`}>
          <StatusAction
            icon={Send}
            label="Publish"
            onClick={() => onTransition('published')}
            disabled={saving}
            primary
          />
          <StatusAction
            icon={Archive}
            label="Archive"
            onClick={() => onTransition('archived')}
            disabled={saving}
          />
        </div>
      )}

      {sharing && (
        <div className={`border-t pt-3 ${divider}`}>
          <SocialShare title={post.title} text={post.content} />
        </div>
      )}
    </div>
  );
}

function StatusAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  primary = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
        primary
          ? 'bg-mission-600 hover:bg-mission-700 text-white'
          : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/** Filter chip for the public wall's visitor-facing type filter. Toggle
 *  (All / type) with `aria-pressed` for assistive tech. Mirrors the tab
 *  treatment: solid mission on the active chip, muted surface otherwise. */
function FilterChip({
  label,
  active,
  onClick,
  light = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  light?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
        active
          ? 'bg-mission-600 text-white shadow-lg'
          : light
            ? 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-mission-500'
            : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-mission-500'
      }`}
    >
      {label}
    </button>
  );
}

/** Ordered carousel of a post's images. Reuses the TripModal pattern: arrows when
 *  more than one image, and a counter. Rendered on published cards (owner + public)
 *  and on the grid preview inside the composer. */
function PostCarousel({ images, alt }: { images: string[]; alt?: string }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;

  const clamped = index < images.length ? index : 0;
  const next = () => setIndex((cur) => (cur + 1) % images.length);
  const prev = () => setIndex((cur) => (cur - 1 + images.length) % images.length);

  return (
    <div className="relative group rounded-xl overflow-hidden bg-gray-900">
      <img
        src={images[clamped]}
        alt={alt ? `${alt} — image ${clamped + 1} of ${images.length}` : `Post image ${clamped + 1} of ${images.length}`}
        loading="lazy"
        className="w-full h-56 sm:h-64 object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {clamped + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

function PostForm({
  post,
  saving = false,
  onSave,
  onCancel,
}: {
  post: WallPost | null;
  saving?: boolean;
  onSave: (post: WallPost) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<WallPost>(
    post || {
      id: `new-${Date.now()}`,
      title: '',
      content: '',
      date: new Date().toISOString().slice(0, 10),
      status: 'draft',
      postType: 'update',
    },
  );
  const [images, setImages] = useState<string[]>(post?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    // Upload sequentially; a single failed file surfaces an error and stops.
    for (const file of Array.from(files)) {
      if (images.length >= MAX_IMAGES) break;
      setUploading(true);
      try {
        const { url } = await uploadImage(file);
        setImages((cur) => [...cur, url].slice(0, MAX_IMAGES));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed.';
        setUploadError(msg);
        break;
      } finally {
        setUploading(false);
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const moveImage = (from: number, to: number) => {
    setImages((cur) => {
      if (to < 0 || to >= cur.length) return cur;
      const next = [...cur];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content || uploading) return;
    onSave({ ...form, images });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">{post ? 'Edit Post' : 'New Wall Post'}</h3>
      <div className="mb-4">
        <label htmlFor="post-title" className="block text-sm font-medium text-gray-400 mb-1">Title</label>
        <input
          id="post-title"
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mission-500 transition-colors"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="post-content" className="block text-sm font-medium text-gray-400 mb-1">Content</label>
        <textarea
          id="post-content"
          rows={4}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mission-500 transition-colors resize-none"
        />
      </div>

      {/* Photos — ordered, up to 9, uploaded via the R2 /api/upload flow. */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="post-images" className="block text-sm font-medium text-gray-400">
            Photos
            <span className="ml-2 text-xs text-gray-500">{images.length} / {MAX_IMAGES}</span>
          </label>
          <input
            ref={fileRef}
            id="post-images"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            multiple
            disabled={uploading || images.length >= MAX_IMAGES}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading || images.length >= MAX_IMAGES}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-full text-sm font-medium transition-all"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Add Photos'}
          </button>
        </div>

        {uploadError && (
          <p className="text-sm text-red-400 mb-2" role="alert">{uploadError}</p>
        )}

        {images.length > 0 && (
          <div className="space-y-3">
            <PostCarousel images={images} alt={form.title || 'Post'} />
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {images.map((url, i) => (
                <div key={url} className="relative group bg-gray-900 rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`Post image ${i + 1}`}
                    className="w-full h-16 object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => moveImage(i, i - 1)}
                      disabled={i === 0}
                      className="p-1 bg-white/20 hover:bg-white/40 rounded disabled:opacity-30"
                      aria-label="Move image left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(i, i + 1)}
                      disabled={i === images.length - 1}
                      className="p-1 bg-white/20 hover:bg-white/40 rounded disabled:opacity-30"
                      aria-label="Move image right"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImages((cur) => cur.filter((_, j) => j !== i))}
                      className="p-1 bg-red-600/80 hover:bg-red-600 rounded"
                      aria-label={`Remove image ${i + 1}`}
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="post-type" className="block text-sm font-medium text-gray-400 mb-1">Type</label>
          <select
            id="post-type"
            value={form.postType ?? 'update'}
            onChange={(e) => setForm({ ...form, postType: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors"
          >
            {POST_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="post-status" className="block text-sm font-medium text-gray-400 mb-1">Status</label>
          <select
            id="post-status"
            value={form.status ?? 'draft'}
            onChange={(e) => setForm({ ...form, status: e.target.value as WallPostStatus })}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {post
            ? 'Save Changes'
            : form.status === 'published'
              ? 'Publish Post'
              : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-full text-sm transition-all"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}
