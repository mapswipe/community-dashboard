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
function getCommitHash(): string {
  if (process.env.APP_COMMIT_HASH) {
    return process.env.APP_COMMIT_HASH;
  }

  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    throw new Error(
      'Unable to determine commit hash. You must either provide a commit hash using the APP_COMMIT_HASH environment variable,' +
      ' or provide a valid Git repository (submodule doesn\'t work with docker).'
    );
  }
}

const commitHash = getCommitHash();

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
