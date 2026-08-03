import { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';
import type { Profile } from './types';
import { MINISTRY_OPTIONS } from './types';
import { TextField, TextArea, ChipMultiSelect } from './FormControls';
import { PRIMARY_BTN, GHOST_BTN } from './styles';

interface ProfileEditorProps {
  profile: Profile;
  onSave: (profile: Profile) => Promise<void> | void;
}

const USERNAME_RE = /^[a-z0-9-]+$/;

export default function ProfileEditor({ profile, onSave }: ProfileEditorProps) {
  const [draft, setDraft] = useState<Profile>(profile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resync when the loaded profile changes (e.g. after first fetch).
  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setError(null);
  };

  const usernameValid = draft.username === '' || USERNAME_RE.test(draft.username);
  const previewUrl = draft.username
    ? `calledandsent.me/${draft.username}`
    : 'calledandsent.me/<username>';

  const handleSave = async () => {
    if (!usernameValid) {
      setError('Username may only contain lowercase letters, numbers, and hyphens.');
      return;
    }
    if (!draft.username) {
      setError('A username is required.');
      return;
    }
    try {
      await onSave(draft);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Profile</h2>
          <p className="text-sm text-gray-400">
            This is how supporters see you at{' '}
            <span className={usernameValid ? 'text-mission-300' : 'text-red-400'}>
              {previewUrl}
            </span>
          </p>
        </div>
        <button type="button" onClick={handleSave} className={PRIMARY_BTN}>
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 px-4 py-3 rounded-lg bg-red-900/40 border border-red-700 text-red-200 text-sm"
        >
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TextField
            id="displayName"
            label="Display Name"
            value={draft.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            placeholder="Jane Doe"
          />
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                calledandsent.me/
              </span>
              <input
                id="username"
                className={`w-full pl-36 pr-4 py-2.5 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
                  usernameValid
                    ? 'border-gray-700 focus:border-mission-500 focus:ring-mission-500'
                    : 'border-red-600 focus:border-red-500 focus:ring-red-500'
                }`}
                value={draft.username}
                onChange={(e) => set('username', e.target.value.toLowerCase().replace(/\s/g, '-'))}
                placeholder="jane-doe"
                aria-invalid={!usernameValid}
                aria-describedby={usernameValid ? undefined : 'username-error'}
              />
            </div>
            {!usernameValid && (
              <p id="username-error" className="mt-1 text-xs text-red-400">
                Lowercase letters, numbers, and hyphens only.
              </p>
            )}
          </div>
        </div>

        <TextField
          id="tagline"
          label="Tagline"
          value={draft.tagline}
          onChange={(e) => set('tagline', e.target.value)}
          placeholder="Sharing the hope of Christ in Honduras"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TextField
            id="location"
            label="Location"
            value={draft.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Nashville, TN"
          />
          <TextField
            id="instagram"
            label="Instagram"
            value={draft.instagram}
            onChange={(e) => set('instagram', e.target.value)}
            placeholder="@janedoe"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TextField
            id="heroImageUrl"
            label="Hero Image URL"
            type="url"
            value={draft.heroImageUrl}
            onChange={(e) => set('heroImageUrl', e.target.value)}
            placeholder="https://..."
          />
          <TextField
            id="profileImageUrl"
            label="Profile Image URL"
            type="url"
            value={draft.profileImageUrl}
            onChange={(e) => set('profileImageUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <TextArea
          id="calling"
          label="My Calling"
          value={draft.calling}
          onChange={(e) => set('calling', e.target.value)}
          placeholder="Why you do what you do..."
        />

        <TextArea
          id="testimony"
          label="My Testimony"
          value={draft.testimony}
          onChange={(e) => set('testimony', e.target.value)}
          placeholder="How you came to faith..."
        />

        <ChipMultiSelect
          id="ministryFocus"
          label="Ministry Focus"
          options={MINISTRY_OPTIONS}
          selected={draft.ministryFocus}
          onChange={(next) => set('ministryFocus', next)}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={handleSave} className={GHOST_BTN}>
          {saved ? <Check className="w-4 h-4" /> : null}
          {saved ? 'Saved' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
