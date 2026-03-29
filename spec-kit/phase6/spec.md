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
리텐션 핵심 기능(D-day 위젯) + 출시 인프라(CI/CD + Sentry) + 스토어 준비 + 클로즈드 베타 10~20명 배포를 목표로 한다.

**클로즈드 베타 목표**: Phase 6 말 (10~20명 내부 배포).
**정식 출시 목표**: Phase 7 초 (여름 여행 시즌 전).

---

## User Scenarios & Testing

### User Story 1 — D-day 위젯으로 여행 카운트다운 (Priority: P0)

**시나리오**: 사용자가 Android 홈 화면에 D-day 위젯을 추가하면, 다음 여행까지 남은 일수와 출발 시각이 항상 표시된다.

**Why this priority**: 앱을 열지 않아도 여행 정보를 확인할 수 있는 유일한 리텐션 트리거. DAU 유지의 핵심 장치 (TF-MTG-002 Strategist-M, TF-MTG-003 결정 #12).

**Independent Test**: 홈 화면에 TripFrame 위젯 추가 → "D-3 후쿠오카 ✈ 출발 09:30" 표시 확인.

**Acceptance Scenarios**:
1. **Given** Android 홈 화면, **When** TripFrame 위젯 추가, **Then** 다음 여행 D-day + 여행명 + 출발 시각 표시
2. **Given** 위젯 표시 중, **When** 여행 날짜가 하루 지남, **Then** D-day 카운트 자동 업데이트
3. **Given** 위젯 탭, **When** 앱 진입, **Then** 해당 여행 일정 화면으로 딥링크
4. **Given** 등록된 여행 없음, **When** 위젯 표시, **Then** "여행을 추가하세요" 안내 표시
5. **Given** 여러 여행 등록됨, **When** 위젯 표시, **Then** 날짜가 가장 가까운 미래 여행을 자동 선택

---

### User Story 2 — CI/CD로 코드 품질 안전망 (Priority: P1)

**시나리오**: 개발자가 PR을 올리면 자동으로 단위 테스트와 타입 체크가 실행되어 결과를 확인할 수 있다.

**Why this priority**: 현재 테스트 실행이 수동. CI 없이 클로즈드 베타 이후 기능 추가 시 회귀 리스크 (TF-MTG-003 결정 #13).

**Independent Test**: GitHub PR 생성 → Actions 탭에서 테스트 PASS 뱃지 확인.

**Acceptance Scenarios**:
1. **Given** PR 생성, **When** GitHub Actions 실행, **Then** Core + Mobile 단위 테스트 결과 표시
2. **Given** 단위 테스트 실패, **When** PR 체크 완료, **Then** 실패 표시 + 머지 차단
3. **Given** main 브랜치 머지, **When** CI 실행, **Then** 단위 테스트 PASS 후 EAS Build 트리거
4. **Given** TypeScript 오류 존재, **When** PR 체크, **Then** 타입 체크 실패 표시

---

### User Story 3 — 크래시 리포팅으로 베타 품질 모니터링 (Priority: P1)

**시나리오**: 클로즈드 베타 중 앱 크래시가 발생하면 개발자가 Sentry 대시보드에서 즉시 확인할 수 있다.

**Why this priority**: 10~20명 실사용자가 베타 테스트 시 예측 불가 크래시가 발생할 수 있음. 즉각 대응 없으면 베타 이탈 (TF-MTG-003 B-3).

**Independent Test**: 앱 강제 예외 발생 → Sentry 대시보드에서 스택 트레이스 확인.

**Acceptance Scenarios**:
1. **Given** 앱 실행 중 예외 발생, **When** 크래시, **Then** Sentry에 스택 트레이스 자동 전송
2. **Given** Sentry 연동 완료, **When** 앱 정상 실행, **Then** crash-free rate 100% 표시
3. **Given** DSN 설정, **When** EAS 환경변수로 주입됨, **Then** 소스코드에 DSN 하드코딩 없음

---

### User Story 4 — 앱스토어 출시 준비 (Priority: P1)

**시나리오**: 개발자가 Google Play 스토어 등록에 필요한 스크린샷, 앱 설명, 개인정보처리방침을 준비한다.

**Why this priority**: 스토어 등록 없이는 정식 배포 불가. Phase 7 정식 출시 전 준비 필수 (TF-MTG-003 결정 #14).

**Independent Test**: Google Play Console 앱 등록 화면에서 모든 필수 항목 입력 가능 확인.

**Acceptance Scenarios**:
1. **Given** 앱스토어 등록 시도, **When** 스크린샷 업로드, **Then** 5장 이상 첨부 가능
2. **Given** 개인정보처리방침 URL 필요, **When** URL 접속, **Then** 수집 항목 명시된 페이지 응답
3. **Given** 앱 설명 작성, **When** 한국어 설명 확인, **Then** TripFrame 핵심 가치(역산 + 공백감지) 전달

---

### User Story 5 — 여행 카드 숨기기 (Priority: P2)

**시나리오**: 사용자가 완료된 여행 카드를 홈 화면에서 숨겨 목록을 정리할 수 있다.

**Why this priority**: 여행 카드가 누적될수록 홈 화면 스크롤이 길어짐. 데이터 삭제 없이 정리 가능 (TASK-091 이월, Quick Win).

**Independent Test**: 여행 카드 ··· 메뉴 → "숨기기" → 홈 화면에서 해당 카드 미표시 확인.

**Acceptance Scenarios**:
1. **Given** 여행 카드 표시 중, **When** ··· 메뉴 → "숨기기", **Then** 홈 화면에서 카드 사라짐
2. **Given** 숨긴 카드 존재, **When** 앱 재시작, **Then** 숨김 상태 유지
3. **Given** 숨긴 카드 존재, **When** 설정에서 "숨긴 여행 보기", **Then** 숨긴 카드 목록 표시
4. **Given** 숨긴 카드, **When** "숨기기 해제", **Then** 홈 화면에 카드 재표시

---

### User Story 6 — 클로즈드 베타 배포 (Priority: P1)

**시나리오**: 개발팀이 10~20명의 테스터에게 EAS preview APK를 배포하고 피드백을 수집한다.

**Why this priority**: 실사용자 검증 없이 정식 출시 시 UX 문제 대응 불가 (TF-MTG-002 결정 #9, TF-MTG-003 결정 #15).

**Independent Test**: 테스터 1명이 APK 설치 → 여행 생성 → 이동 체크 → 예약 완료 흐름 완료.

**Acceptance Scenarios**:
1. **Given** EAS preview 빌드 완료, **When** APK 공유 링크 전달, **Then** 테스터 설치 성공
2. **Given** 베타 진행 중, **When** 크래시 발생, **Then** Sentry에서 1시간 내 확인 가능
3. **Given** 피드백 수집 2주 후, **When** Google Forms 결과 집계, **Then** 주요 이슈 3건 이상 식별

---

## Functional Requirements

### FR-P6-001: D-day 위젯 (Android)
- `react-native-android-widget` 설치 + EAS Build 플러그인 설정
- 위젯 데이터: 다음 여행 자동 선택 (출발일 기준 가장 가까운 미래 여행)
- 표시 항목: D-day 카운트 + 여행명 + 출발 시각 (HH:MM)
- 위젯 탭 → 앱 딥링크: 해당 여행 일정 화면
- 여행 없을 때: "여행을 추가하세요" 플레이스홀더
- app.json plugins 체크: 빌드 전 `npx expo prebuild` 검증

### FR-P6-002: GitHub Actions CI/CD
- **PR 워크플로우** (`.github/workflows/ci.yml` 신규): `pnpm --filter @tripframe/core test` + `pnpm --filter @tripframe/core typecheck` + `pnpm --filter mobile test`
- **EAS Build 워크플로우** (`.github/workflows/eas-build.yml` 확장): main 머지 시 PR 워크플로우 PASS 조건 추가
- Playwright E2E + Maestro: CI 자동 실행 제외, 수동 실행 유지

### FR-P6-003: Sentry 크래시 리포팅
- `@sentry/react-native` 설치 + EAS Build config plugin
- Sentry DSN: `app.config.ts` 환경변수 주입 (소스코드 하드코딩 금지)
- 초기화: `Sentry.init()` in App.tsx (개발 빌드 제외)
- crash-free rate 대시보드 확인

### FR-P6-004: 앱스토어 준비
- Google Play 스크린샷 5장 (Playwright MCP 웹 스크린샷 기반)
- 한국어 앱 설명 (제목 + 짧은 설명 + 자세한 설명)
- 개인정보처리방침 웹 페이지 (GitHub Pages 또는 Vercel 배포)
- `app.json` → 스토어 메타데이터 정비 (versionCode, targetSdkVersion)

### FR-P6-005: 여행 카드 숨기기
- `hiddenTripIds: string[]` — encryptedStorage persist
- `useTripStore`: `hideTrip(id)` / `unhideTrip(id)` / `hiddenTripIds` 상태
- 홈 화면: hidden 여행 카드 필터링 (기본 미표시)
- 여행 카드 ··· 메뉴: "숨기기" 옵션 추가
- 설정 화면: "숨긴 여행 관리" 섹션 추가

### FR-P6-006: 클로즈드 베타 배포 체계
- EAS `preview` 프로필 빌드 (APK 배포용)
- 테스터 배포 가이드 문서 (APK 설치 방법 + 피드백 채널 안내)
- Google Forms 설문 작성 (온보딩 완료율, 주요 기능 사용 여부, 불편 사항)
- 베타 기간: 2주

---

## Success Criteria

- D-day 위젯 Android 홈 화면 표시 + 탭 시 앱 딥링크 진입 성공
- GitHub Actions PR 체크: Core + Mobile 단위 테스트 자동 실행 + PASS 뱃지
- Sentry 크래시 리포팅 연동 + crash-free rate 모니터링 가능
- Google Play 필수 항목 준비 완료 (스크린샷 5장, 설명, 개인정보처리방침 URL)
- 여행 카드 숨기기 + 앱 재시작 후 상태 유지
- 클로즈드 베타 10~20명 APK 배포 완료 + 피드백 수집 채널 가동

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
- Google Play 정식 등록 + iOS App Store 등록
- iOS D-day 위젯 (Mac 확보 후)

---

## TF-MTG-003 C레벨 결정 반영

| 결정 | 내용 | 반영 위치 |
|------|------|---------|
| #12 | D-day 위젯: 단일 여행(다음 여행 자동 선택) | FR-P6-001 |
| #13 | CI/CD 2-트랙: PR 테스트 / main EAS Build | FR-P6-002 |
| #14 | 개인정보처리방침: GitHub Pages. 법무는 Phase 7 전 | FR-P6-004 |
| #15 | 클로즈드 베타: EAS preview APK. 10~20명. Google Forms | FR-P6-006 |

---

*spec.md v1.0 | Phase 6 기능 명세 | 2026-03-30*
