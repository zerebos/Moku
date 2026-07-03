<script lang="ts">
  import { settingsState, updateSettings } from '$lib/state/settings.svelte'
  import { platformService } from '$lib/platform-service'

  const supportsServer  = platformService.isSupported('server-management')
  const supportsWindow  = platformService.isSupported('native-window')
  const supportsDiscord = platformService.isSupported('discord-rpc')

  import { selectPortal as _defaultPortal } from '$lib/core/ui/selectPortal'
  import type { Action } from 'svelte/action'

  interface Props {
    selectOpen:      string | null
    closingSelect:   string | null
    toggleSelect:    (id: string) => void
    registerTrigger: (id: string, el: HTMLElement) => void
    getTrigger:      (id: string) => HTMLElement | undefined
    selectPortal:    Action<HTMLElement, HTMLElement | undefined>
    anims:           boolean
  }
  let { selectOpen, closingSelect, toggleSelect, registerTrigger, getTrigger, selectPortal, anims }: Props = $props()

  let triggerIdleTimeout = $state<HTMLButtonElement>(null!)
  $effect(() => { if (triggerIdleTimeout) registerTrigger('idle-timeout', triggerIdleTimeout) })
  let serverAdvancedOpen = $state(false)

  async function pickServerBinary() {
    const path = await platformService.pickFolder()
    if (path) updateSettings({ serverBinary: path })
  }
</script>

