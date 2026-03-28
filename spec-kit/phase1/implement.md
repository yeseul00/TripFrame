# Implementation Guide: TripFrame MVP

**Feature**: `001-tripframe`
**Guide version**: 1.0
**Created**: 2026-03-24

---

## Claude Code 시작 프롬프트

아래 프롬프트를 Claude Code 첫 세션에 그대로 붙여넣으면 된다.

```
이 프로젝트의 spec-kit 문서를 읽고 TripFrame MVP를 구현해줘.

읽어야 할 파일:
- .specify/memory/constitution.md  (불변 원칙)
- specs/001-tripframe/spec.md      (기능 명세)
- specs/001-tripframe/plan.md      (기술 계획)
- specs/001-tripframe/tasks.md     (태스크 목록)

시작점: tasks.md의 TASK-001부터 순서대로 진행.
의존성 그래프를 반드시 지킬 것.
[P] 표시 태스크는 이전 태스크 완료 후 병렬 진행 가능.

각 태스크 완료 시 완료 기준(완료 기준 섹션)을 확인하고 다음으로 넘어갈 것.
```

---

## Phase별 실행 가이드

### Phase 0 실행

```bash
# TASK-001
mkdir tripframe && cd tripframe
pnpm init -y

# pnpm-workspace.yaml 생성
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
  - 'apps/*'
EOF

# TASK-002
mkdir -p packages/core/src/{types,engine,data}
mkdir -p packages/core/tests

# TASK-003 (병렬)
mkdir -p apps
cd apps
npx create-expo-app mobile --template blank-typescript
cd mobile
pnpm add zustand @react-navigation/native @react-navigation/bottom-tabs
pnpm add react-native-safe-area-context react-native-screens
```

**확인 명령**:
```bash
pnpm --filter @tripframe/core typecheck
npx expo start --no-dev
```

---

### Phase 1 체크리스트

TASK-004~010 완료 후 확인:

```bash
cd packages/core
pnpm test

# 예상 출력:
# PASS tests/reverse-calc.test.ts
# PASS tests/gap-detector.test.ts
# PASS tests/economics.test.ts
#
# Test Suites: 3 passed, 3 total
# Tests:       X passed, X total
```

핵심 테스트 케이스 수동 확인:
```typescript
// Node REPL에서
import { calculateReverseTimeline } from './packages/core/src/engine/reverse-calc'
const r = calculateReverseTimeline({ flightDepartureTime: '12:15', airlineCode: 'LJ', isInternational: true, transitMinutes: 75 })
console.log(r.homeDepart) // → "09:15"
console.log(r.steps.length) // → 6

import { detectGaps } from './packages/core/src/engine/gap-detector'
import { SAMPLE_EVENTS } from './packages/core/src/data/sample-trip'
const gaps = detectGaps(SAMPLE_EVENTS)
console.log(gaps.length) // → 3
console.log(gaps.filter(g => g.severity === 'DANGER').length) // → 2
```

---

### Phase 3 구현 순서 (화면)

각 화면 구현 시 이 순서를 지킨다:

```
1. 타입/인터페이스 확인 (이미 core에 있음)
2. 스토리북 없이 컴포넌트 단독 렌더 확인
3. 훅 연결
4. 화면 통합
```

**TimelineScreen 구현 시 주의사항**:
- `status === 'MISSING'` 이벤트는 반드시 `danger` 색상 border 적용
- `status === 'DERIVED'` 는 "역산" 보라 배지
- `status === 'AUTO'` 는 "자동삽입" 초록 배지
- alert 메시지 있으면 카드 하단에 경고 박스로 표시

**GapDetectionScreen 구현 시 주의사항**:
- 초기 상태: 모든 GapCard 접힘
- DANGER 카드 → 상단 배치 (severity 기준 정렬)
- 예약 오픈 날짜 있으면 반드시 알림 배지 표시

---

## 검증 시나리오 (샘플 데이터 기준)

