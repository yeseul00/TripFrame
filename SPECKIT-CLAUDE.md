# spec-kit for Claude Code

이 프로젝트에 설치된 [GitHub spec-kit](https://github.com/github/spec-kit)을 Claude Code에서 사용할 수 있도록 통합한 도구입니다.

## 설치 완료

✅ spec-kit이 Claude Code에서 사용 가능하도록 설정되었습니다.

## 사용 방법

### 1. 사용 가능한 명령어 확인

```bash
./speckit list
```

### 2. 특정 명령어의 프롬프트 가져오기

```bash
./speckit <command-name> [arguments]
```

출력된 프롬프트를 복사하여 Claude Code에 붙여넣으면 됩니다.

## 주요 명령어

### `speckit.specify` - 기능 명세 작성

새 기능의 명세를 작성합니다.

```bash
./speckit speckit.specify "사용자 인증 기능 추가"
```

### `speckit.plan` - 기술 계획 생성

명세를 바탕으로 기술 구현 계획을 생성합니다.

```bash
./speckit speckit.plan
```

### `speckit.tasks` - 태스크 분해

계획을 실행 가능한 태스크로 분해합니다.

```bash
./speckit speckit.tasks
```

### `speckit.implement` - 구현 실행

태스크를 순차적으로 실행합니다.

```bash
./speckit speckit.implement
```

### `speckit.analyze` - 일관성 분석

spec, plan, tasks 간의 일관성을 검사합니다.

```bash
./speckit speckit.analyze
```

### `speckit.clarify` - 명세 명확화

명세서의 불명확한 부분을 찾아 질문을 생성합니다.

```bash
./speckit speckit.clarify
```

## 워크플로우 예시

### 새 기능 개발 (처음부터)

```bash
# 1. 기능 명세 작성
./speckit speckit.specify "여행 일정의 공백을 자동으로 감지하는 기능"
# → 출력된 프롬프트를 Claude Code에 붙여넣기

# 2. 기술 계획 생성
./speckit speckit.plan
# → 출력된 프롬프트를 Claude Code에 붙여넣기

# 3. 태스크 분해
./speckit speckit.tasks
# → 출력된 프롬프트를 Claude Code에 붙여넣기

# 4. 구현 실행
./speckit speckit.implement
# → 출력된 프롬프트를 Claude Code에 붙여넣기
```

### 기존 프로젝트 (spec-kit 문서가 이미 있는 경우)

현재 TripFrame 프로젝트는 이미 spec-kit 문서들이 있습니다:
- `spec-kit/constitution.md` - 프로젝트 헌법 (불변 원칙)
- `spec-kit/spec.md` - 기능 명세
- `spec-kit/plan.md` - 기술 계획
- `spec-kit/tasks.md` - 태스크 목록
- `spec-kit/implement.md` - 구현 가이드

바로 구현 단계부터 시작할 수 있습니다:

```bash
./speckit speckit.implement
```

## 직접 프롬프트 사용

명령어를 통하지 않고 직접 문서를 읽어도 됩니다:

**Claude Code에 다음과 같이 요청:**

```
spec-kit 문서를 읽고 TripFrame MVP를 구현해줘.

읽어야 할 파일:
- spec-kit/constitution.md  (불변 원칙)
- spec-kit/spec.md          (기능 명세)
- spec-kit/plan.md          (기술 계획)
- spec-kit/tasks.md         (태스크 목록)

시작점: tasks.md의 TASK-001부터 순서대로 진행.
의존성 그래프를 반드시 지킬 것.
[P] 표시 태스크는 이전 태스크 완료 후 병렬 진행 가능.

각 태스크 완료 시 완료 기준을 확인하고 다음으로 넘어갈 것.
```

## 도구 구조

```
.
├── speckit                              # 메인 실행 스크립트
├── .specify/
│   └── scripts/
│       └── speckit-claude.py           # Python 백엔드
├── .gemini/
│   └── commands/
│       ├── speckit.specify.toml        # 명세 작성 명령어
│       ├── speckit.plan.toml           # 계획 생성 명령어
│       ├── speckit.tasks.toml          # 태스크 분해 명령어
│       ├── speckit.implement.toml      # 구현 실행 명령어
│       └── ...                         # 기타 명령어들
└── spec-kit/
    ├── constitution.md                 # 프로젝트 헌법
    ├── spec.md                         # 기능 명세
    ├── plan.md                         # 기술 계획
    ├── tasks.md                        # 태스크 목록
    └── implement.md                    # 구현 가이드
```

## Python API

Python 스크립트를 직접 사용할 수도 있습니다:

```bash
python .specify/scripts/speckit-claude.py list
python .specify/scripts/speckit-claude.py speckit.implement
```

## 문제 해결

### 명령어가 실행되지 않을 때

```bash
# 실행 권한 확인
chmod +x ./speckit

# Python 버전 확인 (3.11+ 필요)
python --version
```

### TOML 파일을 찾을 수 없을 때

`.gemini/commands/` 폴더에 `speckit.*.toml` 파일들이 있는지 확인하세요.

## 참고

- [GitHub spec-kit](https://github.com/github/spec-kit) - 공식 저장소
- [spec-kit/implement.md](spec-kit/implement.md) - 현재 프로젝트의 구현 가이드
