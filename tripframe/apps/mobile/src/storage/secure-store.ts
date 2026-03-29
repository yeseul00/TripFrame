/**
 * secure-store.ts — 웹 빌드에서 SecureStore를 null stub으로 대체
 * encryptedStorage는 Platform.OS === 'web' 분기에서 SecureStore를 호출하지 않습니다.
 */
export const SecureStore = null as unknown as {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};
