# TripFrame E2E 테스트 실행 가이드

이 문서는 팀원이 다른 디바이스에서 TripFrame 프로젝트의 E2E 테스트를 실행하기 위한 단계별 가이드입니다.

---

## 📋 목차

1. [사전 요구사항](#1-사전-요구사항)
2. [저장소 클론](#2-저장소-클론)
3. [의존성 설치](#3-의존성-설치)
4. [Playwright 브라우저 설치](#4-playwright-브라우저-설치)
5. [E2E 테스트 실행](#5-e2e-테스트-실행)
6. [테스트 결과 확인](#6-테스트-결과-확인)
7. [문제 해결](#7-문제-해결)

---

## 1. 사전 요구사항

### 필수 소프트웨어 설치

#### 1.1. Node.js (v18 이상)
- **다운로드**: https://nodejs.org/
- **권장 버전**: v20.x LTS
- **설치 확인**:
  ```bash
  node --version
  # 출력 예: v20.11.0
  ```

#### 1.2. pnpm (v9 이상)
- **설치 방법**:
  ```bash
  npm install -g pnpm
  ```
- **설치 확인**:
  ```bash
  pnpm --version
  # 출력 예: 10.32.1
  ```

#### 1.3. Git
- **다운로드**: https://git-scm.com/
- **설치 확인**:
  ```bash
  git --version
  # 출력 예: git version 2.43.0
  ```

---

## 2. 저장소 클론

### 2.1. GitHub에서 프로젝트 클론

```bash
# 터미널 또는 Git Bash에서 실행
cd C:/Users/YOUR_USERNAME/Documents  # 원하는 경로로 변경
git clone https://github.com/YOUR_ORG/TripFrame.git
cd TripFrame
```

### 2.2. 프로젝트 구조 확인

```bash
# 디렉토리 구조 확인
ls -la

# 예상 출력:
# TripFrame/
# ├── tripframe/          # 메인 프로젝트
# ├── spec-kit/           # 기술 사양
# ├── report/             # 테스트 결과
# └── E2E_TEST_GUIDE.md   # 이 문서
```

---

## 3. 의존성 설치

### 3.1. 프로젝트 의존성 설치

```bash
# tripframe 디렉토리로 이동
cd tripframe

# pnpm workspace 의존성 설치 (처음 한 번만)
pnpm install
```

**예상 소요 시간**: 2-5분 (네트워크 속도에 따라 다름)

**성공 메시지 예시**:
```
Packages: +793
Progress: resolved 793, reused 793, downloaded 0, added 793, done
Done in 3.2s
```

### 3.2. 설치 확인

```bash
# packages/core가 제대로 링크되었는지 확인
ls -la apps/mobile/node_modules/@tripframe/

# 출력 예: core -> ../../../packages/core
```

---

## 4. Playwright 브라우저 설치

### 4.1. Playwright Chromium 브라우저 설치

```bash
# tripframe 디렉토리에서 실행
npx playwright install chromium
```

**예상 소요 시간**: 1-3분 (약 280MB 다운로드)

**성공 메시지 예시**:
```
Downloading Chromium 145.0.7632.6 (playwright chromium v1208)
Chrome for Testing 145.0.7632.6 downloaded to C:\Users\...\chromium-1208
```

### 4.2. (선택) 모든 브라우저 설치

```bash
# Firefox, WebKit도 설치하려면
npx playwright install
```

---

## 5. E2E 테스트 실행

### 5.1. 기본 실행 방법

```bash
# tripframe 디렉토리에서 실행
npx playwright test
```

**자동으로 수행되는 작업**:
1. Expo 개발 서버 시작 (localhost:8081)
2. Metro bundler로 앱 번들링
3. Playwright 테스트 10개 실행
4. 스크린샷 캡처
5. 테스트 결과 리포트 생성

**예상 소요 시간**: 약 1분

### 5.2. UI 모드로 실행 (시각적 디버깅)

```bash
# 브라우저 화면을 보면서 테스트 실행
npx playwright test --ui
```

### 5.3. 특정 테스트만 실행

```bash
# 파일명으로 필터링
npx playwright test tripframe-mvp.spec.ts

# 테스트 이름으로 필터링
npx playwright test -g "Day 1"
```

### 5.4. 헤드풀 모드 (브라우저 창 표시)

```bash
# 브라우저 창을 보면서 실행
npx playwright test --headed
```

### 5.5. 디버그 모드

```bash
# 단계별로 멈추면서 실행
npx playwright test --debug
```

---

## 6. 테스트 결과 확인

### 6.1. HTML 리포트 보기

테스트 실행 후 자동으로 리포트가 생성됩니다.

```bash
# HTML 리포트 열기
npx playwright show-report
```

**리포트 내용**:
- 각 테스트의 성공/실패 상태
- 실행 시간
- 스크린샷
- 에러 메시지 (실패 시)
- 비디오 (실패 시)

### 6.2. 생성된 파일 확인

```bash
# 테스트 결과 파일 확인
ls -la test-results/screenshots/

# 출력 예:
# 02-day1-timeline.png
# 03-day2-timeline-warning.png
# 04-day3-warning.png
# ...
```

### 6.3. 리포트 파일 위치

```
tripframe/
├── playwright-report/          # HTML 리포트
│   └── index.html
├── test-results/               # 테스트 결과 상세
│   ├── screenshots/            # 캡처된 스크린샷
│   └── results.json            # JSON 포맷 결과
└── TEST_REPORT.md              # 마크다운 결과서
```

### 6.4. 결과를 report 폴더로 복사

```bash
# 오늘 날짜 폴더 생성
mkdir -p ../report/$(date +%Y%m%d)

# 결과 복사
cp TEST_REPORT.md ../report/$(date +%Y%m%d)/
cp -r playwright-report ../report/$(date +%Y%m%d)/
cp -r test-results ../report/$(date +%Y%m%d)/
```

**Windows PowerShell에서**:
```powershell
# 오늘 날짜 폴더 생성
$date = Get-Date -Format "yyyyMMdd"
New-Item -ItemType Directory -Force -Path "..\report\$date"

# 결과 복사
Copy-Item TEST_REPORT.md "..\report\$date\"
Copy-Item -Recurse playwright-report "..\report\$date\"
Copy-Item -Recurse test-results "..\report\$date\"
```

---

## 7. 문제 해결

### 7.1. 포트 8081이 이미 사용 중

**증상**:
```
Error: Port 8081 is already in use
```

**해결 방법**:
```bash
# Windows (Git Bash)
netstat -ano | grep 8081
# PID 확인 후
taskkill //PID <PID_NUMBER> //F

# Linux/Mac
lsof -ti:8081 | xargs kill -9
```

### 7.2. pnpm install 실패

**증상**:
```
ENOENT: no such file or directory
```

**해결 방법**:
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
rm -rf apps/mobile/node_modules
rm -rf packages/core/node_modules
pnpm install
```

### 7.3. Metro bundler 에러

**증상**:
```
Error: Metro bundler failed to start
```

**해결 방법**:
```bash
# Metro cache 삭제
rm -rf apps/mobile/.expo
rm -rf apps/mobile/node_modules/.cache

# 재시작
cd apps/mobile
npx expo start --clear
```

### 7.4. Playwright 브라우저 설치 실패

**증상**:
```
Error: Browser not found
```

**해결 방법**:
```bash
# 브라우저 재설치
npx playwright install chromium --force
```

### 7.5. 테스트가 타임아웃됨

**증상**:
```
Test timeout of 30000ms exceeded
```

**해결 방법**:
```bash
# 타임아웃 시간 늘리기
npx playwright test --timeout=60000
```

또는 `playwright.config.ts` 수정:
```typescript
export default defineConfig({
  timeout: 60000,  // 60초로 증가
});
```

### 7.6. 스크린샷이 생성되지 않음

**원인**: 테스트 실패 시 스크린샷 경로 문제

**해결 방법**:
```bash
# screenshots 디렉토리 수동 생성
mkdir -p test-results/screenshots
```

### 7.7. Windows에서 경로 관련 에러

**증상**:
```
Error: EPERM: operation not permitted
```

**해결 방법**:
```bash
# Git Bash 또는 WSL 사용 권장
# 또는 관리자 권한으로 터미널 실행
```

---

## 📚 추가 리소스

### 공식 문서
- **Playwright 공식 문서**: https://playwright.dev/
- **Expo 공식 문서**: https://docs.expo.dev/
- **pnpm 공식 문서**: https://pnpm.io/

### 프로젝트 문서
- `CLAUDE.md` - 프로젝트 개요 및 아키텍처
- `spec-kit/spec.md` - 기능 명세서
- `spec-kit/plan.md` - 구현 계획
- `spec-kit/tasks.md` - 태스크 목록

---

## 🎯 빠른 시작 체크리스트

처음 설정하는 경우 다음 순서대로 진행하세요:

- [ ] Node.js v18+ 설치
- [ ] pnpm 설치 (`npm install -g pnpm`)
- [ ] 저장소 클론 (`git clone ...`)
- [ ] 의존성 설치 (`cd tripframe && pnpm install`)
- [ ] Playwright 브라우저 설치 (`npx playwright install chromium`)
- [ ] E2E 테스트 실행 (`npx playwright test`)
- [ ] HTML 리포트 확인 (`npx playwright show-report`)

**예상 총 소요 시간**: 15-20분 (첫 설정 시)

---

## 💡 유용한 팁

### 1. 테스트 전 앱 미리 확인

```bash
# 브라우저에서 앱 먼저 확인
cd apps/mobile
npx expo start --web

# 브라우저에서 http://localhost:8081 접속
# 정상 동작 확인 후 Ctrl+C로 종료
```

### 2. 특정 브라우저에서만 실행

```bash
# Chromium만 실행
npx playwright test --project=chromium
```

### 3. 실패한 테스트만 재실행

```bash
npx playwright test --last-failed
```

### 4. 병렬 실행 워커 수 조정

```bash
# 워커 1개 (순차 실행)
npx playwright test --workers=1

# 워커 4개 (병렬 실행)
npx playwright test --workers=4
```

### 5. 테스트 결과를 GitHub Actions에서 확인

`.github/workflows/e2e.yml` 파일이 설정되어 있다면, PR 생성 시 자동으로 E2E 테스트가 실행됩니다.

---

## 🔄 CI/CD 환경에서 실행

### GitHub Actions 예시

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: |
          cd tripframe
          pnpm install

      - name: Install Playwright Browsers
        run: |
          cd tripframe
          npx playwright install chromium

      - name: Run E2E tests
        run: |
          cd tripframe
          npx playwright test

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: tripframe/playwright-report/
          retention-days: 30
```

---

## 📞 지원

문제가 계속 발생하면:
1. GitHub Issues에 등록
2. 팀 Slack 채널에 문의
3. `TEST_REPORT.md` 및 에러 로그 첨부

---

*작성일: 2026-03-27*
*버전: 1.0*
*문서 위치: `TripFrame/E2E_TEST_GUIDE.md`*
