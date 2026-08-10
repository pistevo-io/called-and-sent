// Format a trip's location/country into a single display label.
//
// Dogfood fix (L2): the seed trip 'Southeast Asia Evangelism' had location
// 'Southeast Asia' AND country 'Southeast Asia', so every render site joined
// them as "Southeast Asia, Southeast Asia". For region-level trips where the
// location IS the region (no separate country), the value must be shown once.
// This helper dedupes identical location/country and tolerates either field
// being empty — so legacy D1 rows are fixed in the UI without a reseed.

import type { MissionTrip } from '../../shared/types/MissionTrip';

export function formatTripLocation(
  trip: Pick<MissionTrip, 'location' | 'country'>,
): string {
  const location = trip.location?.trim() ?? '';
  const country = trip.country?.trim() ?? '';

  if (!location && !country) return '';
  if (!country || location.toLowerCase() === country.toLowerCase()) return location;
  if (!location) return country;
  return `${location}, ${country}`;
}
