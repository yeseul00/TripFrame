# TripFrame POC 앱 빌드 가이드

**대상**: 신규 팀원  
**목적**: EAS 클라우드 빌드 → Expo Dev Client 설치 → Metro 터널 연결 → 앱 기동  
**환경**: Windows 11, Android 기기 (실기기 또는 에뮬레이터)

---

## 개요

TripFrame POC는 **EAS 클라우드 빌드 + Metro 터널** 방식으로 개발합니다.

```
[코드 수정] → [EAS 클라우드 빌드] → [APK 설치] → [Metro 터널 시작] → [Expo Client 접속]
                 (네이티브 변경 시)                   (JS 변경 시마다)
```

- **EAS 빌드**: 네이티브 코드(`android/`) 변경 시 필요. 클라우드에서 APK 생성.
- **Metro 터널**: JS/TSX 코드 변경 시 핫리로드. 기기에서 터널 URL로 접속.
- Android Studio 또는 로컬 Android SDK **불필요**.

---

## 1. 사전 준비

### 1-1. 패키지 설치

```bash
cd tripframe
pnpm install
```

### 1-2. EAS CLI 확인

```bash
cd tripframe/apps/mobile
npx eas-cli --version
# eas-cli/18.x.x 출력되면 OK
```

### 1-3. EAS 로그인

```bash
npx eas-cli login
# Expo 계정(seuldoo) 으로 로그인
```

로그인 상태 확인:
```bash
npx eas-cli whoami
# seuldoo 출력되면 OK
```

### 1-4. `.env` 파일 확인

```bash
ls tripframe/apps/mobile/.env
```

없으면 팀 리드에게 `.env` 파일 요청. (Supabase URL/Key 포함)

---

## 2. EAS 클라우드 빌드 (APK 생성)

> 네이티브 파일(`android/`, `app.json`, `package.json`) 변경 시에만 필요.  
> JS/TSX만 수정했다면 이 단계 건너뛰고 **3번 Metro**로 이동.

### 2-1. Gradle 데몬 종료 (Windows EBUSY 방지)

```bash
cd tripframe/apps/mobile/android
./gradlew --stop
```

### 2-2. EAS 빌드 실행

```bash
cd tripframe/apps/mobile
npx eas-cli build --platform android --profile development
```

- 클라우드에서 빌드 진행 (약 10~15분)
- 완료 시 터미널에 **QR코드 + APK 다운로드 URL** 출력

```
🤖 Open this link on your Android devices to install the app:
https://expo.dev/accounts/seuldoo/projects/tripframe/builds/xxxxx
```

### 2-3. APK 설치

Android 기기에서 위 링크를 브라우저로 열어 APK 다운로드 후 설치.

- 기존 앱이 설치된 경우: 덮어쓰기 설치 (삭제 불필요)
- "알 수 없는 앱 설치 허용" 팝업 → **허용**

---

## 3. Metro 터널 시작 (JS 번들러)

> APK 설치 후, 또는 JS 코드 수정 시마다 이 서버가 실행 중이어야 합니다.

### 3-1. 포트 충돌 확인 및 해제

포트 8081이 이미 사용 중인 경우:

```bash
# Windows PowerShell
Get-Process node | Stop-Process -Force
```

### 3-2. Metro 터널 시작

```bash
cd tripframe/apps/mobile
npx expo start --tunnel
```

정상 출력 예시:
```
Starting Metro Bundler
Tunnel connected.
Tunnel ready.
Waiting on http://localhost:8081
```

터널 URL은 터미널 화면에 QR코드와 함께 표시됩니다:
```
› Metro waiting on exp://xxxx-seuldoo-8081.exp.direct
```

---

## 4. Expo Dev Client에서 앱 접속

### 4-1. Expo Dev Client 앱 설치

Android 기기에 **EAS 빌드로 생성된 APK** (2단계에서 설치한 앱)를 실행합니다.  
이 앱 자체가 Expo Dev Client입니다 — Play Store의 "Expo Go"와 다릅니다.

### 4-2. Direct URL로 접속

앱 실행 후 접속 방법 두 가지:

**방법 A — URL 직접 입력**
1. 앱 하단 "Enter URL manually" 탭
2. Metro 터널 URL 입력: `exp://xxxx-seuldoo-8081.exp.direct`

**방법 B — QR 코드 스캔**
1. 터미널에 표시된 QR 코드를 기기 카메라로 스캔

### 4-3. 번들링 확인

접속 후 터미널에 아래 로그가 뜨면 정상:
```
Android Bundled 1700ms apps/mobile/index.js (1548 modules)
```

---

## 5. 자주 발생하는 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| Metro 시작 시 `Port 8081 is being used` | 이전 Metro 프로세스 잔존 | `Get-Process node \| Stop-Process -Force` |
| EAS 업로드 시 `EBUSY` 오류 | Gradle 데몬 파일 잠금 | `./gradlew --stop` 후 재시도 |
| `pnpm install` 시 `EPERM` 오류 | Metro가 node_modules 점유 | Node 프로세스 종료 후 재설치 |
| 앱 실행 시 흰 화면 또는 즉시 종료 | `.env` 파일 없음 | `.env` 파일 확인 |
| 앱 실행 시 `Cannot find native module 'ExpoCryptoAES'` | expo-crypto canary 버전 설치됨 | `tripframe/package.json`의 pnpm override 확인 (`expo-crypto: ~15.0.8`) |
| 기기에서 서버를 찾을 수 없음 | LAN IP로 연결 시 방화벽 차단 | `--tunnel` 옵션 사용 (ngrok 우회) |

---

## 6. 언제 EAS 재빌드가 필요한가

| 변경 내용 | EAS 재빌드 필요 여부 |
|-----------|-------------------|
| `.tsx` / `.ts` 파일 수정 | ❌ Metro 핫리로드로 즉시 반영 |
| `package.json` 패키지 추가/제거 | ✅ 네이티브 모듈 포함 시 필요 |
| `app.json` 수정 | ✅ 필요 |
| `android/` 하위 파일 수정 | ✅ 필요 |
| `src/widget/` 수정 | ❌ Metro 핫리로드 (단, 위젯은 재추가 필요) |

> 위젯 변경 후 확인 시: 홈화면에서 기존 위젯 제거 → 다시 추가해야 반영됨.

---

## 7. 빌드 프로파일 설명

`tripframe/apps/mobile/eas.json` 기준:

| 프로파일 | 용도 | 배포 방식 | 파일 형식 |
|---------|------|-----------|---------|
| `development` | 개발/POC | Internal (팀 내부) | APK |
| `preview` | 클로즈드 베타 | Internal | APK |
| `production` | 앱스토어 출시 | Store | AAB |

```bash
# 개발용 (현재 POC)
npx eas-cli build --platform android --profile development

# 베타 배포용
npx eas-cli build --platform android --profile preview
```

---

*가이드 v1.0 | 2026-04-08 | TripFrame Phase 6 POC 기준*
