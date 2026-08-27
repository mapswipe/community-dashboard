import {
    defineConfig,
    overrideDefineForWebAppServe,
    Schema,
} from '@togglecorp/vite-plugin-validate-env';

const webAppServeEnabled = process.env.WEB_APP_SERVE_ENABLED?.toLowerCase() === 'true';
if (webAppServeEnabled) {
    // eslint-disable-next-line no-console
    console.warn('Building application for web-app-serve');
}
const overrideDefine = webAppServeEnabled
    ? overrideDefineForWebAppServe
    : undefined;

export default defineConfig({
    overrideDefine,
    validator: 'builtin',
    schema: {
        // NOTE: These are the dynamic env variables
        APP_GRAPHQL_ENDPOINT: Schema.string({ format: 'url', protocol: true, tld: false }),
        APP_BACKEND_ENDPOINT: Schema.string({ format: 'url', protocol: true, tld: false }),
        APP_SENTRY_DSN: Schema.string.optional(),
        // NOTE: Kept a string (not Schema.number) so it survives the
        // web-app-serve placeholder override; consumers coerce it with Number()
        APP_SENTRY_TRACES_SAMPLE_RATE: Schema.string.optional(),
        APP_ENVIRONMENT: (key: string, value: string) => {
            const regex = /^(PROD|STAGE|testing|ci|alpha-\d+|ALPHA-\d+|SANDBOX-\d+|DEV)$/;
            const valid = !!value && (value.match(regex) !== null);
            if (!valid) {
                throw new Error(`Value for environment variable "${key}" must match regex "${regex}", instead received "${value}"`);
            }
            return value as ('PROD' | 'STAGE' | 'testing' | 'ci' | `alpha-${number}` | 'DEV' | `ALPHA-${number}`);
        },
        APP_GA_TRACKING_ID: Schema.string.optional(),
        APP_GRAPHQL_CODEGEN_ENDPOINT: Schema.string(),
    },
});
