/// <reference types="vite/client" />

type ImportMetaEnvAugmented = import('@julr/vite-plugin-validate-env').ImportMetaEnvAugmented<
  typeof import('../../env').default
>

interface ImportMetaEnv extends ImportMetaEnvAugmented {
    // The custom environment variables that are passed through the vite
    APP_TITLE: string;
    APP_GRAPHQL_ENDPOINT: string;
    APP_SENTRY_DSN: string;
    APP_SENTRY_TRACES_SAMPLE_RATE: string;
    APP_ENVIRONMENT: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
