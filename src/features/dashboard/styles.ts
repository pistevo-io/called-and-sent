// Shared Tailwind class constants for the dashboard feature.
// Keeps form controls / cards consistent with the dark profile theme.

export const CARD =
  'bg-gray-800 border border-gray-700 rounded-2xl shadow-lg';

export const INPUT =
  'w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mission-500 focus:ring-1 focus:ring-mission-500 transition-colors';

export const LABEL = 'block text-sm font-medium text-gray-300 mb-1.5';

export const HINT = 'mt-1 text-xs text-gray-500';

export const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-mission-600 hover:bg-mission-500 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-mission-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed';

export const GHOST_BTN =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900';

export const DANGER_BTN =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-900';

// Per-type accent for wall post badges.
export const WALL_BADGE: Record<string, string> = {
  testimony: 'bg-blue-600/30 border border-blue-500 text-blue-300',
  prayer: 'bg-purple-600/30 border border-purple-500 text-purple-300',
  update: 'bg-mission-600/30 border border-mission-500 text-mission-300',
  praise: 'bg-amber-600/30 border border-amber-500 text-amber-300',
  scripture: 'bg-emerald-600/30 border border-emerald-500 text-emerald-300',
};
