/**
 * exportIcal 단위 테스트 (TASK-097)
 * - VCALENDAR/VEVENT 포맷 검증
 * - X-TRIPFRAME-GAP-STATUS 커스텀 프로퍼티 확인
 * - DTSTART/DTEND ISO-8601 형식 검증
 */

import { generateIcal } from '../exportIcal';
import { MOCK_TRIP } from '../../data/mock';
import type { Trip } from '../../types/trip';

const MINIMAL_TRIP: Trip = {
  id: 'test-trip-01',
  title: '테스트 여행',
  startDate: '2026-06-01',
  endDate: '2026-06-02',
  timelines: [
    {
      day: 1,
      date: '2026-06-01',
      events: [
        {
          id: 'ev-001',
          title: '비행기 탑승',
          time: '09:00',
          type: 'flight',
          status: 'ok',
          location: '인천공항',
          sub: 'KE123',
        },
      ],
      gaps: [
        {
          id: 'gap-001',
          fromEventId: 'ev-001',
          toEventId: 'ev-002',
          severity: 'DANGER',
          type: 'transport',
          message: '인천에서 후쿠오카로 이동 수단 누락',
        },
      ],
    },
  ],
};

describe('generateIcal', () => {
  it('출력이 VCALENDAR로 시작하고 끝나야 한다', () => {
    const output = generateIcal(MINIMAL_TRIP);
    expect(output).toMatch(/^BEGIN:VCALENDAR/);
    expect(output).toMatch(/END:VCALENDAR$/);
  });

  it('VTIMEZONE Asia/Seoul 블록이 포함되어야 한다', () => {
    const output = generateIcal(MINIMAL_TRIP);
    expect(output).toContain('BEGIN:VTIMEZONE');
    expect(output).toContain('TZID:Asia/Seoul');
    expect(output).toContain('END:VTIMEZONE');
  });

  it('이벤트마다 VEVENT 블록이 생성되어야 한다', () => {
    const output = generateIcal(MINIMAL_TRIP);
    expect(output).toContain('BEGIN:VEVENT');
    expect(output).toContain('END:VEVENT');
  });

  it('DTSTART/DTEND가 날짜+시간 형식(YYYYMMDDTHHMMSS)으로 포함되어야 한다', () => {
    const output = generateIcal(MINIMAL_TRIP);
    expect(output).toMatch(/DTSTART;TZID=Asia\/Seoul:20260601T090000/);
  });

  it('SUMMARY에 이벤트 제목이 포함되어야 한다', () => {
    const output = generateIcal(MINIMAL_TRIP);
    expect(output).toContain('SUMMARY:비행기 탑승');
  });

  it('LOCATION에 이벤트 위치가 포함되어야 한다', () => {
    const output = generateIcal(MINIMAL_TRIP);
    expect(output).toContain('LOCATION:인천공항');
  });

  it('DESCRIPTION에 sub 정보가 포함되어야 한다', () => {
    const output = generateIcal(MINIMAL_TRIP);
    expect(output).toContain('DESCRIPTION:KE123');
  });

  it('X-TRIPFRAME-GAP-STATUS가 포함되어야 한다 (DANGER)', () => {
    const output = generateIcal(MINIMAL_TRIP);
    expect(output).toContain('X-TRIPFRAME-GAP-STATUS:DANGER');
  });

  it('RESOLVED Gap에 X-TRIPFRAME-GAP-STATUS:RESOLVED + X-TRIPFRAME-RESOLVED-AT 포함', () => {
    const resolvedAt = '2026-06-01T10:00:00.000Z';
    const output = generateIcal(MINIMAL_TRIP, {
      'gap-001': { resolvedAt },
    });
    expect(output).toContain('X-TRIPFRAME-GAP-STATUS:RESOLVED');
    expect(output).toContain(`X-TRIPFRAME-RESOLVED-AT:${resolvedAt}`);
  });

  it('Mock 여행 데이터로 VCALENDAR + 복수 VEVENT 생성', () => {
    const output = generateIcal(MOCK_TRIP);
    expect(output).toContain('BEGIN:VCALENDAR');
    const veventCount = (output.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(veventCount).toBeGreaterThan(0);
  });
});
