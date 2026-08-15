/**
 * Smoke tests for the host-half scan logic (pure, no plugin boot required).
 * The protocol contract: "<done> <total>" bytes per .progress file, atomic
 * writes via rename, delete marks completion.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { scanDir } from '../src/index.ts'

const dirs: string[] = []
function makeDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'dlpulse-'))
  dirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of dirs) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      // best effort
    }
  }
  dirs.length = 0
})

describe('scanDir', () => {
  it('parses valid progress files, sorted by name', () => {
    const dir = makeDir()
    writeFileSync(join(dir, 'b.progress'), '20 100')
    writeFileSync(join(dir, 'a.progress'), '50 200')
    expect(scanDir(dir)).toEqual([
      { name: 'a', done: 50, total: 200 },
      { name: 'b', done: 20, total: 100 },
    ])
  })

  it('ignores non-progress files, malformed content, and zero totals', () => {
    const dir = makeDir()
    writeFileSync(join(dir, 'readme.txt'), '1 2')
    writeFileSync(join(dir, 'bad.progress'), 'not numbers')
    writeFileSync(join(dir, 'zero.progress'), '0 0')
    writeFileSync(join(dir, 'ok.progress'), '10 50')
    expect(scanDir(dir)).toEqual([{ name: 'ok', done: 10, total: 50 }])
  })

  it('clamps negative done to zero (transient race values never flicker)', () => {
    const dir = makeDir()
    writeFileSync(join(dir, 'x.progress'), '-3 10')
    expect(scanDir(dir)).toEqual([{ name: 'x', done: 0, total: 10 }])
  })

  it('returns an empty list for a missing directory', () => {
    expect(scanDir(join(tmpdir(), 'dlpulse-missing-' + Date.now()))).toEqual([])
  })
})
