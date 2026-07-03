import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.github.MokuProject.Moku',
  appName: 'Moku',
  // SvelteKit's adapter-static build output (pnpm build:android).
  webDir: 'dist',
  android: {
    // Moku talks to a remote Suwayomi server, commonly over plain http on a LAN. Allow cleartext.
    // (The manifest also sets usesCleartextTraffic; this covers the webview local server scheme.)
    allowMixedContent: true,
  },
  plugins: {
    // Route window.fetch through the native HTTP stack so requests to a remote Suwayomi server
    // are not subject to the webview's CORS / cleartext policy.
    CapacitorHttp: {
      enabled: true,
    },
  },
}

export default config
