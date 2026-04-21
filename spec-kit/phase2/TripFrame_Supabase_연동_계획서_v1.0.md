# TripFrame Supabase 연동 계획서

**문서 ID**: TF-SUPABASE-001 | **버전**: 1.0 | **작성일**: 2026-04-20 | **상태**: Draft

---

## 1. 현황 분석

### 1.1 이미 구현된 항목 (코드 레벨)

| 파일 | 구현 내용 | 상태 |
|------|-----------|------|
| `src/lib/supabase.ts` | Supabase 클라이언트 초기화 (env 조건부) | ✅ 완료 |
| `src/lib/database.types.ts` | DB 테이블 TypeScript 타입 (`user_profiles`, `trips`, `events`) | ✅ 완료 |
| `src/lib/userProfile.ts` | `ensureUserProfile`, `getUserProfile`, `updateUserProfile` | ✅ 완료 |
| `src/lib/supabaseSync.ts` | `SyncEngine` 연결, `UPSERT/DELETE_TRIP/EVENT` 핸들러, `mergeWithRemote` | ✅ 완료 |
| `src/hooks/useGoogleAuth.ts` | Google OAuth (expo-auth-session → Supabase `signInWithIdToken`) | ✅ 완료 |
| `src/hooks/useRealtimeSync.ts` | Realtime 채널 구독 (`trips`, `events` 테이블 변경 감지) | ✅ 완료 (store 연결 미완) |
| `src/screens/LoginScreen.tsx` | Google 로그인 UI | ✅ 완료 |
| `App.tsx` | 세션 관리, `onAuthStateChange`, `ensureUserProfile` 호출 | ✅ 완료 |
| `src/storage/encryptedStorage.ts` | Supabase Auth 토큰 암호화 저장소 | ✅ 완료 |

### 1.2 미완성 항목 (연동 차단 요소)

| 항목 | 현재 상태 | 필요 작업 |
|------|-----------|-----------|
| **Supabase 프로젝트** | 미생성 | 프로젝트 생성 + URL/키 발급 |
| **DB 스키마 적용** | SQL 미실행 | `user_profiles`, `trips`, `events` 테이블 생성 |
| **RLS 정책** | 미적용 | 유저별 데이터 격리 정책 설정 |
| **`.env` 파일** | 미존재 | `.env.example` 기반 실제 값 입력 |
| **Google OAuth 자격증명** | 미발급 | Google Cloud Console → OAuth 클라이언트 ID 생성 |
| **Supabase Redirect URLs** | 미등록 | 로컬/딥링크 URL 등록 |
| **Store → syncEngine 연결** | 미연결 | `addTrip/updateTrip/deleteTrip` 액션에 sync 트리거 추가 |
| **Realtime → Store 업데이트** | TODO 주석 | `useRealtimeSync` 페이로드를 store에 반영 |
| **로그인 화면 진입 흐름** | 미구현 | 로그인 건너뛰기/필수화 정책 결정 + App.tsx 분기 |
| **오프라인 큐 지속성** | 미구현 | syncEngine 큐를 AsyncStorage에 보존 |

---

## 2. 목표 아키텍처

```
사용자 액션
    │
    ▼
useTripStore (Zustand)  ──persist──▶  encryptedStorage (로컬)
    │
    │ addTrip / updateTrip / deleteTrip
    ▼
syncEngine.enqueue(task)
    │
    │ 큐 처리 (online) / 큐 보존 (offline)
    ▼
supabaseSync.executeTask()
    │
    ├──▶ supabase.from('trips').upsert()
    └──▶ supabase.from('events').upsert()

Supabase Realtime (서버 → 앱)
    │ postgres_changes 이벤트
    ▼
useRealtimeSync
    │ 다기기 변경 감지
    ▼
useTripStore.syncFromRemote()  ──▶  mergeWithRemote() (LWW)
```

**오프라인 우선 원칙**: 로컬 store가 항상 primary source of truth. 네트워크 연결 시 동기화.

---

## 3. 구현 계획

### Phase A: 인프라 설정 (수동 작업 — 개발자 직접 수행)

#### A-1. Supabase 프로젝트 생성

