# Task Breakdown: TripFrame Phase 6

**Feature**: `006-tripframe-phase6`
**Tasks version**: 1.0
**Created**: 2026-03-30
**Depends On**: Phase 5 완료 (TASK-093~099)
**Total Estimate**: ~23~27h (~3~4 working days, SDK 업그레이드 시 +1일)
**참조**: TF-MTG-003, spec.md v1.0, plan.md v1.0

---

## Phase 6.0 — 인프라 [P0, 순차]

> SDK 호환성 확인 + CI/CD 구축. 위젯 착수 전 반드시 완료.

### TASK-100: SDK 호환성 체크 + 조건부 업그레이드 · 2~4h [P0]

> TF-MTG-003 결정 #12: 위젯 라이브러리 호환성 체크 → 비호환 시 즉시 단독 업그레이드. 다른 기능과 동시 금지.

- [ ] `react-native-android-widget` npm peerDependencies 확인
- [ ] 현재 Expo SDK 버전과 호환성 매핑 체크
- [ ] **호환 시**: 그대로 진행 (2h로 종료)
- [ ] **비호환 시**: `npx expo install expo@latest` + 의존성 일괄 업데이트 *(단독 실행, 동시 금지)*
- [ ] SDK 업그레이드 시: Core 76/76 + Mobile 8/8 단위 테스트 PASS 확인
- [ ] SDK 업그레이드 시: Playwright E2E 97개 재확인
- [ ] 업그레이드 실패 시: Phase 5 SDK 롤백 → 위젯 대안(홈 배너) 적용

### TASK-101: CI/CD 기초 (GitHub Actions) · 3h [P0]

> TF-MTG-003 합의: Playwright CI만 Phase 6. Maestro CI는 베타 후 재평가.

- [ ] `.github/workflows/ci.yml` 신규 생성:
  - 트리거: `pull_request` (branches: main)
  - Node.js 20.x + pnpm 9.x 설정
  - `pnpm --filter @tripframe/core test` — Core 단위 테스트
  - `pnpm --filter @tripframe/core typecheck` — 타입 체크
  - `pnpm --filter mobile test` — Mobile 단위 테스트
- [ ] `.github/workflows/eas-build.yml` 확인: 기존 main 머지 트리거 유지
- [ ] GitHub Repository Secrets: `EXPO_TOKEN` 등록 여부 확인
- [ ] 더미 PR로 ci.yml 실행 확인 → 테스트 PASS 뱃지 표시

---

## Phase 6.1 — D-day 위젯 [P0, TASK-100 완료 후] ⏱️ 2일 타임박스

> TF-MTG-003 결정 #16: 위젯 POC 2일 타임박스. 실패 시 홈 D-day 배너 카드 대안 + 위젯 Phase 7 이월.
> TF-MTG-001: D-day 위젯 = "리텐션 핵심 장치".

### TASK-102: D-day 위젯 POC + 데이터 브릿지 · 5h [P0] · (100) ⏱️ 2일 타임박스

> TF-MTG-003 누락 발견 #2: 위젯 ↔ encryptedStorage 데이터 브릿지 설계 필수.

- [ ] `react-native-android-widget` 패키지 설치 (pnpm workspace)
- [ ] `app.json` plugins 배열에 위젯 플러그인 설정 추가
- [ ] `npx expo prebuild` 실행 → `android/` 폴더 Gradle 설정 수동 점검
- [ ] `TripWidgetProvider.tsx` 기본 구조 생성 (빈 위젯 Provider)
- [ ] `eas build --profile development --platform android` 빌드 성공 확인
- [ ] 에뮬레이터/실기기 홈 화면에서 위젯 선택 목록에 TripFrame 표시 확인
- [ ] SharedPreferences 데이터 브릿지: useTripStore → SharedPreferences 쓰기 → 위젯 읽기
- [ ] **2일 타임박스 판정**:
  - ✅ 성공: 위젯 표시 + SharedPreferences 데이터 읽기 가능 → TASK-103 경로 A
  - ❌ 실패: Gradle 충돌 또는 데이터 브릿지 불가 → TASK-103 경로 B

### TASK-103: D-day 위젯 완성 OR 홈 D-day 배너 · 3~4h [P1] · (102)

> 분기 태스크: TASK-102 POC 결과에 따라 경로 A 또는 경로 B 실행.

