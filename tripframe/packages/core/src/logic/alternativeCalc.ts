import { ReverseCalcStep, ReverseCalcResult } from '../types/trip';
import { calculateReverseTime } from './reverseEngine';

export interface AlternativeCalcResult {
  alternativeStep: ReverseCalcStep;
  calculatedTime: string;
  deltaMinutes: number; // 양수: 더 일찍 출발, 음수: 더 늦게 출발
}

/**
 * 역산 단계 중 특정 교통 구간을 대안 단계로 교체했을 때의 출발 시각을 계산합니다.
 *
 * @param anchorTime 기준 시각 ("HH:mm")
 * @param steps 원래 역산 단계 목록
 * @param targetStepId 교체할 단계 ID
 * @param alternativeStep 대안 교통 단계
 * @returns 대안 계산 결과 (출발 시각 + Δ분)
 */
export function recalculateWithAlternative(
  anchorTime: string,
  steps: ReverseCalcStep[],
  targetStepId: string,
  alternativeStep: ReverseCalcStep
): AlternativeCalcResult {
  const replacedSteps = steps.map((s) =>
    s.id === targetStepId ? alternativeStep : s
  );

  const newTime = calculateReverseTime(anchorTime, replacedSteps);
  const originalTime = calculateReverseTime(anchorTime, steps);

  const toMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const deltaMinutes = toMinutes(originalTime) - toMinutes(newTime);

  return {
    alternativeStep,
    calculatedTime: newTime,
    deltaMinutes,
  };
}
