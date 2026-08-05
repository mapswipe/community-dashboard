/// <reference types="vite/client" />

type ImportMetaEnvAugmented = import('@togglecorp/vite-plugin-validate-env').ImportMetaEnvAugmented<
  typeof import('../../env').default
>

interface ImportMetaEnv extends ImportMetaEnvAugmented {
    // The custom environment variables that are passed through the vite
    // NOTE: The APP_* variables validated by env.ts are typed by
    // ImportMetaEnvAugmented; only vite's own `define` values belong here
    APP_VERSION: string;
    APP_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
