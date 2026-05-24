/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_API_KEY?: string;
  readonly GEMINI_API_KEY?: string;
  readonly VITE_API_PROXY_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
