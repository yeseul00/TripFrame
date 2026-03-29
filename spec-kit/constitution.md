# TripFrame — Constitution

> 이 문서는 TripFrame 프로젝트의 모든 개발 결정에 우선하는 불변 원칙이다.
> AI 에이전트는 spec, plan, tasks, implement 어느 단계에서도 이 헌법을 위반해서는 안 된다.

---

## Article I — 제품 정체성

TripFrame은 **"여행 일정의 빈 칸을 찾아주는 앱"** 이다.

- 예약된 항공·숙박 정보를 입력하면 이동 시간을 역산하고, 공백 구간을 감지해 선택지를 제안한다
- 타겟: "무엇을 할까"가 아니라 "언제 어떻게 움직여야 하는가"를 모르는 사용자
- 포지션: 기존 여행 앱(예약 보관·관광지 추천)과 겹치지 않는 **Pre-departure 특화 앱**

---

## Article II — 플랫폼 전략

1. **Mobile-First**: React Native (Expo) iOS/Android 동시 개발이 1순위
2. **Web Extension**: Phase 2에서 React 웹앱으로 확장
3. **Shared Core**: 비즈니스 로직(역산 엔진, 공백 감지)은 반드시 플랫폼 독립 TypeScript 패키지로 분리
4. **PWA**: Phase 3에서 통합, 오프라인 지원

---

## Article III — 아키텍처 원칙

1. **Logic-UI 분리 강제**: 역산 엔진, 공백 감지, 경제성 계산 로직은 UI 컴포넌트에 직접 작성 금지 — 반드시 `packages/core/`에 순수 함수로 구현
2. **단방향 데이터 흐름**: Zustand store → 컴포넌트. 컴포넌트에서 직접 store mutation 금지
3. **타입 안전**: `any` 타입 사용 금지. 모든 데이터 모델은 `packages/core/src/types/` 에 정의
4. **불변 데이터**: 이벤트 모델은 immutable. 업데이트는 항상 새 객체 반환
5. **오프라인 우선**: 핵심 기능(역산, 공백 감지)은 네트워크 없이 동작해야 함

---

## Article IV — 기술 스택 (고정)

> v2.0 — TF-TECH-001 의사결정 브리핑 반영 (2026-03-29)

| 영역 | 기술 | 버전 | 비고 |
|------|------|------|------|
| 모바일 | Expo SDK + EAS Build | SDK 54+ | Development Build 필수. Expo Go는 개발 초기에만 허용 |
| 빌드/배포 | EAS Build / EAS Update / EAS Submit | - | OTA 업데이트 내장. CI/CD 대체 |
| 웹 확장 | React + Vite | 18+ | Phase 2. @tripframe/core 직접 import |
| 언어 | TypeScript | 5.x | strict mode 필수 |
| 상태 관리 | Zustand | 4.x | Redux 사용 금지 |
| 사용자 데이터 저장 | expo-sqlite/kv-store | - | AsyncStorage API 호환. import 1줄 교체. Phase 4 |
| 참조 데이터 저장 | expo-sqlite (Full SQL) | - | 교통·공항·항공사·템플릿 DB. Phase 5 |
| 암호화 (Phase 4) | expo-crypto AES-256-GCM | - | Expo Go/Dev Build 모두 동작. 사용자 데이터 암호화 |
| 암호화 (Phase 5+) | expo-secure-store (키 보관) | - | Dev Build 전환 후. 마스터 키를 하드웨어 보안 모듈에 이동 |
| ORM (선택) | Drizzle ORM | - | 참조 DB 타입 안전 쿼리. Phase 5 도입 검토 |
| 클라우드 | Supabase | - | Phase 2 이후 |
| 타임라인 시각화 | React Native SVG | - | D3는 웹에서만 |
| 테스트 | Jest + React Native Testing Library | - | |
| E2E 테스트 | Playwright (웹) + Maestro (네이티브) | - | Maestro는 Phase 5 Dev Build 이후 |
| 모노레포 | pnpm workspaces | - | nx는 과잉 |

### 스토리지 레이어 구조

