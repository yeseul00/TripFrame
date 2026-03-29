# Implementation Plan: TripFrame Phase 5

**Feature**: `005-tripframe-phase5`
**Plan version**: 1.0
**Created**: 2026-03-29
**참조**: spec.md v1.0, TF-MTG-002, TF-TECH-001

---

## 아키텍처 결정

### AD-P5-001: EAS Dev Build 전환 순서
- **결정**: Dev Build 전환 → 안정화 → SDK 업그레이드 (동시 진행 금지)
- **근거**: TF-MTG-002 Expert 2 강력 권고. 동시 진행 시 디버깅 원인 특정 불가.
- **EAS Build 트리거**: main 머지 시에만 (PR마다 트리거 금지 — 무료 티어 30빌드/월 관리)

### AD-P5-002: gapKey 설계
- **결정**: `${fromLocation}-${toLocation}-${dayIndex}` (이벤트 시간 독립적)
- **근거**: 이벤트 시간 미세 변경 시 gapKey 변화 → RESOLVED 상태 유실 방지 (TF-MTG-002 Expert 2)
- **단위 테스트**: 이벤트 시간 변경 시 gapKey 불변 확인

### AD-P5-003: resolvedGapIds 저장 구조
- **결정**: Gap은 파생 데이터 원칙 유지. RESOLVED 상태를 별도 저장소로 외부 관리.
- **구조**: `{ [tripId]: { [gapKey]: { resolvedAt: ISO-8601, method: string } } }`
- **저장**: encryptedStorage (기존 패턴 동일)
- **Constitution 준수**: Gap 자체에 상태 필드 추가 금지

### AD-P5-004: 이동 체크 상태 통합
- **결정**: `useGapStore.ts` 신규 생성 — 기존 useTripStore의 Gap 관련 상태 + 교통 옵션 선택 상태 통합
- **GapCard 확장**: 탭 시 교통 옵션 인라인 렌더링 (SuggestionScreen 컴포넌트 재활용)
- **E2E 전략**: gap.spec + suggestion.spec → moveCheck.spec 통합 재작성 (탭 재편과 번들)

### AD-P5-005: iCal 아키텍처
- **결정**: `packages/core/logic/exportIcal.ts` 순수 함수 (Logic-UI 분리 원칙)
- **커스텀 프로퍼티**: RFC 5545 `X-` prefix 허용 범위 내
- **파일 처리**: apps/mobile에서 expo-sharing + expo-file-system (Core 패키지 비포함)

---

## 구현 순서 (의존성 그래프)

```
Phase 5.0 인프라 (병렬 불가, 순차)
  └─ TASK-093: EAS Dev Build 설정 + Android 빌드
  └─ TASK-094: expo-secure-store 마스터 키 업그레이드 (093 완료 후)

Phase 5.1 예약 루프 (독립, 093 완료 후 병렬 가능)
  └─ TASK-095: Gap RESOLVED 상태 + useGapStore + gapKey 설계

Phase 5.2 탭 재편 (095 완료 후)
  └─ TASK-096: 4탭 구조 재편 + 이동 체크 통합 + 딥링크 + E2E 수정

Phase 5.3 내보내기 (독립, 093 완료 후 병렬 가능)
  └─ TASK-097: iCal Export (generateIcal + 공유 시트 + 안내 화면)

Phase 5.4 테스트 + 배포 준비 (모두 완료 후)
  └─ TASK-098: Maestro E2E 기초 + 온보딩 웹 수정 + B-01~05 번들
  └─ TASK-099: Phase 5 완료보고서 + Alpha 배포 체크리스트
```

---

## 태스크별 기술 계획

### TASK-093: EAS Dev Build 설정 · 4h [P0]

**목표**: Expo Go → EAS Development Build 전환. Android 실기기 정상 설치.

**구현 단계**:
1. `eas.json` 생성 — development / preview / production 프로필
2. `app.json` → `app.config.ts` 전환 검토 (동적 설정 필요 시)
3. `eas build --profile development --platform android` 첫 빌드
4. GitHub Actions 워크플로우: main 머지 시에만 `eas build` 트리거
5. Android 실기기 APK 설치 + 기존 기능 동작 확인
6. EAS Build 로그에서 CocoaPods/Gradle 오류 체크 (반나절 버퍼 확보)

**리스크 대응**:
- Gradle 의존성 충돌 → `npx expo prebuild` 후 android/ 폴더 수동 점검
- iOS 빌드 → EAS Cloud 의존, 로컬 건드리지 않음
- SDK 업그레이드 요청 발생 시 → 무시하고 현재 SDK 유지

