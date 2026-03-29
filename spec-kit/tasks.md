# Task Breakdown: TripFrame Phase 4

**Feature**: `004-tripframe-phase4`
**Tasks version**: 1.4
**Created**: 2026-03-29
**Updated**: 2026-03-29 (TF-TECH-001 + TF-MTG-001 전면 반영 — TASK-084 암호화 교체, secureStorage→encryptedStorage 통일, C레벨 결정 #2~#5 + 회의록 합의사항 신규 태스크 추가)
**Depends On**: Phase 3 완료 (TASK-057~069)
**Total Estimate**: ~61h (~7.5 working days)

---

## Phase 4.0 — 보안 강화 + 온보딩 [P0, 신규]

> 전문가 리뷰 3인 공통 Critical 과제. Phase 4 시작 즉시 처리.

### TASK-084: 스토리지 전환 + AES-256-GCM 암호화 래퍼 · 4h [P0]

> TF-TECH-001 결정: expo-secure-store(Phase 5) 대신 expo-crypto AES-256-GCM(Phase 4) 사용.
> expo-sqlite/kv-store는 AsyncStorage API 완전 호환 → Zustand persist 코드 수정 불필요.

- [x] `expo-sqlite`, `expo-crypto` 패키지 설치
- [x] `src/storage/encryptedStorage.ts` 생성 — AES-256-GCM 암호화 래퍼
  - `getMasterKey()`: kv-store에서 마스터 키 조회, 없으면 랜덤 256비트 생성 후 저장
  - `encryptedStorage.getItem/setItem/removeItem`: 암호화/복호화 처리
  - 웹 환경 fallback: `Platform.OS === 'web'` → SubtleCrypto API 사용
- [x] `useTripStore.ts` — AsyncStorage import → `expo-sqlite/kv-store` + `encryptedStorage` 교체
- [ ] `useSettingsStore.ts` (TASK-072 선행) — 동일 패턴 적용
- [x] 마이그레이션 로직: 앱 시작 시 기존 AsyncStorage 평문 데이터 감지 → 암호화 후 kv-store 저장 → 기존 키 삭제
- [x] 암호화/복호화 단위 테스트 최소 3개 (정상, 손상 데이터, 키 없는 초기 상태) — 5개 PASS
- [ ] 데이터 손실 없이 마이그레이션 완료 확인

### TASK-085: 온보딩 3장 스와이프 · 3h [P0]
- [x] `src/screens/OnboardingScreen.tsx` 생성
- [x] FlatList 기반 스와이프 슬라이드 3장 구현
  - Slide 1: 공백 감지 가치 전달 ("이동수단이 빠진 구간을 자동으로 감지해요")
  - Slide 2: 역산 엔진 가치 전달 ("항공편 시간에서 집 출발 시간을 역산해요")
  - Slide 3: CTA ("시작하기" 버튼)
- [x] 각 슬라이드 하단 "건너뛰기" 텍스트 버튼
- [x] 온보딩 완료 플래그 encryptedStorage 저장 (`onboarding_complete: 'true'`)
  > TF-TECH-001: encryptedStorage = expo-sqlite/kv-store + expo-crypto AES-256-GCM 래퍼
- [x] `App.tsx` 시작 시 플래그 확인 → 없으면 OnboardingScreen, 있으면 HomeScreen
- [ ] E2E: 첫 실행 시 온보딩 표시, 두 번째 실행 시 미표시 확인

### TASK-086: ESLint 규칙 추가 · 1h [P1]
- [x] `no-explicit-any` 규칙 활성화 (Constitution No `any` 자동 집행)
- [x] `max-lines-per-function: 50` (Constitution 단일 함수 ≤50줄 자동 집행) — warn 레벨, 기존 UI 컴포넌트 경고 유지
- [x] `no-restricted-imports`: Redux, moment, axios, 평문 AsyncStorage 차단 (Constitution 위반 방지)
- [x] 기존 코드 lint 통과 확인 (0 errors) — trip.ts `any` 수정, supabase.ts AsyncStorage → encryptedStorage 교체

### TASK-087: FreeTimeResult 타입 위치 이동 · 0.5h [P1]
- [x] `packages/core/logic/freeTime.ts`의 `FreeTimeResult` 타입 정의를 `packages/core/types/trip.ts`로 이동
- [x] `freeTime.ts`에서 import 경로 수정 (import + re-export 패턴)
- [x] 다른 파일에서 FreeTimeResult 참조 경로 수정 (외부 import 없음 확인)
- [x] 타입체크 통과 확인 (`pnpm --filter @tripframe/core typecheck`) + 테스트 53 PASS

---

## Phase 4.1 — 설정 기능 실구현

### TASK-072: useSettingsStore 생성 + SettingsScreen 연동 · 2h
- [x] `src/store/useSettingsStore.ts` 생성
- [x] `Settings` 타입 정의: `luggageSize`, `transportPreference`, `bufferLevel`
- [x] encryptedStorage persist 설정 (TASK-084 완료 — useTripStore 동일 패턴)
- [x] 기본값: `{ luggageSize: 'carry-on', transportPreference: 'any', bufferLevel: 'normal' }`
- [x] `SettingsScreen.tsx` 라디오 버튼 → `useSettingsStore` 연결 (탭 시 즉시 저장)
- [ ] 앱 재시작 후 설정값 복원 확인 (E2E에서 검증)

### TASK-073: 역산 로직 bufferLevel 연동 · 3h · (072)
- [x] `packages/core/logic/applySettings.ts` 생성 — `applyBufferLevel(steps, bufferLevel)` 순수 함수
- [x] `bufferLevel: 'tight'` → buffer/prep × 0.8 (최소 1분 보장)
- [x] `bufferLevel: 'normal'` → 기본값 유지 (동일 참조 반환)
- [x] `bufferLevel: 'relaxed'` → buffer/prep × 1.2
- [x] `ReverseCalcDetailScreen.tsx` — `useSettingsStore` 구독, `applyBufferLevel` 적용
- [x] 단위 테스트 4개 PASS (tight/normal/relaxed/극소값)

### TASK-074: 제안 로직 교통 선호도 연동 · 2h · (072)
- [x] `packages/core/logic/sortOptions.ts` 생성 — `sortByPreference(options, preference)` 순수 함수
- [x] `preference: 'transit'` → PUBLIC 모드 최상단
- [x] `preference: 'taxi'` → TAXI 모드 최상단
- [x] `preference: 'any'` → 기존 순서 유지 (불변 새 배열 반환)
- [x] `SuggestionScreen.tsx` — `useSettingsStore` 구독, `sortByPreference` 적용
- [x] 단위 테스트 4개 PASS (any/transit/taxi/불변성)

---

## Phase 4.2 — Google OAuth + 클라우드 동기화 복구

### TASK-075: Supabase Redirect URLs 등록 · 1h
- [x] .env.example에 등록 필요 URL 문서화 (localhost:8081/8082, tripframe://, exp://)
- [ ] Supabase 대시보드 → Authentication → URL Configuration → Redirect URLs 등록 (수동)
- [ ] 로컬 환경에서 Google 로그인 오류 없이 완료 확인

### TASK-076: 클라우드 동기화 검증 + 온라인 인디케이터 · 2h · (075)
- [x] `useRealtimeSync` — SyncStatus('idle'|'connected'|'offline') 반환 추가
- [x] `SettingsScreen.tsx` sync 상태 텍스트: "✓ 동기화 완료" / "⚠ 오프라인 모드" / 기본
- [x] App.tsx → SettingsScreen에 syncStatus prop 전달
- [ ] 로그아웃 시 로컬 데이터 유지 확인 (E2E에서 검증)

---

## Phase 4.3 — 공백감지 FreeTime UI

### TASK-077: GapAnalysisScreen 여유 시간 카드 추가 · 2h
- [x] `GapAnalysisScreen.tsx` 하단에 "여유 시간" 섹션 추가
- [x] 현재 여행의 도착 이벤트 + 호텔 체크인 이벤트 감지
- [x] `calculateFreeTime(arrivalTime, checkInTime)` 호출
- [x] FreeTimeResult 카드: 여유 시간(분), suggestions 목록 표시
- [x] 30분 미만 → 주황색 경고 (`text-amber-400`)
- [x] 여유 시간이 없는 경우 섹션 미표시

---

## Phase 4.4 — UX 개선

### TASK-078: "공백감지" 메뉴명 최종 결정 + 일괄 변경 · 1h
- [ ] 메뉴명 최종 결정: 후보 "일정 체크" / "연결 확인" / "이동 체크" 중 1개 선택
- [ ] 앱 내 "공백감지" 전체 텍스트 일괄 변경 (탭바, 공통 헤더, GapAnalysisScreen)
- [ ] E2E 테스트에서 `text=공백감지` → 새 이름으로 업데이트

### TASK-079: TripFormModal 날짜 Picker · 3h
- [x] `@react-native-community/datetimepicker` 설치
- [x] `TripFormModal.tsx` 날짜 필드 → DatePicker 컴포넌트
- [x] iOS/Android: 네이티브 DateTimePicker
- [x] Web: `<TextInput>` + `inputMode="numeric"` fallback (또는 `type="date"`)
- [x] 귀국일 < 출발일 인라인 오류 메시지 추가

---

## Phase 4.5 — 교통 데이터 내장 DB 기초

### TASK-080: 공항버스 노선 내장 DB · 3h · (IDEA-007)
- [x] `packages/core/data/transport-rules.ts` — `TransportRoute` 타입 정의
- [x] 인천국제공항(ICN) ↔ 서울 주요 구간 10개 이상 노선 데이터
  - ICN ↔ 강남, 홍대, 서울역, 잠실, 신촌, 수원, 인천시내 등
  - 소요시간, 배차간격, 첫차/막차
- [x] `getTransportRoute(from, to)` 조회 함수
- [x] fallback: 노선 없으면 기존 하드코딩값 + `isEstimate: true`
- [x] 역산 로직에서 하드코딩된 75분/50분 → DB 조회로 교체

### TASK-081: KTX/SRT 주요 노선 스냅샷 · 2h · (IDEA-003)
- [x] KTX 주요 10개 노선 데이터 (서울-부산, 서울-광주, 서울-대전, 서울-동대구 등)
- [x] SRT 주요 5개 노선 데이터 (수서-부산, 수서-광주송정 등)
- [x] `transport-rules.ts`에 추가
- [x] `isEstimate: false` (실제 시각표 기준)
- [x] 소요시간 + 배차간격만 저장 (잔여석/예매는 Phase 5)

---

## Phase 4.6 — 버그픽스 + 추가 기능 [P1~P2]

### TASK-088: 택시 비용 계산 로직 개선 · 2h [P1]

> 피드백: 택시는 인원수 비례 증가가 아니라 차량 대수 기준이어야 함

- [ ] `packages/core/logic/sortOptions.ts` 또는 비용 계산 로직에 `calcTaxiCost(baseCost, passengers, vehicleCapacity)` 순수 함수 추가
- [ ] 기본 로직: 승차 인원 ≤ 4인 → 1대 비용 고정, 5~8인 → 2배, 9~12인 → 3배 (천장 나눗셈)
- [ ] `TransportOption`에 `costModel: 'per-vehicle' | 'per-person'` 필드 추가
  - 일반 택시: `'per-vehicle'` (한국/일본/유럽 등)
  - 오토바이 택시 (베트남 xe ôm 등): `'per-person'` (1인당 비용 그대로)
- [ ] `SuggestionsScreen.tsx` 인원수 × 비용 표시 시 costModel에 따라 분기 적용
- [ ] 단위 테스트: 3인 택시(= 1대 비용), 5인 택시(= 2대 비용), 2인 오토바이(= 2배 비용)

### TASK-090: iCal 파일 내보내기 (공유 기능 Phase 1) · 2h [P2]

> TF-MTG-001 C레벨 결정 #2: 공유 기능의 1단계는 iCal Export. 읽기 전용 링크(Phase 5), 딥링크(Phase 6) 순서로 확장.

- [ ] `packages/core/logic/exportIcal.ts` — `generateIcal(trip: Trip): string` 순수 함수
  - VCALENDAR 표준 포맷 생성 (RFC 5545)
  - TripEvent 각 항목 → VEVENT 변환 (DTSTART, DTEND, SUMMARY, DESCRIPTION)
  - 시간대(timezone) VTIMEZONE 블록 포함
- [ ] `apps/mobile`에서 `expo-sharing` + `expo-file-system`으로 .ics 파일 저장 후 공유 시트 열기
- [ ] 여행 상세 화면 또는 여행 카드 메뉴(더보기 버튼)에 "내보내기" 옵션 추가
- [ ] 단위 테스트: generateIcal 출력값 포맷 검증

### TASK-091: Trip 모델 — insuranceEligible + isHidden + notificationsEnabled 필드 예약 · 0.5h [P2]

> TF-MTG-001 합의: 여행 카드 숨기기와 D-day 알림은 별도 필드로 관리. insuranceEligible은 UI 없이 타입만 예약.

- [ ] `packages/core/types/trip.ts`의 `Trip` 인터페이스에 필드 추가:
  ```typescript
  isHidden?: boolean           // 홈 화면 숨기기 (Phase 5 UI 구현)
  notificationsEnabled?: boolean  // D-day 알림 on/off (Phase 5 UI 구현)
  insuranceEligible?: boolean  // 여행 취소 보험 대상 여부 (UI 미구현, 타입 예약만)
  ```
- [ ] `useTripStore.ts` — 기본값 `isHidden: false`, `notificationsEnabled: true`
- [ ] 기존 Trip 데이터와 하위 호환 (optional 필드이므로 undefined = 기본값)
- [ ] 타입체크 통과 확인

### TASK-092: 탭 간 딥링크 (Quick Win) · 1h [P2]

> TF-MTG-001 합의: 탭 병합 대신 크로스탭 딥링크를 Phase 4 Quick Win으로 채택.

- [ ] 공백감지 탭의 Gap 카드 "제안 보기" 버튼 → 제안카드 탭으로 이동 + 해당 Gap 선택 상태 전달
- [ ] 역산 탭 결과 카드 "전체 일정에서 보기" → 일정 탭 해당 Day로 스크롤 이동
- [ ] `App.tsx` 또는 공유 네비게이션 헬퍼에 `navigateTo(tab, params)` 유틸 추가
- [ ] E2E: Gap 카드 → 제안 탭 이동 시 올바른 Gap이 선택됨 확인

### TASK-089: 일정 탭 — Total 타임라인 뷰 · 3h [P2]

> 요구: 전체 여행 일정을 스크롤로 한눈에 확인. 장기 여행(10일+) 성능 고려

- [ ] `TimelineScreen.tsx`에 "전체 보기" / "일별 보기" 토글 추가
- [ ] 전체 보기: 모든 날의 이벤트를 날짜 헤더(Day 1, Day 2…)와 함께 단일 FlatList로 렌더링
- [ ] 성능: `FlatList` + `keyExtractor` + `getItemLayout` 적용 (10일 이상 장기 여행 스크롤 최적화)
- [ ] 날짜 헤더를 섹션 타이틀로 sticky 처리 (`SectionList` 또는 커스텀 sticky header)
- [ ] 선택된 Day가 있으면 해당 섹션으로 자동 스크롤 (`scrollToIndex`)
- [ ] 빈 날(이벤트 없는 날)도 날짜 헤더는 표시 (일정 구멍 시각화)

---

## Phase 4.7 — 테스트 & 결과서

### TASK-082: E2E 테스트 업데이트 · 3h · (072~081)
- [x] `settings.spec.ts` — 설정 저장/복원, 역산 결과 변동 검증 (8개 케이스 PASS)
- [x] `gap.spec.ts` — FreeTime 카드 표시 검증 추가 (TC-016, TC-016-B)
- [x] `suggestion.spec.ts` — 교통 선호도 정렬 검증 추가 (SCR-004-09, 04-10)
- [ ] 메뉴명 변경 반영 (TASK-078 완료 후)
- [x] 전체 E2E 통과 확인 — 97/97 PASS

### TASK-083: Phase 4 완료보고서 · 1h · (082)
- [x] `report/260329/phase4/E2E_TEST_REPORT.md` 생성
- [x] `report/260329/phase4/PHASE4_완료보고서.md` 생성
- [x] Phase 5 권장 우선순위 정리 (예약 알림, 패스 경제성, AI 도우미)

---

## 진행 현황

| Phase | 태스크 | 완료 | 진행률 |
|-------|--------|------|--------|
| 4.0 보안 + 온보딩 [P0] | 084~087 | 4/4 | 100% |
| 4.1 설정 기능 | 072~074 | 3/3 | 100% |
| 4.2 OAuth + 동기화 | 075~076 | 2/2 | 100% |
| 4.3 FreeTime UI + 타입 정리 | 077 | 1/1 | 100% |
| 4.4 UX 개선 + 코드 품질 | 078~079 | 1/2 | 50% (078 보류) |
| 4.5 교통 DB | 080~081 | 2/2 | 100% |
| 4.6 버그픽스 + 추가 기능 | 088~092 | 0/5 | 0% (P2, 선택) |
| 4.7 테스트 & 결과서 | 082~083 | 2/2 | 100% |
| **합계 (필수)** | **16** | **16** | **100%** |

---

## Phase 5 태스크 초안

> Phase 4 완료 후 정식 tasks.md 작성. 아래는 전문가 리뷰 기반 초안. 태스크 번호는 Phase 4 완료 후 순차 배정.

### Phase 5.0 — 보안 키 업그레이드 (TF-TECH-001 2단계)

> TF-MTG-001 C레벨 결정 #1: Phase 5에서 Dev Build 전환 후 마스터 키 저장소를 kv-store → expo-secure-store(하드웨어 보안 모듈)로 업그레이드.
> **데이터 암호화 로직은 변경 없음** — getMasterKey() 저장소 1곳만 교체.

**TASK-09x: expo-secure-store 마스터 키 업그레이드**
- `expo-secure-store` 패키지 설치 (Dev Build 필수, Expo Go 미지원)
- `encryptedStorage.ts`의 `getMasterKey()`: `AsyncStorage.getItem` → `SecureStore.getItemAsync` 교체
- 마이그레이션: kv-store에 저장된 기존 마스터 키 → expo-secure-store로 이전 후 kv-store 키 삭제
- 단위 테스트: 키 마이그레이션 성공, 신규 설치 시 키 생성 확인
- **데이터 암호화/복호화 단위 테스트 모두 그대로 통과해야 함** (로직 변경 없음 검증)

---

### Phase 5.1 — Development Build 전환

**TASK-09x: EAS Build 전환 + 실기기 테스트 환경 구축**
- Expo Go → EAS Development Build 전환
- expo-secure-store, expo-auth-session 실기기 동작 검증
- iOS/Android 물리 기기 또는 에뮬레이터 테스트

**TASK-09x: Maestro E2E 네이티브 테스트 1차 구축**
- 로그인 플로우, 여행 생성, 역산 결과 확인 3개 시나리오
- CI에서 Android 에뮬레이터 기반 실행

### Phase 5.2 — 예약 루프 완성

**TASK-09x: 교통 옵션 예약 후 "해결됨" 표시**
- 예약 링크 탭 → 외부 브라우저 → 복귀 시 "예약 완료?" 다이얼로그
- 확인 시 Gap 상태 RESOLVED 저장
- GapAnalysisScreen RESOLVED 공백 초록 체크 표시
- Core에 Gap 상태 타입 추가 (`GapStatus: 'DANGER' | 'WARNING' | 'RESOLVED'`)

**TASK-09x: 예약 상태 영속성**
- RESOLVED 상태 encryptedStorage 저장 (events 배열과 분리 관리)
- 앱 재시작 후 RESOLVED 상태 복원

### Phase 5.3 — 탭 구조 재편 ("이동 체크" 통합)

**TASK-09x: GapDetection + Suggestion 스토어 통합 설계**
- `useGapStore.ts` 신규 생성 (기존 두 화면의 상태 통합)
- GapCard 펼치면 TransportOptions 인라인 표시

**TASK-09x: "이동 체크" 단일 탭으로 화면 통합**
- 기존 "공백감지" + "제안카드" 탭 → "이동 체크" 탭 1개로 합병
- 빈 탭 슬롯 → D-day 카드 또는 여행 체크리스트 배치

### Phase 5.4 — D-day 위젯 MVP

**TASK-09x: D-day 위젯 (iOS + Android)**
- iOS: WidgetKit + expo-widgets (또는 네이티브 모듈)
- Android: App Widget Provider
- 표시 내용: "D-N 여행명 ✈ 출발 HH:MM"
- 여행 카드별 위젯 개별 제공 (여행이 여러 개면 각각 위젯 추가 가능)
- 탭 → 앱 해당 여행 화면 딥링크

### Phase 5.5 — 여행 카드 숨기기

**TASK-09x: 여행 카드 숨기기 기능**
- 홈 화면에서 원하지 않는 여행 카드 숨기기 (삭제와 구분)
- 숨긴 여행 목록 별도 섹션("숨긴 여행 N개") 또는 설정에서 관리
- 알림(D-day 위젯, 푸시)에서도 자동 제외
- encryptedStorage에 `hiddenTripIds: string[]` 저장
- 언제든 숨기기 해제 가능

### Phase 5.6 — 공유 기능 (설계 필요)

**TASK-09x: 공유 기능 설계 + MVP 구현**

> 구현 방식 미결정. 아래 후보 중 Phase 5에서 결정 후 구현.

| 방식 | 장점 | 단점 | 난이도 |
|------|------|------|--------|
| 읽기 전용 링크 공유 (Supabase 기반) | 수신자 앱 불필요 | 서버 의존, URL 만료 관리 | 중 |
| iCal/CSV 파일 내보내기 | 범용 호환 | 실시간 업데이트 불가 | 하 |
| 앱 딥링크 공유 | 풍부한 UI | 수신자도 앱 설치 필요 | 중 |
| 스크린샷 자동 캡처 공유 | 설치 불필요 | 정보 밀도 한계 | 하 |

**권고 순서**: iCal 파일 Export(Phase 4 P2에 이미 계획) → 읽기 전용 웹 링크(Phase 5) → 딥링크 공유(Phase 6)

### Phase 5.5 — CI/CD + 코드 품질

**TASK-09x: GitHub Actions CI 파이프라인**
- PR → ESLint + Jest + Playwright 자동 실행
- 결과 PR 코멘트 자동 게시
- main 머지 → EAS Build 자동 트리거

**TASK-09x: Supabase 통합 테스트 환경**
- 로컬 Supabase 인스턴스 또는 테스트 프로젝트 분리
- sync 로직 E2E 레벨 검증

### Phase 5.7 — 항공 역산 정밀화 (설계 분석 클러스터)

> 3~5번 요구사항 통합 클러스터. 구현 전 설계 분석 태스크가 선행되어야 함.

**TASK-09x: [분석] 항공 역산 정밀화 설계 문서 작성**

배경: 현재 역산 엔진은 공항 버퍼를 단일 고정값으로 처리. 아래 요소를 모두 고려한 설계 기준이 필요함.

**(A) 공항별 체크인 소요시간 + 게이트 추산**
- 국내 공항별 체크인 소요시간 분류
  - 인천 T1 / T2 (터미널 구분만으로도 이동 소요 다름)
  - 김포, 김해, 제주, 대구, 청주 등
- 항공편 분석을 통한 게이트 추산 로직
  - 항공사 + 목적지 → 터미널/게이트 존 추산 (예: 대한항공 국제선 → T2)
  - 게이트 존 → 이동 소요시간 범위 (예: T2 중앙 ±10분, 외곽 ±20분)
- 국제선 대형 환승 공항(NRT, HND, HKG 등) 버퍼 추가 기준

**(B) 항공편 체크인 마감시간 DB 규모 설계**
- 필요 데이터 단위: 항공사 × (국제/국내) × (일반/비즈니스) = 마감시간(분)
  - 예) 대한항공 국제선 일반석 → 출발 60분 전 마감
  - 예) LCC(제주항공 등) 국내선 → 출발 30분 전 마감
