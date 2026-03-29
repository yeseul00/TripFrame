/**
 * TripFrame Core 데이터 모델 정의
 */

export type EventType =
  | 'flight'
  | 'hotel'
  | 'transport'
  | 'home'
  | 'warning'
  | 'free'
  | 'prep'
  | 'activity';

export type EventStatus = 'ok' | 'missing' | 'warn' | 'auto' | 'free' | 'todo';

export interface TripEvent {
  id: string;
  title: string;
  sub?: string;
  time: string; // ISO8601 string or HH:mm format (depending on implementation preference)
  type: EventType;
  status: EventStatus;
  location?: string;
  isDerived?: boolean; // 역산에 의해 생성된 이벤트인지 여부
  metadata?: Record<string, unknown>;
}

export type GapSeverity = 'DANGER' | 'WARNING' | 'OK';

/** RESOLVED: 사용자가 예약 완료로 표시한 공백 상태 (외부 저장소 관리, Gap 파생 데이터와 별도) */
export type GapStatus = 'DANGER' | 'WARNING' | 'RESOLVED';

export interface Gap {
  id: string;
  fromEventId: string;
  toEventId: string;
  severity: GapSeverity;
  type: 'transport' | 'time_buffer' | 'unknown';
  message: string;
  suggestions?: string[];
}

export interface ReverseCalcStep {
  id: string;
  label: string;
  durationMinutes: number;
  type: 'buffer' | 'transport' | 'prep' | 'checkin';
}

export interface ReverseCalcResult {
  anchorTime: string;
  steps: ReverseCalcStep[];
  calculatedTime: string;
}

export interface DayTimeline {
  day: number;
  date: string;
  events: TripEvent[];
  gaps: Gap[];
}

export interface Trip {
  id: string;
  title: string;
  destination?: string;
  startDate: string;
  endDate: string;
  timelines: DayTimeline[];
}

export interface FreeTimeResult {
  minutes: number;
  startTime: string;  // "HH:mm" 형식
  endTime: string;    // "HH:mm" 형식
  warning?: string;   // 30분 미만 시 경고 메시지
  suggestion?: string; // 자유시간 활용 제안
}
