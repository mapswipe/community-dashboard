import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import webfontDownload from 'vite-plugin-webfont-dl';
import reactSwc from '@vitejs/plugin-react-swc';
import { execSync } from 'child_process';
import { compression } from 'vite-plugin-compression2';
import checker from 'vite-plugin-checker';
import { ValidateEnv as validateEnv } from '@julr/vite-plugin-validate-env';

import communityDashboardPackage from './package.json';

/* Get commit hash */
const commitHash = execSync('git rev-parse --short HEAD').toString();

export default defineConfig(({ mode }) => {
    const isProd = mode === 'production';

    return {
        define: {
            'import.meta.APP_COMMIT_HASH': JSON.stringify(commitHash),
            'import.meta.env.APP_VERSION': JSON.stringify(communityDashboardPackage.version),
            'import.meta.env.APP_ID': JSON.stringify('mapswipe-community-dashboard'),
        },
        plugins: [
            isProd ? checker({
                // typescript: true,
                eslint: {
                    lintCommand: 'eslint ./app',
                },
                stylelint: {
                    lintCommand: 'stylelint "./app/**/*.css"',
                },
            }) : undefined,
            reactSwc(),
            tsconfigPaths(),
            webfontDownload(),
            validateEnv(),
            isProd ? compression() : undefined,
        ],
        css: {
            devSourcemap: isProd,
            modules: {
                scopeBehaviour: 'local',
                localsConvention: 'camelCaseOnly',
            },
        },
        envPrefix: 'APP_',
        server: {
            port: 3000,
            strictPort: true,
            host: '0.0.0.0',
        },
        build: {
            outDir: 'build',
            sourcemap: isProd,
        },
        test: {
            environment: 'happy-dom',
        },
    };
});
