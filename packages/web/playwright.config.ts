import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:7778",
    trace: "retain-on-failure",
  },
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  webServer: {
    command:
      "DATABASE_URL=postgresql://pinchy:pinchy_dev@localhost:5433/pinchy_test AUTH_SECRET=test-secret-for-e2e ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000001 WORKSPACE_BASE_PATH=/tmp/pinchy-test-workspaces PORT=7778 tsx server.ts",
    port: 7778,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 30000,
  },
});
