# Task Breakdown: TripFrame Phase 6

**Feature**: `006-tripframe-phase6`
**Tasks version**: 1.0
**Created**: 2026-03-30
**Depends On**: Phase 5 완료 (TASK-093~099)
**Total Estimate**: ~16h (~2 working days)
**참조**: TF-MTG-003, spec.md v1.0, plan.md v1.0

---

## Phase 6.0 — D-day 위젯 (Android) [P0]

> 리텐션 핵심 기능. EAS Build 플러그인 설정으로 Phase 5 빌드 실패 패턴 재발 위험 있음. 순차 실행 필수.

### TASK-100: react-native-android-widget 설치 + 기본 설정 · 3h [P0]

> TF-MTG-003: 신규 네이티브 패키지 추가 시 app.json plugins 체크 + `npx expo prebuild` 먼저.

- [ ] `react-native-android-widget` 패키지 설치 (pnpm workspace)
- [ ] `app.json` plugins 배열에 위젯 플러그인 설정 추가
- [ ] `npx expo prebuild` 실행 → `android/` 폴더 Gradle 설정 수동 점검
- [ ] `TripWidgetProvider.tsx` 기본 구조 생성 (빈 위젯 Provider)
- [ ] `eas build --profile development --platform android` 빌드 성공 확인
- [ ] Android 에뮬레이터/실기기에서 위젯 항목이 선택 목록에 표시됨 확인

### TASK-101: 위젯 UI + 데이터 연동 + 딥링크 · 4h [P0] · (100)

> TF-MTG-003 결정 #12: 단일 위젯(다음 여행 자동 선택). 여행별 개별 위젯은 Phase 7.

- [ ] 다음 여행 선택 로직: 출발일 기준 가장 가까운 미래 여행 자동 선택
- [ ] 위젯 UI: D-day 숫자(purple, 대형) + 여행명(white) + 출발 시각(gray, small)
- [ ] 여행 없을 때: "여행을 추가하세요" 플레이스홀더
- [ ] 데이터 갱신: `useTripStore` 변경 시 SharedPreferences 업데이트 → 위젯 갱신
- [ ] 위젯 탭 딥링크: `tripframe://trip/{tripId}` → 해당 여행 일정 화면 진입
- [ ] Android 실기기 홈 화면에서 D-day 위젯 표시 + 탭 동작 확인
- [ ] Maestro 시나리오 3: 위젯 탭 → 앱 진입 딥링크 확인

---

## Phase 6.1 — CI/CD [P1]

### TASK-102: GitHub Actions CI + EAS Build 확장 · 2h [P1]

> TF-MTG-003 결정 #13: PR → 단위 테스트+타입 체크. main → EAS Build. E2E 수동 유지.

- [ ] `.github/workflows/ci.yml` 신규 생성:
  - 트리거: `pull_request` (branches: main)
  - Node.js 20.x + pnpm 9.x 설정
  - `pnpm --filter @tripframe/core test` — Core 단위 테스트
  - `pnpm --filter @tripframe/core typecheck` — 타입 체크
  - `pnpm --filter mobile test` — Mobile 단위 테스트
- [ ] GitHub Repository Secrets: `EXPO_TOKEN` 등록 여부 확인
- [ ] 더미 PR로 ci.yml 실행 확인 → 테스트 PASS 뱃지 표시

---

## Phase 6.2 — 앱스토어 준비 [P1]

### TASK-103: Sentry 크래시 리포팅 · 2h [P1]

> TF-MTG-003 B-3: DSN 환경변수 주입. 소스코드 하드코딩 절대 금지.

- [ ] `@sentry/react-native` 설치 + EAS Build config plugin 설정
- [ ] `app.config.ts` 생성 (app.json → app.config.ts 전환): `SENTRY_DSN` 환경변수 주입
- [ ] `App.tsx` `Sentry.init()` 추가 (development 환경 제외)
- [ ] EAS Secrets에 `SENTRY_DSN` 등록
- [ ] preview 빌드에서 의도적 예외 발생 → Sentry 대시보드 확인
- [ ] B-Sentry: crash-free rate 100% 초기 확인

### TASK-104: 스크린샷 + 앱 설명 + 개인정보처리방침 · 3h [P1] · (103)

> TF-MTG-003 결정 #14: 개인정보처리방침 GitHub Pages. 법무 검토는 Phase 7 전.

- [ ] **스크린샷 5장** (Playwright MCP + 웹 버전):
  - ①홈 (여행 카드 목록)
  - ②일정 탭 (Day 타임라인)
  - ③이동 체크 (Gap 카드 + RESOLVED 상태)
  - ④역산 탭 (결과 화면)
  - ⑤iCal Export 모달
- [ ] **앱 설명** 작성 (`docs/store-description.md`):
  - 제목(30자 이내): "TripFrame - 여행 일정 역산 플래너"
  - 짧은 설명(80자 이내)
  - 자세한 설명(4000자 이내)
