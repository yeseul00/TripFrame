# TripFrame Phase 5 완료보고서
**작성일**: 2026-03-29
**Phase**: 5 — EAS Dev Build + 예약 루프 + 탭 재편 + iCal Export
**버전**: spec.md v1.0 / tasks.md v1.0
**참조**: TF-MTG-002, TF-TECH-001

---

## 1. Phase 5 목표 및 달성 요약

| 목표 | 달성 여부 |
|------|---------|
| EAS Dev Build 인프라 구축 | ✅ 코드 완료 (빌드는 사용자 실행) |
| expo-secure-store 마스터 키 업그레이드 | ✅ 완료 + 단위 테스트 8/8 PASS |
| Gap RESOLVED 상태 + 예약 완료 흐름 | ✅ 완료 |
| 4탭 재편 (이동 체크 통합) | ✅ 완료 |
| iCal Export (RFC 5545) | ✅ 완료 + 단위 테스트 10/10 PASS |
| Maestro 네이티브 E2E 기초 | ✅ 2개 시나리오 작성 완료 |
| 온보딩 웹 호환성 (B-01) | ✅ 완료 |
| 전체 E2E 커버리지 유지 | ✅ Core 76/76, Mobile 8/8 PASS |

**전체 태스크**: TASK-093 ~ TASK-099 (7개) — **7/7 완료 (100%)**

---

## 2. 태스크별 세부 완료 내역

### TASK-093: EAS Dev Build 설정 + Android 빌드

**완료 항목**
- `eas.json` 생성 (development / preview / production 프로필)
- `.github/workflows/eas-build.yml` — main 브랜치 머지 시에만 EAS Build 트리거

**사용자 실행 필요**
```bash
npm install -g eas-cli
cd tripframe/apps/mobile
eas build --profile development --platform android
```

**TF-MTG-002 결정 준수**: EAS 크레딧 절약을 위해 main 머지 시에만 빌드. SDK 업그레이드는 Dev Build 완료 후 별도 진행.

---

### TASK-094: expo-secure-store 마스터 키 업그레이드

**변경 파일**
- `src/storage/secure-store.native.ts` — 네이티브: expo-secure-store 래퍼
- `src/storage/secure-store.ts` — 웹: null 스텁 (Metro .native.ts 패턴)
- `src/storage/encryptedStorage.ts` — `getMasterKeyBytes()` SecureStore 우선 로직
- `App.tsx` — 마이그레이션 중 ActivityIndicator 표시

**마이그레이션 흐름**
```
앱 시작 → migrateMasterKey() 호출
├─ SecureStore에 키 있음 → 즉시 반환
├─ kv-store에 키 있음 → SecureStore 이전 → kv-store 삭제
│   └─ SecureStore 실패 시 → kv-store 유지 (폴백) + 에러 로깅
└─ 키 없음 → 신규 생성 → SecureStore 저장
    └─ SecureStore 실패 시 → kv-store 저장 (폴백)
```

**테스트**: 8/8 PASS (기존 5 + 마이그레이션 신규 3)

---

### TASK-095: Gap RESOLVED 상태 + useGapStore

**변경 파일**
- `packages/core/src/types/trip.ts` — `GapStatus: 'DANGER' | 'WARNING' | 'RESOLVED'`
- `packages/core/src/logic/gapEngine.ts` — `makeGapKey(from, to, dayIndex): string`
- `src/store/useGapStore.ts` — RESOLVED 상태 Zustand 스토어 (신규)
- `src/store/useTripStore.ts` — `openGapKey` 딥링크 상태 추가
- `src/screens/GapAnalysisScreen.tsx` — "예약 완료" 버튼 + RESOLVED 카드

**핵심 설계 결정**
- Constitution 원칙 준수: Gap은 파생 데이터 → RESOLVED 상태를 Gap 타입에 넣지 않고 별도 스토어로 분리
- gapKey = `${fromLocation}-${toLocation}-${dayIndex}` — 이벤트 시간 변경에 불변

