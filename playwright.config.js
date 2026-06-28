const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:4173',
    serviceWorkers: 'block',
    launchOptions: {
      executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    headless: true,
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  },
  webServer: {
    command: 'npx serve . -p 4173 -s',
    port: 4173,
    reuseExistingServer: false,
  },
});
