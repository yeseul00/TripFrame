# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TripFrame is a travel planning app that identifies logistical gaps in trip itineraries. It calculates departure times by reverse-calculating from anchor events (flights, hotels) and detects missing transport links between locations.

**Target user problem**: "What time should I leave home?" and "Did I forget to book transport between events?"

## Commands

```bash
# All commands run from /tripframe directory
cd tripframe

# Install dependencies (pnpm workspace)
pnpm install

# Core package (packages/core)
pnpm --filter @tripframe/core build      # Build TypeScript
pnpm --filter @tripframe/core test       # Run Jest tests
pnpm --filter @tripframe/core typecheck  # Type check only

# Single test file
cd packages/core && npx jest logic/__tests__/engine.test.ts
# 전체 테스트 파일: engine.test.ts, reverseEngine.test.ts, gapEngine.test.ts, freeTime.test.ts

# Mobile app (apps/mobile)
pnpm --filter mobile start               # Start Expo Metro bundler
pnpm --filter mobile web                 # Run on web (for Playwright E2E)
pnpm --filter mobile ios                 # Run on iOS simulator
pnpm --filter mobile android             # Run on Android emulator
```

## Architecture

### Monorepo Structure (pnpm workspaces)
```
TripFrame/                  # repo root (docs, spec-kit, mockup)
└── tripframe/
    ├── packages/core/      # Platform-independent business logic (@tripframe/core)
    └── apps/mobile/        # Expo React Native app
```

### Core Package (`packages/core/src/`)
- **types/trip.ts** — All data models (`TripEvent`, `Gap`, `ReverseCalcResult`, `Trip`, `DayTimeline`)
- **logic/reverseEngine.ts** — `calculateReverseTime(anchorTime, steps)`: subtracts each step from anchor time using date-fns
- **logic/gapEngine.ts** — `detectGaps(events)`: DANGER = no transport between locations, WARNING = buffer <30min
- **logic/freeTime.ts** — `calculateFreeTime(arrivalTime, checkInTime)`: computes free time between arrival and hotel check-in; returns `FreeTimeResult` with suggestions (REQ-FR-011~013)
- **data/mock.ts** — Fukuoka-Yufuin sample trip for dev/test (`MOCK_TRIP`, `MOCK_REVERSE_CALC`)

### Mobile App (`apps/mobile/`)
- `App.tsx` — Root with custom bottom tab bar (일정 / 공백감지 / 제안카드 / 역산)
- `src/store/useTripStore.ts` — Zustand store (`currentTab`, `events`, `selectedDayIndex`)
- `src/screens/` — One screen per tab
- Styling: NativeWind v4 (className), dark theme `#0F0F13` bg + `#A78BFA` purple accent

### Key Data Types
- `TripEvent` — Any timeline item (flight, hotel, transport, activity); `isDerived: true` marks reverse-calc-generated events
- `DayTimeline` — Bundles `events[]` + `gaps[]` for one day; `Trip.timelines` is an array of these
- `Gap` — Derived from events: `DANGER` (no transport), `WARNING` (<30min buffer)
- `ReverseCalcStep` — Single step in reverse calculation (buffer, transport, prep, checkin)
- `FreeTimeResult` — Output of `calculateFreeTime()`; defined in `logic/freeTime.ts` (not in types/trip.ts)

## Constitution Rules (`spec-kit/constitution.md`)

These rules are non-negotiable:

1. **Logic-UI separation** — All business logic in `packages/core/` as pure functions, never in UI components
2. **No `any` type** — TypeScript strict mode enforced
3. **Single function ≤50 lines** — Split if exceeded
4. **Test coverage ≥80%** for core package
5. **Immutable data** — Events are never mutated, always return new objects
6. **Offline-first** — Core features work without network
7. **Dark theme default** — Purple accent `#A78BFA` on `#0F0F13`
8. **Zustand only** — Redux is forbidden for state management
9. **date-fns for dates** — No other date library
10. **Gap is derived data** — Never store Gap directly; always compute from events

