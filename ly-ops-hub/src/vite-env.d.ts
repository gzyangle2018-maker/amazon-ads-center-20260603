/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_PUBLIC_SITE_URL: string;
  readonly VITE_HUB_URL: string;
  readonly VITE_AUTH_ENABLED: string;
  readonly VITE_DEFAULT_LLM_PROVIDER: string;
  readonly VITE_DEFAULT_LLM_MODEL: string;
  readonly VITE_STOCK_HELPER_URL: string;
  readonly VITE_STOCK_HELPER_GITHUB: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
