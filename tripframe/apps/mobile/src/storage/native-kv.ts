/**
 * native-kv.ts — 웹 빌드에서 KvStore를 null stub으로 대체
 * encryptedStorage는 Platform.OS === 'web' 분기에서 KvStore를 호출하지 않습니다.
 */
export const KvStore = null as unknown as {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
