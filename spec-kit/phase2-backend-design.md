# Phase 2: Backend Architecture Design
## Supabase 기반 백엔드 설계서

**Feature**: `002-tripframe-phase2`
**Document**: Backend Design
**Version**: 1.0
**Created**: 2026-03-27

---

## 목차

1. [Supabase 개요](#supabase-개요)
2. [인증 아키텍처](#인증-아키텍처)
3. [데이터 모델](#데이터-모델)
4. [RLS 정책](#rls-정책)
5. [동기화 메커니즘](#동기화-메커니즘)
6. [보안 설계](#보안-설계)

---

## Supabase 개요

### 선택 이유

| 기능 | Supabase | Firebase | 자체 구축 |
|------|----------|----------|-----------|
| PostgreSQL | ✅ | ❌ (NoSQL) | ✅ |
| RLS 지원 | ✅ | ❌ | 구현 필요 |
| OAuth 내장 | ✅ | ✅ | 구현 필요 |
| Realtime | ✅ | ✅ | 구현 필요 |
| 타입 안전성 | ✅ (타입 생성) | ⚠️ | ✅ |
| 비용 | 무료~저렴 | 무료~중간 | 높음 |
| 학습 곡선 | 낮음 | 낮음 | 높음 |

**결론**: Supabase 채택
- PostgreSQL 기반 관계형 DB (여행 데이터에 적합)
- RLS로 사용자별 데이터 격리 자동화
- TypeScript 타입 자동 생성 (DX 우수)

### 프로젝트 구성

```
Supabase Projects:
├── tripframe-dev      (개발 환경)
├── tripframe-staging  (스테이징)
└── tripframe-prod     (프로덕션)
```

**환경별 역할**:
- **dev**: 로컬 개발, 빠른 스키마 변경
- **staging**: QA, E2E 테스트
- **prod**: 실제 사용자 데이터

---

## 인증 아키텍처

### OAuth 2.0 Flow

```
┌─────────┐                                    ┌──────────────┐
│  User   │                                    │   Supabase   │
│         │                                    │     Auth     │
└────┬────┘                                    └───────┬──────┘
     │                                                 │
     │  1. "Google로 로그인" 클릭                       │
     │ ─────────────────────────────────────────────> │
     │                                                 │
     │  2. Google 로그인 페이지로 리다이렉트             │
     │ <───────────────────────────────────────────── │
     │                                                 │
┌────▼────┐                                           │
│ Google  │                                           │
│  OAuth  │                                           │
└────┬────┘                                           │
     │  3. 사용자 인증 완료                             │
     │                                                 │
     │  4. Authorization Code 발급                     │
     │ ─────────────────────────────────────────────> │
     │                                                 │
     │  5. Access Token + Refresh Token 발급           │
     │ <───────────────────────────────────────────── │
     │                                                 │
     │  6. JWT Token 저장 (SecureStore)                │
     │                                                 │
     │  7. API 요청 시 Bearer Token 전송                │
     │ ─────────────────────────────────────────────> │
     │                                                 │
     │  8. RLS 정책 확인 → 데이터 반환                  │
     │ <───────────────────────────────────────────── │
```

### Expo AuthSession 통합

**패키지**:
```bash
expo install expo-auth-session expo-web-browser
```

**코드 예시**:
```typescript
// packages/mobile/src/auth/useGoogleAuth.ts
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export function useGoogleAuth() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: makeRedirectUri({ scheme: 'tripframe' }),
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      supabase.auth.signInWithIdToken({
        provider: 'google',
        token: id_token,
      });
    }
  }, [response]);

  return { promptAsync };
}
```

### JWT Token 관리

**저장 위치**: Expo SecureStore
```typescript
import * as SecureStore from 'expo-secure-store';

// 저장
await SecureStore.setItemAsync('supabase_token', session.access_token);

// 불러오기
const token = await SecureStore.getItemAsync('supabase_token');
```

**자동 갱신**:
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed automatically');
  }
});
```

---

## 데이터 모델

### ERD (Entity Relationship Diagram)

```
┌──────────────────────┐
│       users          │ (Supabase Auth 기본 테이블)
├──────────────────────┤
│ id (uuid, PK)        │
│ email                │
│ created_at           │
└──────────┬───────────┘
           │
           │ 1:N
           │
┌──────────▼───────────┐
│   user_profiles      │
├──────────────────────┤
│ id (uuid, PK)        │
│ user_id (FK)         │◄──── users.id
│ display_name         │
│ avatar_url           │
│ luggage_size         │◄──── ENUM('CARRY_ON', 'LARGE')
│ transport_preference │◄──── ENUM('PUBLIC', 'TAXI', 'ANY')
│ time_buffer          │◄──── ENUM('TIGHT', 'RELAXED')
│ created_at           │
│ updated_at           │
└──────────┬───────────┘
           │
           │ 1:N
           │
┌──────────▼───────────┐
│       trips          │
├──────────────────────┤
│ id (uuid, PK)        │
│ user_id (FK)         │◄──── users.id
│ title                │
│ start_date           │
│ end_date             │
│ created_at           │
│ updated_at           │
│ synced_at            │
└──────────┬───────────┘
           │
           │ 1:N
           │
┌──────────▼───────────┐
│       events         │
├──────────────────────┤
│ id (uuid, PK)        │
│ trip_id (FK)         │◄──── trips.id
│ title                │
│ sub                  │
│ time                 │
│ type                 │
│ status               │
│ location             │
│ is_derived           │
│ metadata (JSONB)     │
│ day                  │
│ created_at           │
│ updated_at           │
└──────────────────────┘
```

### 테이블 정의

#### user_profiles

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  luggage_size TEXT CHECK (luggage_size IN ('CARRY_ON', 'LARGE')),
  transport_preference TEXT CHECK (transport_preference IN ('PUBLIC', 'TAXI', 'ANY')),
  time_buffer TEXT CHECK (time_buffer IN ('TIGHT', 'RELAXED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

#### trips

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_start_date ON trips(start_date DESC);
```

#### events

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sub TEXT,
  time TIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'flight', 'hotel', 'transport', 'home', 'activity', 'prep', 'warning', 'free'
  )),
  status TEXT NOT NULL CHECK (status IN (
    'ok', 'missing', 'warn', 'auto', 'free', 'todo'
  )),
  location TEXT,
  is_derived BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  day INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_trip_id ON events(trip_id);
CREATE INDEX idx_events_day_time ON events(trip_id, day, time);
```

---

## RLS 정책

### Row Level Security 개념

**목적**: 사용자별 데이터 격리
- User A는 User B의 여행 데이터를 볼 수 없음
- SQL 레벨에서 자동 필터링 (앱 코드에서 검증 불필요)

### user_profiles RLS

```sql
-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 정책: 자신의 프로필만 조회 가능
CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 정책: 자신의 프로필만 수정 가능
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- 정책: 프로필 생성 (회원가입 시 1회)
CREATE POLICY "Users can insert their own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### trips RLS

```sql
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- 정책: 자신의 여행만 조회
CREATE POLICY "Users can view their own trips"
ON trips
FOR SELECT
USING (auth.uid() = user_id);

-- 정책: 여행 생성
CREATE POLICY "Users can create their own trips"
ON trips
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 정책: 여행 수정
CREATE POLICY "Users can update their own trips"
ON trips
FOR UPDATE
USING (auth.uid() = user_id);

-- 정책: 여행 삭제
CREATE POLICY "Users can delete their own trips"
ON trips
FOR DELETE
USING (auth.uid() = user_id);
```

### events RLS

```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 정책: 자신의 Trip에 속한 Event만 조회
CREATE POLICY "Users can view events of their trips"
ON events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = events.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- 정책: Event 생성
CREATE POLICY "Users can create events in their trips"
ON events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = events.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- 정책: Event 수정
CREATE POLICY "Users can update events in their trips"
ON events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = events.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- 정책: Event 삭제
CREATE POLICY "Users can delete events in their trips"
ON events
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = events.trip_id
    AND trips.user_id = auth.uid()
  )
);
```

---

## 동기화 메커니즘

### Local-First 아키텍처

```
User Action
    ↓
┌───────────────────┐
│  Zustand Store    │ (In-Memory State)
└─────────┬─────────┘
          ↓
    [Optimistic Update]
          ↓
┌───────────────────┐
│  AsyncStorage     │ (Local Persistence)
└─────────┬─────────┘
          ↓
    [Background Sync]
          ↓
┌───────────────────┐
│    Supabase       │ (Cloud)
└───────────────────┘
```

### SyncEngine 설계

**핵심 원칙**:
1. **즉시 응답**: UI는 로컬 변경을 즉시 반영
2. **백그라운드 업로드**: 네트워크가 가능할 때 Supabase에 전송
3. **충돌 해결**: Last Write Wins (LWW)

**구현**:
```typescript
// packages/mobile/src/sync/SyncEngine.ts

export class SyncEngine {
  private queue: SyncTask[] = [];
  private isOnline = true;

  async syncTrip(trip: Trip) {
    // 1. Local 먼저 저장
    await AsyncStorage.setItem(`trip_${trip.id}`, JSON.stringify(trip));

    // 2. 동기화 큐에 추가
    this.queue.push({ type: 'UPSERT_TRIP', payload: trip });

    // 3. 온라인이면 즉시 업로드
    if (this.isOnline) {
      await this.flush();
    }
  }

  async flush() {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      try {
        await this.executeTask(task);
      } catch (error) {
        // 실패 시 큐에 다시 넣기
        this.queue.unshift(task);
        break;
      }
    }
  }

  private async executeTask(task: SyncTask) {
    switch (task.type) {
      case 'UPSERT_TRIP':
        await supabase.from('trips').upsert(task.payload);
        break;
      // ...
    }
  }
}
```

### 충돌 해결: Last Write Wins (LWW)

**시나리오**:
1. 디바이스 A에서 Trip 수정 (오프라인)
2. 디바이스 B에서 동일 Trip 수정 (온라인)
3. 디바이스 A가 온라인 복구

**해결**:
- `updated_at` 타임스탬프 비교
- 최신 변경본만 유지

```typescript
async resolveConflict(local: Trip, remote: Trip): Promise<Trip> {
  if (local.updated_at > remote.updated_at) {
    // 로컬이 최신 → Supabase에 업로드
    await supabase.from('trips').update(local).eq('id', local.id);
    return local;
  } else {
    // 리모트가 최신 → 로컬 덮어쓰기
    await AsyncStorage.setItem(`trip_${remote.id}`, JSON.stringify(remote));
    return remote;
  }
}
```

---

## 보안 설계

### API Keys 관리

**절대 금지**:
- ❌ 코드에 API Key 하드코딩
- ❌ .env 파일을 Git에 커밋

**권장 방법**:
```bash
# .env.example (템플릿)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...

# .env (실제 값, .gitignore에 추가)
SUPABASE_URL=https://tripframe-prod.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### CORS 설정

Supabase Dashboard → Settings → API:
```
Allowed origins:
- http://localhost:8081 (dev)
- tripframe://  (mobile app)
```

### Rate Limiting

Supabase 기본 제공:
- Anonymous: 100 req/min
- Authenticated: 1000 req/min

### SQL Injection 방지

**Bad**:
```typescript
// ❌ 절대 금지
supabase.rpc('get_trips', { query: `SELECT * FROM trips WHERE title = '${userInput}'` });
```

**Good**:
```typescript
// ✅ Parameterized Query
supabase
  .from('trips')
  .select('*')
  .eq('title', userInput);
```

---

## 마이그레이션 전략

### 스키마 버전 관리

```
migrations/
├── 20260327_001_create_user_profiles.sql
├── 20260327_002_create_trips.sql
├── 20260327_003_create_events.sql
└── 20260327_004_enable_rls.sql
```

### 로컬 개발 환경

```bash
# Supabase CLI 설치
npm install -g supabase

# 초기화
supabase init

# 로컬 Supabase 시작 (Docker 필요)
supabase start

# 마이그레이션 적용
supabase db push

# 타입 생성
supabase gen types typescript --local > src/types/database.types.ts
```

---

## 성능 최적화

### 인덱스 전략

```sql
-- 자주 조회되는 컬럼에 인덱스
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_events_trip_id ON events(trip_id);
CREATE INDEX idx_events_day_time ON events(trip_id, day, time);
```

### 커넥션 풀링

Supabase 기본 제공 (별도 설정 불필요)

### Realtime Subscriptions

```typescript
// 특정 Trip의 변경사항 실시간 감지
supabase
  .channel('trip-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'events',
      filter: `trip_id=eq.${tripId}`,
    },
    (payload) => {
      console.log('Event changed:', payload);
      // Zustand store 업데이트
    }
  )
  .subscribe();
```

---

## 모니터링

### Supabase Dashboard

- **Logs**: SQL 쿼리 로그
- **Performance**: 응답 시간, 처리량
- **Usage**: API 호출 횟수, 저장 용량

### Sentry 연동

```typescript
import * as Sentry from '@sentry/react-native';

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    Sentry.setUser({ id: session.user.id, email: session.user.email });
  }
});
```

---

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

*문서 버전: 1.0 | 작성일: 2026-03-27 | Feature: 002-tripframe-phase2*
