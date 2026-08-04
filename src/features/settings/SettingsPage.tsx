import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, Lock, User, Palette, Bell, ArrowLeft } from 'lucide-react';
import { authClient } from '../auth/auth';

type Section = 'profile' | 'password' | 'appearance' | 'notifications';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data?.session) {
        navigate('/login');
      } else {
        setChecking(false);
      }
    }).catch(() => navigate('/login'));
  }, [navigate]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (checking) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-mission-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            <motion.div key="profile" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2"><User className="w-5 h-5 text-mission-500" />Profile Information</h2>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-medium text-gray-400 mb-1.5">First Name</label><input type="text" defaultValue="Keerthi" className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors" /></div>
                  <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Last Name</label><input type="text" className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Bio</label><textarea rows={3} defaultValue="Missionary sharing the Gospel across nations." className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors resize-none" /></div>
              </div>
            </motion.div>
          )}

          {activeSection === 'password' && (
            <motion.div key="password" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-mission-500" />Change Password</h2>
              <div className="space-y-4 max-w-md">
                <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Current Password</label><input type="password" className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors" /></div>
                <div><label className="block text-sm font-medium text-gray-400 mb-1.5">New Password</label><input type="password" className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors" /></div>
                <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Confirm New Password</label><input type="password" className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors" /></div>
              </div>
            </motion.div>
          )}

          {activeSection === 'appearance' && (
            <motion.div key="appearance" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2"><Palette className="w-5 h-5 text-mission-500" />Appearance</h2>
              <div className="space-y-6 max-w-md">
                <div><label className="block text-sm font-medium text-gray-400 mb-3">Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ value: 'dark', label: 'Dark', desc: 'Easy on the eyes' }, { value: 'light', label: 'Light', desc: 'Clean white theme' }].map((t) => (
                      <button key={t.value} className={`border-2 ${t.value === 'dark' ? 'border-mission-500 bg-mission-500/10' : 'border-gray-700 hover:border-gray-600'} rounded-xl p-4 text-left transition-all`}><div className="text-sm font-medium mb-0.5">{t.label}</div><div className="text-xs text-gray-500">{t.desc}</div></button>
                    ))}
                  </div>
                </div>
                <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Font</label><select className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-mission-500 transition-colors"><option>Inter</option><option>Geist</option><option>Satoshi</option></select></div>
              </div>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div key="notifications" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2"><Bell className="w-5 h-5 text-mission-500" />Notification Preferences</h2>
              <div className="space-y-4 max-w-md">
                {['New supporter', 'Prayer requests', 'Wall comments', 'Newsletter stats'].map((label) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
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

          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-800">
            <button onClick={handleSave} className="flex items-center gap-2 bg-mission-600 hover:bg-mission-700 px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-mission-500/30"><Save className="w-4 h-4" />Save Changes</button>
            {saved && <span className="text-sm text-green-400 animate-pulse">✓ Saved!</span>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
