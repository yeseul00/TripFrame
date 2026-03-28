# Implementation Plan: TripFrame Phase 2

**Feature**: `002-tripframe-phase2`
**Plan version**: 1.0
**Created**: 2026-03-27
**Status**: Planning

---

## 1. Tech Stack

| 영역 | 기술 | 선택 이유 |
|------|------|-----------|
| Backend | Supabase (PostgreSQL + RLS) | 타입 안전, RLS 내장, Realtime 지원 |
| 인증 | Supabase Auth (Google OAuth, Apple Sign-In) | OAuth 흐름 내장, JWT 자동 관리 |
| 로컬 저장소 | AsyncStorage (`@react-native-async-storage`) | Expo 공식 지원, Supabase Auth 세션 저장 |
| HTTP 클라이언트 | `@supabase/supabase-js` | 타입 생성, RLS 자동 적용 |
| 날짜 처리 | date-fns (기존 유지) | Phase 1 동일 |
| 상태 관리 | Zustand (기존 유지) | Phase 1 동일 |
| 스타일 | NativeWind v4 (기존 유지) | Phase 1 동일 |

---

## 2. Architecture

### 전체 구조

```
앱 (Expo)
├── 인증 레이어 (Supabase Auth)
│   ├── Google OAuth (expo-auth-session)
│   └── Apple Sign-In (expo-apple-authentication)
├── 데이터 레이어
│   ├── Local: AsyncStorage (오프라인 우선)
│   └── Cloud: Supabase (PostgreSQL + RLS)
├── 동기화 엔진 (SyncEngine)
│   ├── Last Write Wins 충돌 해결
│   └── Realtime subscription
└── UI 레이어 (기존 Phase 1 화면 + 신규)
    ├── LoginScreen (신규)
    ├── SettingsScreen (신규)
    └── 제안카드 화면 (Phase 1 목업 → 실데이터 연결)
```

### 오프라인 우선 (Local-first) 전략

1. 모든 쓰기 → AsyncStorage 먼저
2. 온라인 상태 확인 후 Supabase에 업서트
3. 충돌: `updated_at` 타임스탬프 비교 → 최신본 채택 (Last Write Wins)

### Supabase 환경 구성

```
로컬 개발: Supabase CLI + Docker (http://localhost:54321)
프로덕션: Supabase Cloud (https://[PROJECT_REF].supabase.co)
```

---

## 3. Database Schema (요약)

```sql
user_profiles  -- 사용자 프로필 + 여행 설정 (luggage_size, transport_pref, pace)
trips          -- Trip 정보 (user_id FK + RLS)
events         -- TripEvent (trip_id FK + RLS)
```

전체 스키마: `spec-kit/phase2/database-schema.sql`

---

## 4. New Packages

```bash
# Supabase
pnpm add @supabase/supabase-js
pnpm add react-native-url-polyfill

# AsyncStorage
pnpm add @react-native-async-storage/async-storage

# OAuth
pnpm add expo-auth-session
pnpm add expo-apple-authentication
```

---

## 5. New Files

```
apps/mobile/
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # Supabase 클라이언트 초기화
│   │   └── auth.ts              # ensureUserProfile, signOut
│   ├── hooks/
│   │   ├── useGoogleAuth.ts     # Google OAuth 훅
│   │   └── useAppleAuth.ts      # Apple Sign-In 훅
│   ├── screens/
│   │   ├── LoginScreen.tsx      # 로그인 화면
│   │   └── SettingsScreen.tsx   # 사용자 설정 화면
│   └── store/
│       └── useTripStore.ts      # SyncEngine 연동 (기존 파일 수정)
└── .env                         # Supabase/OAuth 키 (gitignored)
```

---

## 6. Implementation Phases

### Phase 2.1 — Backend Infrastructure (Week 1)
TASK-031 ~ TASK-033: Supabase 설정, 스키마 배포, 클라이언트 초기화

### Phase 2.2 — Authentication (Week 1-2)
TASK-034 ~ TASK-038: Google/Apple OAuth, UserProfile, Settings UI

### Phase 2.3 — Cloud Sync (Week 2-3)
TASK-039 ~ TASK-043: SyncEngine, Trip/Event 동기화, Realtime

### Phase 2.4 — Transport Options (Week 3-4)
TASK-044 ~ TASK-049: API 통합, OptionCard UI, 추천 로직, 예약 링크

### Phase 2.5 — Testing
TASK-050: E2E 테스트 (Auth + Sync)

---

## 7. Key Constraints

- **Constitution 규칙 유지**: Logic-UI 분리, no `any`, 함수 ≤50줄, Zustand only
- **오프라인 우선**: 네트워크 없이도 Phase 1 기능 전부 동작
- **`.env` 절대 커밋 금지**: Service Role Key는 클라이언트 코드에서 사용 불가
- **RLS 필수**: 모든 DB 쿼리는 RLS를 통해 사용자별 격리

---

## 8. References

- API 명세: `spec-kit/phase2/api-spec.md`
- 백엔드 상세 설계: `spec-kit/phase2/backend-design.md`
- 태스크 상세 구현 가이드: `spec-kit/phase2/tasks-detail.md`
