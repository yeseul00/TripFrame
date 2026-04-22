import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { encryptedStorage } from '../storage/encryptedStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL 또는 EXPO_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다. ' +
      'apps/mobile/.env 파일을 .env.example 기준으로 작성해주세요.',
  );
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: encryptedStorage,
        autoRefreshToken: true,
        persistSession: true,
        // 웹: OAuth 리다이렉트 복귀 시 URL에서 세션 자동 감지
        // 네이티브: expo-auth-session이 직접 처리하므로 false
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;
