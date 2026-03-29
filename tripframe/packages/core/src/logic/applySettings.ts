/**
 * applySettings — 사용자 설정을 역산 로직에 적용 (TASK-073)
 * Constitution Article III-1 준수: 순수 함수, packages/core에 위치
 */

import type { ReverseCalcStep } from '../types/trip';

export type BufferLevel = 'tight' | 'normal' | 'relaxed';

const BUFFER_FACTOR: Record<BufferLevel, number> = {
  tight: 0.8,
  normal: 1.0,
  relaxed: 1.2,
};

/**
 * bufferLevel에 따라 모든 역산 단계의 bufferTime을 조정한 새 배열을 반환한다.
 * - 'tight'   → 기본 durationMinutes × 0.8 (최소 1분 보장)
 * - 'normal'  → 변경 없음
 * - 'relaxed' → 기본 durationMinutes × 1.2
 *
 * transport/checkin 타입은 실제 이동시간이므로 factor 적용 대상에서 제외.
 * buffer/prep 타입만 사용자 여유도에 따라 조정.
 */
export function applyBufferLevel(
  steps: ReverseCalcStep[],
  bufferLevel: BufferLevel,
): ReverseCalcStep[] {
  const factor = BUFFER_FACTOR[bufferLevel];
  if (factor === 1.0) return steps;

  return steps.map((step) => {
    if (step.type !== 'buffer' && step.type !== 'prep') return step;
    const adjusted = Math.max(1, Math.round(step.durationMinutes * factor));
    return { ...step, durationMinutes: adjusted };
  });
}
