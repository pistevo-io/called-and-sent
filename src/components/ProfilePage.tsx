import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import TripModal from './TripModal';
import AboutModal from './AboutModal';
import SupportModal from './SupportModal';
import Dashboard from './Dashboard';
import Footer from './Footer';
import { missionTrips } from '../data/missionTrips';
import type { MissionTrip } from '../types/MissionTrip';

export default function ProfilePage() {
  const [selectedTrip, setSelectedTrip] = useState<MissionTrip | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#about') {
        setIsAboutOpen(true);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);

    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleTripSelect = (trip: MissionTrip) => {
    setSelectedTrip(trip);
  };

  const handleCloseModal = () => {
    setSelectedTrip(null);
  };

  const handleOpenAbout = () => {
    setIsAboutOpen(true);
  };

  const handleCloseAbout = () => {
    setIsAboutOpen(false);
  };

  const handleOpenSupport = () => {
    setIsSupportOpen(true);
  };

  const handleCloseSupport = () => {
    setIsSupportOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl border-b border-gray-700 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative text-center">
            <a href="/" className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-sm">
              ← Called & Sent
            </a>
            <h1 className="text-4xl font-bold tracking-tight">Called & Sent</h1>
            <p className="text-gray-400 text-sm mt-2">"Therefore go and make disciples of all nations..." - Matthew 28:19-20</p>
            <button
              onClick={handleOpenAbout}
              className="absolute right-0 top-1/2 -translate-y-1/2"
              aria-label="About"
            >
              <div className="bg-gray-800 hover:bg-mission-600 border-2 border-gray-700 hover:border-mission-500 p-1 rounded-full shadow-lg hover:shadow-mission-500/50 transition-all duration-300 hover:scale-125">
                <img src="/mine.png" alt="Profile" className="w-8 h-8 rounded-full object-cover" />
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <Dashboard trips={missionTrips} onTripSelect={handleTripSelect} />
      </main>

      <button
        onClick={handleOpenSupport}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Partner With Me"
      >
        <div className="flex items-center gap-3 bg-gradient-to-r from-mission-600 to-mission-700 hover:from-mission-500 hover:to-mission-600 text-white px-5 py-4 rounded-full shadow-2xl hover:shadow-mission-500/50 transition-all duration-300 hover:scale-110">
          <Heart className="w-6 h-6 animate-pulse" fill="currentColor" />
          <span className="font-semibold hidden group-hover:inline-block transition-all duration-300">Partner With Me</span>
        </div>
      </button>

      <Footer />

      <TripModal trip={selectedTrip} onClose={handleCloseModal} />
      <AboutModal isOpen={isAboutOpen} onClose={handleCloseAbout} />
      <SupportModal isOpen={isSupportOpen} onClose={handleCloseSupport} />
    </div>
  );
}
