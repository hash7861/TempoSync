import { useState } from 'react'
import { dropSyncStart } from '../audio/player'
import { useAudioPlayer } from '../audio/useAudioPlayer'
import { tracks } from '../data/tracks'

// Bare M1 test page: pick two clips, then try Cut / Crossfade / Crossfade-to-drop by ear.
export default function DevPlayerPage() {
  const { player, state } = useAudioPlayer()
  const [aId, setAId] = useState(tracks[0]?.id ?? '')
  const [bId, setBId] = useState(tracks[1]?.id ?? tracks[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const a = tracks.find((t) => t.id === aId)
  const b = tracks.find((t) => t.id === bId)

  const run = (fn: () => Promise<void> | void) => async () => {
    player.registerGesture()
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const select = (label: string, value: string, set: (v: string) => void) => (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <select className="rounded border p-2" value={value} onChange={(e) => set(e.target.value)}>
        {tracks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title} — {t.bpm} BPM{t.dropAtSec != null ? ` (drop ${t.dropAtSec}s)` : ''}
          </option>
        ))}
      </select>
    </label>
  )

  const btn = 'rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-40'

  if (tracks.length === 0) {
    return (
      <main className="mx-auto max-w-xl p-4">
        <h1 className="text-2xl font-bold">TempoSync — player dev page</h1>
        <p className="mt-2 text-sm">
          No tracks in <code>src/data/tracks.json</code>. See <code>src/data/TRACKS_TODO.md</code>.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">TempoSync — player dev page</h1>
      {select('Clip A', aId, setAId)}
      {select('Clip B', bId, setBId)}

      <div className="flex flex-wrap gap-2">
        <button className={btn} disabled={!a} onClick={run(() => a && player.play(a, 'cut'))}>
          Play A
        </button>
        <button className={btn} disabled={!b} onClick={run(() => b && player.play(b, 'cut'))}>
          Cut to B
        </button>
        <button className={btn} disabled={!b} onClick={run(() => b && player.play(b, 'crossfade'))}>
          Crossfade to B
        </button>
        <button
          className={btn}
          disabled={b?.dropAtSec == null}
          onClick={run(async () => {
            if (b?.dropAtSec == null) return
            await player.play(b, 'crossfade', dropSyncStart(b.dropAtSec, state.crossfadeSec))
          })}
        >
          Crossfade to drop
        </button>
        <button className={btn} onClick={run(() => (state.playing ? player.pause() : player.resume()))}>
          {state.playing ? 'Pause' : 'Resume'}
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Volume {Math.round(state.volume * 100)}%
        <input
          type="range" min={0} max={1} step={0.01} value={state.volume}
          onChange={(e) => player.setVolume(Number(e.target.value))}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Crossfade {state.crossfadeSec.toFixed(1)} s
        <input
          type="range" min={2} max={4} step={0.5} value={state.crossfadeSec}
          onChange={(e) => player.setCrossfadeSec(Number(e.target.value))}
        />
      </label>

      <p className="text-sm" role="status">
        Now playing: {state.trackId ?? '—'} · {state.playing ? 'playing' : 'stopped'}
        {state.fading ? ' · fading' : ''}
      </p>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </main>
  )
}
