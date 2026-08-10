// Unit tests for the trip location/country display label.
// Regression guard: seed trip 'Southeast Asia Evangelism' (id '7') had
// location === country, which previously rendered as "Southeast Asia,
// Southeast Asia" on every render site.
import { describe, it, expect } from 'vitest';
import { formatTripLocation } from './tripLocation';

describe('formatTripLocation', () => {
  it('joins distinct location and country with a comma', () => {
    expect(formatTripLocation({ location: 'Guaimaca', country: 'Honduras' })).toBe(
      'Guaimaca, Honduras',
    );
  });

  it('shows the value once when location and country are identical', () => {
    expect(
      formatTripLocation({ location: 'Southeast Asia', country: 'Southeast Asia' }),
    ).toBe('Southeast Asia');
  });

  it('dedupes case-insensitively', () => {
    expect(
      formatTripLocation({ location: 'Bangkok', country: 'bangkok' }),
    ).toBe('Bangkok');
  });

  it('tolerates whitespace around either field', () => {
    expect(
      formatTripLocation({ location: '  Bangkok ', country: ' Thailand ' }),
    ).toBe('Bangkok, Thailand');
    expect(
      formatTripLocation({ location: ' Southeast Asia ', country: ' Southeast Asia ' }),
    ).toBe('Southeast Asia');
  });

  it('falls back to location when country is empty', () => {
    expect(formatTripLocation({ location: 'Southeast Asia', country: '' })).toBe(
      'Southeast Asia',
    );
  });

  it('falls back to country when location is empty', () => {
    expect(formatTripLocation({ location: '', country: 'Thailand' })).toBe('Thailand');
  });

  it('returns empty string when both fields are empty', () => {
    expect(formatTripLocation({ location: '', country: '' })).toBe('');
  });
});
