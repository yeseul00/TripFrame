# Task Breakdown: TripFrame Phase 5

**Feature**: `005-tripframe-phase5`
**Tasks version**: 1.0
**Created**: 2026-03-29
**Depends On**: Phase 4 완료 (TASK-072~087, 083)
**Total Estimate**: ~23h (~3 working days)
**참조**: TF-MTG-002, spec.md v1.0, plan.md v1.0

---

## Phase 5.0 — EAS Dev Build 인프라 [P0]

> 모든 네이티브 기능의 전제 조건. 순차 실행 필수.

### TASK-093: EAS Dev Build 설정 + Android 빌드 · 4h [P0] ✅ (코드 완료, 빌드는 사용자 실행)

> TF-MTG-002: Dev Build 전환은 Phase 5의 게이트키퍼. SDK 업그레이드와 동시 진행 금지.

- [x] `eas.json` 생성 — development / preview / production 프로필
- [ ] `eas build --profile development --platform android` 첫 빌드 성공 *(EAS CLI 설치 후 사용자 실행)*
- [x] GitHub Actions 워크플로우: main 머지 시에만 `eas build` 트리거 (`.github/workflows/eas-build.yml`)
- [ ] Android 실기기 APK 설치 + 기존 기능 동작 확인 *(빌드 후)*
- [ ] Playwright E2E 확인 *(빌드 후)*
- [x] SDK 업그레이드 요구 발생 시 → 현재 SDK 유지

### TASK-094: expo-secure-store 마스터 키 업그레이드 · 3h [P0] ✅ (093)

> TF-TECH-001 2단계. getMasterKey() 저장소 1곳만 교체. 암호화 로직 변경 없음.

- [x] `expo-secure-store` 패키지 설치 (package.json 추가)
- [x] `encryptedStorage.ts` getMasterKey() 수정:
  - SecureStore.getItemAsync → 키 존재 시 반환
  - 없으면 신규 생성 → SecureStore.setItemAsync → 성공 확인 후 kv-store 구 키 삭제
  - SecureStore 저장 실패 → kv-store 키 유지(폴백) + 에러 로깅
- [x] 마이그레이션 흐름: kv-store 키 존재 → SecureStore 이전 성공 → kv-store 삭제
- [x] 양쪽에 키 존재 시 SecureStore 우선 (앱 강제 종료 후 재시도 시나리오)
- [x] App.tsx: 마이그레이션 중 ActivityIndicator 로딩 인디케이터 표시
- [x] 기존 암호화 단위 테스트 5개 그대로 통과 (로직 변경 없음 검증)
- [x] 마이그레이션 단위 테스트 3개 추가: 성공 / SecureStore 실패 폴백 / 중단 후 재시도
- [x] B-05: 마이그레이션 데이터 손실 없음 확인 (단위 테스트 포함)

---

## Phase 5.1 — 예약 루프 완성

### TASK-095: Gap RESOLVED 상태 + useGapStore · 4h [P1] · (093) ✅

> TF-MTG-002: AppState 자동 팝업 대신 Gap 카드 상시 "예약 완료" 버튼. gapKey 안정성 필수.

- [x] `packages/core/types/trip.ts` — `GapStatus: 'DANGER' | 'WARNING' | 'RESOLVED'` 타입 추가
- [x] `packages/core/logic/gapEngine.ts` — `makeGapKey(fromLocation, toLocation, dayIndex): string` 함수 추가
- [x] gapKey 안정성 단위 테스트: 이벤트 시간 변경 시 gapKey 불변 확인
- [x] `apps/mobile/src/store/useGapStore.ts` 생성:
  - `resolvedGaps: Record<string, Record<string, { resolvedAt: string; method: string }>>` 상태
  - `resolveGap(tripId, gapKey, method)` / `unresolveGap(tripId, gapKey)` 액션
  - encryptedStorage persist (기존 패턴 동일)
- [x] `GapCard` 컴포넌트에 "예약 완료" 버튼 상시 노출 (AppState 자동 팝업 금지)
- [x] RESOLVED 카드 스타일: 초록 테두리 + ✓ 아이콘, 목록 하단 정렬
- [x] 앱 재시작 후 RESOLVED 상태 복원 확인
- [x] `method` 필드: 교통수단 유형 기록 (향후 전환율 분석용 — TF-MTG-002 Expert 1)

