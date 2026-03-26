# TripFrame E2E 테스트 방안 분석

**작성일**: 2026-03-25
**작성 배경**: 디버깅 완료 후 다음 단계로 E2E 테스트 환경 구축 방안 검토

---

## 1. 전제 조건

TripFrame은 **Expo React Native 기반 모바일 앱**이다. 이 점이 E2E 도구 선택에 결정적 영향을 미친다.

| 구분 | 내용 |
|------|------|
| 앱 유형 | Expo (React Native), iOS/Android 동시 개발 |
| 플랫폼 | Mobile-First (constitution Article II) |
| 웹 확장 | Phase 2 예정 (현재 미개발) |
| 개발 OS | Windows 11 Home |

---

## 2. 검토한 방안

### 방안 A — Playwright MCP (AI 주도 웹 E2E)

**개요**: Claude Code에 Playwright MCP 서버를 붙여 AI가 직접 브라우저를 조작하며 테스트

**설치 방법**:
```bash
# Claude Code MCP 등록
claude mcp add playwright npx @playwright/mcp@latest

# 또는 프로젝트 .mcp.json에 추가
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**사용 흐름**:
```
1. expo start --web  →  브라우저에서 앱 실행 (localhost:8081)
2. Claude에게 자연어로 테스트 요청
   예) "일정 탭에서 공백감지 탭으로 이동해서 DANGER 경고가 보이는지 확인해줘"
3. Claude가 Playwright 도구로 직접 조작 + 결과 보고
```

**Playwright MCP 제공 도구 (주요)**:
- 브라우저 이동, 클릭, 텍스트 입력, 키 입력
- 스크린샷 촬영
- 접근성 트리 스냅샷 (이미지 없이 구조 파악)
- 탭 관리, 네트워크 모킹

**장점**:
- 별도 테스트 코드 작성 불필요
- AI가 자연어 지시만으로 테스트 수행
- 즉시 설치 가능

**단점 및 제약**:
- **웹 브라우저 전용** → Expo 웹 모드(`expo start --web`)에서만 동작
- 실제 모바일 앱 동작과 차이 있을 수 있음 (React Native vs React DOM)
- **현재 프로젝트 블로커**: NativeWind v4 + tailwindcss v4 peer dependency 불일치로 웹 모드에서 스타일 깨짐 가능성 있음
- 웹은 Phase 2 (현재 MVP 범위 외)

**적합 시점**: 웹 확장(Phase 2) 개발 착수 시

---

### 방안 B — Maestro (모바일 네이티브 E2E) ⭐

**개요**: React Native 전용 E2E 도구. YAML 파일로 테스트 시나리오 작성, 실제 시뮬레이터/에뮬레이터에서 동작

**설치 방법**:
```bash
# Maestro CLI 설치 (macOS/Linux/Windows 지원)
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Windows 11 지원 여부**:
- ✅ Windows 11 지원됨
- ✅ Android 에뮬레이터와 연동 가능
- ❌ iOS 시뮬레이터 불가 (macOS 전용)
- → **Windows에서는 Android 에뮬레이터 전용**

**Android 에뮬레이터 준비**:
```
1. Android Studio 다운로드 (약 4–8GB)
   https://developer.android.com/studio
2. Android Studio → Tools → AVD Manager
3. 가상 디바이스 생성 (권장: Pixel 7, API 33+)
4. 에뮬레이터 실행 확인
```

**테스트 파일 예시**:
```yaml
# apps/mobile/e2e/timeline_flow.yaml
appId: com.tripframe.mobile
---
- launchApp
- assertVisible: "후쿠오카 · 유후인"       # 메인 타이틀 확인
- tapOn: "공백감지"                          # 탭 이동
- assertVisible: "이동 수단 누락"            # Gap 카드 표시 확인
- tapOn: "역산"                              # 역산 탭 이동
- assertVisible: "09:15"                     # 계산된 출발 시간 확인
```

```bash
# 실행
maestro test apps/mobile/e2e/timeline_flow.yaml
```

**장점**:
- 실제 모바일 앱 환경에서 테스트 (가장 정확)
- YAML 문법이 단순해 테스트 코드 작성 부담 낮음
- Detox 대비 설정이 훨씬 간단
- `maestro cloud`로 CI/CD 연동 가능

**단점**:
- Android Studio + 에뮬레이터 설치 필요 (초기 세팅 비용)
- Windows에서 iOS 테스트 불가

**적합 시점**: 현재 단계에서 즉시 도입 가능

---

### 방안 C — Detox (React Native E2E, 참고용)

**개요**: Wix가 만든 React Native E2E 표준 도구. JavaScript 기반 테스트 코드 작성

**검토 결과**: 현 단계에서 비권장
- 설정 복잡도가 Maestro 대비 높음
- Expo managed workflow와 호환성 이슈 존재
- 초기 세팅에 상당한 시간 필요

---

## 3. 방안 비교 요약

| 항목 | Playwright MCP | Maestro | Detox |
|------|---------------|---------|-------|
| 테스트 대상 | 웹 브라우저 | Android/iOS 네이티브 | Android/iOS 네이티브 |
| Windows 지원 | ✅ | ✅ (Android) | △ |
| 설정 난이도 | 낮음 | 낮음 | 높음 |
| AI 통합 | ✅ (MCP) | 제한적 | ❌ |
| 실 앱 동작 검증 | ❌ (웹 모드) | ✅ | ✅ |
| 현재 도입 가능 | ❌ (Phase 2 이후) | ✅ | △ |

---

## 4. 결론 및 권장 로드맵

### 현재 단계 (Phase 1 MVP)
**→ Maestro 도입 권장**

Android Studio + 에뮬레이터 설치 후 핵심 플로우 3개 시나리오 작성:
1. 타임라인 렌더링 확인 (Day 1/2/3 전환)
2. 공백감지 탭에서 DANGER 카드 표시 확인
3. 역산 탭에서 09:15 출발 시간 계산 확인

### Phase 2 (웹 확장) 진입 시
**→ Playwright MCP 추가**

웹 버전 개발 착수 시 Claude Code에 Playwright MCP 등록.
모바일(Maestro) + 웹(Playwright MCP) 병행 체계로 전환.

```
최종 목표 구조:
  단위 테스트    → Jest (packages/core + apps/mobile)
  모바일 E2E    → Maestro
  웹 E2E        → Playwright MCP
```

---

## 5. 다음 액션 아이템

- [ ] Android Studio 설치 (Windows 11)
- [ ] AVD Manager에서 에뮬레이터 생성 (Pixel 7, API 33+)
- [ ] Maestro CLI 설치
- [ ] `apps/mobile/e2e/` 디렉토리 생성
- [ ] 핵심 플로우 3개 YAML 시나리오 작성
- [ ] NativeWind peer dependency 문제 해결 (앱 실행 선행 필요)

---

*문서 버전: v1.0 | 2026-03-25*
