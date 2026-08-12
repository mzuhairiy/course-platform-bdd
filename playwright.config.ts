import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
const testDir = defineBddConfig({
    features: 'features/**/*.feature',
    steps: 'steps/**/*.ts',
});
export default defineConfig({
    testDir,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3002',
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },
    timeout: 30000,
    retries: 1,
});