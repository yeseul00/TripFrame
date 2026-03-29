/**
 * transport-rules.ts — 교통 데이터 내장 DB (TASK-080, TASK-081)
 *
 * 공항버스/KTX/SRT 주요 노선 스냅샷.
 * isEstimate: false = 실제 시각표 기준, true = 추정값.
 * Phase 5에서 공공 API로 업데이트 예정.
 */

export interface TransportRoute {
  id: string;
  from: string;         // 출발지 코드 (예: 'ICN', 'GMP', 'SEOUL')
  to: string;           // 도착지 코드
  type: 'airport-bus' | 'ktx' | 'srt' | 'subway' | 'arex';
  label: string;        // 노선명 또는 교통편명
  durationMin: number;  // 소요시간(분)
  priceKrw: number;     // 요금(원)
  firstDeparture: string;  // 첫차 HH:MM
  lastDeparture: string;   // 막차 HH:MM
  intervalMin: number;     // 배차 간격(분)
  isEstimate: boolean;
}

// ─────────────────────────────────────────────────────────────────
// 인천국제공항(ICN) ↔ 서울 주요 구간 공항버스 / AREX
// ─────────────────────────────────────────────────────────────────
const ICN_ROUTES: TransportRoute[] = [
  {
    id: 'icn-gangnam-bus',
    from: 'ICN', to: 'GANGNAM',
    type: 'airport-bus',
    label: '강남행 공항버스 (6001)',
    durationMin: 80, priceKrw: 17000,
    firstDeparture: '05:00', lastDeparture: '22:30', intervalMin: 30,
    isEstimate: false,
  },
  {
    id: 'icn-hongdae-bus',
    from: 'ICN', to: 'HONGDAE',
    type: 'airport-bus',
    label: '홍대·신촌행 공항버스 (6002)',
    durationMin: 70, priceKrw: 17000,
    firstDeparture: '06:00', lastDeparture: '23:00', intervalMin: 30,
    isEstimate: false,
  },
  {
    id: 'icn-seoul-station-arex',
    from: 'ICN', to: 'SEOUL_STATION',
    type: 'arex',
    label: 'AREX 직통 (인천공항→서울역)',
    durationMin: 43, priceKrw: 9500,
    firstDeparture: '05:20', lastDeparture: '22:40', intervalMin: 30,
    isEstimate: false,
  },
  {
    id: 'icn-seoul-station-arex-allstop',
    from: 'ICN', to: 'SEOUL_STATION',
    type: 'arex',
    label: 'AREX 일반 (인천공항→서울역)',
    durationMin: 58, priceKrw: 4950,
    firstDeparture: '05:23', lastDeparture: '23:32', intervalMin: 12,
    isEstimate: false,
  },
  {
    id: 'icn-jamsil-bus',
    from: 'ICN', to: 'JAMSIL',
    type: 'airport-bus',
    label: '잠실행 공항버스 (6003)',
    durationMin: 90, priceKrw: 17000,
    firstDeparture: '05:30', lastDeparture: '22:00', intervalMin: 35,
    isEstimate: false,
  },
  {
    id: 'icn-suwon-bus',
    from: 'ICN', to: 'SUWON',
    type: 'airport-bus',
    label: '수원행 공항버스 (3002)',
    durationMin: 100, priceKrw: 16000,
    firstDeparture: '06:00', lastDeparture: '21:30', intervalMin: 40,
    isEstimate: false,
  },
  {
    id: 'icn-incheon-city-bus',
    from: 'ICN', to: 'INCHEON_CITY',
    type: 'airport-bus',
    label: '인천시내행 공항버스',
    durationMin: 40, priceKrw: 2800,
    firstDeparture: '05:30', lastDeparture: '23:30', intervalMin: 15,
    isEstimate: false,
  },
  {
    id: 'icn-sinchon-bus',
    from: 'ICN', to: 'SINCHON',
    type: 'airport-bus',
    label: '신촌·마포행 공항버스 (6011)',
    durationMin: 75, priceKrw: 17000,
    firstDeparture: '06:30', lastDeparture: '22:30', intervalMin: 40,
    isEstimate: false,
  },
  {
    id: 'icn-yongsan-bus',
    from: 'ICN', to: 'YONGSAN',
    type: 'airport-bus',
    label: '용산·이태원행 공항버스 (6015)',
    durationMin: 70, priceKrw: 17000,
    firstDeparture: '07:00', lastDeparture: '22:00', intervalMin: 40,
    isEstimate: true,
  },
  {
    id: 'icn-bundang-bus',
    from: 'ICN', to: 'BUNDANG',
    type: 'airport-bus',
    label: '분당행 공항버스 (6007)',
    durationMin: 100, priceKrw: 17000,
    firstDeparture: '05:30', lastDeparture: '22:00', intervalMin: 40,
    isEstimate: false,
  },
];

