// Shared RustDesk client option definitions, used by both Strategies and Custom Clients pages.

export type OptionType = 'toggle' | 'select' | 'text'

export interface OptionDef {
  key: string
  type: OptionType
  choices?: string[]
  defaultVal?: string // default value for toggle: 'Y' or 'N'
}

export interface OptionSection {
  titleKey: string
  options: OptionDef[]
}

// Defaults follow RustDesk client option2bool() logic:
//   enable-* -> default Y    allow-* -> default N
//   hide-*   -> default N    disable-* -> default N
const Y = 'Y'
const N = 'N'

// These sections are shared between strategies and custom client pages.
export const STRATEGY_SECTIONS: OptionSection[] = [
  {
    titleKey: 'strategies.section_access_control',
    options: [
      { key: 'enable-keyboard', type: 'toggle', defaultVal: Y },
      { key: 'enable-clipboard', type: 'toggle', defaultVal: Y },
      { key: 'enable-file-transfer', type: 'toggle', defaultVal: Y },
      { key: 'enable-file-copy-paste', type: 'toggle', defaultVal: Y },
      { key: 'enable-camera', type: 'toggle', defaultVal: Y },
      { key: 'enable-terminal', type: 'toggle', defaultVal: Y },
      { key: 'enable-remote-printer', type: 'toggle', defaultVal: Y },
      { key: 'enable-audio', type: 'toggle', defaultVal: Y },
      { key: 'enable-tunnel', type: 'toggle', defaultVal: Y },
      { key: 'enable-remote-restart', type: 'toggle', defaultVal: Y },
      { key: 'enable-record-session', type: 'toggle', defaultVal: Y },
      { key: 'enable-block-input', type: 'toggle', defaultVal: Y },
    ],
  },
  {
    titleKey: 'strategies.section_security',
    options: [
      { key: 'access-mode', type: 'select', choices: ['custom', 'full', 'view'] },
      { key: 'approve-mode', type: 'select', choices: ['password', 'click', 'password-click'] },
      {
        key: 'verify-method',
        type: 'select',
        choices: ['use-temporary-password', 'use-permanent-password', 'use-both-passwords'],
      },
      { key: 'temporary-password-length', type: 'text' },
      { key: 'whitelist', type: 'text' },
      { key: 'allow-remote-config-modification', type: 'toggle', defaultVal: N },
    ],
  },
  {
    titleKey: 'strategies.section_network',
    options: [
      { key: 'custom-rendezvous-server', type: 'text' },
      { key: 'api-server', type: 'text' },
      { key: 'relay-server', type: 'text' },
      { key: 'key', type: 'text' },
      { key: 'ice-servers', type: 'text' },
      { key: 'enable-lan-discovery', type: 'toggle', defaultVal: Y },
      { key: 'direct-server', type: 'toggle', defaultVal: N },
      { key: 'direct-access-port', type: 'text' },
      { key: 'disable-udp', type: 'toggle', defaultVal: N },
      { key: 'allow-websocket', type: 'toggle', defaultVal: N },
      { key: 'allow-insecure-tls-fallback', type: 'toggle', defaultVal: N },
    ],
  },
  {
    titleKey: 'strategies.section_connection',
    options: [
      { key: 'allow-auto-disconnect', type: 'toggle', defaultVal: N },
      { key: 'auto-disconnect-timeout', type: 'text' },
      { key: 'allow-only-conn-window-open', type: 'toggle', defaultVal: N },
      { key: 'allow-auto-record-incoming', type: 'toggle', defaultVal: N },
      { key: 'enable-abr', type: 'toggle', defaultVal: Y },
      { key: 'allow-remove-wallpaper', type: 'toggle', defaultVal: N },
      { key: 'allow-always-software-render', type: 'toggle', defaultVal: N },
      { key: 'allow-linux-headless', type: 'toggle', defaultVal: N },
      { key: 'enable-hwcodec', type: 'toggle', defaultVal: Y },
      { key: 'enable-directx-capture', type: 'toggle', defaultVal: Y },
      { key: 'keep-awake-during-incoming-sessions', type: 'toggle', defaultVal: N },
    ],
  },
  {
    titleKey: 'strategies.section_presets',
    options: [
      { key: 'preset-address-book-name', type: 'text' },
      { key: 'preset-address-book-tag', type: 'text' },
      { key: 'preset-address-book-alias', type: 'text' },
      { key: 'preset-address-book-password', type: 'text' },
      { key: 'preset-address-book-note', type: 'text' },
      { key: 'preset-device-username', type: 'text' },
      { key: 'preset-device-name', type: 'text' },
    ],
  },
  {
    titleKey: 'strategies.section_proxy',
    options: [
      { key: 'proxy-url', type: 'text' },
      { key: 'proxy-username', type: 'text' },
      { key: 'proxy-password', type: 'text' },
    ],
  },
  {
    titleKey: 'strategies.section_ui',
    options: [
      { key: 'hide-security-settings', type: 'toggle', defaultVal: N },
      { key: 'hide-network-settings', type: 'toggle', defaultVal: N },
      { key: 'hide-server-settings', type: 'toggle', defaultVal: N },
      { key: 'hide-proxy-settings', type: 'toggle', defaultVal: N },
      { key: 'hide-remote-printer-settings', type: 'toggle', defaultVal: N },
      { key: 'hide-websocket-settings', type: 'toggle', defaultVal: N },
      { key: 'hide-stop-service', type: 'toggle', defaultVal: N },
    ],
  },
  {
    titleKey: 'strategies.section_builtin',
    options: [
      { key: 'preset-device-group-name', type: 'text' },
      { key: 'preset-user-name', type: 'text' },
      { key: 'preset-strategy-name', type: 'text' },
      { key: 'default-connect-password', type: 'text' },
      { key: 'disable-change-permanent-password', type: 'toggle', defaultVal: N },
      { key: 'disable-change-id', type: 'toggle', defaultVal: N },
      { key: 'disable-unlock-pin', type: 'toggle', defaultVal: N },
      { key: 'one-way-clipboard-redirection', type: 'toggle', defaultVal: N },
      { key: 'one-way-file-transfer', type: 'toggle', defaultVal: N },
      { key: 'display-name', type: 'text' },
      { key: 'avatar', type: 'text' },
      { key: 'remove-preset-password-warning', type: 'toggle', defaultVal: N },
    ],
  },
  {
    titleKey: 'strategies.section_other',
    options: [
      { key: 'allow-numeric-one-time-password', type: 'toggle', defaultVal: N },
      { key: 'allow-auto-update', type: 'toggle', defaultVal: N },
    ],
  },
]

