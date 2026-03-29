# Feature Specification: TripFrame Phase 5

**Feature**: `005-tripframe-phase5`
**Branch**: `005-tripframe-phase5`
**Status**: Planning
**Created**: 2026-03-29
**참조**: TF-MTG-002 (전문가 합동 회의록 2차), Phase 4 완료보고서

---

## 개요

Phase 5는 TripFrame의 **Alpha 내부 배포 준비** 단계다.
Phase 4에서 완성된 핵심 기능(설정 연동, 암호화, 온보딩, 교통 DB)을 기반으로
보안 완성 + 탭 구조 재편 + 예약 루프 + iCal Export를 구현한다.

**개발 환경 제약**: Windows 11 + Android Studio 주력, iOS 기기 없음, Android 실기기 보유.
**Alpha 배포 목표**: Phase 5 말 (내부 테스트용).
**정식 출시 목표**: Phase 7 초 (여름 여행 시즌 전).

---

## User Scenarios & Testing

### User Story 1 — 안전한 데이터 보관 (Priority: P0)

**시나리오**: 사용자가 여행 데이터를 저장하면, 마스터 키가 기기 하드웨어 보안 모듈에 보관된다.

**Why this priority**: Phase 4의 kv-store 평문 키 저장은 키 탈취 시 전체 데이터 노출. 앱 스토어 출시 전 반드시 해결해야 할 보안 취약점.

**Independent Test**: 설치 후 여행 데이터 저장 → 앱 재시작 → 데이터 정상 복원 확인.

**Acceptance Scenarios**:
1. **Given** Dev Build 설치됨, **When** 앱 최초 실행, **Then** 마스터 키가 expo-secure-store에 생성·저장됨
2. **Given** 기존 kv-store 키 존재, **When** 앱 업데이트 후 첫 실행, **Then** 마이그레이션 완료 + kv-store 구 키 삭제
3. **Given** SecureStore 저장 실패(edge case), **When** 마이그레이션 시도, **Then** kv-store 키 유지(데이터 보전) + 다음 실행 시 재시도
4. **Given** 기존 암호화 데이터, **When** 키 저장소 교체 후 복호화 시도, **Then** 데이터 정상 복호화(암호화 로직 미변경)

---

### User Story 2 — 이동 수단 예약 완료 표시 (Priority: P1)

**시나리오**: 사용자가 공백 구간의 교통편을 예약한 뒤, 해당 공백을 "해결됨"으로 표시할 수 있다.

**Why this priority**: 현재는 예약 후에도 DANGER 카드가 그대로 남아 있어 "이미 해결한 것"과 "아직 미해결"을 구분할 수 없다. 이것이 제품의 핵심 가치(공백 해결 루프)를 완성한다.

**Independent Test**: DANGER 카드의 "예약 완료" 버튼 탭 → 카드 색상이 초록으로 변경됨.

**Acceptance Scenarios**:
1. **Given** DANGER 공백 카드 표시 중, **When** "예약 완료" 버튼 탭, **Then** 카드 상태 RESOLVED + 초록 체크 표시
2. **Given** RESOLVED 상태로 저장됨, **When** 앱 재시작, **Then** 해당 공백 RESOLVED 상태 복원
3. **Given** RESOLVED 공백 존재, **When** 이벤트 시간이 변경됨, **Then** 새 gapKey로 재계산 → RESOLVED 해제 후 DANGER 재표시
4. **Given** 공백 목록 화면, **When** RESOLVED 카드 존재, **Then** DANGER 카드 상단, RESOLVED 카드 하단 정렬

---

### User Story 3 — "이동 체크" 통합 탭 (Priority: P1)

**시나리오**: 사용자가 공백 확인과 교통 제안을 하나의 탭에서 처리한다. 기존 5탭 → 4탭으로 단순화.

**Why this priority**: 현재 "공백감지"와 "제안카드"가 분리되어 있어 사용자가 두 탭을 오가야 한다. 탭 통합으로 인지 부하 감소.

**Independent Test**: "이동 체크" 탭 진입 → Gap 카드 목록 + 선택 시 교통 옵션 인라인 표시.

