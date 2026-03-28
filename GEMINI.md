# TripFrame Project Context

## 프로젝트 개요

TripFrame은 여행 일정의 물류 공백을 찾아주는 여행 계획 앱입니다. 앵커 이벤트(항공편, 호텔)로부터 역산해 출발 시간을 계산하고, 위치 간 이동 수단 누락을 감지합니다.

**핵심 사용자 문제**: "몇 시에 집을 나서야 하지?" / "이동 수단을 빠뜨리지 않았나?"

**핵심 기능**:
- **역산 엔진**: 앵커 시간에서 각 단계를 역으로 빼 최종 출발 권장 시간 계산
- **공백 감지**: 비연속 위치 이벤트 사이의 이동 수단 누락 탐지 (DANGER / WARNING)
- **자유시간 분석**: 도착~체크인 사이의 자유시간 계산 및 활용 제안

**현재 상태**: Phase 1 (MVP) 완료 (2026-03-27), Phase 2 기획 중

---

## 기술 스택 및 아키텍처

| 레이어 | 기술 |
|--------|------|
| 모바일 앱 | Expo (React Native), TypeScript |
| 스타일링 | NativeWind v4 (Tailwind), 다크 테마 `#0F0F13` + 퍼플 `#A78BFA` |
| 상태 관리 | Zustand (Redux 금지) |
| 날짜 처리 | date-fns (다른 날짜 라이브러리 금지) |
| 테스트 | Jest (core), Playwright (E2E 웹) |

### 모노레포 구조 (pnpm workspaces)

```
TripFrame/                  # 리포 루트 (docs, spec-kit, mockup)
└── tripframe/
    ├── packages/core/      # 플랫폼 독립 비즈니스 로직 (@tripframe/core)
    └── apps/mobile/        # Expo React Native 앱
```

### Core 패키지 (`packages/core/src/`)

- **types/trip.ts** — 전체 데이터 모델 (`TripEvent`, `Gap`, `ReverseCalcResult`, `Trip`, `DayTimeline`)
- **logic/reverseEngine.ts** — `calculateReverseTime(anchorTime, steps)`
- **logic/gapEngine.ts** — `detectGaps(events)`: DANGER = 이동 수단 없음, WARNING = 버퍼 30분 미만
- **logic/freeTime.ts** — `calculateFreeTime(arrivalTime, checkInTime)`: 자유시간 계산
- **data/mock.ts** — 후쿠오카-유후인 샘플 여행 데이터 (`MOCK_TRIP`, `MOCK_REVERSE_CALC`)

### 모바일 앱 (`apps/mobile/`)

- `App.tsx` — 커스텀 하단 탭바 루트 (일정 / 공백감지 / 제안카드 / 역산)
- `src/store/useTripStore.ts` — Zustand 스토어 (`currentTab`, `trip`, `selectedDayIndex`)
- `src/screens/` — 탭별 스크린 1:1 대응

---

## 빌드 및 실행 명령어

```bash
# 의존성 설치 (tripframe/ 디렉토리에서)
cd tripframe
pnpm install

# Core 패키지
pnpm --filter @tripframe/core build      # TypeScript 빌드
pnpm --filter @tripframe/core test       # Jest 테스트
pnpm --filter @tripframe/core typecheck  # 타입 검사만

# 단일 테스트 파일 실행
cd packages/core && npx jest logic/__tests__/engine.test.ts
# 전체 테스트 파일: engine.test.ts, reverseEngine.test.ts, gapEngine.test.ts, freeTime.test.ts

# 모바일 앱
pnpm --filter mobile start    # Expo Metro 번들러 시작
pnpm --filter mobile web      # 웹으로 실행 (Playwright E2E용)
pnpm --filter mobile ios      # iOS 시뮬레이터
pnpm --filter mobile android  # Android 에뮬레이터

# Playwright E2E (tripframe/ 디렉토리에서 — 웹 서버 자동 시작)
npx playwright test
npx playwright test e2e/tripframe-mvp.spec.ts
```

---

## 핵심 원칙 (절대 규칙)

1. **로직-UI 분리** — 모든 비즈니스 로직은 `packages/core/`의 순수 함수로, UI 컴포넌트 안에 넣지 않는다
2. **`any` 타입 금지** — TypeScript strict 모드 적용
3. **함수 1개 ≤ 50줄** — 초과 시 분리
4. **테스트 커버리지 ≥ 80%** — core 패키지 기준
5. **불변 데이터** — 이벤트는 직접 수정하지 않고 새 객체 반환
6. **Gap은 파생 데이터** — Gap을 직접 저장하지 않고 항상 events에서 계산
7. **다크 테마 기본** — 퍼플 `#A78BFA` on `#0F0F13`

---

## 파일 네이밍 규칙

- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 파일명: kebab-case
- 상수: UPPER_SNAKE_CASE
- 타입/인터페이스: PascalCase (`I` 접두사 없음)

---

## 개발 우선순위

1. **P1 완료** — 역산 타임라인 엔진 + 공백 감지 (MVP, 2026-03-27 완료)
2. **P2 기획 중** — 이동 수단 비교 + 개인화 (Supabase BaaS, Google/Apple OAuth, 오프라인 동기화)
3. **P3** — 예약 알림 + 패스 경제성 분석
4. **P4** — 활동 추천

---

## 주요 참고 파일

- `TripFrame_mockup.jsx` — UI 디자인 및 색상 팔레트 원본 소스
- `TripFrame_FRS_v0.1.docx` — 계산·감지 엔진 기능 요구사항 명세
- `spec-kit/constitution.md` — 절대 원칙
- `spec-kit/tasks.md` — 전체 태스크 분해 (TASK-001~027)
- `spec-kit/phase2-overview.md` — Phase 2 전체 설계서