// Additional sections for Custom Client that are not in strategies
export const CUSTOM_CLIENT_EXTRA_SECTIONS: OptionSection[] = [
  {
    titleKey: 'custom_clients.section_display',
    options: [
      { key: 'view-only', type: 'toggle', defaultVal: N },
      { key: 'show-remote-cursor', type: 'toggle', defaultVal: N },
      { key: 'show-monitors-toolbar', type: 'toggle', defaultVal: N },
      { key: 'collapse-toolbar', type: 'toggle', defaultVal: N },
      { key: 'show-quality-monitor', type: 'toggle', defaultVal: N },
      { key: 'follow-remote-cursor', type: 'toggle', defaultVal: N },
      { key: 'follow-remote-window', type: 'toggle', defaultVal: N },
      {
        key: 'view-style',
        type: 'select',
        choices: ['original', 'adaptive'],
      },
      {
        key: 'image-quality',
        type: 'select',
        choices: ['best', 'balanced', 'low', 'custom'],
      },
      { key: 'custom-image-quality', type: 'text' },
      { key: 'custom-fps', type: 'text' },
      {
        key: 'codec-preference',
        type: 'select',
        choices: ['auto', 'vp8', 'vp9', 'av1', 'h264', 'h265'],
      },
      {
        key: 'scroll-style',
        type: 'select',
        choices: ['scrollauto', 'scrollbar', 'scrolledge'],
      },
      { key: 'disable-audio', type: 'toggle', defaultVal: N },
      { key: 'disable-clipboard', type: 'toggle', defaultVal: N },
      { key: 'lock-after-session-end', type: 'toggle', defaultVal: N },
      { key: 'privacy-mode', type: 'toggle', defaultVal: N },
      { key: 'reverse-mouse-wheel', type: 'toggle', defaultVal: N },
      { key: 'swap-left-right-mouse', type: 'toggle', defaultVal: N },
      { key: 'zoom-cursor', type: 'toggle', defaultVal: N },
      { key: 'i444', type: 'toggle', defaultVal: N },
    ],
  },
  {
    titleKey: 'custom_clients.section_local',
    options: [
      { key: 'theme', type: 'select', choices: ['dark', 'light', 'system'] },
      { key: 'lang', type: 'text' },
      { key: 'allow-auto-record-outgoing', type: 'toggle', defaultVal: N },
      { key: 'video-save-directory', type: 'text' },
      { key: 'enable-confirm-closing-tabs', type: 'toggle', defaultVal: Y },
      { key: 'enable-open-new-connections-in-tabs', type: 'toggle', defaultVal: Y },
      {
        key: 'peer-card-ui-type',
        type: 'select',
        choices: ['0', '1', '2'],
      },
      {
        key: 'peer-sorting',
        type: 'select',
        choices: ['Remote ID', 'Remote Host', 'Username'],
      },
      { key: 'sync-ab-with-recent-sessions', type: 'toggle', defaultVal: N },
      { key: 'filter-ab-by-intersection', type: 'toggle', defaultVal: N },
      { key: 'enable-udp-punch', type: 'toggle', defaultVal: Y },
      { key: 'enable-ipv6-punch', type: 'toggle', defaultVal: Y },
    ],
  },
  {
    titleKey: 'custom_clients.section_android',
    options: [
      { key: 'disable-floating-window', type: 'toggle', defaultVal: N },
      { key: 'floating-window-size', type: 'text' },
      { key: 'floating-window-untouchable', type: 'toggle', defaultVal: N },
      { key: 'floating-window-transparency', type: 'text' },
      { key: 'floating-window-svg', type: 'text' },
      {
        key: 'keep-screen-on',
        type: 'select',
        choices: ['never', 'during-controlled', 'service-on'],
      },
      { key: 'enable-android-software-encoding-half-scale', type: 'toggle', defaultVal: Y },
    ],
  },
]

// All sections combined for custom client
export const ALL_CUSTOM_CLIENT_SECTIONS: OptionSection[] = [
  ...STRATEGY_SECTIONS,
  ...CUSTOM_CLIENT_EXTRA_SECTIONS,
]

// Build default config from toggle options
export function getDefaultConfig(sections: OptionSection[]): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const section of sections) {
    for (const opt of section.options) {
      if (opt.type === 'toggle' && opt.defaultVal) {
        defaults[opt.key] = opt.defaultVal
      }
    }
  }
  return defaults
}

export function configToState(
  config: Record<string, string> | undefined,
  sections: OptionSection[],
): Record<string, string> {
  const defaults = getDefaultConfig(sections)
  return { ...defaults, ...(config || {}) }
}

export function stateToConfig(state: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(state)) {
    if (v !== '') result[k] = v
  }
  return result
}
