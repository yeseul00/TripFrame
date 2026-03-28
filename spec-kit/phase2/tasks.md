# Task Breakdown: TripFrame Phase 2

**Feature**: `002-tripframe-phase2`
**Tasks version**: 1.0
**Created**: 2026-03-27
**Total Estimate**: ~62h (~8 working days)

> 상세 구현 가이드: `spec-kit/phase2/tasks-detail.md`

---

## Phase 2.1 — Backend Infrastructure (Week 1)

### TASK-031: Supabase 프로젝트 설정 · 2h
- [x] Supabase 프로젝트 생성 완료 (**수동 완료**: 2026-03-27)
- [x] Project URL 및 Anon Key 확보 (**수동 완료**: `docs/supa.md`에 저장)
- [x] OAuth Providers (Google, Apple) 활성화 (**수동 완료**: Google OAuth 활성화)
- [x] `apps/mobile/.env.example` 환경 변수 템플릿 생성 완료

### TASK-032: Database Schema 배포 · 1h · (031)
- [x] `user_profiles`, `trips`, `events` 테이블 생성 (**수동 완료**: 2026-03-27)
- [x] RLS 정책 활성화 확인 (**수동 완료**)
- [x] Triggers 정상 동작 확인 (**수동 완료**)

### TASK-033: Supabase Client 설정 · 1h · (031)
- [x] `@supabase/supabase-js` 설치
- [x] `apps/mobile/src/lib/supabase.ts` 생성
- [x] `apps/mobile/src/lib/database.types.ts` DB 타입 정의 생성
- [x] AsyncStorage 연동 구현
- [ ] 연결 테스트 성공 (**수동**: 실기기 Development Build 후 확인 필요)

---

## Phase 2.2 — Authentication (Week 1-2)

### TASK-034: Google OAuth 구현 · 4h · (033)
- [x] Google Cloud Console OAuth Client ID 생성 (Web)
- [x] `useGoogleAuth` 훅 구현
- [x] `LoginScreen.tsx` 구현 (로그인 버튼)
- [x] `App.tsx` 인증 상태 분기 (session 없으면 LoginScreen)
- [ ] 실기기/시뮬레이터에서 Google 로그인 성공 확인
- [ ] Supabase session 생성 확인

### TASK-035: Apple OAuth 구현 · 4h · (033)
- [ ] Apple Developer Service ID 생성
- [ ] `useAppleAuth` 훅 구현
- [ ] iOS에서 Apple 로그인 성공
- [ ] Supabase session 생성 확인
> ⏸ **보류**: iOS 환경(Mac + Xcode) 필요 — Phase 3에서 진행

### TASK-036: User Profile 생성 로직 · 2h · (034, 035)
- [x] 로그인 성공 시 `user_profiles` 존재 여부 확인
- [x] 없으면 기본값으로 프로필 자동 생성 (`ensureUserProfile`)
- [x] `App.tsx` `onAuthStateChange`에서 자동 호출

### TASK-037: User Profile CRUD API · 3h · (036)
- [x] `getUserProfile(userId)` 구현
- [x] `updateUserProfile(userId, updates)` 구현
- [x] `UserProfile` 타입 정의 (`src/lib/userProfile.ts`)

### TASK-038: Settings 화면 UI · 4h · (037)
- [x] `SettingsScreen.tsx` 구현
- [x] 짐 크기 선택 (CARRY_ON / LARGE)
- [x] 교통 선호 선택 (PUBLIC / TAXI / ANY)
- [x] 여유도 선택 (TIGHT / RELAXED)
- [x] 저장 시 Supabase 즉시 업데이트
- [x] 비로그인 상태에서 Google 로그인 버튼 표시

---

## Phase 2.3 — Cloud Sync (Week 2-3)

### TASK-039: SyncEngine 기본 구조 · 4h · (033)
- [x] `packages/core/src/sync/syncEngine.ts` 생성
- [x] 온라인/오프라인 상태 감지 (`setOnline`)
- [x] 큐 기반 동기화 스케줄러 + MAX_RETRIES 폐기
- [x] 단위 테스트 4개 통과

