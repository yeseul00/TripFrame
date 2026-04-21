# TripFrame Supabase 연동 계획서 (v1.1)

> **문서 ID** : TF-SUPABASE-001  
> **버전** : 1.1  
> **작성일** : 2026-04-20  
> **상태** : In Progress (Phase B 진입)

---

## 1. 현황 분석

### 1.1 인프라 설정 및 환경 구축 (Phase A - 100% 완료)
사용자(개발자)에 의해 Supabase 대시보드 및 구글 클라우드 콘솔의 모든 수동 설정이 완료되었습니다.

| 항목 | 상세 내용 | 상태 |
| :--- | :--- | :--- |
| **A-1. 프로젝트 생성** | Supabase `tripframe` 프로젝트 생성 및 URL/Key 발급 | ✅ 완료 |
| **A-2. DB 스키마** | `user_profiles`, `trips`, `events` 테이블 생성 완료 | ✅ 완료 |
| **A-3. RLS 설정** | 유저별 데이터 격리를 위한 Row Level Security 정책 적용 | ✅ 완료 |
| **A-4. Realtime** | `trips`, `events` 테이블의 실시간 변경 감지 활성화 | ✅ 완료 |
| **A-5. Google OAuth** | GCP 클라이언트 ID 발급 및 Supabase Provider/Redirect URL 등록 | ✅ 완료 |
| **A-6. 환경 변수** | `.env` 파일 내 `SUPABASE_URL` 및 `ANON_KEY` 설정 완료 | ✅ 완료 |

### 1.2 코드 구현 현황 (이미 구현된 항목)
| 파일 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| `src/lib/supabase.ts` | Supabase 클라이언트 초기화 (env 조건부) | ✅ 완료 |
| `src/lib/database.types.ts` | DB 테이블 TypeScript 타입 정의 | ✅ 완료 |
| `src/lib/userProfile.ts` | 프로필 생성 및 업데이트 기본 로직 | ✅ 완료 |
| `src/lib/supabaseSync.ts` | SyncEngine 기본 핸들러 및 원격 병합 로직 | ✅ 완료 |
| `src/hooks/useGoogleAuth.ts` | Google OAuth 인증 흐름 구현 | ✅ 완료 |
| `src/storage/encryptedStorage.ts` | Auth 토큰 암호화 저장소 구현 | ✅ 완료 |

---

## 2. 목표 아키텍처

**오프라인 우선 원칙 (Local-first Strategy)**:
- 로컬 Store(`Zustand`)가 항상 데이터의 최우선 소스(Primary Source of Truth)가 됩니다.
- 모든 데이터 쓰기는 로컬에 먼저 반영된 후, 네트워크 연결 시 백그라운드에서 Supabase와 동기화됩니다.

---

## 3. 구현 계획 (Phase B: 연동 코드 작업)

이제 클로드 코드(Claude Code)를 통해 진행할 핵심 작업 단계입니다.

### B-1. Null 안전성 및 예외 처리 강화
- `supabase` 객체가 null일 경우(환경 변수 미설정 등) 크래시를 방지하기 위한 가드 로직을 `useGoogleAuth.ts` 및 `userProfile.ts`에 추가합니다.

### B-2 & B-3. 데이터 매핑 및 Store 연동
- **Trip 데이터 매핑**: 로컬 Trip 타입과 DB 테이블 간의 규격을 맞추기 위한 `src/lib/tripMapper.ts`를 신설합니다.
- **Sync 엔진 연결**: `useTripStore.ts`의 `addTrip`, `updateTrip`, `deleteTrip` 액션이 실행될 때 `syncEngine`을 호출하도록 수정합니다.

### B-4. Realtime 반영 로직 구현
- `useRealtimeSync.ts`를 수정하여 DB에서 수신된 실시간 변경 사항(Payload)을 로컬 Store 상태에 즉시 반영합니다.

### B-5. 초기 원격 데이터 병합
- `App.tsx`의 `onAuthStateChange` 콜백에서 로그인 성공 시 원격 데이터를 불러와 로컬 상태와 병합(mergeWithRemote)하는 로직을 활성화합니다.

### B-6. 로그인 흐름 및 정책 구현 (로그인 선택형)
- **추천 정책**: 로그인 없이도 앱 사용이 가능하며, 설정 탭에서 로그인을 유도하는 방식을 채택합니다.
- `SettingsScreen.tsx`에 계정 섹션을 추가하고 로그인/로그아웃 버튼 및 동기화 상태를 표시합니다.

---

## 4. 검증 시나리오

| 시나리오 | 검증 방법 | 성공 기준 |
| :--- | :--- | :--- |
| **Google 로그인** | 로그인 버튼 클릭 후 OAuth 인증 완료 | 세션 생성 및 `user_profiles` 레코드 자동 생성 |
| **Trip 동기화** | 앱에서 여행 추가 후 대시보드 확인 | Supabase `trips` 테이블에 즉시 데이터 추가 |
| **오프라인 큐** | 네트워크 차단 후 여행 추가 후 재연결 | 연결 복원 시 큐에 쌓인 데이터가 자동 업로드 |
| **다기기 동기화** | 기기 A에서 수정 후 기기 B 확인 | Realtime 구독을 통해 기기 B에 실시간 반영 |

---

## 5. 보안 체크리스트

- [ ] 모든 테이블에 RLS(Row Level Security) 정책이 정상 적용되었는가?
- [ ] `EXPO_PUBLIC_` 접두사를 가진 환경 변수만 클라이언트에 노출되었는가? (Service Role Key 노출 금지)
- [ ] Refresh Token이 암호화 저장소(`encryptedStorage`)에 안전하게 보관되는가?
- [ ] `.env` 파일이 `.gitignore`에 등록되어 원격 저장소에 노출되지 않는가?