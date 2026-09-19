import { defineConfig } from "@playwright/test";
// PORT picks another port when 5173 is busy on a dev machine; CI always starts its own.
const port = process.env.PORT || "5173";
export default defineConfig({
  testDir: "./tests/browser",
  // The venue is heavy for a software renderer: give each test room to breathe.
  timeout: 240000,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    // Fewer pixels for the software renderer; the layout is the desktop one either way.
    viewport: { width: 1100, height: 690 },
    launchOptions: {
      args: [
        "--no-sandbox",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
