/**
 * native-kv.native.ts — expo-sqlite/kv-store를 네이티브 빌드에만 포함
 * Metro는 .native.ts를 네이티브 플랫폼(iOS/Android)에서만 사용합니다.
 */
export { default as KvStore } from 'expo-sqlite/kv-store';
