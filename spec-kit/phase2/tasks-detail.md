# Phase 2 Tasks Breakdown

**Version**: 1.0
**Last Updated**: 2026-03-27
**Phase**: Sprint 2 (Phase 2)

---

## Task Overview

| Task ID | Description | Priority | Depends On | Estimate |
|---------|-------------|----------|------------|----------|
| TASK-031 | Supabase 프로젝트 설정 | P1 | - | 2h |
| TASK-032 | Database Schema 배포 | P1 | TASK-031 | 1h |
| TASK-033 | Supabase Client 설정 | P1 | TASK-031 | 1h |
| TASK-034 | Google OAuth 구현 | P1 | TASK-033 | 4h |
| TASK-035 | Apple OAuth 구현 | P1 | TASK-033 | 4h |
| TASK-036 | User Profile 생성 로직 | P1 | TASK-034, TASK-035 | 2h |
| TASK-037 | User Profile CRUD API | P1 | TASK-036 | 3h |
| TASK-038 | Settings 화면 UI | P1 | TASK-037 | 4h |
| TASK-039 | SyncEngine 기본 구조 | P1 | TASK-033 | 4h |
| TASK-040 | Trip Sync 구현 | P1 | TASK-039 | 3h |
| TASK-041 | Event Sync 구현 | P1 | TASK-039 | 3h |
| TASK-042 | Conflict Resolution (LWW) | P1 | TASK-040, TASK-041 | 3h |
| TASK-043 | Realtime Subscription | P2 | TASK-040, TASK-041 | 4h |
| TASK-044 | Transport Options API 통합 | P2 | - | 6h |
| TASK-045 | OptionCard UI 컴포넌트 | P2 | TASK-044 | 4h |
| TASK-046 | 제안카드 화면 구현 | P2 | TASK-045 | 5h |
| TASK-047 | Recommendation 로직 | P2 | TASK-037, TASK-044 | 4h |
| TASK-048 | Booking Link 연동 | P2 | TASK-045 | 2h |
| TASK-049 | Multi-person Cost 계산 | P2 | TASK-045 | 3h |
| TASK-050 | E2E 테스트 (Auth + Sync) | P1 | TASK-043 | 6h |

**Total Estimate**: ~62 hours (~8 working days for 1 developer)

---

## Phase 2.1: Backend Infrastructure (Week 1)

### TASK-031: Supabase 프로젝트 설정

**Priority**: P1
**Estimate**: 2h
**Depends On**: -

**Description**:
Supabase 클라우드 프로젝트를 생성하고 기본 설정을 완료합니다.

**Acceptance Criteria**:
- [ ] Supabase 프로젝트 생성 완료
- [ ] Project URL 및 Anon Key 확보
- [ ] OAuth Providers (Google, Apple) 활성화
- [ ] `.env` 파일에 환경 변수 설정

**Implementation Steps**:
1. https://supabase.com → 프로젝트 생성
2. Settings → API → URL, Anon Key 복사
3. Authentication → Providers → Google, Apple 활성화
4. `apps/mobile/.env` 생성:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

**Files Changed**:
- `apps/mobile/.env` (new)
- `.gitignore` (verify `.env` ignored)

---

### TASK-032: Database Schema 배포

**Priority**: P1
**Estimate**: 1h
**Depends On**: TASK-031

**Description**:
`phase2-database-schema.sql`을 Supabase에 배포합니다.

**Acceptance Criteria**:
- [ ] `user_profiles`, `trips`, `events` 테이블 생성 완료
- [ ] RLS 정책 활성화 확인
- [ ] Triggers 정상 동작 확인
- [ ] 확인 쿼리 실행 성공

**Implementation Steps**:
1. Supabase Dashboard → SQL Editor
2. `spec-kit/phase2-database-schema.sql` 내용 복사
3. Run 클릭
4. 결과 확인:
   ```sql
   SELECT tablename FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('user_profiles', 'trips', 'events');
   ```

**Files Changed**:
- None (Supabase cloud only)

---

### TASK-033: Supabase Client 설정

**Priority**: P1
**Estimate**: 1h
**Depends On**: TASK-031

**Description**:
Expo 앱에서 Supabase Client를 초기화합니다.

**Acceptance Criteria**:
- [ ] `@supabase/supabase-js` 설치 완료
- [ ] `supabase.ts` 클라이언트 파일 생성
- [ ] AsyncStorage 연동 확인
- [ ] 간단한 연결 테스트 성공

