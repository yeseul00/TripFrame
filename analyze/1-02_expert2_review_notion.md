# Expert 2: 기술 아키텍처 전문가 리뷰

> **문서 ID**: TF-REVIEW-002
> **작성일**: 2026-03-29
> **리뷰어**: SW 아키텍처/품질 전문가 (정보관리기술사 수준)
> **대상**: TripFrame Phase 1~3 완료, Phase 4 계획 단계

---

## 1. Executive Summary

> **핵심 결론**: TripFrame의 아키텍처는 프로젝트 규모 대비 매우 성숙한 수준입니다. Constitution 기반 거버넌스, Logic-UI 완전 분리, 86건 E2E 테스트 100% 통과는 개인 프로젝트에서 보기 드문 엔지니어링 규율입니다. 가장 큰 우려는 보안 성숙도(평문 저장)와 Development Build 미전환입니다.

---

## 2. Constitution 준수 상태 감사

| 원칙 | Constitution 조항 | 준수 상태 | 근거 |
|------|-------------------|---------|------|
| Logic-UI 분리 | III-1 | ✅ 완전 준수 | 역산/공백감지/자유시간/대안교통 모두 `packages/core` 순수 함수 |
| 단방향 데이터 흐름 | III-2 | ✅ 준수 | Zustand store → Hook → Component 방향 |
| 타입 안전 | III-3 | ⚠️ 경미 위반 | `FreeTimeResult` 타입이 `types/`가 아닌 `logic/`에 정의 |
| 불변 데이터 | III-4 | ✅ 준수 | spread operator로 새 객체 반환 |
| 오프라인 우선 | III-5 | ✅ 준수 | Core 외부 의존성 0개 (date-fns만) |

---

## 3. 아키텍처 설계 품질

### 3.1 강점

1. **@tripframe/core 제로 플랫폼 의존성** — 런타임 의존성 date-fns 1개만. npm 배포, Node.js 서버 독립 실행, B2B API화 모두 가능
2. **의존 방향 엄격한 단방향성** — Core → Store → Hook → Component → Screen. 순환 참조 이슈 0건
3. **Gap 파생 데이터 설계** — `detectGaps(events)` 호출로 매번 계산. 데이터 정합성 문제 구조적 불가능
4. **spec-kit 거버넌스 체계** — constitution → spec → plan → tasks → implement 순서로 문서 선행, 코드 후행

### 3.2 개선 필요 영역

1. `FreeTimeResult` 타입 위치 → `types/trip.ts`로 이동 필요 (III-3)
2. Phase 4 `useSettingsStore` 도입 시 기존 Core 함수 시그니처 변경 → 테스트 영향 분석 필요
3. Windows 한글 경로 우회(Metro `extraNodeModules`) → CI/팀 환경에서 추가 설정 필요

---

## 4. 기술 부채 인벤토리

### Critical (프로덕션 차단)

| ID | 항목 | 상세 | Phase 4 대응 |
|----|------|------|-------------|
| TD-01 | Google OAuth redirect 오류 | Supabase Redirect URL 미등록 → 로그인 400 | URL 등록만 하면 해결 |
| TD-02 | 설정 미적용 | UI만 존재, 값 저장/엔진 연동 없음 | Phase 4 최우선 과제 |
| TD-03 | Development Build 부재 | 네이티브 기능 테스트 불가 | Phase 4~5 전환 필수 |

### High (신뢰성 영향)

| ID | 항목 | 상세 | 대응 |
|----|------|------|------|
| TD-04 | AsyncStorage 평문 저장 | Constitution VIII-1 위반, 개인정보보호법 리스크 | expo-secure-store 전환 |
| TD-05 | 마지막 구간 감지 미지원 | TC-010 TODO. transport→hotel 이동 구간 누락 | gapEngine.ts 개선 |
| TD-06 | ESLint 자동 집행 부재 | Constitution 규칙이 수동 리뷰에만 의존 | ESLint + CI 구축 |

### Medium / Low

| ID | 항목 | 상세 |
|----|------|------|
| TD-07 | FreeTimeResult 타입 위치 | `logic/` → `types/`로 이동 |
| TD-08 | E2E 셀렉터 취약성 | `getByText()` 의존 → `testID` 전환 필요 |
| TD-09 | i18n 미구현 | 하드코딩 한국어 (REQ-NFR-009) |

---

## 5. 테스트 전략 평가

