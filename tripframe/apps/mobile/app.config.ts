import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * app.config.ts — app.json을 동적으로 확장.
 * SENTRY_DSN은 EAS Secrets 또는 .env에서 주입.
 * 절대 하드코딩 금지.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'TripFrame',
  slug: config.slug ?? 'tripframe',
  plugins: [
    ...(config.plugins ?? []),
    [
      '@sentry/react-native/expo',
      {
        // 소스맵 업로드는 EAS Build 시점에만 활성화
        // organization, project는 Sentry 대시보드 슬러그와 일치해야 함
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ],
  ],
  extra: {
    ...(config.extra ?? {}),
    sentryDsn: process.env.SENTRY_DSN ?? '',
  },
});
