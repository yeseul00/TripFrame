# TripFrame 기술 의사결정 브리핑

> **문서 ID**: TF-TECH-001
> **작성일**: 2026-03-29
> **작성자**: Expert 2 (기술 아키텍처 전문가)
> **대상**: Constitution Article IV 수정 검토, TD-04 암호화 방식 결정
> **참조**: TF-REVIEW-CLAUDE, 사용자 1·2차 피드백

---

## 1. 문서 목적

TripFrame의 기술 스택 재검토를 위한 의사결정 자료. 세 가지 질문에 답한다:
1. Expo를 고집해야 하는 이유가 있는가?
2. 대안 프레임워크(Flutter, KMP 등)와의 비교
3. AsyncStorage → SQLite 전환 시 고려사항

---

## 2. "Expo"라는 단어에 섞인 3가지 개념

| 개념 | 설명 | TripFrame 판정 |
|------|------|--------------|
| Expo Go | 네이티브 모듈 제한된 샌드박스 테스트 앱. SecureStore 2KB 제한, WidgetKit 불가 | **즉시 졸업** |
| Expo SDK + CLI | React Native 위의 프레임워크 레이어. expo-crypto, expo-sqlite, Config Plugin 등 포함. `npx expo prebuild`로 네이티브 코드 직접 접근 가능 | **유지** |
| EAS (Expo Application Services) | 클라우드 빌드(EAS Build), OTA 업데이트(EAS Update), 앱 스토어 제출(EAS Submit) | **적극 채택** |

### 핵심 구분

- Expo Go → Development Build 전환은 "Expo를 버리는 것"이 아니라 "훈련바퀴를 떼는 것"
- Expo SDK를 쓰면서도 네이티브 코드를 직접 작성할 수 있음 (Bare Workflow = Expo CLI가 설치된 Bare React Native)
- EAS는 CI/CD 인프라를 직접 구축하는 것(GitHub Actions + Fastlane + CodePush)의 대체제

---

## 3. 크로스플랫폼 프레임워크 비교 (2026)

### 3.1 시장 현황

| 프레임워크 | 개발사 | 언어 | 시장 점유율 (2026) | 핵심 특징 |
|-----------|-------|------|-----------------|---------|
| Flutter | Google | Dart | 42~46% (1위) | 자체 렌더링 엔진(Impeller), 픽셀 퍼펙트 UI, 모바일+웹+데스크톱 |
| React Native + Expo | Meta + Expo | TypeScript/JS | 35~42% (2위) | 네이티브 컴포넌트 사용, 최대 JS 생태계, OTA 업데이트 |
| Kotlin Multiplatform | JetBrains | Kotlin | 18~23% (급성장) | 로직만 공유+네이티브 UI, Netflix/Duolingo/Cash App 사용 |
| .NET MAUI | Microsoft | C# | 소수 | C#/XAML 생태계 전용 |
| Ionic | Drifty | JS (WebView) | 소수 | 웹뷰 기반, 성능 한계 |

### 3.2 Flutter 상세

**장점**:
- Impeller 2.0 렌더링 엔진으로 120 FPS 안정 성능
- 핫 리로드, 위젯 기반 선언형 UI
- 모바일+웹+데스크톱+임베디드 단일 코드베이스
- MVP 출시 기간: 12~16주 (네이티브 대비 40% 단축)

**단점**:
- Dart 언어 학습 필요
- 앱 바이너리 크기 4~8MB 더 큼 (렌더링 엔진 포함)
- iOS에서 네이티브 느낌이 약간 부족할 수 있음

**TripFrame에 대한 치명적 문제**: `@tripframe/core`가 TypeScript → Dart 전면 재작성 필요. 역산 엔진, 공백 감지, 경제성 계산, 랭킹 알고리즘, 모든 테스트 케이스가 무력화됨.

### 3.3 Kotlin Multiplatform 상세

**장점**:
- 네이티브 성능 최상 (컴파일 타임 최적화)
- 기존 Android Kotlin 코드와 자연스럽게 통합
- Netflix, Duolingo, Cash App 등 대규모 프로덕션 검증
- Compose Multiplatform으로 UI 공유도 가능해지는 추세

**단점**:
- UI를 iOS/Android 각각 작성해야 함 (Compose Multiplatform은 아직 초기)
- Kotlin 학습 필요
- 생태계가 Flutter/RN 대비 작음

**TripFrame에 대한 치명적 문제**: TypeScript Core → Kotlin 재작성 + 1인 개발자가 2개 플랫폼 UI 유지보수 = 2배 작업량.

### 3.4 .NET MAUI / Ionic

TripFrame 맥락에서 실질적 후보 아님. .NET MAUI는 C# 전용, Ionic은 웹뷰 기반 성능 한계.

---

## 4. TripFrame 맥락 의사결정 매트릭스