**Acceptance Scenarios**:
1. **Given** 이동 체크 탭 진입, **When** DANGER 카드 탭, **Then** 해당 Gap의 교통 옵션 인라인 펼침
2. **Given** 교통 옵션 펼침 상태, **When** "예약 완료" 버튼 탭, **Then** RESOLVED 상태로 변경 + 옵션 접힘
3. **Given** 4탭 구조(일정/이동 체크/역산/설정), **When** 탭 전환, **Then** 기존 E2E 97개 중 탭 관련 테스트 모두 통과
4. **Given** 딥링크 파라미터로 특정 Gap ID 전달, **When** 이동 체크 탭 열림, **Then** 해당 Gap 카드 자동 펼침

---

### User Story 4 — iCal 내보내기 (Priority: P2)

**시나리오**: 사용자가 여행 일정을 .ics 파일로 내보내 Google Calendar 등 외부 캘린더에 추가한다.

**Why this priority**: 일정 공유의 가장 간단한 형태. 앱 설치 없이 일정 공유 가능. TF-MTG-001/002 C레벨 결정.

**Independent Test**: 여행 상세 → 내보내기 → .ics 파일 공유 시트 열림 → Google Calendar 추가 확인.

**Acceptance Scenarios**:
1. **Given** 여행 상세 화면, **When** 내보내기 탭, **Then** .ics 파일 생성 + 공유 시트 열림
2. **Given** 내보낸 .ics 파일, **When** Google Calendar에서 열기, **Then** TripEvent 각 항목이 VEVENT로 임포트됨
3. **Given** Gap 상태(DANGER/RESOLVED) 존재, **When** 내보내기, **Then** X-TRIPFRAME-GAP-STATUS 커스텀 프로퍼티 포함
4. **Given** 공유 시트 닫힌 후, **When** 화면 확인, **Then** "Google Calendar에 추가하는 방법" 안내 화면 표시

---

### User Story 5 — EAS Dev Build 전환 (Priority: P0, 인프라)

**시나리오**: 개발팀이 Expo Go 대신 EAS Development Build를 사용하여 네이티브 기능을 개발·테스트한다.

**Why this priority**: expo-secure-store, D-day 위젯(Phase 6), Maestro E2E 등 모든 네이티브 기능의 전제 조건.

**Independent Test**: Android 실기기에서 Dev Build 설치 → 앱 정상 실행 → 기존 기능 전부 동작.

**Acceptance Scenarios**:
1. **Given** EAS 프로젝트 설정 완료, **When** `eas build --profile development`, **Then** Android Dev Build APK 생성
2. **Given** Dev Build 설치됨, **When** 앱 실행, **Then** 기존 97개 E2E(Playwright Web) 모두 통과
3. **Given** main 브랜치 머지, **When** CI 트리거, **Then** EAS Build 자동 실행 (PR 머지 시에만)
4. **Given** SDK 업그레이드 미진행 상태, **When** Dev Build 전환, **Then** SDK 버전 그대로 유지 (동시 업그레이드 금지)

---

## Functional Requirements

### FR-P5-001: EAS Dev Build 환경 구성
- EAS CLI 설치 + `eas.json` 프로필 설정 (development/preview/production)
- Android `eas build --profile development` 로컬 및 클라우드 빌드
- EAS Build 트리거: main 머지 시에만 (PR마다 트리거 금지 — 크레딧 관리)
- iOS는 EAS Cloud Build만 (로컬 빌드 불가, 실기기 테스트 생략)

### FR-P5-002: expo-secure-store 마스터 키 업그레이드
- `encryptedStorage.ts`의 `getMasterKey()`: kv-store → SecureStore.getItemAsync 교체
- 마이그레이션: kv-store 키 존재 시 → SecureStore 이전 성공 확인 → kv-store 삭제
- 폴백: SecureStore 저장 실패 → kv-store 키 유지 + 에러 로깅 (데이터 손실 방지)
- 마이그레이션 중 로딩 인디케이터 표시
- 기존 암호화/복호화 단위 테스트 5개 그대로 통과 (로직 변경 없음 검증)

### FR-P5-003: Gap RESOLVED 상태 관리
- `resolvedGapIds` 외부 저장소: `{ [tripId: string]: { [gapKey: string]: { resolvedAt: string, method: string } } }`
- gapKey 형식: `${fromLocation}-${toLocation}-${dayIndex}` (이벤트 시간 독립적으로 안정성 확보)
- UI: Gap 카드에 "예약 완료" 버튼 상시 노출 (AppState 자동 팝업 금지)
- RESOLVED 카드: 초록 테두리 + 체크 아이콘, 목록 하단 배치
- encryptedStorage 저장 + 앱 재시작 후 복원
- gapKey 안정성 단위 테스트 포함