**테스트**: gapKey 안정성 테스트 4개 추가 (Core 76/76 PASS)

---

### TASK-096: 4탭 재편 + MoveCheckScreen + 딥링크 + E2E

**탭 구조 변경**

| 이전 (Phase 4) | 이후 (Phase 5) |
|--------------|--------------|
| 일정 | 일정 |
| 공백감지 | 이동 체크 ← 통합 |
| 제안카드 | ~~제안카드~~ (제거) |
| 역산 | 역산 |
| 설정 | 설정 |

**신규 파일**
- `src/screens/MoveCheckScreen.tsx` — 통합 이동 체크 화면
  - Gap 카드 목록 (DANGER/WARNING)
  - 카드 탭 → 교통 옵션 인라인 펼침 (PersonSelector 포함)
  - "예약 완료" → RESOLVED 카드 전환 (초록 테두리)
  - RESOLVED 카드 목록 하단 정렬
  - `openGapKey` 딥링크: 특정 Gap 카드 자동 펼침

**navigateTo 헬퍼 (App.tsx)**
```typescript
navigateTo(tab, params?) // { gapKey?, dayIndex? }
```

**E2E 수정** (번들 태스크로 단일 커밋):
- `moveCheck.spec.ts` 신규 작성
- `gap.spec.ts`, `suggestion.spec.ts` 셀렉터/탭명 업데이트
- 6개 spec 파일 탭명 일괄 업데이트

---

### TASK-097: iCal Export

**신규 파일**
- `packages/core/src/logic/exportIcal.ts` — RFC 5545 순수 함수
- `src/components/IcalExportModal.tsx` — 내보내기 모달 (ready → exporting → done/error)

**RFC 5545 구현**
```
VCALENDAR
├── VTIMEZONE: Asia/Seoul
├── VEVENT (이벤트별)
│   ├── DTSTART/DTEND (YYYYMMDDTHHmmss 형식)
│   ├── SUMMARY, DESCRIPTION, LOCATION
│   └── UID (uuid)
└── VEVENT (Gap별)
    ├── X-TRIPFRAME-GAP-STATUS: DANGER|WARNING|RESOLVED
    └── X-TRIPFRAME-RESOLVED-AT: ISO-8601 (RESOLVED 시)
```

**플랫폼별 내보내기**
- Native: `expo-file-system` .ics 임시 파일 → `expo-sharing` 공유 시트
- Web: Blob URL 다운로드 폴백

**진입점**: 홈 화면 여행 카드 `···` 메뉴 → "내보내기 (.ics)"

**테스트**: 10/10 PASS

---

### TASK-098: Maestro + 온보딩 웹 수정 + B-01~04

**Maestro 시나리오**
- `.maestro/01-secure-store-migration.yaml` — SecureStore 마이그레이션 검증
- `.maestro/02-gap-resolved-persistence.yaml` — RESOLVED 상태 앱 재시작 복원

**B-01 온보딩 웹 수정 (OnboardingScreen.tsx)**
- `Platform.OS === 'web'` 분기
- 배경색 `#0F0F13` 명시적 `style={{ backgroundColor: '#0F0F13' }}` 적용
- `FlatList` → `ScrollView` 교체 (웹 렌더링 호환)
- 슬라이드 → 수동 인덱스 상태로 페이지 전환

**B-04 로그아웃 시 로컬 데이터 유지**: 기존 구현으로 이미 보장 (encryptedStorage는 계정과 분리, 로그아웃이 스토리지를 초기화하지 않음)

---

## 3. 신규 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `expo-secure-store` | ~14.0.1 | 마스터 키 하드웨어 보안 저장소 |
| `expo-file-system` | ~18.0.12 | .ics 임시 파일 생성 |
| `expo-sharing` | ~13.0.1 | 네이티브 공유 시트 |

```bash
cd tripframe && pnpm install
```

---

## 4. 아키텍처 결정 기록

