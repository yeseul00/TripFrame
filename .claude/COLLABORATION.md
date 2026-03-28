# TripFrame — Claude Code 협업 가이드

**대상**: TripFrame 기여자 (신규 합류 포함)
**적용 도구**: Claude Code CLI / Desktop / IDE Extension

---

## 1. 사전 준비

### Claude Code 설치

```bash
npm install -g @anthropic/claude-code
```

설치 후 인증:

```bash
claude
# 최초 실행 시 Anthropic 계정 로그인 안내
```

### 리포지토리 클론

```bash
git clone https://github.com/<your-org>/TripFrame.git
cd TripFrame
```

`.claude/skills/` 폴더가 포함되어 있으므로 **별도 설정 없이** 커스텀 커맨드가 즉시 활성화됩니다.

---

## 2. 등록된 커스텀 커맨드

| 커맨드 | 용도 |
|--------|------|
| `/speckit-implement` | spec-kit 문서 기반 태스크 구현 + tasks.md 자동 업데이트 |

### `/speckit-implement` 사용법

```
/speckit-implement                  # 미완료 태스크 전체 실행
/speckit-implement TASK-031         # 특정 태스크만
/speckit-implement Phase2.1         # 특정 Phase 전체
```

**실행 순서**:

1. `spec-kit/spec.md` — 기능 명세 및 Acceptance Criteria 로딩
2. `spec-kit/plan.md` — 기술 스택 및 아키텍처 로딩
3. `spec-kit/tasks.md` — 미완료 태스크(`[ ]`) 확인
4. `spec-kit/constitution.md` — 코드 품질 원칙 로딩
5. 태스크 순차 구현 (의존성 순서 준수)
6. 태스크 완료 즉시 `tasks.md`에 `[x]` 마킹
7. 전체 완료 후 Acceptance Criteria 대조 및 진행률 표 업데이트

---

## 3. 협업 워크플로우

### 기본 원칙

> 코드 작업 시작 전 반드시 `/speckit-implement`를 통해 진행합니다.
> 직접 코딩보다 항상 spec → plan → tasks 순서를 따릅니다.

### 일반적인 작업 흐름

```
1. git pull (최신 tasks.md 확인)
       ↓
2. /speckit-implement [TASK-ID]
       ↓
3. Claude Code가 spec/plan/tasks 참고하여 구현
       ↓
4. tasks.md 자동 업데이트 ([ ] → [x])
       ↓
5. git add / commit / push
```

### tasks.md 충돌 방지

여러 명이 동시에 작업할 때 `tasks.md` 체크박스 충돌을 최소화하는 방법:

- 작업 시작 전 `git pull`로 최신 상태 확인
- 서로 다른 태스크 ID를 맡아서 진행 (ex. A는 TASK-031~033, B는 TASK-034~035)
- 충돌 발생 시: 두 브랜치의 `[x]` 항목을 모두 유지하는 방향으로 병합

---

## 4. spec-kit 문서 구조

```
spec-kit/
├── constitution.md        # 절대 원칙 — 변경 금지
├── spec.md                # 현재 Phase 기능 명세 (What)
├── plan.md                # 현재 Phase 구현 계획 (How)
├── tasks.md               # 현재 Phase 태스크 목록 (체크박스)
├── e2e-test-workflow.md   # E2E 테스트 절차
├── phase1/                # Phase 1 아카이브 (참고용)
└── phase2/                # Phase 2 상세 설계 참고 문서
```

**현재 활성 Phase**: Phase 2 (TASK-031 ~ TASK-050)
**진행 상황**: `spec-kit/tasks.md` 확인

---

## 5. E2E 테스트

구현 완료 후 E2E 테스트로 검증합니다.

```bash
# Expo 웹 서버 선기동 (별도 터미널)
cd tripframe/apps/mobile
npx expo start --web --host localhost --port 8081

# 전체 E2E 실행
cd tripframe
npx playwright test --reporter=list
```

테스트 절차 상세: `spec-kit/e2e-test-workflow.md`
테스트 결과서 저장 위치: `report/YYMMDD/`

---

## 6. 자주 묻는 질문

**Q. `/speckit-implement`가 보이지 않아요.**

Claude Code 버전을 확인하세요. 커스텀 스킬은 최신 버전에서 지원됩니다.

```bash
claude --version
npm update -g @anthropic/claude-code
```

**Q. tasks.md의 `[ ]` 항목이 없는데 어떻게 하나요?**

모든 태스크가 완료된 상태입니다. 다음 Phase 시작 또는 새 기능 추가가 필요한 경우 팀 리드에게 문의하세요.

**Q. constitution.md 규칙을 위반한 코드를 발견했어요.**

PR 리뷰에서 지적하거나 이슈를 등록해 주세요. constitution.md는 팀 전체 합의 없이 변경하지 않습니다.
