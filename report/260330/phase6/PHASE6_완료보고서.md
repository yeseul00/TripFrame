# TripFrame Phase 6 완료보고서

**작성일**: 2026-04-22  
**Phase**: Phase 6 — D-day 위젯 · CI/CD · 클로즈드 베타  
**태스크**: TASK-100 ~ TASK-111  
**결과**: Phase 6 전체 완료 ✅ → 클로즈드 베타 배포 준비 완료

---

## 1. Phase 6 목표 및 달성 결과

| 목표 | 달성 여부 |
|------|-----------|
| D-day 홈 화면 위젯 (Android) | ✅ 완료 |
| GitHub Actions CI 파이프라인 | ✅ 완료 |
| Supabase Phase B (로그인·동기화·Realtime) | ✅ 완료 |
| 크래시 리포팅 (Sentry) | ✅ 코드 완료 (DSN 등록은 Phase 7) |
| 여행 카드 숨기기 | ✅ 완료 |
| 개인정보처리방침 + GitHub Pages | ✅ 완료 |
| 베타 배포 가이드 + 설문 구조 | ✅ 완료 |
| Alpha → 클로즈드 베타 전환 | ✅ 완료 |

---

## 2. 태스크별 완료 현황

| 태스크 | 제목 | 완료일 | 비고 |
|--------|------|--------|------|
| TASK-100 | Expo SDK 호환성 체크 | 2026-03-30 | SDK 54 + widget ^0.20.1 호환 확인 |
| TASK-101 | GitHub Actions CI | 2026-03-30 | PR 트리거, core+mobile 테스트 |
| TASK-102 | D-day 위젯 POC | 2026-04-07 | 경로 A 선택, SharedPreferences 브릿지 |
| TASK-103 | D-day 위젯 완성 (경로 A) | 2026-04-22 | OPEN_URI 딥링크, Maestro 시나리오 |
| TASK-104 | Sentry 기본 연동 | 2026-04-22 | 코드 완료, DSN은 Phase 7 등록 |
| TASK-105 | 여행 카드 숨기기 | 2026-04-22 | hiddenTripIds persist, 단위 테스트 5개 |
| TASK-106 | 개인정보처리방침 + GitHub Pages | 2026-04-22 | yeseul00.github.io/TripFrame |
| TASK-107 | 클로즈드 베타 배포 가이드 | 2026-04-22 | beta-guide.md, 설문 구조 13문항 |
| TASK-108 | Phase 6 완료보고서 | 2026-04-22 | 본 문서 |
| TASK-109 | Supabase 인프라 | 2026-04-22 | DB 스키마, RLS, OAuth 설정 |
| TASK-110 | Supabase Phase B 코드 | 2026-04-22 | Store ↔ Supabase 동기화, Realtime |
| TASK-111 | OAuth 수정 | 2026-04-22 | COOP 이슈, 406/409 수정 |

---

## 3. 주요 기술 결정 및 구현 결과

### 3-1. D-day 위젯 (TASK-102, 103)

- **POC 결과**: `react-native-android-widget ^0.20.1` + Expo SDK 54 호환 확인 → **경로 A** 채택
- **데이터 브릿지**: `useTripStore → AsyncStorage(WIDGET_DATA_KEY) → widgetTaskHandler`
- **배경색 수정**: Android 12+ 투명 배경 이슈 → `light/dark` 양쪽 JSX 전달로 해결
- **딥링크**: `OPEN_URI` clickAction → `tripframe://trip/{tripId}` → `selectTrip` + 일정 탭 이동
- **웹 호환**: `metro.config.js` resolveRequest로 `react-native-android-widget` → no-op stub 교체

### 3-2. Supabase Phase B (TASK-109, 110, 111)

- **인증**: Google OAuth 웹에서 COOP 정책 이슈 → `useGoogleAuth.web.ts` 분리 (redirect 방식)
- **세션 감지**: `detectSessionInUrl: Platform.OS === 'web'` 플랫폼 분기
- **프로필 생성**: `upsert + ignoreDuplicates: true` → 동시 호출 409 충돌 방지
- **조회**: `.single()` → `.maybeSingle()` 교체 → 406 에러 수정
- **Store ↔ DB 동기화**: `_userId` 모듈 변수 패턴 + `syncEngine.enqueue` 연결
- **Realtime**: `postgres_changes` 구독 → `fetchRemoteTrips` → `mergeTripsOnLogin` (remote 우선)
- **로그인 시 병합**: remote 우선, local-only Trip 보존 (LWW)

### 3-3. 품질 개선

- **Sentry**: 코드 완료 (init + Sentry.wrap), 웹 빌드 시 sentry-stub.ts로 교체
- **여행 카드 숨기기**: `hiddenTripIds[]` persist → 앱 재시작 후 상태 유지
- **app.json**: `versionCode: 1` 추가, 불필요한 권한(READ/WRITE_EXTERNAL_STORAGE) 제거

---

## 4. 테스트 현황

| 테스트 유형 | 결과 |
|-------------|------|
| Core 단위 테스트 (Jest) | ✅ 전체 통과 |
| Mobile 단위 테스트 (Jest) | ✅ 전체 통과 (hiddenTrips 5개 포함) |
| E2E Playwright | ✅ **98/98 통과** |

---

## 5. 개인정보처리방침

- **URL**: https://yeseul00.github.io/TripFrame/privacy-policy
- 개인정보보호법 제30조 필수 항목 전체 포함
- GitHub Pages (Jekyll) 자동 배포 (`docs/` → Pages)

---

## 6. 클로즈드 베타 준비 현황

| 항목 | 상태 |
|------|------|
| 개인정보처리방침 | ✅ 게시 완료 |
| 베타 테스터 설치 가이드 | ✅ `docs/beta-guide.md` |
| 피드백 설문 구조 | ✅ `docs/beta-survey-structure.md` (13문항) |
| EAS preview 빌드 | ⏳ 사용자 실행 필요 |
| Google Forms 설문 생성 | ⏳ 사용자 실행 필요 |
| 카카오 오픈채팅방 개설 | ⏳ 사용자 실행 필요 |
| Google Play Console 등록 | ⏳ 사용자 실행 필요 |

---

## 7. Phase 7 이월 사항

| 항목 | 사유 |
|------|------|
| Sentry DSN 등록 (EAS Secrets) | DSN 미발급 |
| 성능 모니터링 (Sentry tracesSampleRate) | TF-MTG-003 결정 #14 — Phase 7 |
| iOS 지원 | Phase 7 |
| 메일 연동 / e-티켓 스캔 | Phase 7 |
| 항공편 실시간 조회 | Phase 7 |
| 제안 카드 (SuggestionScreen) 완성 | Phase 7 |
| 어필리에이트 예약 링크 | Phase 7 |
| 도시 템플릿 | Phase 7 |
| App Store 정식 출시 | Phase 7 |

---

## 8. 저장소 정보

- **GitHub**: https://github.com/yeseul00/TripFrame
- **EAS Project**: 19220b85-672f-478e-9966-280e78742de9 (seuldoo)
- **Supabase Project**: mzxwadydspfvefcqtspt.supabase.co
- **GitHub Pages**: https://yeseul00.github.io/TripFrame

---

*Phase 6 완료 — 클로즈드 베타 배포 준비 완료*
