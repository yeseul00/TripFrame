import { applyBufferLevel } from '../applySettings';
import type { ReverseCalcStep } from '../../types/trip';

const BASE_STEPS: ReverseCalcStep[] = [
  { id: 's1', label: '체크인', durationMinutes: 30, type: 'checkin' },
  { id: 's2', label: '공항버스', durationMinutes: 75, type: 'transport' },
  { id: 's3', label: '여유시간', durationMinutes: 30, type: 'buffer' },
  { id: 's4', label: '짐 꾸리기', durationMinutes: 20, type: 'prep' },
];

describe('applyBufferLevel', () => {
  it("'normal' — 변경 없이 원본 배열 그대로 반환", () => {
    const result = applyBufferLevel(BASE_STEPS, 'normal');
    expect(result).toBe(BASE_STEPS); // 동일 참조 (변경 없음)
  });

  it("'tight' — buffer/prep 타입만 × 0.8, transport/checkin 유지", () => {
    const result = applyBufferLevel(BASE_STEPS, 'tight');

    // checkin, transport → 불변
    expect(result[0].durationMinutes).toBe(30);
    expect(result[1].durationMinutes).toBe(75);

    // buffer: 30 × 0.8 = 24
    expect(result[2].durationMinutes).toBe(24);
    // prep: 20 × 0.8 = 16
    expect(result[3].durationMinutes).toBe(16);
  });

  it("'relaxed' — buffer/prep 타입만 × 1.2, transport/checkin 유지", () => {
    const result = applyBufferLevel(BASE_STEPS, 'relaxed');

    expect(result[0].durationMinutes).toBe(30);
    expect(result[1].durationMinutes).toBe(75);

    // buffer: 30 × 1.2 = 36
    expect(result[2].durationMinutes).toBe(36);
    // prep: 20 × 1.2 = 24
    expect(result[3].durationMinutes).toBe(24);
  });

  it('극소값 — tight 적용 후 최소 1분 보장', () => {
    const tiny: ReverseCalcStep[] = [
      { id: 'x', label: '버퍼', durationMinutes: 1, type: 'buffer' },
    ];
    const result = applyBufferLevel(tiny, 'tight');
    expect(result[0].durationMinutes).toBeGreaterThanOrEqual(1);
  });
});
