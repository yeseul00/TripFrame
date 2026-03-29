/**
 * encryptedStorage 단위 테스트 (TASK-084)
 * 정상 암호화/복호화, 손상 데이터, 키 없는 초기 상태
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
import { encryptedStorage } from '../encryptedStorage'

// ─── 헬퍼 ────────────────────────────────────────────────────────

function clearKvStore() {
  Object.keys(kvStore).forEach((k) => delete kvStore[k])
}

// ─── 테스트 케이스 ───────────────────────────────────────────────

describe('encryptedStorage', () => {
  beforeEach(() => {
    clearKvStore()
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

  // 케이스 3: 키 없는 초기 상태 → 자동 키 생성 후 저장
  it('마스터 키가 없는 초기 상태에서 setItem/getItem이 정상 동작한다', async () => {
    // kvStore 완전히 비어있는 상태 (clearKvStore로 이미 처리)
    expect(Object.keys(kvStore)).toHaveLength(0)

    const key = 'fresh-key'
    const value = '{"trip":"fukuoka"}'

    await encryptedStorage.setItem(key, value)

    // 마스터 키가 kv-store에 저장되었는지 확인
    expect(kvStore['tripframe_master_key']).toBeDefined()

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
