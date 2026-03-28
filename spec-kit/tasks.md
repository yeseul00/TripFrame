# Task Breakdown: TripFrame Phase 4

**Feature**: `004-tripframe-phase4`
**Tasks version**: 1.0
**Created**: 2026-03-29
**Depends On**: Phase 3 완료 (TASK-057~069)
**Total Estimate**: ~36h (~4.5 working days)

---

## Phase 4.1 — 설정 기능 실구현

### TASK-072: useSettingsStore 생성 + SettingsScreen 연동 · 2h
- [ ] `src/store/useSettingsStore.ts` 생성
- [ ] `Settings` 타입 정의: `luggageSize`, `transportPreference`, `bufferLevel`
- [ ] AsyncStorage persist 설정 (useTripStore 동일 패턴)
- [ ] 기본값: `{ luggageSize: 'carry-on', transportPreference: 'any', bufferLevel: 'normal' }`
- [ ] `SettingsScreen.tsx` 라디오 버튼 → `useSettingsStore` 연결 (탭 시 즉시 저장)
- [ ] 앱 재시작 후 설정값 복원 확인

### TASK-073: 역산 로직 bufferLevel 연동 · 3h · (072)
- [ ] `packages/core/logic/applySettings.ts` 생성 — `applyBufferLevel(steps, bufferLevel)` 순수 함수
- [ ] `bufferLevel: 'tight'` → 모든 bufferTime × 0.8
- [ ] `bufferLevel: 'normal'` → 기본값 유지
- [ ] `bufferLevel: 'relaxed'` → 모든 bufferTime × 1.2
- [ ] `ReverseCalcDetailScreen.tsx` — `useSettingsStore` 구독, `applyBufferLevel` 적용
- [ ] 단위 테스트 3개 (tight/normal/relaxed)

### TASK-074: 제안 로직 교통 선호도 연동 · 2h · (072)
- [ ] `packages/core/logic/sortOptions.ts` 생성 — `sortByPreference(options, preference)` 순수 함수
- [ ] `preference: 'transit'` → 대중교통 타입 옵션 최상단 + "추천" 배지
- [ ] `preference: 'taxi'` → 택시 타입 옵션 최상단 + "추천" 배지
- [ ] `preference: 'any'` → 기존 비용 기준 정렬 유지
- [ ] `SuggestionScreen.tsx` — `useSettingsStore` 구독, `sortByPreference` 적용
- [ ] 단위 테스트 3개

---

## Phase 4.2 — Google OAuth + 클라우드 동기화 복구

### TASK-075: Supabase Redirect URLs 등록 · 1h
- [ ] Supabase 대시보드 → Authentication → URL Configuration → Redirect URLs 등록
  - `http://localhost:8081`
  - `http://localhost:8082`
  - 배포 URL (있는 경우)
- [ ] 로컬 환경에서 Google 로그인 오류 없이 완료 확인
- [ ] `SettingsScreen.tsx` 로그인 후 이메일 표시 확인

### TASK-076: 클라우드 동기화 검증 + 온라인 인디케이터 · 2h · (075)
- [ ] 로그인 후 로컬 trips → Supabase 자동 sync 동작 확인
- [ ] `SettingsScreen.tsx` sync 상태 텍스트: "동기화 완료" / "오프라인 모드"
- [ ] 로그아웃 시 로컬 데이터 유지 확인
- [ ] 재로그인 시 Supabase 데이터 pull 확인

---

## Phase 4.3 — 공백감지 FreeTime UI

### TASK-077: GapAnalysisScreen 여유 시간 카드 추가 · 2h
- [ ] `GapAnalysisScreen.tsx` 하단에 "여유 시간" 섹션 추가
- [ ] 현재 여행의 도착 이벤트 + 호텔 체크인 이벤트 감지
- [ ] `calculateFreeTime(arrivalTime, checkInTime)` 호출
- [ ] FreeTimeResult 카드: 여유 시간(분), suggestions 목록 표시
- [ ] 30분 미만 → 주황색 경고 (`text-amber-400`)
- [ ] 여유 시간이 없는 경우 섹션 미표시

