/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /** Override the same-origin e-RaktKosh proxy, e.g. with your own backend route. */
  readonly VITE_ERAKTKOSH_PROXY?: string
}
