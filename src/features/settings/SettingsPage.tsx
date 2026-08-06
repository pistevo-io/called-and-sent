import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Save,
  Lock,
  User,
  Palette,
  Bell,
  ArrowLeft,
  Loader2,
  Globe,
  Instagram,
  Facebook,
  HandHeart,
} from 'lucide-react';
import { useSessionState } from '../auth/useAuthGuards';
import { resolveProfileSlug } from '../auth/authHelpers';
import {
  getProfile,
  upsertProfile,
  sanitizeProfileLinks,
  type ProfileLinkKey,
  type ProfileLinks,
} from '../../shared/api/profile';

type Section = 'profile' | 'password' | 'appearance' | 'notifications';

// Display metadata + icon for each slot of the links block (capped at 4).
const LINK_FIELDS: Array<{
  key: ProfileLinkKey;
  label: string;
  icon: React.ElementType;
  placeholder: string;
}> = [
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://example.org' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/your-handle' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/your-page' },
  { key: 'giving', label: 'Giving / Donate', icon: HandHeart, placeholder: 'https://give.example.org/you' },
];

export default function SettingsPage() {
  const { state: sessionState, user } = useSessionState();
  const [activeSection, setActiveSection] = useState<Section>('profile');

  // Profile form state (identity + links). First/last are persisted server-side
  // as a single display_name; we split on load and rejoin on save. Links are the
  // four URL slots of the linked "links block".
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({
    website: '',
    instagram: '',
    facebook: '',
    giving: '',
  });

  // Field-level validation feedback for the links block (empty = valid/unset).
  const [linkErrors, setLinkErrors] = useState<Record<string, boolean>>({});

  // Network / status state.
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Resolve the owner's profile handle from the Better Auth session once it's
  // loaded. Falls back to `k` (the seeded owner slug) like the rest of the app.
  const slug = sessionState !== 'checking' ? resolveProfileSlug(user) : null;

  // Load the owner's profile on mount and hydrate the form.
  useEffect(() => {
    if (!slug) return;
    let active = true;

    (async () => {
      setLoading(true);
      setLoadError(null);
      let profile;
      try {
        profile = await getProfile(slug);
      } catch (err) {
        if (active) {
          setLoadError(err instanceof Error ? err.message : 'Could not load your profile');
          setLoading(false);
        }
        return;
      }
      if (!active) return;
      if (profile) {
        const displayName = profile.displayName ?? '';
        const [first = '', ...rest] = displayName.split(' ');
        setFirstName(first);
        setLastName(rest.join(' '));
        setBio(profile.bio ?? '');
        // Hydrate the four link slots from the persisted links block.
        const nextLinks: Record<string, string> = { ...linkInputs };
        for (const { key } of LINK_FIELDS) {
          nextLinks[key] = profile.links?.[key] ?? '';
        }
        setLinkInputs(nextLinks);
      } else {
        // No profile row yet — start from an empty form.
        setFirstName('');
        setLastName('');
        setBio('');
        setLinkInputs({ website: '', instagram: '', facebook: '', giving: '' });
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
    // Resolve once per loaded session; the slug is stable for the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /** Validate the four link inputs on change; flag invalid URLs in red. */
  const handleLinkChange = (key: ProfileLinkKey, value: string) => {
    setLinkInputs((prev) => ({ ...prev, [key]: value }));
    if (value.trim() === '') {
      setLinkErrors((prev) => ({ ...prev, [key]: false }));
      return;
    }
    try {
      const url = new URL(value.trim());
      setLinkErrors((prev) => ({
        ...prev,
        [key]: !(url.protocol === 'http:' || url.protocol === 'https:') || !url.hostname,
      }));
    } catch {
      setLinkErrors((prev) => ({ ...prev, [key]: true }));
    }
  };

  const handleSave = async () => {
    if (activeSection !== 'profile' || saving) return;

    // Only valid URLs persist (matching the server sanitizer). The links block
    // is capped at the four known slots, so at most 4 links can be saved.
    const links: ProfileLinks = sanitizeProfileLinks({ ...linkInputs });

    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await upsertProfile(
        {
          displayName: displayName || undefined,
          bio: bio.trim(),
          links,
        },
        'PUT',
      );
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save your profile');
    } finally {
      setSaving(false);
    }
  };

  const sections: { key: Section; icon: React.ElementType; label: string }[] = [
    { key: 'profile', icon: User, label: 'Profile' },
    { key: 'password', icon: Lock, label: 'Password' },
    { key: 'appearance', icon: Palette, label: 'Appearance' },
    { key: 'notifications', icon: Bell, label: 'Notifications' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="text-sm font-medium text-gray-300">Settings</span>
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-8">Settings</h1>

          <div className="flex flex-wrap gap-1.5 bg-gray-800 rounded-xl p-1 mb-8">
            {sections.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === key
                    ? 'bg-mission-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {activeSection === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-mission-500" />
                Profile Information
              </h2>

              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-mission-500" />
                  <span className="text-sm">Loading your profile…</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {loadError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-300 mb-4">
                      {loadError}. You can still edit below — saving will create your profile.
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="settings-firstName" className="block text-sm font-medium text-gray-400 mb-1.5">
                          First Name
                        </label>
                        <input
                          id="settings-firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label htmlFor="settings-lastName" className="block text-sm font-medium text-gray-400 mb-1.5">
                          Last Name
                        </label>
                        <input
                          id="settings-lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="settings-bio" className="block text-sm font-medium text-gray-400 mb-1.5">
                        Bio
                      </label>
                      <textarea
                        id="settings-bio"
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell supporters about your calling and mission."
                        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Links block — exactly four named slots (the cap). */}
                  <div className="pt-2 border-t border-gray-700/60">
                    <h3 className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-mission-500" />
                      Links
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Up to four links for your public profile — website, socials, and a giving page. HTTPS URLs only.
                    </p>
                    <div className="space-y-4">
                      {LINK_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
                        <div key={key}>
                          <label
                            htmlFor={`settings-link-${key}`}
                            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 mb-1.5"
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </label>
                          <input
                            id={`settings-link-${key}`}
                            type="url"
                            value={linkInputs[key]}
                            onChange={(e) => handleLinkChange(key, e.target.value)}
                            placeholder={placeholder}
                            aria-invalid={linkErrors[key] || undefined}
                            className={`w-full px-4 py-2.5 bg-gray-900 border rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors ${
                              linkErrors[key] ? 'border-red-500/70' : 'border-gray-700'
                            }`}
                          />
                          {linkErrors[key] && (
                            <p className="mt-1 text-xs text-red-400">Enter a valid http(s) URL, or leave blank.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {saveError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-300">
                      {saveError}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-mission-500" />
                Change Password
              </h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="settings-current-password" className="block text-sm font-medium text-gray-400 mb-1.5">
                    Current Password
                  </label>
                  <input
                    id="settings-current-password"
                    type="password"
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="settings-new-password" className="block text-sm font-medium text-gray-400 mb-1.5">
                    New Password
                  </label>
                  <input
                    id="settings-new-password"
                    type="password"
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="settings-confirm-password" className="block text-sm font-medium text-gray-400 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    id="settings-confirm-password"
                    type="password"
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'appearance' && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5 text-mission-500" />
                Appearance
              </h2>
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'dark', label: 'Dark', desc: 'Easy on the eyes' },
                      { value: 'light', label: 'Light', desc: 'Clean white theme' },
                    ].map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        aria-pressed={t.value === 'dark'}
                        className={`border-2 ${
                          t.value === 'dark'
                            ? 'border-mission-500 bg-mission-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        } rounded-xl p-4 text-left transition-all`}
                      >
                        <div className="text-sm font-medium mb-0.5">{t.label}</div>
                        <div className="text-xs text-gray-500">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="settings-font" className="block text-sm font-medium text-gray-400 mb-1.5">
                    Font
                  </label>
                  <select
                    id="settings-font"
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors"
                  >
                    <option>Inter</option>
                    <option>Geist</option>
                    <option>Satoshi</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-mission-500" />
                Notification Preferences
              </h2>
              <div className="space-y-4 max-w-md">
                {['New supporter', 'Prayer requests', 'Wall comments', 'Newsletter stats'].map((label) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0"
                  >
                    <div className="text-sm font-medium">{label}</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-mission-600" />
                    </label>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Save bar — only profile fields (identity + links) are persisted server-side today. */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-800">
            <button
              onClick={handleSave}
              disabled={activeSection !== 'profile' || loading || saving}
              className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all shadow-lg ${
                activeSection !== 'profile' || loading || saving
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-mission-600 hover:bg-mission-700 text-white hover:scale-105 hover:shadow-mission-500/30'
              }`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && <span className="text-sm text-green-400 animate-pulse">✓ Saved!</span>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
