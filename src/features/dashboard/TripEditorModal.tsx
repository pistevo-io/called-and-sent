import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { MissionTrip } from '../../shared/types/MissionTrip';
import { emptyTrip, MINISTRY_OPTIONS } from './types';
import Modal from './Modal';
import { TextField, TextArea, ChipMultiSelect } from './FormControls';
import { PRIMARY_BTN, GHOST_BTN, INPUT } from './styles';

interface TripEditorModalProps {
  open: boolean;
  trip: MissionTrip | null; // null => create
  onClose: () => void;
  onSave: (trip: MissionTrip) => void;
}

function cloneTrip(t: MissionTrip | null): MissionTrip {
  if (!t) return emptyTrip();
  return {
    ...t,
    coordinates: { ...t.coordinates },
    images: [...t.images],
    highlights: [...t.highlights],
    ministryType: [...t.ministryType],
  };
}

export default function TripEditorModal({
  open,
  trip,
  onClose,
  onSave,
}: TripEditorModalProps) {
  const [draft, setDraft] = useState<MissionTrip>(() => cloneTrip(trip));
  const [imageInput, setImageInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [errors, setErrors] = useState<{ title?: string; lng?: string; lat?: string }>({});

  useEffect(() => {
    if (open) {
      setDraft(cloneTrip(trip));
      setImageInput('');
      setHighlightInput('');
      setErrors({});
    }
  }, [open, trip]);

  const set = <K extends keyof MissionTrip>(key: K, value: MissionTrip[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const addImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    set('images', [...draft.images, url]);
    setImageInput('');
  };

  const removeImage = (idx: number) =>
    set('images', draft.images.filter((_, i) => i !== idx));

  const addHighlight = () => {
    const text = highlightInput.trim();
    if (!text) return;
    set('highlights', [...draft.highlights, text]);
    setHighlightInput('');
  };

  const removeHighlight = (idx: number) =>
    set('highlights', draft.highlights.filter((_, i) => i !== idx));

  const lng = Number(draft.coordinates.lng);
  const lat = Number(draft.coordinates.lat);

  const handleSave = () => {
    const nextErrors: typeof errors = {};
    if (!draft.title.trim()) nextErrors.title = 'Title is required.';
    if (draft.coordinates.lng !== 0 && (Number.isNaN(lng) || lng < -180 || lng > 180))
      nextErrors.lng = 'Longitude must be -180 to 180.';
    if (draft.coordinates.lat !== 0 && (Number.isNaN(lat) || lat < -90 || lat > 90))
      nextErrors.lat = 'Latitude must be -90 to 90.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({
      ...draft,
      title: draft.title.trim(),
      images: draft.images.filter(Boolean),
      highlights: draft.highlights.filter(Boolean),
      ministryType: draft.ministryType.filter(Boolean),
      peopleReached: draft.peopleReached ? Number(draft.peopleReached) : undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={trip ? 'Edit Trip' : 'New Trip'}
      footer={
        <>
          <button type="button" onClick={onClose} className={GHOST_BTN}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} className={PRIMARY_BTN}>
            <Plus className="w-4 h-4" />
            {trip ? 'Save Changes' : 'Create Trip'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          id="trip-title"
          label="Title"
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Guaimaca Medical Mission"
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p role="alert" className="-mt-2 text-xs text-red-400">
            {errors.title}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            id="trip-location"
            label="Location"
            value={draft.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Guaimaca"
          />
          <TextField
            id="trip-country"
            label="Country"
            value={draft.country}
            onChange={(e) => set('country', e.target.value)}
            placeholder="Honduras"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField
            id="trip-date"
            label="Date"
            value={draft.date}
            onChange={(e) => set('date', e.target.value)}
            placeholder="September 2026"
          />
          <TextField
            id="trip-duration"
            label="Duration"
            value={draft.duration}
            onChange={(e) => set('duration', e.target.value)}
            placeholder="1 week"
          />
          <TextField
            id="trip-people"
            label="People Reached"
            type="number"
            min={0}
            value={draft.peopleReached ?? ''}
            onChange={(e) =>
              set('peopleReached', e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="120"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            id="trip-lng"
            label="Longitude"
            type="number"
            step="any"
            value={draft.coordinates.lng}
            onChange={(e) =>
              set('coordinates', { ...draft.coordinates, lng: Number(e.target.value) })
            }
            aria-invalid={!!errors.lng}
 />
          {errors.lng && (
            <p role="alert" className="text-xs text-red-400">
              {errors.lng}
            </p>
          )}
          <TextField
            id="trip-lat"
            label="Latitude"
            type="number"
            step="any"
            value={draft.coordinates.lat}
            onChange={(e) =>
              set('coordinates', { ...draft.coordinates, lat: Number(e.target.value) })
            }
            aria-invalid={!!errors.lat}
          />
          {errors.lat && (
            <p role="alert" className="text-xs text-red-400">
              {errors.lat}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="trip-status" className="block text-sm font-medium text-gray-300 mb-1.5">
            Status
          </label>
          <select
            id="trip-status"
            className={INPUT}
            value={draft.status ?? 'completed'}
            onChange={(e) => set('status', e.target.value as MissionTrip['status'])}
          >
            <option value="completed">Completed</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>

        <TextArea
          id="trip-description"
          label="Short Description"
          value={draft.description}
          onChange={(e) => set('description', e.target.value)}
        />
        <TextArea
          id="trip-story"
          label="Story"
          value={draft.story}
          onChange={(e) => set('story', e.target.value)}
        />

        <div>
          <span className="block text-sm font-medium text-gray-300 mb-1.5">Images</span>
          <ul className="space-y-2 mb-2">
            {draft.images.map((img, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="flex-1 truncate">{img}</span>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="text-red-400 hover:text-red-300 text-xs"
                  aria-label={`Remove image ${idx + 1}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="url"
              className={INPUT}
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
              placeholder="https://...image.jpg"
              aria-label="Add image URL"
            />
            <button type="button" onClick={addImage} className={GHOST_BTN}>
              Add
            </button>
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-gray-300 mb-1.5">Highlights</span>
          <ul className="space-y-2 mb-2">
            {draft.highlights.map((h, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="flex-1">{h}</span>
                <button
                  type="button"
                  onClick={() => removeHighlight(idx)}
                  className="text-red-400 hover:text-red-300 text-xs"
                  aria-label={`Remove highlight ${idx + 1}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              className={INPUT}
              value={highlightInput}
              onChange={(e) => setHighlightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
              placeholder="A memorable moment..."
              aria-label="Add highlight"
            />
            <button type="button" onClick={addHighlight} className={GHOST_BTN}>
              Add
            </button>
          </div>
        </div>

        <ChipMultiSelect
          id="trip-ministry"
          label="Ministry Types"
          options={MINISTRY_OPTIONS}
          selected={draft.ministryType}
          onChange={(next) => set('ministryType', next)}
        />
      </div>
    </Modal>
  );
}