1. https://app.supabase.com → New Project
2. 프로젝트명: `tripframe`, 지역: Northeast Asia (Tokyo)
3. DB 비밀번호 기록 (재발급 불가)

#### A-2. DB 스키마 적용

Supabase SQL Editor에서 아래 SQL 실행:

```sql
-- 1. user_profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  luggage_size TEXT NOT NULL DEFAULT 'CARRY_ON' CHECK (luggage_size IN ('CARRY_ON', 'LARGE')),
  transport_preference TEXT NOT NULL DEFAULT 'ANY' CHECK (transport_preference IN ('PUBLIC', 'TAXI', 'ANY')),
  time_buffer TEXT NOT NULL DEFAULT 'RELAXED' CHECK (time_buffer IN ('TIGHT', 'RELAXED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  hidden BOOLEAN NOT NULL DEFAULT false,
  timelines JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ
);

-- 3. events (trips.timelines JSONB 외 개별 이벤트 직접 접근용)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sub TEXT,
  time TEXT NOT NULL,
  day INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  location TEXT,
  is_derived BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### A-3. RLS 정책 설정

```sql
-- user_profiles: 본인만 조회/수정
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profiles: own" ON user_profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- trips: 본인만 CRUD
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips: own" ON trips
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- events: trip 소유자만 접근
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events: own via trip" ON events
  USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = events.trip_id AND trips.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = events.trip_id AND trips.user_id = auth.uid())
  );
```

#### A-4. Realtime 활성화

Supabase 대시보드 → Database → Replication → `trips`, `events` 테이블 **Insert/Update/Delete** 활성화

#### A-5. Google OAuth 설정

**Google Cloud Console (console.cloud.google.com)**:
1. 프로젝트 생성 → APIs & Services → Credentials → OAuth 2.0 Client ID
2. Web application: Authorized redirect URIs에 아래 추가
   - `https://[PROJECT_REF].supabase.co/auth/v1/callback`
3. iOS application: Bundle ID = `com.tripframe.app`
4. Android application: Package name + SHA-1 fingerprint (EAS 빌드 키)
5. Client ID 3개 복사

**Supabase 대시보드**:
1. Authentication → Providers → Google → Enable
2. Web Client ID / Secret 입력 (Cloud Console Web 자격증명)
3. Authentication → URL Configuration → Redirect URLs에 아래 추가:
   - `http://localhost:8081`
   - `http://localhost:8082`
   - `tripframe://`
   - `exp://localhost:8081`

#### A-6. 환경변수 파일 생성

```bash
# tripframe/apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=[web_client_id].apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=[ios_client_id].apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=[android_client_id].apps.googleusercontent.com
```

---

### Phase B: Store ↔ Supabase 동기화 연결 (코드 작업)

#### B-1. `supabase` null 안전성 강화

현재 `useGoogleAuth.ts`와 `userProfile.ts`가 `supabase`가 null일 때 크래시 가능성 있음.

**수정 대상**: `src/hooks/useGoogleAuth.ts` line 36

```ts
// 현재
supabase.auth.signInWithIdToken(...)

// 수정
if (!supabase) return;
supabase.auth.signInWithIdToken(...)
```

**수정 대상**: `src/lib/userProfile.ts` (모든 `supabase.from()` 호출 앞)

```ts
export async function ensureUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  // ... 이하 동일
}
```

#### B-2. Trip 데이터 모델 매핑

`useTripStore`의 `Trip` 타입과 DB `trips` 테이블 간 변환 함수 추가.

**신규 파일**: `src/lib/tripMapper.ts`

```ts
import type { Trip } from '@tripframe/core';

// 앱 Trip → DB row (UPSERT용)
export function tripToDbRow(trip: Trip, userId: string) {
  return {
    id: trip.id,
    user_id: userId,
    title: trip.title,
    destination: trip.destination ?? null,
    start_date: trip.startDate ?? null,
    end_date: trip.endDate ?? null,
    timelines: JSON.stringify(trip.timelines),
    updated_at: new Date().toISOString(),
  };
}

// DB row → 앱 Trip
export function dbRowToTrip(row: Record<string, unknown>): Trip {
  return {
    id: row['id'] as string,
    title: row['title'] as string,
    destination: (row['destination'] as string) ?? '',
    startDate: (row['start_date'] as string) ?? '',
    endDate: (row['end_date'] as string) ?? '',
    timelines: typeof row['timelines'] === 'string'
      ? JSON.parse(row['timelines'])
      : row['timelines'] ?? [],
  };
}
```