- 규모 추산: 국내 주요 항공사 10개 × 클래스 3 × 노선 유형 3 ≈ **90개 레코드**로 커버 가능
- 외항사(ANA, JAL, United 등) 포함 시 확장: +50개 레코드 예상
- 구현 방식 후보:
  - A. `airline-rules.ts` 정적 JSON (유지보수 간단, 실시간 X)
  - B. Supabase 테이블 (관리자 업데이트 가능, 네트워크 의존)
  - **권고: Phase 5는 A(정적), Phase 7+ B(동적) 전환**

**(C) 인천-하와이 케이스 종합 시뮬레이션**
- 역산 단계 분해:
  1. 하와이 도착 목표 시각
  2. 대한항공 국제선 체크인 마감: -60분
  3. T2 게이트 이동: -20분
  4. 보안 검색 + 출국 심사: -40분 (국제선 기준)
  5. 인천공항 도착 (집 → T2): -60~90분 (공항버스/AREX 분기)
  6. 집 출발 준비 buffer: -30분 (설정값 반영)
  - **최소 집 출발: 하와이편 출발 -3시간 50분 ~ -4시간 20분**
- 이 시뮬레이션이 Phase 5 역산 엔진 고도화의 설계 기준이 됨

**TASK-09x: [구현] AirportBuffer + AirlineCheckin 데이터 모듈**
- `packages/core/data/airport-rules.ts` — 공항별 버퍼, 터미널, 게이트존 데이터
- `packages/core/data/airline-rules.ts` — 항공사별 체크인 마감 기준
- `calculateAirportBuffer(airportCode, terminal, flightType)` 순수 함수
- 역산 엔진에 공항 항목 이벤트 → 자동으로 위 함수 호출

