import { useState } from 'react';
import {
  Plus, Save, X, Trash2, Edit3, Share2, Send, Archive, RotateCcw, Calendar,
} from 'lucide-react';
import type { WallPost, WallPostStatus } from '../../shared/types/WallPost';
import SocialShare from '../../shared/ui/SocialShare';

/** Ordered lifecycle views for the owner post manager. Public (read-only) view
 *  always lists published posts with no tabs / no actions. */
type WallView = 'draft' | 'published' | 'archived';

const VIEWS: { key: WallView; label: string; accent: string; badge: string }[] = [
  { key: 'draft', label: 'Drafts', accent: 'bg-gray-600', badge: 'text-gray-400' },
  { key: 'published', label: 'Published', accent: 'bg-mission-600', badge: 'text-mission-300' },
  { key: 'archived', label: 'Archived', accent: 'bg-gray-600', badge: 'text-gray-400' },
];

const POST_TYPES = ['update', 'testimony', 'prayer', 'praise', 'scripture'];

function statusOf(post: WallPost): WallPostStatus {
  return post.status ?? 'draft';
}

interface PostManagerProps {
  /** All posts (owner: every status) or published-only (public view). */
  posts: WallPost[];
  /** Read-only / no auth when true — hides tabs and all write controls. */
  publicView: boolean;
  saving: boolean;
  error: string | null;
  onSave: (post: WallPost, isEdit: boolean) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onTransition: (id: string, status: WallPostStatus) => void | Promise<void>;
}

export default function PostManager({
  posts,
  publicView,
  saving,
  error,
  onSave,
  onDelete,
  onTransition,
}: PostManagerProps) {
  const [view, setView] = useState<WallView>('published');
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
    ? posts.filter((p) => statusOf(p) === 'published')
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
    return (
      <div className="space-y-4">
        {visiblePosts.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-2xl">
            <Send className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No published updates yet.</p>
          </div>
        ) : (
          visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              publicView
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
  onToggleShare,
  onEdit,
  onDelete,
  onTransition,
}: {
  post: WallPost;
  publicView?: boolean;
  saving?: boolean;
  sharing?: boolean;
  onToggleShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTransition?: (s: WallPostStatus) => void;
}) {
  const status = statusOf(post);
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between group">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {post.postType && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 uppercase tracking-wide">
                {post.postType}
              </span>
            )}
            <h3 className="font-semibold">{post.title}</h3>
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">{post.date}</span>
          </div>
          <p className="text-gray-400 text-sm line-clamp-2">{post.content}</p>
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

      {/* Lifecycle actions — only the transitions valid from the current status. */}
      {!publicView && onTransition && status !== 'draft' && (
        <div className="flex items-center gap-3 border-t border-gray-700 pt-3">
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
        <div className="flex items-center gap-3 border-t border-gray-700 pt-3">
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
        <div className="border-t border-gray-700 pt-3">
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    onSave(form);
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
