import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, MapPin, Edit3, Plus, Trash2, Save, X, MessageSquare,
  Calendar, Image, Settings, Share2, LogOut
} from 'lucide-react';
import { useRequireAuth, useSessionState } from '../auth/useAuthGuards';
import { signOut, resolveProfileSlug } from '../auth/authHelpers';
import { getProfile, upsertProfile, uploadImage } from '../../shared/api/profile';
import { wallPostsApi } from '../../shared/api/wallPosts';
import { tripsApi } from '../../shared/api/trips';
import type { MissionTrip } from '../../shared/types/MissionTrip';
import type { WallPost } from '../../shared/types/WallPost';
import SocialShare from '../../shared/ui/SocialShare';

/** Shared auth-aware top nav for the dashboard (and its public read-only view).
 * Reuses the same session logic as the landing nav so logged-in users always
 * see Dashboard / Profile / Sign Out instead of a confusing "Sign In" link. */
function DashboardNav({ publicView }: { publicView: boolean }) {
  const { state, user } = useSessionState();
  const profileSlug = resolveProfileSlug(user);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">
          Called <span className="text-mission-500">&</span> Sent
        </Link>

        {state === 'authed' ? (
          <div className="flex items-center gap-3">
            {!publicView && (
              <Link
                to="/settings"
                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            )}
            <Link
              to="/dashboard"
              className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-full border border-gray-600 hover:border-mission-500 transition-all"
            >
              Dashboard
            </Link>
            <Link
              to={`/@${profileSlug}`}
              className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-full border border-gray-600 hover:border-mission-500 transition-all"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-full bg-mission-600 hover:bg-mission-700 transition-all hover:scale-105 shadow-lg hover:shadow-mission-500/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <LogOut className="w-4 h-4" />
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-full border border-gray-600 hover:border-mission-500 transition-all"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold text-white px-4 py-2 rounded-full bg-mission-600 hover:bg-mission-700 transition-all hover:scale-105 shadow-lg hover:shadow-mission-500/30"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

type Tab = 'profile' | 'trips' | 'wall';

interface DashboardPageProps {
  /** Public, read-only view of a missionary's profile — no auth, no editing. */
  publicView?: boolean;
  /** Tab to open initially. */
  defaultTab?: Tab;
  /** Route handle (e.g. "k" from /@k) for public views — lets the data layer
   *  fetch the right profile's trips/wall posts from the API. Undefined in the
   *  owner (authed) dashboard, which resolves its slug from the session. */
  slug?: string;
}

export default function DashboardPage({ publicView = false, defaultTab = 'trips', slug }: DashboardPageProps) {
  const auth = useRequireAuth(!publicView);
  // Owner view blocks while the session resolves or until the anon redirect fires;
  // public view is always open.
  const checking = !publicView && auth.state !== 'authed';
  // Initialize the tab once; the factory form avoids re-seeding the tab on every
  // render (and satisfies no-unstable-default-value).
  const [activeTab, setActiveTab] = useState<Tab>(() => defaultTab);
  const [trips, setTrips] = useState<MissionTrip[]>([]);
  const [wallPosts, setWallPosts] = useState<WallPost[]>([]);
  const [editingTrip, setEditingTrip] = useState<MissionTrip | null>(null);
  const [editingPost, setEditingPost] = useState<WallPost | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [sharingIdx, setSharingIdx] = useState<number | null>(null);
  // Inline error surfaced when a trip delete fails against the API (never silent-drop).
  const [tripError, setTripError] = useState<string | null>(null);
  // Save-state for the owner trip create/update flow (POST/PUT on submit).
  const [tripSaving, setTripSaving] = useState(false);
  // Synchronous guard against concurrent submit (React batches state updates,
  // so a state-based check alone can let two clicks through before tripSaving
  // flips true). The ref gives us an immediate, unbuffered flip.
  const tripSavingRef = useRef(false);

  // Wall-post owner writes mirror the trip flow: create/update/delete via the
  // API, with a surfaced error on failure (optimistic rollback, no localStorage).
  const [postError, setPostError] = useState<string | null>(null);
  const [postSaving, setPostSaving] = useState(false);
  // Synchronous guard against concurrent submit — mirrors tripSavingRef. The
  // postSaving state flip is batched by React, so a second click landing in the
  // same batch would otherwise slip through before the button disables.
  const postSavingRef = useRef(false);

  // Owner Profile tab: controlled inputs backed by the persistent store.
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [profileSlug, setProfileSlug] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Local upload-status state for the R2 photo upload; `profilePhoto` holds
  // the persisted R2 key returned by /api/upload (rendered as the avatar).
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Loading flags for the public (read-only) view while it fetches the slug's
  // data from the API — covers the loading state of loading/empty/error/success.
  const [tripsLoading, setTripsLoading] = useState(false);
  const [wallLoading, setWallLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const res = await uploadImage(file);
      setProfilePhoto(res.url); // persisted R2 key; saveProfile writes it down
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // The API is the single source of truth for trips + wall posts (see the effects
  // below). We intentionally do NOT seed from localStorage or static demo data —
  // doing so would mask an empty API response behind stale local data. Owner and
  // public views both hydrate exclusively from the API.

  useEffect(() => {
    // Public, read-only view: fetch the profile's trips + wall posts from the API
    // keyed by the route slug. Anonymous visitors see the owner's published data,
    // read straight from the API (no localStorage / no static seed).
    if (publicView && slug) {
      let cancelled = false;
      setTripsLoading(true);
      setWallLoading(true);
      Promise.all([
        tripsApi.getTrips(slug).catch(() => null),
        wallPostsApi.getWallPosts(slug).catch(() => null),
      ]).then(([apiTrips, apiPosts]) => {
        if (cancelled) return;
        setTrips(apiTrips ?? []);
        setWallPosts(apiPosts ?? []);
        setTripsLoading(false);
        setWallLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }
    // Owner view: the API effects below (keyed on auth) hydrate trips + wall posts
    // from the session slug. We intentionally start from empty here — no localStorage.
  }, [slug]); // re-run if the public slug changes (API fetch will target it)

  // Owner view: the API is the source of truth for trips. On submit we POST/PUT
  // (see handleSaveTrip), so we load persisted trips back here or a reload would
  // drop them. Public/anon views are handled by the effect above (API-only).
  useEffect(() => {
    if (publicView || auth.state !== 'authed' || !auth.user) return;
    const slug = resolveProfileSlug(auth.user as never);
    tripsApi
      .getTrips(slug)
      .then((apiTrips) => {
        setTrips(apiTrips); // API is authoritative — an empty array is a valid result
      })
      .catch(() => {
        // Leave the current (empty) state; API errors surface on the write path.
      });
  }, [publicView, auth.state, auth.user]);

  // Owner/public wall posts: the API is the source of truth. Public views fetch
  // by the route handle; owner views resolve their slug from the session. On a
  // reload this re-hydrates persisted posts so a refresh never drops them. The
  // API is authoritative — an empty array is a valid (and expected) result.
  useEffect(() => {
    const target = publicView
      ? slug
      : auth.state === 'authed' && auth.user
        ? resolveProfileSlug(auth.user as never)
        : null;
    if (!target) return;
    wallPostsApi
      .getWallPosts(target)
      .then((apiPosts) => {
        setWallPosts(apiPosts);
      })
      .catch(() => {
        // Leave the current (empty) state; API errors surface on the write path.
      });
  }, [publicView, auth.state, auth.user, slug]);

  // Hydrate the owner Profile tab from the session + persistent store.
  // Owner view is only rendered when authed, so `auth.user` is present here.
  useEffect(() => {
    if (publicView || auth.state !== 'authed' || !auth.user) return;
    const slug = resolveProfileSlug(auth.user as never);
    setProfileSlug(slug);
    // Seed from session immediately so the inputs are never empty while we wait.
    setProfileName(auth.user.name ?? '');
    if (profilePhoto === '' && auth.user.image) setProfilePhoto(auth.user.image as string);
    // Overlay stored values when present (these win over the session defaults).
    getProfile(slug)
      .then((p) => {
        if (p) {
          if (p.displayName) setProfileName(p.displayName);
          if (p.bio != null) setProfileBio(p.bio);
          if (p.photoUrl) setProfilePhoto(p.photoUrl);
        }
      })
      .catch(() => {
        // Leave the session-seeded defaults in place; saving will create it.
      });
  }, [publicView, auth.state, auth.user]);

  // Public read-only profile card: resolve the displayed name/bio/photo from the
  // API by slug. Falls back to the slug itself when the profile is unknown or the
  // API is unreachable, so the card never renders a fake name or breaks.
  useEffect(() => {
    if (!publicView || !slug) return;
    let cancelled = false;
    setProfileLoading(true);
    getProfile(slug)
      .then((p) => {
        if (cancelled) return;
        if (p) {
          setProfileName(p.displayName ?? decodeURIComponent(slug));
          if (p.bio != null) setProfileBio(p.bio);
          if (p.photoUrl) setProfilePhoto(p.photoUrl);
        } else {
          setProfileName(decodeURIComponent(slug));
        }
        setProfileLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProfileName(decodeURIComponent(slug));
        setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [publicView, slug]);

  const saveProfile = async () => {
    if (savingProfile) return;
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const slug = await upsertProfile({
        slug: profileSlug || resolveProfileSlug(auth.user as never),
        displayName: profileName,
        bio: profileBio,
        photoUrl: profilePhoto || null,
        theme: 'dark',
      });
      setProfileSlug(slug);
      setProfileSaved(true);
      // Reflect the persisted slug in the public profile links too.
      setProfileSlug(slug);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Owner trip writes go to the D1 API. On submit we POST (create) or PUT (update)
  // and reconcile local state with the server-assigned id; on failure we keep the
  // prior list and surface tripError (no silent drop). Public/anon views never
  // reach these handlers (the form + edit/delete controls are gated by !publicView).
  const handleSaveTrip = async (trip: MissionTrip, isEdit: boolean) => {
    // Defense-in-depth: bail out of any concurrent submit immediately. React
    // batches the tripSaving state flip, so a second click landing in the same
    // batch would otherwise slip through before the button disables.
    if (tripSavingRef.current) return;
    tripSavingRef.current = true;
    if (publicView) {
      // Mirror handleSavePost: reset the sync guard before the early return so
      // the ref doesn't leak true on this (currently unreachable-in-practice)
      // path.
      tripSavingRef.current = false;
      setTrips((prev) => (isEdit ? prev.map((t) => (t.id === trip.id ? trip : t)) : [...prev, trip]));
      return;
    }
    setTripSaving(true);
    setTripError(null);
    try {
      if (isEdit) {
        await tripsApi.updateTrip(trip.id, trip);
        setTrips((prev) => prev.map((t) => (t.id === trip.id ? trip : t)));
      } else {
        const id = await tripsApi.createTrip(trip);
        setTrips((prev) => [...prev, { ...trip, id }]);
      }
    } catch (err) {
      setTripError(err instanceof Error ? err.message : 'Failed to save trip.');
    } finally {
      setTripSaving(false);
      tripSavingRef.current = false;
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (publicView) {
      setTrips((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    setTripSaving(true);
    setTripError(null);
    try {
      await tripsApi.deleteTrip(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setTripError(err instanceof Error ? err.message : 'Failed to delete trip.');
    } finally {
      setTripSaving(false);
    }
  };

  // Owner post writes go to the D1 API. Create -> POST, update -> PUT; we
  // reconcile local state with the server-assigned id. On failure we roll back
  // to the prior in-memory list (no silent drop, no localStorage drift).
  // Public/anon views never reach the API branch (the form + edit/delete
  // controls are gated by !publicView).
  const handleSavePost = async (post: WallPost, isEdit: boolean) => {
    // Defense-in-depth: bail out of any concurrent submit immediately. React
    // batches the postSaving state flip, so a second click landing in the same
    // batch would otherwise slip through before the button disables.
    if (postSavingRef.current) return;
    postSavingRef.current = true;
    if (publicView) {
      postSavingRef.current = false;
      setWallPosts((prev) =>
        isEdit ? prev.map((p) => (p.id === post.id ? post : p)) : [...prev, post],
      );
      return;
    }
    setPostSaving(true);
    setPostError(null);
    const prev = wallPosts;
    const optimistic = isEdit
      ? prev.map((p) => (p.id === post.id ? post : p))
      : [...prev, post];
    setWallPosts(optimistic);
    try {
      if (isEdit) {
        await wallPostsApi.updatePost(post.id, post);
      } else {
        const created = await wallPostsApi.createPost(post);
        setWallPosts((cur) => cur.map((p) => (p.id === post.id ? created : p)));
      }
    } catch (err) {
      setWallPosts(prev);
      setPostError(err instanceof Error ? err.message : 'Failed to save post.');
    } finally {
      setPostSaving(false);
      postSavingRef.current = false;
    }
  };

  const handleDeletePost = async (id: string) => {
    if (publicView) {
      setWallPosts((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    setPostSaving(true);
    setPostError(null);
    const prev = wallPosts;
    const next = prev.filter((p) => p.id !== id);
    setWallPosts(next);
    try {
      await wallPostsApi.deletePost(id);
    } catch (err) {
      setWallPosts(prev);
      setPostError(err instanceof Error ? err.message : 'Failed to delete post.');
    } finally {
      setPostSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-mission-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { key: Tab; icon: React.ElementType; label: string }[] = [
    { key: 'trips', icon: MapPin, label: 'My Trips' },
    { key: 'wall', icon: MessageSquare, label: 'Wall Posts' },
    { key: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Nav */}
      <DashboardNav publicView={publicView} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1 mb-8 w-fit overflow-x-auto">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === key
                  ? 'bg-mission-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            publicView ? (
              /* Public, read-only view — no inputs, no upload, no save. Anon
                 visitors on /@:slug must never be able to mutate the profile. */
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-6">Profile Information</h2>
                <div className="space-y-5">
                  <div>
                    <span className="block text-sm font-medium text-gray-400 mb-1.5">Display Name</span>
                    {profileLoading ? (
                      <p className="text-gray-500">Loading…</p>
                    ) : (
                      <p className="text-white">{profileName || decodeURIComponent(slug ?? '')}</p>
                    )}
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-400 mb-1.5">Bio</span>
                    {profileLoading ? (
                      <p className="text-gray-500">Loading…</p>
                    ) : profileBio ? (
                      <p className="text-white whitespace-pre-line">{profileBio}</p>
                    ) : (
                      <p className="text-gray-500">No bio shared yet.</p>
                    )}
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-400 mb-1.5">Profile Photo</span>
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-6">Profile Information</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Display Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mission-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Bio</label>
                    <textarea
                      rows={4}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="Tell supporters about your mission…"
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mission-500 transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Profile Photo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                        onChange={handlePhotoPicked}
                        className="hidden"
                      />
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Image className="w-4 h-4" />
                          {uploading ? 'Uploading…' : 'Upload Photo'}
                        </button>
                        {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}
                      </div>
                    </div>
                  </div>
                  {profileError && (
                    <p className="text-sm text-red-400" role="alert">{profileError}</p>
                  )}
                  <div className="pt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={savingProfile}
                      className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-mission-500/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Save className="w-4 h-4" />
                      {savingProfile ? 'Saving…' : 'Save Profile'}
                    </button>
                    {profileSaved && !profileError && (
                      <span className="text-sm text-green-400">Saved ✓</span>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {/* Trips Tab */}
          {activeTab === 'trips' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">My Trips ({trips.length})</h2>
                {!publicView && (
                  <button
                    onClick={() => { setEditingTrip(null); setShowTripForm(true); }}
                    className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    Add Trip
                  </button>
                )}
              </div>

              {tripError && (
                <p className="text-sm text-red-400 mb-4" role="alert">{tripError}</p>
              )}

              {tripsLoading && (
                <p className="text-sm text-gray-500 mb-4">Loading trips…</p>
              )}

              {showTripForm && (
                <TripFormEditor
                  trip={editingTrip}
                  saving={tripSaving}
                  onSave={async (trip) => {
                    await handleSaveTrip(trip, Boolean(editingTrip));
                    setShowTripForm(false);
                    setEditingTrip(null);
                  }}
                  onCancel={() => { setShowTripForm(false); setEditingTrip(null); }}
                />
              )}

              <div className="space-y-4">
                {trips.length === 0 && !showTripForm && (
                  <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-2xl">
                    <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No trips yet. Add your first mission trip.</p>
                  </div>
                )}
                {trips.map((trip) => (
                  <div key={trip.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-start justify-between group">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{trip.title}</h3>
                        {trip.status && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            trip.status === 'upcoming' ? 'bg-mission-500/20 text-mission-300' : 'bg-green-500/20 text-green-300'
                          }`}>
                            {trip.status}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{trip.location}, {trip.country} — {trip.date}</p>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-1">{trip.description}</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                      {!publicView && (
                        <>
                          <button
                            onClick={() => { setEditingTrip(trip); setShowTripForm(true); }}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            disabled={tripSaving}
                            className="p-2 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-40"
                            aria-label="Delete trip"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wall Posts Tab */}
          {activeTab === 'wall' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Wall Posts ({wallPosts.length})</h2>
                {!publicView && (
                  <button
                    onClick={() => { setEditingPost(null); setShowPostForm(true); }}
                    className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    New Post
                  </button>
                )}
              </div>

              {postError && (
                <p className="text-sm text-red-400 mb-4" role="alert">{postError}</p>
              )}

              {wallLoading && (
                <p className="text-sm text-gray-500 mb-4">Loading posts…</p>
              )}

              {showPostForm && (
                <PostFormEditor
                  post={editingPost}
                  saving={postSaving}
                  onSave={async (post) => {
                    await handleSavePost(post, Boolean(editingPost));
                    setShowPostForm(false);
                    setEditingPost(null);
                  }}
                  onCancel={() => { setShowPostForm(false); setEditingPost(null); }}
                />
              )}

              <div className="space-y-4">
                {wallPosts.length === 0 && !showPostForm && (
                  <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-2xl">
                    <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No wall posts yet. Share an update with your supporters.</p>
                  </div>
                )}
                {wallPosts.map((post, i) => (
                  <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between group">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{post.title}</h3>
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs text-gray-500">Draft</span>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2">{post.content}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {!publicView && (
                          <>
                            <button
                              onClick={() => setSharingIdx(sharingIdx === i ? null : i)}
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                              aria-label="Share post"
                            >
                              <Share2 className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => { setEditingPost(post); setShowPostForm(true); }}
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              disabled={postSaving}
                              className="p-2 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Delete post"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {sharingIdx === i && (
                      <div className="border-t border-gray-700 pt-3">
                        <SocialShare
                          title={post.title}
                          text={post.content}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}

/* Trip Form sub-component */
function TripFormEditor({
  trip,
  saving = false,
  onSave,
  onCancel,
}: {
  trip: MissionTrip | null;
  saving?: boolean;
  onSave: (trip: MissionTrip) => void;
  onCancel: () => void;
}) {
  const emptyTrip: MissionTrip = {
    id: `new-${Date.now()}`,
    title: '',
    location: '',
    country: '',
    date: '',
    duration: '',
    description: '',
    story: '',
    images: [],
    highlights: [],
    ministryType: [],
    status: 'upcoming',
    coordinates: { lng: 0, lat: 0 },
  };

  const [form, setForm] = useState<MissionTrip>(trip || emptyTrip);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.location || !form.country) return;
    onSave(form);
  };

  const fields: { key: keyof MissionTrip; label: string }[] = [
    { key: 'title', label: 'Title' },
    { key: 'location', label: 'Location' },
    { key: 'country', label: 'Country' },
    { key: 'date', label: 'Date' },
    { key: 'duration', label: 'Duration' },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">{trip ? 'Edit Trip' : 'New Trip'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <input
              type="text"
              value={String(form[key] ?? '')}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mission-500 transition-colors"
            />
          </div>
        ))}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
        <select
          value={form.status ?? 'upcoming'}
          onChange={(e) => setForm({ ...form, status: e.target.value as 'upcoming' | 'completed' })}
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors"
        >
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mission-500 transition-colors resize-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <Save className="w-4 h-4" />
          {trip ? 'Update Trip' : 'Save Trip'}
        </button>
        <button type="button" onClick={onCancel} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-full text-sm transition-all">
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

/* Post Form sub-component */
function PostFormEditor({
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
    post || { id: `new-${Date.now()}`, title: '', content: '', date: new Date().toISOString().slice(0, 10) }
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
        <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mission-500 transition-colors"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-1">Content</label>
        <textarea
          rows={4}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mission-500 transition-colors resize-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <Save className="w-4 h-4" />
          {post ? 'Update Post' : 'Publish Post'}
        </button>
        <button type="button" onClick={onCancel} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-full text-sm transition-all">
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}