---

### Phase 5.8 — 국내 교통 DB 아키텍처 고도화

> Phase 4의 TASK-080/081이 초기 데이터 구축. Phase 5에서 **한국 내수 시장** 겨냥 DB 고도화.

**TASK-09x: [분석] 국내 교통 DB 처리 방식 설계 문서**
- 현재 `TransportRoute` 구조의 한계 파악 (단순 from-to-duration)
- 필요 확장 요소:
  - 시간대별 소요시간 변동 (출퇴근 버스 혼잡 등)
  - 환승 필요 노선 (A→B→C)
  - 실시간 API 연동 여부 결정 (공공데이터포털 코레일 API 등)
- 규모 추산: 국내 주요 도시 간 노선
  - 서울-부산/대전/광주/대구/강릉/여수/묵호 등 주요 50개 노선
  - 공항버스 30개 + KTX/SRT 20개 (Phase 4에서 구축 예정)
  - 고속버스 주요 20개 추가 시 총 **~100개 레코드** 예상
- 권고 아키텍처: 정적 JSON (Phase 5) → 공공API 연동 (Phase 6)

**TASK-09x: [구현] 고속버스 + 광역 노선 DB 추가**
- 서울-부산/대전/광주/전주/여수/묵호/강릉 고속버스 주요 노선
- 소요시간, 배차간격, 터미널 정보
- `transport-rules.ts`에 `type: 'express-bus'` 추가

