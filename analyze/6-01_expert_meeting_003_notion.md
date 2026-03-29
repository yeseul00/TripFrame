# TripFrame 전문가 합동 회의록 (3차)

> **문서 ID**: TF-MTG-003
> **일시**: 2026-03-30
> **참석자**: Strategist-M(시장 전략), Architect-S(시스템 아키텍처), Product-U(제품/UX)
> **참조 자료**: TF-MTG-002, Phase 5 완료보고서, tasks.md v1.0
> **형식**: Phase 5 완료 검증 → Phase 6 진입 결정 → 리스크 분석 → 로드맵 확인

---

## 회의 배경

Phase 5가 7/7 태스크 완료(100%), Core 76/76·Mobile 8/8 PASS, EAS Dev Build 3차 빌드 성공·APK 설치 완료로 종결되었다. Phase 6 진입 전 Phase 5 완료 상태를 검증하고, Phase 6 핵심 결정사항을 확정한다.

---

## Agenda A: Phase 5 완료 검증

### A-1. 기술 완료 상태 검증

| 참석자 | 의견 |
|--------|------|
| **Architect-S** | Phase 5 완료 상태 점검. EAS Dev Build 3차 빌드에서야 성공한 점이 주목할 만함. 1차: `adaptiveIcon.foregroundImage` 누락 + plugins 미설정. 2차: async-storage `^3.0.2` → Maven 미등록 이슈. **이 두 오류 패턴은 Phase 6에서도 재발 가능** — 신규 네이티브 패키지 추가 시 app.json plugins 체크리스트 적용 권고. 기술 완료 상태 자체는 **★★★★☆** — 단위 테스트 84/84, E2E 97+, Constitution 원칙 전체 준수. |
| **Product-U** | 사용자 여정 관점에서 Phase 5 달성 평가: 이동 체크 탭 통합(공백감지+제안카드)이 핵심 가치 전달 흐름을 완성했음. RESOLVED 상태 + 초록 카드가 "해결됨" 피드백을 시각적으로 제공. iCal Export 후 Google Calendar 안내 화면도 적절. **★★★★☆** — 미흡점은 D-day 위젯 부재로 리텐션 트리거가 아직 없음. |
| **Strategist-M** | Alpha 배포 준비 완료 자체가 중요한 마일스톤. EAS Dev Build 성공 = 앱스토어 배포 경로 확보. iCal Export가 "TripFrame → Google Calendar" 워크플로우를 만들어 바이럴 가능성 있음. 단, **Alpha 사용자 피드백 수집 채널**이 명시되어 있지 않음. 클로즈드 베타 전에 피드백 메커니즘 설계 필요. |

**검증 결과**: ✅ Phase 5 완료 승인. Phase 6 진입 가능.
**🟡 보완 사항**: 신규 네이티브 패키지 추가 시 app.json plugins 체크 관행화. Alpha 피드백 채널 Phase 6에서 설계.

---

### A-2. Phase 5 미완 항목 처리

| 항목 | 상태 | Phase 6 처리 방식 |
|------|------|-------------------|
| EAS Build 첫 실행 (사용자 실행) | ✅ 3차 빌드 성공 | 완료 |
| Android 실기기 APK 설치 | ✅ 설치 완료 | 완료 |
| Notion DB 등록 | ⏳ 사용자 실행 대기 | 사용자가 별도 진행 |
| Metro 연결 (실기기 개발 사이클) | 진행 중 | Phase 6 CI/CD와 함께 안정화 |

**Architect-S**: Notion DB 등록은 자동화할 수 없는 사용자 액션. Phase 6 CI/CD 태스크에서 GitHub Actions 연동 시 Notion API 자동 업로드 검토 가능. 단, 오버엔지니어링 경계선 주의.
**Product-U**: 동의. Notion 등록은 사용자가 직접 하는 게 맞음. 자동화 불필요.

---

## Agenda B: Phase 6 핵심 결정 검증

### B-1. D-day 위젯 — react-native-android-widget

