/**
 * 네이티브 전용 Google 로그인 — Supabase OAuth + expo-web-browser
 *
 * 기존 expo-auth-session 방식은 EAS 스탠드얼론 빌드에서
 * tripframe:// custom scheme을 Google Cloud Console에 등록할 수 없어 차단됨.
 *
 * 대신 Supabase OAuth 플로우 사용:
 *   1. supabase.auth.signInWithOAuth → Google OAuth URL 생성
 *   2. openAuthSessionAsync → 브라우저에서 OAuth 진행
 *   3. Supabase callback → tripframe:// 딥링크로 리다이렉트
 *   4. URL fragment에서 access_token / refresh_token 추출 → setSession
 *
 * Supabase 대시보드에서 Redirect URLs에 tripframe:// 추가 필요.
 */
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const promptAsync = async () => {
    if (!supabase) return;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'tripframe://',
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) return;

    const result = await WebBrowser.openAuthSessionAsync(data.url, 'tripframe://');

    if (result.type !== 'success') return;

    // URL fragment에서 토큰 추출: tripframe://#access_token=...&refresh_token=...
    const raw = result.url;
    const hashIndex = raw.indexOf('#');
    if (hashIndex === -1) return;

    const params = new URLSearchParams(raw.substring(hashIndex + 1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  };

  return { promptAsync, isReady: true };
}
