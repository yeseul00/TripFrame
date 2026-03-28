import type { TransportOption, UserPreferences } from '../types/transport';

function scoreOption(option: TransportOption, prefs: UserPreferences): number {
  let score = 0;

  // 교통 선호 점수
  if (prefs.transportPreference === 'PUBLIC' && option.mode === 'PUBLIC') score += 30;
  if (prefs.transportPreference === 'TAXI' && option.mode === 'TAXI') score += 30;
  if (prefs.transportPreference === 'ANY') score += 15;

  // 여유도 점수 — RELAXED는 소요시간 짧은 옵션 선호
  if (prefs.timeBuffer === 'RELAXED' && option.durationMinutes <= 120) score += 20;
  if (prefs.timeBuffer === 'TIGHT' && option.durationMinutes <= 90) score += 20;

  // 짐 크기 — LARGE면 택시/렌터카 가점
  if (prefs.luggageSize === 'LARGE' && option.mode !== 'PUBLIC') score += 15;
  if (prefs.luggageSize === 'CARRY_ON' && option.mode === 'PUBLIC') score += 10;

  // 가격 역비례 보정 (저렴할수록 가점)
  const priceScore = Math.max(0, 10 - Math.floor(option.pricePerPerson / 5000));
  score += priceScore;

  return score;
}

/**
 * 사용자 선호도 기반 이동 수단 옵션 정렬 (높은 점수 순)
 * 동점이면 원래 순서 유지 (stable sort)
 */
export function rankOptions(
  options: TransportOption[],
  prefs: UserPreferences,
): TransportOption[] {
  return [...options].sort((a, b) => scoreOption(b, prefs) - scoreOption(a, prefs));
}
