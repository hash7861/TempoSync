import { describe, expect, it } from 'vitest'
import { recommend } from '../../src/engine/recommend'
import type { RecommendRequest } from '../../src/types/contracts'

const req: RecommendRequest = {
  profile: {
    id: 'p1',
    preferencesByActivity: { running: ['lo-fi'], strength: ['hip-hop'] },
    seedArtists: [],
    seedTracks: [],
    intensity: 'medium',
  },
  plan: { activity: 'running', goal: 'steady run', targetPace: 10 },
  workoutState: { status: 'active', paceSource: 'simulated', lastSwitchAt: 0 },
  event: { type: 'pace', at: 0, payload: {} },
  currentTrackId: null,
  recentTrackIds: [],
}

describe('recommend (M1 stub)', () => {
  it('keeps the current track', () => {
    expect(recommend(req, [], 0)).toEqual({
      action: 'keep',
      transition: 'none',
      reason: 'engine not implemented',
    })
  })
})
