# Feature Specification: TripFrame Phase 6

**Feature**: `006-tripframe-phase6`
**Branch**: `006-tripframe-phase6`
**Status**: Planning
**Created**: 2026-03-30
**참조**: TF-MTG-003 (전문가 합동 회의록 3차), Phase 5 완료보고서

---

## 개요

Phase 6는 TripFrame의 **클로즈드 베타 배포 준비** 단계다.
Phase 5에서 완성된 Alpha 상태(EAS Dev Build + 보안 + 탭 재편 + iCal Export)를 기반으로
리텐션 핵심 기능(D-day 위젯) + 출시 인프라(CI/CD + Sentry) + 베타 배포 체계를 구축한다.

**개발 환경 제약**: Windows 11 + Android Studio 주력, iOS 기기 없음, Android 실기기 보유.
**클로즈드 베타 목표**: Phase 6 말 (10~20명 내부 배포).
**정식 출시 목표**: Phase 7 초 (여름 여행 시즌 전).

---

## User Scenarios & Testing

### User Story 1 — D-day 위젯으로 여행 카운트다운 (Priority: P0)

**시나리오**: 사용자가 Android 홈 화면에 D-day 위젯을 추가하면, 다음 여행까지 남은 일수와 출발 시각이 항상 표시된다.

**Why this priority**: 앱을 열지 않아도 여행 정보를 확인할 수 있는 유일한 리텐션 트리거. DAU 유지의 핵심 장치 (TF-MTG-001 Strategist-M "리텐션 핵심 장치", TF-MTG-003 결정 #16).

**Independent Test**: 홈 화면에 TripFrame 위젯 추가 → "D-3 후쿠오카 ✈ 출발 09:30" 표시 확인.

**Acceptance Scenarios**:
1. **Given** Android 홈 화면, **When** TripFrame 위젯 추가, **Then** 다음 여행 D-day + 여행명 + 출발 시각 표시
2. **Given** 위젯 표시 중, **When** 여행 날짜가 하루 지남, **Then** D-day 카운트 자동 업데이트
3. **Given** 위젯 탭, **When** 앱 진입, **Then** 해당 여행 일정 화면으로 딥링크
4. **Given** 등록된 여행 없음, **When** 위젯 표시, **Then** "여행을 추가하세요" 안내 표시
5. **Given** 여러 여행 등록됨, **When** 위젯 표시, **Then** 날짜가 가장 가까운 미래 여행을 자동 선택

**D-day 위젯 실패 대안** (TF-MTG-003 결정 #16):
- 위젯 POC에 **2일 타임박스** 적용
- 2일 내 동작하지 않으면: ① 홈 화면 D-day 배너 카드(앱 내 UI) Quick Win 구현 ② 위젯은 Phase 7 이월

---

### User Story 2 — SDK 호환성 보장 (Priority: P0, 인프라)

**시나리오**: D-day 위젯 라이브러리가 현재 Expo SDK와 호환되는지 확인하고, 비호환 시 SDK 업그레이드를 단독 실행한다.

**Why this priority**: `react-native-android-widget`이 현재 SDK를 요구하지 않을 수 있음. 비호환 시 위젯 구현 블로킹. SDK 업그레이드는 다른 기능과 동시 진행 금지 (TF-MTG-002 결정 #7, TF-MTG-003 결정 #12).

**Independent Test**: `react-native-android-widget` 설치 + `npx expo prebuild` 성공 확인.

**Acceptance Scenarios**:
1. **Given** 현재 SDK 버전, **When** 위젯 라이브러리 설치, **Then** 호환성 체크 PASS → 그대로 진행
2. **Given** SDK 비호환 감지, **When** 업그레이드 결정, **Then** SDK 단독 업그레이드 (다른 기능 동시 금지)
3. **Given** SDK 업그레이드 완료, **When** 기존 테스트 실행, **Then** Core 76/76 + Mobile 8/8 PASS 유지

---

### User Story 3 — CI/CD로 코드 품질 안전망 (Priority: P1)

**시나리오**: 개발자가 PR을 올리면 자동으로 단위 테스트와 타입 체크가 실행되어 결과를 확인할 수 있다.

**Why this priority**: 현재 테스트 실행이 수동. CI 없이 클로즈드 베타 이후 기능 추가 시 회귀 리스크 (TF-MTG-003 Architect-S).

**Independent Test**: GitHub PR 생성 → Actions 탭에서 테스트 PASS 뱃지 확인.

**Acceptance Scenarios**:
1. **Given** PR 생성, **When** GitHub Actions 실행, **Then** Core + Mobile 단위 테스트 + 타입 체크 결과 표시
2. **Given** 단위 테스트 실패, **When** PR 체크 완료, **Then** 실패 표시 + 머지 차단
3. **Given** main 브랜치 머지, **When** CI 실행, **Then** EAS Build 트리거 (기존 eas-build.yml)
4. **Given** Playwright E2E / Maestro, **When** CI 실행, **Then** CI 자동 실행 제외 (수동 유지)

---

### User Story 4 — 크래시 리포팅으로 베타 품질 모니터링 (Priority: P1)

**시나리오**: 클로즈드 베타 중 앱 크래시가 발생하면 개발자가 Sentry 대시보드에서 즉시 확인할 수 있다.

**Why this priority**: 10~20명 실사용자가 베타 테스트 시 예측 불가 크래시 발생 가능. 즉각 대응 없으면 베타 이탈 (TF-MTG-003 결정 #14).

**Independent Test**: 앱 강제 예외 발생 → Sentry 대시보드에서 스택 트레이스 확인.

**Acceptance Scenarios**:
1. **Given** 앱 실행 중 예외 발생, **When** 크래시, **Then** Sentry에 스택 트레이스 자동 전송
2. **Given** Sentry 연동 완료, **When** 앱 정상 실행, **Then** crash-free rate 100% 표시
3. **Given** DSN 설정, **When** EAS 환경변수로 주입됨, **Then** 소스코드에 DSN 하드코딩 없음
4. **Given** development 프로필, **When** 앱 실행, **Then** Sentry 비활성화 (개발 이벤트 방지)

---

### User Story 5 — 여행 카드 숨기기 (Priority: P2)

**시나리오**: 사용자가 완료된 여행 카드를 홈 화면에서 숨겨 목록을 정리할 수 있다.

**Why this priority**: 여행 카드가 누적될수록 홈 화면 스크롤이 길어짐. 데이터 삭제 없이 정리 가능 (TASK-091 이월, Quick Win, TF-MTG-003 전원 동의).

**Independent Test**: 여행 카드 ··· 메뉴 → "숨기기" → 홈 화면에서 해당 카드 미표시 확인.

**Acceptance Scenarios**:
1. **Given** 여행 카드 표시 중, **When** ··· 메뉴 → "숨기기", **Then** 홈 화면에서 카드 사라짐
2. **Given** 숨긴 카드 존재, **When** 앱 재시작, **Then** 숨김 상태 유지
3. **Given** 숨긴 카드 존재, **When** 설정에서 "숨긴 여행 보기", **Then** 숨긴 카드 목록 표시
4. **Given** 숨긴 카드, **When** "숨기기 해제", **Then** 홈 화면에 카드 재표시

---

### User Story 6 — 클로즈드 베타 배포 (Priority: P1)

**시나리오**: 개발팀이 10~20명의 테스터에게 EAS preview APK를 배포하고 구조화된 피드백을 수집한다.

**Why this priority**: 실사용자 검증 없이 정식 출시 시 UX 문제 대응 불가 (TF-MTG-002 결정 #9, TF-MTG-003 결정 #13).

**Independent Test**: 테스터 1명이 APK 설치 → 여행 생성 → 이동 체크 → 예약 완료 흐름 완료.

**Acceptance Scenarios**:
1. **Given** EAS preview 빌드 완료, **When** APK 공유 링크 전달, **Then** 테스터 설치 성공
2. **Given** 베타 진행 중, **When** 크래시 발생, **Then** Sentry에서 1시간 내 확인 가능
3. **Given** 피드백 수집 2주 후, **When** Google Forms 결과 집계, **Then** 주요 이슈 3건 이상 식별
4. **Given** 피드백 설문, **When** 항목 확인, **Then** 5점 척도 + 태스크 완료율 + 자유 의견 포함

---

## Functional Requirements

### FR-P6-001: SDK 호환성 체크 + 조건부 업그레이드
- `react-native-android-widget` 설치 시 SDK 호환성 체크
- 비호환 시 SDK 업그레이드 단독 실행 (다른 기능과 동시 진행 금지 — TF-MTG-002 결정 #7)
- 업그레이드 후 기존 단위 테스트 전체 PASS 확인
- 호환 시 그대로 진행 (불필요한 업그레이드 금지)
- 버퍼: SDK 업그레이드 발생 시 +1일

### FR-P6-002: D-day 위젯 (Android)
- `react-native-android-widget` 설치 + EAS Build 플러그인 설정
- **2일 타임박스**: POC 성공 시 위젯 완성, 실패 시 홈 D-day 배너 카드 대안 (결정 #16)
- 위젯 데이터: 다음 여행 자동 선택 (출발일 기준 가장 가까운 미래 여행)
- 표시 항목: D-day 카운트 + 여행명 + 출발 시각 (HH:MM)
- 위젯 탭 → 앱 딥링크: 해당 여행 일정 화면
- 여행 없을 때: "여행을 추가하세요" 플레이스홀더
- 위젯 ↔ 앱 데이터: SharedPreferences 브릿지 (별도 프로세스 제약)
- app.json plugins 체크: 빌드 전 `npx expo prebuild` 검증

### FR-P6-003: GitHub Actions CI/CD
- **PR 워크플로우** (`.github/workflows/ci.yml` 신규): `pnpm --filter @tripframe/core test` + `typecheck` + `pnpm --filter mobile test`
- **EAS Build 워크플로우** (`.github/workflows/eas-build.yml`): 기존 main 머지 트리거 유지
- Playwright E2E + Maestro: CI 자동 실행 제외, 수동 유지 (TF-MTG-003 합의: Maestro CI는 베타 후 재평가)

### FR-P6-004: Sentry 크래시 리포팅
- `@sentry/react-native` 설치 + EAS Build config plugin
- Sentry DSN: `app.config.ts` 환경변수 주입 (소스코드 하드코딩 금지)
- 초기화: `Sentry.init()` in App.tsx (development 빌드 제외)
- **크래시 리포팅만** (성능 모니터링은 Phase 7 — TF-MTG-003 결정 #14)
- 무료 티어 5K 이벤트/월 확인

### FR-P6-005: 여행 카드 숨기기
- `hiddenTripIds: string[]` — encryptedStorage persist (기존 패턴)
- `useTripStore`: `hideTrip(id)` / `unhideTrip(id)` / `hiddenTripIds` 상태
- 홈 화면: hidden 여행 카드 필터링 (기본 미표시)
- 여행 카드 ··· 메뉴: "숨기기" 옵션 추가
- 설정 화면: "숨긴 여행 관리" 섹션 추가

### FR-P6-006: 개인정보처리방침 + Google Play Internal Testing
- **개인정보처리방침 정적 페이지**: GitHub Pages 배포 (결정 #15)
- 개인정보보호법 제30조 충족 (수집 항목, 이용 목적, 보유 기간, 처리 위탁 등)
- 수집 항목: 이메일(Supabase Auth), 여행 데이터(로컬 암호화, 서버 미전송)
- **Google Play Internal Testing 트랙 사전 설정** (결정 #13)
- `app.json` 메타데이터 점검: `versionCode`, permissions 최소화

### FR-P6-007: 클로즈드 베타 배포 체계
- EAS `preview` 프로필 빌드 (APK 배포용)
- 테스터 배포 가이드 문서 (APK 설치 방법 + 피드백 채널 안내)
- **구조화된 피드백 설문** (TF-MTG-003 Product-U 요구):
  - 5점 척도 (앱 전체 만족도, 재사용 의향)
  - 핵심 태스크 완료율 (온보딩, 일정 생성, 이동 체크, 역산, iCal Export)
  - 자유 의견 (불편 사항, 개선 요청)
  - 알려진 미완성 기능 목록 포함 (테스터 혼란 방지)
- 베타 기간: 2주

---

## Success Criteria

- SDK 호환성 확인 + 필요 시 업그레이드 완료 (기존 테스트 PASS 유지)
- D-day 위젯 Android 홈 화면 표시 + 탭 시 앱 딥링크 (또는 대안: 홈 D-day 배너)
- GitHub Actions PR 체크: Core + Mobile 단위 테스트 + 타입 체크 PASS 뱃지
- Sentry 크래시 리포팅 연동 + crash-free rate 모니터링 가능
- 여행 카드 숨기기 + 앱 재시작 후 상태 유지
- 개인정보처리방침 URL 접속 가능 + Google Play Internal Testing 트랙 설정 완료
- 클로즈드 베타 10~20명 APK 배포 완료 + 구조화된 피드백 수집 채널 가동

---

## 개발 환경 제약

- **주력**: Windows 11 + Android Studio + Android 실기기
- **iOS**: EAS Cloud Build만, 실기기 테스트 불가 — 위젯은 Android 전용
- **"Android 우선"**: 위젯·네이티브 확장에만 적용. 앱 본체 iOS/Android 동시 배포
- **CI**: GitHub Actions 무료 티어 2000분/월 관리

---

## Phase 7 예고 (Out of Scope)

- Affiliate 교통 예약 링크 활성화 (bookingUrl + affiliate 파라미터)
- 교통 DB Supabase 전환 (정적 JSON → Supabase 테이블)
- 베타 피드백 기반 UX 개선
- 도시 템플릿 3도시 (서울·도쿄·방콕)
- Google Play 정식 등록 (Internal Testing → Closed → Production)
- iOS App Store 등록 (Mac 확보 후)
- iOS D-day 위젯 (Mac 확보 후, Phase 8+)
- 앱 스토어 스크린샷 5장 + 앱 설명 작성
- Sentry 성능 모니터링

---

## TF-MTG-003 C레벨 결정 반영

| 결정 | 내용 | 반영 위치 |
|------|------|---------|
| #12 | SDK 호환성 체크 → 비호환 시 단독 업그레이드 | FR-P6-001 |
| #13 | EAS Internal Distribution + Google Play Internal Testing 트랙 | FR-P6-006 |
| #14 | Sentry 기본 연동 (크래시만). 성능 모니터링 Phase 7 | FR-P6-004 |
| #15 | 개인정보처리방침 GitHub Pages. 개인정보보호법 제30조 | FR-P6-006 |
| #16 | D-day 위젯 2일 타임박스. 실패 시 홈 D-day 배너 + 위젯 Phase 7 이월 | FR-P6-002 |

---

## 보완 체크리스트 (TF-MTG-003)

- [ ] SDK 업그레이드: 위젯 라이브러리 호환성 체크 후 조건부 (동시 금지)
- [ ] D-day 위젯 POC: 2일 타임박스 적용
- [ ] 위젯 실패 시: 홈 D-day 배너 카드 대안 구현
- [ ] 위젯 ↔ encryptedStorage 데이터 브릿지 설계 (SharedPreferences)
- [ ] Sentry: 크래시 리포팅만 (성능 모니터링 Phase 7)
- [ ] 개인정보처리방침: Google Play Internal Testing에도 필수
- [ ] 피드백 설문: 5점 척도 + 태스크 완료율 + 자유 의견 + 미완성 기능 목록
- [ ] 스크린샷 + 앱 설명: Phase 7 이월 (Phase 6에서 소재 화면 UX 확정만)
- [ ] CI/CD: Playwright CI만. Maestro CI는 베타 후 재평가

---

*spec.md v1.0 | Phase 6 기능 명세 | 2026-03-30 | TF-MTG-003 기반*
