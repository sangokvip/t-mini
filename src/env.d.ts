/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_USER_ID: string
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 