**완료 기준**: Android Dev Build APK 설치 성공 + `pnpm --filter mobile web` + Playwright 97/97 PASS

---

### TASK-094: expo-secure-store 마스터 키 업그레이드 · 3h [P0] · (093)

**목표**: getMasterKey() 저장소를 kv-store → SecureStore로 교체. 데이터 손실 없는 마이그레이션.

**구현 단계**:
1. `expo-secure-store` 패키지 설치
2. `encryptedStorage.ts` getMasterKey() 수정:
   - SecureStore.getItemAsync → 키 존재 시 반환
   - 없으면 SecureStore.setItemAsync → 성공 시 kv-store 구 키 삭제
   - SecureStore 저장 실패 → kv-store 키 유지 (폴백)
3. 마이그레이션 흐름: kv-store 키 존재 → SecureStore 이전 성공 확인 → kv-store 삭제
4. 마이그레이션 중 App.tsx 로딩 인디케이터 표시
5. 단위 테스트: 기존 5개 그대로 통과 확인 + 마이그레이션 3개 추가 (성공/실패폴백/중단 재시도)

**핵심 제약**: 암호화/복호화 로직 절대 변경 금지. getMasterKey() 저장소 1곳만 교체.

**완료 기준**: 기존 암호화 단위 테스트 5개 + 마이그레이션 테스트 3개 PASS. Android 실기기에서 데이터 복원 확인.

---

### TASK-095: Gap RESOLVED 상태 + useGapStore · 4h [P1] · (093)

**목표**: 예약 완료 루프 완성. Gap 카드에 "예약 완료" 버튼 상시 노출.

**구현 단계**:
1. `packages/core/types/trip.ts` — `GapStatus: 'DANGER' | 'WARNING' | 'RESOLVED'` 타입 추가
2. `packages/core/logic/gapEngine.ts` — gapKey 생성 함수 `makeGapKey(fromLocation, toLocation, dayIndex): string`
3. `apps/mobile/src/store/useGapStore.ts` 생성:
   - `resolvedGaps: Record<tripId, Record<gapKey, {resolvedAt, method}>>` 상태
   - `resolveGap(tripId, gapKey, method)` / `unresolveGap()` 액션
   - encryptedStorage persist
4. `GapCard` 컴포넌트 — "예약 완료" 버튼 추가 (AppState 자동 팝업 금지)
5. RESOLVED 카드: 초록 테두리 + ✓ 아이콘, 목록 하단 정렬
6. 단위 테스트: gapKey 안정성 (이벤트 시간 변경 시 불변 확인)

**완료 기준**: RESOLVED 상태 저장/복원 + 카드 UI 변경 + gapKey 단위 테스트 PASS

---

### TASK-096: 4탭 구조 재편 + 이동 체크 + 딥링크 + E2E · 5h [P1] · (095)

**목표**: 5탭 → 4탭. 공백감지+제안카드 → 이동 체크 통합. 탭 간 딥링크. E2E 전면 수정.

**구현 단계**:
1. `App.tsx` 탭바: 공백감지/제안카드 제거 → "이동 체크" 단일 탭 추가
2. `MoveCheckScreen.tsx` 신규 생성:
   - Gap 카드 목록 (useGapStore + useTripStore 구독)
   - Gap 카드 탭 → 교통 옵션 인라인 펼침 (SuggestionScreen 컴포넌트 분리 재활용)
   - "예약 완료" 버튼 인라인 (TASK-095 통합)
3. `navigateTo(tab, params)` 헬퍼 — App.tsx 또는 별도 navigation 파일
4. 딥링크: 역산 탭 → 일정 탭 Day 스크롤, 이동 체크 → 특정 Gap 펼침
5. E2E 수정 (번들 필수):
   - `gap.spec.ts` + `suggestion.spec.ts` → `moveCheck.spec.ts` 통합
   - 탭 이름 변경 반영 (모든 spec 파일)
   - TASK-082에서 검증한 설정 복원 E2E (B-03) 포함 재검증
6. 전체 E2E PASS 확인

**완료 기준**: 4탭 동작 + 이동 체크 통합 UX + 딥링크 + 전체 E2E PASS (기존 97개 재편 후 동등 커버리지)

---

### TASK-097: iCal Export · 3h [P2] · (093)

