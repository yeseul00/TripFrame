/**
 * encryptedStorage — AES-256-GCM 암호화 스토리지 래퍼 (TASK-084)
 *
 * Phase 4: expo-crypto AES-256-GCM, 마스터 키는 kv-store 저장
 * Phase 5: getMasterKeyBytes() 저장소를 expo-secure-store로 교체 (TASK-094)
 * Phase 6: expo-crypto 의존성 제거 → @noble/ciphers 순수 JS로 교체 (ExpoCryptoAES 호환성 이슈)
 *
 * Constitution Article VIII 준수 — 평문 AsyncStorage 저장 금지
 */

import { Platform } from 'react-native'
import { gcm } from '@noble/ciphers/aes'
import * as Crypto from 'expo-crypto'
import { KvStore } from './native-kv'
import { SecureStore } from './secure-store'

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const MASTER_KEY_STORAGE_KEY = 'tripframe_master_key'
const IV_LENGTH = 12   // AES-GCM 권장 96-bit IV
const KEY_LENGTH = 32  // 256-bit key

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToUint8Array(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return result
}

// ─────────────────────────────────────────────
// 마스터 키 관리 (@noble/ciphers randomBytes 사용 — 네이티브/웹 공통)
// ─────────────────────────────────────────────

/**
 * 마스터 키를 가져온다.
 * 우선순위: SecureStore → kv-store(마이그레이션) → 신규 생성
 *
 * TASK-094: getMasterKey() 저장소 1곳만 교체. 암호화 로직 변경 없음.
 */
async function getMasterKeyBytes(): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    const stored = localStorage.getItem(MASTER_KEY_STORAGE_KEY)
    if (stored) return hexToUint8Array(stored)
    const keyBytes = new Uint8Array(KEY_LENGTH)
    crypto.getRandomValues(keyBytes)
    localStorage.setItem(MASTER_KEY_STORAGE_KEY, bufferToHex(keyBytes.buffer as ArrayBuffer))
    return keyBytes
  }

  // 1. SecureStore에서 키 조회 (정상 경로 + 재시작 후 경로)
  const secureKey = await SecureStore.getItemAsync(MASTER_KEY_STORAGE_KEY)
  if (secureKey) {
    return hexToUint8Array(secureKey)
  }

  // 2. kv-store에서 키 조회 (Phase 4 → Phase 5 마이그레이션 시나리오)
  const kvKey = await KvStore.getItem(MASTER_KEY_STORAGE_KEY)
  if (kvKey) {
    try {
      await SecureStore.setItemAsync(MASTER_KEY_STORAGE_KEY, kvKey)
      const verify = await SecureStore.getItemAsync(MASTER_KEY_STORAGE_KEY)
      if (verify === kvKey) {
        // 이전 성공 → kv-store 구 키 삭제
        await KvStore.removeItem(MASTER_KEY_STORAGE_KEY)
      }
      // verify 불일치 → kv-store 키 유지 (다음 실행 시 재시도)
    } catch {
      // SecureStore 저장 실패 → kv-store 키 유지(폴백) + 에러 로깅
      console.warn('[encryptedStorage] SecureStore 마이그레이션 실패, kv-store 키 유지')
    }
    return hexToUint8Array(kvKey)
  }

  // 3. 최초 실행 — 랜덤 256-bit 키 생성 (expo-crypto)
  const keyBytes = await Crypto.getRandomBytesAsync(KEY_LENGTH)
  const keyHex = bufferToHex(keyBytes.buffer as ArrayBuffer)
  try {
    await SecureStore.setItemAsync(MASTER_KEY_STORAGE_KEY, keyHex)
  } catch {
    // SecureStore 저장 실패 → kv-store 폴백 (데이터 손실 방지)
    console.warn('[encryptedStorage] SecureStore 키 저장 실패, kv-store 폴백')
    await KvStore.setItem(MASTER_KEY_STORAGE_KEY, keyHex)
  }
  return keyBytes
}

// ─────────────────────────────────────────────
// encrypt / decrypt (@noble/ciphers AES-256-GCM — 네이티브/웹 공통)
// ─────────────────────────────────────────────