| 참석자 | 의견 |
|--------|------|
| **Architect-S** | `react-native-android-widget` 라이브러리 선택 검증. 대안 비교: ①`react-native-android-widget` (React Native 컴포넌트 기반), ②직접 Native Module 작성 (Java/Kotlin). ①이 TypeScript 생태계 내에 머물 수 있어 Constitution 관점에서 유리. 다만 **EAS Build 플러그인 설정이 필요하며 app.json 수정 필수** — Phase 5 빌드 실패 패턴 재발 위험. `eas build` 전 `npx expo prebuild`로 android/ 수동 점검 체크 포함 권고. |
| **Strategist-M** | **D-day 카운트다운이 리텐션의 핵심**. "D-3 후쿠오카 ✈ 출발 09:30" 형태의 위젯이 매일 앱 진입 트리거. Android 홈 화면 위젯은 앱 아이콘 옆 상시 노출 — 광고 없이 일일 DAU를 유지하는 유일한 수단. Phase 6에서 가장 ROI가 높은 기능. |
| **Product-U** | 위젯 UX 설계 결정 필요. 단일 여행(다음 여행 자동 선택) vs 여행 카드별 개별 위젯. 개별 위젯은 UX가 풍부하지만 구현 복잡도가 높음. Alpha 단계에서는 **단일 여행(다음 여행 자동 선택)** 방식이 현실적. 여러 위젯 개별 연결은 Phase 7 확장. |

**🔴 C레벨 결정 #12**: Phase 6 위젯은 **다음 여행 자동 선택 단일 위젯** 방식으로 구현. 여행 카드별 개별 위젯은 Phase 7로 이월.
**합의**: app.json plugins 체크를 빌드 태스크에 명시적으로 포함.

---

### B-2. CI/CD 설계

| 참석자 | 의견 |
|--------|------|
| **Architect-S** | GitHub Actions 워크플로우 설계 제안. 2-트랙 분리가 필요: **① PR 체크**: `pnpm test` (Core + Mobile 단위 테스트) + TypeScript 타입 체크. **② main 머지**: 단위 테스트 PASS 시에만 `eas build` 트리거. Maestro E2E는 Android 에뮬레이터 필요하므로 로컬 실행 권고 (GitHub Actions 에뮬레이터 느리고 불안정). 현재 `.github/workflows/eas-build.yml`이 이미 존재 — 이를 확장하는 방식으로 진행. |
| **Strategist-M** | CI/CD 투자의 ROI: 코드 리뷰 사이클 단축, 빌드 실패 조기 발견. GitHub Actions 무료 티어 2000분/월 주의. PR마다 단위 테스트만 실행하면 분당 사용량이 낮음. EAS 빌드는 EAS 크레딧에서 차감되므로 GitHub Actions 분 소비 없음. |
| **Product-U** | 개발자 경험 관점: PR에서 테스트 결과가 보이면 코드 품질 자신감 향상. 단, CI 설정이 복잡해지면 개발 속도 저하. Phase 6 CI는 **단순하게 시작** — 단위 테스트 + 타입 체크만. Playwright E2E는 수동 트리거로 남겨두는 것 권고. |

**🔴 C레벨 결정 #13**: CI/CD 2-트랙. PR → 단위 테스트 + 타입 체크. main 머지 → EAS Build. Playwright E2E + Maestro는 수동 실행 유지.

---

### B-3. 앱스토어 준비 + Sentry

| 참석자 | 의견 |
|--------|------|
| **Product-U** | 앱스토어 준비 핵심: 스크린샷 5장. TripFrame 핵심 흐름 5장: ①홈(여행 카드), ②일정 탭(Day 타임라인), ③이동 체크(Gap 카드+RESOLVED), ④역산 결과, ⑤iCal Export. Playwright MCP 스크린샷으로 초안 생성 가능. |
| **Architect-S** | Sentry 연동: `@sentry/react-native` 설치 + EAS Build 플러그인 설정. crash-free rate 모니터링이 클로즈드 베타 필수. DSN은 `app.config.ts`의 환경변수로 주입 — 소스코드 하드코딩 금지. |
| **Strategist-M** | 개인정보처리방침 필수. 국내 구글플레이 등록에 개인정보처리방침 URL 제출 필수. 수집 항목: 이메일(Supabase Auth), 여행 데이터(로컬 암호화 저장). 법무 검토는 정식 출시 전. 호스팅: GitHub Pages 또는 Vercel 단일 페이지. |

**🔴 C레벨 결정 #14**: 개인정보처리방침은 GitHub Pages 또는 Vercel 단일 페이지로 Phase 6 내 게시. 정식 법무 검토는 Phase 7(정식 출시) 전.
**합의**: Sentry DSN은 EAS 환경변수로 주입. 소스코드 하드코딩 금지.

---

### B-4. 여행 카드 숨기기 (TASK-091 이월)

