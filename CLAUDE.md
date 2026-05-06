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

## Vercel Web Deployment

Vercel 서버 사이드 빌드는 OOM(exit code 137)으로 실패함 — **로컬에서 빌드 후 `dist/` 폴더만 배포**한다.

```bash
# 1. 웹 번들 빌드 (apps/mobile 디렉토리에서)
cd tripframe/apps/mobile
rm -rf dist && npx expo export --platform web --clear

# 2. vercel.json을 dist/에 복사 (SPA rewrite 규칙 포함)
cp vercel.json dist/vercel.json

# 3. dist/ 폴더만 Vercel에 배포
npx vercel deploy dist --yes --prod
```

**초기 설정 (최초 1회)**:
```bash
npm install -g vercel
vercel login   # GitHub 계정 연결
```

**Supabase 환경변수 설정** (클라우드 동기화 활성화 시):
```bash
# tripframe/apps/mobile/.env 파일 생성
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
# 이후 빌드 + 재배포
```

**주요 파일**:
- `apps/mobile/vercel.json` — SPA rewrite (`/(.*) → /index.html`)
- `apps/mobile/metro.config.js` — `resolveRequest`로 웹 빌드 시 `react-native-android-widget`을 `android-widget-stub.js`로 교체 (없으면 `registerHeadlessTask is not a function` 크래시)
- `apps/mobile/src/widget/android-widget-stub.js` — 웹용 no-op stub

**현재 배포 URL**: `https://dist-blue-psi-34.vercel.app`

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
- `App.tsx` — Root with custom bottom tab bar (`홈 / 일정 / 스마트 체크 / 마이`); Sentry init + wrap; Supabase session detection; widget data sync on login
- `app.config.ts` — EAS build config; injects `SENTRY_DSN` env → `extra.sentryDsn` at runtime
- `src/store/useTripStore.ts` — Zustand store (`currentTab: TabName`, `trips`, `hiddenTripIds`, `currentTripId`, `selectedDayIndex`); persisted via `encryptedStorage`; `setStoreUserId()` injects userId for cloud sync
- `src/screens/HomeScreen.tsx` — Trip list with TripCard (gap/danger count), TripFormModal, iCal export
- `src/screens/MainTimelineScreen.tsx` — Day-by-day event timeline
- `src/screens/GapAnalysisScreen.tsx` — Gap detection results display
- `src/screens/MoveCheckScreen.tsx` — Transport options between locations
- `src/screens/SuggestionScreen.tsx` — Free time suggestions
- `src/screens/ReverseCalcDetailScreen.tsx` — Step-by-step reverse calculation
- `src/screens/SettingsScreen.tsx` — User preferences + hidden trips management + login/logout UI
- `src/screens/OnboardingScreen.tsx` — First-run onboarding flow
- `src/screens/LoginScreen.tsx` — Supabase Auth (Google/Apple OAuth)
- `src/screens/EventFormModal.tsx` / `TripFormModal.tsx` — CRUD modals
- `src/storage/encryptedStorage.ts` — AES-256-GCM wrapper; uses `@noble/ciphers/aes` gcm for encryption, `expo-crypto` for random bytes (key/IV generation); master key stored in `expo-secure-store` (falls back to kv-store)
- `src/lib/supabase.ts` — Supabase client; `detectSessionInUrl: Platform.OS === 'web'` for redirect-based OAuth
- `src/lib/supabaseSync.ts` — `fetchRemoteTrips` / push actions wired to `syncEngine`
- `src/lib/tripMapper.ts` — `tripToDbRow` / `dbRowToTrip` + `mergeTripsOnLogin` (LWW merge)
- `src/lib/userProfile.ts` — `ensureUserProfile` upsert (uses `.maybeSingle()` to avoid 406/409)
- `src/lib/database.types.ts` — Supabase-generated DB type definitions
- `src/hooks/useGoogleAuth.ts` / `useGoogleAuth.native.ts` / `useGoogleAuth.web.ts` — Google OAuth; web variant uses Supabase redirect (avoids COOP error)
- `src/hooks/useRealtimeSync.ts` — Supabase Realtime subscription → store updates
- `src/widget/TripWidgetProvider.tsx` — Android widget UI (D-day + trip name + 출발 시각); must use `"use no memo"` directive (React 19 Compiler breaks rendering); pass `{light, dark}` object to `renderWidget`
- `src/widget/TripWidgetProvider.web.tsx` — No-op stub for web builds
- `src/widget/widgetBridge.ts` — `syncWidgetData` / `buildWidgetData`: writes nearest trip to SharedPreferences for the widget to read
- `src/widget/widgetTaskHandler.tsx` — Headless task handler; reads SharedPreferences → returns widget data
- `src/widget/registerWidget.ts` / `registerWidget.web.ts` — Widget registration (web variant is a no-op stub)
- `src/widget/android-widget-stub.js` — Metro stub replacing `react-native-android-widget` on web builds
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
- **Phase 6** (COMPLETE 2026-04-23): D-day widget (Android), CI/CD (GitHub Actions), Sentry, Supabase cloud sync, closed beta — all 12 tasks done (100% ✅)
  - TASK-100~108 완료, TASK-109~111 (Supabase 인프라 + 연동 + Google OAuth 수정) 추가 완료
  - 클로즈드 베타 APK 배포 준비 완료; Google Play Console 등록 + GitHub Pages (개인정보처리방침) 남은 항목은 사용자 직접 수행
- **Phase 7** (ACTIVE): App store production release, affiliate booking links, beta feedback integration, city templates

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
- `spec.md` / `plan.md` / `tasks.md` — **[현재 활성]** Phase 7 설계 문서 (Phase 6 문서는 `phase6/` 아카이브로 이동)
- `phase1/` — Phase 1 아카이브
- `phase2/` — Phase 2 아카이브 (spec/plan/tasks + 상세 설계 문서)
- `phase3/`~`phase5/` — 완료 Phase 아카이브
- `phase6/` — Phase 6 상세 참고 문서 (완료 아카이브)

## Collaboration Board

- **Notion 협업 보드**: https://www.notion.so/harichon/Tripframe_project-32ee4cfd265280158a1dd02d50d0373e
  - DB에 모든 Phase의 작업 항목, 결과서, 분석 문서가 등록됨
  - 새 문서/작업 결과를 DB에 업로드할 때 이 URL 사용

## Key Reference Files
- `TripFrame_mockup.jsx` — UI 디자인 및 색상 팔레트의 원본 소스
- `TripFrame_FRS_v0.1.docx` — 계산·감지 엔진의 기능 요구사항 명세
- `spec-kit/constitution.md` — 절대 원칙 (아키텍처 및 코드 품질 규칙)
- `spec-kit/tasks.md` — 현재 활성 Phase 태스크 목록
- `analyze/` — 전문가 리뷰 및 분석 문서 (TF-REVIEW-000~CLAUDE)
