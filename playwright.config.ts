import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Disable full parallelism to avoid state conflicts between tests
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Limit workers to prevent database overload and state conflicts
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    headless: true,
    // Add unique context for each test to avoid state sharing
    contextOptions: {
      // Each test gets its own storage state
      storageState: { cookies: [], origins: [] }
    }
  },
  projects: [
    {
      name: 'functional-tests',
      testMatch: '**/functional/**/*.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        // Functional tests run sequentially to avoid state conflicts
      },
    },
    {
      name: 'screenshot-tests',
      testMatch: '**/screenshots/**/*.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        // Screenshot tests can run in parallel as they're read-only
      },
    },
    {
      name: 'script-tests',
      testMatch: '**/scripts/**/*.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        // Script tests should run sequentially to avoid resource conflicts
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes startup timeout
  },
  // Add global setup/teardown for test isolation
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
});
