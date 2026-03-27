# TripFrame 시스템 설계서

**System Architecture Document**
문서 ID: TF-SAD-001 | 버전: 1.0 | 2026-03-26 | 상태: Draft

---

## 목차

1. [문서 개요](#1-문서-개요)
2. [시스템 개요](#2-시스템-개요)
3. [아키텍처 설계](#3-아키텍처-설계)
4. [기술 스택](#4-기술-스택)
5. [데이터 모델](#5-데이터-모델)
6. [핵심 엔진 설계](#6-핵심-엔진-설계)
7. [데이터 흐름](#7-데이터-흐름)
8. [보안 설계](#8-보안-설계)
9. [성능 설계](#9-성능-설계)
10. [테스트 전략](#10-테스트-전략)
11. [배포 아키텍처](#11-배포-아키텍처)
12. [향후 확장](#12-향후-확장)

---

## 1. 문서 개요

### 1.1 목적

TripFrame 시스템의 전체 아키텍처, 데이터 모델, 핵심 엔진 설계, 보안 정책, 배포 구조 및 향후 확장 계획을 정의한다. 개발, 유지보수, 기술 의사결정의 기준 문서로 활용한다.

### 1.2 범위

MVP(Phase 1) 시스템 구조를 기준으로 하되, Phase 2~3 확장 설계(클라우드 동기화, 웹 확장, 교통 DB 연동)를 향후 확장 섹션에 포함한다.

### 1.3 참조 문서

| 문서명 | 문서 ID | 역할 |
|--------|---------|------|
| TripFrame Constitution | spec-kit/constitution.md | 불변 아키텍처 원칙, 기술 스택 고정 |
| 기능 명세서 | spec-kit/spec.md | FR/NFR, User Stories, 샘플 데이터 |
| 구현 계획서 | spec-kit/plan.md | Data Model, Engine Design, Dependency Graph |
| 앱 화면설계서 | TF-SDD-001 | 화면 구성, 컴포넌트, 인터랙션 |
| 디버깅 완료보고서 | report/260325/완료보고서_디버깅_v2.0.md | 환경 제약사항, 기술 결정 기록 |

---

## 2. 시스템 개요

### 2.1 제품 정의

TripFrame은 "여행 일정의 빈 칸을 찾아주는 앱"이다. 예약된 항공/숙박 정보를 입력하면 이동 시간을 역산하고, 공백 구간을 감지하여 해결 선택지를 제안한다. 기존 여행 앱(예약 보관, 관광지 추천)과 겹치지 않는 Pre-departure 특화 앱으로 포지셔닝한다.

### 2.2 핵심 기능 요약

| 우선순위 | 기능 | 설명 | Phase |
|---------|------|------|-------|
| P1 | 역산 타임라인 엔진 | 항공편 출발 시간 기준 역방향 시간 계산 → 집 출발 시간 도출 | MVP |
| P1 | 공백 구간 감지 | 인접 이벤트 간 이동수단 누락 구간 자동 감지 + 심각도 분류 | MVP |
| P2 | 이동수단 선택지 제안 | 공백 구간별 교통수단 옵션 비교 + 추천 | MVP |
| P2 | 커스터마이징 질문 | 짐 크기, 교통 선호, 여유도에 따른 추천 조정 | MVP |
| P3 | 예약 오픈 알림 | 교통편 예약 오픈일 자동 알림 | Post-MVP |
| P3 | 패스 경제성 분석 | 교통 패스 vs 개별 구매 가격 비교 | Post-MVP |
| P4 | 자유시간 활동 추천 | 체크인 전 여유시간 활동 제안 (외부 앱 연계) | Phase 2+ |

### 2.3 플랫폼 전략

| Phase | 플랫폼 | 기술 | 비고 |
|-------|--------|------|------|
| Phase 1 (MVP) | 모바일 (iOS/Android) | React Native (Expo SDK 54+) | Mobile-First, 변경 불가 |
| Phase 2 | 웹 | React + Vite 18+ | Shared Core 활용 |
| Phase 3 | PWA | Service Worker + Cache API | 오프라인 완전 지원 |

---

## 3. 아키텍처 설계

### 3.1 아키텍처 원칙 (Constitution Article III)

다음 원칙은 Constitution에서 정의된 불변 원칙이며, 모든 설계/구현 결정에 우선한다.

| 원칙 | 규칙 | 근거 |
|------|------|------|
| Logic-UI 분리 | 역산/공백감지/경제성 로직은 packages/core에 순수 함수로 구현. UI에 직접 작성 금지 | 플랫폼 독립성 + 테스트 용이성 |
| 단방향 데이터 흐름 | Zustand store → 컴포넌트. 컴포넌트에서 직접 store mutation 금지 | 예측 가능한 상태 관리 |
| 타입 안전 | any 타입 사용 금지. 모든 모델은 packages/core/src/types/에 정의 | 컴파일 타임 오류 방지 |
| 불변 데이터 | 이벤트 모델은 immutable. 업데이트는 항상 새 객체 반환 | Side effect 방지 |
| 오프라인 우선 | 핵심 기능은 네트워크 없이 동작 | 여행 중 네트워크 불안정 대응 |

### 3.2 시스템 구성도

TripFrame은 pnpm workspaces 기반 모노레포로 구성되며, Core 패키지와 Mobile App의 2계층으로 분리된다.

| 계층 | 패키지 | 경로 | 역할 |
|------|--------|------|------|
| Core Engine | @tripframe/core | packages/core/ | 플랫폼 독립 비즈니스 로직 (타입, 엔진, 데이터) |
| Mobile App | tripframe-mobile | apps/mobile/ | Expo React Native 앱 (UI, Store, Hooks, Navigation) |
| (Phase 2) Web App | tripframe-web | apps/web/ | React + Vite 웹앱 (Core 공유) |

### 3.3 의존성 그래프

컴포넌트 간 의존 방향은 엄격하게 단방향이다. 하위 계층은 상위 계층을 import할 수 없다.

| 계층 | 의존 대상 | 접근 방식 | 제약 |
|------|-----------|-----------|------|
| packages/core | (없음 — 외부 의존 0) | 순수 TypeScript 함수 | 외부 라이브러리 의존 금지 |
| apps/mobile/store | packages/core (types) | import type | 엔진 함수 직접 호출 금지 |
| apps/mobile/hooks | store + core engine | store 구독 + 엔진 호출 | UI 로직 포함 금지 |
| apps/mobile/components | hooks | hook 반환값 사용 | core/store 직접 import 금지 |
| apps/mobile/screens | components + hooks | 조합 + 레이아웃 | core 직접 import 금지 |

### 3.4 모노레포 구조

```
tripframe/
├── packages/
│   └── core/                    # @tripframe/core
│       ├── src/types/             # TripEvent, Gap, ReverseCalcResult
│       ├── src/engine/            # reverse-calc, gap-detector, economics
│       ├── src/data/              # airline-rules, transit-rules, sample-trip
│       └── tests/
├── apps/
│   └── mobile/                  # Expo React Native
│       ├── src/screens/           # 4개 탭 화면
│       ├── src/components/        # UI 컴포넌트
│       ├── src/hooks/             # useTripTimeline, useGapDetection
│       ├── src/store/             # Zustand (trip-store, ui-store)
│       └── src/navigation/        # Bottom Tab Navigator
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## 4. 기술 스택

### 4.1 고정 기술 스택 (Constitution Article IV)

다음 기술 스택은 Constitution에 의해 고정되었으며 변경 불가하다.

| 영역 | 기술 | 버전 | 선정 근거 | 대안 (배제 사유) |
|------|------|------|-----------|-----------------|
| 모바일 | Expo (React Native) | SDK 54+ | iOS/Android 동시 개발, OTA 업데이트 | Flutter (TS 생태계 불일치) |
| 언어 | TypeScript | 5.x | strict mode 타입 안전, Core 공유 | JavaScript (타입 안전 부재) |
| 상태관리 | Zustand | 4.x | 경량, 보일러플레이트 최소 | Redux (과잉 복잡성) |
| 로컬 저장 | AsyncStorage | - | React Native 표준, 단순 KV | SQLite (초기 복잡성 과잉) |
| 시각화 | React Native SVG | - | 타임라인 그래프 렌더링 | D3 (웹 전용, RN 미지원) |
| 테스트 | Jest + RNTL | - | RN 표준 테스트 도구 | Vitest (RN 호환 미흡) |
| 모노레포 | pnpm workspaces | - | 심볼릭 링크 + 빠른 설치 | nx (과잉 도구) |
| 클라우드 | Supabase | - | RLS, Auth, Realtime 통합 | Firebase (vendor lock-in) |
| 웹 (Phase 2) | React + Vite | 18+ | Core 패키지 직접 재사용 | - |

### 4.2 개발 환경

| 항목 | 값 | 비고 |
|------|-----|------|
| OS | Windows 11 Home | 한글 경로 포함 |
| Node.js | v22.21.0 | LTS |
| pnpm | 비표준 경로 설치 | `node ...pnpm.cjs` 형태로 실행 |
| 모듈 연결 | Metro extraNodeModules | pnpm 심볼릭 링크 대체 |
| E2E 테스트 | Playwright MCP | expo start --web 기반 |

---

## 5. 데이터 모델

### 5.1 설계 원칙 (Constitution Article VII)

- **Event 중심 설계**: 모든 일정 요소는 TripEvent 인터페이스로 표현
- **Gap은 파생 데이터**: 이벤트에서 계산되는 결과이며 직접 저장하지 않음
- **현지 시간 기준**: 모든 datetime은 현지 시간(local time) + IANA timezone 함께 저장
- **예약번호 옵셔널**: 예약번호 없이도 앱이 완전히 동작

### 5.2 핵심 타입 정의

#### EventType / EventStatus

| 타입명 | 값 | 설명 |
|--------|-----|------|
| EventType | `flight` | 항공편 |
| | `hotel` | 숙소 체크인/체크아웃 |
| | `transport` / `taxi` / `walk` / `subway` | 이동 수단 |
| | `activity` | 자유 시간 / 활동 |
| EventStatus | `ok` | 예약 완료 |
| | `pending` | 예약 미완료 |
| | `missing` | 공백 감지됨 (이동수단 없음) |
| | `auto` | 앱이 자동 삽입 |
| | `derived` | 역산으로 계산됨 |

#### TripEvent

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | Y | 고유 식별자 (UUID) |
| type | EventType | Y | 이벤트 유형 |
| title | string | Y | 이벤트 제목 |
| time | string (HH:MM) | Y | 시작 시간 (현지 시간) |
| location | string | N | 장소명 |
| status | EventStatus | Y | 이벤트 상태 |
| isDerived | boolean | N | 역산으로 생성된 이벤트 여부 |
| sub | string | N | 부제 (항공사명, 호텔명 등) |
| metadata | object | N | 추가 메타데이터 |

#### Gap

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | Y | 고유 식별자 |
| fromEventId / toEventId | string | Y | 공백 구간의 시작/종료 이벤트 ID |
| gapMinutes | number | Y | 공백 시간 (분) |
| severity | GapSeverity | Y | `DANGER` \| `WARNING` \| `OK` |
| message | string | Y | 사용자 표시 메시지 |
| type | string | N | 공백 유형 (예: 'transport') |
| suggestions | TransportOption[] | N | 제안 이동수단 목록 |

#### TransportOption

| 필드 | 타입 | 설명 |
|------|------|------|
| name | string | 이동수단명 (예: 유후인호 버스) |
| durationMinutes | number | 소요 시간 (분) |
| costPerPerson | number | 1인 가격 |
| currency | `'JPY'` \| `'KRW'` | 통화 |
| isRecommended | boolean | 추천 여부 |
| requiresReservation | boolean | 사전 예약 필요 여부 |

#### ReverseCalcResult

| 필드 | 타입 | 설명 |
|------|------|------|
| homeDepart | string (HH:MM) | 최종 계산된 집 출발 시간 |
| steps | ReverseCalcStep[] | 단계별 역산 과정 배열 |
| totalMinutes | number | 총 소요 시간 (분) |

**ReverseCalcStep 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| label | string | 단계 라벨 (예: 수속 마감) |
| time | string | 해당 단계 시간 (HH:MM 또는 -N분) |
| type | StepType | `ANCHOR` \| `RULE` \| `CALC` \| `DERIVED` \| `RESULT` |
| note | string | 부가 설명 |

---

## 6. 핵심 엔진 설계

모든 엔진은 `packages/core/src/logic/`에 순수 TypeScript 함수로 구현한다. 외부 의존성 없이 동작하며, 동일 입력에 대해 항상 동일 출력을 보장한다.

### 6.1 역산 알고리즘 (reverseEngine.ts)

항공편 출발 시간(Anchor)으로부터 역방향으로 각 단계를 차감하여 집 출발 시간을 계산한다.

| 단계 | 계산 | 데이터 소스 | 결과 예시 |
|------|------|-------------|-----------|
| 1. Anchor 설정 | flight.startTime | 사용자 입력 | 12:15 |
| 2. 수속 마감 | Anchor - airlineRule.minutes | 항공사 DB | 11:25 (50분 전) |
| 3. 카운터 도착 | 수속마감 - 40분 | 고정 버퍼 | 10:45 |
| 4. 이동 소요 | 카운터 - transitMinutes | 사용자 선택 (버스 75분/철도 50분) | 09:30 (버스) |
| 5. 출발지 탑승 | 이동 시작 지점 | 경로 계산 | 09:20 |
| 6. 집 출발 | 탑승 - 도보 여유 | 고정 버퍼 (5분) | 09:15 |

#### 항공사 규정 DB

| 항공사 코드 | 항공사명 | 국제선 마감 (분) | 비고 |
|------------|----------|----------------|------|
| LJ | 진에어 | 50 | LCC |
| KE | 대한항공 | 60 | FSC |
| OZ | 아시아나 | 60 | FSC |
| 7C | 제주항공 | 50 | LCC |
| TW | 티웨이항공 | 50 | LCC |
| (기본값) | - | 60 | 미등록 항공사 fallback + 경고 표시 |

> `Record<string, AirlineRule>` 구조로 설계. 새 항공사 추가 시 데이터만 추가하면 된다.

### 6.2 공백 감지 알고리즘 (gapEngine.ts)

| 순서 | 처리 | 설명 |
|------|------|------|
| 1 | 이벤트 정렬 | startTime 기준 오름차순 정렬 |
| 2 | 인접 쌍 순회 | events[i].time ~ events[i+1].time 검사 |
| 3 | 이동수단 확인 | 두 이벤트 사이에 transport 타입 이벤트가 있는지 확인 |
| 4 | Gap 생성 | 이동수단 없고 위치가 다르면 Gap 객체 생성 |
| 5 | Severity 판정 | 아래 판정 기준 적용 |
| 6 | 마지막 구간 검사 | 터미널/정류장 → 숙소 구간 별도 검사 (자동삽입 대상) |

#### Severity 판정 기준

| Severity | 조건 | 시각 표현 | 사용자 액션 |
|---------|------|-----------|------------|
| DANGER | 이동수단 타입 이벤트 없음 (위치가 다른데 transport 없음) | 빨강 실선, AlertTriangle | 이동수단 선택 필수 |
| WARNING | 이동수단 있으나 시간 여유 < 30분 | 노랑, AlertCircle | 여유시간 확인 권장 |
| OK | 이동수단 있고 여유 ≥ 30분 | (보고하지 않음) | 정상 |

### 6.3 경제성 분석 엔진 (economicsEngine.ts)

교통 패스 구매와 개별 구매의 가격을 비교하여 추천을 생성한다.

**입력:**

| 입력 | 타입 | 설명 |
|------|------|------|
| individualTrips | { cost, currency }[] | 개별 이동수단 가격 목록 |
| passOption | PassOption | 패스 가격 정보 (이름, 1인 가격, 유효일수) |
| people | number | 인원 수 |

**출력:**

| 출력 | 타입 | 설명 |
|------|------|------|
| individualTotal | number | 개별 구매 합계 (인원 반영) |
| passTotal | number | 패스 합계 (인원 반영) |
| recommendation | `'PASS'` \| `'INDIVIDUAL'` | 추천 옵션 |
| savingAmount | number | 절약 금액 |
| breakEvenTrips | number | 손익분기 이용 횟수 |

---

## 7. 데이터 흐름

### 7.1 상태 관리 아키텍처

TripFrame은 Zustand 기반 단방향 데이터 흐름을 사용한다. 모든 상태 변경은 Store의 Action을 통해서만 이루어지며, 컴포넌트는 Store를 직접 변경할 수 없다.

#### Trip Store (useTripStore.ts)

| 구분 | 항목 | 타입 | 설명 |
|------|------|------|------|
| State | trip | Trip | 전체 여행 데이터 (timelines 포함) |
| State | selectedDayIndex | number | 현재 선택된 날짜 인덱스 |
| State | reverseCalc | ReverseCalcResult | 역산 결과 |
| Action | setCurrentTab | (tab) => void | 탭 전환 |
| Action | setSelectedDay | (index) => void | 날짜 선택 변경 |
| Action | selectedTimeline | () => DayTimeline | 현재 선택된 날짜 타임라인 반환 |
| Action | allGaps | () => Gap[] | 전체 공백 목록 반환 |

#### UserPreferences

| 필드 | 타입 | 값 | 설명 |
|------|------|-----|------|
| luggageSize | enum | `CARRY_ON` \| `LARGE` | 짐 크기 (추천 교통수단 조정) |
| transportPreference | enum | `PUBLIC` \| `TAXI` \| `ANY` | 교통 선호도 |
| bufferPreference | enum | `TIGHT` \| `RELAXED` | 이동 여유 선호도 |

### 7.2 데이터 흐름도

| 단계 | 주체 | 처리 | 출력 |
|------|------|------|------|
| 1. 입력 | 사용자 | 항공편/숙소 정보 수동 입력 | TripEvent[] |
| 2. 저장 | trip-store | Zustand store에 이벤트 저장 | Store state 갱신 |
| 3-A. 역산 | useTripEngine hook | calculateReverseTime() 호출 | ReverseCalcResult |
| 3-B. 공백감지 | useGapDetection hook | detectGaps() 호출 | Gap[] |
| 3-C. 경제성 | useTripEngine hook | comparePassVsIndividual() 호출 | 비교 결과 |
| 4. 렌더링 | Screen/Component | hook 반환값 기반 UI 렌더링 | 화면 갱신 |

### 7.3 로컬 저장소 전략

| 저장 대상 | 저장소 | 암호화 | 비고 |
|---------|--------|--------|------|
| 이벤트 데이터 | AsyncStorage | 예 (예약번호 포함 시) | 앱 재시작 시 복원 |
| 사용자 설정 | AsyncStorage | 아니오 | 설정값만 저장 |
| 캐시 데이터 | 메모리 (Zustand) | 해당 없음 | 앱 종료 시 소멸 |
| (Phase 2) 동기화 | Supabase | RLS + TLS | 클라우드 백업 |

---

## 8. 보안 설계

Constitution Article VIII에 정의된 보안 원칙을 구체화한다.

### 8.1 데이터 보안

| 보안 영역 | 정책 | 구현 방법 | Phase |
|---------|------|-----------|-------|
| 로컬 저장 암호화 | 예약번호, 개인정보 포함 데이터는 암호화 저장 | expo-secure-store 또는 AES 암호화 래퍼 | MVP |
| API 키 관리 | 코드 하드코딩 절대 금지 | .env 파일 + expo-constants | MVP |
| 전송 보안 | 모든 네트워크 통신 TLS 1.2+ | HTTPS 강제 | Phase 2 |
| 클라우드 접근 제어 | 사용자별 데이터 격리 | Supabase RLS (Row Level Security) | Phase 2 |
| 인증 | 사용자 인증 후 동기화 | Supabase Auth (OAuth2 / Email) | Phase 2 |

### 8.2 개인정보 처리

| 데이터 유형 | 민감도 | 저장 위치 | 보존 기간 |
|-----------|--------|-----------|-----------|
| 예약번호 | 높음 | 기기 로컬 (암호화) | 여행 종료 후 사용자 삭제 |
| 항공편 정보 | 중간 | 기기 로컬 | 앱 내 관리 |
| 위치 정보 (출발지) | 높음 | 기기 로컬 (암호화) | 역산 계산 시에만 사용 |
| 여행 일정 | 중간 | 기기 로컬 → Phase 2: Supabase | 사용자 관리 |
| 사용자 설정 | 낮음 | 기기 로컬 | 영구 |

### 8.3 Phase 2 보안 체크리스트

Supabase 도입 전 필수 완료 항목:

- Supabase RLS 정책 설계: 사용자는 자신의 trip 데이터만 접근 가능
- 인증 플로우 설계: OAuth2 (Google, Apple) + Email/Password
- API Rate Limiting: Supabase Edge Functions에 rate limit 적용
- 데이터 마이그레이션: 로컬 데이터 → 클라우드 일회성 동기화 설계
- 토큰 저장: Refresh Token은 expo-secure-store에 저장

---

## 9. 성능 설계

### 9.1 성능 요구사항

| 항목 | 목표 | 측정 방법 | 비고 |
|------|------|-----------|------|
| 타임라인 렌더링 | 16ms 이하 (60fps) | React DevTools Profiler | FlatList virtualization 적용 |
| 역산 계산 | < 5ms | console.time / Jest benchmark | 순수 함수, O(n) 복잡도 |
| 공백 감지 | < 10ms (이벤트 100개 기준) | Jest benchmark | 정렬 O(n log n) + 순회 O(n) |
| 앱 시작 시간 | < 3초 (Cold Start) | Expo Performance | 샘플 데이터 로드 포함 |
| 메모리 사용 | < 100MB | Android Profiler / Xcode | 이벤트 1000개 기준 |

### 9.2 최적화 전략

| 전략 | 적용 대상 | 설명 |
|------|-----------|------|
| FlatList | TimelineScreen | 이벤트 목록 가상화로 렌더링 최적화 |
| useMemo / useCallback | 모든 Hook | 불필요한 재계산 방지 |
| Zustand selector | Store 구독 | 필요한 상태만 구독하여 불필요한 리렌더 방지 |
| 불변 데이터 참조 비교 | 이벤트 업데이트 | 새 객체 반환으로 변경 감지 최적화 (Object.is) |
| 지연 로딩 | 비교 탭, 경제성 분석 | P2/P3 기능은 진입 시 계산 |

---

## 10. 테스트 전략

### 10.1 테스트 계층

| 계층 | 도구 | 대상 | 커버리지 목표 |
|------|------|------|-------------|
| 단위 테스트 | Jest | packages/core (엔진, 타입) | ≥ 80% |
| 통합 테스트 | Jest + RNTL | apps/mobile (Hook + 화면) | 핵심 시나리오 4개 |
| E2E 테스트 (네이티브) | Maestro (Android) | 실제 앱 동작 흐름 | 핵심 플로우 3개 |
| E2E 테스트 (웹) | Playwright MCP | expo start --web 기반 | 4개 탭 전체 |

### 10.2 핵심 테스트 시나리오

| 시나리오 | 검증 내용 | 예상 결과 |
|---------|-----------|-----------|
| 역산 계산 정확성 | LJ263 12:15 출발, 버스 75분 → 집 출발 시간 | 09:15 |
| 공백 감지 (DANGER) | 하카타 체크아웃 → 유후인 체크인 (이동수단 없음) | severity: DANGER |
| 공백 감지 (AUTO) | 버스센터 → 잇코텐 (택시 자동삽입) | severity: OK, status: AUTO |
| 경제성 비교 | 버스 2회 (13,000엔) vs 산큐패스 (16,000엔) | recommendation: INDIVIDUAL, saving: 3,000엔 |

### 10.3 코드 품질 기준 (Constitution Article V)

| 기준 | 규칙 | 검증 방법 |
|------|------|-----------|
| TypeScript strict | strict: true, noImplicitAny: true | pnpm typecheck |
| any 타입 금지 | any 사용 0건 | ESLint @typescript-eslint/no-explicit-any |
| 함수 크기 | 단일 함수 50줄 초과 금지 | 코드 리뷰 |
| 테스트 커버리지 | packages/core ≥ 80% | jest --coverage |
| Hook 경유 강제 | 컴포넌트에서 core 직접 import 금지 | ESLint no-restricted-imports |

---

## 11. 배포 아키텍처

### 11.1 MVP 배포 (Phase 1)

| 항목 | 방식 | 설명 |
|------|------|------|
| 앱 배포 | Expo EAS Build | iOS App Store + Google Play Store 빌드/제출 |
| OTA 업데이트 | Expo Updates (EAS Update) | JS 번들 업데이트는 스토어 심사 없이 배포 |
| 환경변수 | eas.json + .env | 빌드 프로필별 환경변수 분리 (dev/staging/prod) |
| CI/CD | GitHub Actions (제안) | PR 시 테스트 자동 실행 + EAS Build 트리거 |

### 11.2 Phase 2 배포 (웹 확장)

| 항목 | 방식 | 설명 |
|------|------|------|
| 웹 배포 | Vercel 또는 Netlify | React + Vite 정적 빌드 배포 |
| API (Supabase) | Supabase Cloud | 인증, DB, Edge Functions |
| CDN | Vercel Edge / Cloudflare | 정적 자산 글로벌 배포 |

---

## 12. 향후 확장

MVP 이후 확장 계획. Constitution Article IX(우선순위 원칙)에 따라 P1 완전 완성 후 진행한다.

### 12.1 Phase 2 확장 (확정)

| 기능 | 설명 | 기술 요소 | 선행 조건 |
|------|------|-----------|-----------|
| Supabase 클라우드 동기화 | 로컬 데이터를 클라우드 백업, 다기기 동기화 | Supabase Auth + RLS + Realtime | 보안 체크리스트 (8.3) 통과 |
| React 웹앱 | apps/web/ 추가, Core 패키지 공유 | React 18 + Vite + D3 (웹 전용) | Core 패키지 안정화 |
| 예약 이메일 파싱 | Gmail 연동, 예약 확인 메일에서 이벤트 자동 생성 | Gmail API + NLP 파서 | Supabase Auth |
| 항공편 지연 실시간 반영 | 출발 지연 시 역산 타임라인 자동 재계산 | FlightAware API 또는 유사 | 역산 엔진 완성 |

### 12.2 교통 데이터 연동 설계 (하이브리드 방식)

오프라인 우선(Constitution Article III-5)을 준수하면서 정확도를 높이는 하이브리드 전략:

| 계층 | 역할 | 데이터 | 네트워크 |
|------|------|--------|---------|
| Layer 1: 내장 DB (Primary) | 오프라인 기본 데이터 제공 | 주요 노선 시각표 (정적 스냅샷) | 불필요 |
| Layer 2: API 보완 (Secondary) | 실시간/최신 데이터로 내장 DB 갱신 | 운행 변경, 임시 편성, 가격 변동 | 필요 (선택적) |
| Layer 3: 캐시 | API 응답 로컬 캐시 | 마지막 조회 결과 | - |
