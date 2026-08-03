import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Clock, Users, Heart } from 'lucide-react';
import type { MissionTrip } from '../../shared/types/MissionTrip';

interface TripModalProps {
  trip: MissionTrip | null;
  onClose: () => void;
}

export default function TripModal({ trip, onClose }: TripModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!trip) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % trip.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + trip.images.length) % trip.images.length);
  };

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
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <div className="relative h-72 sm:h-96 bg-gray-900">
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                src={trip.images[currentImageIndex]}
                alt={`${trip.location} - Image ${currentImageIndex + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

              <div className="absolute bottom-6 left-6 text-white">
                <h2 className="text-2xl sm:text-4xl font-bold mb-2">{trip.title}</h2>
                <div className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5" />
                  <span>{trip.location}, {trip.country}</span>
                </div>
              </div>

              {trip.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 backdrop-blur-sm p-3 rounded-full transition-all"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 backdrop-blur-sm p-3 rounded-full transition-all"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
                    {currentImageIndex + 1} / {trip.images.length}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white bg-opacity-30 hover:bg-opacity-50 backdrop-blur-sm p-2 rounded-full transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[60vh] sm:max-h-[500px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5 text-mission-600" />
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-semibold">{trip.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5 text-mission-600" />
                <div>
                  <div className="text-xs text-gray-500">Duration</div>
                  <div className="font-semibold">{trip.duration}</div>
                </div>
              </div>
              {trip.peopleReached && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-5 h-5 text-mission-600" />
                  <div>
                    <div className="text-xs text-gray-500">People Reached</div>
                    <div className="font-semibold">{trip.peopleReached.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Mission Story</h3>
              <div className="prose prose-lg max-w-none">
                {trip.story.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-gray-700 leading-loose mb-6 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div className="mb-8 pb-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-mission-600" fill="currentColor" />
                Highlights
              </h3>
              <ul className="space-y-3">
                {trip.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <span className="text-mission-600 font-bold text-lg">+</span>
                    <span className="leading-relaxed">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Ministry Types</h3>
              <div className="flex flex-wrap gap-2">
                {trip.ministryType.map((type, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-mission-100 text-mission-700 rounded-full text-sm font-medium"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
