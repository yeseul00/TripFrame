import { sortByPreference } from '../sortOptions';
import type { TransportOption } from '../../types/transport';

const OPTIONS: TransportOption[] = [
  { id: 'bus', mode: 'PUBLIC', label: '공항버스', durationMinutes: 70, pricePerPerson: 9000, requiresBooking: false },
  { id: 'taxi', mode: 'TAXI', label: '택시', durationMinutes: 45, pricePerPerson: 55000, requiresBooking: false },
  { id: 'rental', mode: 'RENTAL', label: '렌터카', durationMinutes: 50, pricePerPerson: 30000, requiresBooking: true },
  { id: 'subway', mode: 'PUBLIC', label: '공항철도', durationMinutes: 55, pricePerPerson: 9500, requiresBooking: false },
];

describe('sortByPreference', () => {
  it("'any' — 기존 순서 그대로 반환 (원본 배열과 다른 참조)", () => {
    const result = sortByPreference(OPTIONS, 'any');
    expect(result).not.toBe(OPTIONS); // 새 배열
    expect(result.map((o) => o.id)).toEqual(['bus', 'taxi', 'rental', 'subway']);
  });

  it("'transit' — PUBLIC 모드를 최상단으로 이동", () => {
    const result = sortByPreference(OPTIONS, 'transit');
    expect(result[0].mode).toBe('PUBLIC');
    expect(result[1].mode).toBe('PUBLIC');
    // 나머지는 비PUBLIC
    expect(result.slice(2).every((o) => o.mode !== 'PUBLIC')).toBe(true);
  });

  it("'taxi' — TAXI 모드를 최상단으로 이동", () => {
    const result = sortByPreference(OPTIONS, 'taxi');
    expect(result[0].id).toBe('taxi');
    expect(result[0].mode).toBe('TAXI');
  });

  it('원본 배열을 변경하지 않는다 (불변성)', () => {
    const original = [...OPTIONS];
    sortByPreference(OPTIONS, 'transit');
    expect(OPTIONS.map((o) => o.id)).toEqual(original.map((o) => o.id));
  });
});