---

## Phase 5.2 — 탭 구조 재편 [번들 태스크]

### TASK-096: 4탭 재편 + 이동 체크 + 딥링크 + E2E 수정 · 5h [P1] · (095) ✅

> TF-MTG-002: 탭 재편 + E2E 수정 + 딥링크를 반드시 단일 태스크로 번들링. 분리 금지.

- [x] `App.tsx` 탭바: 공백감지/제안카드 제거 → "이동 체크" 탭 추가 (4탭: 일정/이동 체크/역산/설정)
- [x] `MoveCheckScreen.tsx` 신규 생성:
  - Gap 카드 목록 (useGapStore + useTripStore 구독)
  - Gap 카드 탭 → 교통 옵션 인라인 펼침
  - "예약 완료" 버튼 인라인 (TASK-095 통합)
  - RESOLVED 카드 하단 정렬
- [x] SuggestionScreen 교통 옵션 렌더링 로직 → 분리 컴포넌트로 추출 후 MoveCheckScreen에서 재사용
- [x] `navigateTo(tab, params)` 헬퍼 함수 추가 (App.tsx 또는 navigation 헬퍼)
- [x] 딥링크 구현:
  - 이동 체크 탭 + `gapKey` 파라미터 → 해당 Gap 카드 자동 펼침
  - 역산 탭 결과 → 일정 탭 해당 Day 스크롤
- [x] E2E 수정 (번들, 분리 금지):
  - `gap.spec.ts` + `suggestion.spec.ts` → `moveCheck.spec.ts` 통합 재작성
  - 모든 spec 파일에서 탭 이름 변경 반영 ("공백감지" → "이동 체크")
  - B-03 설정값 복원 E2E 함께 재검증
- [x] 전체 E2E PASS (기존 97개 동등 커버리지 유지)

---

## Phase 5.3 — iCal Export

### TASK-097: iCal Export + 안내 화면 · 3h [P2] · (093) ✅

> TF-MTG-001/002 C레벨 결정. RFC 5545 + TripFrame 커스텀 프로퍼티.

- [x] `packages/core/logic/exportIcal.ts` — `generateIcal(trip: Trip): string` 순수 함수
  - VCALENDAR 헤더 + VTIMEZONE(Asia/Seoul) + VEVENT 블록
  - VEVENT 필드: DTSTART, DTEND, SUMMARY, DESCRIPTION, LOCATION
  - `X-TRIPFRAME-GAP-STATUS`: DANGER / WARNING / RESOLVED
  - `X-TRIPFRAME-RESOLVED-AT`: ISO-8601 (RESOLVED인 경우)
- [x] `packages/core/src/index.ts`에 exportIcal 내보내기 추가
- [x] `apps/mobile`에서 `expo-sharing` + `expo-file-system` 설치 및 연동:
  - .ics 임시 파일 생성 → Sharing.shareAsync() 호출
- [x] Export 완료 후 안내 모달/화면:
  - "파일이 생성되었습니다. Google Calendar → 설정 → 가져오기에서 추가하세요."
- [x] 여행 카드 더보기(···) 메뉴 또는 일정 탭 헤더에 "내보내기" 옵션 추가
- [x] 단위 테스트:
  - generateIcal 출력에 VCALENDAR/VEVENT 존재 확인
  - X-TRIPFRAME-GAP-STATUS 포함 확인
  - DTSTART/DTEND 포맷 검증 (ISO-8601)

---

## Phase 5.4 — 테스트 + 문서

### TASK-098: Maestro 기초 + 온보딩 웹 수정 + B-01~04 번들 · 3h [P1] · (094, 096) ✅

> TF-MTG-002: Playwright 주력 유지. Maestro는 네이티브 전용 3~4개 시나리오에만 한정.

- [x] Maestro CLI 설치 + `.maestro/` 디렉터리 초기화
- [x] Maestro 시나리오 1: SecureStore 마이그레이션 검증
  - kv-store 키 주입 → 앱 재시작 → SecureStore 이전 확인 → 데이터 복호화 성공
