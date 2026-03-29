# TripFrame 종합 리뷰 보고서

> **문서 ID**: TF-REVIEW-000 (통합)
> **작성일**: 2026-03-29
> **대상**: TripFrame Phase 1~3 완료, Phase 4 계획 단계
> **리뷰어**: 시장 전략 전문가 / 기술 아키텍처 전문가 / 제품·UX 전문가

---

## 1. Executive Summary

TripFrame은 **"여행 일정의 빈 칸을 찾아주는 앱"**으로, 글로벌 여행 앱 시장(2026년 162억 달러, CAGR 15.6%)에서 어떤 주요 앱도 다루지 않는 **Pre-departure 이동 로지스틱** 영역에 특화된 포지셔닝을 취하고 있습니다.

3개 Phase를 거쳐 역산 엔진, 공백 감지, 다중 여행 관리, 이벤트 CRUD, 교통수단 비교, 대안 교통수단 Δ시간 비교까지 구현했으며, E2E 테스트 86건 100% 통과의 품질 수준을 달성했습니다.

### 총점

| Expert | 영역 | 점수 | 핵심 한 줄 |
|--------|------|------|-----------|
| #1 | 시장 전략 | 4.0 / 5.0 | 명확한 니치, 수익 모델과 D-day 위젯으로 약점 상쇄 가능 |
| #2 | 기술 아키텍처 | 3.75 / 5.0 | 아키텍처 최상급, 보안 성숙도가 유일한 심각 약점 |
| #3 | 제품/UX | 3.5 / 5.0 | 핵심 가치 명확, 온보딩 전무와 포장 미완이 출시 장벽 |
| **종합** | | **3.75 / 5.0** | **강한 기반, 출시 전 3대 필수 과제 해결 필요** |

---

## 2. 3명 전문가 공통 발견사항

### 2.1 공통 강점 (3명 모두 인정)

**역산 엔진의 6단계 투명성** — Constitution VI-4 "역산 근거 공개" 원칙이 앱의 최고 차별화 포인트를 만들었습니다. "왜 이 시간인지"를 6단계로 보여주는 UX는 어떤 경쟁 앱에서도 제공하지 않습니다. (Expert 3: 4.5/5.0 최고점)

**@tripframe/core 플랫폼 독립성** — 런타임 의존성 date-fns 1개만으로, 모바일/웹/서버 어디서든 실행 가능합니다. Expert 1의 듀얼 트랙(B2C + B2B) 전략과 Expert 2의 npm 배포 제안이 모두 이 구조 덕분에 가능합니다.

**E2E 테스트 86건 100% 통과** — 요구사항 ID(REQ-FR)와 테스트 케이스(TC)의 양방향 추적성, 페르소나 3종 검증, 사용자 테스트 피드백 즉시 반영(BUG-001~004) 등 개인 프로젝트 수준을 넘어서는 품질 관리 체계입니다.

**피드백 반영 속도** — Phase 3에서 사용자 테스트 → 버그 발견 → 즉시 코드 수정 → E2E 재검증의 루프가 하루 안에 완료되었습니다. (Expert 3: 5/5 만점)

### 2.2 공통 약점 — 즉시 해결 3대 과제

3명의 전문가 모두가 독립적으로 지적한 3가지 이슈입니다.

**과제 1: 설정 미적용 (3/3 지적)**

| Expert | 관점 | 판정 |
|--------|------|------|
| #1 시장 | 설정이 안 되면 개인화 추천 불가 → 수익 모델(Freemium Pro) 차별화 불가 | Critical |
| #2 기술 | TD-02로 등록. `useSettingsStore` + Core 함수 시그니처 변경 필요 | Critical |
| #3 UX | "고장난 기능" 인상 → 앱 신뢰도 훼손 | Critical |

**과제 2: AsyncStorage 평문 저장 (2/3 직접 지적, 1/3 간접 관련)**

| Expert | 관점 | 판정 |
|--------|------|------|
| #1 시장 | (간접) 보험 연계 시 개인정보 처리에 영향 | High |
| #2 기술 | TD-04. Constitution VIII-1 위반. 개인정보보호법 제29조 저촉 소지 | Critical |
| #3 UX | 출시 전 필수 해결 항목으로 분류 | Critical |

**과제 3: 온보딩 부재 (2/3 직접 지적, 1/3 간접 관련)**

