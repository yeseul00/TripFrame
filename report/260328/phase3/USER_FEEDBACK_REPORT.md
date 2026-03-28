# 사용자 테스트 피드백 분석 결과서

**버전**: 1.1
**작성일**: 2026-03-29
**테스터**: 1명 (프로젝트 오너 내부 테스트)
**테스트 환경**: 웹 브라우저 (http://localhost:8082)

---

## 피드백 항목 분류

### 즉시 수정 완료 (버그/Critical UX) ✅

| ID | 위치 | 현상 | 조치 | 상태 |
|----|------|------|------|------|
| BUG-001 | App.tsx | `← 홈` 버튼이 탭 화면 제목과 동일 위치에 겹침 | 공통 헤더 바 추가 (`← 홈` 좌측, 여행명+탭명 중앙) | ✅ 완료 |
| BUG-002 | 일정 탭 | 새 여행 등록 후 일정 탭에 아무 버튼도 보이지 않음 (`return null`) | 빈 일정 empty state + "+ 첫 이벤트 추가" 버튼 추가 | ✅ 완료 |
| BUG-003 | 일정 탭 | 빈 여행에서 이벤트 추가 시 timeline이 없어 저장 안 됨 | `addEvent` store 액션: 빈 trip에서 Day 1 자동 생성 | ✅ 완료 |
| BUG-004 | 역산 탭 | 새 여행 등록 후 역산 탭에 기존 Mock 데이터(유후인)가 표시됨 | `trip.timelines.length === 0` 시 empty state 표시 | ✅ 완료 |

### 백로그 배치 (Phase 4 이후)

| ID | 위치 | 현상/요청 | 분류 | 백로그 ID |
|----|------|---------|------|---------|
| UX-001 | 일정 탭 | 계획 없이 휴가 기간만 입력 → P타입 사용자 지원 | UX 개선 | BUG-002/003으로 이미 기본 지원 구현 |
| UX-002 | 일정 탭 | 여행 기간 변경 기능 (날짜 picker, 형식 검증) | UX 개선 | IDEA-034 |
| UX-003 | 공백감지 | 메뉴 이름 개선 (직관적이지 않음) | 의사결정 필요 | IDEA-031 |
| FR-001 | 공백감지 | 이동 수단 외 여유 시간도 감지해야 함 | 기능 확장 | IDEA-032 |
| BUG-005 | 설정 탭 | 옵션(짐 크기, 교통 선호, 여유도) 선택해도 저장/적용 안 됨 | 기능 미구현 | IDEA-033 |
| BUG-006 | 설정 탭 | 구글 로그인 400 오류: redirect_uri_mismatch | 인프라 설정 | IDEA-035 |

---

## 버그별 상세

### BUG-001: 홈 버튼 겹침 (헤더 레이아웃)
- **발생 위치**: 탭 뷰 전체 (일정/공백감지/제안카드/역산/설정)
- **원인**: `← 홈` 버튼이 `position: absolute, top: 48px`으로 배치되어 각 화면의 `padding-top: 48px` 헤더와 겹침
- **수정 내용**:
  - App.tsx: `absolute` 제거, `flex-row` 공통 헤더 추가
  - 헤더 구조: `[← 홈]` | `[여행명\n탭이름]` | `[ ]`
  - 각 화면: `pt-12` 제거, 중복 제목 텍스트 제거

### BUG-002 + BUG-003: 빈 일정 진입 불가
- **발생 위치**: `MainTimelineScreen.tsx` — `if (!trip || !timeline) return null`
- **원인**: 새 여행은 `timelines: []`로 생성됨. `selectedTimeline()` → `undefined` → 화면 전체 null 반환
- **수정 내용**:
  - `trip.timelines.length === 0` 시 empty state UI 렌더링
  - "+ 첫 이벤트 추가" 버튼 → `EventFormModal(dayIndex=0)` 오픈
  - `useTripStore.addEvent`: `timelines.length === 0`이면 `Day 1` 타임라인 자동 생성

### BUG-004: 역산 탭 기존 데이터 잔류
- **발생 위치**: `ReverseCalcDetailScreen.tsx` — `reverseCalc.anchorTime` fallback
- **원인**: `anchorEvent === null`이면 store의 `reverseCalc` (Mock 데이터)를 사용
- **수정 내용**: `trip.timelines.length === 0` 시 empty state 표시 (fallback 사용 안 함)

---

## 종합 평가

**즉시 수정 버그**: 4/4 완료 ✅
**E2E 테스트 통과**: 85/85 PASS
**백로그 신규 등록**: IDEA-031 ~ IDEA-035 (5건)

### 주요 인사이트

1. **P타입 사용자 지원** — "기간만 먼저 입력 → 이벤트 하나씩 추가" 패턴은 이미 Phase 3로 구현 완료됨. 빈 일정 empty state 추가로 진입 경험 개선.

2. **공백감지 메뉴명** — 사용자가 직관적이지 않다고 느낌. Phase 4 전에 결정 필요. 후보: "일정 체크", "연결 확인", "이동 체크"

3. **설정 기능 미구현** — UI는 있지만 실제 동작하지 않음. 역산/제안 로직에 설정값 반영이 Phase 4의 핵심 태스크가 되어야 함.

4. **구글 로그인 오류** — Supabase Redirect URLs 설정 문제. 배포 환경 URL 등록으로 해결 가능. 개발 환경 테스트 시 `localhost:8082` 추가 필요.

---

## Phase 4 우선순위 제안

1. **P1**: 설정 탭 실제 저장/적용 (IDEA-033) — 역산/제안 정확도에 직접 영향
2. **P1**: 구글 로그인 redirect 해결 (IDEA-035) — 사용자 계정 기능 필수
3. **P2**: 공백감지 여유 시간 추가 (IDEA-032) — `calculateFreeTime()` 이미 구현됨, UI 연동만 필요
4. **P3**: 메뉴명 개선 (IDEA-031) — 의사결정 후 일괄 변경
5. **P3**: 날짜 picker (IDEA-034) — 텍스트 필드 → DatePicker 컴포넌트
