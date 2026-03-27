# Phase 2 API 명세서

**Version**: 1.0
**Last Updated**: 2026-03-27
**Author**: TripFrame Team

---

## 1. Overview

이 문서는 TripFrame Phase 2에서 사용하는 **Supabase API 엔드포인트**를 정의합니다.

### 1.1 API Base URL
```
Production: https://[PROJECT_REF].supabase.co
Local Dev:  http://localhost:54321
```

### 1.2 Authentication
모든 요청은 JWT Bearer Token을 포함해야 합니다:
```
Authorization: Bearer <ACCESS_TOKEN>
```

Supabase Client는 자동으로 토큰을 관리합니다:
```typescript
import { supabase } from '@/lib/supabase';

// 토큰은 supabase.auth.session()에서 자동 주입됨
const { data, error } = await supabase.from('trips').select('*');
```

---

## 2. User Profile API

### 2.1 GET /rest/v1/user_profiles

**Description**: 현재 사용자의 프로필 조회

**Request**:
```http
GET /rest/v1/user_profiles?user_id=eq.<USER_ID>
Authorization: Bearer <TOKEN>
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "display_name": "홍길동",
  "avatar_url": "https://...",
  "luggage_size": "CARRY_ON",
  "transport_preference": "PUBLIC",
  "time_buffer": "RELAXED",
  "created_at": "2026-03-27T10:00:00Z",
  "updated_at": "2026-03-27T10:00:00Z"
}
```

**TypeScript Example**:
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

---

### 2.2 POST /rest/v1/user_profiles

**Description**: 프로필 생성 (회원가입 직후)

**Request**:
```http
POST /rest/v1/user_profiles
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "user_id": "uuid",
  "display_name": "홍길동",
  "luggage_size": "CARRY_ON",
  "transport_preference": "ANY",
  "time_buffer": "RELAXED"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "display_name": "홍길동",
  "luggage_size": "CARRY_ON",
  "transport_preference": "ANY",
  "time_buffer": "RELAXED",
  "created_at": "2026-03-27T10:00:00Z",
  "updated_at": "2026-03-27T10:00:00Z"
}
```

**TypeScript Example**:
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .insert({
    user_id: user.id,
    display_name: '홍길동',
    luggage_size: 'CARRY_ON',
    transport_preference: 'ANY',
    time_buffer: 'RELAXED',
  })
  .select()
  .single();
```

---

### 2.3 PATCH /rest/v1/user_profiles

**Description**: 프로필 업데이트

**Request**:
```http
PATCH /rest/v1/user_profiles?id=eq.<PROFILE_ID>
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "luggage_size": "LARGE",
  "transport_preference": "TAXI"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "luggage_size": "LARGE",
  "transport_preference": "TAXI",
  "updated_at": "2026-03-27T11:00:00Z"
}
```

**TypeScript Example**:
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .update({
    luggage_size: 'LARGE',
    transport_preference: 'TAXI',
  })
  .eq('user_id', user.id)
  .select()
  .single();
```

---

## 3. Trips API

### 3.1 GET /rest/v1/trips

**Description**: 사용자의 모든 여행 조회

**Request**:
```http
GET /rest/v1/trips?user_id=eq.<USER_ID>&order=start_date.desc
Authorization: Bearer <TOKEN>
```

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "후쿠오카 온천 여행",
    "start_date": "2026-04-01",
    "end_date": "2026-04-03",
    "created_at": "2026-03-27T10:00:00Z",
    "updated_at": "2026-03-27T10:00:00Z",
    "synced_at": "2026-03-27T10:00:00Z"
  }
]
```

**TypeScript Example**:
```typescript
const { data, error } = await supabase
  .from('trips')
  .select('*')
  .eq('user_id', user.id)
  .order('start_date', { ascending: false });
```

---

### 3.2 GET /rest/v1/trips (with events)

**Description**: 여행 상세 조회 (이벤트 포함)

**Request**:
```http
GET /rest/v1/trips?id=eq.<TRIP_ID>&select=*,events(*)
Authorization: Bearer <TOKEN>
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "title": "후쿠오카 온천 여행",
  "start_date": "2026-04-01",
  "end_date": "2026-04-03",
  "events": [
    {
      "id": "uuid",
      "trip_id": "uuid",
      "title": "김포공항 출발",
      "time": "08:00:00",
      "day": 1,
      "type": "flight",
      "status": "ok",
      "location": "김포공항",
      "is_derived": false,
      "metadata": {}
    }
  ]
}
```

**TypeScript Example**:
```typescript
const { data, error } = await supabase
  .from('trips')
  .select('*, events(*)')
  .eq('id', tripId)
  .single();
