/**
 * Locale strings for the dsh-dl-pulse surfaces (zh/en). The client registers
 * the dictionary through the locale service like the sibling plugins; the
 * visible progress line is data-only (numbers and universal symbols), so only
 * the tooltip carries copy.
 * @module dsh-dl-pulse/client/locales
 */

const zh = {
  'dl.tooltip': '下载中',
  'dl.rate': '速率',
} as const

const en = {
  'dl.tooltip': 'Downloading',
  'dl.rate': 'Rate',
} as const

export type DlPulseKey = keyof typeof zh

/** The dictionary namespace this plugin owns. */
export const NS = 'dsh-dl-pulse'

/** Dictionary table for the locale service (zh/en by the host locale). */
export const dictionaries: Record<'zh' | 'en', Record<DlPulseKey, string>> = { zh, en }
