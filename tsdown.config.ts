/**
 * Standalone build config for the dsh-dl-pulse plugin:
 * node-half lib/ (host routes + fs watcher) plus the browser bundle
 * lib/client.js (closure-factory artifact for the GUI's __ModuleLoader__).
 * The client entry is auto-detected at src/client/index.ts by the preset.
 */
import { clientBundle } from './build/tsdown.client.ts'

export default clientBundle('dsh-dl-pulse', ['src/index.ts'], {
  libExternal: [
    '@deepseek-ai/dsh-client-locale',
    '@deepseek-ai/dsh-client-runtime',
    '@deepseek-ai/dsh-client-ui-conversation',
    '@deepseek-ai/dsh-client-ui-slots',
    '@deepseek-ai/dsh-host-webserver',
    '@deepseek-ai/dsh-system-prompt',
  ],
})
