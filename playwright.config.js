import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173/detran-practice/",
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "docker compose up",
    port: 5173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
