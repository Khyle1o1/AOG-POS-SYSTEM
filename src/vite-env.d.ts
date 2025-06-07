/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_LICENSE_SERVER_URL?: string
  readonly NODE_ENV: string
  readonly VITE_APP_ENV?: string
  // add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 