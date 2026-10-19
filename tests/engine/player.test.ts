import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioPlayer, clampCrossfadeSec, dropSyncStart } from '../../src/audio/player'
import type { Track } from '../../src/types/contracts'

class FakeAudio extends EventTarget {
  src = ''
  readyState = 4
  duration = 90
  currentTime = 0
  volume = 1
  paused = true
  preload = ''
  load() {}
  removeAttribute(name: string) {
    if (name === 'src') this.src = ''
  }
  pause() {
    this.paused = true
  }
  async play() {
    this.paused = false
  }
}

const track = (id: string, dropAtSec?: number): Track => ({
  id,
  title: id,
  artist: 'x',
  genre: 'test',
  bpm: 120,
  energy: 3,
  durationSec: 90,
  dropAtSec,
  audioUrl: `/audio/${id}.mp3`,
  licenseNote: 'test',
})

function make() {
  const els: FakeAudio[] = []
  const player = new AudioPlayer({
    createAudio: () => {
      const e = new FakeAudio()
      els.push(e)
      return e as unknown as HTMLAudioElement
    },
    crossfadeSec: 3,
    volume: 1,
  })
  return { player, els }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('helpers', () => {
  it('clamps crossfade to 2-4 s', () => {
    expect(clampCrossfadeSec(0.5)).toBe(2)
    expect(clampCrossfadeSec(3)).toBe(3)
    expect(clampCrossfadeSec(9)).toBe(4)
  })
  it('drop-sync start = max(0, drop - crossfade)', () => {
    expect(dropSyncStart(30, 3)).toBe(27)
    expect(dropSyncStart(1, 3)).toBe(0)
  })
})

describe('AudioPlayer', () => {
  it('refuses to play before a user gesture', async () => {
    const { player, els } = make()
    await expect(player.play(track('a'))).rejects.toThrow(/gesture/)
    expect(els.every((e) => e.paused)).toBe(true)
  })

  it('starts at startAtSec', async () => {
    const { player, els } = make()
    player.registerGesture()
    await player.play(track('a'), 'cut', 12)
    expect(els[0].currentTime).toBe(12)
    expect(els[0].paused).toBe(false)
  })

  it('hard cut replaces the track with a single audible element', async () => {
    const { player, els } = make()
    player.registerGesture()
    await player.play(track('a'))
    await player.play(track('b'), 'cut')
    expect(els.filter((e) => !e.paused)).toHaveLength(1)
    expect(player.getState().trackId).toBe('b')
  })

  it('crossfade overlaps, then fully stops the outgoing element', async () => {
    const { player, els } = make()
    player.registerGesture()
    await player.play(track('a'))
    await player.play(track('b'), 'crossfade', 27)
    expect(player.getState().fading).toBe(true)
    expect(els.filter((e) => !e.paused)).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(1500)
    expect(els[0].volume).toBeGreaterThan(0)
    await vi.advanceTimersByTimeAsync(1600)
    const [out, inc] = els
    expect(player.getState().fading).toBe(false)
    expect(out.paused).toBe(true)
    expect(out.src).toBe('')
    expect(out.volume).toBe(0)
    expect(inc.paused).toBe(false)
    expect(inc.volume).toBe(1)
    expect(inc.currentTime).toBeGreaterThanOrEqual(27)
    expect(els.filter((e) => !e.paused)).toHaveLength(1)
  })

  it('a new play during a fade completes the old fade first (no stacked overlap)', async () => {
    const { player, els } = make()
    player.registerGesture()
    await player.play(track('a'))
    await player.play(track('b'), 'crossfade')
    await vi.advanceTimersByTimeAsync(500)
    await player.play(track('c'), 'crossfade')
    await vi.advanceTimersByTimeAsync(3500)
    expect(els.filter((e) => !e.paused)).toHaveLength(1)
    expect(player.getState().trackId).toBe('c')
  })

  it('skip cuts to the next queued track and wraps', async () => {
    const { player } = make()
    player.registerGesture()
    player.setQueue([track('a'), track('b')])
    await player.play(track('a'))
    await player.skip()
    expect(player.getState().trackId).toBe('b')
    await player.skip()
    expect(player.getState().trackId).toBe('a')
  })

  it('pause finishes any fade and pauses', async () => {
    const { player, els } = make()
    player.registerGesture()
    await player.play(track('a'))
    await player.play(track('b'), 'crossfade')
    player.pause()
    expect(els.every((e) => e.paused)).toBe(true)
    expect(player.getState().playing).toBe(false)
  })
})
