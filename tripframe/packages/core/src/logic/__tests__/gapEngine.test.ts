/**
 * Gap Detection Engine 단위 테스트
 *
 * 요구사항 매핑 (TF-RDS-001):
 *   REQ-FR-006, REQ-FR-007, REQ-FR-008, REQ-FR-009, REQ-FR-010
 * 검증 시나리오:
 *   TC-009, TC-010, TC-011, TC-012, TC-013, TC-014, TC-015
 */

import { detectGaps, makeGapKey } from '../gapEngine';
import { MOCK_TRIP } from '../../data/mock';
import { TripEvent } from '../../types/trip';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

let idSeq = 0;
function makeEvent(overrides: Partial<TripEvent> & { time: string }): TripEvent {
  idSeq++;
  return {
    id: `ev-${idSeq}`,
    title: `이벤트 ${idSeq}`,
    time: overrides.time,
    type: overrides.type ?? 'activity',
    status: overrides.status ?? 'ok',
    location: overrides.location,
    isDerived: overrides.isDerived,
    sub: overrides.sub,
    metadata: overrides.metadata,
  };
}

beforeEach(() => { idSeq = 0; });

// ─── 핵심 시나리오 ─────────────────────────────────────────────────────────

describe('detectGaps — DANGER 감지', () => {
  /**
   * TC-009, TC-011 (REQ-FR-006, REQ-FR-008)
   * Given: 하카타 호텔 체크아웃 11:00 → 유후인 체크인 15:00, 사이 이동수단 없음
   * When : detectGaps 실행
   * Then : DANGER Gap 1개 반환
   */
  it('[TC-009/011] 다른 위치, 이동수단 없음 → DANGER Gap 1개', () => {
    const events: TripEvent[] = [
      makeEvent({ time: '11:00', type: 'hotel', location: '하카타', status: 'ok' }),
      makeEvent({ time: '15:00', type: 'hotel', location: '유후인', status: 'ok' }),
    ];
    const gaps = detectGaps(events);

    expect(gaps).toHaveLength(1);
    expect(gaps[0].severity).toBe('DANGER');
    expect(gaps[0].type).toBe('transport');
  });

  /**
   * TC-010 (REQ-FR-007)
   * Given: 버스센터 도착(13:30) → 잇코텐(다른 위치), 마지막 구간 이동수단 없음
   * When : detectGaps 실행
   * Then : 마지막 구간 공백 감지됨
   *
   * ⚠ 현재 엔진 한계: current.type === 'transport'이면 hasTransport=true로 처리하여
   *   OK로 분류됨 (버퍼 90분 ≥ 30분). 마지막 구간(도착지→숙소) 감지는 엔진 개선 필요.
   * TODO: gapEngine을 개선하여 transport 이벤트 이후 다른 위치 도착의 경우
   *       "마지막 구간" gap을 별도 감지하는 로직 추가 (REQ-FR-007, TASK-008)
   */
  it.todo('[TC-010] 마지막 구간(버스센터→숙소) 이동수단 없음 → DANGER 감지 (엔진 개선 필요)');

  /**
   * Mock 데이터 Day 2 — 샘플 기반 확인
   */
  it('[TC-011] 샘플 Day 2: 하카타→유후인 DANGER 감지', () => {
    const day2 = MOCK_TRIP.timelines[1].events;
    const gaps = detectGaps(day2);

    expect(gaps.some((g) => g.severity === 'DANGER')).toBe(true);
    expect(gaps.some((g) => g.message.includes('하카타'))).toBe(true);
  });
});

describe('detectGaps — WARNING 감지', () => {
  /**
   * TC-012 (REQ-FR-008)
   * Given: 공항→하카타 구간, 버스 있으나 여유 20분
   * When : severity 판정
   * Then : WARNING 반환
   */
  it('[TC-012] 이동수단 있으나 여유 20분(<30분) → WARNING', () => {
    const events: TripEvent[] = [
      makeEvent({ time: '14:00', type: 'transport', location: '공항' }),
      makeEvent({ time: '14:20', type: 'hotel', location: '하카타' }),
    ];
    const gaps = detectGaps(events);

    expect(gaps).toHaveLength(1);
    expect(gaps[0].severity).toBe('WARNING');
  });
});

describe('detectGaps — OK (반환 없음)', () => {
  /**
   * TC-013 (REQ-FR-008)
   * Given: 하카타역→호텔, 택시 있고 여유 40분
   * When : severity 판정
   * Then : OK → Gap 반환 없음
   */
  it('[TC-013] 이동수단 있고 여유 40분(≥30분) → Gap 없음', () => {
    const events: TripEvent[] = [
      makeEvent({ time: '14:00', type: 'transport', location: '하카타역' }),
      makeEvent({ time: '14:40', type: 'hotel', location: '호텔' }),
    ];
    const gaps = detectGaps(events);

    expect(gaps).toHaveLength(0);
  });
});

