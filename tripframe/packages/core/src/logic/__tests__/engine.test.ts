import { calculateReverseTime } from '../reverseEngine';
import { detectGaps } from '../gapEngine';
import { MOCK_REVERSE_CALC, MOCK_TRIP } from '../../data/mock';

describe('TripFrame Core Engines', () => {
  
  describe('Reverse Calculation Engine', () => {
    it('비행기 출발 시간으로부터 모든 단계를 차감하여 정확한 출발 시간을 계산해야 한다', () => {
      const result = calculateReverseTime(MOCK_REVERSE_CALC.anchorTime, MOCK_REVERSE_CALC.steps);
      expect(result).toBe('09:15');
    });

    it('단계가 없을 경우 앵커 시간을 그대로 반환해야 한다', () => {
      const result = calculateReverseTime('10:00', []);
      expect(result).toBe('10:00');
    });
  });

  describe('Gap Detection Engine', () => {
    it('서로 다른 장소 사이에 이동 수단이 없을 경우 공백(Gap)을 감지해야 한다 (Day 2)', () => {
      const day2Events = MOCK_TRIP.timelines[1].events;
      const gaps = detectGaps(day2Events);

      expect(gaps.length).toBeGreaterThan(0);
      expect(gaps[0].message).toContain('하카타에서 유후인으로');
      expect(gaps[0].severity).toBe('DANGER');
    });

    it('장소가 같거나 이동 수단이 포함된 경우 공백을 감지하지 않아야 한다 (Day 1)', () => {
      const day1Events = MOCK_TRIP.timelines[0].events;
      const gaps = detectGaps(day1Events);
      
      // Day 1은 현재 목업 데이터상 장소가 하카타로 동일하거나 명시적 공백이 없음
      expect(gaps.length).toBe(0);
    });
  });

});
