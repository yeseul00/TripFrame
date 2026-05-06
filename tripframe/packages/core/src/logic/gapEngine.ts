import { TripEvent, Gap, GapSeverity, DayTimeline } from '../types/trip';

const WARNING_THRESHOLD_MINUTES = 30;

/**
 * Gap을 안정적으로 식별하는 키를 생성한다.
 * 이벤트 시간이 변경되어도 키가 변하지 않도록 위치와 dayIndex만 사용.
 *
 * @param fromLocation 출발 위치
 * @param toLocation   도착 위치
 * @param dayIndex     여행 날짜 인덱스 (0-based)
 * @returns 안정적인 gapKey 문자열
 */
export function makeGapKey(fromLocation: string, toLocation: string, dayIndex: number): string {
  return `${fromLocation}-${toLocation}-${dayIndex}`;
}

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
 * location이 없을 때 EventType 기반으로 위치를 추론한다. (BUG-01)
 * home → "집", hotel → title, transport → sub 또는 title
 * 그 외 타입은 location이 없으면 undefined 반환 (기존 동작 유지)
 */
function resolveLocation(event: TripEvent): string | undefined {
  if (event.location) return event.location;
  switch (event.type) {
    case 'home': return '집';
    case 'hotel': return event.title || undefined;
    case 'transport': return event.sub || event.title || undefined;
    default: return undefined;
  }
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

    const fromLoc = resolveLocation(current);
    const toLoc = resolveLocation(next);

    if (!fromLoc || !toLoc || fromLoc === toLoc) continue;

    const hasTransport = current.type === 'transport' || next.type === 'transport';
    const bufferMinutes = diffMinutes(current.time, next.time);
    const severity = calcSeverity(hasTransport, bufferMinutes);

    if (severity === 'OK') continue;

    gaps.push({
      id: `gap-${current.id}-${next.id}`,
      fromEventId: current.id,
      toEventId: next.id,
      severity,
      type: 'transport',
      message: severity === 'DANGER'
        ? `${fromLoc}에서 ${toLoc}으로 이동하는 수단이 누락된 것 같아요.`
        : `${fromLoc}에서 ${toLoc}까지 이동 여유가 ${bufferMinutes}분으로 부족합니다.`,
      suggestions: ['대중교통 확인', '택시/렌터카 예약'],
    });
  }

  return gaps;
}

/**
 * 날짜 경계(자정)를 넘는 이동의 공백을 감지합니다. (BUG-07)
 * Day N 마지막 이벤트 → Day N+1 첫 이벤트 간 이동수단 누락 여부 검사.
 *
 * @param timelines 여행 전체 타임라인 배열
 * @returns 날짜 경계 공백(Gap) 목록
 */
export function detectCrossDayGaps(timelines: DayTimeline[]): Gap[] {
  const gaps: Gap[] = [];

  for (let i = 0; i < timelines.length - 1; i++) {
    const currentDay = timelines[i];
    const nextDay = timelines[i + 1];

    const lastEvent = currentDay.events[currentDay.events.length - 1];
    const firstEvent = nextDay.events[0];

    if (!lastEvent || !firstEvent) continue;

    const fromLoc = resolveLocation(lastEvent);
    const toLoc = resolveLocation(firstEvent);

    if (!fromLoc || !toLoc || fromLoc === toLoc) continue;

    const hasTransport = lastEvent.type === 'transport' || firstEvent.type === 'transport';
    if (hasTransport) continue;

    gaps.push({
      id: `gap-cross-${lastEvent.id}-${firstEvent.id}`,
      fromEventId: lastEvent.id,
      toEventId: firstEvent.id,
      severity: 'DANGER',
      type: 'transport',
      message: `Day ${currentDay.day}에서 Day ${nextDay.day}로 넘어가는 이동 수단이 누락되었어요. (${fromLoc} → ${toLoc})`,
      suggestions: ['대중교통 확인', '택시/렌터카 예약'],
    });
  }

  return gaps;
}