---

### Phase 5.9 — 여행 도시 프레임 템플릿

> 요구사항: 국내 5 + 아시아 5도시 중심 여행 템플릿(프레임). 협업자 동의 필요.

**TASK-09x: [설계] 여행 템플릿 프레임 설계 + 협업자 협의**
- 템플릿 개념 정의: 특정 도시 여행의 기본 이벤트 구조 제공
  - 예) "후쿠오카 3박 4일" 템플릿 → 항공편, 호텔, 주요 구간 교통 이벤트 미리 채워짐
- 대상 도시 (우선순위):
  - 국내: 서울, 대전, 여수, 묵호항, 부산
  - 아시아: 후쿠오카, 나트랑, 홍콩, 치앙마이, 대만(타이베이)
- 협업자와 사전 협의 필요 사항:
  - 템플릿 데이터 출처 및 관리 주체
  - 사용자 커스터마이징 허용 범위
  - 템플릿 업데이트 주기
- 구현 위치: `packages/core/data/trip-templates.ts`

---

### Phase 5.6 — App Store 출시 준비

**TASK-09x: Sentry 크래시 리포팅 연동**
- `@sentry/react-native` 설치 + DSN 설정
- 비인식 오류 자동 보고

**TASK-09x: App Store 메타데이터 + 개인정보처리방침**
- App Store Connect 스크린샷 6종 (5.5" iPhone)
- Play Store 스크린샷 + 설명
- 개인정보처리방침 웹 페이지 호스팅

**TASK-09x: TestFlight / 내부 테스트 배포**
- EAS Submit으로 TestFlight 업로드
- 베타 테스터 5명 초청 테스트

---

*Phase 4 Total: 21 tasks (~61h) | Phase 5 예상: 25+ tasks (~95h)*
*전문가 리뷰 TF-REVIEW-000 반영 (2026-03-29)*
