import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Map, BookOpen, LogOut, Loader2 } from 'lucide-react';
import ProfileEditor from './ProfileEditor';
import TripManager from './TripManager';
import WallManager from './WallManager';
import { getProfile, saveProfile, getTrips, saveTrips, getWallPosts, saveWallPosts } from './store';
import type { Profile, WallPost } from './types';
import type { MissionTrip } from '../../shared/types/MissionTrip';
import { authClient } from '../../features/auth/auth';
import { PRIMARY_BTN } from './styles';

type TabId = 'profile' | 'trips' | 'wall';

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'trips', label: 'Trips', icon: Map },
  { id: 'wall', label: 'Wall', icon: BookOpen },
];

export default function EditorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [trips, setTrips] = useState<MissionTrip[]>([]);
  const [wall, setWall] = useState<WallPost[]>([]);
  const [checking, setChecking] = useState(true);
  const tablistId = useId();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await authClient.getSession();
        if (!data?.session) {
          navigate('/login');
          return;
        }
        const [p, t, w] = await Promise.all([getProfile(), getTrips(), getWallPosts()]);
        if (cancelled) return;
        setProfile(p);
        setTrips(t);
        setWall(w);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
        navigate('/login');
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <Loader2 className="w-8 h-8 text-mission-400 animate-spin" />
        <span className="sr-only">Loading your dashboard…</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black px-4">
        <div className="text-center max-w-sm">
          <Lock className="w-12 h-12 text-mission-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sign in required</h1>
          <p className="text-gray-400 mb-6">
            You need to be signed in to edit your missionary profile, trips, and wall.
          </p>
          <a href="/login" className={PRIMARY_BTN + ' mx-auto'}>
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  const handleProfileSave = async (next: Profile) => {
    await saveProfile(next);
    setProfile(next);
  };

  const handleTripsChange = async (next: MissionTrip[]) => {
    setTrips(next);
    await saveTrips(next);
  };

  const handleWallChange = async (next: WallPost[]) => {
    setWall(next);
    await saveWallPosts(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Missionary Dashboard</h1>
            <p className="text-xs text-gray-400">@{profile.username || 'unnamed'}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await authClient.signOut();
              navigate('/');
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="flex gap-1 border-b border-gray-800"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`${tablistId}-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`${tablistId}-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => {
                  const idx = TABS.findIndex((t) => t.id === tab.id);
                  let nextIdx = idx;
                  if (e.key === 'ArrowRight') nextIdx = (idx + 1) % TABS.length;
                  else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + TABS.length) % TABS.length;
                  else return;
                  e.preventDefault();
                  setActiveTab(TABS[nextIdx].id);
                  const el = document.getElementById(`${tablistId}-tab-${TABS[nextIdx].id}`);
                  el?.focus();
                }}
                className={`-mb-px flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mission-400 ${
                  selected
                    ? 'border-mission-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <main className="py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              role="tabpanel"
              id={`${tablistId}-panel-${activeTab}`}
              aria-labelledby={`${tablistId}-tab-${activeTab}`}
            >
              {activeTab === 'profile' && (
                <ProfileEditor profile={profile} onSave={handleProfileSave} />
              )}
              {activeTab === 'trips' && (
                <TripManager trips={trips} onChange={handleTripsChange} />
              )}
              {activeTab === 'wall' && <WallManager posts={wall} onChange={handleWallChange} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
