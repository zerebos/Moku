import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

// The Capacitor plugin packages must be bundled for the mobile (Capacitor) build so their JS
// bridges ship in the webview assets. For the desktop (Tauri) and web builds they are never
// exercised, so we keep them external to avoid pulling native-only code into those bundles.
const isCapacitor = process.env.MOKU_TARGET === 'capacitor'

export default defineConfig({
  plugins: [sveltekit()],
  clearScreen: false,
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'oxc' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      external: isCapacitor ? [] : [
        '@capacitor/filesystem',
        '@capacitor/app',
        '@capacitor/browser',
        'capacitor-native-biometric',
      ],
    },
  },
})