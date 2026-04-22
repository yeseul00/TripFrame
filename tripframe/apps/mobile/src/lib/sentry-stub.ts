// 웹 빌드용 Sentry no-op stub
// @sentry/react-native은 네이티브 전용이라 웹 번들에서 크래시 발생
// metro.config.js resolveRequest로 이 파일로 교체됨

export const init = (_options: unknown) => {};
export const wrap = <T>(component: T): T => component;
export const captureException = (_error: unknown) => {};
export const captureMessage = (_message: string) => {};
export const setUser = (_user: unknown) => {};

export default { init, wrap, captureException, captureMessage, setUser };
