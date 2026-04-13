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
# 전체 테스트 파일 (logic): engine, reverseEngine, gapEngine, freeTime, alternativeCalc, applySettings, exportIcal, personaScenarios, rankOptions, sortOptions
# 전체 테스트 파일 (sync): conflictResolver, syncEngine

# Mobile app (apps/mobile)
pnpm --filter mobile start               # Start Expo Metro bundler
pnpm --filter mobile web                 # Run on web (for Playwright E2E)
pnpm --filter mobile ios                 # Run on iOS simulator
pnpm --filter mobile android             # Run on Android emulator (expo run:android)

# Native Android build (required for widget — android/ prebuild already exists)
cd tripframe/apps/mobile && npx expo run:android   # Build + launch on emulator/device
cd tripframe/apps/mobile && npx expo prebuild      # Regenerate android/ (only if app.json changes)

# Lint (from tripframe/ directory)
pnpm lint           # ESLint on apps/**/*.{ts,tsx} + packages/**/*.{ts,tsx}
pnpm lint:fix       # Auto-fix
```

## Windows Dev Environment Gotchas

- **Port 8081 blocked by Windows Firewall** — use `expo start --tunnel` (ngrok) instead of LAN IP
- **EAS upload EBUSY** — run `./gradlew --stop` in `android/` before uploading to EAS
- **pnpm install EPERM** — Metro holds file locks; kill all Node processes first (`taskkill /F /IM node.exe`)
- **`expo-crypto` pinned to `~15.0.8`** via pnpm override in `tripframe/package.json` — do NOT remove; canary versions pull in `ExpoCryptoAES` native module that fails to compile in EAS builds

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
- **types/transport.ts** — `TransportOption`, `TransportMode`, `UserPreferences`
- **logic/reverseEngine.ts** — `calculateReverseTime(anchorTime, steps)`: subtracts each step from anchor time using date-fns
- **logic/gapEngine.ts** — `detectGaps(events)`: DANGER = no transport between locations, WARNING = buffer <30min
- **logic/freeTime.ts** — `calculateFreeTime(arrivalTime, checkInTime)`: computes free time between arrival and hotel check-in; returns `FreeTimeResult` with suggestions (REQ-FR-011~013)
- **logic/alternativeCalc.ts** — Alternative route calculation
- **logic/rankOptions.ts** — Ranks transport options by user preferences
- **logic/sortOptions.ts** — Sorts transport options
- **logic/applySettings.ts** — Applies `UserPreferences` to filter/adjust transport options
- **logic/exportIcal.ts** — iCal (.ics) export from trip events
- **sync/syncEngine.ts** — `SyncEngine` class: offline queue with retry (max 3), processes `SyncTask` via `SyncExecutor`
- **sync/conflictResolver.ts** — Last Write Wins (LWW) conflict resolution for cloud sync
- **data/mock.ts** — Fukuoka-Yufuin sample trip for dev/test (`MOCK_TRIP`, `MOCK_REVERSE_CALC`)
- **data/mockTransport.ts** — Sample transport options for dev/test
- **data/transport-rules.ts** — Static transport rules by route

### Mobile App (`apps/mobile/`)
- `App.tsx` — Root with custom bottom tab bar (일정 / 공백감지 / 제안카드 / 역산)
- `src/store/useTripStore.ts` — Zustand store (`currentTab`, `events`, `selectedDayIndex`, `trips`, `hiddenTripIds`)
- `src/screens/HomeScreen.tsx` — Trip list with TripCard (gap/danger count), TripFormModal, iCal export
- `src/screens/MainTimelineScreen.tsx` — Day-by-day event timeline
- `src/screens/GapAnalysisScreen.tsx` — Gap detection results display
- `src/screens/MoveCheckScreen.tsx` — Transport options between locations
- `src/screens/SuggestionScreen.tsx` — Free time suggestions
- `src/screens/ReverseCalcDetailScreen.tsx` — Step-by-step reverse calculation
- `src/screens/SettingsScreen.tsx` — User preferences + hidden trips management
- `src/screens/OnboardingScreen.tsx` — First-run onboarding flow
- `src/screens/LoginScreen.tsx` — Supabase Auth (Google/Apple OAuth)
- `src/storage/encryptedStorage.ts` — AES-256-GCM wrapper; uses `@noble/ciphers/aes` gcm for encryption, `expo-crypto` for random bytes (key/IV generation); master key stored in `expo-secure-store` (falls back to kv-store)
- `src/screens/EventFormModal.tsx` / `TripFormModal.tsx` — CRUD modals
- `src/widget/TripWidgetProvider.tsx` — Android home screen widget UI (D-day + trip name); must use `"use no memo"` directive (React 19 Compiler breaks widget rendering without it); pass `{light, dark}` object to `renderWidget`, not a single JSX
- `src/widget/widgetTaskHandler.tsx` — Widget task handler (data bridge from SharedPreferences)
- Styling: NativeWind v4 (className), dark theme `#0F0F13` bg + `#A78BFA` purple accent
- Native prebuild: `android/` directory exists (generated by `npx expo prebuild`); do not edit manually

