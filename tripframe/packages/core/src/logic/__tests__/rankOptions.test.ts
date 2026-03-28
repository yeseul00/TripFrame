import { rankOptions } from '../rankOptions';
import type { TransportOption, UserPreferences } from '../../types/transport';

const BASE_OPTIONS: TransportOption[] = [
  {
    id: 'bus',
    mode: 'PUBLIC',
    label: '고속버스',
    durationMinutes: 105,
    pricePerPerson: 3250,
    requiresBooking: false,
  },
  {
    id: 'taxi',
    mode: 'TAXI',
    label: '택시',
    durationMinutes: 90,
    pricePerPerson: 25000,
    requiresBooking: false,
  },
  {
    id: 'rental',
    mode: 'RENTAL',
    label: '렌터카',
    durationMinutes: 95,
    pricePerPerson: 8000,
    requiresBooking: true,
  },
];

describe('rankOptions', () => {
  it('PUBLIC 선호 + CARRY_ON이면 버스가 1위', () => {
    const prefs: UserPreferences = {
      transportPreference: 'PUBLIC',
      luggageSize: 'CARRY_ON',
      timeBuffer: 'RELAXED',
    };
    const ranked = rankOptions(BASE_OPTIONS, prefs);
    expect(ranked[0].id).toBe('bus');
  });

  it('TAXI 선호 + LARGE이면 택시가 1위', () => {
    const prefs: UserPreferences = {
      transportPreference: 'TAXI',
      luggageSize: 'LARGE',
      timeBuffer: 'TIGHT',
    };
    const ranked = rankOptions(BASE_OPTIONS, prefs);
    expect(ranked[0].id).toBe('taxi');
  });

  it('원본 배열을 변경하지 않는다 (immutable)', () => {
    const prefs: UserPreferences = {
      transportPreference: 'ANY',
      luggageSize: 'CARRY_ON',
      timeBuffer: 'RELAXED',
    };
    const original = [...BASE_OPTIONS];
    rankOptions(BASE_OPTIONS, prefs);
    expect(BASE_OPTIONS).toEqual(original);
  });

  it('옵션이 없으면 빈 배열 반환', () => {
    const prefs: UserPreferences = {
      transportPreference: 'ANY',
      luggageSize: 'CARRY_ON',
      timeBuffer: 'RELAXED',
    };
    expect(rankOptions([], prefs)).toEqual([]);
  });
});
