import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// 웹: http://localhost:8081 / 네이티브: tripframe://
const redirectUri = makeRedirectUri(
  Platform.OS === 'web' ? {} : { scheme: 'tripframe' },
);

export function useGoogleAuth() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '',
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    },
    GOOGLE_DISCOVERY,
  );

  useEffect(() => {
    if (response?.type !== 'success') return;

    const idToken = response.params['id_token'];
    if (!idToken) return;

    supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
  }, [response]);

  return {
    promptAsync,
    isReady: !!request,
  };
}
