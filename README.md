# TripFrame

> 여행 일정의 논리적 공백을 자동으로 감지하는 스마트 여행 플래너

[![Tests](https://img.shields.io/badge/tests-100%25-success)](./tripframe)
[![Core Tests](https://img.shields.io/badge/core-97%25-success)](./tripframe/packages/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020)](https://expo.dev/)

## 📱 프로젝트 소개

TripFrame은 여행 계획 시 발생할 수 있는 **이동 수단 누락, 시간 부족** 등의 문제를 자동으로 감지하고, **역산 계산**을 통해 정확한 출발 시간을 알려주는 모바일 앱입니다.

### 해결하는 문제

- ❓ "공항 가려면 집에서 몇 시에 출발해야 하지?"
- ⚠️ "하카타에서 유후인까지 어떻게 가지?"
- ⏰ "체크인 전까지 시간이 얼마나 남았지?"

## ✨ 주요 기능

### 1️⃣ 역산 타임라인 (Reverse Timeline)
- 비행기 출발 시간부터 **역으로 계산**하여 집 출발 시간 자동 산출
- 항공사별 수속 마감 시간, 공항 이동 시간, 준비 시간 자동 반영

### 2️⃣ 공백 감지 (Gap Detection)
- 이동 구간 사이의 **누락된 교통수단** 자동 감지
- 시간 여유 부족 구간 경고 (30분 미만)
- DANGER/WARNING 등급으로 우선순위 표시

### 3️⃣ 자유시간 계산
- 도착 ~ 체크인 사이의 자유시간 분석
- 30분 미만: 짐 보관 경고
- 2시간 이상: 관광 제안

### 4️⃣ 다크 테마 UI
- 퍼플 강조색 (#A78BFA)
- 직관적인 타임라인 시각화
- 경고 상태별 색상 코딩

## 🛠 기술 스택

### Frontend (Mobile)
- **React Native** 0.81.5
- **Expo** ~54.0.0
- **NativeWind** 4.2.3 (Tailwind CSS for RN)
- **Zustand** 5.0.12 (상태 관리)

### Core Logic
- **TypeScript** 5.3 (strict mode)
- **date-fns** (날짜 계산)
- **Jest** 29.x (테스트)

### 테스트
- **Playwright** 1.58.2 (E2E)
- **Jest** (Unit)

### 개발 도구
- **pnpm** 워크스페이스 (모노레포)
- **ESLint** + **Prettier**

## 📦 설치

### 사전 요구사항

- Node.js 18+
- pnpm 9+
- Git

### 1. 저장소 클론

```bash
git clone https://github.com/yeseul00/TripFrame.git
cd TripFrame
```

### 2. 의존성 설치

```bash
cd tripframe
pnpm install
```

## 🚀 실행

### 모바일 앱 실행

```bash
cd tripframe/apps/mobile

# 웹 브라우저에서 실행
pnpm web

# iOS 시뮬레이터 (macOS만)
pnpm ios

# Android 에뮬레이터
pnpm android
```

브라우저에서 http://localhost:8081 접속

### Core 패키지 테스트

```bash
cd tripframe/packages/core

# 테스트 실행
pnpm test

# 타입 체크
pnpm typecheck
```

## 🧪 테스트

### E2E 테스트

```bash
cd tripframe

# 전체 E2E 테스트 실행
npx playwright test

# UI 모드 (시각적 디버깅)
npx playwright test --ui

# HTML 리포트 보기
npx playwright show-report
```

**테스트 결과**:
- ✅ E2E: 10/10 통과 (100%)
- ✅ Core: 31/32 통과 (97%)

### 유닛 테스트

```bash
# Core 패키지 테스트
pnpm --filter @tripframe/core test

# 특정 테스트 파일
cd packages/core
npx jest logic/__tests__/gapEngine.test.ts
```

## 📂 프로젝트 구조

```
TripFrame/
├── tripframe/                  # 메인 모노레포
│   ├── packages/
│   │   └── core/              # 플랫폼 독립 비즈니스 로직
│   │       ├── src/
│   │       │   ├── types/     # TypeScript 타입 정의
│   │       │   ├── logic/     # 엔진 (역산, 공백감지, 자유시간)
│   │       │   └── data/      # Mock 데이터, 규칙
│   │       └── tests/
│   └── apps/
│       └── mobile/            # Expo React Native 앱
│           ├── src/
│           │   ├── screens/   # 화면 (일정, 공백감지, 역산)
│           │   ├── components/
│           │   ├── store/     # Zustand 스토어
│           │   └── hooks/
│           └── e2e/           # Playwright E2E 테스트
├── spec-kit/                  # 기술 사양
│   ├── spec.md               # 기능 명세서
│   ├── plan.md               # 구현 계획
│   ├── tasks.md              # 태스크 분해
│   └── implement.md          # 구현 가이드
├── report/                    # 테스트 결과
└── CLAUDE.md                 # AI 개발 가이드
```

## 📖 문서

- **[CLAUDE.md](CLAUDE.md)** - Claude Code 개발 가이드
- **[E2E_TEST_GUIDE.md](E2E_TEST_GUIDE.md)** - E2E 테스트 실행 가이드
- **[spec-kit/spec.md](spec-kit/spec.md)** - 기능 요구사항 명세
- **[spec-kit/plan.md](spec-kit/plan.md)** - 기술 구현 계획
- **[spec-kit/implement.md](spec-kit/implement.md)** - 구현 가이드

## 🎯 개발 로드맵

### ✅ Phase 1 (MVP) - 완료
- [x] 역산 타임라인 엔진
- [x] 공백 감지 (DANGER/WARNING)
- [x] 자유시간 계산
- [x] 다크 테마 UI
- [x] E2E 테스트 100% 통과

### 🚧 Phase 2 (계획 중)
- [ ] Supabase 백엔드 연동
- [ ] 인증 (Google/Apple Sign-In)
- [ ] 클라우드 동기화
- [ ] 이메일 파싱 (예약 정보 자동 추출)

### 📅 Phase 3 (예정)
- [ ] 예약 알림 (오픈 날짜, 마감 임박)
- [ ] 패스 경제성 분석 (JR Pass vs 개별 구매)

### 🌟 Phase 4 (예정)
- [ ] AI 기반 활동 추천
- [ ] 날씨 연동
- [ ] 실시간 항공편 지연 반영

## 🤝 기여 가이드

### 코드 품질 기준

- ✅ TypeScript strict mode
- ✅ 함수당 50줄 이하
- ✅ `any` 타입 금지
- ✅ 테스트 커버리지 80% 이상
- ✅ 불변 데이터 (Immutability)

### 커밋 메시지 규칙

```
<type>: <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Type**: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`

### Pull Request 절차

1. Feature 브랜치 생성
2. 변경 사항 구현
3. 테스트 작성 및 통과 확인
4. PR 생성 (템플릿 따라 작성)
5. 코드 리뷰 후 Merge

## 🐛 알려진 제한사항

### TC-010: Transport 하차 후 목적지 감지
- **상태**: Phase 2로 연기
- **이유**: 데이터 모델 개선 필요 (도착 위치 필드 추가)

## 📄 라이선스

MIT License

Copyright (c) 2026 TripFrame Team

## 👥 팀

- **개발**: SOL
- **AI Pair Programming**: Claude Sonnet 4.5

---

**Built with ❤️ using [Claude Code](https://claude.com/claude-code)**
