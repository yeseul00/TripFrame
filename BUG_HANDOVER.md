# 버그 수정 작업 인계서

> **작성일**: 2026-04-28
> **최종 갱신**: 2026-04-28 (사용자 검증 결과 반영 + BUG-08/09 신규 + BUG-04 EventFormModal 보완)
> **작성자**: Claude (Cowork) → 다음 작업자: Claude Code (VSCode/CLI)
> **노션 부모 페이지**: [버그 목록](https://www.notion.so/350a4f2b946d800d977ee53bc7b788d8)
> **DB**: `Sprout_TripFrame > Tripframe_project > Tripframe_project DB`

---

## 1. 진행 현황 한눈에

| # | 제목 | 우선순위 | 상태 | 노션 |
| --- | --- | --- | --- | --- |
| BUG-01 | 역산/공백 감지 안 됨 (gapEngine 폴백 미적용) | 🔴 긴급 | 🟡 진행 중 (Claude Code 추가 작업) | [열기](https://www.notion.so/350a4f2b946d8111a6d6efbd4c70eb42) |
| BUG-02 | Google OAuth client_id | 🔴 긴급 | ✅ 완료 | [열기](https://www.notion.so/350a4f2b946d8192bbfafa0c1e7e9375) |
| BUG-03 | 낮/밤 모드 없음 | 🟡 보통 | ⏸ 보류 (별도 세션) | [열기](https://www.notion.so/350a4f2b946d81cb8cf4ecb20d020ae5) |
| BUG-04 | SafeArea 침범 (EventFormModal 보완) | 🟡 보통 | 🔵 검증 중 | [열기](https://www.notion.so/350a4f2b946d81e88635f93db79a31f5) |
| BUG-05 | 홈 카드 onPress | 🟢 낮음 | ✅ 완료 | [열기](https://www.notion.so/350a4f2b946d813a8406fda557430c87) |
| BUG-06 | 아이콘 매핑 통일 | 🟢 낮음 | ✅ 완료 | [열기](https://www.notion.so/350a4f2b946d81bb81b9c2153cbbb235) |
| BUG-07 | 자정 넘는 이동 + D+NaN 사이드이펙트 | 🟡 보통 | 🔴 진행 중 (Claude Code 디버깅) | [열기](https://www.notion.so/350a4f2b946d811295e3c2712f710957) |
| **BUG-08** | 마이 탭 Google 로그인 silent failure | 🔴 긴급 | 🔵 검증 중 | [열기](https://www.notion.so/354a4f2b946d812ca39ef5c70a2529a5) |
| **BUG-09** | 피드백 제출 disabled UX | 🟡 보통 | 🔵 검증 중 | [열기](https://www.notion.so/354a4f2b946d815fbd26e8de1727a00c) |

---

## 2. ✅ 완료된 작업

- **BUG-02**: Supabase Dashboard + Google Cloud Console 설정 → 웹 검증 완료
- **BUG-05**: 홈 카드(📧/📸) onPress Alert → 사용자 검증 완료
- **BUG-06**: 모든 화면이 `EVENT_ICON_MAP` / `EVENT_LABEL_MAP` / `REVERSE_STEP_ICON_MAP` 사용 → 사용자 검증 완료

## 3. 🔵 검증 중 (코드 변경 완료, 다음 빌드에서 확인)

### BUG-04 — EventFormModal SafeArea 보완

**변경 파일**: `tripframe/apps/mobile/src/screens/EventFormModal.tsx`
- `useSafeAreaInsets` import 추가
- 모달 루트 `<View>`에 `paddingBottom: insets.bottom` 적용
- 헤더 `<View>`에 `paddingTop: insets.top + 12` 적용 (기존 `pt-6` 대체)

**검증**: 이벤트 추가/수정 화면에서 시계/노치 영역 침범 없음 + 하단 홈 버튼 영역 침범 없음

### BUG-08 — Google 로그인 silent failure 노출

**변경 파일**: `tripframe/apps/mobile/src/hooks/useGoogleAuth.native.ts`
- 전체 `try/catch` + 5개 silent return 지점 모두 `Alert.alert(...)`로 교체
- `cancel` / `dismiss`는 의도된 종료라 조용히 처리
- 각 메시지에 원인 진단 힌트 포함 (env 누락, Redirect URL 미등록 등)

**검증**: 빌드 후 마이 탭 → Google 로그인 클릭 → 어떤 Alert이 뜨는지 확인 → 메시지에 따라 원인 해결

### BUG-09 — 피드백 제출 UX 개선

**변경 파일**: `tripframe/apps/mobile/src/screens/SettingsScreen.tsx`
- 제출 버튼의 `disabled={rating === 0}` 제거 → 항상 활성화
- 클릭 시 `rating === 0`이면 `Alert.alert('별점 선택 필요', ...)` 표시
- `handleSubmit`에 `try/catch` + supabase insert 결과의 `error` 처리 + 예외 Alert
- `Alert` import 추가

**검증**:
- 별점 0인 상태에서 "제출" 클릭 → "별점 선택 필요" Alert
- 별점 선택 후 제출 → "감사합니다!" 화면 또는 supabase 에러 메시지

---

## 4. 🔴 잔여 작업 — Claude Code 인계 대상

### BUG-01 (우선) — gapEngine 폴백 로직 미적용

**현재 상태**: EventFormModal에 "장소를 입력해주세요. 공백 감지에 사용됩니다" Alert(저장 제지)는 적용됨. 그러나 **gapEngine.ts의 폴백 로직은 미적용**이라 기존 데이터(location 비어있는 home/hotel)에서는 여전히 Gap 감지 안 됨.

**필요한 수정**: `tripframe/packages/core/src/logic/gapEngine.ts:53` 조건문을 폴백 로직으로 변경:

```ts
function resolveLocation(ev: TripEvent, trip?: Trip): string {
  if (ev.location) return ev.location;
  if (ev.type === 'home') return '집';
  if (ev.type === 'hotel') return trip?.destination ?? ev.title;
  if (ev.type === 'transport') return ev.sub ?? ev.title;
  return ev.title; // 마지막 fallback
}

// detectGaps 안:
const fromLoc = resolveLocation(current);
const toLoc = resolveLocation(next);
if (fromLoc === toLoc) continue;
```

**테스트 추가**: `gapEngine.test.ts`에 `location undefined` 시나리오 (사용자가 보고한 칭다오 trip: home → hotel without transport → DANGER 1건).

### BUG-07 — D+NaN 사이드이펙트 디버깅

**현재 상태**: 자정 넘는 이동 Gap 감지 시도 중 홈 화면에 `D+NaN` 표시됨.

**의심 구간**:
1. `tripframe/apps/mobile/src/screens/HomeScreen.tsx:21-30` — `getDDay(startDate)` 함수
   ```ts
   const start = new Date(startDate);
   if (isNaN(start.getTime())) return 'D-?';   // ← 가드 추가 필요
   ```
2. `gapEngine.ts` cross-day 처리 중 `Trip` 객체의 `startDate`/`endDate`를 잘못 변경했을 가능성
3. `useTripStore.allGaps()` 통합 로직에서 trip 객체 mutation

**디버깅 가이드**:
- HomeScreen `getDDay`에 `console.log('startDate:', startDate, 'parsed:', start)` 추가
- gapEngine cross-day 함수가 `Trip` 객체를 mutate 하지 않고 새 객체 반환하는지 확인 (constitution: "Immutable data" 원칙)
- `gapEngine.test.ts`에 cross-day 시나리오에서 `trip.startDate`가 변경되지 않는지 assert

### BUG-03 (보류) — 낮/밤 모드

별도 세션 권장. 이번 인계서 범위 밖.

---

## 5. 노션 DB 스키마 변경 (이전 세션 누적)

`Tripframe_project` DB의 `상태` select:

- 기존: `시작 전 / 진행 중 / 완료 / 보류`
- 추가: **`검증 중(purple)`** — 코드 변경 완료 + 사용자 검증 대기

---

## 6. Claude Code 시작 시 추천 프롬프트

```
@BUG_HANDOVER.md 를 먼저 읽어. 사용자 검증 결과 반영본:

✅ 완료: BUG-02 / BUG-05 / BUG-06
🔵 검증 중 (이번 빌드에서 확인): BUG-04 / BUG-08 / BUG-09
🔴 추가 작업 필요 (네 작업): BUG-01 (gapEngine 폴백), BUG-07 (D+NaN 디버그)
⏸ 보류: BUG-03

BUG-01부터 진행해. 인계서 §4에 권장 수정안 정리됨.

작업 후 노션 페이지(상위 항목="버그 목록") 상태 갱신:
- 코드 변경 완료 + 검증 대기 → "검증 중"
- 사용자 검증 완료 → "완료"

constitution(`tripframe/spec-kit/constitution.md`) 10대 원칙 준수
— 특히 "Logic-UI separation", "Test coverage ≥80%", "Immutable data".
```

---

## 7. 핵심 참조 파일

- `tripframe/packages/core/src/logic/gapEngine.ts` — Gap 감지 (BUG-01 폴백, BUG-07 cross-day)
- `tripframe/packages/core/src/logic/__tests__/gapEngine.test.ts` — 단위 테스트
- `tripframe/apps/mobile/src/screens/HomeScreen.tsx` — `getDDay()` (BUG-07 D+NaN)
- `tripframe/apps/mobile/src/screens/EventFormModal.tsx` — 이벤트 폼 (BUG-01 UI 강제 + BUG-04 SafeArea 적용됨)
- `tripframe/apps/mobile/src/screens/SettingsScreen.tsx` — 마이 탭 (BUG-09 적용됨)
- `tripframe/apps/mobile/src/hooks/useGoogleAuth.native.ts` — 네이티브 OAuth (BUG-08 적용됨)
- `tripframe/apps/mobile/App.tsx` — 루트 + StatusBar (BUG-04 일부 적용)
- `tripframe/packages/core/src/data/eventIcons.ts` — 아이콘 단일 진실 원천 (BUG-06)
- `TripFrame_mockup.jsx` — 디자인 원본 (BUG-03 light/dark 참조)
- `tripframe/CLAUDE.md` — 프로젝트 규약 + spec-kit 워크플로우
