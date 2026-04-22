# Task Breakdown: TripFrame Phase 6

**Feature**: `006-tripframe-phase6`
**Tasks version**: 2.0
**Created**: 2026-03-30
**Updated**: 2026-04-22
**Depends On**: Phase 5 완료 (TASK-093~099)
**Total Estimate**: ~23~27h (~3~4 working days, SDK 업그레이드 시 +1일)
**참조**: TF-MTG-003, spec.md v1.0, plan.md v1.0

---

## Phase 6.0 — 인프라 [P0, 순차] ✅ 완료

> SDK 호환성 확인 + CI/CD 구축. 위젯 착수 전 반드시 완료.

### TASK-100: SDK 호환성 체크 + 조건부 업그레이드 · 2~4h [P0] ✅

> TF-MTG-003 결정 #12: 위젯 라이브러리 호환성 체크 → 비호환 시 즉시 단독 업그레이드. 다른 기능과 동시 금지.

- [x] `react-native-android-widget` npm peerDependencies 확인
- [x] 현재 Expo SDK 버전과 호환성 매핑 체크
- [x] **호환 확인**: Expo SDK 54 + react-native-android-widget ^0.20.1 호환 확인 → 그대로 진행
- [x] 기존 단위 테스트 PASS 유지 확인

### TASK-101: CI/CD 기초 (GitHub Actions) · 3h [P0] ✅

> TF-MTG-003 합의: Playwright CI만 Phase 6. Maestro CI는 베타 후 재평가.

- [x] `.github/workflows/ci.yml` 신규 생성:
  - 트리거: `pull_request` (branches: main)
  - Node.js 20.x + pnpm 9.x 설정
  - `pnpm --filter @tripframe/core test` — Core 단위 테스트
  - `pnpm --filter @tripframe/core typecheck` — 타입 체크
  - `pnpm --filter mobile test` — Mobile 단위 테스트
- [x] GitHub Repository Secrets: `EXPO_TOKEN` 등록 여부 확인

---

## Phase 6.0.5 — Supabase 클라우드 동기화 [추가 완료] ✅

> 원래 Phase 6 tasks.md에 미포함이었으나 Phase 6 진행 중 완료.
> 시스템설계서(TF-SAD-001) Phase 2 항목 조기 완료.

### TASK-109: Supabase 인프라 설정 (Phase A) ✅