#### B-3. syncEngine을 Store 액션에 연결

**수정 대상**: `src/store/useTripStore.ts`

Store 상단에 추가:
```ts
import { syncEngine } from '../lib/supabaseSync';
import { tripToDbRow } from '../lib/tripMapper';

// Store 내부에서 userId 접근을 위한 헬퍼 (App.tsx에서 주입)
let _currentUserId: string | null = null;
export function setStoreUserId(id: string | null) {
  _currentUserId = id;
}
```

`addTrip` 액션 수정:
```ts
addTrip: (trip) => {
  set((state) => ({ trips: [...state.trips, trip] }));
  if (_currentUserId) {
    syncEngine.enqueue({
      type: 'UPSERT_TRIP',
      payload: tripToDbRow(trip, _currentUserId),
      timestamp: Date.now(),
      retryCount: 0,
    });
  }
},
```

`updateTrip`, `deleteTrip`도 동일 패턴으로 수정.

**수정 대상**: `App.tsx`

`onAuthStateChange` 콜백에서 userId 주입:
```ts
import { setStoreUserId } from './src/store/useTripStore';

// onAuthStateChange 내부
setStoreUserId(newSession?.user.id ?? null);
```

#### B-4. Realtime → Store 연결

**수정 대상**: `src/hooks/useRealtimeSync.ts`

```ts
import { useTripStore } from '../store/useTripStore';
import { fetchRemoteTrips, mergeWithRemote } from '../lib/supabaseSync';
import { dbRowToTrip } from '../lib/tripMapper';

// postgres_changes 핸들러 내부
(payload) => {
  console.log('[Realtime] Trip 변경 감지:', payload.eventType);
  // 변경 감지 시 전체 원격 목록 재조회 후 LWW 병합
  const userId = useTripStore.getState().trips[0]?.id ? userId : null;
  if (!userId) return;
  fetchRemoteTrips(userId).then((remoteRows) => {
    const remoteTrips = remoteRows.map(dbRowToTrip);
    const localTrips = useTripStore.getState().trips;
    // updated_at 필드 기반 LWW 병합
    const merged = mergeWithRemote(
      localTrips.map((t) => ({ ...t, updated_at: '' })),
      remoteTrips.map((t) => ({ ...t, updated_at: '' })),
    );
    useTripStore.setState({ trips: merged });
  });
},
```

> **주의**: 병합 로직은 `Trip` 타입에 `updated_at` 필드가 없으므로, DB row 레벨에서 비교하도록 `mergeWithRemote` 시그니처 조정이 필요.

#### B-5. 초기 로그인 시 원격 데이터 불러오기

**수정 대상**: `App.tsx`의 `onAuthStateChange` 콜백

```ts
const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
  setSession(newSession);
  setStoreUserId(newSession?.user.id ?? null);

  if (newSession?.user) {
    ensureUserProfile(newSession.user.id);

    // 로그인 직후 원격 Trip 불러와서 로컬과 병합
    const remoteRows = await fetchRemoteTrips(newSession.user.id);
    if (remoteRows.length > 0) {
      const remoteTrips = remoteRows.map(dbRowToTrip);
      const localTrips = useTripStore.getState().trips;
      // 로컬에만 있는 Trip은 로컬 우선, 원격에만 있는 Trip은 추가
      const merged = mergeTripsOnLogin(localTrips, remoteTrips);
      useTripStore.setState({ trips: merged });
    }
  }
});
```

#### B-6. 로그인 흐름 정책 결정 및 구현

현재 `LoginScreen`이 App.tsx에서 렌더링되지 않음. 두 가지 정책 중 선택 필요:

| 정책 | 설명 | 추천 여부 |
|------|------|-----------|
| **로그인 선택형** | 로그인 없이도 앱 사용 가능. 설정 탭에서 로그인 유도 | ✅ 추천 (오프라인 우선) |
| **로그인 필수형** | 온보딩 완료 후 로그인 강제 | — (베타 단계엔 부적합) |

**추천 구현 (로그인 선택형)**:
- `SettingsScreen`의 계정 섹션에 로그인/로그아웃 버튼 추가
- 비로그인 상태: "로그인하면 데이터가 백업됩니다" 안내 문구
- syncStatus 표시: `connected` / `offline` / `로그인 필요`

---

### Phase C: 설정 화면 프로필 연동

**수정 대상**: `src/screens/SettingsScreen.tsx`

- 짐 크기 / 교통 선호 / 버퍼 설정 변경 시 `updateUserProfile()` 호출
- 로그인 사용자: 클라우드 프로필 동기화
- 비로그인 사용자: 로컬 AsyncStorage에만 저장 (기존 동작 유지)

---

## 4. 작업 순서 및 의존성

```
A-1 (프로젝트 생성)
    │
    ├── A-2 (DB 스키마) ──▶ A-3 (RLS) ──▶ A-4 (Realtime)
    │
    └── A-5 (Google OAuth) ──▶ A-6 (.env 파일)
                                    │
                                    ▼
                              B-1 (null 안전성) ──▶ 구글 로그인 동작 확인
                                    │
                                    ▼
                              B-2 (매핑 함수) ──▶ B-3 (Store 연결)
                                    │
                                    ▼
                              B-5 (초기 로딩) ──▶ B-4 (Realtime 연결)
                                    │
                                    ▼
                              B-6 (로그인 흐름) ──▶ C (설정 연동)
```

---

## 5. 검증 시나리오

| 시나리오 | 검증 방법 | 성공 기준 |
|---------|-----------|-----------|
| Google 로그인 | LoginScreen → 로그인 버튼 → 브라우저 OAuth → 복귀 | session 생성, `user_profiles` row 자동 생성 |
| Trip 생성 동기화 | 앱에서 여행 추가 → Supabase 대시보드 확인 | `trips` 테이블에 row 추가됨 |
| 오프라인 큐 | 네트워크 차단 후 Trip 추가 → 재연결 | 연결 복원 시 자동 업로드 |
| 다기기 동기화 | 기기A에서 여행 추가 → 기기B 앱 확인 | Realtime으로 기기B에 반영 |
| 로그아웃 | 로그아웃 → 데이터 확인 | 로컬 데이터 유지, sync 중단 |
| RLS 격리 | 사용자A 데이터를 사용자B로 조회 | 0건 반환 |

---

## 6. 보안 체크리스트 (시스템설계서 8.3 기반)

- [ ] RLS 정책 전 테이블 적용 확인
- [ ] `EXPO_PUBLIC_*` 환경변수만 클라이언트 노출 (서비스 롤 키 절대 클라이언트 포함 금지)
- [ ] Refresh Token → `expo-secure-store` 저장 확인 (encryptedStorage 경유)
- [ ] Supabase Anon Key는 읽기 전용 RLS로 보호됨 확인
- [ ] `.env` 파일 `.gitignore` 등록 확인

---

## 7. 예상 이슈 및 대응

| 이슈 | 원인 | 대응 |
|------|------|------|
| `redirect_uri_mismatch` | Supabase Redirect URLs 미등록 | A-5 단계에서 URL 등록 |
| `supabase is null` 크래시 | `.env` 미설정 상태에서 함수 호출 | B-1 null guard 추가 |
| `timelines` JSONB 파싱 오류 | Trip ↔ DB row 변환 누락 | B-2 mapper 구현 |
| Realtime 이중 업데이트 | 본인 변경이 Realtime으로 다시 수신 | payload의 `commit_timestamp`로 중복 필터링 |
| 오프라인 큐 유실 | 앱 재시작 시 메모리 큐 소멸 | `SyncEngine` 큐를 AsyncStorage에 persist 추가 |

---

*작성자: Claude Code | 참조: TF-SAD-001 v1.0/v1.1, TF-RDS-001 v1.1, backlog IDEA-011*
