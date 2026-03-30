# Implementation Plan: TripFrame Phase 6

**Feature**: `006-tripframe-phase6`
**Plan version**: 1.0
**Created**: 2026-03-30
**참조**: spec.md v1.0, TF-MTG-003, TF-MTG-002

---

## 아키텍처 결정

### AD-P6-001: SDK 업그레이드 전략 (결정 #12)
- **결정**: 위젯 라이브러리 설치 시 SDK 호환성 체크 → 비호환 시 즉시 SDK 업그레이드 단독 실행.
- **근거**: TF-MTG-003 Expert 3 중재안 (3/3 동의). Expert 2 — "뒤로 밀수록 마이그레이션 비용 누적", Expert 1 — "ROI 기반 조건부 실행".
- **핵심 제약**: SDK 업그레이드는 다른 기능과 동시 진행 금지 (TF-MTG-002 결정 #7 재확인).
- **버퍼**: SDK 업그레이드 발생 시 +1일 추가.

### AD-P6-002: D-day 위젯 데이터 접근
- **결정**: `react-native-android-widget`의 위젯 Provider에서 `encryptedStorage` 직접 접근 불가 (별도 프로세스). 위젯 전용 SharedPreferences 기반 캐시 사용.
- **근거**: Android 위젯은 앱과 별도 프로세스. 앱이 위젯 데이터를 SharedPreferences에 기록 → 위젯이 읽는 단방향 흐름.
- **구현**: useTripStore 변경 시 SharedPreferences 업데이트 → `AppWidgetManager.updateAppWidget()` 호출.

### AD-P6-003: D-day 위젯 타임박스 + 실패 대안 (결정 #16)
- **결정**: 위젯 POC에 2일 타임박스. 실패 시 홈 화면 D-day 배너 카드(앱 내 UI) Quick Win 구현 + 위젯 Phase 7 이월.
- **근거**: TF-MTG-003 만장일치 (3/3). Architect-S — Expo Notification 대안, Product-U — 앱 내 배너 대안, Strategist-M — 정식 출시에 위젯 맞추기.
- **TASK-103 분기**: POC 성공 → 위젯 완성 / POC 실패 → 홈 D-day 배너 카드.

### AD-P6-004: CI 워크플로우 분리
- **결정**: `eas-build.yml` 확장 대신 `ci.yml` 신규 분리. 관심사 분리 원칙.
- **ci.yml**: PR 트리거 — 단위 테스트 + 타입 체크만 (빠른 피드백, 2~3분 이내)
- **eas-build.yml**: main 머지 트리거 — 기존 패턴 유지
- **E2E/Maestro**: CI 자동 실행 제외. Maestro CI는 베타 후 재평가 (TF-MTG-003 합의).

### AD-P6-005: Sentry 환경 분리 (결정 #14)
- **결정**: development 프로필에서 Sentry 비활성화. preview/production에서만 활성화.
- **범위**: 크래시 리포팅만. 성능 모니터링은 Phase 7.
- **구현**: `app.config.ts`에서 `process.env.APP_ENV` 분기.

### AD-P6-006: 여행 카드 숨기기 저장소
- **결정**: `hiddenTripIds: string[]` — encryptedStorage (기존 패턴). `useTripStore`에 추가.
- **근거**: 단순 ID 배열. Constitution — "세 번 재사용 전까지 추상화 금지".

### AD-P6-007: 개인정보처리방침 호스팅 (결정 #15)
- **결정**: GitHub Pages 사용. Google Play Internal Testing에도 URL 필수 (TF-MTG-003 누락 발견 #5).
- **법적 요건**: 개인정보보호법 제30조 충족.

### AD-P6-008: 배포 방식 (결정 #13)
- **결정**: EAS Internal Distribution(APK 직접 배포) + Google Play Internal Testing 트랙 사전 설정.
- **Phase 7 이월**: Google Play 정식 등록 + 앱 스토어 메타데이터(스크린샷 + 앱 설명).

---

## 구현 순서 (의존성 그래프)

```
Phase 6.0 인프라 [P0, 순차]
  └─ TASK-100: SDK 호환성 체크 + 조건부 업그레이드 · 2~4h
  └─ TASK-101: CI/CD 기초 (GitHub Actions: Jest + Playwright) · 3h

Phase 6.1 D-day 위젯 [P0, TASK-100 완료 후]
  └─ TASK-102: D-day 위젯 POC + 데이터 브릿지 · 5h (2일 타임박스)
  └─ TASK-103: D-day 위젯 완성 OR 홈 D-day 배너 (102 결과에 따라) · 3~4h

Phase 6.2 품질 + Quick Win [TASK-101 완료 후, 병렬 가능]
  └─ TASK-104: Sentry 기본 연동 · 2h
  └─ TASK-105: 여행 카드 숨기기 (isHidden) · 2h

Phase 6.3 베타 배포 [모두 완료 후]
  └─ TASK-106: 개인정보처리방침 + Google Play Internal Testing 트랙 · 2h
  └─ TASK-107: 클로즈드 베타 배포 + 피드백 채널 + 설문 설계 · 3h
  └─ TASK-108: Phase 6 완료보고서 · 1h
```

---

## 태스크별 기술 계획

### TASK-100: SDK 호환성 체크 + 조건부 업그레이드 · 2~4h [P0]

**목표**: 위젯 라이브러리의 SDK 호환성 확인. 비호환 시 SDK 단독 업그레이드.

**구현 단계**:
1. `react-native-android-widget` npm 페이지에서 peerDependencies 확인
2. 현재 Expo SDK 버전과 호환성 매핑 체크
3. 호환 시: TASK-102로 직행 (2h로 종료)
4. 비호환 시: `npx expo install expo@latest` + 의존성 일괄 업데이트 (동시 기능 개발 금지)
5. SDK 업그레이드 후: `pnpm --filter @tripframe/core test` 76/76 + `pnpm --filter mobile test` 8/8 PASS 확인
6. `pnpm --filter mobile web` Playwright E2E 97개 재확인

**리스크 대응**:
- SDK 업그레이드 시 expo-secure-store 등 네이티브 모듈 호환성 → 하나씩 확인
- 업그레이드 실패 → Phase 5 SDK 버전으로 롤백, 위젯은 대안 플랜(홈 배너) 적용

**완료 기준**: 위젯 라이브러리 설치 가능 상태 확인 + 기존 테스트 전체 PASS.

---

### TASK-101: CI/CD 기초 (GitHub Actions) · 3h [P0]

**목표**: PR 자동 테스트. main 머지 시 EAS Build 트리거 확인.

**구현 단계**:
1. `.github/workflows/ci.yml` 신규 생성:
   - 트리거: `pull_request` (branches: main)
   - Node.js 20.x + pnpm 9.x 설정
   - `pnpm --filter @tripframe/core test` — Core 단위 테스트
   - `pnpm --filter @tripframe/core typecheck` — 타입 체크
   - `pnpm --filter mobile test` — Mobile 단위 테스트
2. `.github/workflows/eas-build.yml` 확인: 기존 main 머지 트리거 유지
3. GitHub Repository Secrets: `EXPO_TOKEN` 등록 여부 확인
4. 더미 PR로 ci.yml 실행 확인 → 테스트 PASS 뱃지 표시

**완료 기준**: PR 생성 시 ci.yml 자동 실행 + PASS/FAIL 뱃지 표시.

---

### TASK-102: D-day 위젯 POC + 데이터 브릿지 · 5h [P0] · (100) ⏱️ 2일 타임박스

**목표**: Android 위젯 POC. SharedPreferences 데이터 브릿지 검증. 2일 내 동작 여부 판단.

**구현 단계**:
1. `react-native-android-widget` 패키지 설치 (pnpm workspace)
2. `app.json` plugins 배열에 위젯 플러그인 설정 추가
3. `npx expo prebuild` 실행 → `android/` 폴더 Gradle 설정 수동 점검
4. `TripWidgetProvider.tsx` 기본 구조 생성 (빈 위젯 Provider)
5. `eas build --profile development --platform android` 빌드 성공 확인
6. 에뮬레이터 홈 화면에서 위젯 선택 목록에 TripFrame 표시 확인
7. SharedPreferences 데이터 브릿지: useTripStore → SharedPreferences 쓰기 → 위젯 읽기

**2일 타임박스 판단 기준**:
- ✅ 성공: 에뮬레이터에서 위젯이 표시되고 SharedPreferences 데이터를 읽을 수 있음 → TASK-103 위젯 완성
- ❌ 실패: Gradle 충돌 미해결 또는 데이터 브릿지 불가 → TASK-103 홈 D-day 배너 대안

**리스크 대응**:
- Gradle 충돌 → `android/build.gradle` 의존성 수동 점검, `npx expo prebuild --clean` 시도
- EAS 플러그인 호환성 → expo-dev-client 버전 매핑 확인

**완료 기준**: POC 성공/실패 판정 완료. 성공 시 위젯 기본 표시 + 데이터 읽기 확인.

---

### TASK-103: D-day 위젯 완성 OR 홈 D-day 배너 · 3~4h [P1] · (102)

**목표**: TASK-102 결과에 따라 분기 실행.

**경로 A — 위젯 POC 성공 시**:
1. 다음 여행 선택 로직: 출발일 기준 가장 가까운 미래 여행 자동 선택
2. 위젯 UI: D-day 숫자(#A78BFA, 대형) + 여행명(white) + 출발 시각(#9CA3AF, small)
3. 여행 없을 때: "여행을 추가하세요" 플레이스홀더
4. 위젯 탭 딥링크: `tripframe://trip/{tripId}` → 해당 여행 일정 화면
5. Maestro 시나리오 3: 위젯 탭 → 앱 진입 딥링크 확인

**경로 B — 위젯 POC 실패 시**:
1. `DdayBannerCard.tsx` 컴포넌트 생성 (홈 화면 상단)
2. 다음 여행 D-day 카운트 + 여행명 + 출발 시각 표시
3. 배너 탭 → 해당 여행 일정 화면 진입 (기존 navigateTo 활용)
4. Playwright E2E: 홈 화면 D-day 배너 표시 + 탭 동작 확인

**완료 기준 A**: Android 실기기 위젯 정상 표시 + 탭 딥링크.
**완료 기준 B**: 홈 화면 D-day 배너 카드 표시 + 탭 네비게이션.

---

### TASK-104: Sentry 기본 연동 · 2h [P1]

**목표**: 클로즈드 베타 대비 크래시 모니터링 연동. 크래시 리포팅만 (성능 모니터링 Phase 7).

**구현 단계**:
1. `@sentry/react-native` 설치 + EAS Build config plugin 설정
2. `app.config.ts` 생성/확장: `SENTRY_DSN` 환경변수 주입 (하드코딩 절대 금지)
3. `App.tsx`에 `Sentry.init()` 추가 (development 환경 제외 — AD-P6-005)
4. EAS Secrets에 `SENTRY_DSN` 등록
5. preview 빌드에서 의도적 예외 발생 → Sentry 대시보드 확인

**보안 주의**: DSN 소스코드 하드코딩 금지. `eas.json` env 또는 EAS Secrets 사용.

**완료 기준**: preview 빌드에서 Sentry crash-free rate 대시보드 표시.

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
5. 단위 테스트 2개: hide/unhide 상태 전환 + persist 복원

**완료 기준**: 카드 숨기기 → 재시작 후 유지 + 설정에서 해제 가능.

---

### TASK-106: 개인정보처리방침 + Google Play Internal Testing 트랙 · 2h [P0] · (104)

**목표**: Google Play 등록 필수 전제 조건 완료.

**구현 단계**:
1. **개인정보처리방침** 작성 (`docs/privacy-policy.md`):
   - 개인정보보호법 제30조 필수 항목:
     - 개인정보 수집 항목 (이메일)
     - 수집 및 이용 목적
     - 보유 및 이용 기간
     - 처리 위탁 여부 (Supabase, Sentry)
     - 이용자의 권리·의무
   - 여행 데이터: 로컬 암호화 저장, 서버 미전송 명시
2. GitHub Pages 배포:
   - `docs/` 브랜치 또는 별도 레포 → GitHub Pages 활성화
   - URL 접속 확인
3. **Google Play Internal Testing 트랙** 설정:
   - Google Play Console 개발자 계정 확인
   - 앱 등록 + Internal Testing 트랙 생성
   - 개인정보처리방침 URL 등록
4. `app.json` 메타데이터 점검: `versionCode`, permissions 최소화

**완료 기준**: 개인정보처리방침 URL 접속 가능 + GP Internal Testing 트랙 생성 완료.

---

### TASK-107: 클로즈드 베타 배포 + 피드백 채널 + 설문 설계 · 3h [P1] · (모든 태스크)

**목표**: 10~20명 테스터에게 APK 배포 + 구조화된 피드백 수집 체계 구축.

**구현 단계**:
1. `eas build --profile preview --platform android` 빌드 성공 *(사용자 실행)*
2. 베타 테스터 배포 가이드 작성 (`docs/beta-guide.md`):
   - APK 다운로드 방법 (EAS 대시보드 링크)
   - "알 수 없는 앱 설치 허용" 설정 단계별 안내 (스크린샷 포함)
   - 피드백 채널 안내 (Google Forms + 오픈채팅방)
   - **알려진 미완성 기능 목록** (테스터 혼란 방지 — TF-MTG-003 Product-U 요구)
3. **구조화된 Google Forms 설문** 작성:
   - 섹션 1: 기본 정보 (Android 버전, 기기 모델)
   - 섹션 2: 태스크 완료율 (5개 핵심 태스크 Y/N)
     - ① 온보딩 완료 ② 여행 생성 ③ 이동 체크 사용 ④ 역산 확인 ⑤ iCal Export
   - 섹션 3: 만족도 (5점 척도)
     - 전체 만족도, 디자인 만족도, 재사용 의향
   - 섹션 4: 자유 의견 (불편 사항, 개선 요청, 기타)
4. 오픈채팅방 개설 (카카오톡) — 실시간 버그 리포팅 채널

**완료 기준**: 10~20명 테스터에게 APK 배포 완료 + Google Forms + 오픈채팅방 가동.

---

### TASK-108: Phase 6 완료보고서 · 1h · (모든 태스크)

**목표**: 문서화 완료.

**구현 단계**:
1. `report/260330/phase6/PHASE6_완료보고서.md` 작성
2. 위젯 POC 결과 기록 (성공/실패 + 선택한 경로)
3. 테스트 현황 기록 (Core + Mobile + E2E + Maestro)
4. Alpha → 클로즈드 베타 전환 완료 확인
5. Phase 7 전환 사항 정리
6. Notion DB 등록 *(사용자 실행)*
7. spec-kit/phase6/ 아카이브

**완료 기준**: 완료보고서 작성 + Notion 등록.

---

## 진행 현황 표 (초기값)

| Phase | 태스크 | 완료 | 진행률 |
|-------|--------|------|--------|
| 6.0 인프라 | 100~101 | 0/2 | 0% |
| 6.1 D-day 위젯 | 102~103 | 0/2 | 0% |
| 6.2 품질 + Quick Win | 104~105 | 0/2 | 0% |
| 6.3 베타 배포 | 106~108 | 0/3 | 0% |
| **합계** | **9** | **0** | **0%** |

---

## 리스크 레지스터

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| react-native-android-widget SDK 비호환 | SDK 업그레이드 +1일 | 중간 | TASK-100 호환성 체크 선행. 비호환 시 단독 업그레이드 |
| react-native-android-widget Gradle 충돌 | 위젯 빌드 실패 1~2일 | 높음 | `npx expo prebuild` 선행, android/ 수동 점검. 2일 타임박스 |
| 위젯 ↔ 앱 데이터 브릿지 불가 | 위젯 기능 무용 | 중간 | SharedPreferences 브릿지. 실패 시 홈 D-day 배너 대안 (결정 #16) |
| Sentry 초기화 성능 저하 | 앱 시작 속도 저하 | 낮음 | development 제외. async 초기화 |
| GitHub Actions 무료 분 초과 | CI 중단 | 낮음 | 단위 테스트만 CI. E2E 수동 유지 |
| EAS preview 빌드 실패 | 베타 배포 지연 | 중간 | development 빌드 성공 확인 후 preview 시도 |
| 베타 테스터 설치 실패 | APK 설치 방법 모름 | 중간 | 배포 가이드에 단계별 스크린샷 포함 |
| 베타 피드백 비구조화 | 분석 불가 | 중간 | 구조화된 Google Forms (5점 척도 + 태스크 완료율) |

---

*plan.md v1.0 | Phase 6 기술 구현 계획 | 2026-03-30 | TF-MTG-003 기반*