**경로 A — 위젯 POC 성공 시**:
- [ ] 다음 여행 선택 로직: 출발일 기준 가장 가까운 미래 여행 자동 선택
- [ ] 위젯 UI: D-day 숫자(#A78BFA, 대형) + 여행명(white) + 출발 시각(#9CA3AF, small)
- [ ] 배경: `#0F0F13` (다크 테마)
- [ ] 여행 없을 때: "여행을 추가하세요" 플레이스홀더
- [ ] 데이터 갱신: useTripStore 변경 시 SharedPreferences → 위젯 갱신
- [ ] 위젯 탭 딥링크: `tripframe://trip/{tripId}` → 해당 여행 일정 화면
- [ ] Maestro 시나리오 3: 위젯 탭 → 앱 진입 딥링크 확인

**경로 B — 위젯 POC 실패 시**:
- [ ] `DdayBannerCard.tsx` 컴포넌트 생성 (홈 화면 상단, 여행 카드 목록 위)
- [ ] 다음 여행 D-day 카운트 + 여행명 + 출발 시각 표시
- [ ] 배너 탭 → 해당 여행 일정 화면 진입 (기존 navigateTo 활용)
- [ ] Playwright E2E: 홈 화면 D-day 배너 표시 + 탭 동작 확인
- [ ] **위젯은 Phase 7로 이월** 기록

---

## Phase 6.2 — 품질 + Quick Win [TASK-101 완료 후, 병렬 가능]

### TASK-104: Sentry 기본 연동 · 2h [P1]

> TF-MTG-003 결정 #14: 크래시 리포팅만. 성능 모니터링은 Phase 7. 무료 티어(5K 이벤트/월).

- [ ] `@sentry/react-native` 설치 + EAS Build config plugin 설정
- [ ] `app.config.ts` 생성/확장: `SENTRY_DSN` 환경변수 주입 *(하드코딩 절대 금지)*
- [ ] `App.tsx` `Sentry.init()` 추가 (development 환경 제외)
- [ ] EAS Secrets에 `SENTRY_DSN` 등록
- [ ] preview 빌드에서 의도적 예외 발생 → Sentry 대시보드 확인
- [ ] crash-free rate 100% 초기 확인

### TASK-105: 여행 카드 숨기기 (isHidden) · 2h [P2]

> TASK-091 이월. Quick Win. TF-MTG-003 전원 동의. Constitution 준수: useTripStore 확장.

- [ ] `useTripStore.ts`:
  - `hiddenTripIds: string[]` 상태 추가
  - `hideTrip(id: string)` / `unhideTrip(id: string)` 액션 추가
  - encryptedStorage persist (기존 패턴)
- [ ] 홈 화면: `hiddenTripIds` 필터링 (숨긴 카드 미표시)
- [ ] 여행 카드 ··· 메뉴: "숨기기" / "숨기기 해제" 토글 옵션
- [ ] 설정 화면: "숨긴 여행 관리" 섹션 → 숨긴 여행 목록 + 개별 해제 버튼
- [ ] 단위 테스트 2개: hide/unhide 상태 전환 + persist 복원 (Mobile 테스트 추가)
- [ ] 앱 재시작 후 숨김 상태 유지 확인

---

## Phase 6.3 — 베타 배포 [모두 완료 후]

### TASK-106: 개인정보처리방침 + Google Play Internal Testing 트랙 · 2h [P0] · (104)

> TF-MTG-003 결정 #15: 개인정보처리방침 GitHub Pages. 개인정보보호법 제30조 충족.
> TF-MTG-003 결정 #13: Google Play Internal Testing 트랙 사전 설정.
> TF-MTG-003 누락 발견 #5: Internal Testing에도 개인정보처리방침 URL 필수.

- [ ] **개인정보처리방침** 작성 (`docs/privacy-policy.md`):
  - 개인정보보호법 제30조 필수 항목:
    - 수집 항목: 이메일 (Supabase Auth)
    - 이용 목적: 사용자 식별 + 동기화
    - 보유 기간: 탈퇴 시 즉시 삭제
    - 처리 위탁: Supabase(인증), Sentry(크래시)
    - 이용자 권리: 열람·정정·삭제·처리정지 요구권
  - 여행 데이터: 로컬 암호화 저장, 서버 미전송 명시
- [ ] GitHub Pages 배포 → URL 접속 확인
- [ ] **Google Play Console**: 앱 등록 + Internal Testing 트랙 생성 *(사용자 실행)*
- [ ] Internal Testing 트랙에 개인정보처리방침 URL 등록
- [ ] `app.json` 메타데이터 점검: `versionCode`, permissions 최소화

### TASK-107: 클로즈드 베타 배포 + 피드백 채널 + 설문 설계 · 3h [P1] · (모든 태스크)

> TF-MTG-003 결정 #13: EAS Internal Distribution(APK 직접 배포). 10~20명.
> TF-MTG-003 Product-U: 구조화된 피드백 없이 베타는 무의미. 5점 척도 + 태스크 완료율 + 자유 의견 필수.

- [ ] `eas build --profile preview --platform android` 빌드 성공 *(사용자 실행)*
- [ ] 베타 테스터 배포 가이드 작성 (`docs/beta-guide.md`):
  - APK 다운로드 방법 (EAS 대시보드 링크)
  - "알 수 없는 앱 설치 허용" 설정 단계별 안내 (스크린샷 포함)
  - 피드백 채널 안내 (Google Forms + 오픈채팅방)
  - **알려진 미완성 기능 목록** (테스터 혼란 방지):
    - iOS 미지원 (Android 전용 베타)
    - D-day 위젯 (결과에 따라)
    - 라이트 테마 미지원
    - 다국어 미지원
- [ ] **구조화된 Google Forms 설문** 작성:
  - 섹션 1: 기본 정보 (Android 버전, 기기 모델)
  - 섹션 2: 핵심 태스크 완료율 (5개 항목, Y/N):
    - ① 온보딩 완료 ② 여행 생성 ③ 이동 체크 사용 ④ 역산 확인 ⑤ iCal Export
  - 섹션 3: 만족도 (5점 척도):
    - 전체 만족도, 디자인 만족도, 재사용 의향
  - 섹션 4: 자유 의견 (불편 사항, 개선 요청, 기타)
- [ ] 오픈채팅방 개설 (카카오톡) — 실시간 버그 리포팅 채널
- [ ] 테스터 10~20명에게 APK + 가이드 + 설문 링크 배포

### TASK-108: Phase 6 완료보고서 · 1h · (모든 태스크)

- [ ] `report/260330/phase6/PHASE6_완료보고서.md` 생성
- [ ] 위젯 POC 결과 기록 (성공/실패 + 선택 경로 A or B)
- [ ] 테스트 현황 기록 (Core + Mobile + E2E + Maestro)
- [ ] Alpha → 클로즈드 베타 전환 완료 확인
- [ ] Phase 7 전환 사항 정리
- [ ] Notion DB 등록 *(사용자 실행)*
- [ ] spec-kit/phase6/ 아카이브

---

## 진행 현황

| Phase | 태스크 | 완료 | 진행률 |
|-------|--------|------|--------|
| 6.0 인프라 [P0] | 100~101 | 0/2 | 0% |
| 6.1 D-day 위젯 [P0] | 102~103 | 0/2 | 0% |
| 6.2 품질 + Quick Win | 104~105 | 0/2 | 0% |
| 6.3 베타 배포 | 106~108 | 0/3 | 0% |
| **합계** | **9** | **0** | **0%** |

---

## Phase 7 태스크 초안

> Phase 6 완료 후 정식 tasks.md 작성. **클로즈드 베타 피드백 반영 + 앱스토어 정식 출시** 목표.

### Phase 7.0 — 앱 스토어 정식 출시 준비
- 스크린샷 5장 촬영 + 앱 설명 작성
- Google Play Console: Internal Testing → Closed Testing → Production 트랙 전환
- iOS App Store 등록 (Mac 확보 후)

### Phase 7.1 — Affiliate 교통 예약 링크
- `bookingUrl`에 affiliate 파라미터 추가
- 교통 옵션 카드에 예약 링크 표시

### Phase 7.2 — 교통 DB Supabase 전환
- 정적 JSON → Supabase 테이블 (사용자 수 기준)
- EAS Update로 OTA 갱신 (앱스토어 심사 없이)

### Phase 7.3 — 베타 피드백 반영
- Google Forms 결과 기반 UX 개선 우선순위 결정
- 클로즈드 베타 피드백 Top 3 이슈 해결

### Phase 7.4 — 도시 템플릿 (서울·도쿄·방콕)
- 교통 프레임 템플릿만 (TF-MTG-001 만장일치 확인)

### Phase 7.5 — D-day 위젯 (Phase 6 이월 시)
- Phase 6 위젯 POC 실패 시에만 해당
- Sentry 성능 모니터링 활성화

---

## TF-MTG-003 C레벨 결정 기록

| # | 결정 | 반영 태스크 |
|---|------|-----------|
| 12 | SDK 업그레이드: 위젯 라이브러리 호환성 체크 → 비호환 시 단독 | TASK-100 |
| 13 | 배포: EAS Internal Distribution + GP Internal Testing 트랙 | TASK-106, TASK-107 |
| 14 | Sentry: Phase 6 크래시만. 성능 모니터링 Phase 7 | TASK-104 |
| 15 | 개인정보처리방침: GitHub Pages. 개인정보보호법 제30조 | TASK-106 |
| 16 | D-day 위젯: 2일 타임박스. 실패 시 홈 배너 + 위젯 Phase 7 이월 | TASK-102, TASK-103 |

---

*tasks.md v1.0 | Phase 6 태스크 목록 | 2026-03-30 | TF-MTG-003 기반*