| 기준 (가중치) | Expo+EAS | Bare RN | Flutter | KMP |
|-------------|---------|---------|---------|-----|
| **Core 재사용 (30%)** | TS 직접 import | TS 직접 import | Dart 재작성 필요 | Kotlin 재작성 필요 |
| **웹 확장 (15%)** | React+Vite+Core | React+Vite+Core | Flutter Web (Wasm) | 별도 웹앱 |
| **B2B API Track (15%)** | Core = npm 패키지 | Core = npm 패키지 | Dart 패키지만 | KMP 아티팩트 |
| **1인 개발 속도 (10%)** | 최고 (EAS 자동화) | 높음 | 높음 (Dart 학습) | 낮음 (2x UI) |
| **OTA 업데이트 (10%)** | EAS Update 내장 | CodePush (별도 설정) | Shorebird (3rd party) | 불가 |
| **마이그레이션 비용 (10%)** | 제로 (현재 상태) | 낮음 (prebuild) | 전면 재작성 | 전면 재작성 |
| **네이티브 성능 (5%)** | 양호 (New Architecture) | 양호 (New Architecture) | 우수 | 네이티브 |
| **채용 풀 (5%)** | 최대 (JS/TS) | 최대 (JS/TS) | 성장 중 (Dart) | 소규모 (Kotlin) |
| **가중 점수** | **92 / 100** | **85 / 100** | **52 / 100** | **38 / 100** |

### 판정

- **Expo+EAS**: 권고. 마이그레이션 비용 제로, Core 재사용 100%, OTA 내장
- **Bare RN**: 유효한 대안이지만 EAS 인프라 보너스가 없음
- **Flutter**: 우수한 프레임워크이나, TS Core 재작성 비용이 치명적
- **KMP**: 네이티브 성능 최고이나, 2x UI 작업량이 1인 개발에 비현실적

### 핵심 결론

프레임워크를 바꿀 이유가 없다. TripFrame의 가장 큰 자산은 `@tripframe/core`의 TypeScript 순수 함수들이며, 이것이 B2B API Track, 웹 확장, 클로드 코드 연동의 기반이다. Flutter/KMP로 전환하면 이 자산을 전부 버려야 한다.

---

## 5. 스토리지 아키텍처 전환 분석

### 5.1 현재 문제: AsyncStorage의 한계

| 문제 | 상세 | 영향 |
|------|------|------|
| 대량 데이터 성능 | 100개+ 레코드에서 느려짐. 모든 데이터를 JSON.parse로 한 번에 로드 | 앱 시작 시 2~3초 지연 |
| 쿼리 불가 | KV 구조라 필터링/정렬/조인 불가. "서울→부산 KTX"만 검색하려면 전체 로드 후 JS에서 필터 | O(n) 검색 |
| 크기 제한 | 이론적 무제한이지만, 메모리에 전부 올려야 하므로 실질적 한계 존재 | 50MB+ 시 크래시 가능 |
| 암호화 | 평문 저장. 별도 래퍼 필요 | 보안 취약 |

### 5.2 TripFrame 미래 데이터 규모 예측

| 데이터 유형 | 현재 | Phase 5+ | 해외 확장 시 |
|-----------|------|---------|----------|
| 여행 | 3개 | 50개+ | 100개+ |
| 이벤트 | 20개 | 500개+ | 2,000개+ |
| 교통 노선 | 10개 (하드코딩) | 100개 (국내) | 1,000개+ |
| 공항/항공사 | 5개 | 100개 | 500개+ |
| 도시 템플릿 | 0개 | 10개 | 50개+ |
| **합계** | **~40 레코드** | **~760 레코드** | **~3,650+ 레코드** |

### 5.3 이중 스토리지 아키텍처 제안

**Layer 1 — 사용자 데이터 (KV Store)**:
- 대상: Trip, Event, Settings, UserPreferences
- 저장소: `expo-sqlite/kv-store`
- API: AsyncStorage와 동일 (import 1줄 변경만으로 마이그레이션)
- 암호화: expo-crypto AES-GCM 적용 (Phase 4)
- 특징: Zustand persist 코드 수정 불필요

**Layer 2 — 참조 데이터 (Full SQL)**:
- 대상: TransportRoute, AirportProfile, AirlineRule, CityTemplate
- 저장소: `expo-sqlite` (SQL 쿼리)
- API: SQL (SELECT, JOIN, INDEX, WHERE)
- 암호화: 불필요 (공개 데이터)
- 특징: 필터링/정렬/인덱싱으로 1,000개+ 노선도 즉시 검색

### 5.4 마이그레이션 경로

**Phase 4 (즉시)**:
```
- import AsyncStorage from '@react-native-async-storage/async-storage';
+ import AsyncStorage from 'expo-sqlite/kv-store';
```
이 한 줄 변경으로 사용자 데이터가 SQLite 기반 KV Store로 전환됨. 기존 코드 수정 제로.