| 참석자 | 의견 |
|--------|------|
| **Product-U** | 홈 화면 여행 카드가 많아질수록 스크롤 길어짐. "숨기기"는 삭제와 다른 개념 — 데이터 유지, UI에서만 미표시. Phase 6 Quick Win — 구현 단순, UX 임팩트 큼. |
| **Architect-S** | 구현 단순: `hiddenTripIds: string[]` → encryptedStorage. `useTripStore`에서 hidden 여행 필터링. 토글 UI만 추가. 1~2시간 작업. Constitution 준수. |
| **Strategist-M** | 동의. 빠른 Quick Win. |

**검증 결과**: ✅ Phase 6 포함 확정. Quick Win 분류.

---

### B-5. 클로즈드 베타 배포 계획

| 참석자 | 의견 |
|--------|------|
| **Strategist-M** | 클로즈드 베타 10~20명: 친구/지인 여행 빈도 높은 사람 5~10명 + 커뮤니티(여행 관련 카페/오픈채팅) 5~10명. 피드백 채널: Google Forms(구조화 설문) + 오픈채팅방(자유 피드백). 핵심 측정: ①일정 생성 완료율, ②이동 체크 사용률, ③앱 재방문율(D+3, D+7). |
| **Product-U** | 베타 기간 2주 권장. 처음 사용자의 "첫 여행 만들기" 전환율 측정 중요. |
| **Architect-S** | 기술 배포 방법: EAS preview 프로필 APK 직접 배포 → 테스터 "알 수 없는 앱 설치 허용" 설정. Google Play Internal Testing Track은 개발자 계정 등록($25) 필요. Phase 7(정식 출시) 시점에 등록 권고. |

**🔴 C레벨 결정 #15**: 클로즈드 베타 = EAS preview APK 직접 배포. 10~20명 목표. 피드백 채널: Google Forms + 오픈채팅방.

---

## Agenda C: Phase 6 범위 최종 확정

### 포함 (In Scope)

| Phase | 기능 | 우선순위 | 근거 |
|-------|------|---------|------|
| 6.0 | D-day 위젯 (Android, 단일 여행) | P0 | 리텐션 핵심. TF-MTG-002 |
| 6.1 | CI/CD (PR 테스트 + main EAS Build) | P1 | 개발 품질 안전망 |
| 6.2 | Sentry 크래시 리포팅 | P1 | 클로즈드 베타 전 필수 |
| 6.2 | 앱스토어 스크린샷 5장 + 설명 | P1 | 스토어 출시 준비 |
| 6.2 | 개인정보처리방침 (GitHub Pages) | P1 | 스토어 등록 필수 |
| 6.3 | 여행 카드 숨기기 (isHidden) | P2 | Quick Win, TASK-091 이월 |
| 6.4 | 클로즈드 베타 10~20명 배포 | P1 | Phase 6 말 마일스톤 |

### 제외 (Out of Scope → Phase 7)

- 교통 DB Supabase 전환 (정적 JSON 유지)
- Affiliate 예약 링크 활성화
- iOS D-day 위젯
- 도시 템플릿 (서울·도쿄·방콕)
- Expo Router 전환

---

## C레벨 결정 사항 요약 (TF-MTG-003)

| # | 주제 | 결정 | 합의 수준 |
|---|------|------|---------|
| 12 | D-day 위젯 방식 | 다음 여행 자동 선택 단일 위젯 (여행별 개별 위젯은 Phase 7) | 만장일치 |
| 13 | CI/CD 트랙 | PR → 단위 테스트+타입 체크 / main → EAS Build / E2E 수동 유지 | 만장일치 |
| 14 | 개인정보처리방침 | GitHub Pages/Vercel 단일 페이지. 법무 검토는 Phase 7 전 | 만장일치 |
| 15 | 클로즈드 베타 배포 | EAS preview APK 직접 배포. 10~20명. Google Forms+오픈채팅 | 만장일치 |

---

## 합의 사항 (결정 불필요)

| 항목 | 합의 내용 | Phase |
|------|---------|-------|
| Phase 5 완료 승인 | 7/7 완료. Phase 6 진입 승인 | 5→6 |
| 신규 네이티브 패키지 | app.json plugins 체크 관행화 (Phase 5 빌드 실패 학습) | 6+ |
| 위젯 단일 여행 | 다음 여행 자동 선택. 개별 위젯은 Phase 7 | 6 |
| Sentry DSN 보안 | app.config.ts 환경변수 주입. 하드코딩 금지 | 6 |
| 클로즈드 베타 피드백 | Google Forms + 오픈채팅방. 2주 운영 | 6 |

---

*TF-MTG-003 v1.0 | 전문가 합동 회의록 (3차) | 2026-03-30*
