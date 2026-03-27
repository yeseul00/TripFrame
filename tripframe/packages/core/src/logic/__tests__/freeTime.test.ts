import { calculateFreeTime, calculateMultipleFreeTime } from '../freeTime';

describe('calculateFreeTime', () => {
  it('TC-016: 30분 미만 자유시간은 경고 메시지를 반환한다', () => {
    const result = calculateFreeTime('14:30', '14:50');

    expect(result.minutes).toBe(20);
    expect(result.startTime).toBe('14:30');
    expect(result.endTime).toBe('14:50');
    expect(result.warning).toContain('20분밖에 없어요');
    expect(result.warning).toContain('짐 보관');
  });

  it('TC-017: 30분~2시간 자유시간은 제안 메시지를 반환한다', () => {
    const result = calculateFreeTime('13:30', '15:00');

    expect(result.minutes).toBe(90);
    expect(result.warning).toBeUndefined();
    expect(result.suggestion).toContain('90분');
    expect(result.suggestion).toContain('카페');
  });

  it('2시간 이상 자유시간은 관광 제안을 반환한다', () => {
    const result = calculateFreeTime('12:00', '15:30');

    expect(result.minutes).toBe(210);
    expect(result.warning).toBeUndefined();
    expect(result.suggestion).toContain('3시간 30분');
    expect(result.suggestion).toContain('관광지');
  });

  it('정확히 30분인 경우 경고가 없다', () => {
    const result = calculateFreeTime('14:00', '14:30');

    expect(result.minutes).toBe(30);
    expect(result.warning).toBeUndefined();
    expect(result.suggestion).toBeDefined();
  });

  it('0분 자유시간도 계산할 수 있다', () => {
    const result = calculateFreeTime('15:00', '15:00');

    expect(result.minutes).toBe(0);
    expect(result.warning).toContain('0분밖에 없어요');
  });
});

describe('calculateMultipleFreeTime', () => {
  it('여러 구간의 자유시간을 일괄 계산한다', () => {
    const segments = [
      { arrival: '13:30', checkIn: '15:00' },
      { arrival: '10:00', checkIn: '10:15' },
      { arrival: '09:00', checkIn: '12:00' },
    ];

    const results = calculateMultipleFreeTime(segments);

    expect(results).toHaveLength(3);
    expect(results[0].minutes).toBe(90);
    expect(results[1].minutes).toBe(15);
    expect(results[1].warning).toBeDefined(); // 15분은 경고
    expect(results[2].minutes).toBe(180);
    expect(results[2].suggestion).toContain('관광지');
  });

  it('빈 배열을 처리할 수 있다', () => {
    const results = calculateMultipleFreeTime([]);

    expect(results).toEqual([]);
  });
});