```

---

### 3.3 POST /rest/v1/trips

**Description**: 새 여행 생성

**Request**:
```http
POST /rest/v1/trips
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "user_id": "uuid",
  "title": "제주도 여행",
  "start_date": "2026-05-01",
  "end_date": "2026-05-03"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "제주도 여행",
  "start_date": "2026-05-01",
  "end_date": "2026-05-03",
  "created_at": "2026-03-27T10:00:00Z",
  "updated_at": "2026-03-27T10:00:00Z",
  "synced_at": "2026-03-27T10:00:00Z"
}
```

**TypeScript Example**:
```typescript
const { data, error } = await supabase
  .from('trips')
  .insert({
    user_id: user.id,
    title: '제주도 여행',
    start_date: '2026-05-01',
    end_date: '2026-05-03',
  })
  .select()
  .single();
```

---

### 3.4 PATCH /rest/v1/trips

**Description**: 여행 정보 수정

**Request**:
```http
PATCH /rest/v1/trips?id=eq.<TRIP_ID>
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "title": "제주도 힐링 여행",
  "end_date": "2026-05-04"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "title": "제주도 힐링 여행",
  "end_date": "2026-05-04",
  "updated_at": "2026-03-27T11:00:00Z",
  "synced_at": "2026-03-27T11:00:00Z"
}
```

**TypeScript Example**:
```typescript
const { data, error } = await supabase
  .from('trips')
  .update({
    title: '제주도 힐링 여행',
    end_date: '2026-05-04',
  })
  .eq('id', tripId)
  .select()
  .single();
```

---

### 3.5 DELETE /rest/v1/trips

**Description**: 여행 삭제 (CASCADE로 events도 자동 삭제)

**Request**:
```http
DELETE /rest/v1/trips?id=eq.<TRIP_ID>
Authorization: Bearer <TOKEN>
```

**Response** (204 No Content)

**TypeScript Example**:
```typescript
const { error } = await supabase
  .from('trips')
  .delete()
  .eq('id', tripId);
```

---

## 4. Events API

### 4.1 GET /rest/v1/events

**Description**: 특정 여행의 모든 이벤트 조회

**Request**:
```http
GET /rest/v1/events?trip_id=eq.<TRIP_ID>&order=day.asc,time.asc
Authorization: Bearer <TOKEN>
```

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "trip_id": "uuid",
    "title": "김포공항 출발",
    "sub": "KE788",
    "time": "08:00:00",
    "day": 1,
    "type": "flight",
    "status": "ok",
    "location": "김포공항",
    "is_derived": false,
    "metadata": {},
    "created_at": "2026-03-27T10:00:00Z",
    "updated_at": "2026-03-27T10:00:00Z"
  }
]
```

**TypeScript Example**:
```typescript
const { data, error } = await supabase
  .from('events')
  .select('*')
  .eq('trip_id', tripId)
  .order('day', { ascending: true })
  .order('time', { ascending: true });
```

---

### 4.2 POST /rest/v1/events

**Description**: 새 이벤트 생성

**Request**:
```http
POST /rest/v1/events
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "trip_id": "uuid",
  "title": "호텔 체크인",
  "time": "15:00:00",
  "day": 1,
  "type": "hotel",
  "status": "ok",
  "location": "유후인 료칸"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "trip_id": "uuid",
  "title": "호텔 체크인",
  "time": "15:00:00",
  "day": 1,
  "type": "hotel",
  "status": "ok",
  "location": "유후인 료칸",
  "is_derived": false,
  "metadata": {},
  "created_at": "2026-03-27T10:00:00Z",
  "updated_at": "2026-03-27T10:00:00Z"
}
```

**TypeScript Example**:
```typescript
const { data, error } = await supabase
  .from('events')
  .insert({
    trip_id: tripId,
    title: '호텔 체크인',
    time: '15:00:00',
    day: 1,
    type: 'hotel',
    status: 'ok',
    location: '유후인 료칸',
  })
  .select()
  .single();
```

---

### 4.3 PATCH /rest/v1/events

**Description**: 이벤트 수정

**Request**:
```http
PATCH /rest/v1/events?id=eq.<EVENT_ID>
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "time": "16:00:00",
  "status": "warn"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "time": "16:00:00",
  "status": "warn",
  "updated_at": "2026-03-27T11:00:00Z"
}
```

