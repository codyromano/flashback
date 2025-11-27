// Playwright configuration for Flashback
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './tests/playwright',
  timeout: 30000,
  retries: 0,
  use: {
    headless: false,
    baseURL: 'http://localhost:3000',
    video: 'on',
    screenshot: 'on',
    trace: 'on',
  },
};

config.globalSetup = require.resolve('./tests/playwright/global-setup.cjs');
config.globalTeardown = require.resolve('./tests/playwright/global-teardown.cjs');

module.exports = config;
