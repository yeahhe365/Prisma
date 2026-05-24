export const resolveAppVersion = (version?: string) => version || '0.0.0-dev';

export const APP_VERSION = resolveAppVersion(import.meta.env.VITE_APP_VERSION);