**Phase 5 (교통 DB 도입 시)**:
- `packages/core/src/types/transport.ts`에 `TransportRoute`, `AirportProfile` 타입 정의
- `apps/mobile/src/db/` 디렉토리에 SQLite 스키마 + 마이그레이션 코드
- `SQLiteProvider`로 앱 래핑
- Drizzle ORM 도입 검토 (타입 안전 쿼리 빌더)

**Phase 5+ (암호화 강화)**:
- expo-secure-store에 AES 마스터 키 저장 (Dev Build 전환 후)
- SQLCipher 옵션 검토 (DB 레벨 전체 암호화)

### 5.5 장단점 종합

| 항목 | 장점 | 단점/주의사항 |
|------|------|------------|
| KV Store 전환 | import 1줄, 코드 수정 제로, 동기 API 추가 | expo-sqlite 패키지 의존성 추가 |
| 참조 DB SQL화 | 1,000개+ 쿼리 성능 비약적 향상, 인덱싱 | 스키마 설계 + 마이그레이션 관리 필요 |
| SQLCipher | DB 레벨 전체 암호화 (PRAGMA key) | Dev Build 필수 (Expo Go 미지원) |
| Drizzle ORM | TypeScript 타입 안전 쿼리, SQL 직접 작성 불필요 | 추가 학습 비용 |
| Supabase 동기화 | 로컬 SQLite ↔ PostgreSQL 동기화는 업계 표준 패턴 | SyncEngine 재설계 필요 |
| Core 영향 | **`@tripframe/core` 변경 불필요** (순수 함수, 스토리지 무관) | Store 계층(apps/mobile/store)만 수정 |

### 5.6 Core 분리 원칙의 가치

`@tripframe/core`의 순수 함수들(`calculateReverseTime`, `detectGaps`, `rankOptions` 등)은 스토리지가 무엇이든 상관없음. `TripEvent[]`를 받아서 결과를 반환할 뿐, 데이터가 AsyncStorage에서 왔는지 SQLite에서 왔는지 모름.

스토리지 전환의 영향 범위는 `apps/mobile/src/store/` 디렉토리에만 한정됨. Constitution Article III-1(Logic-UI 분리)이 정확히 이 상황을 위해 존재하는 원칙.

---

## 6. TD-04 암호화 방식: 2단계 전략

### Phase 4 (즉시): expo-crypto AES-256-GCM

- Expo Go/Dev Build 모두에서 동작
- Trip JSON 전체를 암호화 가능 (크기 제한 없음)
- 키는 KV Store에 저장 (약점: 루팅 기기에서 키 추출 가능)
- 개인정보보호법 제29조 "기술적 안전조치" 충족

### Phase 5 (업그레이드): + expo-secure-store 키 보관

- Dev Build 전환 후 마스터 키를 Keychain/Keystore에 이동
- 데이터 암호화 로직은 동일 (래퍼 함수 인터페이스 불변)
- 키 저장 위치만 변경: `KVStore.getItem('masterKey')` → `SecureStore.getItemAsync('masterKey')`
- 루팅 기기에서도 키 보호됨 (하드웨어 보안 모듈)

### 보안 등급 비교

| 위협 시나리오 | 현재 (평문) | Phase 4 (AES-GCM) | Phase 5 (+ SecureStore) |
|-------------|-----------|------------------|----------------------|
| 기기 분실 (비루팅) | 노출 | 보호됨 | 보호됨 |
| 루팅 기기 파일 접근 | 노출 | 키 노출 가능 | 보호됨 |
| 개인정보보호법 제29조 | 미준수 | 준수 | 준수 (하드웨어 보안) |

---

## 7. Constitution Article IV 수정안

### 현행

| 영역 | 기술 | 비고 |
|------|------|------|
| 모바일 | Expo (React Native) SDK 51+ | 변경 불가 |
| 로컬 저장 | AsyncStorage (모바일) | SQLite는 복잡성 증가 시만 |

### 수정안

| 영역 | 기술 | 비고 |
|------|------|------|
| 모바일 | Expo SDK + EAS Build (Development Build 필수, Expo Go 제외) | SDK 54+ |
| 사용자 데이터 저장 | expo-sqlite/kv-store | AsyncStorage API 호환, import 1줄 변경 |
| 참조 데이터 저장 | expo-sqlite (Full SQL) | 교통/공항/항공사/템플릿 DB |
| 암호화 (Phase 4) | expo-crypto AES-256-GCM | 사용자 데이터 암호화 |
| 암호화 (Phase 5) | + expo-secure-store (키 보관) | 하드웨어 보안 모듈 |
| ORM (선택) | Drizzle ORM | 참조 DB 타입 안전 쿼리 |

---

*TF-TECH-001 v1.0 | 기술 의사결정 브리핑 | Expert 2 | 2026-03-29*