- [x] Supabase 프로젝트 생성 (`tripframe`, Northeast Asia)
- [x] DB 스키마 적용 (`user_profiles`, `trips`, `events` 테이블 + 트리거)
- [x] RLS 정책 설정 (유저별 데이터 격리)
- [x] Realtime 활성화 (`trips`, `events` 테이블)
- [x] Google OAuth 설정 (GCP 클라이언트 ID + Supabase Provider 등록)
- [x] Redirect URLs 등록 (localhost:8081, tripframe://)
- [x] `.env` 파일 생성 (SUPABASE_URL, ANON_KEY, GOOGLE_CLIENT_ID_WEB)

### TASK-110: Supabase 연동 코드 (Phase B) ✅

- [x] B-1: null safety 강화 (`useGoogleAuth.ts`, `userProfile.ts`, `supabaseSync.ts`)
- [x] B-2: `src/lib/tripMapper.ts` 신규 생성 (Trip ↔ DB row 변환)
- [x] B-3: `useTripStore.ts` — `setStoreUserId()` + syncEngine 연결 (addTrip/updateTrip/deleteTrip/Event 액션)
- [x] B-4: `useRealtimeSync.ts` — Realtime 수신 → store 업데이트 연결
- [x] B-5: `App.tsx` — 로그인 후 원격 데이터 병합 + `setStoreUserId` 주입
- [x] B-6: `SettingsScreen.tsx` — 로그인/로그아웃 UI (로그인 선택형 정책)

### TASK-111: Google OAuth 웹 오류 수정 ✅

- [x] `useGoogleAuth.web.ts` 신규 생성 — Supabase OAuth 리다이렉트 방식 (COOP 오류 해결)
- [x] `supabase.ts` — `detectSessionInUrl: Platform.OS === 'web'` (리다이렉트 복귀 세션 감지)
- [x] `userProfile.ts` — `.single()` → `.maybeSingle()` 교체 (406 제거)
- [x] `userProfile.ts` — check-then-insert → `upsert + ignoreDuplicates` 교체 (409 제거)
- [x] 검증: 로그인 → "동기화 완료" 표시, Realtime SUBSCRIBED 확인

---

## Phase 6.1 — D-day 위젯 [P0, TASK-100 완료 후] ✅ POC 완료

> TF-MTG-003 결정 #16: 위젯 POC 2일 타임박스. 실패 시 홈 D-day 배너 카드 대안 + 위젯 Phase 7 이월.

### TASK-102: D-day 위젯 POC + 데이터 브릿지 · 5h [P0] ✅

> **결과: 경로 A — POC 성공.** 위젯 표시 + SharedPreferences 데이터 브릿지 구현 완료.

- [x] `react-native-android-widget` 패키지 설치 (pnpm workspace)
- [x] `app.json` plugins 배열에 위젯 플러그인 설정 추가
- [x] `npx expo prebuild` 실행 → `android/` 폴더 Gradle 설정 점검
- [x] `TripWidgetProvider.tsx` 기본 구조 생성 + 다크 배경(`#0F0F13`) 수정
- [x] 에뮬레이터 홈 화면에서 TripFrame 위젯 표시 확인 ✅
- [x] SharedPreferences 데이터 브릿지: useTripStore → SharedPreferences 쓰기 → 위젯 읽기
- [x] **웹 빌드 호환**: `registerWidget.web.ts`, `android-widget-stub.js`, `metro.config.js` resolveRequest 스텁 추가

### ~~TASK-103: D-day 위젯 완성 · 3~4h [P1] · (102)~~ ✅ COMPLETE

> **경로 A 실행** (POC 성공). 완료: 2026-04-22

- [x] 다음 여행 선택 로직: 출발일 기준 가장 가까운 미래 여행 자동 선택
- [x] 위젯 UI: D-day 숫자(#A78BFA, 대형) + 여행명(white) + 출발 시각(#9CA3AF, small)
- [x] 여행 없을 때: "여행을 추가하세요" 플레이스홀더
- [x] 위젯 탭 딥링크: `tripframe://trip/{tripId}` → 해당 여행 일정 화면
- [x] Maestro 시나리오: `.maestro/widget_deeplink.yaml`

---

## Phase 6.2 — 품질 + Quick Win [TASK-101 완료 후, 병렬 가능]

### ~~TASK-104: Sentry 기본 연동 · 2h [P1]~~ ✅ COMPLETE

> TF-MTG-003 결정 #14: 크래시 리포팅만. 성능 모니터링은 Phase 7. 완료: 2026-04-22

- [x] `@sentry/react-native` 설치 + `app.config.ts`에 EAS Build config plugin 설정
- [x] `app.config.ts` 생성: `SENTRY_DSN` env 주입 → `extra.sentryDsn`으로 런타임 접근
- [x] `App.tsx`: `Sentry.init()` (NODE_ENV !== 'development') + `Sentry.wrap(App)` export
- [ ] EAS Secrets에 `SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` 등록 *(사용자 직접)*
- [ ] preview 빌드에서 의도적 예외 발생 → Sentry 대시보드 확인 *(사용자 직접)*
- [ ] crash-free rate 100% 초기 확인 *(사용자 직접)*

### ~~TASK-105: 여행 카드 숨기기 (isHidden) · 2h [P2]~~ ✅ COMPLETE

> TASK-091 이월. 완료: 2026-04-22

- [x] `useTripStore.ts`: `hiddenTripIds`, `hideTrip`, `unhideTrip`, persist 포함
- [x] 홈 화면: `hiddenTripIds` 필터링 (숨긴 카드 미표시)
- [x] 여행 카드 ··· 메뉴: "숨기기" 옵션 (iOS ActionSheet + Android Alert)
- [x] 설정 화면: `HiddenTripsSection` — 숨긴 여행 목록 + 개별 해제 버튼
- [x] 단위 테스트 5개 통과 (`src/store/__tests__/useTripStore.hiddenTrips.test.ts`)
- [x] persist partialize 포함 → 앱 재시작 후 숨김 상태 유지

---

## Phase 6.3 — 베타 배포 [모두 완료 후]

### TASK-106: 개인정보처리방침 + Google Play Internal Testing 트랙 · 2h [P0] · (104)

> TF-MTG-003 결정 #15: 개인정보처리방침 GitHub Pages.
> TF-MTG-003 결정 #13: Google Play Internal Testing 트랙 사전 설정.

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

- [ ] `eas build --profile preview --platform android` 빌드 성공 *(사용자 실행)*
- [ ] 베타 테스터 배포 가이드 작성 (`docs/beta-guide.md`):
  - APK 다운로드 방법 (EAS 대시보드 링크)
  - "알 수 없는 앱 설치 허용" 설정 단계별 안내
  - 피드백 채널 안내 (Google Forms + 오픈채팅방)
  - 알려진 미완성 기능 목록
- [ ] **구조화된 Google Forms 설문** 작성:
  - 섹션 1: 기본 정보 (Android 버전, 기기 모델)
  - 섹션 2: 핵심 태스크 완료율 (5개 항목 Y/N)
  - 섹션 3: 만족도 5점 척도 (전체, 디자인, 재사용 의향)
  - 섹션 4: 자유 의견
- [ ] 오픈채팅방 개설 (카카오톡)
- [ ] 테스터 10~20명에게 APK + 가이드 + 설문 링크 배포

### TASK-108: Phase 6 완료보고서 · 1h · (모든 태스크)

- [ ] `report/260330/phase6/PHASE6_완료보고서.md` 생성
- [ ] 위젯 POC 결과 기록 (성공 — 경로 A 선택)
- [ ] Supabase 연동 완료 기록 (Phase B: 로그인, 실시간 동기화, 프로필)
- [ ] 테스트 현황 기록 (Core + Mobile + E2E 98/98)
- [ ] Alpha → 클로즈드 베타 전환 완료 확인
- [ ] Phase 7 전환 사항 정리
- [ ] Notion DB 등록 *(사용자 실행)*
- [ ] spec-kit/phase6/ 아카이브

---

## 진행 현황

| Phase | 태스크 | 완료 | 진행률 |
|-------|--------|------|--------|
| 6.0 인프라 [P0] | 100~101 | 2/2 | **100%** ✅ |
| 6.0.5 Supabase 연동 (추가) | 109~111 | 3/3 | **100%** ✅ |
| 6.1 D-day 위젯 [P0] | 102~103 | 1/2 | **50%** 🔄 |
| 6.2 품질 + Quick Win | 104~105 | 0/2 | 0% |
| 6.3 베타 배포 | 106~108 | 0/3 | 0% |
| **합계** | **12** | **6** | **50%** |

---

## 다음 우선순위

```
즉시 착수 가능:
  TASK-103: D-day 위젯 완성 (경로 A — 위젯 UI + 딥링크)  [P1]
  TASK-104: Sentry 기본 연동                              [P1] (TASK-103과 병렬 가능)
  TASK-105: 여행 카드 숨기기                               [P2] (병렬 가능)

이후:
  TASK-106: 개인정보처리방침 + Google Play 트랙            [P0]
  TASK-107: 클로즈드 베타 배포                            [P1]
  TASK-108: Phase 6 완료보고서                            [P1]
```

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
- EAS Update로 OTA 갱신

### Phase 7.3 — 베타 피드백 반영
- Google Forms 결과 기반 UX 개선 우선순위 결정
- 클로즈드 베타 피드백 Top 3 이슈 해결

### Phase 7.4 — 도시 템플릿 (서울·도쿄·방콕)
- 교통 프레임 템플릿만

### Phase 7.5 — D-day 위젯 iOS (Mac 확보 후)
- iOS 위젯 확장 (Phase 8+)
- Sentry 성능 모니터링 활성화

---

## TF-MTG-003 C레벨 결정 기록

| # | 결정 | 반영 태스크 |
|---|------|-----------|
| 12 | SDK 업그레이드: 위젯 라이브러리 호환성 체크 → 비호환 시 단독 | TASK-100 ✅ |
| 13 | 배포: EAS Internal Distribution + GP Internal Testing 트랙 | TASK-106, TASK-107 |
| 14 | Sentry: Phase 6 크래시만. 성능 모니터링 Phase 7 | TASK-104 |
| 15 | 개인정보처리방침: GitHub Pages. 개인정보보호법 제30조 | TASK-106 |
| 16 | D-day 위젯: 2일 타임박스. **POC 성공 → 경로 A** | TASK-102 ✅, TASK-103 |

---

*tasks.md v2.0 | Phase 6 태스크 목록 | 2026-04-22 업데이트 | Supabase 연동 완료 반영*
