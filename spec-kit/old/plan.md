# Implementation Plan: TripFrame Phase 6

**Feature**: `006-tripframe-phase6`
**Plan version**: 1.0
**Created**: 2026-03-30
**참조**: spec.md v1.0, TF-MTG-003, TF-MTG-002

---

## 아키텍처 결정

### AD-P6-001: D-day 위젯 데이터 접근
- **결정**: `react-native-android-widget`의 위젯 Provider에서 `encryptedStorage` 직접 접근 불가 (별도 프로세스). 위젯 전용 SharedPreferences 또는 파일 기반 캐시 사용.
- **근거**: Android 위젯은 앱과 별도 프로세스. 앱이 위젯 데이터를 SharedPreferences에 기록 → 위젯이 읽는 단방향 흐름.
- **구현**: useTripStore 변경 시 `AppWidgetManager.updateAppWidget()` 호출로 위젯 갱신.

### AD-P6-002: CI 워크플로우 분리
- **결정**: `eas-build.yml` 확장 대신 `ci.yml` 신규 분리. 관심사 분리 원칙.
- **ci.yml**: PR 트리거 — 단위 테스트 + 타입 체크만 (빠른 피드백, 2~3분 이내)
- **eas-build.yml**: main 머지 트리거 — ci.yml 의존성 없이 독립 실행 (기존 패턴 유지)
- **근거**: 두 워크플로우의 실행 조건·목적이 다름. 하나의 파일이 너무 복잡해지는 것 방지.

### AD-P6-003: Sentry 환경 분리
- **결정**: development 프로필(Dev Build)에서는 Sentry 비활성화. preview/production에서만 활성화.
- **근거**: 개발 중 불필요한 Sentry 이벤트 발생 방지. 베타 사용자 데이터만 수집.
- **구현**: `app.config.ts`에서 `process.env.APP_ENV` 분기.

### AD-P6-004: 여행 카드 숨기기 저장소
- **결정**: `hiddenTripIds: string[]` — encryptedStorage (기존 패턴 동일). 별도 스토어 생성 불필요.
- **근거**: 단순 ID 배열이므로 `useTripStore`에 추가 가능. Constitution 원칙 — "세 번 재사용 전까지 추상화 금지".

### AD-P6-005: 개인정보처리방침 호스팅
- **결정**: GitHub Pages (별도 레포 또는 `docs/` 브랜치) 사용.
- **근거**: Vercel 계정 없이도 즉시 배포 가능. 마크다운 → HTML 변환 자동화.
- **URL 패턴**: `https://[github-username].github.io/tripframe-privacy`

---

## 구현 순서 (의존성 그래프)

```
Phase 6.0 D-day 위젯 (독립, 가장 복잡 — 최우선)
  └─ TASK-100: react-native-android-widget 설치 + 위젯 기본 설정
  └─ TASK-101: 위젯 UI + 데이터 연동 + 딥링크

Phase 6.1 CI/CD (독립, TASK-100 병렬 가능)
  └─ TASK-102: GitHub Actions ci.yml 신규 + eas-build.yml 확장

Phase 6.2 앱스토어 준비 (독립, TASK-100 병렬 가능)
  └─ TASK-103: Sentry 연동
  └─ TASK-104: 스크린샷 + 앱 설명 + 개인정보처리방침

Phase 6.3 여행 카드 숨기기 (독립 Quick Win)
  └─ TASK-105: isHidden UI + encryptedStorage 저장

Phase 6.4 클로즈드 베타 준비 (모든 태스크 완료 후)
  └─ TASK-106: EAS preview 빌드 + 베타 배포 가이드 + 완료보고서
```

---

## 태스크별 기술 계획

### TASK-100: react-native-android-widget 설치 + 기본 설정 · 3h [P0]

**목표**: Android 위젯 인프라 구축. EAS Build 성공 확인.