### FR-P5-004: 4탭 구조 재편 ("이동 체크")
- 탭 구조: 일정 / **이동 체크** / 역산 / 설정 (5탭 → 4탭)
- "이동 체크" = 기존 공백감지(GapAnalysisScreen) + 제안카드(SuggestionScreen) 통합
- Gap 카드 탭 → 교통 옵션 인라인 펼침 (별도 탭 이동 불필요)
- `useGapStore.ts` 신규 생성 (통합 상태 관리)
- E2E 수정: gap.spec.ts + suggestion.spec.ts → moveCheck.spec.ts 로 통합 재작성
- 탭 재편 + E2E 수정 + TASK-092 딥링크를 단일 태스크 그룹으로 번들링

### FR-P5-005: 탭 간 딥링크 (TASK-092 이월분)
- 이동 체크 탭으로 특정 Gap ID 전달 → 해당 카드 자동 펼침
- 역산 탭 결과 → 일정 탭 해당 Day 스크롤
- `navigateTo(tab, params)` 헬퍼 함수 추가

### FR-P5-006: iCal Export
- `packages/core/logic/exportIcal.ts` — `generateIcal(trip: Trip): string` 순수 함수
- RFC 5545 포맷: VCALENDAR + VTIMEZONE + VEVENT
- TripEvent → VEVENT (DTSTART, DTEND, SUMMARY, DESCRIPTION)
- X-TRIPFRAME-GAP-STATUS, X-TRIPFRAME-RESOLVED-AT 커스텀 프로퍼티 포함
- `expo-sharing` + `expo-file-system`으로 .ics 파일 저장 + 공유 시트
- Export 후 "Google Calendar에 추가하는 방법" 안내 화면
- 단위 테스트: generateIcal 출력 포맷 검증

### FR-P5-007: Maestro E2E 기초 구축
- SecureStore 마이그레이션 1개 시나리오
- 예약 완료 버튼 탭 → RESOLVED 상태 저장 1개 시나리오
- (AppState 기반 네이티브 동작 포함)
- 기존 Playwright 97개는 그대로 유지 (대체 아님)

---

## Success Criteria

- EAS Dev Build Android APK 생성 + 실기기 설치 성공
- 기존 Playwright E2E 97/97 PASS (Dev Build 전환 후에도)
- 마스터 키가 SecureStore에 저장됨 확인 (기존 5개 암호화 테스트 통과)
- RESOLVED Gap 카드가 앱 재시작 후에도 초록 상태 유지
- 이동 체크 탭에서 Gap 확인 → 교통 옵션 확인 → 예약 완료 표시 단일 흐름 완료
- .ics 파일 생성 + Google Calendar 임포트 성공
- Phase 5 완료 시 Alpha 내부 배포 준비 완료

---

## 보완 체크리스트 (TF-MTG-002)

- [ ] EAS 크레딧 관리: main 머지 시에만 빌드 트리거
- [ ] SDK 업그레이드: Dev Build 전환 후 별도 진행 (동시 금지)
- [ ] SecureStore 실패 폴백: kv-store 키 유지
- [ ] gapKey 안정성 단위 테스트
- [ ] 예약 완료 UI: AppState 자동 팝업 대신 상시 버튼
- [ ] 탭 재편 + E2E + 딥링크 단일 번들 태스크
- [ ] iCal X-TRIPFRAME-* 커스텀 프로퍼티
- [ ] Export 후 사용자 안내 화면

---

## 개발 환경 제약

- **주력**: Windows 11 + Android Studio + Android 실기기
- **iOS**: EAS Cloud Build로 빌드만 가능, 실기기 테스트 불가
- **"Android 우선"**: 위젯·네이티브 확장에만 적용. 앱 본체는 iOS/Android 동시 배포
- **테스트**: Playwright 95% (웹 E2E) + Maestro 5% (네이티브 전용 3~4 시나리오)

---

## Phase 6 예고 (Out of Scope)

- D-day 위젯 (Android App Widget — Phase 6 핵심)
- CI/CD GitHub Actions
- 앱 스토어 메타데이터 + 개인정보처리방침
- Sentry 크래시 리포팅
- 클로즈드 베타 10~20명 배포

---

*spec version 1.0 | 2026-03-29 | TF-MTG-002 기반*
