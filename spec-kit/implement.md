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
기대 결과:
일정 탭 → Day1 선택
→ 09:15 합정동 출발 [역산]
→ 10:45 카운터 도착 권장 [역산] + 경고 색상
→ 12:15 LJ263 출발 [확정]
→ 13:40 후쿠오카 도착 [확정]
→ 14:10 공항→하카타 [확정]
→ 15:00 오리엔탈 호텔 체크인 [확정]
→ 15:00~ 자유 시간 [FREE]
```

### 시나리오 2: 공백 감지
```
기대 결과:
공백 탭
→ GapCard 1: "하카타→유후인 이동 수단 없음" (DANGER, 빨강)
  → 탭 → 유후인호 버스 옵션 (추천), 유후인노모리 (즉시매진)
  → "예약 오픈 5/20 08:00" 배지
→ GapCard 2: "유후인→후쿠오카공항 이동 수단 없음" (DANGER, 빨강)
  → 탭 → 공항 직행 버스 옵션 (추천)
→ GapCard 3: "버스센터→잇코텐 구간 자동 삽입" (AUTO, 초록)
  → 탭 → 택시(추천), 도보(비추천)
```

### 시나리오 3: 역산 계산
```
기대 결과:
역산 탭
→ Anchor: LJ263 12:15
→ Step1: 수속 마감 11:25 (출발 50분 전 · 빨강)
→ Step2: 카운터 권장 10:45 (마감 40분 전 여유)
→ Step3: 공항버스 소요 −75분 (노랑)
→ Step4: 합정역 탑승 09:20
→ Step5: 집 출발 09:15 (보라 · 굵게)
→ 결과 카드: 09:15 (버스) / 09:40 (철도)
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

## 향후 확장 포인트

Phase 2에서 추가할 것들:
- 예약 이메일 자동 파싱 (Gmail 연동)
- 항공편 지연 실시간 반영 → 타임라인 재계산
- Supabase 클라우드 동기화
- React 웹앱 확장 (`apps/web/`)

Constitution Article IX에 따라 P1 완전 완성 후 진행.

---

*implement version: 1.0 | feature: 001-tripframe*