## File Naming
- Components: PascalCase
- Functions/variables: camelCase
- Files: kebab-case
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase (no `I` prefix)

## Priority (P1 must complete before P2)
1. P1: Reverse timeline engine + Gap detection (MVP) — **COMPLETE** (Phase 1 done 2026-03-27)
2. P2: Transport options + Customization — **IN PLANNING** (see `spec-kit/phase2-overview.md`)
   - Supabase BaaS (PostgreSQL + RLS + Realtime)
   - Google/Apple OAuth via Supabase Auth
   - AsyncStorage for offline-first local persistence
   - Cloud sync with Last Write Wins conflict resolution
3. P3: Booking alerts + Pass economics analysis
4. P4: Activity recommendations

## E2E Testing

```bash
# Run Playwright E2E (from tripframe/ directory — auto-starts web server)
cd tripframe && npx playwright test

# Run specific E2E spec
cd tripframe && npx playwright test e2e/tripframe-mvp.spec.ts
```

- **Test locations**: `tripframe/e2e/` (main MVP tests) and `tripframe/apps/mobile/e2e/` (feature-level specs)
- **Web E2E (AI-driven)**: `pnpm --filter mobile web` → `localhost:8081` → Playwright MCP
- **Mobile native E2E**: Maestro + Android emulator (Phase 2)
- Playwright MCP registered in `.mcp.json` at repo root
- Playwright config auto-starts Expo web server (`localhost:8081`) via `webServer` setting

## spec-kit 워크플로우

새 기능 개발 시 리포 루트의 `./speckit` 스크립트로 문서를 생성하고 구현을 진행합니다.

```bash
# 기능 명세 → 계획 → 태스크 → 구현 순서
./speckit speckit.specify "기능 설명"   # spec-kit/spec.md 생성
./speckit speckit.plan                  # spec-kit/plan.md 생성
./speckit speckit.tasks                 # spec-kit/tasks.md 생성
./speckit speckit.implement             # tasks.md 기반 구현 실행
./speckit speckit.analyze               # spec/plan/tasks 간 일관성 검사
./speckit list                          # 전체 명령어 목록 확인
```

Phase 3 문서가 이미 존재하므로 구현 단계부터 바로 시작 가능:
```bash
./speckit speckit.implement
```

**spec-kit 문서 위치** (`spec-kit/`):
- `constitution.md` — 불변 원칙 (헌법)
- `e2e-test-workflow.md` — E2E 테스트 워크플로우
- `phase-transition-checklist.md` — **Phase 전환 체크리스트** (Phase 종료 → 다음 Phase 설계 가이드)
- `spec.md` — **[현재 활성]** Phase 6 기능 명세
- `plan.md` — **[현재 활성]** Phase 6 기술 계획
- `tasks.md` — **[현재 활성]** Phase 6 태스크 목록
- `phase1/` — Phase 1 아카이브
- `phase2/` — Phase 2 아카이브 (spec/plan/tasks + 상세 설계 문서)
- `phase3/` — Phase 3 아카이브
- `phase4/` — Phase 4 아카이브
- `phase5/` — Phase 5 아카이브
- `phase6/` — Phase 6 상세 문서 (현재 진행)

## Collaboration Board

- **Notion 협업 보드**: https://www.notion.so/harichon/Tripframe_project-32ee4cfd265280158a1dd02d50d0373e
  - DB에 모든 Phase의 작업 항목, 결과서, 분석 문서가 등록됨
  - 새 문서/작업 결과를 DB에 업로드할 때 이 URL 사용

## Key Reference Files
- `TripFrame_mockup.jsx` — UI 디자인 및 색상 팔레트의 원본 소스
- `TripFrame_FRS_v0.1.docx` — 계산·감지 엔진의 기능 요구사항 명세
- `spec-kit/constitution.md` — 절대 원칙 (아키텍처 및 코드 품질 규칙)
- `spec-kit/tasks.md` — Phase 4 태스크 목록 (TASK-072~087)
- `analyze/` — 전문가 리뷰 및 분석 문서 (TF-REVIEW-000~CLAUDE)