| 계층 | 현재 상태 | 평가 |
|------|---------|------|
| Unit (Core) | 4개 테스트 파일, 커버리지 80%+ | ✅ 양호 |
| Unit (Persona) | 8건 + 페르소나 시나리오 | ✅ 양호 |
| Unit (Sync) | 7건 (syncEngine + conflictResolver) | ✅ 양호 |
| E2E (Web) | 85~86건 100% 통과 | ✅ 우수 |
| E2E (Native) | 0건 | ❌ 전무 |
| Integration | Supabase 실제 연동 미검증 | ❌ 전무 |
| Performance | 벤치마크 미측정 | ⚠️ 미시행 |
| Security | 암호화 미구현, 침투 테스트 없음 | ❌ 전무 |

### 테스트 추적성

강점: 각 E2E 파일에 `REQ-FR-xxx` 매핑 주석 포함. 요구사항 → TC 양방향 추적 가능.
약점: TC-010(마지막 구간), TC-016~017(자유시간 UI) 미구현.

---

## 6. 보안 성숙도 평가

| 영역 | Constitution 요구 | 현재 상태 | 위험도 |
|------|-----------------|---------|-------|
| 로컬 저장 암호화 | VIII-1 | ❌ 평문 저장 | **높음** |
| API 키 관리 | VIII-3 | ✅ .env 사용 | 낮음 |
| RLS 정책 | VIII-2 | ✅ 설계+배포 완료 | 낮음 |
| 인증 보안 | Supabase Auth | ⚠️ 구현됨, 실기기 미검증 | 중간 |
| 전송 보안 | TLS 1.2+ | ✅ Supabase HTTPS | 낮음 |

### 개인정보보호법 관점 리스크

현재 AsyncStorage에 예약번호, 출발지 주소 등이 평문 JSON으로 저장됨.
개인정보보호법 제29조(안전조치의무)에 저촉될 소지 있음.
`expo-secure-store` 또는 AES 암호화 래퍼 적용 필수.

---

## 7. 확장 준비도

| 확장 유형 | 점수 (5점) | 근거 |
|---------|----------|------|
| 기능 확장 | ★★★★★ | Core 순수 함수 추가만으로 신규 엔진 구현 가능 |
| 웹 플랫폼 | ★★★★☆ | Core 브라우저 직접 실행 가능. NativeWind 재작성 필요 |
| 팀 확장 | ★★★☆☆ | spec-kit 체계 우수, ESLint/CI 부재 |
| 데이터 확장 | ★★★☆☆ | AsyncStorage는 대량 데이터 부적합 |
| 글로벌 확장 | ★★☆☆☆ | i18n 미구현, timezone 처리 미확인 |

---

## 8. 종합 평가

| 평가 항목 | 점수 (5점) | 코멘트 |
|-----------|----------|--------|
| 아키텍처 건전성 | ★★★★★ | Constitution 준수, Logic-UI 완전 분리 |
| Constitution 정합성 | ★★★★☆ | 경미 위반 1건 (FreeTimeResult 타입 위치) |
| 테스트 성숙도 | ★★★★☆ | E2E 86건 100%, 네이티브 미검증 |
| 코드 품질 | ★★★★☆ | 원칙 준수, ESLint 자동화 부재 |
| 보안 성숙도 | ★★★☆☆ | 평문 저장 이슈, RLS는 양호 |
| 확장 준비도 | ★★★★☆ | Core 분리 우수, AsyncStorage 한계 |

**총합: 3.75 / 5.0** — 강한 아키텍처 + 양호한 테스트, 보안과 CI/CD 보강 필요

---

## 9. 권고사항

### Phase 4 즉시 조치

1. ✅ `expo-secure-store` 도입 → 민감 데이터 암호화 (TD-04, Constitution VIII-1)
2. ✅ ESLint 규칙 추가 + CI 자동 검사 (TD-06)
3. ✅ `FreeTimeResult` 타입 이동 (TD-07)

### Phase 5 필수

1. Development Build 전환 + 네이티브 테스트
2. Supabase 통합 테스트 환경
3. GitHub Actions CI/CD (IDEA-026)
4. AsyncStorage 성능 측정 → SQLite 전환 시점 결정

### 장기

1. `@tripframe/core` npm 독립 배포 준비
2. API 버전 관리 전략 (semver for Core)
3. 매 Phase 보안 리뷰 게이트 도입

---

*TF-REVIEW-002 v1.0 | Expert 2: 기술 아키텍처 전문가 | 2026-03-29*