**Implementation Steps**:
1. 패키지 설치:
   ```bash
   cd tripframe
   pnpm add @supabase/supabase-js
   pnpm add react-native-url-polyfill
   ```

2. `apps/mobile/src/lib/supabase.ts` 생성:
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

3. 연결 테스트:
   ```typescript
   const { data, error } = await supabase.from('trips').select('count');
   console.log('Supabase connection:', data, error);
   ```

**Files Changed**:
- `apps/mobile/package.json`
- `apps/mobile/src/lib/supabase.ts` (new)

---

## Phase 2.2: Authentication (Week 1-2)

### TASK-034: Google OAuth 구현

**Priority**: P1
**Estimate**: 4h
**Depends On**: TASK-033

**Description**:
Google Sign-In을 Expo AuthSession으로 구현합니다.

**Acceptance Criteria**:
- [ ] Google OAuth 설정 완료 (OAuth Client ID)
- [ ] `useGoogleAuth` 훅 구현
- [ ] 로그인 버튼 클릭 → Google 로그인 성공
- [ ] Supabase session 생성 확인

**Implementation Steps**:
1. Google Cloud Console → OAuth Client ID 생성 (iOS, Android, Web)
2. Supabase Dashboard → Authentication → Providers → Google 설정
3. `apps/mobile/src/hooks/useGoogleAuth.ts` 생성:
   ```typescript
   import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
   import { supabase } from '@/lib/supabase';

   const discovery = {
     authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
     tokenEndpoint: 'https://oauth2.googleapis.com/token',
   };

   export function useGoogleAuth() {
     const [request, response, promptAsync] = useAuthRequest(
       {
         clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
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

     return { promptAsync, isLoading: !request };
   }
   ```

4. 로그인 화면에서 사용:
   ```typescript
   const { promptAsync } = useGoogleAuth();
   <Button onPress={() => promptAsync()}>Google로 로그인</Button>
   ```

**Files Changed**:
- `apps/mobile/app.json` (scheme 추가)
- `apps/mobile/.env` (Google Client ID 추가)
- `apps/mobile/src/hooks/useGoogleAuth.ts` (new)
- `apps/mobile/src/screens/LoginScreen.tsx` (new or modified)

---

### TASK-035: Apple OAuth 구현

**Priority**: P1
**Estimate**: 4h
**Depends On**: TASK-033

**Description**:
Apple Sign-In을 Expo AuthSession으로 구현합니다.

**Acceptance Criteria**:
- [ ] Apple Developer 설정 완료 (Service ID)
- [ ] `useAppleAuth` 훅 구현
- [ ] iOS에서 Apple 로그인 성공
- [ ] Supabase session 생성 확인

**Implementation Steps**:
1. Apple Developer → Identifiers → Service ID 생성
2. Supabase Dashboard → Authentication → Providers → Apple 설정
3. `apps/mobile/src/hooks/useAppleAuth.ts` 생성:
   ```typescript
   import * as AppleAuthentication from 'expo-apple-authentication';
   import { supabase } from '@/lib/supabase';

   export function useAppleAuth() {
     const signInWithApple = async () => {
       const credential = await AppleAuthentication.signInAsync({
         requestedScopes: [
           AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
           AppleAuthentication.AppleAuthenticationScope.EMAIL,
         ],
       });

       if (credential.identityToken) {
         await supabase.auth.signInWithIdToken({
           provider: 'apple',
           token: credential.identityToken,
         });
       }
     };

     return { signInWithApple };
   }
   ```

**Files Changed**:
- `apps/mobile/app.json` (Apple config 추가)
- `apps/mobile/src/hooks/useAppleAuth.ts` (new)
- `apps/mobile/src/screens/LoginScreen.tsx` (modified)

---

### TASK-036: User Profile 생성 로직

**Priority**: P1
**Estimate**: 2h
**Depends On**: TASK-034, TASK-035

**Description**:
최초 로그인 시 User Profile을 자동 생성합니다.

**Acceptance Criteria**:
- [ ] 로그인 성공 시 `user_profiles` 존재 여부 확인
- [ ] 없으면 기본값으로 프로필 생성
- [ ] 프로필 생성 실패 시 재시도 로직

