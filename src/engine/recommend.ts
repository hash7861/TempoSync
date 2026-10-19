import type { Decision, RecommendRequest, Track } from '../types/contracts'

// Stub until Milestone 2. Pure: no React/DOM; `now` is passed in rather than read from a clock.
export function recommend(_req: RecommendRequest, _catalog: Track[], _now: number): Decision {
  return { action: 'keep', transition: 'none', reason: 'engine not implemented' }
}