**구현 단계**:
1. `react-native-android-widget` 패키지 설치 (pnpm workspace)
2. `app.json` plugins 배열에 위젯 설정 추가
3. `npx expo prebuild` 실행 → `android/` 폴더 수동 점검 (Phase 5 빌드 실패 학습)
4. 위젯 Provider 클래스 (`TripWidgetProvider.tsx`) 기본 구조 생성
5. EAS Build development 프로필로 빌드 테스트
6. Android Studio 에뮬레이터에서 위젯 추가 가능 여부 확인

**리스크 대응**:
- Gradle 충돌 → `android/build.gradle` 의존성 수동 점검
- EAS 플러그인 호환성 → expo-dev-client와 버전 매핑 확인
- SDK 업그레이드 요청 → 거부. 현재 SDK 유지.

**완료 기준**: 에뮬레이터 홈 화면에서 TripFrame 위젯 항목이 위젯 선택 목록에 표시됨.

---

### TASK-101: 위젯 UI + 데이터 연동 + 딥링크 · 4h [P0] · (100)

**목표**: D-day 카운트다운 위젯 완성. 앱 데이터와 연동. 탭 시 딥링크.

**구현 단계**:
1. `TripWidgetProvider.tsx`: 다음 여행 자동 선택 로직 (출발일 기준 가장 가까운 미래 여행)
2. 위젯 레이아웃: D-day 숫자 (크게) + 여행명 + 출발 시각
3. 데이터 갱신 전략: `useTripStore` 변경 시 SharedPreferences 업데이트 → 위젯 갱신
4. 여행 없을 때 플레이스홀더: "여행을 추가하세요"
5. 위젯 탭 딥링크: `tripframe://trip/{tripId}` → 해당 여행 일정 화면
6. Maestro 시나리오: 위젯 탭 → 앱 진입 딥링크 동작 확인

**UI 스타일**:
- 배경: `#0F0F13` (다크 테마)
- D-day 숫자: `#A78BFA` (purple accent), 대형 폰트
- 여행명: white, medium 폰트
- 출발 시각: `#9CA3AF`, small 폰트

**완료 기준**: Android 실기기 홈 화면에서 D-day 위젯 정상 표시 + 탭 시 앱 딥링크 진입.

---

### TASK-102: GitHub Actions CI/CD · 2h [P1]

**목표**: PR 자동 테스트 + main 머지 시 EAS Build 트리거.

**구현 단계**:
1. `.github/workflows/ci.yml` 신규 생성:
   - 트리거: `pull_request` (branches: main)
   - steps: `pnpm install` → `pnpm --filter @tripframe/core test` → `pnpm --filter @tripframe/core typecheck` → `pnpm --filter mobile test`
   - Node.js: 20.x, pnpm: 9.x
2. `.github/workflows/eas-build.yml` 확인: 기존 main 머지 트리거 유지 (수정 불필요할 수 있음)
3. GitHub Repository Secrets 확인: `EXPO_TOKEN` 등록 여부
4. PR 테스트 실행 확인 (더미 PR 생성 후 Actions 탭 확인)

**완료 기준**: PR 생성 시 GitHub Actions ci.yml 자동 실행 + 테스트 PASS/FAIL 뱃지 표시.

---

### TASK-103: Sentry 크래시 리포팅 · 2h [P1]

**목표**: 클로즈드 베타 대비 크래시 모니터링 연동.

**구현 단계**:
1. `@sentry/react-native` 설치 + EAS Build config plugin 설정
2. `app.config.ts`에서 `process.env.SENTRY_DSN` 환경변수 주입
3. `App.tsx`에 `Sentry.init()` 추가 (development 환경 제외)
4. EAS Secrets에 `SENTRY_DSN` 등록
5. 테스트: 의도적 예외 발생 → Sentry 대시보드 확인

**보안 주의**: DSN 소스코드 하드코딩 절대 금지. `eas.json` env 섹션 사용.

**완료 기준**: preview 빌드에서 Sentry crash-free rate 대시보드 표시.

---

### TASK-104: 앱스토어 준비 · 3h [P1] · (103)