**목표**: RFC 5545 표준 .ics 내보내기 + TripFrame 커스텀 프로퍼티 + 사용자 안내 화면.

**구현 단계**:
1. `packages/core/logic/exportIcal.ts`:
   - `generateIcal(trip: Trip): string` 순수 함수
   - VCALENDAR + VTIMEZONE(Asia/Seoul) + VEVENT 블록
   - VEVENT: DTSTART, DTEND, SUMMARY, DESCRIPTION, LOCATION
   - X-TRIPFRAME-GAP-STATUS, X-TRIPFRAME-RESOLVED-AT 커스텀 프로퍼티
2. `apps/mobile`에서 expo-sharing + expo-file-system:
   - .ics 파일 임시 저장 → 공유 시트 열기
3. "내보내기 완료" 안내 화면:
   - "파일이 생성되었습니다. Google Calendar → 가져오기에서 추가하세요."
   - Google Calendar 설명 링크(선택)
4. 여행 상세 화면(일정 탭 헤더) 또는 홈 여행 카드 더보기(···) 메뉴에 "내보내기" 옵션
5. 단위 테스트: generateIcal 출력 포맷 검증 (VCALENDAR 시작/종료, VEVENT 필드, X-TRIPFRAME 포함)

**완료 기준**: .ics 파일 생성 + 공유 시트 열림 + generateIcal 단위 테스트 PASS

---

### TASK-098: Maestro 기초 + 온보딩 수정 + B-01~05 번들 · 3h [P1] · (094, 096)

**목표**: 네이티브 전용 Maestro 시나리오 2~3개 + Phase 4 잔여 이슈 일괄 처리.

**구현 단계**:
1. Maestro 설치 + `.maestro/` 디렉터리 설정
2. 시나리오 1: SecureStore 마이그레이션 (kv-store 키 존재 → 이전 → 삭제)
3. 시나리오 2: "예약 완료" 버튼 탭 → RESOLVED 저장 → 앱 재시작 → 상태 복원
4. B-01 온보딩 웹 수정: `Platform.OS === 'web'` 분기 최소 적용 (Playwright 통과 수준)
5. B-04 로그아웃 로컬 데이터 유지 → Maestro 시나리오 추가 또는 Playwright 검증
6. B-05 마이그레이션 데이터 손실 없음 → TASK-094에 이미 포함됨 확인

**완료 기준**: Maestro 2개 시나리오 PASS + 온보딩 Playwright 시각 검증 개선

---

### TASK-099: Phase 5 완료보고서 + Alpha 배포 체크리스트 · 1h · (모든 태스크)

**목표**: 문서화 완료 + Alpha 내부 배포 준비 상태 확인.

**구현 단계**:
1. `report/260329/phase5/PHASE5_완료보고서.md` 작성
2. `report/260329/phase5/E2E_TEST_REPORT.md` 작성 (Playwright MCP 화면 검증 포함)
3. Alpha 배포 체크리스트:
   - [ ] Dev Build APK 생성 성공
   - [ ] expo-secure-store 마이그레이션 완료
   - [ ] 이동 체크 탭 동작 확인
   - [ ] RESOLVED 상태 저장/복원 확인
   - [ ] iCal Export Google Calendar 임포트 확인
   - [ ] 전체 E2E PASS
4. Notion DB 등록

---

## 진행 현황 표 (초기값)

| Phase | 태스크 | 완료 | 진행률 |
|-------|--------|------|--------|
| 5.0 인프라 | 093~094 | 0/2 | 0% |
| 5.1 예약 루프 | 095 | 0/1 | 0% |
| 5.2 탭 재편 | 096 | 0/1 | 0% |
| 5.3 내보내기 | 097 | 0/1 | 0% |
| 5.4 테스트 + 문서 | 098~099 | 0/2 | 0% |
| **합계** | **7** | **0** | **0%** |

---

## 리스크 레지스터

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| Gradle 의존성 충돌 | 1~2일 블로킹 | 높음 | `npx expo prebuild` 후 수동 점검. 반나절 버퍼 확보 |
| SecureStore 저장 실패 | 데이터 접근 불가 | 낮음 | kv-store 폴백 + 재시도 로직 |
| E2E 대량 깨짐 (탭 재편) | 2~3시간 추가 | 확정 | TASK-096에 번들. 분리 금지 |
| EAS 크레딧 소진 | 빌드 불가 | 중간 | main 머지 시에만 트리거 |

---

*plan version 1.0 | 2026-03-29*
