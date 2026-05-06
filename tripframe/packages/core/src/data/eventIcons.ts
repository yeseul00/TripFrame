import { EventType, ReverseCalcStep } from '../types/trip';

/**
 * EventType별 표시 아이콘 매핑.
 *
 * 모든 화면(타임라인, 이벤트 폼, 역산 상세 등)이 동일한 아이콘을 사용하도록
 * 단일 진실 원천(single source of truth)으로 유지한다.
 *
 * 새 EventType 추가 시 이 맵을 함께 갱신해야 컴파일 에러로 누락을 잡을 수 있다.
 */
export const EVENT_ICON_MAP: Record<EventType, string> = {
  flight: '✈',
  hotel: '🏨',
  transport: '🚌',
  home: '🏠',
  warning: '⚠',
  free: '☀',
  prep: '📦',
  activity: '📍',
};

/**
 * EventType별 한글 라벨 매핑.
 * 폼·필터·디버그 표시 등에서 공통으로 사용.
 */
export const EVENT_LABEL_MAP: Record<EventType, string> = {
  flight: '항공편',
  hotel: '숙소',
  transport: '교통',
  home: '집 출발',
  warning: '경고',
  free: '자유시간',
  prep: '준비',
  activity: '관광/식사',
};

/**
 * ReverseCalcStep['type']별 표시 아이콘 매핑 (역산 상세 화면 전용).
 *
 * EventType과 키 공간이 다른 별도 도메인 (`checkin` / `transport` / `buffer` / `prep`).
 * 같은 키 이름인 `transport`·`prep`도 의미가 달라 별도 매핑 유지:
 *   - EventType.prep('📦' 짐 정리) ≠ ReverseCalcStep.prep('🎒' 출발 직전 준비)
 *   - EventType.transport('🚌' 교통 이벤트) = ReverseCalcStep.transport('🚌' 이동 단계)
 *
 * 두 매핑을 함께 두는 이유: 아이콘 단일 진실 원천을 한 파일로 통합.
 */
export const REVERSE_STEP_ICON_MAP: Record<ReverseCalcStep['type'], string> = {
  checkin: '✈',
  transport: '🚌',
  buffer: '⏱',
  prep: '🎒',
};
