import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, Lock, User, Palette, Bell, ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react';
import { authClient } from '../auth/auth';
import { useTheme } from '../../shared/theme/ThemeProvider';
import {
  fetchSettings,
  updateProfile,
  changePassword,
  updateTheme,
  type UserProfile,
  type SettingsResponse,
} from './settingsApi';

type Section = 'profile' | 'password' | 'appearance' | 'notifications';

interface NotificationPref {
  key: string;
  label: string;
  desc: string;
  defaultOn: boolean;
}

const NOTIFICATIONS: NotificationPref[] = [
  { key: 'new_supporter', label: 'New supporter', desc: 'When someone subscribes to your updates', defaultOn: true },
  { key: 'prayer_requests', label: 'Prayer requests', desc: 'When someone sends a prayer request', defaultOn: true },
  { key: 'wall_comments', label: 'Wall comments', desc: 'When someone comments on your wall posts', defaultOn: true },
  { key: 'newsletter_stats', label: 'Newsletter stats', desc: 'Weekly digest of newsletter performance', defaultOn: false },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [checking, setChecking] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Profile form state
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [authName, setAuthName] = useState(''); // mirrored into Better Auth user.name

  // Password form state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);

  // Notifications state
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATIONS.map((n) => [n.key, n.defaultOn])),
  );

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data?.session) {
        navigate('/login');
      } else {
        setChecking(false);
      }
    }).catch(() => navigate('/login'));
  }, [navigate]);

  useEffect(() => {
    if (checking) return;
    let cancelled = false;
    fetchSettings()
      .then((res: SettingsResponse) => {
        if (cancelled) return;
        setProfile(res.profile ?? {});
        setAuthName(res.user.name ?? '');
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [checking]);

  function flashSaved(msg: string) {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(null), 2500);
  }

  async function handleSaveProfile() {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ...profile };
      if (authName.trim()) payload.name = authName.trim();
      await updateProfile(payload as Partial<UserProfile>);
      flashSaved('Profile saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    setPwError(null);
    setPwSaved(false);
    if (newPw.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match');
      return;
    }
    if (!currentPw) {
      setPwError('Enter your current password');
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPw, newPw);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  async function handleThemeSelect(next: 'dark' | 'light') {
    setTheme(next);
    try {
      await updateTheme(next);
    } catch (err) {
      // Theme still applies locally; surface a soft warning.
      setError(err instanceof Error ? err.message : 'Failed to persist theme');
    }
  }

  function toggleNotif(key: string) {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (checking) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-mission-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-2.5 bg-[var(--cas-input-bg)] border border-[var(--cas-border)] rounded-lg text-[var(--cas-text)] placeholder-[var(--cas-text-muted)] focus:outline-none focus:border-mission-500 transition-colors';
  const labelClass = 'block text-sm font-medium text-[var(--cas-text-muted)] mb-1.5';
  const panelClass =
    'bg-[var(--cas-surface)] border border-[var(--cas-border)] rounded-2xl p-6 sm:p-8';

  const sections: { key: Section; icon: ReactNode; label: string }[] = [
    { key: 'profile', icon: <User className="w-4 h-4" />, label: 'Profile' },
    { key: 'password', icon: <Lock className="w-4 h-4" />, label: 'Password' },
    { key: 'appearance', icon: <Palette className="w-4 h-4" />, label: 'Appearance' },
    { key: 'notifications', icon: <Bell className="w-4 h-4" />, label: 'Notifications' },
  ];

  return (
    <div className="min-h-screen bg-[var(--cas-bg)] text-[var(--cas-text)]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[var(--cas-bg)]/95 backdrop-blur border-b border-[var(--cas-border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-[var(--cas-text-muted)] hover:text-[var(--cas-text)] transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="text-sm font-medium text-[var(--cas-text-muted)]">Settings</span>
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-8">Settings</h1>

          {/* Section tabs */}
          <div className="flex flex-wrap gap-1.5 bg-[var(--cas-surface)] rounded-xl p-1 mb-8">
            {sections.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                aria-pressed={activeSection === key}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === key
                    ? 'bg-mission-600 text-white shadow-lg'
                    : 'text-[var(--cas-text-muted)] hover:text-[var(--cas-text)]'
                }`}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={panelClass}
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-mission-500" />
                Profile Information
              </h2>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Display Name</label>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className={inputClass}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Username</label>
                    <input
                      type="text"
                      value={profile.username ?? ''}
                      onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                      className={inputClass}
                      placeholder="username"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Bio</label>
                  <textarea
                    rows={3}
                    value={profile.bio ?? ''}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    className={`${inputClass} resize-none`}
                    placeholder="Share your mission with supporters"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Location</label>
                    <input
                      type="text"
                      value={profile.location ?? ''}
                      onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                      className={inputClass}
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Church</label>
                    <input
                      type="text"
                      value={profile.church ?? ''}
                      onChange={(e) => setProfile((p) => ({ ...p, church: e.target.value }))}
                      className={inputClass}
                      placeholder="Home church"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Password Section */}
          {activeSection === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={panelClass}
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-mission-500" />
                Change Password
              </h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className={labelClass}>Current Password</label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className={inputClass}
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className={labelClass}>New Password</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </div>
                {pwError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {pwError}
                  </div>
                )}
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 disabled:opacity-60 px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-mission-500/30"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Update Password
                </button>
                {pwSaved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-400">
                    <Check className="w-4 h-4" /> Password updated!
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={panelClass}
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5 text-mission-500" />
                Appearance
              </h2>
              <div className="space-y-6 max-w-md">
                <div>
                  <label className={labelClass}>Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'dark', label: 'Dark', desc: 'Easy on the eyes' },
                      { value: 'light', label: 'Light', desc: 'Clean white theme' },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => handleThemeSelect(t.value as 'dark' | 'light')}
                        aria-pressed={theme === t.value}
                        className={`border-2 ${
                          theme === t.value
                            ? 'border-mission-500 bg-mission-500/10'
                            : 'border-[var(--cas-border)] hover:border-[var(--cas-text-muted)]'
                        } rounded-xl p-4 text-left transition-all`}
                      >
                        <div className="text-sm font-medium mb-0.5">{t.label}</div>
                        <div className="text-xs text-[var(--cas-text-muted)]">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={panelClass}
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-mission-500" />
                Notification Preferences
              </h2>
              <div className="space-y-4 max-w-md">
                {NOTIFICATIONS.map((notif) => (
                  <div
                    key={notif.key}
                    className="flex items-center justify-between py-3 border-b border-[var(--cas-border)] last:border-0"
                  >
                    <div>
                      <div className="text-sm font-medium">{notif.label}</div>
                      <div className="text-xs text-[var(--cas-text-muted)] mt-0.5">{notif.desc}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifPrefs[notif.key] ?? false}
                        onChange={() => toggleNotif(notif.key)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[var(--cas-surface-2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-mission-600" />
                    </label>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Save button (profile) */}
          {activeSection === 'profile' && (
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[var(--cas-border)]">
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 disabled:opacity-60 px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-mission-500/30"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
              {savedMsg && (
                <span className="flex items-center gap-1.5 text-sm text-green-400 animate-pulse">
                  <Check className="w-4 h-4" /> {savedMsg}
                </span>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