### Key Data Types
- `TripEvent` — Any timeline item (flight, hotel, transport, activity); `isDerived: true` marks reverse-calc-generated events
- `DayTimeline` — Bundles `events[]` + `gaps[]` for one day; `Trip.timelines` is an array of these
- `Gap` — Derived from events: `DANGER` (no transport), `WARNING` (<30min buffer)
- `ReverseCalcStep` — Single step in reverse calculation (buffer, transport, prep, checkin)
- `FreeTimeResult` — Output of `calculateFreeTime()`; defined in `logic/freeTime.ts` (not in types/trip.ts)
- `TransportOption` — A single transport choice with mode, duration, price, bookingUrl
- `UserPreferences` — `luggageSize`, `transportPreference`, `timeBuffer`
- `SyncTask` — Queued sync operation with type, payload, timestamp, retryCount

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

## Conventions

### File Naming
- Components: PascalCase
- Functions/variables: camelCase
- Files: kebab-case
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase (no `I` prefix)

### Commit Messages
Format: `<type>: <subject>` — types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`

### CI (GitHub Actions)
- `.github/workflows/ci.yml` runs on PR to `main` (ubuntu, Node 20, pnpm 9)
- Steps: install → core unit tests → core typecheck → mobile unit tests
- PRs must pass CI before merge

## Phase Progress

- **Phase 1** (COMPLETE 2026-03-27): Reverse timeline engine + Gap detection (MVP)
- **Phase 2** (COMPLETE): Transport options, Supabase BaaS, OAuth, AsyncStorage offline-first, LWW cloud sync
- **Phase 3** (COMPLETE): Home screen CRUD, Trip management, UX improvements
- **Phase 4** (COMPLETE): Settings, onboarding, persona scenarios
- **Phase 5** (COMPLETE): EAS Dev Build, security (encryptedStorage), tab redesign, iCal Export
- **Phase 6** (ACTIVE — TASK-100~108): D-day widget (Android), CI/CD (GitHub Actions), Sentry, closed beta
  - TASK-100 (SDK 호환성 체크) ✅ COMPLETE — Expo SDK 54 + react-native-android-widget ^0.20.1 호환 확인
  - TASK-101 (GitHub Actions CI) ✅ COMPLETE — `.github/workflows/ci.yml` (PR 트리거, core+mobile 테스트)
  - TASK-102 (D-day 위젯 POC) 🔄 IN PROGRESS — 위젯 표시 확인 ✅, 배경색 #0F0F13 수정 완료 ✅ / 잔여: SharedPreferences 데이터 브릿지 (useTripStore → SharedPreferences → 위젯 읽기)
  - TASK-103~108: 미시작
  - Target: closed beta 10~20명 배포 (Phase 6 말)
- **Phase 7** (PLANNED): App store production release, affiliate booking links, city templates

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

**spec-kit 문서 위치** (`spec-kit/` — 리포 루트):
- `constitution.md` — 불변 원칙 (헌법)
- `e2e-test-workflow.md` — E2E 테스트 워크플로우
- `phase-transition-checklist.md` — **Phase 전환 체크리스트** (Phase 종료 → 다음 Phase 설계 가이드)
- `personas.md` — 사용자 페르소나 정의
- `spec.md` — **[현재 활성]** Phase 6 기능 명세 (Feature 006)
- `plan.md` — **[현재 활성]** Phase 6 기술 계획
- `tasks.md` — **[현재 활성]** Phase 6 태스크 목록 (TASK-100~108)
- `phase1/` — Phase 1 아카이브
- `phase2/` — Phase 2 아카이브 (spec/plan/tasks + 상세 설계 문서)
- `phase3/`~`phase5/` — 완료 Phase 아카이브
- `phase6/` — Phase 6 상세 참고 문서 (현재 진행)

## Collaboration Board

- **Notion 협업 보드**: https://www.notion.so/harichon/Tripframe_project-32ee4cfd265280158a1dd02d50d0373e
  - DB에 모든 Phase의 작업 항목, 결과서, 분석 문서가 등록됨
  - 새 문서/작업 결과를 DB에 업로드할 때 이 URL 사용

## Key Reference Files
- `TripFrame_mockup.jsx` — UI 디자인 및 색상 팔레트의 원본 소스
- `TripFrame_FRS_v0.1.docx` — 계산·감지 엔진의 기능 요구사항 명세
- `spec-kit/constitution.md` — 절대 원칙 (아키텍처 및 코드 품질 규칙)
- `spec-kit/tasks.md` — Phase 6 태스크 목록 (TASK-100~108)
- `analyze/` — 전문가 리뷰 및 분석 문서 (TF-REVIEW-000~CLAUDE)
