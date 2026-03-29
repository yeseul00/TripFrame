/**
 * sortOptions — 교통 선호도 기반 옵션 정렬 (TASK-074)
 * Constitution Article III-1 준수: 순수 함수, packages/core에 위치
 */

import type { TransportOption } from '../types/transport';

export type TransportPreference = 'transit' | 'taxi' | 'any';

/** 선호도에 따른 TransportMode 우선순위 매핑 */
const PREFERRED_MODE: Record<Exclude<TransportPreference, 'any'>, TransportOption['mode']> = {
  transit: 'PUBLIC',
  taxi: 'TAXI',
};

/**
 * 사용자 교통 선호도에 따라 옵션을 정렬한다.
 * - 'transit' → PUBLIC 모드를 최상단, 나머지는 기존 순서
 * - 'taxi'    → TAXI 모드를 최상단, 나머지는 기존 순서
 * - 'any'     → 기존 순서 유지 (비용 기준)
 *
 * 원본 배열을 변경하지 않고 새 배열을 반환 (불변성 보장).
 */
export function sortByPreference(
  options: TransportOption[],
  preference: TransportPreference,
): TransportOption[] {
  if (preference === 'any') return [...options];

  const preferredMode = PREFERRED_MODE[preference];
  const preferred = options.filter((o) => o.mode === preferredMode);
  const rest = options.filter((o) => o.mode !== preferredMode);
  return [...preferred, ...rest];
}
