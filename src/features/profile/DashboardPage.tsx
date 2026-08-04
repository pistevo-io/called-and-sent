import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, MapPin, Edit3, Plus, Trash2, Save, X, MessageSquare,
  Calendar, Image, Upload, Settings, Share2
} from 'lucide-react';
import { useRequireAuth } from '../auth/useAuthGuards';
import { missionTrips as seedTrips } from '../../shared/data/missionTrips';
import type { MissionTrip } from '../../shared/types/MissionTrip';
import SocialShare from '../../shared/ui/SocialShare';

type Tab = 'profile' | 'trips' | 'wall' | 'settings';

interface DashboardPageProps {
  /** Public, read-only view of a missionary's profile — no auth, no editing. */
  publicView?: boolean;
  /** Tab to open initially. */
  defaultTab?: Tab;
}

interface WallPostForm {
  title: string;
  content: string;
}

export default function DashboardPage({ publicView = false, defaultTab = 'trips' }: DashboardPageProps) {
  const auth = useRequireAuth(!publicView);
  // Owner view blocks while the session resolves or until the anon redirect fires;
  // public view is always open.
  const checking = !publicView && auth.state !== 'authed';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [trips, setTrips] = useState<MissionTrip[]>([]);
  const [wallPosts, setWallPosts] = useState<WallPostForm[]>([]);
  const [editingTrip, setEditingTrip] = useState<MissionTrip | null>(null);
  const [editingPost, setEditingPost] = useState<WallPostForm | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [sharingIdx, setSharingIdx] = useState<number | null>(null);

  useEffect(() => {
    // Seed trips from shared data + any user-added localStorage trips
    const localTrips = JSON.parse(localStorage.getItem('editor_trips') || '[]') as MissionTrip[];
    const localIds = new Set(localTrips.map((t: MissionTrip) => t.id));
    const merged = [...seedTrips, ...localTrips.filter((t: MissionTrip) => !localIds.has(t.id) || seedTrips.some((s) => s.id === t.id))];
    // Prefer local over seed when ids match (edited trips)
    const deduped = merged.reduce<MissionTrip[]>((acc, t) => {
      const existing = acc.findIndex((a) => a.id === t.id);
      if (existing >= 0) acc[existing] = t;
      else acc.push(t);
      return acc;
    }, []);
    setTrips(deduped);

    const savedPosts = localStorage.getItem('editor_posts');
    if (savedPosts) setWallPosts(JSON.parse(savedPosts));
  }, []);

  const saveTrips = (updated: MissionTrip[]) => {
    setTrips(updated);
    localStorage.setItem('editor_trips', JSON.stringify(updated));
  };

  const savePosts = (updated: WallPostForm[]) => {
    setWallPosts(updated);
    localStorage.setItem('editor_posts', JSON.stringify(updated));
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
    ...(publicView ? [] : [{ key: 'settings' as const, icon: Settings, label: 'Settings' }]),
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            Called <span className="text-mission-500">&</span> Sent
          </Link>
          {publicView ? (
            <a href="/login" className="text-sm font-medium text-mission-400 hover:text-mission-300 transition-colors">
              Sign In
            </a>
          ) : (
            <Link to="/settings" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          )}
        </div>
      </nav>

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
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-6">Profile Information</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    defaultValue="Keerthi"
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mission-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Bio</label>
                  <textarea
                    rows={4}
                    defaultValue="Missionary sharing the Gospel across nations."
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mission-500 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
                      <Image className="w-4 h-4" />
                      Upload Photo
                    </button>
                  </div>
                </div>
                <div className="pt-4">
                  <button className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-mission-500/30">
                    <Save className="w-4 h-4" />
                    Save Profile
                  </button>
                </div>
              </div>
            </div>
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

              {showTripForm && (
                <TripFormEditor
                  trip={editingTrip}
                  onSave={(trip) => {
                    if (editingTrip) {
                      saveTrips(trips.map(t => t.id === editingTrip.id ? trip : t));
                    } else {
                      saveTrips([...trips, trip]);
                    }
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
                            onClick={() => saveTrips(trips.filter((t) => t.id !== trip.id))}
                            className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
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

              {showPostForm && (
                <PostFormEditor
                  post={editingPost}
                  onSave={(post) => {
                    if (editingPost) {
                      savePosts(wallPosts.map(p => p === editingPost ? post : p));
                    } else {
                      savePosts([...wallPosts, post]);
                    }
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
                              onClick={() => savePosts(wallPosts.filter((_, j) => j !== i))}
                              className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
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

          {/* Settings Tab */}
          {activeTab === 'settings' && !publicView && (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-6">Settings</h2>
              <div className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue="missionary@example.com"
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Change Password</label>
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mission-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Theme</label>
                  <select className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-mission-500/30">
                    <Save className="w-4 h-4" />
                    Save Settings
                  </button>
                </div>
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
  onSave,
  onCancel,
}: {
  trip: MissionTrip | null;
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
        <button type="submit" className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 px-5 py-2 rounded-full text-sm font-semibold transition-all">
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
  onSave,
  onCancel,
}: {
  post: WallPostForm | null;
  onSave: (post: WallPostForm) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<WallPostForm>(
    post || { title: '', content: '' }
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
        <button type="submit" className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 px-5 py-2 rounded-full text-sm font-semibold transition-all">
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
