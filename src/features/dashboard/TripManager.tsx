import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, MapPin, Calendar, AlertCircle } from 'lucide-react';
import type { MissionTrip } from '../../shared/types/MissionTrip';
import TripEditorModal from './TripEditorModal';
import { PRIMARY_BTN, GHOST_BTN, CARD } from './styles';

interface TripManagerProps {
  trips: MissionTrip[];
  onChange: (trips: MissionTrip[]) => void;
}

export default function TripManager({ trips, onChange }: TripManagerProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MissionTrip | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = [...trips].sort((a, b) => b.date.localeCompare(a.date));

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (trip: MissionTrip) => {
    setEditing(trip);
    setEditorOpen(true);
  };

  const handleSave = (trip: MissionTrip) => {
    const exists = trips.some((t) => t.id === trip.id);
    onChange(exists ? trips.map((t) => (t.id === trip.id ? trip : t)) : [...trips, trip]);
    setEditorOpen(false);
    setEditing(null);
  };

  const confirmDelete = (id: string) => {
    onChange(trips.filter((t) => t.id !== id));
    setConfirmDeleteId(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Mission Trips</h2>
          <p className="text-sm text-gray-400">{trips.length} trip{trips.length === 1 ? '' : 's'}</p>
        </div>
        <button type="button" onClick={openCreate} className={PRIMARY_BTN}>
          <Plus className="w-4 h-4" />
          New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <MapPin className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">No trips yet</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Add your first mission trip to start building your timeline.
          </p>
          <button type="button" onClick={openCreate} className={GHOST_BTN}>
            <Plus className="w-4 h-4" />
            Add Trip
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {sorted.map((trip) => (
              <motion.li
                key={trip.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className={`${CARD} p-4`}
              >
                {confirmDeleteId === trip.id ? (
                  <div className="flex items-center gap-3" role="alertdialog" aria-label="Confirm delete trip">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <span className="flex-1 text-sm text-gray-300">
                      Delete “{trip.title || 'Untitled trip'}”?
                    </span>
                    <button
                      type="button"
                      onClick={() => confirmDelete(trip.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {trip.images[0] ? (
                      <img
                        src={trip.images[0]}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {trip.title || 'Untitled trip'}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {trip.location || 'Unknown'}, {trip.country || '—'}
                        </span>
                        {trip.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {trip.date}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(trip)}
                        aria-label={`Edit ${trip.title || 'trip'}`}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-mission-400"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(trip.id)}
                        aria-label={`Delete ${trip.title || 'trip'}`}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <TripEditorModal
        open={editorOpen}
        trip={editing}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
