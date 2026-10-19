import type { Track } from '../types/contracts'

export type PlayerTransition = 'cut' | 'crossfade'

export interface PlayerState {
  trackId: string | null
  playing: boolean
  fading: boolean
  volume: number
  crossfadeSec: number
}

export interface PlayerOptions {
  createAudio?: () => HTMLAudioElement
  crossfadeSec?: number
  volume?: number
}

const MIN_FADE_SEC = 2
const MAX_FADE_SEC = 4
const FADE_TICK_MS = 40

export const clampCrossfadeSec = (s: number) => Math.min(MAX_FADE_SEC, Math.max(MIN_FADE_SEC, s))

/** startAtSec for a drop-synced entry (MVP FR-11): the drop lands as the crossfade completes. */
export const dropSyncStart = (dropAtSec: number, crossfadeSec: number) =>
  Math.max(0, dropAtSec - crossfadeSec)

function waitForMetadata(el: HTMLAudioElement): Promise<void> {
  if (el.readyState >= 1) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const done = () => {
      el.removeEventListener('loadedmetadata', onOk)
      el.removeEventListener('error', onErr)
    }
    const onOk = () => (done(), resolve())
    const onErr = () => (done(), reject(new Error('audio failed to load')))
    el.addEventListener('loadedmetadata', onOk)
    el.addEventListener('error', onErr)
  })
}

function stopElement(el: HTMLAudioElement) {
  el.pause()
  el.volume = 0
  el.removeAttribute('src')
  el.load()
}

/**
 * Two-element audio player. `active` is the audible element; during a crossfade the other element
 * fades in and, when finished, `active` swaps and the outgoing element is fully stopped (no overlap).
 * Nothing plays until a user gesture has been registered.
 */
export class AudioPlayer {
  private a: HTMLAudioElement
  private b: HTMLAudioElement
  private active: HTMLAudioElement
  private queue: Track[] = []
  private current: Track | null = null
  private volume: number
  private crossfadeSec: number
  private fadeTimer: ReturnType<typeof setInterval> | null = null
  private finishFade: (() => void) | null = null
  private gesture = false
  private token = 0
  private listeners = new Set<() => void>()
  private snapshot: PlayerState
  private removeGestureListeners: () => void = () => {}

  constructor(opts: PlayerOptions = {}) {
    const create = opts.createAudio ?? (() => new Audio())
    this.a = create()
    this.b = create()
    this.active = this.a
    this.volume = opts.volume ?? 0.8
    this.crossfadeSec = clampCrossfadeSec(opts.crossfadeSec ?? 3)
    this.a.preload = this.b.preload = 'auto'
    this.snapshot = this.computeState()
    this.a.addEventListener('ended', this.onEnded)
    this.b.addEventListener('ended', this.onEnded)
    if (typeof document !== 'undefined') {
      const mark = () => this.registerGesture()
      const evts = ['pointerdown', 'keydown', 'touchstart'] as const
      evts.forEach((e) => document.addEventListener(e, mark, { passive: true }))
      this.removeGestureListeners = () => evts.forEach((e) => document.removeEventListener(e, mark))
    }
  }

  /** Call from a click/keypress handler. Document-level gesture listeners also call this. */
  registerGesture() {
    this.gesture = true
  }

  setQueue(tracks: Track[]) {
    this.queue = tracks
  }

  getState(): PlayerState {
    return this.snapshot
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  getPositionSec(): number {
    return this.active.currentTime
  }

  getCurrentTrack(): Track | null {
    return this.current
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v))
    if (!this.fadeTimer) this.active.volume = this.volume
    this.emit()
  }

  setCrossfadeSec(s: number) {
    this.crossfadeSec = clampCrossfadeSec(s)
    this.emit()
  }

  getCrossfadeSec() {
    return this.crossfadeSec
  }

  /**
   * Play `track`. With no current track the transition is irrelevant (plain start). A new request
   * during a fade completes the old fade first, so at most two elements are ever audible.
   */
  async play(track: Track, transition: PlayerTransition = 'cut', startAtSec = 0): Promise<void> {
    if (!this.gesture) throw new Error('Playback requires a user gesture first')
    this.completeFade()
    const token = ++this.token
    const crossfade = transition === 'crossfade' && this.current !== null && !this.active.paused
    const incoming = crossfade ? this.other() : this.active
    const outgoing = this.active

    if (!crossfade && outgoing.src) stopElement(outgoing)
    incoming.src = track.audioUrl
    incoming.load()
    await waitForMetadata(incoming)
    if (token !== this.token) return // superseded while loading
    incoming.currentTime = Math.min(startAtSec, Math.max(0, (incoming.duration || Infinity) - 0.5))
    incoming.volume = crossfade ? 0 : this.volume
    await incoming.play()
    if (token !== this.token) return

    this.current = track
    if (!crossfade) {
      this.active = incoming
      this.emit()
      return
    }
    this.runFade(outgoing, incoming)
  }

  /** Skip: hard cut to the next queued track (wraps). No-op unless there is somewhere else to go. */
  async skip(): Promise<void> {
    if (this.queue.length < 2) return
    const i = this.queue.findIndex((t) => t.id === this.current?.id)
    await this.play(this.queue[(i + 1) % this.queue.length], 'cut', 0)
  }

  pause() {
    this.completeFade()
    this.active.pause()
    this.emit()
  }

  async resume(): Promise<void> {
    if (!this.gesture) throw new Error('Playback requires a user gesture first')
    if (!this.current) return
    await this.active.play()
    this.emit()
  }

  dispose() {
    this.token++
    this.completeFade()
    this.removeGestureListeners()
    stopElement(this.a)
    stopElement(this.b)
    this.a.removeEventListener('ended', this.onEnded)
    this.b.removeEventListener('ended', this.onEnded)
    this.listeners.clear()
  }

  private other() {
    return this.active === this.a ? this.b : this.a
  }

  private onEnded = () => {
    this.emit()
  }

  private runFade(outgoing: HTMLAudioElement, incoming: HTMLAudioElement) {
    const durationMs = this.crossfadeSec * 1000
    const startedAt = performance.now()
    const finish = () => {
      if (this.fadeTimer) clearInterval(this.fadeTimer)
      this.fadeTimer = null
      this.finishFade = null
      stopElement(outgoing)
      incoming.volume = this.volume
      this.active = incoming
      this.emit()
    }
    this.finishFade = finish
    this.fadeTimer = setInterval(() => {
      const p = Math.min(1, (performance.now() - startedAt) / durationMs)
      // equal-power curve keeps perceived loudness steady through the fade
      incoming.volume = this.volume * Math.sin((p * Math.PI) / 2)
      outgoing.volume = this.volume * Math.cos((p * Math.PI) / 2)
      if (p >= 1) finish()
    }, FADE_TICK_MS)
    this.emit()
  }

  private completeFade() {
    this.finishFade?.()
  }

  private computeState(): PlayerState {
    return {
      trackId: this.current?.id ?? null,
      playing: !this.active.paused && this.current !== null,
      fading: this.fadeTimer !== null,
      volume: this.volume,
      crossfadeSec: this.crossfadeSec,
    }
  }

  private emit() {
    this.snapshot = this.computeState()
    this.listeners.forEach((fn) => fn())
  }
}