<div class="s-panel">

  <div class="s-section">
    <p class="s-section-title">Interface Scale</p>
    <div class="s-section-body">
      <div class="s-slider-row">
        <input type="range" min={50} max={200} step={5}
          value={Math.round((settingsState.settings.uiZoom ?? 1.0) * 100)}
          oninput={(e) => updateSettings({ uiZoom: Number(e.currentTarget.value) / 100 })}
          class="s-slider" />
        <input type="number" min={50} max={200} step={1} class="s-slider-val"
          value={Math.round((settingsState.settings.uiZoom ?? 1.0) * 100)}
          oninput={(e) => { const n = parseInt(e.currentTarget.value, 10); if (!isNaN(n) && n >= 50 && n <= 200) updateSettings({ uiZoom: n / 100 }) }}
          onblur={(e) => { const n = parseInt(e.currentTarget.value, 10); if (isNaN(n) || n < 50) { updateSettings({ uiZoom: 0.5 }); e.currentTarget.value = '50' } else if (n > 200) { updateSettings({ uiZoom: 2.0 }); e.currentTarget.value = '200' } }}
        />
        <span class="s-slider-unit">%</span>
        <button class="s-btn-icon" onclick={() => updateSettings({ uiZoom: 1.0 })} disabled={(settingsState.settings.uiZoom ?? 1.0) === 1.0} title="Reset to 100%">↺</button>
      </div>
      <div class="s-presets">
        {#each [50,60,70,80,90,100,110,125,150,175,200] as v}
          <button class="s-preset" class:active={Math.round((settingsState.settings.uiZoom ?? 1.0) * 100) === v} onclick={() => updateSettings({ uiZoom: v / 100 })}>{v}%</button>
        {/each}
      </div>
    </div>
  </div>

  <div class="s-section">
    <p class="s-section-title">Server</p>
    <div class="s-section-body">
      <div class="s-row">
        <div class="s-row-info">
          <span class="s-label">Server URL</span>
          <span class="s-desc">Base URL of your Suwayomi instance</span>
        </div>
        <div class="srv-url-group">
          <input class="s-input" value={settingsState.settings.serverUrl ?? 'http://localhost:4567'}
            oninput={(e) => updateSettings({ serverUrl: e.currentTarget.value })}
            placeholder="http://localhost:4567" spellcheck="false" />
          {#if supportsServer}
          <button class="srv-adv-btn" class:open={serverAdvancedOpen}
            onclick={() => serverAdvancedOpen = !serverAdvancedOpen}
            title="Server launch options" aria-expanded={serverAdvancedOpen}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          {/if}
        </div>
      </div>

      {#if supportsServer}
      <label class="s-row">
        <div class="s-row-info"><span class="s-label">Auto-start server</span><span class="s-desc">Launch tachidesk-server when Moku opens</span></div>
        <button role="switch" aria-checked={settingsState.settings.autoStartServer} aria-label="Auto-start server"
          class="s-toggle" class:on={settingsState.settings.autoStartServer}
          onclick={() => updateSettings({ autoStartServer: !settingsState.settings.autoStartServer })}>
          <span class="s-toggle-thumb"></span>
        </button>
      </label>

      <label class="s-row">
        <div class="s-row-info"><span class="s-label">Suwayomi Web UI</span><span class="s-desc">Enable the built-in Suwayomi web interface alongside Moku</span></div>
        <button role="switch" aria-checked={settingsState.settings.suwayomiWebUI ?? false} aria-label="Suwayomi Web UI"
          class="s-toggle" class:on={settingsState.settings.suwayomiWebUI ?? false}
          onclick={() => updateSettings({ suwayomiWebUI: !(settingsState.settings.suwayomiWebUI ?? false) })}>
          <span class="s-toggle-thumb"></span>
        </button>
      </label>
      {/if}

      {#if serverAdvancedOpen && supportsServer}
        <div class="srv-adv-panel">
          <div class="srv-adv-row">
            <div class="s-row-info">
              <span class="s-label">Server binary</span>
              <span class="s-desc">Path to server executable — leave blank to use bundled</span>
            </div>
            <div class="srv-file-group">
              <input class="s-input srv-path-input" value={settingsState.settings.serverBinary ?? ''}
                oninput={(e) => updateSettings({ serverBinary: e.currentTarget.value })}
                placeholder="auto-detect" spellcheck="false" />
              <button class="srv-file-btn" onclick={pickServerBinary} title="Browse">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1.5 4.5h11v7a1 1 0 01-1 1h-9a1 1 0 01-1-1v-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                  <path d="M1.5 4.5l1.8-2.5h3.4l1.3 2.5" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  {#if supportsWindow}
  <div class="s-section">
    <p class="s-section-title">Window</p>
    <div class="s-section-body">
      <div class="s-row">
        <div class="s-row-info"><span class="s-label">Close button behavior</span><span class="s-desc">What happens when you click the X button</span></div>
        <div class="s-seg">
          {#each [['ask','Ask'],['tray','Tray'],['quit','Quit']] as [v, l]}
            <button class="s-seg-btn" class:active={(settingsState.settings.closeAction ?? 'ask') === v} onclick={() => updateSettings({ closeAction: v as 'ask' | 'tray' | 'quit' })}>{l}</button>
          {/each}
        </div>
      </div>
    </div>
  </div>
  {/if}

  <div class="s-section">
    <p class="s-section-title">Inactivity</p>
    <div class="s-section-body">
      <div class="s-row">
        <div class="s-row-info"><span class="s-label">Idle screen timeout</span><span class="s-desc">Show the Moku idle splash after this much inactivity</span></div>
        <div class="s-select">
          <button bind:this={triggerIdleTimeout} class="s-select-btn" onclick={() => toggleSelect('idle-timeout')}>
            <span>{{ '0':'Never','1':'1 minute','2':'2 minutes','5':'5 minutes','10':'10 minutes','15':'15 minutes','30':'30 minutes' }[String(settingsState.settings.idleTimeoutMin ?? 5)] ?? `${settingsState.settings.idleTimeoutMin} min`}</span>
            <svg class="s-select-caret" class:open={selectOpen === 'idle-timeout'} width="10" height="6" viewBox="0 0 10 6"><path d="M0 0l5 6 5-6" fill="currentColor"/></svg>
          </button>
          {#if selectOpen === 'idle-timeout' || closingSelect === 'idle-timeout'}
            <div use:selectPortal={getTrigger('idle-timeout')} class="s-select-menu" class:anims class:closing={closingSelect === 'idle-timeout'}>
              {#each [['0','Never'],['1','1 minute'],['2','2 minutes'],['5','5 minutes'],['10','10 minutes'],['15','15 minutes'],['30','30 minutes']] as [v, l]}
                <button class="s-select-option" class:active={String(settingsState.settings.idleTimeoutMin ?? 5) === v} onclick={() => { updateSettings({ idleTimeoutMin: Number(v) }); toggleSelect('idle-timeout') }}>{l}</button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  {#if supportsDiscord}
  <div class="s-section">
    <p class="s-section-title">Integrations</p>
    <div class="s-section-body">
      <label class="s-row">
        <div class="s-row-info"><span class="s-label">Discord Rich Presence</span><span class="s-desc">Show what you're reading in your Discord status</span></div>
        <button role="switch" aria-checked={settingsState.settings.discordRpc} aria-label="Discord Rich Presence" class="s-toggle" class:on={settingsState.settings.discordRpc} onclick={() => updateSettings({ discordRpc: !settingsState.settings.discordRpc })}><span class="s-toggle-thumb"></span></button>
      </label>
    </div>
  </div>
  {/if}

  <div class="s-section">
    <p class="s-section-title">Animations</p>
    <div class="s-section-body">
      <label class="s-row">
        <div class="s-row-info"><span class="s-label">QOL Animations</span><span class="s-desc">Hover lifts, active-tab transitions, and icon micro-animations</span></div>
        <button role="switch" aria-checked={settingsState.settings.qolAnimations ?? true} aria-label="QOL Animations" class="s-toggle" class:on={settingsState.settings.qolAnimations ?? true} onclick={() => updateSettings({ qolAnimations: !(settingsState.settings.qolAnimations ?? true) })}><span class="s-toggle-thumb"></span></button>
      </label>
    </div>
  </div>

  <div class="s-section">
    <p class="s-section-title">Language</p>
    <div class="s-section-body">
      <div class="s-row">
        <div class="s-row-info">
          <span class="s-label">Preferred source language</span>
          <span class="s-desc">Used to pre-select languages in Search and deduplicate sources</span>
        </div>
        <input class="s-input" style="width:72px;text-align:center;text-transform:uppercase"
          value={settingsState.settings.preferredExtensionLang ?? ''}
          oninput={(e) => updateSettings({ preferredExtensionLang: e.currentTarget.value.trim().toLowerCase() })}
          placeholder="en" spellcheck="false" />
      </div>
    </div>
  </div>

</div>

<style>
  .s-seg { display: flex; border: 1px solid var(--border-strong); border-radius: var(--radius-md); overflow: hidden; }
  .s-seg-btn { flex: 1; padding: var(--sp-1) var(--sp-3); font-family: var(--font-ui); font-size: var(--text-sm); color: var(--text-faint); background: transparent; cursor: pointer; transition: background var(--t-base), color var(--t-base); border: none; }
  .s-seg-btn:not(:last-child) { border-right: 1px solid var(--border-strong); }
  .s-seg-btn.active { background: var(--accent-muted); color: var(--accent-fg); }
  .s-seg-btn:not(.active):hover { background: var(--bg-raised); color: var(--text-secondary); }
  .srv-url-group { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .srv-adv-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0; border-radius: var(--radius-md); border: 1px solid var(--border-dim); background: var(--bg-surface); color: var(--text-faint); cursor: pointer; transition: background var(--t-base), color var(--t-base), border-color var(--t-base); }
  .srv-adv-btn:hover { background: var(--bg-overlay); color: var(--text-muted); border-color: var(--border-strong); }
  .srv-adv-btn.open { background: var(--bg-overlay); color: var(--text-secondary); border-color: var(--border-strong); }
  .srv-adv-btn svg { transition: transform var(--t-base); }
  .srv-adv-btn.open svg { transform: rotate(180deg); }
  .srv-adv-panel { border-top: 1px solid var(--border-dim); background: var(--bg-base); }
  .srv-adv-row { display: flex; align-items: center; justify-content: space-between; padding: 10px var(--sp-4); gap: var(--sp-4); }
  .srv-file-group { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .srv-path-input { width: 160px; }
  .srv-file-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0; border-radius: var(--radius-md); border: 1px solid var(--border-dim); background: var(--bg-surface); color: var(--text-faint); cursor: pointer; transition: background var(--t-base), color var(--t-base), border-color var(--t-base); }
  .srv-file-btn:hover { background: var(--bg-overlay); color: var(--text-muted); border-color: var(--border-strong); }
</style>