### 시나리오 1: 출발 당일 타임라인
```
기대 결과 (실제 mock.ts 기준):
일정 탭 → Day 1 선택
→ 09:15 집 출발 [type: home, isDerived: true, status: ok]
→ 12:15 후쿠오카행 비행기 (OZ132) [type: flight, status: ok]
→ 15:30 호텔 체크인 - 미야코 호텔 하카타 [type: hotel, status: ok]
→ 18:30 저녁 식사 - 야키니쿠 챔피언 [type: activity, status: ok]

타입 사용 패턴:
- 'home': 역산 엔진의 최종 결과 (집 출발 시점)
- isDerived: true로 역산 생성 이벤트 표시
- metadata: { steps: ReverseCalcStep[] } 역산 단계 정보 저장
```

### 시나리오 2: 공백 감지
```
기대 결과 (실제 mock.ts 기준):
공백 탭
→ GapCard 1 (Day 2): "하카타에서 유후인으로 이동하는 수단이 없습니다"
   - severity: 'DANGER'
   - type: 'transport'
   - suggestions: ['유후인노모리 예약', '고속버스 예약', '렌터카']

→ GapCard 2 (Day 3): "유후인에서 공항으로 이동하는 수단이 없습니다"
   - severity: 'DANGER'
   - type: 'transport'

알려진 한계 (TC-010):
- 마지막 구간 (transport 하차 → 다른 위치) 감지 미지원
- 예: 버스센터(13:30, transport) → 잇코텐(15:00, hotel)
  현재: OK (90분 버퍼) / 기대: DANGER (이동수단 없음)
```

### 시나리오 3: 역산 계산
```
기대 결과 (실제 MOCK_REVERSE_CALC 기준):
역산 탭
→ anchorTime: "12:15" (비행기 출발)

→ steps:
   1. 공항 체크인 (50분) [type: checkin]
   2. 공항 이동 버스 (75분) [type: transport]
   3. 집에서 버스정류장 여유 (40분) [type: buffer]
   4. 외출 준비 (15분) [type: prep]

→ calculatedTime: "09:15" (집 출발)

ReverseCalcStep 타입 사용:
- type: 'buffer' | 'transport' | 'prep' | 'checkin'
- durationMinutes: 소요 시간
- 'prep' 타입으로 준비 시간 명시적 표현
```

### 시나리오 4: 경제성 비교
```
기대 결과:
비교 탭
→ 유후인호 버스 (추천 카드, 보라 테두리)
  - 3,250엔/인, 약 2시간, 11:30 탑승
  - 2인 합계: 6,500엔
→ 유후인노모리 (일반 카드)
  - 즉시 매진 경고
→ 경제성 분석:
  - 버스 2회 개별: 13,000엔 (초록)
  - 산큐패스 2일권: 16,000엔 (빨강)
  - "개별 구매가 3,000엔 유리"
```

---

## 주요 엣지 케이스

| 케이스 | 처리 방법 |
|--------|----------|
| 항공사 코드 DB에 없는 경우 | 기본값 60분 사용 + 경고 메시지 |
| 이벤트 0개인 경우 | 빈 타임라인 + 온보딩 안내 |
| Gap이 없는 경우 | "모든 구간이 연결됐습니다" 성공 메시지 |
| 체크인 시간 전 도착이 불가한 경우 | DANGER severity + 다른 버스 시간대 제안 |
| 동일 시간 이벤트 2개 | 예약 타입 우선순위로 정렬 |

---

## 완료 정의 (Definition of Done)

### Core 패키지
- [ ] `pnpm --filter @tripframe/core test` 전체 통과
- [ ] `pnpm --filter @tripframe/core typecheck` 오류 없음
- [ ] 커버리지 80% 이상

### 모바일 앱
- [ ] iOS 시뮬레이터에서 4개 탭 모두 렌더 확인
- [ ] 샘플 데이터로 시나리오 1~4 모두 통과
- [ ] TypeScript 컴파일 오류 없음
- [ ] 네트워크 없는 상태에서 핵심 기능 동작

### 코드 품질
- [ ] `any` 타입 0개
- [ ] 50줄 초과 함수 없음
- [ ] 컴포넌트에서 core engine 직접 import 없음 (반드시 hook 경유)

---

## Known Limitations & TODO

