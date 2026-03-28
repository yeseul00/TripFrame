import type { TransportOption } from '../types/transport';

/**
 * Gap ID → 이동 수단 옵션 목 데이터
 * 실제 API 연동 전까지 사용 (후쿠오카-유후인 샘플 여행 기준)
 */
export const MOCK_TRANSPORT_OPTIONS: Record<string, TransportOption[]> = {
  'g2-1': [
    {
      id: 'g2-1-train',
      mode: 'PUBLIC',
      label: '유후인노모리 (특급열차)',
      durationMinutes: 120,
      pricePerPerson: 4400,
      bookingUrl: 'https://www.jrkyushu.co.jp',
      notes: '사전 예약 필수 · 짐 보관 서비스 있음',
      requiresBooking: true,
    },
    {
      id: 'g2-1-bus',
      mode: 'PUBLIC',
      label: '고속버스 (하카타BT → 유후인)',
      durationMinutes: 105,
      pricePerPerson: 3250,
      bookingUrl: 'https://www.kamenoi-bus.jp',
      notes: '대형 캐리어 1개 무료 적재',
      requiresBooking: false,
    },
    {
      id: 'g2-1-taxi',
      mode: 'TAXI',
      label: '택시 (하카타 → 유후인)',
      durationMinutes: 90,
      pricePerPerson: 25000,
      notes: '4인까지 탑승 가능 · 문 앞까지',
      requiresBooking: false,
    },
    {
      id: 'g2-1-rental',
      mode: 'RENTAL',
      label: '렌터카',
      durationMinutes: 95,
      pricePerPerson: 8000,
      bookingUrl: 'https://www.times-car.co.jp',
      notes: '국제운전면허 필요 · 주차비 별도',
      requiresBooking: true,
    },
  ],
  'g3-1': [
    {
      id: 'g3-1-bus',
      mode: 'PUBLIC',
      label: '고속버스 (유후인 → 후쿠오카공항)',
      durationMinutes: 130,
      pricePerPerson: 3250,
      bookingUrl: 'https://www.kamenoi-bus.jp',
      notes: '공항 직행 · 수하물 적재 가능',
      requiresBooking: false,
    },
    {
      id: 'g3-1-train',
      mode: 'PUBLIC',
      label: '열차 + 지하철 환승',
      durationMinutes: 155,
      pricePerPerson: 3800,
      notes: '하카타역 환승 필요',
      requiresBooking: false,
    },
    {
      id: 'g3-1-taxi',
      mode: 'TAXI',
      label: '택시 (유후인 → 후쿠오카공항)',
      durationMinutes: 110,
      pricePerPerson: 28000,
      notes: '공항 직접 도착 · 체크인 여유 확보',
      requiresBooking: false,
    },
  ],
};

export function getMockTransportOptions(gapId: string): TransportOption[] {
  return MOCK_TRANSPORT_OPTIONS[gapId] ?? [];
}
