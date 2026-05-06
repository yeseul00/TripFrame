# TripFrame Safe Area 레이아웃 수정 작업계획서

**작성일**: 2026-04-26
**작업 유형**: UI 레이아웃 버그 수정
**관련 Phase**: Phase 6 → Phase 7 이행 직전 UI 정비
**목표**: 모든 화면에서 상단 상태바(시계·배터리)와 하단 시스템 바(제스처 네비게이션·홈 버튼)에 앱 콘텐츠가 가려지지 않도록 Safe Area 일관 적용

---

## 1. 현상

| 위치 | 증상 |
|------|------|
| 상단 | 홈 화면 타이틀('내 여행'), 온보딩 텍스트, 설정 화면 상단 콘텐츠가 상태바(시계·배터리) 영역에 침범 |
| 하단 | 4-Tab 네비게이션 바가 기기의 하단 시스템 제스처 영역에 너무 붙어 탭 아이콘이 잘림 |

---

## 2. 근본 원인 분석

### 원인 A — `react-native`의 `SafeAreaView`는 Android 미지원 [심각도: 높음]

`HomeScreen.tsx`, `OnboardingScreen.tsx`에서 `SafeAreaView`를 `react-native`에서 import하고 있음.  
`react-native`의 `SafeAreaView`는 **iOS 전용**으로, Android에서는 inset을 전혀 적용하지 않음.

```tsx
// ❌ 문제 — react-native의 SafeAreaView는 Android에서 아무 패딩도 없음
import { SafeAreaView } from 'react-native';
```

### 원인 B — 상단·하단 패딩 하드코딩 [심각도: 높음]

공유 헤더(`App.tsx`)와 모달 헤더에 고정 픽셀값이 사용됨. 기기별 상태바 높이가 다름에도 일괄 적용.

| 위치 | 기존 값 | 실제 Android 상태바 범위 |
|------|--------|----------------------|
| 공유 헤더 (`App.tsx` showHeader) | `pt-12` (48px) | 24–32px (기기마다 상이) |
| 역산 모달 헤더 (`App.tsx` Modal) | `pt-14` (56px) | 동일 |
| 하단 탭바 (`App.tsx`) | `pb-8` (32px) | 제스처 모드 16–28px / 버튼 모드 0px |

### 원인 C — `SettingsScreen` Safe Area 미적용 [심각도: 중간]

`showHeader` 조건 = `currentTab !== '홈' && currentTripId`.  
→ '마이' 탭에서 **여행이 선택되지 않은 경우** 공유 헤더가 렌더링되지 않아 `SettingsScreen` 상단 콘텐츠가 상태바에 가려짐.  
`SettingsScreen.tsx`에는 `SafeAreaView` 또는 `useSafeAreaInsets()` 미사용.

### 원인 D — 새 APK 미빌드 [심각도: 높음]

`react-native-safe-area-context`는 네이티브 모듈을 포함한 패키지.  
기존 EAS 빌드 APK에는 해당 모듈이 컴파일되어 있지 않아 JS 코드 변경만으로는 실기기에서 효과 없음.  
→ **코드 수정 후 반드시 `eas build` 또는 `npx expo run:android` 재실행 필요.**

---

## 3. 1차 수정 완료 내역 (2026-04-26)

| 파일 | 수정 내용 |
|------|---------|
| `apps/mobile/package.json` | `react-native-safe-area-context ~5.6.2` 설치 (Expo SDK 54 호환) |
| `App.tsx` | `SafeAreaProvider` 래퍼 추가, `useSafeAreaInsets()` 적용 |
| `App.tsx` 공유 헤더 | `pt-12` → `style={{ paddingTop: insets.top + 8 }}` |
| `App.tsx` 하단 탭바 | `pb-8` → `style={{ paddingBottom: insets.bottom + 8 }}` |
| `HomeScreen.tsx` | `react-native` → `react-native-safe-area-context`의 `SafeAreaView`로 교체, `edges={['top']}` 적용 |

---

## 4. 잔여 수정 항목

### 4-1. `OnboardingScreen.tsx` — SafeAreaView 교체

```tsx
// ❌ 현재 (2곳)
import { SafeAreaView } from 'react-native';
<SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F13' }}>
<SafeAreaView className="flex-1 bg-background">

// ✅ 수정
import { SafeAreaView } from 'react-native-safe-area-context';
<SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#0F0F13' }}>
<SafeAreaView edges={['top']} className="flex-1 bg-background">
```

### 4-2. `SettingsScreen.tsx` — 상단 Safe Area 추가

```tsx
// ✅ useSafeAreaInsets() 추가
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function SettingsScreen(...) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView ...>
```

> **적용 조건**: '마이' 탭에서 여행 미선택 시에도 상태바와 콘텐츠가 겹치지 않아야 함.  
> 공유 헤더가 표시되는 경우(여행 선택 시)에는 헤더가 insets.top을 이미 처리하므로 이중 패딩이 우려될 수 있으나, SettingsScreen이 항상 공유 헤더 아래에 렌더링되므로 실제로는 이중 적용 없음.

### 4-3. `App.tsx` 역산 모달 헤더 — `pt-14` 교체

`insets`가 `AppContent` 스코프에 이미 존재하므로 그대로 사용.

```tsx
// ❌ 현재
<View className="flex-row items-center justify-between px-5 pt-14 pb-3 border-b border-gray-800">

// ✅ 수정
<View className="flex-row items-center justify-between px-5 pb-3 border-b border-gray-800"
  style={{ paddingTop: insets.top + 8 }}>
```

---

## 5. 작업 순서

```
1. OnboardingScreen.tsx — SafeAreaView 2곳 교체
2. SettingsScreen.tsx   — useSafeAreaInsets() + paddingTop 추가
3. App.tsx              — 역산 모달 pt-14 → insets.top + 8
4. npx expo run:android (로컬 실기기 확인)
   또는
   eas build --profile preview --platform android (EAS 재빌드)
5. 실기기에서 각 탭 순서대로 검증
```

---

## 6. 검증 기준

| 탭 / 화면 | 검증 항목 |
|-----------|---------|
| 홈 탭 | '내 여행' 타이틀이 상태바 아래에 표시 |
| 일정·스마트체크 탭 (여행 선택 시) | 공유 헤더 상단이 상태바에 맞닿지 않음 |
| 마이 탭 (여행 미선택) | 설정 화면 상단 콘텐츠가 상태바에 가려지지 않음 |
| 하단 탭바 전 탭 | 아이콘/라벨이 홈 인디케이터·시스템 버튼에 잘리지 않음 |
| 온보딩 화면 | 상단 스킵 버튼이 상태바 아래에 표시 |
| 역산 모달 | 모달 헤더가 상태바에 침범하지 않음 |
| 제스처 네비게이션 기기 | 하단 inset 정상 반영 확인 |
| 버튼 네비게이션 기기 | 탭바 아이콘 과도한 패딩 없이 정상 표시 |

---

## 7. 미결 사항

- `MainTimelineScreen`, `MoveCheckScreen`, `GapAnalysisScreen`, `SuggestionScreen`은 항상 공유 헤더(insets 처리 완료) 아래에 렌더링되므로 추가 수정 불필요 — 단, 직접 진입 경로 추가 시 재검토 필요
- `LoginScreen.tsx` safe area 처리 여부 미확인 → 로그인 화면 진입 시 시각 확인 필요
- EAS 빌드 후 `expo-dev-client` APK 교체 전까지 실기기에서 변경사항 미반영

---

*작업계획서 v1.0 | 2026-04-26 | Safe Area 레이아웃 수정*
