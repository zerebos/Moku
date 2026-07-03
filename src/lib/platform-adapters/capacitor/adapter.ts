import type {
  PlatformAdapter, PlatformFeature, Platform,
  ServerLaunchConfig, DiscordPresence,
  AppUpdateInfo, StorageInfo, ReleaseInfo,
  UpdateProgress, MigrateProgress,
} from '$lib/platform-adapters/types'

export class CapacitorAdapter implements PlatformAdapter {
  readonly platform: Platform = 'capacitor'

  async init(): Promise<void> {}
  async destroy(): Promise<void> {}

  isSupported(feature: PlatformFeature): boolean {
    const supported: PlatformFeature[] = ['biometric-auth', 'filesystem']
    return supported.includes(feature)
  }

  async getAppDir(): Promise<string> {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const result = await Filesystem.getUri({ path: '', directory: Directory.Data })
    return result.uri
  }

  async loadStore(key: string): Promise<unknown> {
    try {
      const { Preferences } = await import('@capacitor/preferences')
      const { value } = await Preferences.get({ key: `moku:${key}` })
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  }

  async saveStore(key: string, value: unknown): Promise<void> {
    try {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key: `moku:${key}`, value: JSON.stringify(value) })
    } catch {}
  }

  async storeCredential(key: string, value: string): Promise<void> {
    const { NativeBiometric } = await import('capacitor-native-biometric')
    await NativeBiometric.setCredentials({ username: key, password: value, server: 'moku' })
  }

  async getCredential(key: string): Promise<string | null> {
    try {
      const { NativeBiometric } = await import('capacitor-native-biometric')
      const result = await NativeBiometric.getCredentials({ server: 'moku' })
      return result.username === key ? result.password : null
    } catch {
      return null
    }
  }

  async authenticateBiometric(): Promise<boolean> {
    try {
      const { NativeBiometric } = await import('capacitor-native-biometric')
      await NativeBiometric.verifyIdentity({ reason: 'Authenticate to access Moku', title: 'Biometric Auth' })
      return true
    } catch {
      return false
    }
  }

  async readFile(path: string): Promise<Uint8Array> {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const result = await Filesystem.readFile({ path, directory: Directory.Data })
    const binary = atob(result.data as string)
    const bytes  = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    await Filesystem.writeFile({
      path,
      data:      btoa(String.fromCharCode(...data)),
      directory: Directory.Data,
    })
  }

  async pickFolder(): Promise<string | null> { return null }
  async checkPathExists(_path: string): Promise<boolean> { return false }
  async createDirectory(_path: string): Promise<void> {}
  async openPath(_path: string): Promise<void> {}
  async getDefaultDownloadsPath(): Promise<string> { return '' }
  async getStorageInfo(_downloadsPath: string): Promise<StorageInfo> {
    return { manga_bytes: 0, total_bytes: 0, free_bytes: 0, path: '' }
  }
  async migrateDownloads(_src: string, _dst: string): Promise<void> {}
  async getAutoBackupDir(): Promise<string> { return '' }

  async fetchImage(url: string, headers: Record<string, string>): Promise<Blob> {
    // Images from a secured Suwayomi server (basic/UI login) must be fetched with the Authorization
    // header — a plain <img src> can't send one — and cross-origin to a remote host, so this must go
    // through the native HTTP stack (like the Tauri HTTP plugin does on desktop) to bypass the
    // webview's CORS + cleartext rules.
    //
    // We call CapacitorHttp directly rather than the patched window.fetch: the patched fetch is
    // unreliable for binary `.blob()` responses (it corrupts bytes round-tripping through base64),
    // which is exactly why authed images failed. Requesting responseType 'blob' returns the body as
    // base64 on native, which we decode into a real Blob ourselves.
    const { CapacitorHttp } = await import('@capacitor/core')
    const res = await CapacitorHttp.request({ url, method: 'GET', headers, responseType: 'blob' })
    if (res.status < 200 || res.status >= 300) throw new Error(`${res.status}`)

    const contentType =
      res.headers?.['content-type'] ?? res.headers?.['Content-Type'] ?? 'application/octet-stream'

    // On web the plugin may hand back a Blob directly; on native it's a base64 string.
    if (res.data instanceof Blob) return res.data

    const binary = atob(res.data as string)
    const bytes  = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: contentType })
  }

  async launchServer(_config: ServerLaunchConfig): Promise<void> {}
  async stopServer(): Promise<void> {}
  async getServerStatus(): Promise<'running' | 'stopped' | 'error'> { return 'stopped' }

  async setTitle(_title: string): Promise<void> {}
  async minimize(): Promise<void> {}
  async maximize(): Promise<void> {}
  async close(): Promise<void> {}
  async toggleFullscreen(): Promise<void> {}

  async setDiscordPresence(_presence: DiscordPresence): Promise<void> {}
  async clearDiscordPresence(): Promise<void> {}

  async getVersion(): Promise<string> {
    const { App } = await import('@capacitor/app')
    const info = await App.getInfo()
    return info.version
  }

  async openExternal(url: string): Promise<void> {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url })
  }

  async checkForAppUpdate(): Promise<AppUpdateInfo | null> { return null }
  async installAppUpdate(_tag: string): Promise<void> {}
  async restartApp(): Promise<void> {}
  async exitApp(): Promise<void> {}
  async listReleases(): Promise<ReleaseInfo[]> { return [] }

  async clearMokuCache(): Promise<void> {}
  async clearSuwayomiCache(): Promise<void> {}
  async resetSuwayomiData(): Promise<void> {}

  async onUpdateProgress(_cb: (p: UpdateProgress) => void): Promise<() => void> { return () => {} }
  async onUpdateLaunching(_cb: () => void): Promise<() => void> { return () => {} }
  async onMigrateProgress(_cb: (p: MigrateProgress) => void): Promise<() => void> { return () => {} }
}