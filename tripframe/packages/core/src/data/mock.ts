import { Trip, TripEvent, DayTimeline, ReverseCalcResult } from '../types/trip';
import { getTransportRoute } from './transport-rules';

/**
 * 후쿠오카-유후인 샘플 여행 데이터 (MVP)
 */

// ICN ↔ 홍대 공항버스 소요시간 (DB 조회, fallback: 70분)
const _icnHongdae = getTransportRoute('ICN', 'HONGDAE');
const ICN_HONGDAE_MIN = _icnHongdae?.durationMin ?? 70;

export const MOCK_REVERSE_CALC: ReverseCalcResult = {
  anchorTime: '12:15',
  steps: [
    { id: '1', label: '공항 체크인', durationMinutes: 50, type: 'checkin' },
    { id: '2', label: '공항 이동 버스', durationMinutes: ICN_HONGDAE_MIN, type: 'transport' },
    { id: '3', label: '집에서 버스정류장 여유', durationMinutes: 40, type: 'buffer' },
    { id: '4', label: '외출 준비', durationMinutes: 15, type: 'prep' },
  ],
  calculatedTime: '09:20', // 엔진에서 계산할 예상값 (ICN_HONGDAE_MIN=70기준)
};

export const MOCK_TRIP: Trip = {
  id: 'fukuoka-yufuin-2026',
  title: '후쿠오카 · 유후인',
  startDate: '2026.06.18',
  endDate: '2026.06.20',
  timelines: [
    {
      day: 1,
      date: '2026.06.18',
      events: [
        {
          id: 'e1-1',
          title: '집 출발',
          time: '09:20', // DB 조회: ICN→홍대 버스 70분 기준
          type: 'home',
          status: 'ok',
          isDerived: true,
          metadata: { steps: MOCK_REVERSE_CALC.steps },
        },
        {
          id: 'e1-2',
          title: '후쿠오카행 비행기 (OZ132)',
          sub: '인천공항 T1',
          time: '12:15',
          type: 'flight',
          status: 'ok',
        },
        {
          id: 'e1-3',
          title: '호텔 체크인',
          sub: '미야코 호텔 하카타',
          time: '15:30',
          type: 'hotel',
          status: 'ok',
          location: '하카타',
        },
        {
          id: 'e1-4',
          title: '저녁 식사',
          sub: '야키니쿠 챔피언',
          time: '18:30',
          type: 'activity',
          status: 'ok',
          location: '하카타',
        },
      ],
      gaps: [],
    },
    {
      day: 2,
      date: '2026.06.19',
      events: [
        {
          id: 'e2-1',
          title: '호텔 체크아웃',
          time: '10:00',
          type: 'hotel',
          status: 'ok',
          location: '하카타',
        },
        {
          id: 'e2-2',
          title: '점심 식사',
          time: '12:00',
          type: 'activity',
          status: 'ok',
          location: '하카타',
        },
        {
          id: 'e2-3',
          title: '유후인 도착',
          time: '15:00',
          type: 'activity',
          status: 'missing',
          location: '유후인',
        },
      ],
      gaps: [
        {
          id: 'g2-1',
          fromEventId: 'e2-2',
          toEventId: 'e2-3',
          severity: 'DANGER',
          type: 'transport',
          message: '하카타에서 유후인으로 이동하는 수단이 없습니다.',
          suggestions: ['유후인노모리 예약', '고속버스 예약', '렌터카'],
        },
      ],
    },
    {
      day: 3,
      date: '2026.06.20',
      events: [
        {
          id: 'e3-1',
          title: '유후인 출발',
          time: '13:00',
          type: 'activity',
          status: 'ok',
          location: '유후인',
        },
        {
          id: 'e3-2',
          title: '후쿠오카 공항 도착',
          time: '15:30',
          type: 'activity',
          status: 'missing',
          location: '후쿠오카 공항',
        },
        {
          id: 'e3-3',
          title: '인천행 비행기 (OZ133)',
          time: '17:15',
          type: 'flight',
          status: 'ok',
        },
      ],
      gaps: [
        {
          id: 'g3-1',
          fromEventId: 'e3-1',
          toEventId: 'e3-2',
          severity: 'DANGER',
          type: 'transport',
          message: '유후인에서 공항으로 이동하는 수단이 없습니다.',
        },
      ],
    },
  ],
};
