# Phase 2: Transport Options + Customization
## Sprint 2 전체 설계서

**Feature**: `002-tripframe-phase2`
**Version**: 1.0
**Created**: 2026-03-27
**Status**: Planning

---

## 📋 목차

0. [사전 환경](#사전-환경)
1. [개요](#개요)
2. [목표 및 범위](#목표-및-범위)
3. [핵심 기능](#핵심-기능)
4. [기술 아키텍처](#기술-아키텍처)
5. [Phase 구성](#phase-구성)
6. [일정 계획](#일정-계획)
7. [리스크 및 대응](#리스크-및-대응)
8. [문서 구조](#문서-구조)

---

## 사전 환경

Phase 2 구현을 시작하기 전에 다음 환경을 준비해야 합니다.

### 1. 필수 계정

#### 1.1 Supabase
- **목적**: Backend-as-a-Service (데이터베이스, 인증, Realtime)
- **가입**: https://supabase.com
- **플랜**: 무료 플랜으로 시작 가능 (Pro 플랜 권장: $25/월)
- **준비 사항**:
  - 프로젝트 생성
  - Project URL 확보
  - Anon Key 확보
  - Service Role Key 확보 (관리 작업용, 민감 정보)

#### 1.2 Google Cloud Console
- **목적**: Google OAuth 2.0 로그인
- **가입**: https://console.cloud.google.com
- **준비 사항**:
  1. 프로젝트 생성
  2. OAuth 동의 화면 구성
  3. OAuth 2.0 Client ID 생성:
     - **Web**: Supabase Redirect URI용
     - **iOS**: Bundle ID용
     - **Android**: SHA-1 지문용
  4. Client ID 및 Client Secret 확보

#### 1.3 Apple Developer Program
- **목적**: Apple Sign-In
- **가입**: https://developer.apple.com
- **비용**: $99/년 (필수)
- **준비 사항**:
  1. App ID 생성 (Sign In with Apple 활성화)
  2. Service ID 생성
  3. Return URL 설정 (Supabase Redirect URI)
  4. Key 생성 및 다운로드

#### 1.4 Google Maps Platform (선택)
- **목적**: Transport Options API (경로 탐색)
- **가입**: https://console.cloud.google.com
- **준비 사항**:
  - Directions API 활성화
  - API 키 생성
  - 결제 정보 등록 (무료 크레딧 $200/월 제공)

### 2. 개발 도구

#### 2.1 필수 도구

**Node.js** (v18 이상)
```bash
# 버전 확인
node -v  # v18.0.0 이상

# 없다면 설치
# https://nodejs.org/en/download
```

**pnpm** (v8 이상)
```bash
# 설치
npm install -g pnpm

# 버전 확인
pnpm -v  # 8.0.0 이상
```

**Expo CLI**
```bash
# 설치
npm install -g expo-cli

# 버전 확인
expo --version
```

**Git**
```bash
# 버전 확인
git --version

# 없다면 설치
# https://git-scm.com/downloads
```

#### 2.2 모바일 테스트 환경

**Android (Windows/Mac/Linux)**
1. Android Studio 설치: https://developer.android.com/studio
2. Android SDK 설치 (API Level 33 이상)
3. Android Emulator 생성:
   ```bash
   # AVD Manager에서 생성 또는
   expo run:android
   ```

**iOS (Mac 전용)**
1. Xcode 설치 (App Store)
2. Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
3. iOS Simulator:
   ```bash
   expo run:ios
   ```

#### 2.3 선택 도구 (로컬 개발)

**Supabase CLI** (로컬 Supabase 환경)
```bash
# 설치
npm install -g supabase

# 로컬 Supabase 시작
supabase start

# 스키마 적용
supabase db push --local
```

**Docker Desktop** (Supabase CLI 의존성)
- 다운로드: https://www.docker.com/products/docker-desktop

### 3. 환경 변수 설정

Phase 2 구현 시 필요한 환경 변수 템플릿:

**파일**: `tripframe/apps/mobile/.env`

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your_google_client_id_ios
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your_google_client_id_android
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your_google_client_id_web

# Apple OAuth (iOS only)
EXPO_PUBLIC_APPLE_SERVICE_ID=your_apple_service_id

# Google Maps (선택)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**보안 주의사항**:
- `.env` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.env` 포함 확인
- Service Role Key는 서버 사이드에서만 사용

### 4. IDE 설정 (권장)

#### VS Code Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "expo.vscode-expo-tools",
    "supabase.supabase-vscode"
  ]
}
```

설치:
```bash
# VS Code에서
Ctrl+Shift+X → "ESLint" 검색 → Install
```

#### TypeScript 설정
- 프로젝트에 이미 `tsconfig.json` 포함됨
- Strict mode 활성화 확인
- `@tripframe/core` 패키지 path alias 확인

### 5. 프로젝트 초기 설정

```bash
# 1. 리포지토리 클론 (이미 완료했다면 Skip)
git clone https://github.com/your-username/TripFrame.git
cd TripFrame/tripframe

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 파일 생성
cd apps/mobile
cp .env.example .env  # 템플릿 복사 후 실제 값 입력

# 4. Core 패키지 빌드
cd ../..
pnpm --filter @tripframe/core build

# 5. 테스트 실행 (선택)
pnpm --filter @tripframe/core test
```

### 6. 체크리스트

Phase 2 구현 시작 전 확인:

- [ ] Supabase 프로젝트 생성 완료
- [ ] Supabase Project URL 및 Anon Key 확보
- [ ] Google Cloud Console 프로젝트 생성
- [ ] Google OAuth Client ID 생성 (iOS, Android, Web)
- [ ] Apple Developer 계정 가입 ($99/년)
- [ ] Node.js v18+ 설치 확인
- [ ] pnpm v8+ 설치 확인
- [ ] Expo CLI 설치 확인
- [ ] Android Studio 또는 Xcode 설치 (모바일 테스트)
- [ ] `.env` 파일 생성 및 키 입력
- [ ] `pnpm install` 성공
- [ ] `pnpm --filter @tripframe/core test` 통과

모든 항목이 체크되면 **TASK-031**부터 시작할 준비가 완료된 것입니다.

---

## 개요

### Phase 1 완료 현황

**MVP 완성 상태** (2026-03-27):
- ✅ 역산 타임라인 엔진
- ✅ 공백 감지 (DANGER/WARNING)
- ✅ 자유시간 계산
- ✅ 다크 테마 UI
- ✅ E2E 테스트 100% 통과
- ✅ Core 테스트 97% 통과

**제한사항**:
- 로컬 데이터만 지원 (클라우드 동기화 없음)
- 단일 사용자 (인증 없음)
- 정적 데이터 (이메일 파싱 없음)
- 수동 입력만 가능

### Phase 2 목표

**핵심 가치 제안**:
> "여행 계획을 클라우드에 저장하고, 여러 이동 옵션을 비교하며, 내 상황에 맞는 추천을 받자"

**전환 포인트**:
- Local-only → **Cloud-synced**
- Anonymous → **Authenticated**
- Static → **Personalized**
- Manual → **Semi-automated**

---

## 목표 및 범위

### 비즈니스 목표

1. **사용자 확보**: Google/Apple 간편 로그인으로 진입 장벽 낮춤
2. **데이터 지속성**: 클라우드 동기화로 디바이스 변경 시에도 데이터 유지
3. **개인화**: 사용자별 선호도 반영한 맞춤 추천
4. **편의성**: 여러 이동 옵션을 한눈에 비교

### 기술 목표

1. **Supabase 백엔드 구축**
   - PostgreSQL 데이터베이스
   - Row Level Security (RLS)
   - Real-time subscriptions

2. **인증 시스템 구현**
   - OAuth 2.0 (Google, Apple)
   - JWT 기반 세션 관리
   - 안전한 토큰 저장

3. **오프라인 동기화**
   - Local-first 아키텍처
   - 충돌 해결 (Last Write Wins)
   - 백그라운드 동기화

4. **추천 알고리즘**
   - 사용자 프로필 기반 필터링
   - 다기준 의사결정 (Multi-Criteria Decision Making)

### 범위 정의

#### In-Scope (포함)
- ✅ Google/Apple 소셜 로그인
- ✅ Trip 데이터 클라우드 저장/불러오기
- ✅ 이동수단 비교 UI (OptionCard)
- ✅ 사용자 설정 (짐 크기, 교통 선호)
- ✅ 설정 기반 추천 우선순위 조정
- ✅ 예약 링크 연동

#### Out-of-Scope (제외, Phase 3+)
- ❌ 예약 이메일 자동 파싱 (Gmail API)
- ❌ 실시간 항공편 지연 알림
- ❌ 패스 경제성 자동 계산
- ❌ AI 기반 활동 추천
- ❌ 공유 여행 (다중 사용자 협업)

---

## 핵심 기능

### F1: 사용자 인증 (Authentication)

**User Story**:
> "여러 디바이스에서 내 여행 계획을 보고 싶다"

**요구사항**:
- REQ-AUTH-001: Google Sign-In으로 로그인
- REQ-AUTH-002: Apple Sign-In으로 로그인 (iOS)
- REQ-AUTH-003: JWT 토큰으로 세션 유지
- REQ-AUTH-004: 자동 로그인 (토큰 갱신)
- REQ-AUTH-005: 로그아웃

**Acceptance Criteria**:
- Google 계정으로 3초 내 로그인 완료
- 로그인 성공 시 사용자 프로필 표시 (이름, 이메일, 사진)
- 토큰 만료 시 자동 갱신 (사용자 개입 없음)

### F2: 클라우드 동기화 (Cloud Sync)

**User Story**:
> "폰을 바꿔도 내 여행 계획이 그대로 남아있었으면 좋겠다"

**요구사항**:
- REQ-SYNC-001: Trip 생성 시 Supabase에 자동 저장
- REQ-SYNC-002: Trip 수정 시 실시간 동기화
- REQ-SYNC-003: 앱 시작 시 최신 데이터 불러오기
- REQ-SYNC-004: 오프라인 모드에서도 로컬 편집 가능
- REQ-SYNC-005: 온라인 복구 시 충돌 해결 (Last Write Wins)

**Acceptance Criteria**:
- 네트워크 연결 시 3초 내 동기화 완료
- 오프라인에서 편집 후 온라인 전환 시 자동 업로드
- 동일 Trip을 여러 디바이스에서 동시 편집 시 최신 수정본 유지

### F3: 이동수단 비교 (Transport Options)

**User Story**:
> "하카타에서 유후인까지 가는 방법을 한눈에 비교하고 싶다"

**요구사항**:
- REQ-FR-015: 이동수단별 OptionCard (요금, 시간, 메모)
- REQ-FR-016: 사용자 설정 기반 추천 우선순위
- REQ-FR-017: 예약 링크 포함
- REQ-FR-018: 인원수 반영 합산 비용

**Acceptance Criteria**:
- 구간당 2개 이상 옵션 표시
- 추천 옵션은 퍼플 테두리로 강조
- 예약 필요 시 "예약하기" 버튼 표시

### F4: 사용자 설정 (User Preferences)

**User Story**:
> "대형 캐리어를 끌고 다녀서 대중교통보다 택시를 선호한다"

**요구사항**:
- REQ-PREF-001: 짐 크기 선택 (CARRY_ON / LARGE)
- REQ-PREF-002: 교통 선호 (PUBLIC / TAXI / ANY)
- REQ-PREF-003: 여유도 (TIGHT / RELAXED)
- REQ-PREF-004: 설정을 Supabase에 저장

**Acceptance Criteria**:
- 설정 변경 시 즉시 추천 순위 재계산
- 디바이스 간 설정 동기화

---

## 기술 아키텍처

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Screens   │  │   Hooks    │  │  Zustand   │        │
│  │            │→ │            │→ │   Store    │        │
│  └────────────┘  └────────────┘  └─────┬──────┘        │
│                                         ↓                │
│                                  ┌─────────────┐        │
│                                  │ SyncEngine  │        │
│                                  │ (Local-1st) │        │
│                                  └──────┬──────┘        │
│                                         ↓                │
│  ┌────────────┐                 ┌─────────────┐        │
│  │AsyncStorage│ ←─────────────→ │  Supabase   │        │
│  │  (Local)   │                 │   Client    │        │
│  └────────────┘                 └──────┬──────┘        │
└────────────────────────────────────────┼────────────────┘
                                         ↓
                              ┌──────────────────────┐
                              │   Supabase Cloud     │
                              │  ┌────────────────┐  │
                              │  │  PostgreSQL    │  │
                              │  │  + RLS Policy  │  │
                              │  └────────────────┘  │
                              │  ┌────────────────┐  │
                              │  │  Auth (OAuth)  │  │
                              │  └────────────────┘  │
                              │  ┌────────────────┐  │
                              │  │  Realtime API  │  │
                              │  └────────────────┘  │
                              └──────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React Native 0.81 | 모바일 UI |
| **State** | Zustand 5.0 | 클라이언트 상태 관리 |
| **Local DB** | AsyncStorage | 오프라인 지속성 |
| **Backend** | Supabase | BaaS (Backend as a Service) |
| **Database** | PostgreSQL | 관계형 DB |
| **Auth** | Supabase Auth | OAuth 2.0 (Google, Apple) |
| **Realtime** | Supabase Realtime | WebSocket 기반 동기화 |

### Data Flow

```
User Action → Zustand Store → SyncEngine
                ↓                   ↓
          AsyncStorage          Supabase
          (Immediate)        (Background)
```

**동기화 전략**:
1. **Local-first**: 모든 변경은 먼저 로컬에 저장
2. **Background sync**: 네트워크 가능 시 백그라운드로 업로드
3. **Optimistic UI**: 서버 응답 기다리지 않고 즉시 UI 업데이트
4. **Conflict resolution**: Last Write Wins (LWW)

---

## Phase 구성

### Phase 2.1: 백엔드 기반 (Week 1-2)

**목표**: Supabase 프로젝트 설정 및 인증 구현

**Deliverables**:
- Supabase 프로젝트 생성 (dev/prod)
- 데이터베이스 스키마 적용
- RLS 정책 설정
- Google Sign-In 통합
- Apple Sign-In 통합 (iOS)

**완료 기준**:
- 사용자가 Google/Apple로 로그인 가능
- 로그인 후 JWT 토큰 발급
- RLS로 사용자별 데이터 격리 확인

### Phase 2.2: 동기화 엔진 (Week 3)

**목표**: 로컬 ↔ 클라우드 동기화 구현

**Deliverables**:
- SyncEngine 구현
- AsyncStorage ↔ Supabase 동기화
- 충돌 해결 로직
- 네트워크 상태 감지

**완료 기준**:
- Trip 생성/수정 시 Supabase에 자동 저장
- 오프라인 편집 후 온라인 전환 시 자동 업로드
- 여러 디바이스에서 동일 Trip 동기화 확인

### Phase 2.3: Transport Options UI (Week 4)

**목표**: 이동수단 비교 화면 구현

**Deliverables**:
- OptionCard 컴포넌트
- SuggestionScreen 개선
- 추천 알고리즘 (사용자 설정 반영)
- 예약 링크 연동

**완료 기준**:
- 하카타→유후인 구간에서 2개 이상 옵션 표시
- 사용자 설정 변경 시 추천 순위 변경 확인
- 예약 링크 클릭 시 브라우저 열림

### Phase 2.4: 사용자 설정 (Week 5)

**목표**: 개인화 기능 구현

**Deliverables**:
- 설정 화면 (Settings Screen)
- 사용자 프로필 편집
- 선호도 입력 UI
- 설정 Supabase 동기화

**완료 기준**:
- 설정 화면에서 짐 크기, 교통 선호, 여유도 선택 가능
- 설정이 Supabase에 저장되고 디바이스 간 동기화

### Phase 2.5: 테스트 및 배포 (Week 6)

**목표**: 품질 보증 및 배포 준비

**Deliverables**:
- E2E 테스트 (Phase 2 기능)
- 통합 테스트 (Supabase)
- 성능 테스트
- Expo EAS Build

**완료 기준**:
- E2E 테스트 100% 통과
- 평균 동기화 시간 < 3초
- TestFlight/Internal Testing 배포

---

## 일정 계획

### 전체 일정 (6주)

| Week | Phase | 주요 작업 | 목표 |
|------|-------|----------|------|
| **W1** | 2.1 | Supabase 설정, 스키마, RLS | 백엔드 기반 완성 |
| **W2** | 2.1 | Google/Apple 인증 구현 | 로그인 가능 |
| **W3** | 2.2 | 동기화 엔진, 충돌 해결 | Trip 클라우드 저장 |
| **W4** | 2.3 | OptionCard, 추천 알고리즘 | 이동수단 비교 |
| **W5** | 2.4 | 설정 화면, 개인화 | 맞춤 추천 |
| **W6** | 2.5 | E2E 테스트, 배포 | Phase 2 완료 |

### 마일스톤

- **M1 (W2 종료)**: 인증 시스템 완성
- **M2 (W3 종료)**: 클라우드 동기화 완성
- **M3 (W5 종료)**: Transport Options 완성
- **M4 (W6 종료)**: Phase 2 릴리스

---

## 리스크 및 대응

### 기술 리스크

| 리스크 | 확률 | 영향도 | 대응 방안 |
|--------|------|--------|----------|
| Supabase RLS 설정 오류 | 중 | 상 | 충분한 테스트, Supabase 공식 가이드 참조 |
| OAuth 인증 실패 | 중 | 상 | OAuth playground에서 사전 테스트 |
| 동기화 충돌 빈번 발생 | 중 | 중 | LWW 외 CRDT 검토 |
| 네트워크 불안정 시 UX 저하 | 높음 | 중 | 로딩 상태 명확히 표시, 재시도 로직 |

### 일정 리스크

| 리스크 | 확률 | 영향도 | 대응 방안 |
|--------|------|--------|----------|
| Supabase 학습 곡선 | 중 | 중 | 1주차에 POC 진행, 조기 검증 |
| Apple Sign-In 심사 지연 | 낮음 | 중 | Google 먼저 완성, Apple은 병렬 진행 |
| 동기화 로직 복잡도 | 높음 | 상 | MVP 동기화 먼저, 점진적 개선 |

### 의존성 리스크

| 리스크 | 확률 | 영향도 | 대응 방안 |
|--------|------|--------|----------|
| Supabase 서비스 장애 | 낮음 | 상 | Local-first 아키텍처로 오프라인 동작 보장 |
| Google/Apple OAuth 변경 | 낮음 | 중 | Supabase Auth 추상화 레이어 활용 |

---

## 문서 구조

Phase 2 관련 문서는 다음과 같이 구성됩니다:

```
spec-kit/
├── phase2-overview.md              (이 문서)
├── phase2-backend-design.md        (백엔드 아키텍처)
├── phase2-api-spec.md              (API 명세)
├── phase2-database-schema.md       (DB 스키마)
├── phase2-tasks.md                 (태스크 분해)
└── phase2-implementation-plan.md   (구현 가이드)
```

### 문서 역할

1. **phase2-overview.md** (이 문서)
   - Phase 2 전체 조감도
   - 목표, 범위, 일정
   - 의사결정 기록

2. **phase2-backend-design.md**
   - Supabase 아키텍처
   - 데이터 모델
   - RLS 정책
   - 인증 플로우

3. **phase2-api-spec.md**
   - REST API 엔드포인트
   - Request/Response 스키마
   - 에러 코드

4. **phase2-database-schema.md**
   - 테이블 정의 (SQL)
   - ERD
   - 인덱스, 제약조건

5. **phase2-tasks.md**
   - TASK-031 ~ TASK-050
   - 의존성 그래프
   - 완료 기준

6. **phase2-implementation-plan.md**
   - 코드 작성 가이드
   - 테스트 전략
   - 배포 절차

---

## 승인 및 이력

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-27 | SOL + Claude | 초안 작성 |

---

**Next Steps**:
1. ✅ Phase 2 Overview 작성 완료
2. ⏭ Backend Design 문서 작성
3. ⏭ Database Schema 설계
4. ⏭ API Spec 작성
5. ⏭ Tasks 분해

---

*문서 버전: 1.0 | 작성일: 2026-03-27 | Feature: 002-tripframe-phase2*