**Implementation Steps**:
1. `apps/mobile/src/lib/auth.ts`:
   ```typescript
   export async function ensureUserProfile(userId: string) {
     const { data: existing } = await supabase
       .from('user_profiles')
       .select('id')
       .eq('user_id', userId)
       .single();

     if (!existing) {
       await supabase.from('user_profiles').insert({
         user_id: userId,
         luggage_size: 'CARRY_ON',
         transport_preference: 'ANY',
         time_buffer: 'RELAXED',
       });
     }
   }
   ```

2. 로그인 후 호출:
   ```typescript
   supabase.auth.onAuthStateChange((event, session) => {
     if (event === 'SIGNED_IN' && session?.user) {
       ensureUserProfile(session.user.id);
     }
   });
   ```

**Files Changed**:
- `apps/mobile/src/lib/auth.ts` (new)
- `apps/mobile/App.tsx` (auth state change listener)

---

### TASK-037: User Profile CRUD API

**Priority**: P1
**Estimate**: 3h
**Depends On**: TASK-036

**Description**:
User Profile을 읽고 수정하는 API를 구현합니다.

**Acceptance Criteria**:
- [ ] `useUserProfile()` 훅 구현
- [ ] GET, UPDATE 기능 동작 확인
- [ ] Zustand store에 프로필 저장

**Implementation Steps**:
1. `apps/mobile/src/hooks/useUserProfile.ts`:
   ```typescript
   export function useUserProfile() {
     const [profile, setProfile] = useState<UserProfile | null>(null);
     const user = supabase.auth.getUser();

     useEffect(() => {
       if (user) {
         supabase
           .from('user_profiles')
           .select('*')
           .eq('user_id', user.id)
           .single()
           .then(({ data }) => setProfile(data));
       }
     }, [user]);

     const updateProfile = async (updates: Partial<UserProfile>) => {
       await supabase
         .from('user_profiles')
         .update(updates)
         .eq('user_id', user!.id);
       setProfile({ ...profile!, ...updates });
     };

     return { profile, updateProfile };
   }
   ```

2. Zustand store에 통합:
   ```typescript
   interface TripStore {
     userProfile: UserProfile | null;
     setUserProfile: (profile: UserProfile) => void;
   }
   ```

**Files Changed**:
- `apps/mobile/src/hooks/useUserProfile.ts` (new)
- `apps/mobile/src/store/useTripStore.ts` (modified)

---

### TASK-038: Settings 화면 UI

**Priority**: P1
**Estimate**: 4h
**Depends On**: TASK-037

**Description**:
사용자 선호도 설정 화면을 구현합니다 (짐 크기, 교통 선호, 여유도).

**Acceptance Criteria**:
- [ ] 3개 설정 항목 UI 표시
- [ ] 선택 변경 시 즉시 Supabase에 저장
- [ ] Optimistic UI 업데이트

**Implementation Steps**:
1. `apps/mobile/src/screens/SettingsScreen.tsx`:
   ```typescript
   export function SettingsScreen() {
     const { profile, updateProfile } = useUserProfile();

     return (
       <View className="flex-1 bg-gray-900 p-4">
         <Text className="text-white text-lg mb-4">여행 선호도 설정</Text>

         <SettingItem
           label="짐 크기"
           value={profile?.luggage_size}
           options={['CARRY_ON', 'LARGE']}
           onChange={(v) => updateProfile({ luggage_size: v })}
         />

         <SettingItem
           label="교통 선호"
           value={profile?.transport_preference}
           options={['PUBLIC', 'TAXI', 'ANY']}
           onChange={(v) => updateProfile({ transport_preference: v })}
         />

         <SettingItem
           label="일정 여유도"
           value={profile?.time_buffer}
           options={['TIGHT', 'RELAXED']}
           onChange={(v) => updateProfile({ time_buffer: v })}
         />
       </View>
     );
   }
   ```

**Files Changed**:
- `apps/mobile/src/screens/SettingsScreen.tsx` (new)
- `apps/mobile/App.tsx` (add Settings tab)

---

## Phase 2.3: Sync Engine (Week 2-3)

### TASK-039: SyncEngine 기본 구조

**Priority**: P1
**Estimate**: 4h
**Depends On**: TASK-033

**Description**:
Local-first 동기화 엔진의 기본 구조를 구현합니다.

**Acceptance Criteria**:
- [ ] `SyncEngine` 클래스 생성
- [ ] Sync queue 구조 정의
- [ ] Online/offline 상태 감지
- [ ] 단위 테스트 작성

