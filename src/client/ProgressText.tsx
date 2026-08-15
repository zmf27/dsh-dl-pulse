/**
 * Composer dock readout: subscribes to the host SSE stream
 * (/dsh-dl-pulse/events, event "progress") and renders one line of plain
 * text — name, percent, bytes, live rate — for every in-flight download.
 * Hidden while idle; reconnects are handled by the EventSource.
 * @module dsh-dl-pulse/client/ProgressText
 */

import { useEffect, useRef, useState, type ReactElement } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'

/** Composed props: the dock's runtime share + the locale `t` seat. */
export type DownloadProgressProps =
  PropsRuntime<'conversation.input.dock'>
  & PropsLocale<'dsh-dl-pulse'>

/** One live download pushed by the host. */
interface Download {
  name: string
  done: number
  total: number
}

/** Human-readable byte size. */
function fmtBytes(bytes: number): string {
  const gb = bytes / 1024 ** 3
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / 1024 ** 2
  if (mb >= 1) return `${mb.toFixed(0)} MB`
  const kb = bytes / 1024
  return `${kb.toFixed(0)} KB`
}

/**
 * The input-dock entry: pure text, no bar, updated the instant the host
 * pushes a change (real-time by construction, never a timer).
 * @param props - the composed dock entry props (t for the tooltip).
 */
export function ProgressText(props: DownloadProgressProps): ReactElement | null {
  const [downloads, setDownloads] = useState<Download[]>([])
  const last = useRef<Map<string, { time: number; done: number }>>(new Map())
  const speeds = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    const source = new EventSource('/dsh-dl-pulse/events')
    const onEvent = (raw: Event): void => {
      try {
        const data = JSON.parse((raw as MessageEvent).data as string) as {
          kind: string
          downloads: Download[]
        }
        if (data.kind !== 'progress' || !Array.isArray(data.downloads)) return
        const now = performance.now()
        const nextSpeeds = new Map<string, number>()
        for (const download of data.downloads) {
          const prev = last.current.get(download.name)
          if (prev !== undefined && download.done >= prev.done && now > prev.time) {
            const delta = download.done - prev.done
            const dt = (now - prev.time) / 1000
            if (dt > 0) nextSpeeds.set(download.name, delta / dt)
          }
          last.current.set(download.name, { time: now, done: download.done })
        }
        speeds.current = nextSpeeds
        setDownloads(data.downloads)
      } catch {
        // malformed push; ignore
      }
    }
    source.addEventListener('progress', onEvent)
    return () => {
      source.close()
    }
  }, [])

  if (downloads.length === 0) return null

  const text = downloads.map((download) => {
    const pct = download.total > 0 ? Math.round((download.done / download.total) * 100) : 0
    const rate = speeds.current.get(download.name)
    const rateText = rate !== undefined && rate > 0 ? ` · ${fmtBytes(rate)}/s` : ''
    return `${download.name} ${pct}% (${fmtBytes(download.done)}/${fmtBytes(download.total)}${rateText})`
  }).join('　')

  return (
    <span
      style={{
        fontSize: 12,
        color: 'var(--muted-foreground, #888)',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        padding: '0 8px',
      }}
      title={typeof props.t === 'function' ? `${props.t('dl.tooltip')}: ${text}` : text}
    >
      ↓ {text}
    </span>
  )
}