// ─────────────────────────────────────────────────────────────────
// 김포공항(GMP) ↔ 서울
// ─────────────────────────────────────────────────────────────────
const GMP_ROUTES: TransportRoute[] = [
  {
    id: 'gmp-seoul-subway',
    from: 'GMP', to: 'SEOUL',
    type: 'subway',
    label: '5호선/9호선 (김포공항역)',
    durationMin: 35, priceKrw: 1400,
    firstDeparture: '05:10', lastDeparture: '00:00', intervalMin: 5,
    isEstimate: false,
  },
  {
    id: 'gmp-gangnam-bus',
    from: 'GMP', to: 'GANGNAM',
    type: 'airport-bus',
    label: '강남행 공항버스 (6000)',
    durationMin: 50, priceKrw: 6000,
    firstDeparture: '05:40', lastDeparture: '22:20', intervalMin: 25,
    isEstimate: false,
  },
];

// ─────────────────────────────────────────────────────────────────
// KTX 주요 10개 노선
// ─────────────────────────────────────────────────────────────────
const KTX_ROUTES: TransportRoute[] = [
  {
    id: 'ktx-seoul-busan',
    from: 'SEOUL_STATION', to: 'BUSAN',
    type: 'ktx',
    label: 'KTX 서울-부산',
    durationMin: 162, priceKrw: 59800,
    firstDeparture: '05:15', lastDeparture: '21:55', intervalMin: 15,
    isEstimate: false,
  },
  {
    id: 'ktx-seoul-daejeon',
    from: 'SEOUL_STATION', to: 'DAEJEON',
    type: 'ktx',
    label: 'KTX 서울-대전',
    durationMin: 50, priceKrw: 23700,
    firstDeparture: '05:15', lastDeparture: '21:55', intervalMin: 15,
    isEstimate: false,
  },
  {
    id: 'ktx-seoul-daegu',
    from: 'SEOUL_STATION', to: 'DAEGU',
    type: 'ktx',
    label: 'KTX 서울-동대구',
    durationMin: 102, priceKrw: 41300,
    firstDeparture: '05:15', lastDeparture: '21:55', intervalMin: 20,
    isEstimate: false,
  },
  {
    id: 'ktx-seoul-gwangju',
    from: 'SEOUL_STATION', to: 'GWANGJU_SONGJEONG',
    type: 'ktx',
    label: 'KTX 서울-광주송정',
    durationMin: 88, priceKrw: 36700,
    firstDeparture: '06:00', lastDeparture: '21:30', intervalMin: 30,
    isEstimate: false,
  },
  {
    id: 'ktx-seoul-mokpo',
    from: 'SEOUL_STATION', to: 'MOKPO',
    type: 'ktx',
    label: 'KTX 서울-목포',
    durationMin: 150, priceKrw: 50200,
    firstDeparture: '06:00', lastDeparture: '20:30', intervalMin: 60,
    isEstimate: false,
  },
  {
    id: 'ktx-seoul-pohang',
    from: 'SEOUL_STATION', to: 'POHANG',
    type: 'ktx',
    label: 'KTX 서울-포항',
    durationMin: 132, priceKrw: 46200,
    firstDeparture: '06:40', lastDeparture: '21:30', intervalMin: 60,
    isEstimate: false,
  },
  {
    id: 'ktx-seoul-yeosu',
    from: 'SEOUL_STATION', to: 'YEOSU_EXPO',
    type: 'ktx',
    label: 'KTX 서울-여수EXPO',
    durationMin: 155, priceKrw: 51700,
    firstDeparture: '07:00', lastDeparture: '20:00', intervalMin: 90,
    isEstimate: false,
  },
  {
    id: 'ktx-seoul-jeonju',
    from: 'SEOUL_STATION', to: 'JEONJU',
    type: 'ktx',
    label: 'KTX 서울-전주',
    durationMin: 73, priceKrw: 30200,
    firstDeparture: '06:00', lastDeparture: '21:00', intervalMin: 60,
    isEstimate: false,
  },
  {
    id: 'ktx-seoul-jinju',
    from: 'SEOUL_STATION', to: 'JINJU',
    type: 'ktx',
    label: 'KTX 서울-진주',
    durationMin: 180, priceKrw: 55400,
    firstDeparture: '06:10', lastDeparture: '20:00', intervalMin: 120,
    isEstimate: true,
  },
  {
    id: 'ktx-seoul-ulsan',
    from: 'SEOUL_STATION', to: 'ULSAN',
    type: 'ktx',
    label: 'KTX 서울-울산(통도사)',
    durationMin: 147, priceKrw: 51700,
    firstDeparture: '05:15', lastDeparture: '21:55', intervalMin: 30,
    isEstimate: false,
  },
];

