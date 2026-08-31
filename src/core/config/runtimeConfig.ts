export interface RuntimeConfig {
  appName: string;
  appVersion: string;
  isProduction: boolean;
  isDevelopment: boolean;
  defaultBitrate: number;
}

export const runtimeConfig: RuntimeConfig = {
  appName: 'CineTheme',
  appVersion: '0.1.0',
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  defaultBitrate: 120_000_000,
};