### TC-010: 마지막 구간 감지 미지원 (TASK-029-A)

**현황**: 미구현
**원인**: transport 이벤트가 있으면 이후 숙소까지의 이동을 감지하지 못함

**재현 시나리오**:
```
버스센터(13:30, transport) → 잇코텐(15:00, hotel)
현재: OK (90분 버퍼)
기대: DANGER (버스 하차 후 잇코텐까지 이동수단 없음)
```

**해결 방법**:
```typescript
// packages/core/src/engine/gap-detector.ts
// "교통편 하차 후 목적지" 로직 추가
if (event.type === 'transport' && nextEvent.type === 'hotel') {
  // 하차 위치와 숙소 위치가 다르면 DANGER
  if (event.location.name !== nextEvent.location.name) {
    gaps.push({
      severity: 'DANGER',
      message: `${event.location.name} 하차 후 ${nextEvent.location.name}까지 이동수단 없음`,
      // ...
    });
  }
}
```

**테스트 케이스**: TF-TC-001 § TC-010

---

### TC-016, TC-017: 자유시간 계산 미구현 (TASK-029-B)

**현황**: `calculateFreeTime()` 함수 없음
**원인**: packages/core에 미구현

**요구사항** (REQ-FR-011~013):
- 도착 시간 ~ 체크인 시간 사이 분 단위 계산
- 30분 미만 시 노란색 경고
- "체크인 전 짐 보관 가능 여부" 자동 질문 생성

**해결 방법**:
```typescript
// packages/core/src/engine/free-time.ts (NEW)
export interface FreeTimeResult {
  minutes: number;
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  warning?: string;   // 30분 미만 시 경고 메시지
}

export function calculateFreeTime(
  arrivalTime: string,
  checkInTime: string
): FreeTimeResult {
  const arrival = parseTime(arrivalTime);
  const checkIn = parseTime(checkInTime);
  const minutes = (checkIn - arrival) / (1000 * 60);

  return {
    minutes,
    startTime: arrivalTime,
    endTime: checkInTime,
    warning: minutes < 30
      ? `체크인까지 ${minutes}분밖에 없어요. 짐 보관 가능 여부를 확인하세요.`
      : undefined,
  };
}
```

**테스트 케이스**: TF-TC-001 § TC-016, TC-017

---

### E2E 테스트 셀렉터 안정성 (TASK-030)

**현황**: `getByText()` 사용으로 UI 텍스트 변경 시 테스트 깨짐
**권장**: `testID` prop 사용

**개선 방법**:
```typescript
// Before
await expect(page.getByText('09:15')).toBeVisible();

// After
<Text testID="reverse-calc-result">{result.homeDepart}</Text>
await expect(page.getByTestId('reverse-calc-result')).toHaveText('09:15');
```

**testID 규칙**:
- `timeline-item-{event.id}`: 타임라인 아이템
- `gap-card-{gap.id}`: 공백 카드
- `reverse-calc-result`: 역산 결과
- `reverse-calc-step-{index}`: 역산 단계

---

### Phase 2 선행 작업 체크리스트

MVP 완료 후 Phase 2 진입 전 준비 사항:

- [ ] **Supabase RLS 정책 설계**
  - 사용자별 데이터 격리 정책
  - 공유 여행 권한 관리

- [ ] **OAuth2 인증 플로우**
  - Google Sign-In 통합
  - Apple Sign-In (iOS)

- [ ] **로컬 → 클라우드 마이그레이션 전략**
  - AsyncStorage → Supabase 동기화 로직
  - 충돌 해결 전략 (Last Write Wins vs Merge)

- [ ] **예약 이메일 파싱 엔진**
  - Gmail API 연동
  - 항공편/숙박 정보 추출 패턴

---

## 향후 확장 포인트

Phase 2에서 추가할 것들:
- 예약 이메일 자동 파싱 (Gmail 연동)
- 항공편 지연 실시간 반영 → 타임라인 재계산
- Supabase 클라우드 동기화
- React 웹앱 확장 (`apps/web/`)

Constitution Article IX에 따라 P1 완전 완성 후 진행.

---

*implement version: 1.0 | feature: 001-tripframe*
