import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, AlertCircle, BookOpen, Heart, Megaphone, Star, Hand } from 'lucide-react';
import { emptyWallPost, WALL_POST_TYPES } from './types';
import type { WallPost, WallPostType } from './types';
import Modal from './Modal';
import { TextField, TextArea } from './FormControls';
import { PRIMARY_BTN, GHOST_BTN, CARD, WALL_BADGE } from './styles';

interface WallManagerProps {
  posts: WallPost[];
  onChange: (posts: WallPost[]) => void;
}

const TYPE_META: Record<WallPostType, { label: string; icon: typeof Heart }> = {
  testimony: { label: 'Testimony', icon: Heart },
  prayer: { label: 'Prayer', icon: Hand },
  update: { label: 'Update', icon: Megaphone },
  praise: { label: 'Praise', icon: Star },
  scripture: { label: 'Scripture', icon: BookOpen },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function WallManager({ posts, onChange }: WallManagerProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WallPost | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (post: WallPost) => {
    setEditing(post);
    setEditorOpen(true);
  };

  const handleSave = (post: WallPost) => {
    const exists = posts.some((p) => p.id === post.id);
    onChange(exists ? posts.map((p) => (p.id === post.id ? post : p)) : [...posts, post]);
    setEditorOpen(false);
    setEditing(null);
  };

  const confirmDelete = (id: string) => {
    onChange(posts.filter((p) => p.id !== id));
    setConfirmDeleteId(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Prayer &amp; Testimony Wall</h2>
          <p className="text-sm text-gray-400">{posts.length} post{posts.length === 1 ? '' : 's'}</p>
        </div>
        <button type="button" onClick={openCreate} className={PRIMARY_BTN}>
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <Megaphone className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">No wall posts yet</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Share a testimony, prayer request, or update with your supporters.
          </p>
          <button type="button" onClick={openCreate} className={GHOST_BTN}>
            <Plus className="w-4 h-4" />
            Add Post
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {sorted.map((post) => {
              const meta = TYPE_META[post.type];
              const Icon = meta.icon;
              return (
                <motion.li
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className={`${CARD} p-4`}
                >
                  {confirmDeleteId === post.id ? (
                    <div className="flex items-center gap-3" role="alertdialog" aria-label="Confirm delete post">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      <span className="flex-1 text-sm text-gray-300">
                        Delete “{post.title || 'this post'}”?
                      </span>
                      <button
                        type="button"
                        onClick={() => confirmDelete(post.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${WALL_BADGE[post.type]}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {meta.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">
                          {post.title || 'Untitled post'}
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">
                          {post.body || 'No body text.'}
                        </p>
                        {post.verseRef && (
                          <p className="text-xs text-emerald-300 mt-1">📖 {post.verseRef}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{formatDate(post.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEdit(post)}
                          aria-label={`Edit post`}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-mission-400"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(post.id)}
                          aria-label={`Delete post`}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <WallEditorModal
        open={editorOpen}
        post={editing}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}

interface WallEditorModalProps {
  open: boolean;
  post: WallPost | null;
  onClose: () => void;
  onSave: (post: WallPost) => void;
}

function WallEditorModal({ open, post, onClose, onSave }: WallEditorModalProps) {
  const [draft, setDraft] = useState<WallPost>(post ?? emptyWallPost());

  // Sync the draft whenever the modal opens for a (different) post.
  useEffect(() => {
    if (open) setDraft(post ?? emptyWallPost());
  }, [open, post]);

  const set = <K extends keyof WallPost>(key: K, value: WallPost[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    onSave({
      ...draft,
      title: draft.title.trim(),
      body: draft.body.trim(),
      verseRef: draft.verseRef?.trim() || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={post ? 'Edit Wall Post' : 'New Wall Post'}
      footer={
        <>
          <button type="button" onClick={onClose} className={GHOST_BTN}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} className={PRIMARY_BTN}>
            <Plus className="w-4 h-4" />
            {post ? 'Save Changes' : 'Create Post'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="wall-type" className="block text-sm font-medium text-gray-300 mb-1.5">
            Type
          </label>
          <select
            id="wall-type"
            className={`w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 focus:ring-1 focus:ring-mission-500 transition-colors`}
            value={draft.type}
            onChange={(e) => set('type', e.target.value as WallPostType)}
          >
            {WALL_POST_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_META[t].label}
              </option>
            ))}
          </select>
        </div>

        <TextField
          id="wall-title"
          label="Title"
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="God answered prayer in Honduras"
        />

        <TextArea
          id="wall-body"
          label="Body"
          value={draft.body}
          onChange={(e) => set('body', e.target.value)}
          placeholder="Share the details..."
        />

        {draft.type === 'scripture' && (
          <TextField
            id="wall-verse"
            label="Verse Reference"
            value={draft.verseRef ?? ''}
            onChange={(e) => set('verseRef', e.target.value)}
            placeholder="John 3:16"
          />
        )}
      </div>
    </Modal>
  );
}
