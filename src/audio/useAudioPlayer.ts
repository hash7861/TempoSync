import { useEffect, useRef, useSyncExternalStore } from 'react'
import { AudioPlayer } from './player'

export function useAudioPlayer() {
  const ref = useRef<AudioPlayer | null>(null)
  ref.current ??= new AudioPlayer()
  const player = ref.current

  useEffect(() => () => player.dispose(), [player])

  const state = useSyncExternalStore(
    (fn) => player.subscribe(fn),
    () => player.getState(),
  )
  return { player, state }
}
