// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { parseCoordinates, formatAltitude, formatCoordinate, formatDistance } from './places';

describe('coordinate search', () => {
  it('preserves latitude/longitude ordering and asymmetric signs', () => {
    expect(parseCoordinates(' -33.8688, 151.2093 ')).toEqual({ latitude: -33.8688, longitude: 151.2093 });
    expect(parseCoordinates('40.758, -73.9855')).toEqual({ latitude: 40.758, longitude: -73.9855 });
  });
  it('accepts poles, antimeridian and zero', () => {
    expect(parseCoordinates('90,-180')).toEqual({ latitude: 90, longitude: -180 });
    expect(parseCoordinates('-90,180')).toEqual({ latitude: -90, longitude: 180 });
    expect(parseCoordinates('0,0')).toEqual({ latitude: 0, longitude: 0 });
  });
  it.each(['90.001,12', '-90.001,12', '12,180.001', '12,-180.001', 'Paris', '1,2,3', '12abc,34', '', 'NaN,0'])('rejects invalid coordinates: %s', input => {
    expect(parseCoordinates(input)).toBeNull();
  });
});

describe('map telemetry', () => {
  it('assigns geographic hemispheres without swapping axes', () => {
    expect(formatCoordinate(-33.8688, true)).toBe('33.869° S');
    expect(formatCoordinate(151.2093, false)).toBe('151.209° E');
    expect(formatCoordinate(40.758, true)).toBe('40.758° N');
    expect(formatCoordinate(-73.9855, false)).toBe('73.986° W');
  });
  it('switches from meters to kilometers at 1 km', () => {
    expect(formatDistance(999)).toBe('999 m');
    expect(formatDistance(1000)).toBe('1 km');
    expect(formatDistance(1100)).toBe('1.1 km');
    expect(formatDistance(19000000)).toBe('19,000 km');
  });
  it('formats altitude in kilometers or miles', () => {
    expect(formatAltitude(1100, 'km')).toBe('1.1 km');
    expect(formatAltitude(1100, 'mi')).toBe('0.7 mi');
    expect(formatAltitude(19000000, 'km')).toBe('19,000 km');
    expect(formatAltitude(19000000, 'mi')).toBe('11,806 mi');
  });
});
