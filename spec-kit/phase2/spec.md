# Feature Specification: TripFrame Phase 2

**Feature**: `002-tripframe-phase2`
**Branch**: `002-tripframe-phase2`
**Status**: Planning
**Created**: 2026-03-27
**Depends On**: `001-tripframe` (Phase 1 complete ✅)

---

## 1. Overview

### Phase 1 완료 현황

Phase 1 MVP는 2026-03-27 완료됐습니다. 현재 제한사항:

- 로컬 데이터만 지원 (클라우드 동기화 없음)
- 단일 사용자 (인증 없음)
- 정적 데이터 (수동 입력만 가능)
- 이동 옵션 비교 없음

### Problem Statement

Phase 1이 "무엇을 준비해야 하나"를 답했다면, Phase 2는 다음을 답합니다:

- "다른 기기에서도 내 여행 계획을 볼 수 있나?" → 클라우드 동기화 없음
- "하카타에서 유후인 가는 방법, 한눈에 비교하고 싶다" → 이동수단 비교 UI 없음
- "대형 캐리어를 끌고 다녀서 택시가 편한데, 내 상황에 맞는 추천을 받고 싶다" → 개인 설정 없음

### Solution

Google/Apple 소셜 로그인 → Supabase 클라우드 동기화 → 설정 기반 이동수단 추천.

**전환 포인트**:

| 항목 | Phase 1 | Phase 2 |
|------|---------|---------|
| 저장소 | 로컬 전용 | 클라우드 동기화 |
| 사용자 | 익명 | 인증됨 |
| 데이터 | 정적 목 데이터 | 사용자 데이터 |
| 추천 | 없음 | 설정 기반 |

---

## 2. User Stories

### US-001: 소셜 로그인
> "여러 디바이스에서 내 여행 계획을 보고 싶다"

As a user, I want to sign in with Google or Apple
So that my travel data is tied to my identity and accessible everywhere.

**Acceptance Criteria**:
- Google 계정으로 3초 내 로그인 완료
- 로그인 성공 시 사용자 프로필 표시 (이름, 이메일, 사진)
- 토큰 만료 시 자동 갱신 (사용자 개입 없음)
- 로그아웃 기능 제공

### US-002: 클라우드 동기화
> "폰을 바꿔도 내 여행 계획이 그대로 남아있었으면 좋겠다"

As a user, I want my trip data to sync to the cloud
So that I can access it from any device.

**Acceptance Criteria**:
- Trip 생성/수정 시 3초 내 동기화
- 오프라인에서 편집 후 온라인 전환 시 자동 업로드
- 동시 편집 충돌 시 최신 수정본 유지 (Last Write Wins)

### US-003: 이동수단 비교
> "하카타에서 유후인까지 가는 방법을 한눈에 비교하고 싶다"

As a user, I want to see transport options side by side
So that I can choose the best option for my situation.

**Acceptance Criteria**:
- 공백 구간당 2개 이상 이동 옵션 표시
- 요금, 소요시간, 예약 필요 여부 표시
- 추천 옵션은 퍼플 테두리로 강조
- 예약 링크 포함 ("예약하기" 버튼)
- 인원수 반영 합산 비용 표시

### US-004: 사용자 설정
> "대형 캐리어를 끌고 다녀서 택시가 편하다"

As a user, I want to set my travel preferences
So that recommendations match my actual situation.

**Acceptance Criteria**:
- 짐 크기 설정 (CARRY_ON / LARGE)
- 교통 선호 설정 (PUBLIC / TAXI / ANY)
- 여유도 설정 (TIGHT / RELAXED)
- 설정 변경 시 즉시 추천 순위 재계산
- 설정은 클라우드에 저장되어 디바이스 간 동기화

---

## 3. Requirements

### In-Scope

- [x] Google/Apple 소셜 로그인
- [x] Trip 데이터 클라우드 저장/불러오기
- [x] 이동수단 비교 UI (OptionCard)
- [x] 사용자 설정 화면 (짐 크기, 교통 선호, 여유도)
- [x] 설정 기반 추천 우선순위 조정
- [x] 예약 링크 연동
- [x] 오프라인 우선 로컬 편집

### US-005: 페르소나 기반 검증
> "내 여행 스타일에 맞게 정말 잘 동작하는지 확인하고 싶다"

**Acceptance Criteria**:
- 짐 많은 여행자 → 택시 옵션 1순위 추천
- 알뜰 여행자 → 대중교통 1순위 추천
- 빡빡한 일정 → TIGHT 버퍼 기반 역산 정확도 확인

### US-006: 사용자 피드백
> "불편한 점을 쉽게 전달하고 싶다"

**Acceptance Criteria**:
- 앱 내 피드백 버튼 1탭으로 접근
- 평점(1~5) + 한줄 코멘트 입력
- 제출 후 즉시 확인 메시지

---

### Out-of-Scope (Phase 3+)

- [ ] 예약 이메일 자동 파싱 (Gmail API)
- [ ] 실시간 항공편 지연 알림
- [ ] 패스 경제성 자동 계산
- [ ] AI 기반 활동 추천
- [ ] 공유 여행 (다중 사용자 협업)

---

## 4. References

- Phase 1 archived: `spec-kit/phase1/`
- 상세 설계: `spec-kit/phase2/`
  - `overview.md` — 전체 설계서 (사전 환경 포함)
  - `backend-design.md` — Supabase 아키텍처 상세
  - `api-spec.md` — API 엔드포인트 명세
  - `database-schema.sql` — PostgreSQL 스키마
  - `tasks-detail.md` — 태스크 상세 구현 가이드
