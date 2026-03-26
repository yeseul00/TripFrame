import { parse, subMinutes, format } from 'date-fns';
import { ReverseCalcStep } from '../types/trip';

/**
 * 앵커 시간(Target Time)으로부터 각 단계의 소요 시간을 차감하여 최종 출발 시간을 계산합니다.
 * 
 * @param anchorTime "HH:mm" 형식의 기준 시간 (예: 비행기 출발 시간)
 * @param steps 차감할 소요 시간 단계 목록
 * @returns "HH:mm" 형식의 계산된 출발 시간
 */
export function calculateReverseTime(anchorTime: string, steps: ReverseCalcStep[]): string {
  // 날짜 정보는 중요하지 않으므로 임의의 날짜를 기준으로 파싱합니다.
  const baseDate = new Date(2026, 0, 1);
  let currentTime = parse(anchorTime, 'HH:mm', baseDate);

  // 각 단계를 순차적으로 순회하며 시간 차감
  for (const step of steps) {
    currentTime = subMinutes(currentTime, step.durationMinutes);
  }

  return format(currentTime, 'HH:mm');
}
