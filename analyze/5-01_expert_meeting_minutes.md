# TripFrame 전문가 합동 회의록

> **문서 ID**: TF-MTG-001
> **일시**: 2026-03-29
> **참석자**: Expert 1(시장 전략), Expert 2(기술 아키텍처), Expert 3(제품/UX)
> **참조 자료**: TF-REVIEW-CLAUDE (Claude Code 리뷰), 사용자 1·2차 피드백
> **형식**: 브레인스토밍 회의 → C레벨 결정 사항 추출

---

## Agenda A: Claude Code 리뷰 반론 — 전문가 응답

### A-1. D-day 위젯 "사업 생존 요건" 표현 (Expert 1 → Claude Code 반론)

- **Expert 1**: 표현 수정 수용. "사업 생존 요건" → **"리텐션 핵심 장치"**로 변경. 본질은 사용 빈도 문제(연 1~3회 사용 앱).
- **Expert 2**: D-day 위젯은 WidgetKit + Dev Build 선행 필요. Phase 4에서는 설계 문서만.
- **합의**: D-day 위젯 → Phase 5 구현. Phase 4 설계 문서만 작성.

### A-2. TD-03 Development Build 심각도 재분류

- **Expert 2**: 부분 수용. 단, expo-secure-store(TD-04)가 Dev Build에 의존 → **TD-04와 TD-03은 의존 관계**.
- 대안: 순수 JS 암호화 래퍼로 TD-04를 해결하면 Dev Build 없이도 가능.
- **🔴 C레벨 결정 #1**: 암호화 방식 선택 (Dev Build + expo-secure-store vs 순수 JS AES 래퍼)
- Expert 2 권고: 옵션 A(Dev Build). 어차피 Phase 5에서 필수이므로 Phase 4 초반에 하는 게 낫다.

### A-3. 탭 통합 구현 난이도

- **Expert 3**: 유효한 지적. 난이도 "중" → **"상"** 재분류.
- **Expert 1**: 대안 — 탭 통합 대신 GapCard에 "비교하기" 딥링크 추가 (Quick Win).
- **합의**: 탭 통합 → Phase 5+ (난이도 상). Phase 4에서 크로스-탭 딥링크만 추가.

### A-4. 보험 UI Phase 4 삽입

- **Expert 1**: Claude Code 지적 수용. 제휴 없이 UI 배치 = "고장난 기능" 재현.
- **합의**: Phase 4에서 타입 필드 예약만 (`insuranceEligible: boolean`). UI는 제휴 확정 후.

### A-5. FreeTimeResult 심각도

- **Expert 2**: 수용. 외부 import 없으면 실질적 영향 낮음.
- **합의**: TD-07 Medium → **Low**. TASK-080과 함께 처리.

---

## Agenda B: 사용자 1차 피드백

### B-1. 택시 비용 모델 (TASK-088)

| 참석자 | 의견 |
|--------|------|
| Expert 2 | `costModel: 'per-vehicle' \| 'per-person'` + `maxPassengers` 필드 추가. 4인 초과 시 2대 계산. |
| Expert 3 | OptionCard에 차량 대수 + 대당 요금 표시 필요 |
| Expert 1 | 베트남 오토바이 택시 등 국가별 예외 → Phase 6 도시 템플릿에서 처리 |

**합의**: TASK-088 스코프 확장 — maxPassengers + 차량 대수 자동 계산 + UI 표시

### B-2. Total 타임라인 뷰 (TASK-089)

| 참석자 | 의견 |
|--------|------|
| Expert 3 | Phase 1에서 있었어야 할 기능. 장기 여행 지원에 필수. |
| Expert 2 | `SectionList` + sticky Day 헤더 + `getItemLayout` 최적화 필요 |
| Expert 1 | 앱 스토어 스크린샷 마케팅에도 유용 |

**합의**: Phase 4 P2 유지. 기술 구현은 SectionList 패턴.

### B-3. 여행 카드 숨기기

- `Trip` 모델에 `isHidden` + `notificationsEnabled` **분리 필드**로 설계
- Phase 5 백로그 유지

### B-4. 공유 기능

- 3가지 시나리오 분류: ① 읽기 전용 보여주기 (90%) ② 협업 편집 ③ 데이터 내보내기
- **🔴 C레벨 결정 #2**: 1차 스코프 선택
  - 전문가 권고: Phase 4 iCal Export → Phase 5 읽기전용 웹링크 → 협업은 사용자 수 확인 후

