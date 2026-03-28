---
name: speckit-implement
description: spec-kit 문서(spec.md/plan.md/tasks.md)를 참고하여 미완료 태스크를 구현하고 tasks.md를 업데이트한다
argument-hint: "[태스크 ID 또는 Phase, 예: TASK-031 또는 Phase2.1]"
allowed-tools: Read, Edit, Write, Bash, Glob, Grep, Agent
---

## 사전 로딩 (필수)

구현 시작 전 다음 문서를 반드시 읽어라:

- **REQUIRED**: `spec-kit/spec.md` — 기능 명세와 Acceptance Criteria
- **REQUIRED**: `spec-kit/plan.md` — 기술 스택, 아키텍처, 신규 파일 목록
- **REQUIRED**: `spec-kit/tasks.md` — 태스크 목록과 완료 현황 (`[ ]` / `[x]`)
- **REQUIRED**: `spec-kit/constitution.md` — 절대 원칙 (코드 품질 규칙)
- **REFERENCE**: `spec-kit/phase2/` — 상세 설계 문서 (필요 시 참고)

## 실행 범위 결정

`$ARGUMENTS`가 있으면 해당 태스크 또는 Phase만 실행한다.
없으면 tasks.md에서 `[ ]` 상태인 태스크를 순서대로 전부 실행한다.

## 구현 규칙

1. tasks.md의 **Acceptance Criteria 항목 전부**를 만족해야 태스크를 완료로 처리한다
2. constitution.md 규칙을 모든 코드에 적용한다:
   - Logic-UI 분리 (비즈니스 로직은 `packages/core/`에)
   - `any` 타입 금지
   - 함수 1개 ≤ 50줄
   - Zustand only (Redux 금지)
   - date-fns only (다른 날짜 라이브러리 금지)
   - Gap은 저장하지 않고 events에서 항상 계산
3. 각 태스크 완료 즉시 tasks.md에서 `[ ]` → `[x]`로 마킹한다
4. 의존 태스크(`Depends On`)가 미완료이면 선행 태스크부터 처리한다
5. 태스크 완료 후 간단한 완료 보고를 출력하고 다음 태스크로 이동한다

## 완료 후 검증

모든 태스크 실행이 끝나면:

1. spec.md의 Acceptance Criteria 항목과 구현 결과를 대조한다
2. tasks.md 진행 현황 표를 업데이트한다 (완료 수 / 진행률)
3. 실패하거나 스킵된 태스크가 있으면 이유와 함께 명시한다
4. 다음으로 실행할 태스크가 남아있으면 안내한다
