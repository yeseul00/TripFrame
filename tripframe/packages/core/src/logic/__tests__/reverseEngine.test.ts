/**
 * Reverse Calculation Engine 단위 테스트
 *
 * 요구사항 매핑 (TF-RDS-001):
 *   REQ-FR-003, REQ-FR-004, REQ-FR-005
 * 검증 시나리오:
 *   TC-005, TC-006, TC-007, TC-008
 */

import { calculateReverseTime } from '../reverseEngine';
import { MOCK_REVERSE_CALC } from '../../data/mock';
import type { ReverseCalcStep } from '../../types/trip';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function makeStep(
  id: string,
  label: string,
  durationMinutes: number,
  type: ReverseCalcStep['type'] = 'buffer',
): ReverseCalcStep {
  return { id, label, durationMinutes, type };
}

// ─── 핵심 시나리오 ─────────────────────────────────────────────────────────

describe('calculateReverseTime — 핵심 시나리오', () => {
  /**
   * TC-007 (REQ-FR-004)
   * Given: LJ263 12:15 출발, 버스 75분 + 버퍼 + 준비 포함 샘플 데이터
   * When : calculateReverseTime 호출
   * Then : 09:15 반환
   */
  it('[TC-007] 샘플 역산 데이터로 집 출발 시간 09:15 계산', () => {
    const result = calculateReverseTime(
      MOCK_REVERSE_CALC.anchorTime,
      MOCK_REVERSE_CALC.steps,
    );
    expect(result).toBe('09:15');
  });

  /**
   * TC-008 (REQ-FR-005)
   * Given: LJ263 12:15 출발, 버스 75분
   * When : 역산 탭 진입 (단계별 계산)
   * Then : Anchor 12:15 → 11:25 → 10:45 → -75분 → 09:20 → 09:15
   *        (= 총 180분 차감)
   */
  it('[TC-008] 총 소요시간(180분) 차감 후 앵커 12:15 → 09:00', () => {
    const steps: ReverseCalcStep[] = [
      makeStep('s1', '수속 마감', 50, 'checkin'),
      makeStep('s2', '카운터 여유', 40, 'buffer'),
      makeStep('s3', '공항버스', 75, 'transport'),
      makeStep('s4', '버스정류장 이동', 15, 'prep'),
    ];
    const result = calculateReverseTime('12:15', steps);
    expect(result).toBe('09:15');
  });

  /**
   * TC-005 (REQ-FR-003) — 버스 케이스
   * Given: 합정동 출발, 공항버스 75분
   * When : 역산 단일 스텝 계산
   * Then : 12:15 − 75분 = 11:00
   */
  it('[TC-005] 공항버스 75분 단일 역산: 12:15 → 11:00', () => {
    const result = calculateReverseTime('12:15', [
      makeStep('t1', '공항버스', 75, 'transport'),
    ]);
    expect(result).toBe('11:00');
  });

  /**
   * TC-006 (REQ-FR-003) — 철도 케이스
   * Given: 합정동 출발, 공항철도 50분
   * When : 역산 단일 스텝 계산
   * Then : 12:15 − 50분 = 11:25
   */
  it('[TC-006] 공항철도 50분 단일 역산: 12:15 → 11:25', () => {
    const result = calculateReverseTime('12:15', [
      makeStep('t1', '공항철도', 50, 'transport'),
    ]);
    expect(result).toBe('11:25');
  });
});

// ─── 경계값 및 엣지 케이스 ──────────────────────────────────────────────────

describe('calculateReverseTime — 경계값', () => {
  it('[EDGE-001] 단계가 없으면 앵커 시간을 그대로 반환한다', () => {
    expect(calculateReverseTime('10:00', [])).toBe('10:00');
  });

  it('[EDGE-002] 자정을 넘는 역산 처리 (01:00 − 120분 = 23:00)', () => {
    const result = calculateReverseTime('01:00', [
      makeStep('m1', '이동', 120, 'transport'),
    ]);
    expect(result).toBe('23:00');
  });

  it('[EDGE-003] 정각 처리 (12:00 − 60분 = 11:00)', () => {
    expect(
      calculateReverseTime('12:00', [makeStep('x', '준비', 60, 'prep')]),
    ).toBe('11:00');
  });

  it('[EDGE-004] 복수 단계 누적 차감이 순서대로 수행된다', () => {
    // 10:00 − 10분 = 09:50 − 20분 = 09:30 − 30분 = 09:00
    const result = calculateReverseTime('10:00', [
      makeStep('a', 'A', 10),
      makeStep('b', 'B', 20),
      makeStep('c', 'C', 30),
    ]);
    expect(result).toBe('09:00');
  });
});