```
Layer 1 — 사용자 데이터 (KV Store)
  대상: Trip, Event, Settings, UserPreferences
  저장소: expo-sqlite/kv-store
  암호화: expo-crypto AES-256-GCM (Phase 4)
  키 보관: expo-secure-store (Phase 5, Dev Build 이후)

Layer 2 — 참조 데이터 (Full SQL)
  대상: TransportRoute, AirportProfile, AirlineRule, CityTemplate
  저장소: expo-sqlite (SQL 쿼리, 인덱싱)
  암호화: 불필요 (공개 데이터)
```

### 프레임워크 전환 금지

Flutter, KMP, .NET MAUI, Ionic으로의 전환을 금지한다.
근거: `@tripframe/core` TypeScript 자산 보존, B2B API Track 유지, 1인 개발 효율성.
(TF-TECH-001 의사결정 매트릭스: Expo+EAS 92/100, Flutter 52/100, KMP 38/100)

---

## Article V — 코드 품질 기준

1. **TypeScript strict**: `"strict": true`, `"noImplicitAny": true` 필수
2. **함수 크기**: 단일 함수 50줄 초과 금지 — 초과 시 분리 필수
3. **테스트 커버리지**: `packages/core/` 는 80% 이상 유지
4. **명명 규칙**:
   - 컴포넌트: PascalCase
   - 함수/변수: camelCase
   - 타입/인터페이스: PascalCase, Interface prefix `I` 사용 금지
   - 상수: UPPER_SNAKE_CASE
   - 파일: kebab-case
5. **import 순서**: 외부 라이브러리 → 내부 패키지 → 상대 경로

---

## Article VI — UX 원칙

1. **역산 우선 표시**: 사용자가 입력하지 않은 "집 출발 시간"을 앱이 먼저 계산해 보여줘야 한다
2. **공백은 빨간색으로**: 이동 수단 없는 구간은 반드시 시각적으로 즉시 구분 가능해야 한다
3. **자동 삽입 명시**: 앱이 자동으로 삽입한 구간(택시, 도보 등)은 "자동삽입" 태그로 명시해야 한다
4. **역산 근거 공개**: 모든 역산 결과는 "왜 이 시간인지" 탭/확장으로 확인할 수 있어야 한다
5. **다크 테마 기본**: 기본 테마는 다크. 라이트 테마는 선택사항

---

## Article VII — 데이터 모델 원칙

1. **Event 중심 설계**: 모든 일정 요소는 `TripEvent` 인터페이스로 표현
2. **Gap은 파생 데이터**: `Gap`은 이벤트에서 파생되는 계산 결과 — 직접 저장 금지
3. **현지 시간 기준**: 모든 `datetime`은 현지 시간(local time) + timezone 정보 함께 저장
4. **예약번호 옵셔널**: 예약번호 없이도 앱이 완전히 동작해야 한다

---

## Article VIII — 보안 원칙

1. **로컬 데이터 암호화 필수**: 예약번호, 개인정보는 기기 로컬 저장 시 반드시 암호화
   - Phase 4: expo-crypto AES-256-GCM으로 사용자 데이터 암호화 (개인정보보호법 제29조 준수)
   - Phase 5+: expo-secure-store로 마스터 키를 하드웨어 보안 모듈에 보관
2. **평문 AsyncStorage 금지**: 사용자 데이터를 평문 AsyncStorage에 저장하는 코드 작성 금지. 반드시 암호화 래퍼를 통해 접근
3. 클라우드 동기화(Phase 2) 전 Supabase RLS 정책 검토 필수
4. 외부 API 키는 환경변수로만 관리 — 코드에 하드코딩 절대 금지

---

## Article IX — 우선순위 원칙

기능 구현 순서는 반드시 이 순서를 따른다:

```
P1: 역산 타임라인 엔진 + 공백 구간 감지  ← MVP 필수
P2: 이동 수단 선택지 제안 + 커스터마이징 질문
P3: 예약 오픈 알림 + 패스 경제성 분석
P4: 자유 시간 활동 추천 (기존 앱 연계)
```

P1 완성 전 P2 작업 시작 금지.

---

*constitution version: 2.0 | 2026-03-29 | Article IV 기술 스택 전면 개정 (TF-TECH-001), Article VIII 보안 원칙 강화*