| Expert | 관점 | 판정 |
|--------|------|------|
| #1 시장 | (간접) 사용 빈도 한계 문제의 일부 — 첫 진입 이탈 방지 필요 | High |
| #2 기술 | IDEA-015에 등록되어 있으나 Phase 미배정 | Medium |
| #3 UX | 여정 5에서 1/5 최저점. "설치 후 이탈률 직결" | P0 |

---

## 3. Expert별 상세 점수

### 3.1 Expert 1: 시장 전략

| 평가 항목 | 점수 | 코멘트 |
|-----------|------|--------|
| 시장 차별성 | ★★★★☆ | Pre-departure 니치 확인, 경쟁 앱과 비겹침 |
| 시장 규모/성장성 | ★★★★☆ | B2B Track 추가 시 TAM 확대 가능 |
| 수익화 가능성 | ★★★★☆ | 3단 퍼널: Affiliate + 보험 연계 + Freemium |
| 방어 가능성 | ★★★★☆ | 교통 데이터 축적 + Import/Export + 오프라인 |
| 사용 빈도/리텐션 | ★★★★☆ | D-day 위젯으로 "항상 켜진" 접점 확보 |
| 타이밍 | ★★★★☆ | 포스트 코로나 수요 + AI 트렌드 |

핵심 제안: D-day 위젯(사업 생존 요건), 보험 연계(수익원), Import/Export(해자+편의), 듀얼 트랙(B2C+B2B)

### 3.2 Expert 2: 기술 아키텍처

| 평가 항목 | 점수 | 코멘트 |
|-----------|------|--------|
| 아키텍처 건전성 | ★★★★★ | Constitution 준수, Logic-UI 완전 분리 |
| Constitution 정합성 | ★★★★☆ | 경미 위반 1건 (FreeTimeResult 타입 위치) |
| 테스트 성숙도 | ★★★★☆ | E2E 86건 100%, 네이티브/통합 미검증 |
| 코드 품질 | ★★★★☆ | 원칙 준수 우수, ESLint 자동화 부재 |
| 보안 성숙도 | ★★★☆☆ | 평문 저장 이슈 (Constitution 위반) |
| 확장 준비도 | ★★★★☆ | Core 분리 우수, AsyncStorage 한계 예고 |

핵심 제안: expo-secure-store 즉시 도입, ESLint+CI 자동화, Development Build 전환

### 3.3 Expert 3: 제품/UX

| 평가 항목 | 점수 | 코멘트 |
|-----------|------|--------|
| 핵심 기능 완결성 | ★★★★☆ | 역산+공백감지 완성, 설정 미적용 감점 |
| 사용자 여정 품질 | ★★★☆☆ | CRUD 우수, 온보딩 전무 + 예약 후 추적 부재 |
| 정보 구조/네비게이션 | ★★★☆☆ | 5탭 기능적, 공백감지↔제안카드 역할 중복 |
| 디자인 시스템 | ★★★★☆ | 색상·타이포 체계적, 라이트 테마 미지원 |
| 피드백 반영도 | ★★★★★ | 테스트→수정→재검증 속도 탁월 |
| 출시 준비도 | ★★☆☆☆ | Phase 4 후 1~2 Phase 추가 필요 |

핵심 제안: 온보딩 3장 스와이프(P0), 예약 후 "해결됨" 표시, 공백감지+제안카드 탭 통합 검토

---

## 4. 기술 부채 통합 인벤토리

| ID | 항목 | 심각도 | 관련 Expert | Phase 대응 |
|----|------|--------|------------|-----------|
| TD-01 | Google OAuth redirect 오류 | Critical | #2, #3 | Phase 4 (URL 등록) |
| TD-02 | 설정 UI 미적용 (저장/엔진 연동 없음) | Critical | #1, #2, #3 | Phase 4 최우선 |
| TD-03 | Development Build 부재 | Critical | #2, #3 | Phase 4~5 |
| TD-04 | AsyncStorage 평문 저장 | Critical | #2, #3 | Phase 4 (expo-secure-store) |
| TD-05 | 마지막 구간 감지 미지원 (TC-010) | High | #2 | Phase 4 |
| TD-06 | ESLint 자동 집행 부재 | High | #2 | Phase 4 |
| TD-07 | FreeTimeResult 타입 위치 (III-3 위반) | Medium | #2 | Phase 4 |
| TD-08 | E2E 셀렉터 취약성 (getByText 의존) | Medium | #2 | Phase 5 |
| TD-09 | i18n 미구현 (하드코딩 한국어) | Low | #2, #3 | Phase 6+ |
| UX-01 | 온보딩 플로우 전무 | Critical | #1, #3 | Phase 4 후반 |
| UX-02 | "공백감지" 메뉴명 직관성 부족 | High | #3 | Phase 4 |
| UX-03 | 예약 후 추적 플로우 없음 | High | #3 | Phase 5 |
| UX-04 | 공백감지↔제안카드 역할 중복 | Medium | #3 | Phase 5 |
| BIZ-01 | 수익 모델 미설계 | High | #1 | Phase 4~5 |
| BIZ-02 | D-day 위젯 미구현 | High | #1, #3 | Phase 5 |