async function encrypt(plaintext: string): Promise<string> {
  const keyBytes = await getMasterKeyBytes()
  const iv = await Crypto.getRandomBytesAsync(IV_LENGTH)
  const encoded = new TextEncoder().encode(plaintext)
  const cipherBytes = gcm(keyBytes, new Uint8Array(iv)).encrypt(encoded)
  return `${bufferToHex(iv.buffer as ArrayBuffer)}:${bufferToHex(cipherBytes.buffer as ArrayBuffer)}`
}

async function decrypt(ciphertext: string): Promise<string> {
  const parts = ciphertext.split(':')
  if (parts.length !== 2) throw new Error('Invalid ciphertext format')
  const [ivHex, cipherHex] = parts
  const keyBytes = await getMasterKeyBytes()
  const iv = hexToUint8Array(ivHex)
  const cipherData = hexToUint8Array(cipherHex)
  const plainBytes = gcm(keyBytes, iv).decrypt(cipherData)
  return new TextDecoder().decode(plainBytes)
}

// ─────────────────────────────────────────────
// 공개 API — AsyncStorage 호환 인터페이스
// 웹: localStorage 사용 (SQLite WASM 불필요)
// 네이티브: expo-sqlite/kv-store 사용
// ─────────────────────────────────────────────

async function rawGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key)
  }
  return KvStore.getItem(key)
}

async function rawSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value)
  } else {
    await KvStore.setItem(key, value)
  }
}

async function rawRemove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key)
  } else {
    await KvStore.removeItem(key)
  }
}

export const encryptedStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const raw = await rawGet(key)
    if (raw === null) return null
    try {
      return await decrypt(raw)
    } catch {
      // 손상된 데이터 또는 평문 데이터 → null 반환 (마이그레이션 단계에서 처리)
      return null
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    const encrypted = await encrypt(value)
    await rawSet(key, encrypted)
  },

  removeItem: async (key: string): Promise<void> => {
    await rawRemove(key)
  },
}

// ─────────────────────────────────────────────
// SecureStore 마스터 키 마이그레이션 (TASK-094)
// App.tsx 시작 시 1회 호출 — 로딩 인디케이터 표시 용도
// ─────────────────────────────────────────────

/**
 * 마스터 키를 kv-store → SecureStore로 마이그레이션한다.
 * 웹에서는 no-op. 네이티브에서 getMasterKeyBytes()를 eagerly 호출하여
 * 앱 데이터 접근 전 키 초기화를 완료한다.
 */
export async function migrateMasterKey(): Promise<void> {
  if (Platform.OS === 'web') return
  // getMasterKeyBytes() 내부에서 마이그레이션 로직 전체 처리
  await getMasterKeyBytes()
}

// ─────────────────────────────────────────────
// 마이그레이션 헬퍼 — 기존 AsyncStorage 평문 데이터 → encryptedStorage
// 앱 시작 시 1회 실행. 이후 자동 삭제.
// ─────────────────────────────────────────────

const MIGRATION_FLAG_KEY = 'tripframe_migration_v1_done'
const KEYS_TO_MIGRATE = ['tripframe-storage']

export async function migrateFromAsyncStorage(): Promise<void> {
  const done = await rawGet(MIGRATION_FLAG_KEY)
  if (done === 'true') return

  try {
    // React Native AsyncStorage는 동적 import로 로드 (웹 환경 제외)
    if (Platform.OS !== 'web') {
      const AsyncStorage = (
        await import('@react-native-async-storage/async-storage')
      ).default

      for (const key of KEYS_TO_MIGRATE) {
        const plainValue = await AsyncStorage.getItem(key)
        if (plainValue !== null) {
          await encryptedStorage.setItem(key, plainValue)
          await AsyncStorage.removeItem(key)
        }
      }
    }

    await rawSet(MIGRATION_FLAG_KEY, 'true')
  } catch {
    // 마이그레이션 실패 시 다음 시작 시 재시도 (플래그 저장 안 함)
  }
}
