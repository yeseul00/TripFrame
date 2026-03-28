import { recalculateWithAlternative } from '../alternativeCalc';
import type { ReverseCalcStep } from '../../types/trip';

const BASE_STEPS: ReverseCalcStep[] = [
  { id: 's1', label: '공항 체크인', durationMinutes: 50, type: 'checkin' },
  { id: 's2', label: '공항 이동 버스', durationMinutes: 75, type: 'transport' },
  { id: 's3', label: '버스정류장 여유', durationMinutes: 40, type: 'buffer' },
  { id: 's4', label: '외출 준비', durationMinutes: 15, type: 'prep' },
];

// anchorTime=12:15, 총 180분 → 원래 출발 시각 09:15

describe('recalculateWithAlternative', () => {
  it('대안 교통수단이 원래보다 빠를 때 출발 시각이 늦어진다', () => {
    const fasterAlt: ReverseCalcStep = {
      id: 'alt1',
      label: '리무진 버스',
      durationMinutes: 60, // 원래 75분 → 60분으로 단축
      type: 'transport',
    };

    const result = recalculateWithAlternative('12:15', BASE_STEPS, 's2', fasterAlt);

    // 60분으로 교체 → 총 165분 → 12:15 - 165 = 09:30
    expect(result.calculatedTime).toBe('09:30');
    // originalTime(09:15) - newTime(09:30) = -15 → deltaMinutes = -15 (더 늦게 출발 가능)
    expect(result.deltaMinutes).toBe(-15);
    expect(result.alternativeStep.id).toBe('alt1');
  });

  it('대안 교통수단이 원래보다 느릴 때 출발 시각이 앞당겨진다', () => {
    const slowerAlt: ReverseCalcStep = {
      id: 'alt2',
      label: '지하철',
      durationMinutes: 90, // 원래 75분 → 90분으로 증가
      type: 'transport',
    };

    const result = recalculateWithAlternative('12:15', BASE_STEPS, 's2', slowerAlt);

    // 90분으로 교체 → 총 195분 → 12:15 - 195 = 09:00
    expect(result.calculatedTime).toBe('09:00');
    // originalTime(09:15) - newTime(09:00) = +15 → deltaMinutes = 15 (더 일찍 출발 필요)
    expect(result.deltaMinutes).toBe(15);
  });

  it('대안이 동일한 소요 시간이면 출발 시각과 delta가 변하지 않는다', () => {
    const sameAlt: ReverseCalcStep = {
      id: 'alt3',
      label: '동일 소요 교통수단',
      durationMinutes: 75,
      type: 'transport',
    };

    const result = recalculateWithAlternative('12:15', BASE_STEPS, 's2', sameAlt);

    expect(result.calculatedTime).toBe('09:15');
    expect(result.deltaMinutes).toBe(0);
  });
});
