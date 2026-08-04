import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import TripModal from './TripModal';
import AboutModal from './AboutModal';
import SupportModal from './SupportModal';
import DashboardPage from './DashboardPage';
import Footer from '../../shared/ui/Footer';
import type { MissionTrip } from '../../shared/types/MissionTrip';

// Public missionary page — viewable by anyone (logged in or not).
// DashboardPage owns the single top nav (incl. auth-aware controls), so this
// page only provides the public body + modals + footer. The outer container is
// allowed to grow past the viewport so the trip list can scroll.
export default function ProfilePage() {
  const [selectedTrip, setSelectedTrip] = useState<MissionTrip | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#about') setIsAboutOpen(true);
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <main className="flex-1">
        <DashboardPage publicView defaultTab="profile" />
      </main>

      <button
        onClick={() => setIsSupportOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Partner With Me"
      >
        <div className="flex items-center gap-3 bg-gradient-to-r from-mission-600 to-mission-700 hover:from-mission-500 hover:to-mission-600 text-white px-5 py-4 rounded-full shadow-2xl hover:shadow-mission-500/50 transition-all duration-300 hover:scale-110">
          <Heart className="w-6 h-6 animate-pulse" fill="currentColor" />
          <span className="font-semibold hidden group-hover:inline-block transition-all duration-300">Partner With Me</span>
        </div>
      </button>

      <Footer />

      <TripModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}
