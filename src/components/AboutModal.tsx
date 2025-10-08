import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Globe, Mail, Phone, MapPin } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <div className="relative h-64 bg-gradient-to-r from-mission-900 via-mission-800 to-mission-900 overflow-hidden">
              <img
                src="/profile.jpeg"
                alt="Profile"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: '50% 15%' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-mission-900/80 via-mission-800/70 to-mission-900/80" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-5xl font-bold mb-3">About Me</h2>
                  <p className="text-xl text-mission-200">My Journey in Faith & Service</p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white bg-opacity-30 hover:bg-opacity-50 backdrop-blur-sm p-2 rounded-full transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="p-8 overflow-y-auto max-h-[calc(90vh-16rem)]">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-6 h-6 text-mission-600" fill="currentColor" />
                My Calling
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                I am called to share the Gospel of Jesus Christ with the nations. My journey is rooted in the Great Commission of Matthew 28:19-20: "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you."
              </p>
              <p className="text-gray-700 leading-relaxed">
                Through mission trips around the world, I serve those in need while sharing the transformative message of Christ's love. Each journey strengthens my faith and deepens my commitment to following God's call on my life.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-6 h-6 text-mission-600" />
                My Mission Work
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Medical Missions</h4>
                  <p className="text-gray-600 text-sm">Serving underserved communities with healthcare and medical support.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Youth Ministry</h4>
                  <p className="text-gray-600 text-sm">Empowering young people through education, mentorship, and spiritual guidance.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Community Building</h4>
                  <p className="text-gray-600 text-sm">Contributing to sustainable development through construction and community projects.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Disaster Relief</h4>
                  <p className="text-gray-600 text-sm">Providing emergency aid and recovery support in times of crisis.</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">My Faith Journey</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-mission-600 font-bold text-xl">+</span>
                  <div>
                    <span className="font-semibold">Faith-Centered:</span> Christ is at the heart of everything I do
                  </div>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-mission-600 font-bold text-xl">+</span>
                  <div>
                    <span className="font-semibold">Compassionate Service:</span> Meeting physical and spiritual needs with love
                  </div>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-mission-600 font-bold text-xl">+</span>
                  <div>
                    <span className="font-semibold">Cultural Respect:</span> Honoring and learning from the communities I serve
                  </div>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-mission-600 font-bold text-xl">+</span>
                  <div>
                    <span className="font-semibold">Lasting Relationships:</span> Building connections that transform lives
                  </div>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Connect With Me</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-mission-600" />
                  <a href="mailto:your.email@example.com" className="hover:text-mission-600 transition-colors">
                    your.email@example.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-mission-600" />
                  <a href="tel:+1234567890" className="hover:text-mission-600 transition-colors">
                    +1 (234) 567-890
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-mission-600 mt-0.5" />
                  <div>
                    Your City, State
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