### TASK-040: Trip Sync 구현 · 3h · (039)
- [x] `supabaseSync.ts` — Trip UPSERT/DELETE executor 구현
- [x] `fetchRemoteTrips(userId)` 구현
- [x] `mergeWithRemote()` LWW 병합 함수 구현

### TASK-041: Event Sync 구현 · 3h · (039)
- [x] Event UPSERT/DELETE executor 구현 (supabaseSync.ts 통합)

### TASK-042: Conflict Resolution (LWW) · 3h · (040, 041)
- [x] `resolveConflict<T extends Timestamped>()` 순수 함수
- [x] `updated_at` 타임스탬프 비교 (로컬 ≥ 원격 → 로컬 승)
- [x] 단위 테스트 3개 통과

### TASK-043: Realtime Subscription · 4h · (040, 041)
- [x] `useRealtimeSync(userId)` 훅 구현
- [x] trips, events 테이블 postgres_changes 구독
- [x] App.tsx에서 userId 기반 구독/해제 처리

---

## Phase 2.4 — Transport Options (Week 3-4)

### TASK-044: Transport Options API 통합 · 6h
- [x] `TransportOption`, `UserPreferences` 타입 정의 (`packages/core/src/types/transport.ts`)
- [x] 목 데이터 생성 (`packages/core/src/data/mockTransport.ts`) — 하카타↔유후인 4개 옵션
- [x] `getMockTransportOptions(gapId)` 함수 구현

### TASK-045: OptionCard UI 컴포넌트 · 4h · (044)
- [x] `OptionCard.tsx` 구현 (요금, 소요시간, 모드, 비고)
- [x] 추천 옵션 퍼플 테두리 + 추천 배지
- [x] 인원수 × 1인 요금 합산 표시

### TASK-046: 제안카드 화면 구현 · 5h · (045)
- [x] `SuggestionScreen.tsx` 구현 (Phase 1 목업 교체)
- [x] DANGER Gap별 OptionCard 목록 렌더링
- [x] `rankOptions()` 기반 추천 순서 반영
- [x] 공백 없을 때 빈 상태 표시

### TASK-047: Recommendation 로직 · 4h · (037, 044)
- [x] `rankOptions(options, prefs)` 순수 함수 구현
- [x] 교통선호·짐크기·여유도 복합 점수 계산
- [x] 단위 테스트 4개 통과 (커버리지 ≥80%)

### TASK-048: Booking Link 연동 · 2h · (045)
- [x] `TransportOption.bookingUrl` 필드 정의
- [x] "예약하기" 버튼 → `WebBrowser.openBrowserAsync()`

### TASK-049: Multi-person Cost 계산 · 3h · (045)
- [x] `PersonSelector` 인원수 ±버튼 UI (1~9명)
- [x] 1인 요금 × 인원수 합산 실시간 표시

---

## Phase 2.5 — Testing

### TASK-050: E2E 테스트 (Auth + Sync) · 6h · (043)
- [x] `e2e/suggestion.spec.ts` — 제안카드 탭 8개 시나리오
- [x] `e2e/suggestion.spec.ts` — 설정 탭 6개 시나리오
- [ ] 로그인 플로우 E2E (실기기 Development Build 후 검증)
- [ ] Trip 동기화 E2E (Supabase 연동 후 검증)

---

## Phase 2.6 — Persona Testing

> 실제 사용자 시나리오를 유형별로 시뮬레이션하여 기능 완성도를 검증한다.

### TASK-051: 페르소나 정의 · 1h
- [x] `spec-kit/personas.md` — P1(가족여행), P2(배낭여행), P3(비즈니스) 정의

### TASK-052: 페르소나별 시나리오 테스트 · 3h · (051)
- [x] `personaScenarios.test.ts` — P1 택시 1순위 검증 (2개)
- [x] `personaScenarios.test.ts` — P2 대중교통 1순위 + 저가 검증 (3개)
- [x] `personaScenarios.test.ts` — P3 TIGHT 옵션 + 전 구간 옵션 존재 검증 (2개)
- [x] 8/8 테스트 통과
- [x] `e2e/persona.spec.ts` — P1/P2/P3 + COST 시나리오 13개 E2E 작성
- [x] 13/13 E2E 통과 (strict mode 셀렉터 수정 완료)

