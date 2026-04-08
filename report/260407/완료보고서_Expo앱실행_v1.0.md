# TripFrame Expo 앱 실행 조치 완료보고서

**작성일**: 2026-04-07
**작업 유형**: EAS Dev Build 실행 환경 복구 + 네이티브 모듈 호환성 수정
**관련 태스크**: TASK-102 (D-day 위젯 POC)
**결과**: Expo Dev Client 앱 정상 실행 ✅

---

## 문제 요약

EAS Dev Build APK 설치 후 Expo Dev Client 연결 시 앱이 시작되지 않고 아래 에러 발생:

```
[runtime not ready]: Error: Cannot find native module 'ExpoCryptoAES'
```

---

## 근본 원인 분석

| 원인 | 내용 |
|------|------|
| **expo-auth-session canary 의존성** | `expo-auth-session@55.0.11-canary`가 `expo-crypto@55.0.11-canary`를 pull-in |
| **canary AES 네이티브 모듈 미컴파일** | expo-crypto canary가 신규 추가한 `ExpoCryptoAES` (AesCryptoModule)이 EAS 클라우드 빌드 시 APK에 정상 컴파일되지 않음 |
| **JS ↔ Native 불일치** | JS 번들(canary)은 `requireNativeModule('ExpoCryptoAES')` 호출하지만 네이티브 코드에는 해당 모듈 없음 → 런타임 즉시 크래시 |

---

## 조치 내역

### 조치 1 — expo-crypto stable 버전 고정

**파일**: `tripframe/package.json`

```json
"pnpm": {
  "overrides": {
    "expo-crypto": "~15.0.8"
  }
}
```

- pnpm workspace override로 canary(`55.0.11-canary`) → stable(`15.0.8`) 강제 고정
- `ExpoCryptoAES` 네이티브 모듈 요청 자체를 제거

### 조치 2 — encryptedStorage.ts 의존성 교체

**파일**: `tripframe/apps/mobile/src/storage/encryptedStorage.ts`

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| AES-GCM 구현 | `crypto.subtle` (Web Crypto API — RN 미지원) | `@noble/ciphers/aes` gcm (순수 JS) |
| 랜덤 바이트 생성 | `expo-crypto` `getRandomBytesAsync` | `@noble/ciphers/utils` `randomBytes` |
| 플랫폼 분기 | 네이티브/웹 별도 구현 | 단일 구현 (플랫폼 무관) |

- `import * as Crypto from 'expo-crypto'` 제거
- `crypto.subtle.importKey / encrypt / decrypt` 제거
- 암호화 형식(`ivHex:cipherHex`) 유지 → 인터페이스 호환

### 조치 3 — 방화벽 우회 (터널 모드)

- PC LAN IP(`172.16.0.5`) 직접 연결 시 Windows 방화벽 포트 8081 차단
- `expo start --tunnel` + ngrok 터널로 우회
- 터널 URL: `http://0m-7xew-seuldoo-8081.exp.direct`

---

## 발생한 부가 이슈 및 처리

| 이슈 | 원인 | 처리 |
|------|------|------|
| 첫 EAS 빌드 APK에서도 동일 에러 | `expo prebuild` 이전 상태로 빌드됨 | `expo prebuild --clean` 후 재빌드 |
| 재빌드 시 EBUSY 업로드 실패 | Gradle 데몬이 파일 잠금 | `./gradlew --stop` 후 재시도 |
| pnpm install EPERM 실패 | Metro가 node_modules 파일 점유 | Node 프로세스 종료 후 재설치 |
| Metro ENOENT 충돌 종료 | Windows 임시 폴더 감시 중 삭제 | Metro 재시작 |

---

## 최종 상태

| 항목 | 상태 |
|------|------|
| EAS Dev Build APK | 빌드 성공 (build ID: `a3776863`) |
| Expo Dev Client 연결 | 터널 모드 정상 연결 |
| 앱 실행 | 정상 실행 ✅ |
| `expo-crypto` 버전 | `15.0.8` stable (고정) |
| `encryptedStorage` | `@noble/ciphers` 기반으로 교체 |

---

## 재발 방지

- `expo-auth-session`, `expo-web-browser` canary 의존 패키지가 추가될 경우, pnpm overrides에 해당 패키지도 stable 버전 명시 필요
- Expo SDK 업그레이드 시 canary 패키지 전체 일괄 정리 필요 (TASK-100 참조)
- Windows 환경에서 EAS 업로드 전 `./gradlew --stop` 선행 권장

---

*보고서 v1.0 | 2026-04-07 | seul*
