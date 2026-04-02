# TripFrame — Phase 전환 체크리스트

> Phase 종료 후 다음 Phase 설계를 시작하기 전에 이 체크리스트를 순서대로 완료한다.
> 각 항목을 완료하면 `[x]`로 체크한다.

---

## Step 1 — 현 Phase 종료 확인

### 1-1. 태스크 완료 검증

- [ ] `spec-kit/tasks.md`의 모든 TASK가 `[x]` 상태
- [ ] 미완료 TASK가 있으면 → 다음 Phase로 이월하거나 드롭 결정 후 기록

### 1-2. 코드 품질 체크

```bash
cd tripframe
pnpm --filter @tripframe/core test        # 테스트 커버리지 ≥80% 확인
pnpm --filter @tripframe/core typecheck   # TypeScript 에러 0개 확인
npx playwright test                       # E2E 전체 통과 확인
```

- [ ] 단위 테스트 커버리지 ≥ 80%
- [ ] TypeScript strict 모드 에러 0개
- [ ] E2E 테스트 전체 통과

### 1-3. Constitution 준수 확인

- [ ] `any` 타입 사용 없음
- [ ] 비즈니스 로직이 `packages/core/`에만 있음
- [ ] 단일 함수 50줄 이하
- [ ] Gap이 파생 데이터로만 존재 (직접 저장 없음)

---

## Step 2 — 현 Phase 아카이브

### 2-1. spec-kit 문서 아카이브

```bash
# 현재 활성 문서를 해당 phase 폴더로 복사
# 예: Phase 6 종료 시
cp spec-kit/spec.md spec-kit/phase6/phase6_spec.md
cp spec-kit/plan.md spec-kit/phase6/phase6_plan.md
cp spec-kit/tasks.md spec-kit/phase6/phase6_tasks.md
```

- [ ] `spec-kit/phaseN/phaseN_spec.md` 저장
- [ ] `spec-kit/phaseN/phaseN_plan.md` 저장
- [ ] `spec-kit/phaseN/phaseN_tasks.md` 저장

### 2-2. 완료보고서 작성 (선택 — 주요 Phase만)

- [ ] `analyze/` 폴더에 완료보고서 작성 (형식: `X-XX_phaseN_completion.md`)
- [ ] 주요 결정사항, 변경사항, 이월 항목 기록

### 2-3. Git 커밋 & 원격 동기화

```bash
git add -A
git commit -m "docs: archive Phase N completion and spec-kit docs"
git push origin main
```

- [ ] 커밋 완료
- [ ] `origin/main` push 완료

---

## Step 3 — 다음 Phase 인풋 수집

### 3-1. 이월 항목 정리

- [ ] 미완료 TASK 중 다음 Phase로 이월할 항목 목록 작성
- [ ] 드롭 항목은 이유와 함께 기록

### 3-2. 자문단/전문가 회의 결과 반영

> 새 Phase 설계 전 TF-MTG 회의록이 있으면 먼저 확인

- [ ] `analyze/` 폴더의 최신 회의록 확인
- [ ] 결정된 우선순위 변경사항 파악
- [ ] 기술 결정(TF-TECH-XXX) 반영 여부 확인

### 3-3. 피드백 반영 (운영 중인 경우)

- [ ] `spec-kit/feedback-process.md` 기준으로 태스크 전환 대상 피드백 확인
- [ ] 전환 기준 충족 피드백을 다음 Phase 인풋으로 추가

---

## Step 4 — 다음 Phase 설계

### 4-1. 기능 명세 작성

```bash
./speckit speckit.specify "Phase N+1 핵심 기능 설명"
```

- [ ] `spec-kit/spec.md` 생성 완료
- [ ] 모든 [NEEDS CLARIFICATION] 항목 해소
- [ ] User Story, Acceptance Criteria 작성 완료

### 4-2. (선택) 요구사항 명확화

```bash
./speckit speckit.clarify
```

- [ ] 모호한 요구사항 없음

### 4-3. 기술 계획 수립

```bash
./speckit speckit.plan
```

- [ ] `spec-kit/plan.md` 생성 완료
- [ ] Constitution Article III~IV (아키텍처·기술 스택) 위반 없음
- [ ] 이월 TASK 포함 여부 확인

### 4-4. 태스크 목록 생성

```bash
./speckit speckit.tasks
```

- [ ] `spec-kit/tasks.md` 생성 완료
- [ ] TASK 번호 연속성 확인 (이전 Phase 마지막 번호 +1부터)
- [ ] 의존성 순서 올바름

### 4-5. 일관성 검사

```bash
./speckit speckit.analyze
```

- [ ] spec ↔ plan ↔ tasks 간 충돌 없음

### 4-6. (선택) GitHub Issues 생성

```bash
./speckit speckit.taskstoissues
```

- [ ] GitHub Issues 생성 완료

---

## Step 5 — Phase 전환 완료 처리

### 5-1. CLAUDE.md 업데이트

- [ ] `spec-kit/` 섹션의 현재 활성 문서 정보 업데이트
- [ ] Priority 섹션에서 완료된 Phase를 `COMPLETE`로 표시
- [ ] 다음 Phase를 `IN PLANNING` 또는 `IN PROGRESS`로 표시

### 5-2. Notion 협업 보드 업데이트

- [ ] 완료된 Phase 항목 상태 업데이트
- [ ] 새 Phase 태스크 등록
- [ ] URL: https://www.notion.so/harichon/Tripframe_project-32ee4cfd265280158a1dd02d50d0373e

### 5-3. 최종 커밋

```bash
git add -A
git commit -m "docs: initialize Phase N+1 spec-kit"
git push origin main
```

- [ ] 커밋 & push 완료

---

## 빠른 참조 — Phase별 번호 현황

| Phase | TASK 범위 | 상태 | 아카이브 위치 |
|-------|-----------|------|--------------|
| Phase 1 | TASK-001~020 | COMPLETE | `spec-kit/phase1/` |
| Phase 2 | TASK-021~040 | COMPLETE | `spec-kit/phase2/` |
| Phase 3 | TASK-057~068 | COMPLETE | `spec-kit/phase3/` |
| Phase 4 | TASK-072~087 | COMPLETE | `spec-kit/phase4/` |
| Phase 5 | TASK-088~XXX | COMPLETE | `spec-kit/phase5/` |
| Phase 6 | 현재 활성 | IN PROGRESS | `spec-kit/phase6/` |

> 새 Phase 시작 시 이 표를 업데이트한다.

---

*version: 1.0 | 2026-04-02*
