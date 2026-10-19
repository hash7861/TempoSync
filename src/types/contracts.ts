// Shared contracts. Source of truth: docs/TempoSync_MVP.pdf ("Core entities", "Minimal API contract")
// and docs/TempoSync_POC.pdf ("Architecture and data contracts"). Field names are fixed by the spec;
// where the spec names a field without a type, the narrowest reasonable type is chosen here.

export type Activity = 'running' | 'strength'

export type Energy = 1 | 2 | 3 | 4 | 5

export interface Track {
  id: string
  title: string
  artist: string
  genre: string
  bpm: number
  energy: Energy
  durationSec: number
  dropAtSec?: number
  audioUrl: string
  licenseNote: string
}

export interface Profile {
  id: string
  preferencesByActivity: Record<Activity, string[]> // preferred genres per activity
  seedArtists: string[]
  seedTracks: string[]
  intensity: 'low' | 'medium' | 'high'
}

export interface WorkoutPlan {
  activity: Activity
  goal: string
  targetPace?: number // min/mile (larger number = slower)
  exercises?: { name: string; sets: number }[]
  restSec?: number
}

export interface WorkoutState {
  status: 'idle' | 'active' | 'rest' | 'paused'
  paceSource: 'simulated' | 'gps'
  exerciseIndex?: number
  setIndex?: number
  currentPace?: number // min/mile
  exertionFlag?: boolean
  driftSince?: number // ms timestamp when sustained drift began
  lastSwitchAt: number // ms timestamp
}

export interface WorkoutEvent {
  type:
    | 'pace'
    | 'exertion'
    | 'set_start'
    | 'set_complete'
    | 'next_exercise'
    | 'boost'
    | 'calm'
    | 'skip'
    | 'keep'
    | 'pause'
    | 'resume'
  at: number // ms timestamp
  payload: Record<string, unknown>
}

export interface Decision {
  action: 'keep' | 'switch'
  trackId?: string
  transition: 'cut' | 'crossfade' | 'none'
  startAtSec?: number
  reason: string
  confidence?: number
}

// POST /api/recommend input; the engine's recommend() takes the same shape.
export interface RecommendRequest {
  profile: Profile
  plan: WorkoutPlan
  workoutState: WorkoutState
  event: WorkoutEvent
  currentTrackId: string | null
  recentTrackIds: string[]
}