**TypeScript Example**:
```typescript
const { data, error } = await supabase
  .from('events')
  .update({
    time: '16:00:00',
    status: 'warn',
  })
  .eq('id', eventId)
  .select()
  .single();
```

---

### 4.4 DELETE /rest/v1/events

**Description**: 이벤트 삭제

**Request**:
```http
DELETE /rest/v1/events?id=eq.<EVENT_ID>
Authorization: Bearer <TOKEN>
```

**Response** (204 No Content)

**TypeScript Example**:
```typescript
const { error } = await supabase
  .from('events')
  .delete()
  .eq('id', eventId);
```

---

## 5. Realtime Subscriptions

### 5.1 Trip Changes Subscription

**Description**: 다른 기기에서 여행이 수정될 때 실시간 동기화

**TypeScript Example**:
```typescript
const channel = supabase
  .channel('trips')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'trips',
      filter: `user_id=eq.${user.id}`,
    },
    (payload) => {
      console.log('Trip changed:', payload);
      // Zustand store 업데이트
      useTripStore.getState().syncFromRemote(payload.new);
    }
  )
  .subscribe();
```

---

### 5.2 Event Changes Subscription

**Description**: 이벤트 실시간 동기화

**TypeScript Example**:
```typescript
const channel = supabase
  .channel(`events:${tripId}`)
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
      useTripStore.getState().syncEventFromRemote(payload.new);
    }
  )
  .subscribe();
```

---

## 6. Error Handling

### 6.1 Standard Error Response

모든 에러는 다음 형식을 따릅니다:

```json
{
  "code": "PGRST116",
  "message": "The result contains 0 rows",
  "details": null,
  "hint": null
}
```

### 6.2 Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `PGRST116` | 404 | Row not found |
| `PGRST301` | 403 | RLS policy violation (권한 없음) |
| `23505` | 409 | Unique constraint violation |
| `23503` | 409 | Foreign key constraint violation |
| `42501` | 403 | Insufficient privilege |

### 6.3 Error Handling Example

```typescript
const { data, error } = await supabase
  .from('trips')
  .select('*')
  .eq('id', tripId)
  .single();

if (error) {
  if (error.code === 'PGRST116') {
    console.error('Trip not found');
  } else if (error.code === 'PGRST301') {
    console.error('Access denied');
  } else {
    console.error('Unknown error:', error);
  }
  return;
}

// data는 null이 아님
console.log(data);
```

---

## 7. Rate Limiting

Supabase 무료 플랜:
- **Database**: 500MB storage, 무제한 API requests
- **Auth**: 50,000 MAU (Monthly Active Users)
- **Realtime**: 200 concurrent connections

프로덕션 환경에서는 Pro 플랜 권장 ($25/month):
- 8GB storage
- 100,000 MAU
- 500 concurrent realtime connections

---

## 8. API Client Setup

### 8.1 Supabase Client Initialization

**File**: `apps/mobile/src/lib/supabase.ts`

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 8.2 Environment Variables

**File**: `apps/mobile/.env`

```bash
EXPO_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 9. Testing

### 9.1 Local Development

Supabase CLI로 로컬 환경 구성:

```bash
# Supabase CLI 설치
npm install -g supabase

# 로컬 Supabase 시작
supabase start

# 스키마 적용
supabase db push --local
```

### 9.2 API Test with curl

```bash
# Get trips
curl -X GET 'http://localhost:54321/rest/v1/trips' \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $USER_TOKEN"

# Create trip
curl -X POST 'http://localhost:54321/rest/v1/trips' \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "uuid",
    "title": "테스트 여행",
    "start_date": "2026-04-01",
    "end_date": "2026-04-03"
  }'
```

---

## 10. Migration Path

Phase 1 → Phase 2 마이그레이션:

1. **Phase 1 (Local Only)**:
   ```typescript
   const trips = await AsyncStorage.getItem('trips');
   ```

2. **Phase 2 (Hybrid)**:
   ```typescript
   // 1. AsyncStorage에서 기존 데이터 로드
   const localTrips = await AsyncStorage.getItem('trips');

   // 2. Supabase에 업로드
   if (localTrips) {
     const trips = JSON.parse(localTrips);
     await supabase.from('trips').insert(trips);
   }

   // 3. 이후부터는 Supabase 사용
   const { data } = await supabase.from('trips').select('*');
   ```

---

**문서 끝**