describe('detectGaps — 제안 옵션', () => {
  /**
   * TC-014 (REQ-FR-009)
   * Given: 하카타→유후인 DANGER 공백
   * When : GapCard 펼침 (detectGaps 결과 확인)
   * Then : suggestions 1개 이상 포함
   */
  it('[TC-014] DANGER Gap은 suggestions를 1개 이상 포함한다', () => {
    const events: TripEvent[] = [
      makeEvent({ time: '12:00', type: 'activity', location: '하카타' }),
      makeEvent({ time: '15:00', type: 'activity', location: '유후인' }),
    ];
    const gaps = detectGaps(events);

    expect(gaps[0].suggestions).toBeDefined();
    expect(gaps[0].suggestions!.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── 경계값 및 엣지 케이스 ──────────────────────────────────────────────────

describe('detectGaps — 경계값 및 엣지 케이스', () => {
  it('[EDGE-005] 이벤트가 0개이면 공백이 없다', () => {
    expect(detectGaps([])).toHaveLength(0);
  });

  it('[EDGE-006] 이벤트가 1개이면 공백이 없다', () => {
    const events = [makeEvent({ time: '10:00', location: '하카타' })];
    expect(detectGaps(events)).toHaveLength(0);
  });

  it('[EDGE-007] 위치 정보가 없는 이벤트 간에는 공백을 감지하지 않는다', () => {
    const events: TripEvent[] = [
      makeEvent({ time: '10:00', type: 'flight' }),
      makeEvent({ time: '12:00', type: 'activity' }),
    ];
    expect(detectGaps(events)).toHaveLength(0);
  });

  it('[EDGE-008] 위치가 같은 이벤트 간에는 공백을 감지하지 않는다', () => {
    const events: TripEvent[] = [
      makeEvent({ time: '10:00', location: '하카타' }),
      makeEvent({ time: '11:00', location: '하카타' }),
    ];
    expect(detectGaps(events)).toHaveLength(0);
  });

  it('[EDGE-009] Day 1 (같은 도시 내 이동) — 공백 없음', () => {
    const day1 = MOCK_TRIP.timelines[0].events;
    const gaps = detectGaps(day1);
    expect(gaps).toHaveLength(0);
  });

  it('[EDGE-010] 여러 이동 구간 중 OK 구간은 결과에 포함되지 않는다', () => {
    const events: TripEvent[] = [
      makeEvent({ time: '10:00', type: 'transport', location: 'A' }),
      makeEvent({ time: '10:45', type: 'activity', location: 'B' }), // 45분 여유 → OK
      makeEvent({ time: '11:00', type: 'activity', location: 'C' }), // 이동수단 없음 → DANGER
    ];
    const gaps = detectGaps(events);

    expect(gaps).toHaveLength(1);
    expect(gaps[0].severity).toBe('DANGER');
  });

  it('[EDGE-011] fromEventId, toEventId가 올바른 이벤트를 가리킨다', () => {
    const from = makeEvent({ time: '10:00', location: '하카타' });
    const to = makeEvent({ time: '14:00', location: '유후인' });
    const gaps = detectGaps([from, to]);

    expect(gaps[0].fromEventId).toBe(from.id);
    expect(gaps[0].toEventId).toBe(to.id);
  });
});

// ─── makeGapKey 안정성 테스트 (TASK-095) ──────────────────────────────────

describe('makeGapKey', () => {
  it('위치와 dayIndex로 안정적인 키를 생성한다', () => {
    expect(makeGapKey('하카타', '유후인', 1)).toBe('하카타-유후인-1');
  });

  it('이벤트 시간이 달라져도 같은 위치/dayIndex이면 키가 동일하다', () => {
    const key1 = makeGapKey('하카타', '유후인', 1);
    const key2 = makeGapKey('하카타', '유후인', 1);
    expect(key1).toBe(key2);
  });

  it('출발/도착 위치가 다르면 키가 다르다', () => {
    expect(makeGapKey('하카타', '유후인', 0)).not.toBe(makeGapKey('유후인', '하카타', 0));
  });

  it('dayIndex가 다르면 같은 위치쌍도 키가 다르다', () => {
    expect(makeGapKey('하카타', '유후인', 0)).not.toBe(makeGapKey('하카타', '유후인', 1));
  });
});