---

## Phase 4.4 — UX 개선

### TASK-078: "공백감지" 메뉴명 최종 결정 + 일괄 변경 · 1h
- [ ] 메뉴명 최종 결정: 후보 "일정 체크" / "연결 확인" / "이동 체크" 중 1개 선택
- [ ] 앱 내 "공백감지" 전체 텍스트 일괄 변경 (탭바, 공통 헤더, GapAnalysisScreen)
- [ ] E2E 테스트에서 `text=공백감지` → 새 이름으로 업데이트

### TASK-079: TripFormModal 날짜 Picker · 3h
- [ ] `@react-native-community/datetimepicker` 설치
- [ ] `TripFormModal.tsx` 날짜 필드 → DatePicker 컴포넌트
- [ ] iOS/Android: 네이티브 DateTimePicker
- [ ] Web: `<TextInput>` + `inputMode="numeric"` fallback (또는 `type="date"`)
- [ ] 귀국일 < 출발일 인라인 오류 메시지 추가

---

## Phase 4.5 — 교통 데이터 내장 DB 기초

### TASK-080: 공항버스 노선 내장 DB · 3h · (IDEA-007)
- [ ] `packages/core/data/transport-rules.ts` — `TransportRoute` 타입 정의
- [ ] 인천국제공항(ICN) ↔ 서울 주요 구간 10개 이상 노선 데이터
  - ICN ↔ 강남, 홍대, 서울역, 잠실, 신촌, 수원, 인천시내 등
  - 소요시간, 배차간격, 첫차/막차
- [ ] `getTransportRoute(from, to)` 조회 함수
- [ ] fallback: 노선 없으면 기존 하드코딩값 + `isEstimate: true`
- [ ] 역산 로직에서 하드코딩된 75분/50분 → DB 조회로 교체

### TASK-081: KTX/SRT 주요 노선 스냅샷 · 2h · (IDEA-003)
- [ ] KTX 주요 10개 노선 데이터 (서울-부산, 서울-광주, 서울-대전, 서울-동대구 등)
- [ ] SRT 주요 5개 노선 데이터 (수서-부산, 수서-광주송정 등)
- [ ] `transport-rules.ts`에 추가
- [ ] `isEstimate: false` (실제 시각표 기준)
- [ ] 소요시간 + 배차간격만 저장 (잔여석/예매는 Phase 5)

---

## Phase 4.6 — 테스트 & 결과서

### TASK-082: E2E 테스트 업데이트 · 3h · (072~081)
- [ ] `settings.spec.ts` — 설정 저장/복원, 역산 결과 변동 검증 (3개 케이스)
- [ ] `gap.spec.ts` — FreeTime 카드 표시 검증 추가
- [ ] `suggestion.spec.ts` — 교통 선호도 정렬 검증 추가
- [ ] 메뉴명 변경 반영 (TASK-078 완료 후)
- [ ] 전체 E2E 통과 확인 (목표: 90+ PASS)

### TASK-083: Phase 4 완료보고서 · 1h · (082)
- [ ] `report/260329/phase4/E2E_TEST_REPORT.md` 생성
- [ ] `report/260329/phase4/PHASE4_완료보고서.md` 생성
- [ ] Phase 5 권장 우선순위 정리 (예약 알림, 패스 경제성, AI 도우미)

---

## 진행 현황

| Phase | 태스크 | 완료 | 진행률 |
|-------|--------|------|--------|
| 4.1 설정 기능 | 072~074 | 0/3 | 0% |
| 4.2 OAuth + 동기화 | 075~076 | 0/2 | 0% |
| 4.3 FreeTime UI | 077 | 0/1 | 0% |
| 4.4 UX 개선 | 078~079 | 0/2 | 0% |
| 4.5 교통 DB | 080~081 | 0/2 | 0% |
| 4.6 테스트 & 결과서 | 082~083 | 0/2 | 0% |
| **합계** | **12** | **0** | **0%** |
