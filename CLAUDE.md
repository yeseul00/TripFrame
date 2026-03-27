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
- **types/trip.ts** — All data models (`TripEvent`, `Gap`, `ReverseCalcResult`, `Trip`)
- **logic/reverseEngine.ts** — `calculateReverseTime(anchorTime, steps)`: subtracts each step from anchor time using date-fns
- **logic/gapEngine.ts** — `detectGaps(events)`: DANGER = no transport between locations, WARNING = buffer <30min
- **data/mock.ts** — Fukuoka-Yufuin sample trip for dev/test

### Mobile App (`apps/mobile/`)
- `App.tsx` — Root with custom bottom tab bar (일정 / 공백감지 / 제안카드 / 역산)
- `src/store/useTripStore.ts` — Zustand store (`currentTab`, `events`, `selectedDayIndex`)
- `src/screens/` — One screen per tab
- Styling: NativeWind v4 (className), dark theme `#0F0F13` bg + `#A78BFA` purple accent

### Key Data Types
- `TripEvent` — Any timeline item (flight, hotel, transport, activity)
- `Gap` — Derived from events: `DANGER` (no transport), `WARNING` (<30min buffer)
- `ReverseCalcStep` — Single step in reverse calculation (buffer, transport, prep, checkin)

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
1. P1: Reverse timeline engine + Gap detection (MVP)
2. P2: Transport options + Customization
3. P3: Booking alerts + Pass economics analysis
4. P4: Activity recommendations

## E2E Testing

- **Web E2E (AI-driven)**: `pnpm --filter mobile web` → `localhost:8081` → Playwright MCP
- **Mobile native E2E**: Maestro + Android emulator (Phase 2)
- Playwright MCP registered in `.mcp.json` at repo root

## Key Reference Files
- `TripFrame_mockup.jsx` — Source of truth for UI design and color palette
- `TripFrame_FRS_v0.1.docx` — Functional requirements for calculation and detection engines
- `spec-kit/constitution.md` — Non-negotiable architecture and code quality rules
- `spec-kit/tasks.md` — Full task breakdown (TASK-001 ~ TASK-027)