**Implementation Steps**:
1. `packages/core/src/sync/SyncEngine.ts`:
   ```typescript
   export interface SyncTask {
     id: string;
     type: 'UPSERT_TRIP' | 'DELETE_TRIP' | 'UPSERT_EVENT' | 'DELETE_EVENT';
     payload: any;
     timestamp: number;
   }

   export class SyncEngine {
     private queue: SyncTask[] = [];
     private isOnline: boolean = true;

     constructor() {
       NetInfo.addEventListener((state) => {
         this.isOnline = state.isConnected ?? false;
         if (this.isOnline) this.flush();
       });
     }

     async enqueue(task: SyncTask) {
       this.queue.push(task);
       if (this.isOnline) await this.flush();
     }

     async flush() {
       while (this.queue.length > 0 && this.isOnline) {
         const task = this.queue[0];
         await this.executeTask(task);
         this.queue.shift();
       }
     }

     private async executeTask(task: SyncTask) {
       // Supabase API 호출
     }
   }
   ```

2. 테스트:
   ```typescript
   describe('SyncEngine', () => {
     it('should queue tasks when offline', async () => {
       const engine = new SyncEngine();
       engine.isOnline = false;
       await engine.enqueue({ type: 'UPSERT_TRIP', payload: trip });
       expect(engine.queue.length).toBe(1);
     });
   });
   ```

**Files Changed**:
- `packages/core/src/sync/SyncEngine.ts` (new)
- `packages/core/src/sync/__tests__/SyncEngine.test.ts` (new)

---

### TASK-040: Trip Sync 구현

**Priority**: P1
**Estimate**: 3h
**Depends On**: TASK-039

**Description**:
Trip 데이터의 동기화 로직을 구현합니다.

**Acceptance Criteria**:
- [ ] Trip 생성 시 AsyncStorage + Supabase 동시 저장
- [ ] Trip 수정 시 동기화
- [ ] Trip 삭제 시 동기화

**Implementation Steps**:
1. `apps/mobile/src/store/useTripStore.ts`:
   ```typescript
   const useTripStore = create<TripStore>((set, get) => ({
     trips: [],

     addTrip: async (trip: Trip) => {
       // 1. Local first
       await AsyncStorage.setItem(`trip_${trip.id}`, JSON.stringify(trip));
       set({ trips: [...get().trips, trip] });

       // 2. Enqueue sync
       syncEngine.enqueue({
         type: 'UPSERT_TRIP',
         payload: trip,
       });
     },

     updateTrip: async (tripId: string, updates: Partial<Trip>) => {
       const updated = { ...get().trips.find((t) => t.id === tripId)!, ...updates };
       await AsyncStorage.setItem(`trip_${tripId}`, JSON.stringify(updated));
       set({ trips: get().trips.map((t) => (t.id === tripId ? updated : t)) });

       syncEngine.enqueue({
         type: 'UPSERT_TRIP',
         payload: updated,
       });
     },
   }));
   ```

**Files Changed**:
- `apps/mobile/src/store/useTripStore.ts` (modified)
- `apps/mobile/src/lib/syncEngine.ts` (new instance)

---

### TASK-041: Event Sync 구현

**Priority**: P1
**Estimate**: 3h
**Depends On**: TASK-039

**Description**:
Event 데이터의 동기화 로직을 구현합니다.

**Acceptance Criteria**:
- [ ] Event 생성/수정/삭제 시 동기화
- [ ] Trip과 함께 일괄 동기화 가능

**Implementation Steps**:
1. Zustand store에 Event sync 추가:
   ```typescript
   addEvent: async (event: TripEvent) => {
     await AsyncStorage.setItem(`event_${event.id}`, JSON.stringify(event));
     set({ events: [...get().events, event] });

     syncEngine.enqueue({
       type: 'UPSERT_EVENT',
       payload: event,
     });
   },
   ```

**Files Changed**:
- `apps/mobile/src/store/useTripStore.ts` (modified)

---

### TASK-042: Conflict Resolution (LWW)

**Priority**: P1
**Estimate**: 3h
**Depends On**: TASK-040, TASK-041

**Description**:
Last Write Wins 전략으로 충돌을 해결합니다.

**Acceptance Criteria**:
- [ ] `updated_at` 비교 로직 구현
- [ ] 로컬 데이터 < 원격 데이터 시 원격 데이터 적용
- [ ] 충돌 감지 로그 출력

