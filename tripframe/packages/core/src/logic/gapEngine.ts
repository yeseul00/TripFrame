import { TripEvent, Gap, GapSeverity } from '../types/trip';

const WARNING_THRESHOLD_MINUTES = 30;

/**
 * "HH:mm" 형식 두 시간의 차이를 분 단위로 반환합니다.
 */
function diffMinutes(fromTime: string, toTime: string): number {
  const [fh, fm] = fromTime.split(':').map(Number);
  const [th, tm] = toTime.split(':').map(Number);
  return (th * 60 + tm) - (fh * 60 + fm);
}

/**
 * spec FR-02 기준 severity 판정
 * - DANGER  : 이동 수단 없음
 * - WARNING : 이동 수단 있으나 여유 시간 < 30분
 * - OK      : 이동 수단 있고 여유 시간 ≥ 30분
 */
function calcSeverity(hasTransport: boolean, bufferMinutes: number): GapSeverity {
  if (!hasTransport) return 'DANGER';
  if (bufferMinutes < WARNING_THRESHOLD_MINUTES) return 'WARNING';
  return 'OK';
}

/**
 * 여행 일정에서 논리적인 공백(이동 수단 누락, 시간 여유 부족)을 감지합니다.
 *
 * @param events 하나의 타임라인에 속한 이벤트 목록 (time 순 정렬 전제)
 * @returns 감지된 공백(Gap) 목록
 */
export function detectGaps(events: TripEvent[]): Gap[] {
  const gaps: Gap[] = [];

  for (let i = 0; i < events.length - 1; i++) {
    const current = events[i];
    const next = events[i + 1];

    // 위치 정보가 있고 서로 다른 장소인 경우에만 검사
    if (!current.location || !next.location || current.location === next.location) {
      continue;
    }

    const hasTransport = current.type === 'transport' || next.type === 'transport';
    const bufferMinutes = diffMinutes(current.time, next.time);
    const severity = calcSeverity(hasTransport, bufferMinutes);

    // OK는 공백이 아니므로 제외
    if (severity === 'OK') continue;

    gaps.push({
      id: `gap-${current.id}-${next.id}`,
      fromEventId: current.id,
      toEventId: next.id,
      severity,
      type: 'transport',
      message: severity === 'DANGER'
        ? `${current.location}에서 ${next.location}으로 이동하는 수단이 누락된 것 같아요.`
        : `${current.location}에서 ${next.location}까지 이동 여유가 ${bufferMinutes}분으로 부족합니다.`,
      suggestions: ['대중교통 확인', '택시/렌터카 예약'],
    });
  }

  return gaps;
}
