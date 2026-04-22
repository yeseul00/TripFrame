/**
 * 웹 전용 Google 로그인 — Supabase OAuth 리다이렉트 방식
 *
 * expo-web-browser 팝업은 Google의 COOP 정책으로 window.closed 감지가 차단됨.
 * 웹에서는 supabase.auth.signInWithOAuth() 리다이렉트 방식을 사용.
 */
import { supabase } from '../lib/supabase';

export function useGoogleAuth() {
  const promptAsync = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined'
          ? window.location.origin
          : 'http://localhost:8081',
      },
    });
  };

  return { promptAsync, isReady: true };
}