- [ ] **개인정보처리방침** 작성 + GitHub Pages 배포:
  - 수집 항목: 이메일(Supabase Auth), 여행 데이터(로컬 암호화)
  - `docs/privacy-policy.md` 작성
  - GitHub Pages 활성화 → URL 확인
- [ ] `app.json` 메타데이터 점검: `versionCode`, permissions 최소화

---

## Phase 6.3 — 여행 카드 숨기기 [P2]

### TASK-105: isHidden UI + encryptedStorage 저장 · 2h [P2]

> TASK-091 이월. Quick Win. Constitution 준수: useTripStore 확장 (별도 스토어 불필요).

- [ ] `useTripStore.ts`:
  - `hiddenTripIds: string[]` 상태 추가
  - `hideTrip(id: string)` / `unhideTrip(id: string)` 액션 추가
  - encryptedStorage persist (기존 패턴)
- [ ] 홈 화면: `hiddenTripIds` 필터링 (숨긴 카드 미표시)
- [ ] 여행 카드 ··· 메뉴: "숨기기" / "숨기기 해제" 토글 옵션
- [ ] 설정 화면: "숨긴 여행 관리" 섹션 추가 → 숨긴 여행 목록 + 해제 버튼
- [ ] 단위 테스트 2개: hide/unhide 상태 전환 + persist 복원 (Mobile 테스트 추가)
- [ ] 앱 재시작 후 숨김 상태 유지 확인

---

## Phase 6.4 — 클로즈드 베타 배포 [P1]

### TASK-106: EAS preview 빌드 + 베타 배포 체계 + 완료보고서 · 2h · (모든 태스크)

> TF-MTG-003 결정 #15: EAS preview APK 직접 배포. 10~20명. Google Forms + 오픈채팅.

- [ ] `eas build --profile preview --platform android` 빌드 성공 *(사용자 실행)*
- [ ] 베타 테스터 배포 가이드 작성 (`docs/beta-guide.md`):
  - APK 다운로드 방법 (EAS 대시보드 링크)
  - "알 수 없는 앱 설치 허용" 설정 단계별 안내
  - 피드백 채널 안내 (Google Forms + 오픈채팅방)
- [ ] Google Forms 설문 초안 작성:
  - 온보딩 완료 여부 (Y/N)
  - 일정 생성 → 이동 체크 사용 여부 (Y/N)
  - 불편 사항 (주관식)
  - 앱 재사용 의향 (1~5점)
- [ ] `report/260330/phase6/PHASE6_완료보고서.md` 생성
- [ ] Notion DB 등록 *(사용자 실행)*
- [ ] spec-kit/phase6/ 아카이브 확인

---

## 진행 현황

| Phase | 태스크 | 완료 | 진행률 |
|-------|--------|------|--------|
| 6.0 D-day 위젯 [P0] | 100~101 | 0/2 | 0% |
| 6.1 CI/CD [P1] | 102 | 0/1 | 0% |
| 6.2 앱스토어 준비 [P1] | 103~104 | 0/2 | 0% |
| 6.3 카드 숨기기 [P2] | 105 | 0/1 | 0% |
| 6.4 베타 배포 | 106 | 0/1 | 0% |
| **합계** | **7** | **0** | **0%** |

---

## Phase 7 태스크 초안

> Phase 6 완료 후 정식 tasks.md 작성. **클로즈드 베타 피드백 반영 + 앱스토어 정식 출시** 목표.

### Phase 7.0 — Affiliate 교통 예약 링크
- `bookingUrl`에 affiliate 파라미터 추가
- 교통 옵션 카드에 예약 링크 표시

### Phase 7.1 — 교통 DB Supabase 전환
- 정적 JSON → Supabase 테이블 (사용자 수 기준)
- EAS Update로 OTA 갱신 (앱스토어 심사 없이)

### Phase 7.2 — 베타 피드백 반영
- Google Forms 결과 기반 UX 개선 우선순위 결정
- 클로즈드 베타 10~20명 피드백 Top 3 이슈 해결

### Phase 7.3 — 도시 템플릿 (서울·도쿄·방콕)
- 교통 프레임 템플릿만 (TF-MTG-001 만장일치 확인)

### Phase 7.4 — 앱스토어 정식 출시
- Google Play Console 개발자 계정 등록 ($25)
- Google Play 정식 출시 (Internal → Closed Testing → Production)
- iOS App Store 출시 (Mac 확보 후)

---

## TF-MTG-003 C레벨 결정 기록

| # | 결정 | 반영 태스크 |
|---|------|-----------|
| 12 | D-day 위젯: 단일 여행(다음 여행 자동 선택) | TASK-101 |
| 13 | CI/CD: PR 단위 테스트 / main EAS Build / E2E 수동 | TASK-102 |
| 14 | 개인정보처리방침: GitHub Pages. 법무 Phase 7 전 | TASK-104 |
| 15 | 클로즈드 베타: EAS preview APK. 10~20명. Google Forms | TASK-106 |