**Implementation Steps**:
1. `packages/core/src/sync/conflictResolver.ts`:
   ```typescript
   export function resolveConflict<T extends { updated_at: string }>(
     local: T,
     remote: T
   ): T {
     const localTime = new Date(local.updated_at).getTime();
     const remoteTime = new Date(remote.updated_at).getTime();

     if (localTime > remoteTime) {
       console.log('Local wins:', local);
       return local;
     } else {
       console.log('Remote wins:', remote);
       return remote;
     }
   }
   ```

2. SyncEngine에서 사용:
   ```typescript
   async syncFromRemote(remote: Trip) {
     const local = await AsyncStorage.getItem(`trip_${remote.id}`);
     if (local) {
       const resolved = resolveConflict(JSON.parse(local), remote);
       await AsyncStorage.setItem(`trip_${remote.id}`, JSON.stringify(resolved));
     }
   }
   ```

**Files Changed**:
- `packages/core/src/sync/conflictResolver.ts` (new)
- `packages/core/src/sync/__tests__/conflictResolver.test.ts` (new)

---

### TASK-043: Realtime Subscription

**Priority**: P2
**Estimate**: 4h
**Depends On**: TASK-040, TASK-041

**Description**:
Supabase Realtime으로 다른 기기의 변경사항을 실시간 동기화합니다.

**Acceptance Criteria**:
- [ ] Trip 변경 감지 시 자동 업데이트
- [ ] Event 변경 감지 시 자동 업데이트
- [ ] Subscription cleanup (unmount 시)

**Implementation Steps**:
1. `apps/mobile/src/hooks/useRealtimeSync.ts`:
   ```typescript
   export function useRealtimeSync() {
     const user = supabase.auth.getUser();

     useEffect(() => {
       if (!user) return;

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
             useTripStore.getState().syncFromRemote(payload.new);
           }
         )
         .subscribe();

       return () => {
         channel.unsubscribe();
       };
     }, [user]);
   }
   ```

2. `App.tsx`에서 호출:
   ```typescript
   function App() {
     useRealtimeSync();
     return <NavigationContainer>...</NavigationContainer>;
   }
   ```

**Files Changed**:
- `apps/mobile/src/hooks/useRealtimeSync.ts` (new)
- `apps/mobile/App.tsx` (modified)

---

## Phase 2.4: Transport Options (Week 3-4)

### TASK-044: Transport Options API 통합

**Priority**: P2
**Estimate**: 6h
**Depends On**: -

**Description**:
Google Maps Directions API 또는 Kakao Mobility API를 연동하여 교통수단 옵션을 조회합니다.

**Acceptance Criteria**:
- [ ] API 키 발급 및 설정
- [ ] `getTransportOptions(origin, destination)` 함수 구현
- [ ] 대중교통, 택시, 도보 옵션 반환
- [ ] 가격, 소요시간, 환승 정보 포함

