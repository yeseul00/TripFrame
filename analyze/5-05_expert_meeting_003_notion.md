# TripFrame 전문가 합동 회의록 (3차)

> **문서 ID**: TF-MTG-003
> **일시**: 2026-03-30
> **참석자**: Expert 1(시장 전략), Expert 2(기술 아키텍처), Expert 3(제품/UX)
> **유형**: Phase 전환 리뷰 (Phase 5 완료 → Phase 6 설계)
> **참조**: Phase 5 완료보고서, TF-MTG-002 결정 #6~#11, Phase 6 초안 (tasks.md)
> **이전 결정**: #11 → 이번 회의 시작 = #12

---

## Agenda A: Phase 5 완료 검증

### A-1. Phase 5 실적 평가

| 참석자 | 평가 |
|--------|------|
| Expert 1 | Phase 5를 23시간 예상 내 완료. Alpha 내부 배포 준비 완료(결정 #9) 달성. 이제 핵심은 "얼마나 빨리 실제 사용자 손에 쥐어주느냐". Phase 6에서 시간 낭비하면 여름 시즌(결정 #10) 놓침. |
| Expert 2 | EAS Dev Build 3차 빌드 성공 — Gradle 의존성 이슈를 리스크 레지스터 버퍼 내 해결. expo-secure-store 마이그레이션 폴백 로직 완비. **Constitution 준수 양호** — Gap 파생 데이터 원칙 유지, RESOLVED 상태는 외부 저장소(useGapStore) 분리. gapKey 안정성 단위 테스트 포함. |
| Expert 3 | 사용자 여정 관점 최대 성과: **이동 체크 탭 통합**(5탭→4탭). Gap 카드 탭 → 교통 옵션 인라인 펼침 → 예약 완료 버튼까지 **단일 화면 완결 루프** 완성. TF-MTG-002에서 제안한 "상시 버튼" 방식 잘 구현됨. |

### A-2. Phase 5 잔여 이슈

| 이슈 | 상태 | 판정 |
|------|------|------|
| Notion DB 등록 (결과서 2개) | 사용자 실행 대기 | Phase 6 시작 전 완료 권고 |
| SDK 업그레이드 (결정 #7) | Dev Build 전환 완료 → 진행 가능 | Phase 6에서 조건부 검토 |
| Expo Router 전환 (결정 #11) | Phase 7~8 예정 | 유지 |

**Expert 2**: SDK 업그레이드 관련 — `react-native-android-widget` SDK 호환성 사전 확인 필요. D-day 위젯이 Phase 6 핵심인데 SDK 문제로 막히면 1~2일 블로킹.

🟡 **누락 발견**: SDK 업그레이드 시점을 Phase 6 D-day 위젯 착수 전에 재판단 필요.

### A-3. 테스트 커버리지 변화

| 계층 | Phase 4 말 | Phase 5 말 | 변화 |
|------|----------|----------|------|
| Core 단위 테스트 | 61개 | 76개 | +15 (gapKey, exportIcal, 마이그레이션) |
| Mobile 단위 테스트 | 5개 | 8개 | +3 (마이그레이션 시나리오) |
| E2E (Playwright) | 97개 | 97개 (재편) | 탭 변경 반영, 동등 커버리지 |
| Maestro (네이티브) | 0개 | 2개 | 신규 |

**Expert 2**: GitHub Actions에서 Playwright + Maestro 모두 돌릴 수 있는지 환경 확인 필요. Maestro는 Android 에뮬레이터 필요 → runner 사양 확인.

**Expert 3**: 클로즈드 베타 10~20명 배포 시 피드백 수집 채널(Google Form + Slack/카카오톡) 사전 설계 필수. 구조화 없으면 분석 불가.

---

## Agenda B: Phase 5→6 전환 리스크 분석

### B-1. D-day 위젯 기술 리스크

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| `react-native-android-widget` SDK 호환성 실패 | 위젯 구현 블로킹 | 중간 | 착수 전 호환성 체크. 실패 시 SDK 업그레이드 선행 |
| 위젯 ↔ 앱 데이터 공유 불가 | SharedPreferences 접근 필요 | 중간 | `expo-shared-preferences` 또는 네이티브 모듈 브릿지 |
| 위젯 업데이트 주기 제한 (Android 30분~) | D-day 실시간 불가 | 낮음 | D-day 특성상 일 단위 갱신 충분. 리스크 수용 |
| iOS 위젯 미지원 (Mac 없음) | 플랫폼 비대칭 | 확정 | Android 우선. iOS는 Mac 확보 후 |

**Expert 2**: EAS Dev Build에서 Config Plugin 동작은 Phase 5에서 검증됨(expo-secure-store 성공). 핵심 불확실성은 **위젯에서 앱의 encryptedStorage 데이터를 읽을 수 있느냐**. 위젯은 별도 프로세스 → SharedPreferences 브릿지 필요.

**Expert 1**: 위젯 기술 리스크가 2~3일 잡아먹힐 수 있으므로 **위젯 POC를 먼저, 나머지 병렬 진행**이 안전. POC 실패 시 대안 플랜도 필요.

🟡 **누락 발견**: 위젯 ↔ encryptedStorage 데이터 브릿지 설계가 Phase 6 초안에 없음.

### B-2. CI/CD 구축 리스크

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| GitHub Actions runner Android 에뮬레이터 시작 실패 | Maestro CI 불가 | 중간 | `macos-latest` runner. 비용 확인 |
| GitHub Actions 무료 분 소진 | CI 중단 | 낮음 | 월 2,000분. Playwright만 Ubuntu runner 충분 |
| EAS Build + GitHub Actions 이중 트리거 | 크레딧 낭비 | 낮음 | 결정 #6 유지: main 머지 시에만 |

**Expert 2**: CI/CD는 2단계로. ① Playwright 웹 테스트 자동화(Ubuntu runner, 저비용) ② Maestro CI는 **클로즈드 베타 이후 재평가**.

**Expert 3**: CI/CD는 사용자에게 보이는 가치가 아님. 최소 수준(PR마다 테스트)으로 충분.

### B-3. 앱 스토어 준비 리스크

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| 개인정보처리방침 페이지 미준비 | 스토어 등록 불가 | 확정 | GitHub Pages 정적 페이지 필수 |
| 스크린샷 품질 미달 | 스토어 첫인상 저하 | 중간 | 실기기 우선 캡처 |
| Sentry 연동 시 성능 저하 | 앱 시작 시간 증가 | 낮음 | Lazy init + 샘플링 조정 |

**Expert 1**: 개인정보처리방침은 Google Play Internal Testing 필수 조건. 개인정보보호법 제30조 충족 필요.

### B-4. 타임라인 리스크 (여름 시즌 목표)

| 마일스톤 | 목표 시점 | 남은 기간 |
|---------|---------|---------|
| Phase 6 시작 | 2026-03-30 (오늘) | — |
| Phase 6 완료 (클로즈드 베타) | 2026-04 말 ~ 05 초 | ~4~5주 |
| Phase 7 시작 | 2026-05 초 | ~5주 |
| Phase 7 완료 (앱 스토어 출시) | 2026-06 말 ~ 07 초 | ~12~13주 |
| 여름 시즌 피크 | 2026-07~08 | 13~17주 |

**Expert 1**: Phase 6를 4~5주 내에 끝내야 여름 시즌 목표 생존. 범위를 타이트하게.

---

## Agenda C: Phase 6 설계 방향성

### C-1. Phase 6 핵심 테마: "클로즈드 베타 + 리텐션 기반"

| 참석자 | 의견 |
|--------|------|
| Expert 1 | Phase 6 최종 산출물 = **클로즈드 베타 10~20명 배포**. 최소 조건만 포함. D-day 위젯 필수. CI/CD 최소(Jest+Playwright). **앱 스토어 정식 등록은 Phase 7 이월**, Phase 6은 EAS Internal Distribution으로 충분. |
| Expert 2 | 동의하되 **SDK 업그레이드를 Phase 6 초반에 배치** 강력 권고. ① 위젯 라이브러리 호환성 ② expo-secure-store 최신 안정성 ③ Phase 7 이후 누적 시 마이그레이션 비용 급증. 결정 #7의 "별도" 시점이 지금. 단, **SDK 업그레이드 단독 태스크 — 다른 기능과 동시 금지**. |
| Expert 3 | 클로즈드 베타 성공 조건 = **피드백 구조**. ① 피드백 수집 채널(Google Form + 카카오톡) ② 항목 구조화(5점 척도 + 자유 의견) ③ 알려진 미완성 기능 목록(테스터 혼란 방지). 3가지 없으면 유의미한 데이터 안 나옴. |

### C-2. 주요 논쟁 + 결정

#### 🔴 C레벨 결정 #12: SDK 업그레이드 전략

| Expert 1 | 견제: 2~3일 잡아먹히면 타임라인 위험. 호환성 문제 실제 발생 시에만 진행이 ROI 높음. |
| Expert 2 | 포함 필수. 뒤로 밀수록 마이그레이션 비용 누적. |
| Expert 3 (중재) | "위젯 라이브러리 설치 시 호환성 체크 → 비호환 시 즉시 단독 업그레이드" 조건부 배치. |

- **결정**: 위젯 라이브러리 설치 시 SDK 호환성 체크 → 비호환 시 즉시 SDK 업그레이드 단독 실행 (동시 금지)
- **합의**: Expert 3 중재안 채택 (3/3)
- **버퍼**: SDK 업그레이드 발생 시 +1일

#### 🔴 C레벨 결정 #13: Phase 6 배포 방식

- **결정**: EAS Internal Distribution(APK 직접 배포) + Google Play Internal Testing 트랙 사전 설정
- **합의**: 만장일치 (3/3)
- **Phase 7 이월**: Google Play 정식 등록 + 앱 스토어 메타데이터

#### 🔴 C레벨 결정 #14: Sentry 연동 시점

| Expert 2 | Phase 6 필수. 베타 크래시 리포트 없이는 디버깅 불가. |
| Expert 1 | 견제: 10~20명이면 console.log + 직접 보고도 가능. |
| Expert 3 | Expert 2 편: "갑자기 꺼졌어요"만 들으면 아무것도 못 함. 무료 티어(5K 이벤트/월) 충분. |

- **결정**: Phase 6 Sentry 기본 연동 (크래시 리포팅만). 성능 모니터링은 Phase 7.
- **합의**: 다수 (2/3). Expert 1 조건부 동의(무료 티어 확인).

#### 🔴 C레벨 결정 #15: 개인정보처리방침 페이지

- **결정**: Phase 6에서 최소 정적 페이지 작성 + GitHub Pages 배포. 개인정보보호법 제30조 충족.
- **합의**: 만장일치 (3/3)
- **누락 발견 기반**: Google Play Internal Testing에도 개인정보처리방침 URL 필수.

#### 🔴 C레벨 결정 #16: D-day 위젯 실패 대안

| Expert 2 | `react-native-android-widget` 실패 시: Expo Notification daily digest 또는 Phase 7 이월. |
| Expert 1 | 알림은 위젯 대비 리텐션 50% 이하. 하지만 위젯 없이 베타 배포 → 정식 출시에 추가도 가능. |
| Expert 3 | 홈 화면 **D-day 배너 카드**(앱 내 UI) Quick Win 대안. 위젯만큼은 아니지만 앱 진입 시 즉시 노출. |

- **결정**: 위젯 POC에 **2일 타임박스**. 실패 시 ① 홈 화면 D-day 배너 카드 Quick Win 구현 ② 위젯 Phase 7 이월.
- **합의**: 만장일치 (3/3)

### C-3. Phase 6 확정 태스크 구조

```
Phase 6.0 인프라 [P0, 순차]
  └─ TASK-100: SDK 호환성 체크 + 조건부 업그레이드 · 2~4h
  └─ TASK-101: CI/CD 기초 (GitHub Actions: Jest + Playwright) · 3h

Phase 6.1 D-day 위젯 [P0, TASK-100 완료 후]
  └─ TASK-102: D-day 위젯 POC + 데이터 브릿지 · 5h (2일 타임박스)
  └─ TASK-103: D-day 위젯 완성 OR 홈 D-day 배너 (102 결과) · 3~4h

Phase 6.2 품질 + Quick Win [TASK-101 완료 후, 병렬 가능]
  └─ TASK-104: Sentry 기본 연동 · 2h
  └─ TASK-105: 여행 카드 숨기기 (isHidden) · 2h

Phase 6.3 베타 배포 [모두 완료 후]
  └─ TASK-106: 개인정보처리방침 + Google Play Internal Testing 트랙 · 2h
  └─ TASK-107: 클로즈드 베타 배포 + 피드백 채널 + 설문 설계 · 3h
  └─ TASK-108: Phase 6 완료보고서 · 1h

예상: 23~27h (~3~4 working days, SDK 업그레이드 시 +1일)
```

### C-4. 스크린샷 구성안 (Phase 7 예약)

| 순서 | 스크린샷 | 카피 |
|------|---------|------|
| 1 | 홈 화면 (D-day 배지 + 여행 카드) | "다가오는 여행, 한눈에" |
| 2 | 이동 체크 탭 (DANGER + RESOLVED) | "놓치기 쉬운 이동 구간을 자동 감지" |
| 3 | 역산 탭 (출발 시각 + 대안 교통수단) | "집에서 몇 시에 나가야 하죠?" |
| 4 | iCal Export 화면 | "Google Calendar에 바로 추가" |
| 5 | D-day 위젯 (홈 화면) | "여행까지 D-7, 준비됐나요?" |

---

## C레벨 결정 사항 요약

| # | 주제 | 결정 | 전문가 합의 |
|---|------|------|-----------|
| **12** | SDK 업그레이드 전략 | 위젯 라이브러리 호환성 체크 → 비호환 시 단독 업그레이드 | Expert 3 중재안 (3/3) |
| **13** | Phase 6 배포 방식 | EAS Internal Distribution + Google Play Internal Testing 트랙 | 만장일치 (3/3) |
| **14** | Sentry 연동 시점 | Phase 6 기본 연동 (크래시만). 성능 모니터링 Phase 7 | 다수 (2/3) |
| **15** | 개인정보처리방침 | Phase 6 정적 페이지 + GitHub Pages. 개인정보보호법 제30조 | 만장일치 (3/3) |
| **16** | D-day 위젯 실패 대안 | 2일 타임박스. 실패 시 홈 D-day 배너 + 위젯 Phase 7 이월 | 만장일치 (3/3) |

---

## 합의 사항 (결정 불필요)

| 항목 | 합의 내용 | Phase |
|------|---------|-------|
| 카드 숨기기 | Phase 6 Quick Win (3/3 동의) | 6 |
| CI/CD 범위 | Playwright CI만 Phase 6. Maestro CI는 베타 후 재평가 | 6 |
| 앱 스토어 정식 등록 | Phase 7 이월 (메타데이터 + 스크린샷 + 콘텐츠 등급) | 7 |
| 피드백 수집 | 구조화된 설문 (5점 척도 + 태스크 완료율 + 자유 의견) | 6 |
| 스크린샷 5장 구성 | Phase 7 태스크. 소재 화면 UX는 Phase 6 확정 | 7 |
| iOS D-day 위젯 | Mac 확보 후 | 8+ |

---

## 🟡 회의 중 발견된 누락 사항

| # | 누락 항목 | 반영 위치 |
|---|---------|---------|
| 1 | SDK 업그레이드 시점 재판단 | TASK-100 |
| 2 | 위젯 ↔ encryptedStorage 데이터 브릿지 설계 | TASK-102 |
| 3 | D-day 위젯 POC 실패 시 대안 플랜 | 결정 #16 |
| 4 | 피드백 항목 설계 (구조화된 설문) | TASK-107 |
| 5 | 개인정보처리방침이 Internal Testing에도 필수 | 결정 #15 |

---

*TF-MTG-003 v1.0 | 전문가 합동 회의록 (3차) | 2026-03-30*
