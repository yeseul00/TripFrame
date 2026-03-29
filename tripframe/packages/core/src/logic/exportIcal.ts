/**
 * exportIcal — RFC 5545 iCal 내보내기 (TASK-097)
 *
 * Logic-UI 분리 원칙: 이 파일은 순수 함수만 포함.
 * 파일 저장 및 공유는 apps/mobile에서 expo-sharing + expo-file-system 사용.
 */

import type { Trip, Gap } from '../types/trip';

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const ICAL_LINE_MAX = 75; // RFC 5545 라인 폴딩 최대 길이

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────

/** RFC 5545 라인 폴딩: 75자 초과 시 CRLF + 공백으로 분할 */
function foldLine(line: string): string {
  if (line.length <= ICAL_LINE_MAX) return line;
  const segments: string[] = [];
  let remaining = line;
  segments.push(remaining.slice(0, ICAL_LINE_MAX));
  remaining = remaining.slice(ICAL_LINE_MAX);
  while (remaining.length > 0) {
    segments.push(' ' + remaining.slice(0, ICAL_LINE_MAX - 1));
    remaining = remaining.slice(ICAL_LINE_MAX - 1);
  }
  return segments.join('\r\n');
}

/** "HH:mm" 형식의 시간을 iCal DTSTART/DTEND 형식(날짜+시간)으로 변환 */
function toIcalDateTime(dateStr: string, timeStr: string): string {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:mm"
  const date = dateStr.replace(/-/g, '');
  const time = timeStr.replace(':', '') + '00';
  return `${date}T${time}`;
}

/** iCal 텍스트 이스케이프: 쉼표, 세미콜론, 백슬래시, 개행 처리 */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// ─────────────────────────────────────────────
// VTIMEZONE 블록 (Asia/Seoul)
// ─────────────────────────────────────────────

const VTIMEZONE_SEOUL = [
  'BEGIN:VTIMEZONE',
  'TZID:Asia/Seoul',
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0900',
  'TZOFFSETTO:+0900',
  'TZNAME:KST',
  'END:STANDARD',
  'END:VTIMEZONE',
].join('\r\n');

// ─────────────────────────────────────────────
// Gap 상태 조회 헬퍼 (외부 resolvedGaps 전달)
// ─────────────────────────────────────────────

interface GapStatusMap {
  [gapKey: string]: { resolvedAt: string };
}

// ─────────────────────────────────────────────
// 공개 API
// ─────────────────────────────────────────────

/**
 * 여행 일정을 RFC 5545 iCal 형식의 문자열로 변환한다.
 *
 * @param trip              여행 데이터
 * @param resolvedGapStatus gapKey → resolvedAt 매핑 (RESOLVED 상태 포함용, 선택적)
 * @returns .ics 파일 내용 (CRLF 줄바꿈)
 */
export function generateIcal(
  trip: Trip,
  resolvedGapStatus?: GapStatusMap,
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TripFrame//TripFrame App//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    VTIMEZONE_SEOUL,
  ];

  for (const timeline of trip.timelines) {
    for (const event of timeline.events) {
      // 시간이 없으면 건너뜀
      if (!event.time) continue;

      const dtstart = toIcalDateTime(timeline.date, event.time);
      // 종료 시간: 시작 + 1시간 (상세 종료 시간 없는 경우 기본값)
      const [h, m] = event.time.split(':').map(Number);
      const endH = String(Math.min(h + 1, 23)).padStart(2, '0');
      const dtend = toIcalDateTime(timeline.date, `${endH}:${String(m).padStart(2, '0')}`);

      const vevent: string[] = [
        'BEGIN:VEVENT',
        `DTSTART;TZID=Asia/Seoul:${dtstart}`,
        `DTEND;TZID=Asia/Seoul:${dtend}`,
        foldLine(`SUMMARY:${escapeText(event.title)}`),
      ];

      if (event.location) {
        vevent.push(foldLine(`LOCATION:${escapeText(event.location)}`));
      }

      if (event.sub) {
        vevent.push(foldLine(`DESCRIPTION:${escapeText(event.sub)}`));
      }

      // UID: tripId + eventId로 안정적 식별자
      vevent.push(`UID:${trip.id}-${event.id}@tripframe.app`);

      vevent.push('END:VEVENT');
      lines.push(...vevent);
    }

    // Gap VEVENT 추가 (X-TRIPFRAME 커스텀 프로퍼티 포함)
    for (const gap of timeline.gaps) {
      const gapEvent: string[] = [
        'BEGIN:VEVENT',
        `DTSTART;TZID=Asia/Seoul:${toIcalDateTime(timeline.date, '00:00')}`,
        `DTEND;TZID=Asia/Seoul:${toIcalDateTime(timeline.date, '00:00')}`,
        foldLine(`SUMMARY:⚠ ${escapeText(gap.message)}`),
        `UID:${trip.id}-${gap.id}@tripframe.app`,
      ];

      // X-TRIPFRAME-GAP-STATUS: DANGER / WARNING / RESOLVED
      const isResolved = resolvedGapStatus && resolvedGapStatus[gap.id];
      const gapStatus = isResolved ? 'RESOLVED' : gap.severity;
      gapEvent.push(`X-TRIPFRAME-GAP-STATUS:${gapStatus}`);

      if (isResolved) {
        gapEvent.push(`X-TRIPFRAME-RESOLVED-AT:${resolvedGapStatus![gap.id].resolvedAt}`);
      }

      gapEvent.push('END:VEVENT');
      lines.push(...gapEvent);
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