### TASK-053: 페르소나 테스트 결과 문서화 · 1h · (052)
- [x] personas.md에 각 페르소나 기대 동작 + 검증 시나리오 문서화
- [ ] UX 문제 발견 시 여기에 추가 (실기기 테스트 후)

---

## Phase 2.7 — User Testing & Feedback Process

> 실제 사용자로부터 피드백을 수집하고 제품에 반영하는 프로세스를 구축한다.

### TASK-054: 피드백 수집 UI · 3h
- [x] 설정 화면 하단 "피드백 보내기" 버튼
- [x] ⭐ 1~5 평점 + 한줄 코멘트 모달
- [x] Supabase `feedback` 테이블 INSERT 연동
- [x] 제출 완료 화면 (감사 메시지)

### TASK-055: 피드백 DB 스키마 · 1h · (054)
- [x] `spec-kit/phase2/feedback-schema.sql` 작성
- [x] RLS 정책 (INSERT 전체 허용, SELECT 서비스 롤 전용)
- [x] Supabase SQL Editor에서 feedback 테이블 배포 (**수동 완료**: 2026-03-28)

### TASK-056: 피드백 리뷰 프로세스 정의 · 1h · (054)
- [x] `spec-kit/feedback-process.md` 문서화
- [x] 매주 월요일 리뷰 주기 정의
- [x] 태스크 전환 기준 (rating ≤ 3 + 동일 문제 2건 이상)
- [x] 백오피스 조회 쿼리 포함

---

## Phase 2.8 — UX 개선 (개발자 피드백 반영) [Phase 3 이관 예정]

> 2026-03-28 개발자 사용 피드백 기반 — Phase 3에서 구현 예정

### TASK-057: 일정 선택 홈 화면 · (Phase 3)
- [ ] 개인별 홈 화면 (여행 목록 페이지) 구현
- [ ] 여행 카드 목록: 시간 역순 정렬 (최신 상단)
- [ ] 신규 일정 생성 카드 가장 상단 노출
- [ ] 여행 선택 → 현재 타임라인 화면으로 진입

### TASK-058: 제안카드 탭 인터랙션 개선 · (Phase 3)
- [ ] Gap 알림 카드 탭 → 토글 방식으로 옵션 카드 열기/닫기
- [ ] 현재 accordion 방식 개선 (각 Gap 독립 토글)

### TASK-059: 역산 탭 Day 선택 및 자유 시간 표시 · (Phase 3)
- [ ] 역산 화면에 Day 선택 아이콘/탭 추가
- [ ] Day별 공백 자유 시간 계산 결과 노출 (`calculateFreeTime` 연동)

### TASK-060: 역산 탭 대안 교통수단 기회비용 표시 · (Phase 3)
- [ ] 역산 결과에 "다른 교통수단 선택 시" 토글 추가
- [ ] 예) 버스 기준 역산 vs 철도 선택 시 출발 시각 비교 표시

### TASK-061: 설정 탭 추가 설정 항목 검토 · (Phase 3)
- [ ] 추가 설정 항목 후보 도출 (언어, 통화, 알림 등)
- [ ] 우선순위 결정 후 구현

---

## 진행 현황

| Phase | 태스크 | 완료 | 진행률 |
|-------|--------|------|--------|
| 2.1 Backend | 031-033 | 수동 설정 완료, 실기기 연결 테스트 대기 | ~90% |
| 2.2 Auth | 034-038 | 코드 완료, 모바일 실기기 대기 | ~80% |
| 2.3 Sync | 039-043 | 5/5 | 100% |
| 2.4 Transport | 044-049 | 6/6 | 100% |
| 2.5 Testing | 050 | 60/60 E2E 통과 (웹), 모바일 실기기 대기 | 80% |
| 2.6 Persona | 051-053 | 13/13 E2E 통과 | 100% |
| 2.7 Feedback | 054-056 | 4/4 완료 | 100% |
| 2.8 UX개선 | 057-061 | Phase 3 이관 예정 | 0% |
| **합계** | **31** | **25+** | **~88%** |