---

## 5. Phase 4 권고 태스크 (리뷰 결과 반영)

기존 Phase 4 계획에 리뷰 결과를 반영한 수정 우선순위입니다.

### 기존 Phase 4 계획 (유지)

- ✅ useSettingsStore + 역산/제안 로직 연동 (TD-02)
- ✅ Google OAuth Redirect URL 등록 (TD-01)
- ✅ 공백감지 여유시간 UI (calculateFreeTime 연동)
- ✅ 날짜 Picker (DateTimePicker)
- ✅ 교통 데이터 내장 DB (TransportRoute 구조화)

### 리뷰로 인한 추가 태스크 (Phase 4에 삽입 권고)

| 우선순위 | 신규 태스크 | 근거 | 난이도 |
|---------|-----------|------|--------|
| P0 | expo-secure-store 민감 데이터 암호화 | Expert 2: Constitution VIII-1 위반, 법적 리스크 | 중 |
| P0 | 온보딩 3장 스와이프 (최소 형태) | Expert 3: 설치 후 이탈률 직결 | 중 |
| P1 | ESLint 규칙 추가 (no-any, max-lines, no-restricted-imports) | Expert 2: Constitution 자동 집행 | 하 |
| P1 | FreeTimeResult 타입 → types/trip.ts 이동 | Expert 2: III-3 위반 해소 | 하 |
| P1 | "공백감지" → "이동 체크" 등 메뉴명 변경 | Expert 3: 사용자 피드백 | 하 |
| P2 | iCal/CSV Export 순수 함수 | Expert 1: Import/Export 해자 시작점 | 하 |
| P2 | 보험 제안 카드 UI (제안카드 패턴 재사용) | Expert 1: 수익원 선배치 | 하 |
| P3 | D-day 위젯 설계 문서 (Phase 5 선행 설계) | Expert 1: 사업 생존 요건 | 중 |

### Phase 5에서 필수

1. Development Build 전환 + 네이티브 테스트
2. 예약 후 "해결됨" 표시 플로우
3. GitHub Actions CI/CD
4. 공백감지+제안카드 탭 통합 검토
5. D-day 위젯 구현
6. AsyncStorage 성능 측정 → SQLite 전환 시점 결정

---

## 6. 전략적 방향 종합

### 6.1 단기 (Phase 4~5, 6개월)

Track A (B2C 소비자 앱)에 집중합니다. 설정 실기능화, 보안 강화, 온보딩, 수익 모델 선배치(보험/Affiliate)를 완료하고, D-day 위젯으로 리텐션 기반을 마련합니다.

### 6.2 중기 (Phase 6~7, 6개월~1년)

Track B (B2B 엔진 API)를 병행합니다. @tripframe/core를 npm에 독립 배포하고, OTA/여행사에 역산 API를 라이선싱합니다. Track A에서 축적된 교통 데이터가 Track B의 가격 프리미엄을 만듭니다.

### 6.3 방어 전략

3중 해자: 교통 데이터 크라우드소싱(시간에 비례), Import/Export 데이터 브리지(네트워크 효과), 오프라인 우선 아키텍처(전환 비용)

---

## 7. 산출물 목록

| 문서 ID | 파일명 | 형식 | 내용 |
|---------|--------|------|------|
| TF-REVIEW-000 | 본 문서 | md + docx | 3명 통합 보고서 |
| TF-REVIEW-001 | Expert1_MarketStrategy_Review | md + docx | 시장 전략 리뷰 |
| TF-REVIEW-002 | Expert2_TechArchitecture_Review | md + docx | 기술 아키텍처 리뷰 |
| TF-REVIEW-003 | Expert3_ProductUX_Review | md + docx | 제품/UX 리뷰 |

---

*TF-REVIEW-000 v1.0 | 3명 전문가 종합 리뷰 | 2026-03-29*
