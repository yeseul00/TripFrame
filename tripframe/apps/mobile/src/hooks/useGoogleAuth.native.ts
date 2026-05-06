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
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const promptAsync = async () => {
    // BUG-08 — silent return 제거. 어디서 막히는지 사용자 화면에 노출.
    try {
      if (!supabase) {
        Alert.alert(
          '로그인 불가',
          'Supabase 연결이 구성되지 않았습니다. EAS 빌드 환경 변수(EXPO_PUBLIC_SUPABASE_URL/_ANON_KEY)를 확인하세요.'
        );
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'tripframe://',
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert('OAuth 시작 실패', error.message);
        return;
      }
      if (!data.url) {
        Alert.alert('OAuth 시작 실패', '인증 URL이 비어 있습니다.');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, 'tripframe://');

      if (result.type !== 'success') {
        // cancel/dismiss는 사용자가 직접 닫은 것이라 조용히 종료
        if (result.type === 'cancel' || result.type === 'dismiss') return;
        Alert.alert('브라우저 세션 실패', `결과 타입: ${result.type}`);
        return;
      }

      // URL fragment에서 토큰 추출: tripframe://#access_token=...&refresh_token=...
      const raw = result.url;
      const hashIndex = raw.indexOf('#');
      if (hashIndex === -1) {
        Alert.alert(
          '콜백 처리 실패',
          'URL에 토큰 fragment가 없습니다. Supabase Dashboard → URL Configuration → Redirect URLs에 tripframe:// 가 등록되어 있는지 확인하세요.'
        );
        return;
      }

      const params = new URLSearchParams(raw.substring(hashIndex + 1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        Alert.alert('토큰 누락', 'access_token 또는 refresh_token이 콜백 URL에 없습니다.');
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        Alert.alert('세션 설정 실패', sessionError.message);
      }
    } catch (e) {
      Alert.alert('로그인 중 오류', String(e));
    }
  };

  return { promptAsync, isReady: true };
}