**목표**: Google Play 등록 필수 자산 준비.

**구현 단계**:
1. **스크린샷 5장**: Playwright MCP로 웹 버전 스크린샷 캡처
   - ①홈(여행 카드 목록), ②일정 탭(Day 타임라인), ③이동 체크(Gap + RESOLVED), ④역산 결과, ⑤iCal Export 모달
   - 해상도: 1080×1920 (Android Phone 권장)
2. **앱 설명 작성**:
   - 제목(30자 이내): "TripFrame - 여행 일정 역산 플래너"
   - 짧은 설명(80자 이내): 핵심 가치 한 줄 요약
   - 자세한 설명(4000자 이내): 기능 소개 + 사용법
3. **개인정보처리방침**:
   - 수집 항목: 이메일(Supabase Auth), 여행 데이터(로컬 암호화, 서버 미전송)
   - GitHub Pages 배포 (`docs/privacy-policy.md` → HTML)
4. **app.json 메타데이터 점검**: `versionCode`, `targetSdkVersion`, `permissions`

**완료 기준**: 개인정보처리방침 URL 접속 가능 + 스크린샷 5장 준비 완료.

---

### TASK-105: 여행 카드 숨기기 · 2h [P2]

**목표**: 완료된 여행 카드를 홈 화면에서 숨기는 Quick Win 기능.

**구현 단계**:
1. `useTripStore.ts`:
   - `hiddenTripIds: string[]` 상태 추가
   - `hideTrip(id: string)` / `unhideTrip(id: string)` 액션 추가
   - encryptedStorage persist (기존 패턴)
2. 홈 화면 여행 카드 목록: `hiddenTripIds` 필터링 적용
3. 여행 카드 ··· 메뉴: "숨기기" / "숨기기 해제" 토글 옵션
4. 설정 화면: "숨긴 여행 관리" 섹션 → 숨긴 여행 목록 + 개별 해제
5. 단위 테스트: hide/unhide 상태 전환 + persist 복원

**완료 기준**: 카드 숨기기 → 재시작 후 유지 + 설정에서 해제 가능.

---

### TASK-106: EAS preview 빌드 + 베타 배포 + 완료보고서 · 2h · (모든 태스크)

**목표**: 클로즈드 베타 APK 배포 + Phase 6 종료.

**구현 단계**:
1. `eas build --profile preview --platform android` 실행
2. 베타 테스터 배포 가이드 작성:
   - APK 다운로드 링크 (EAS 대시보드)
   - "알 수 없는 앱 설치 허용" 설정 방법
   - 피드백 채널 안내 (Google Forms URL + 오픈채팅방)
3. Google Forms 설문 작성:
   - 온보딩 완료 여부
   - 일정 생성 → 이동 체크 흐름 사용 여부
   - 불편 사항 (주관식)
   - 앱 재사용 의향 (1~5점)
4. `report/260330/phase6/PHASE6_완료보고서.md` 생성

**완료 기준**: 10~20명 테스터에게 APK 배포 완료 + Google Forms 수집 시작.

---

## Phase 6 리스크 매트릭스

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| react-native-android-widget Gradle 충돌 | 위젯 빌드 실패 1~2일 | 높음 | `npx expo prebuild` 먼저 실행, android/ 점검 |
| Sentry 초기화 성능 저하 | 앱 시작 속도 저하 | 낮음 | `Sentry.init()` async 초기화, Development 빌드 제외 |
| GitHub Actions 무료 분 초과 | CI 중단 | 낮음 | 단위 테스트만 CI 포함. E2E 수동 유지 |
| EAS preview 빌드 실패 | 베타 배포 지연 | 중간 | development 빌드 성공 후 preview 빌드 시도 |
| 베타 테스터 설치 실패 | "알 수 없는 앱" 설정 모름 | 중간 | 배포 가이드에 단계별 스크린샷 포함 |

---

*plan.md v1.0 | Phase 6 기술 구현 계획 | 2026-03-30*
