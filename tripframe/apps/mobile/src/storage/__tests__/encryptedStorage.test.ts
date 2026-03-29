/**
 * encryptedStorage 단위 테스트 (TASK-084 + TASK-094)
 * 정상 암호화/복호화, 손상 데이터, 키 없는 초기 상태
 * + SecureStore 마이그레이션: 성공 / 실패 폴백 / 중단 후 재시도
 */

// ─── 모의 KV 스토어 ───────────────────────────────────────────────
const kvStore: Record<string, string> = {}

// native-kv.native.ts 대신 native-kv.ts(null)가 로드되므로 경로 직접 mock
jest.mock('../native-kv', () => ({
  KvStore: {
    getItem: jest.fn(async (key: string) => kvStore[key] ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      kvStore[key] = value
    }),
    removeItem: jest.fn(async (key: string) => {
      delete kvStore[key]
    }),
  },
}))

// ─── 모의 expo-secure-store ──────────────────────────────────────
const secureStore: Record<string, string> = {}
let secureStoreShouldFail = false

jest.mock('../secure-store', () => ({
  SecureStore: {
    getItemAsync: jest.fn(async (key: string) => secureStore[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      if (secureStoreShouldFail) throw new Error('SecureStore unavailable')
      secureStore[key] = value
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete secureStore[key]
    }),
  },
}))

// ─── 모의 expo-crypto ─────────────────────────────────────────────
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (size: number) => new Uint8Array(size).fill(0x42)),
}))

// ─── 모의 react-native (Platform) ────────────────────────────────
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}))

// ─── Web Crypto polyfill (Node.js 환경) ──────────────────────────
import { webcrypto } from 'crypto'
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, writable: true })

// ─── 테스트 대상 import ───────────────────────────────────────────
// jest.mock 선언 이후에 import 해야 mock이 적용됨
import { encryptedStorage, migrateMasterKey } from '../encryptedStorage'

// ─── 헬퍼 ────────────────────────────────────────────────────────

function clearStores() {
  Object.keys(kvStore).forEach((k) => delete kvStore[k])
  Object.keys(secureStore).forEach((k) => delete secureStore[k])
  secureStoreShouldFail = false
}

// ─── 기존 테스트 케이스 (TASK-084) ──────────────────────────────

describe('encryptedStorage', () => {
  beforeEach(() => {
    clearStores()
    jest.clearAllMocks()
  })

  // 케이스 1: 정상 암호화/복호화
  it('setItem 후 getItem 시 원본 값이 복원된다', async () => {
    const key = 'test-key'
    const value = JSON.stringify({ hello: 'world', num: 42 })

    await encryptedStorage.setItem(key, value)
    const result = await encryptedStorage.getItem(key)

    expect(result).toBe(value)
  })

  // 케이스 2: 손상된 암호문 → null 반환 (오류 전파 금지)
  it('손상된 암호문이 저장된 경우 getItem은 null을 반환한다', async () => {
    kvStore['corrupted-key'] = 'not_valid_ciphertext_format'

    const result = await encryptedStorage.getItem('corrupted-key')

    expect(result).toBeNull()
  })

  // 케이스 3: 키 없는 초기 상태 → 자동 키 생성 후 SecureStore에 저장
  it('마스터 키가 없는 초기 상태에서 setItem/getItem이 정상 동작한다', async () => {
    expect(Object.keys(kvStore)).toHaveLength(0)
    expect(Object.keys(secureStore)).toHaveLength(0)

    const key = 'fresh-key'
    const value = '{"trip":"fukuoka"}'

    await encryptedStorage.setItem(key, value)

    // TASK-094: 마스터 키가 SecureStore에 저장되었는지 확인
    expect(secureStore['tripframe_master_key']).toBeDefined()

    const result = await encryptedStorage.getItem(key)
    expect(result).toBe(value)
  })

  // 케이스 4: removeItem 후 getItem → null
  it('removeItem 후 getItem은 null을 반환한다', async () => {
    await encryptedStorage.setItem('remove-test', 'data')
    await encryptedStorage.removeItem('remove-test')

    const result = await encryptedStorage.getItem('remove-test')
    expect(result).toBeNull()
  })

  // 케이스 5: 존재하지 않는 키 → null
  it('존재하지 않는 키에 대해 getItem은 null을 반환한다', async () => {
    const result = await encryptedStorage.getItem('non-existent')
    expect(result).toBeNull()
  })
})

// ─── SecureStore 마이그레이션 테스트 (TASK-094) ──────────────────

describe('migrateMasterKey', () => {
  beforeEach(() => {
    clearStores()
    jest.clearAllMocks()
  })

  // 마이그레이션 1: kv-store 키 → SecureStore 이전 성공 → kv-store 삭제
  it('kv-store에 마스터 키가 있으면 SecureStore로 이전하고 kv-store 키를 삭제한다', async () => {
    const legacyKeyHex = '42'.repeat(32) // 32바이트 hex
    kvStore['tripframe_master_key'] = legacyKeyHex

    await migrateMasterKey()

    // SecureStore에 키 존재
    expect(secureStore['tripframe_master_key']).toBe(legacyKeyHex)
    // kv-store 구 키 삭제
    expect(kvStore['tripframe_master_key']).toBeUndefined()
  })

  // 마이그레이션 2: SecureStore 실패 → kv-store 키 유지 (데이터 손실 방지)
  it('SecureStore 저장 실패 시 kv-store 키를 유지한다 (폴백)', async () => {
    const legacyKeyHex = '42'.repeat(32)
    kvStore['tripframe_master_key'] = legacyKeyHex
    secureStoreShouldFail = true

    await migrateMasterKey()

    // kv-store 키 여전히 존재 (폴백)
    expect(kvStore['tripframe_master_key']).toBe(legacyKeyHex)
    // SecureStore에 키 없음
    expect(secureStore['tripframe_master_key']).toBeUndefined()
  })

  // 마이그레이션 3: 앱 강제 종료 후 재시도 — SecureStore와 kv-store 모두 존재 시 SecureStore 우선
  it('SecureStore와 kv-store 모두 키가 있을 때 SecureStore 값을 우선 사용한다', async () => {
    const secureKeyHex = 'aa'.repeat(32)
    const kvKeyHex = 'bb'.repeat(32)
    secureStore['tripframe_master_key'] = secureKeyHex
    kvStore['tripframe_master_key'] = kvKeyHex

    // setItem 후 복호화에 사용되는 키가 SecureStore의 키인지 확인
    const value = '{"secure":"priority"}'
    await encryptedStorage.setItem('priority-test', value)

    // kv-store 키 삭제 후에도 복호화 가능 (SecureStore 키 사용)
    delete kvStore['tripframe_master_key']
    const result = await encryptedStorage.getItem('priority-test')
    expect(result).toBe(value)
  })
})
