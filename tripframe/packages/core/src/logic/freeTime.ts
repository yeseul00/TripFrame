/**
 * 자유시간 계산 엔진
 * REQ-FR-011~013: 도착~체크인 사이 자유시간 분석
 */

export interface FreeTimeResult {
  minutes: number;
  startTime: string;  // "HH:mm" 형식
  endTime: string;    // "HH:mm" 형식
  warning?: string;   // 30분 미만 시 경고 메시지
  suggestion?: string; // 자유시간 활용 제안
}

/**
 * "HH:mm" 형식 시간을 Date 객체로 변환
 */
function parseTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * 두 시간 사이의 자유시간을 계산합니다.
 *
 * @param arrivalTime 도착 시간 ("HH:mm")
 * @param checkInTime 체크인 시간 ("HH:mm")
 * @returns 자유시간 분석 결과
 *
 * @example
 * ```ts
 * const result = calculateFreeTime("13:30", "15:00");
 * // => { minutes: 90, startTime: "13:30", endTime: "15:00", suggestion: "..." }
 * ```
 */
export function calculateFreeTime(
  arrivalTime: string,
  checkInTime: string
): FreeTimeResult {
  const arrival = parseTime(arrivalTime);
  const checkIn = parseTime(checkInTime);
  const minutes = (checkIn.getTime() - arrival.getTime()) / (1000 * 60);

  const result: FreeTimeResult = {
    minutes,
    startTime: arrivalTime,
    endTime: checkInTime,
  };

  // 30분 미만: 경고
  if (minutes < 30) {
    result.warning = `체크인까지 ${minutes}분밖에 없어요. 짐 보관 가능 여부를 호텔에 확인하세요.`;
  }
  // 30분~2시간: 가벼운 활동 제안
  else if (minutes < 120) {
    result.suggestion = `${minutes}분의 자유시간이 있어요. 근처 카페나 편의점을 둘러보는 건 어떨까요?`;
  }
  // 2시간 이상: 관광 제안
  else {
    result.suggestion = `${Math.floor(minutes / 60)}시간 ${minutes % 60}분의 자유시간이 있어요. 근처 관광지를 방문해보세요!`;
  }

  return result;
}

/**
 * 여러 구간의 자유시간을 일괄 계산합니다.
 *
 * @param segments 시간 구간 배열 [{arrival, checkIn}, ...]
 * @returns 자유시간 결과 배열
 */
export function calculateMultipleFreeTime(
  segments: Array<{ arrival: string; checkIn: string }>
): FreeTimeResult[] {
  return segments.map(({ arrival, checkIn }) =>
    calculateFreeTime(arrival, checkIn)
  );
}