**Implementation Steps**:
1. Google Maps API 키 발급 (또는 Kakao Mobility)
2. `packages/core/src/api/transportApi.ts`:
   ```typescript
   export interface TransportOption {
     type: 'PUBLIC' | 'TAXI' | 'WALK';
     duration: number; // minutes
     price: number; // KRW
     steps: string[];
     notes?: string;
   }

   export async function getTransportOptions(
     origin: string,
     destination: string
   ): Promise<TransportOption[]> {
     const response = await fetch(
       `https://maps.googleapis.com/maps/api/directions/json?` +
       `origin=${origin}&destination=${destination}&` +
       `mode=transit&key=${GOOGLE_MAPS_API_KEY}`
     );

     const data = await response.json();
     return parseDirections(data);
   }

   function parseDirections(data: any): TransportOption[] {
     // Google Maps response → TransportOption 변환
   }
   ```

**Files Changed**:
- `packages/core/src/api/transportApi.ts` (new)
- `packages/core/src/api/__tests__/transportApi.test.ts` (new)
- `.env` (Google Maps API Key 추가)

---

### TASK-045: OptionCard UI 컴포넌트

**Priority**: P2
**Estimate**: 4h
**Depends On**: TASK-044

**Description**:
교통수단 옵션을 표시하는 `OptionCard` 컴포넌트를 구현합니다.

**Acceptance Criteria**:
- [ ] 카드형 UI (가격, 시간, 노트 표시)
- [ ] 추천 배지 (사용자 선호도 기반)
- [ ] 예약 버튼
- [ ] 접근성 지원 (screen reader)

**Implementation Steps**:
1. `apps/mobile/src/components/OptionCard.tsx`:
   ```typescript
   interface OptionCardProps {
     option: TransportOption;
     isRecommended?: boolean;
     onBook: () => void;
   }

   export function OptionCard({ option, isRecommended, onBook }: OptionCardProps) {
     return (
       <View className="bg-gray-800 rounded-lg p-4 mb-3">
         {isRecommended && (
           <View className="bg-purple-500 rounded px-2 py-1 self-start mb-2">
             <Text className="text-white text-xs">추천</Text>
           </View>
         )}

         <View className="flex-row justify-between items-center">
           <View>
             <Text className="text-white font-bold">{option.type}</Text>
             <Text className="text-gray-400">{option.duration}분</Text>
           </View>
           <Text className="text-white text-lg">{option.price.toLocaleString()}원</Text>
         </View>

         {option.notes && (
           <Text className="text-gray-400 text-sm mt-2">{option.notes}</Text>
         )}

         <Button className="mt-3" onPress={onBook}>
           예약하기
         </Button>
       </View>
     );
   }
   ```

**Files Changed**:
- `apps/mobile/src/components/OptionCard.tsx` (new)

---

### TASK-046: 제안카드 화면 구현

**Priority**: P2
**Estimate**: 5h
**Depends On**: TASK-045

**Description**:
Gap이 감지된 구간에 대해 교통수단 옵션을 표시하는 화면을 구현합니다.

**Acceptance Criteria**:
- [ ] Gap 목록 표시
- [ ] 각 Gap에 대한 OptionCard 목록
- [ ] 로딩 상태 표시
- [ ] 빈 상태 처리 (Gap 없음)

**Implementation Steps**:
1. `apps/mobile/src/screens/OptionCardScreen.tsx`:
   ```typescript
   export function OptionCardScreen() {
     const gaps = useGapDetection();
     const [options, setOptions] = useState<Map<string, TransportOption[]>>(new Map());

     useEffect(() => {
       gaps.forEach(async (gap) => {
         if (gap.type === 'DANGER') {
           const opts = await getTransportOptions(gap.from, gap.to);
           setOptions((prev) => new Map(prev).set(gap.id, opts));
         }
       });
     }, [gaps]);

     return (
       <ScrollView className="flex-1 bg-gray-900 p-4">
         {gaps.map((gap) => (
           <View key={gap.id} className="mb-6">
             <Text className="text-white font-bold mb-2">
               {gap.from} → {gap.to}
             </Text>
             {options.get(gap.id)?.map((opt, idx) => (
               <OptionCard
                 key={idx}
                 option={opt}
                 isRecommended={idx === 0}
                 onBook={() => handleBook(opt)}
               />
             ))}
           </View>
         ))}
       </ScrollView>
     );
   }
   ```

**Files Changed**:
- `apps/mobile/src/screens/OptionCardScreen.tsx` (new)

---

### TASK-047: Recommendation 로직

**Priority**: P2
**Estimate**: 4h
**Depends On**: TASK-037, TASK-044

**Description**:
사용자 선호도 기반으로 추천 교통수단을 결정합니다.

**Acceptance Criteria**:
- [ ] `transport_preference` 우선 반영
- [ ] `luggage_size === 'LARGE'` 시 대중교통 우선순위 하락
- [ ] `time_buffer === 'TIGHT'` 시 빠른 옵션 우선

**Implementation Steps**:
1. `packages/core/src/logic/recommendEngine.ts`:
   ```typescript
   export function recommendTransport(
     options: TransportOption[],
     profile: UserProfile
   ): TransportOption[] {
     let sorted = [...options];

     if (profile.transport_preference === 'PUBLIC') {
       sorted.sort((a, b) =>
         a.type === 'PUBLIC' ? -1 : b.type === 'PUBLIC' ? 1 : 0
       );
     } else if (profile.transport_preference === 'TAXI') {
       sorted.sort((a, b) =>
         a.type === 'TAXI' ? -1 : b.type === 'TAXI' ? 1 : 0
       );
     }

     if (profile.luggage_size === 'LARGE') {
       // 대중교통 우선순위 하락
       sorted = sorted.filter((o) => o.type !== 'PUBLIC').concat(
         sorted.filter((o) => o.type === 'PUBLIC')
       );
     }

     if (profile.time_buffer === 'TIGHT') {
       sorted.sort((a, b) => a.duration - b.duration);
     }

     return sorted;
   }
   ```

**Files Changed**:
- `packages/core/src/logic/recommendEngine.ts` (new)
- `packages/core/src/logic/__tests__/recommendEngine.test.ts` (new)

---

### TASK-048: Booking Link 연동

**Priority**: P2
**Estimate**: 2h
**Depends On**: TASK-045

**Description**:
교통수단별 예약 링크를 생성합니다.

**Acceptance Criteria**:
- [ ] 택시: 카카오T, 우버 딥링크
- [ ] 대중교통: 네이버 지도, 카카오맵
- [ ] 링크 클릭 시 앱 또는 웹 열림

**Implementation Steps**:
1. `packages/core/src/utils/bookingLinks.ts`:
   ```typescript
   export function getBookingLink(option: TransportOption, origin: string, destination: string): string {
     if (option.type === 'TAXI') {
       return `kakaot://launch?start=${origin}&end=${destination}`;
     } else if (option.type === 'PUBLIC') {
       return `nmap://route/public?slat=&slng=&sname=${origin}&dlat=&dlng=&dname=${destination}`;
     }
     return '';
   }
   ```

2. OptionCard에서 사용:
   ```typescript
   const bookingLink = getBookingLink(option, gap.from, gap.to);
   <Button onPress={() => Linking.openURL(bookingLink)}>예약하기</Button>
   ```

**Files Changed**:
- `packages/core/src/utils/bookingLinks.ts` (new)

---

### TASK-049: Multi-person Cost 계산

**Priority**: P2
**Estimate**: 3h
**Depends On**: TASK-045

**Description**:
인원수에 따른 총 비용 계산을 추가합니다.

**Acceptance Criteria**:
- [ ] 인원수 입력 UI
- [ ] 옵션별 총 비용 표시
- [ ] 1인당 비용도 함께 표시

**Implementation Steps**:
1. OptionCard에 인원수 prop 추가:
   ```typescript
   interface OptionCardProps {
     option: TransportOption;
     personCount: number;
   }

   export function OptionCard({ option, personCount }: OptionCardProps) {
     const totalCost = option.price * personCount;
     const perPersonCost = option.price;

     return (
       <View>
         <Text>{totalCost.toLocaleString()}원 (1인 {perPersonCost.toLocaleString()}원)</Text>
       </View>
     );
   }
   ```

**Files Changed**:
- `apps/mobile/src/components/OptionCard.tsx` (modified)
- `apps/mobile/src/screens/OptionCardScreen.tsx` (인원수 입력 추가)

---

## Phase 2.5: Testing & Polish (Week 5-6)

### TASK-050: E2E 테스트 (Auth + Sync)

**Priority**: P1
**Estimate**: 6h
**Depends On**: TASK-043

**Description**:
Playwright로 인증 및 동기화 E2E 테스트를 작성합니다.

**Acceptance Criteria**:
- [ ] 로그인 플로우 테스트
- [ ] Trip 생성 → 동기화 확인
- [ ] 멀티 디바이스 시나리오 (Realtime)

**Implementation Steps**:
1. `tests/e2e/auth.spec.ts`:
   ```typescript
   test('should login with Google and create profile', async ({ page }) => {
     await page.goto('http://localhost:8081');
     await page.click('text=Google로 로그인');
     // Google OAuth 플로우
     await page.waitForSelector('text=환영합니다');
   });
   ```

2. `tests/e2e/sync.spec.ts`:
   ```typescript
   test('should sync trip to Supabase', async ({ page }) => {
     await createTrip(page, '제주도 여행');

     // Supabase DB 확인
     const { data } = await supabase.from('trips').select('*').eq('title', '제주도 여행');
     expect(data).toHaveLength(1);
   });
   ```

**Files Changed**:
- `tests/e2e/auth.spec.ts` (new)
- `tests/e2e/sync.spec.ts` (new)

---

## Priority Summary

### P1 (Must Have) - 44h
TASK-031 ~ TASK-043, TASK-050

**Goal**: 완전한 인증 + 동기화 시스템

### P2 (Should Have) - 18h
TASK-044 ~ TASK-049

**Goal**: Transport Options 및 Recommendation

### Out of Scope (Phase 3)
- CRDT 기반 충돌 해결
- Pass 경제성 분석 (P3)
- 예약 알림 (P3)
- Activity 추천 (P4)

---

**문서 끝**