// ─────────────────────────────────────────────────────────────────
// SRT 주요 5개 노선 (수서 출발)
// ─────────────────────────────────────────────────────────────────
const SRT_ROUTES: TransportRoute[] = [
  {
    id: 'srt-suseo-busan',
    from: 'SUSEO', to: 'BUSAN',
    type: 'srt',
    label: 'SRT 수서-부산',
    durationMin: 155, priceKrw: 55200,
    firstDeparture: '05:30', lastDeparture: '21:30', intervalMin: 20,
    isEstimate: false,
  },
  {
    id: 'srt-suseo-gwangju',
    from: 'SUSEO', to: 'GWANGJU_SONGJEONG',
    type: 'srt',
    label: 'SRT 수서-광주송정',
    durationMin: 83, priceKrw: 34200,
    firstDeparture: '06:00', lastDeparture: '22:00', intervalMin: 30,
    isEstimate: false,
  },
  {
    id: 'srt-suseo-daejeon',
    from: 'SUSEO', to: 'DAEJEON',
    type: 'srt',
    label: 'SRT 수서-대전',
    durationMin: 47, priceKrw: 21700,
    firstDeparture: '05:30', lastDeparture: '22:00', intervalMin: 20,
    isEstimate: false,
  },
  {
    id: 'srt-suseo-daegu',
    from: 'SUSEO', to: 'DAEGU',
    type: 'srt',
    label: 'SRT 수서-동대구',
    durationMin: 96, priceKrw: 37800,
    firstDeparture: '05:30', lastDeparture: '21:30', intervalMin: 25,
    isEstimate: false,
  },
  {
    id: 'srt-suseo-mokpo',
    from: 'SUSEO', to: 'MOKPO',
    type: 'srt',
    label: 'SRT 수서-목포',
    durationMin: 143, priceKrw: 46600,
    firstDeparture: '06:00', lastDeparture: '21:00', intervalMin: 60,
    isEstimate: false,
  },
];

// ─────────────────────────────────────────────────────────────────
// 전체 통합 DB
// ─────────────────────────────────────────────────────────────────
export const TRANSPORT_ROUTES: TransportRoute[] = [
  ...ICN_ROUTES,
  ...GMP_ROUTES,
  ...KTX_ROUTES,
  ...SRT_ROUTES,
];

/**
 * 출발지→도착지 코드로 노선을 조회한다.
 * 없으면 null 반환 (fallback은 호출자가 처리).
 */
export function getTransportRoute(
  from: string,
  to: string,
): TransportRoute | null {
  return (
    TRANSPORT_ROUTES.find(
      (r) => r.from === from && r.to === to,
    ) ?? null
  );
}

/**
 * 출발지 코드에 해당하는 모든 노선을 반환한다.
 */
export function getRoutesByOrigin(from: string): TransportRoute[] {
  return TRANSPORT_ROUTES.filter((r) => r.from === from);
}