### B-5. D-day 위젯 여행별 개별 제공

- iOS WidgetKit `IntentConfiguration`으로 Trip 선택 가능
- "D-7: 유후인 버스 예약 오픈!" 같은 **행동 유도 정보** 포함 필수
- Phase 5 설계에 반영

---

## Agenda C: 사용자 2차 피드백

### C-1. 10도시 프레임 템플릿

| 참석자 | 의견 |
|--------|------|
| Expert 1 | 콘텐츠 전략. 온보딩 문제를 구조적으로 해결하는 접근. |
| Expert 3 | 범위 제한 필수: **교통 프레임만** 제공 (관광/식당 제외) → TripFrame 포지션 유지 |
| Expert 2 | `packages/core/src/data/templates/` JSON. 협업자 확보가 선행 조건. |

- **🔴 C레벨 결정 #3**: 협업자 참여 확정 필요. 솔로 시 3도시 축소. 범위는 **교통 프레임만 (만장일치)**.
- 타이밍: Phase 6

### C-2. 국내 교통 DB 전략

- Claude Code 단계적 접근 동의 (Phase 5 정적 JSON → Phase 6 API)
- **누락 논의**: 시간표 갱신 주기 문제 — 분기별 변경 시 앱 업데이트 강제 여부
- **🔴 C레벨 결정 #4**: 갱신 전략 선택
  - Expert 2 권고: Phase 5 정적 JSON → 사용자 10,000명 시 Supabase 테이블 전환

### C-3. 공항 체크인 정밀화 + 게이트 추산

- 현재 역산: 출발 -90분 → 정밀화 후: 출발 -130분 (40분 차이)
- 규모: 국내 공항 7개 + 항공사 20개 = **~100 레코드** (정적 JSON)
- 게이트 추산: 터미널별 **평균 도보 시간**으로 근사 (실제 게이트는 당일 확정)
- **🔴 C레벨 결정 #5**: Phase 5에서 국내 시작 → Phase 6 해외 확장. 전문가 합의 완료.

### C-4. 항공사 DB 규모

- 한국발 상위 20개 항공사 × 노선유형 3 = ~60 레코드
- 각 레코드에 `lastVerified` 날짜 필드 포함 (오래된 데이터 경고)
- Phase 5에서 AirportProfile과 함께 구현

---

## C레벨 결정 사항 요약

| # | 주제 | 옵션 | 전문가 권고 | 시급도 |
|---|------|------|-----------|--------|
| 1 | TD-04 암호화 방식 | Dev Build + expo-secure-store vs 순수 JS AES | Dev Build (Phase 4 초반) | 🔴 높음 |
| 2 | 공유 기능 1차 스코프 | iCal Export → 웹링크 → 협업 | iCal Export (Phase 4 P2) | 🔴 높음 |
| 3 | 템플릿 전략 | 협업자 확보 + 교통 프레임만 | 솔로 시 3도시 축소 | 🟡 중간 |
| 4 | 교통 DB 갱신 | 정적 JSON → Supabase (10K유저) → API | Phase 5 정적 JSON 시작 | 🟡 중간 |
| 5 | 공항 정밀화 스코프 | 국내 7공항 + 20항공사 → 해외 확장 | Phase 5 시작, ~100 레코드 | 🟡 중간 |

---

## 합의 사항 (결정 불필요)

| 항목 | 합의 내용 | Phase |
|------|---------|-------|
| D-day 위젯 | Phase 5 구현. Phase 4 설계 문서만. "리텐션 핵심 장치"로 재표현. | 5 |
| 탭 통합 | Phase 5+ (난이도 상). Phase 4에서 크로스-탭 딥링크만. | 4→5 |
| 보험 UI | 제휴 확정 후. Phase 4에서 타입 필드만 예약. | 5+ |
| TD-07 | Low 재분류. TASK-080과 함께 처리. | 4 |
| 택시 costModel | maxPassengers + 차량 대수 + UI 표시 확장. 국가별은 Phase 6. | 4 |
| Total 타임라인 | SectionList + sticky 헤더. Phase 4 P2. | 4 |
| 카드 숨기기 | isHidden + notificationsEnabled 분리. Phase 5. | 5 |
| 여행별 D-day | IntentConfiguration + 행동 유도 정보. Phase 5. | 5 |
| 항공사 DB | 20항공사 ~60 레코드 + lastVerified 필드. Phase 5. | 5 |

---

*TF-MTG-001 v1.0 | 전문가 합동 회의록 | 2026-03-29*
