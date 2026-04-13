# TripFrame 시스템 설계서

**System Architecture Document**
문서 ID: TF-SAD-001 | 버전: 1.1 | 2026-04-13 | 상태: Approved

---

## 개정 이력

* **v1.0 (2026-03-26):** 최초 설계 (Supabase DB 스키마, 역산 계산 엔진 로직 정의 등)
* **v1.1 (2026-04-13):**
  * Map + Bottom Sheet UI 패턴을 위한 뷰 레이어 상태 관리 구조 업데이트
  * Dark/Light 테마 상태 전역 관리 추가
  * Gap Data Model의 Severity 속성 값 변경 (danger ➔ warning)

---

## 1. 시스템 아키텍처 및 백엔드 (Backend & DB) - *[v1.0 베이스]*

### 1.1 BaaS 도입 (Supabase)
TripFrame은 초기 개발 속도와 실시간 동기화를 위해 **Supabase**를 메인 데이터베이스 및 Auth 솔루션으로 채택한다.
* **Authentication:** 이메일 로그인 및 소셜 로그인(Google, Kakao)
* **Database:** PostgreSQL 기반. RLS(Row Level Security)를 통한 유저별 여행 데이터 격리.
* **Storage:** e-티켓 이미지 업로드 및 OCR 분석용 원본 이미지 저장소.

### 1.2 핵심 데이터베이스 스키마 (Core Schema)
* `users`: 유저 식별 정보
* `trips`: 여행 메타데이터 (목적지, 날짜, 동행자 수)
* `events`: 단위 일정 (시간, 좌표, 유형, 역산 Anchor 여부)
* `gaps`: 시스템이 백그라운드 워커를 통해 탐지한 공백/미예약 구간 정보 캐싱

---

## 2. 프론트엔드 상태 관리 설계 (View Layer) - *[v1.1 업데이트]*

v1.1의 고도화된 UI/UX 처리를 위해 아래와 같은 로컬 상태(Local State) 관리가 필요하다.

### 2.1 화면 및 네비게이션 상태
* `screen` (number): 하단 탭 네비게이션 맵핑 값.
  * `0`: 홈
  * `1`: 일정 (Timeline + Map)
  * `2`: 스마트 체크 (Gaps)
  * `3`: 마이/설정
* `isAddModalOpen` (boolean): '+' 일정 추가 플로팅 버튼 클릭 시 제어.
* `isCalcModalOpen` (boolean): 스마트 타임라인(역산) 모달 뷰 제어.

### 2.2 바텀 시트 (Bottom Sheet) 상태
* `listRef` (RefObject): 일정 리스트 div의 스크롤 위치를 추적.
* `isListExpanded` (boolean): `true`일 경우 리스트가 화면 전체(Safe Area 제외)를 차지하고, 지도를 가림.
  * **트리거 로직:** `listRef.scrollTop > 20` 조건 달성 시 `true`로 전환. 투명 핸들 클릭 시 toggle.

### 2.3 테마 상태
* `isDarkMode` (boolean): 최상위 `div`에 `.dark` 클래스를 주입하여 Tailwind CSS의 `dark:` 변환 활성화.

---

## 3. 핵심 알고리즘: 역산 엔진 (Reverse Calc Engine) - *[v1.0 유지]*

프론트엔드 내 유틸리티 함수 `calculateSmartTimeline()` 을 통해 동작.

1. **Anchor 식별:** 사용자가 입력한 이벤트 중 `type === 'flight' || type === 'train'` 등 기준 시간이 되는 이벤트를 찾음.
2. **Rule 적용:** 해당 운송수단의 수속 마감 시간(예: 국제선 출발 50분 전) 및 권장 도착 여유 시간(+40분)을 뺌.
3. **Calc 연산:** 직전 장소(예: 숙소)에서 Anchor 장소(예: 공항)까지의 이동 시간(대중교통/택시 API 연동값)을 뺌.
4. **Result 도출:** 1~3의 과정을 거쳐 '최종 출발 권장 시간'을 반환하고 데이터 모델의 `derived` 속성을 true로 마킹.

---

## 4. 데이터 모델 변경점 (Data Model) - *[v1.1 변경]*

### 4.1 Gap (공백) 모델 업데이트
UX 정책 변경에 따라 에러의 치명도를 낮춤.

```typescript
interface Gap {
  id: string;
  severity: "warning" | "auto" | "info"; // v1.1 변경 (danger ➔ warning)
  from: string;
  to: string;
  day: string;
  msg: string;
  detail: string;
  options: TransportOption[]; // 추천 교통편 배열 포함
  openDate: string | null;
}


4.2 Event (일정) 모델 업데이트

Triple 스타일 UI 구현을 위해 이동 수단(transport)과 장소(hotel, flight, home 등)를 렌더링 시 시각적으로 분리 처리.

interface EventItem {
  id: string;
  time: string;
  type: "flight" | "hotel" | "transport" | "home" | "free" | "prep" | "warning";
  icon: string;
  title: string;
  sub?: string;
  status: "ok" | "todo" | "warn" | "missing" | "auto" | "free";
  derived?: boolean; // true 시 "💡 스마트 타임라인" 뱃지 노출 및 역산 모달 연결
  alert?: string;
}
```

---

## 3. UI 컴포넌트 아키텍처 (v1.1 기준)

단일 App.jsx에서 향후 컴포넌트 분리 시 권장되는 폴더 구조.

* `components/layout/`
  * `BottomTabBar.tsx` : 전역 하단 4-Tab 네비게이션
  * `DynamicHeader.tsx` : 스크롤 및 테마 상태에 반응하는 상단 헤더
* `components/timeline/`
  * `MapBackground.tsx` : 40% 영역, 패럴랙스 애니메이션 및 마커 렌더링
  * `BottomSheetList.tsx` : 일자 선택 칩 + 일별 이벤트 리스트
  * `TransportChip.tsx` : 이동 수단 연결선 뷰
  * `PlaceNode.tsx` : 장소 원형 아이콘 뷰
* `components/smart/`
  * `SmartCheckAccordion.tsx` : 공백 감지 및 인라인 추천 예매 카드
  * `ReverseCalcModal.tsx` : 하단 슬라이드 업 모달 형태의 역산 도출 뷰

---

## 4. 스타일링 및 렌더링 최적화

* **무베젤(Bezel-less) 뷰포트:** 글로벌 CSS에 `scrollbar-hide` 클래스용 `display: none;` 및 `-ms-overflow-style: none;` 속성 강제 주입하여 모든 네이티브 스크롤바 제거.
* **DOM 최적화:** 지도 영역(`MapBackground`)은 `isListExpanded`가 true일 때도 언마운트하지 않고 DOM에 유지하되, `opacity`와 `transform`, `pointer-events: none`만 조작하여 렌더링 부하를 최소화함.