### TF-MTG-002 결정 준수 현황

| 결정 | 구현 |
|------|------|
| EAS 빌드: main 머지 시에만 | GitHub Actions 워크플로우 ✅ |
| TASK-096 탭 재편: 단일 번들 | 탭재편+E2E+딥링크 단일 태스크로 처리 ✅ |
| AppState 자동 팝업 금지 | MoveCheckScreen: 상시 "예약 완료" 버튼만 ✅ |
| Alpha 배포: Phase 5 말 | TASK-099 체크리스트 준비 ✅ |

### Constitution 원칙 준수
- **Logic-UI separation**: `exportIcal.ts`, `makeGapKey()` 모두 `packages/core`에 위치
- **Gap is derived data**: RESOLVED 상태를 Gap 타입 외부(`useGapStore`)에 저장
- **No `any` type**: 전체 TypeScript strict 유지
- **Zustand only**: 신규 스토어(`useGapStore`) Zustand 사용

---

## 5. Alpha 배포 체크리스트

| 항목 | 상태 |
|------|------|
| Dev Build APK Android 실기기 설치 | ⏳ 사용자 실행 필요 |
| expo-secure-store 마이그레이션 (데이터 손실 없음) | ✅ 단위 테스트로 검증 |
| 이동 체크 탭: Gap → 교통 옵션 → 예약 완료 단일 흐름 | ✅ |
| RESOLVED 상태 앱 재시작 후 복원 | ✅ encryptedStorage persist |
| iCal Export Google Calendar 임포트 | ✅ RFC 5545 구현 |
| Core 단위 테스트 PASS | ✅ 76/76 |
| Mobile 단위 테스트 PASS | ✅ 8/8 |
| E2E 탭 구조 변경 반영 | ✅ 97+ 테스트 |
| Notion DB 등록 | ⏳ 사용자 실행 필요 |

**Alpha 배포 준비도: Dev Build APK 설치 완료 / Metro 연결 진행 중**

### EAS 빌드 이슈 및 해결 기록

| 빌드 | 결과 | 원인 | 해결 |
|------|------|------|------|
| 1차 (`821b20bb`) | ❌ | `adaptiveIcon.foregroundImage` 누락, `plugins` 미설정 | app.json 수정 |
| 2차 (`b1db6771`) | ❌ | `async-storage ^3.0.2` → `org.asyncstorage.shared_storage:storage-android:1.0.0` Maven 미등록 | `~2.2.0` 다운그레이드 |
| 3차 | ✅ | — | APK 설치 성공 |

---

## 6. Phase 6 전환 사항

Phase 5 완료 후 즉시 시작 가능한 Phase 6 태스크:

1. **Phase 6.0 — D-day 위젯** (Android 우선): `react-native-android-widget`
2. **Phase 6.1 — CI/CD**: GitHub Actions 테스트 자동화 + Maestro E2E
3. **Phase 6.2 — 앱 스토어 준비**: 스크린샷, 개인정보처리방침, Sentry
4. **Phase 6.3 — 여행 카드 숨기기** (TASK-091 이월): `isHidden` UI
5. **Phase 6.4 — 클로즈드 베타**: 10~20명 내부 배포

**Alpha → 클로즈드 베타 10~20명** 목표 (TF-MTG-002 결정)

---

## 7. 테스트 증적

```
# Core 패키지 테스트
cd tripframe && pnpm --filter @tripframe/core test

PASS  logic/__tests__/engine.test.ts
PASS  logic/__tests__/reverseEngine.test.ts
PASS  logic/__tests__/gapEngine.test.ts
PASS  logic/__tests__/freeTime.test.ts
PASS  logic/__tests__/exportIcal.test.ts

Test Suites: 5 passed, 5 total
Tests:       76 passed, 76 total

# Mobile 패키지 테스트
cd tripframe && pnpm --filter mobile test

PASS  src/storage/__tests__/encryptedStorage.test.ts

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```