- [x] Maestro 시나리오 2: "예약 완료" 탭 → RESOLVED 저장 → 앱 재시작 → 상태 복원
- [x] B-01 온보딩 웹 수정: `Platform.OS === 'web'` 분기 — 배경색 `#0F0F13` + ScrollView 교체
  - 목표: Playwright MCP 시각 검증 통과 수준
- [x] B-04 로그아웃 시 로컬 데이터 유지 → Playwright 또는 Maestro 시나리오로 검증

### TASK-099: Phase 5 완료보고서 + Alpha 배포 체크리스트 · 1h · (모든 태스크) ✅

- [x] `report/260329/phase5/E2E_TEST_REPORT.md` 생성 (Playwright MCP 화면 검증 포함)
- [x] `report/260329/phase5/PHASE5_완료보고서.md` 생성
- [ ] Alpha 내부 배포 체크리스트:
  - [x] Dev Build APK Android 실기기 설치 성공 *(3차 빌드 성공, APK 설치 완료)*
  - [x] expo-secure-store 마이그레이션 완료 (데이터 손실 없음)
  - [x] 이동 체크 탭: Gap 확인 → 교통 옵션 → 예약 완료 단일 흐름
  - [x] RESOLVED 상태 앱 재시작 후 복원
  - [x] iCal Export Google Calendar 임포트 성공
  - [x] 전체 E2E PASS (Core 76/76, Mobile 8/8)
- [ ] Notion DB 등록 (결과서 2개) *(사용자 실행)*
- [x] spec-kit/phase5/ 아카이브

---

## 진행 현황

| Phase | 태스크 | 완료 | 진행률 |
|-------|--------|------|--------|
| 5.0 인프라 [P0] | 093~094 | 2/2 | 100% ✅ |
| 5.1 예약 루프 | 095 | 1/1 | 100% ✅ |
| 5.2 탭 재편 [번들] | 096 | 1/1 | 100% ✅ |
| 5.3 내보내기 | 097 | 1/1 | 100% ✅ |
| 5.4 테스트 + 문서 | 098~099 | 2/2 | 100% ✅ |
| **합계** | **7** | **7** | **100% ✅** |

---

## Phase 6 태스크 초안

> Phase 5 완료 후 정식 tasks.md 작성. **Alpha 내부 배포 → 클로즈드 베타 10~20명** 목표.

### Phase 6.0 — D-day 위젯 (Android 우선)
- `react-native-android-widget` 설치 + 위젯 설정
- D-day 카운트다운: "D-N 여행명 ✈ 출발 HH:MM"
- 여행 카드별 위젯 개별 추가
- 탭 → 앱 딥링크

### Phase 6.1 — CI/CD
- GitHub Actions: 테스트 자동화 + EAS Build (main 머지 트리거)
- Android 에뮬레이터 기반 Maestro E2E CI 실행

### Phase 6.2 — 앱 스토어 준비
- 앱 스토어 스크린샷 5장 + 설명 + 개인정보처리방침
- Sentry 크래시 리포팅 연동

### Phase 6.3 — 여행 카드 숨기기 (TASK-091 이월)
- isHidden UI 구현 + `hiddenTripIds` encryptedStorage 저장

### Phase 6.4 — 클로즈드 베타 배포
- 10~20명 내부 배포 + 피드백 수집 채널 구성

---

## TF-MTG-002 C레벨 결정 기록

| # | 결정 | 반영 태스크 |
|---|------|-----------|
| 6 | EAS 크레딧: main 머지 시에만 빌드 | TASK-093 |
| 7 | SDK 업그레이드: Dev Build 후 별도 | TASK-093 주의사항 |
| 8 | TASK-092 딥링크: Phase 5 탭 재편에 번들 | TASK-096 |
| 9 | Alpha 배포: Phase 5 말 | TASK-099 |
| 10 | 정식 출시: Phase 7 초 (여름 시즌 전) | Phase 6 초안 |
| 11 | Expo Router 전환: Phase 7~8 검토 | Constitution 기록 예정 |
