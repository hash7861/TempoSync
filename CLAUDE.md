# TempoSync — agreed plan

Source of truth: `docs/TempoSync_MVP.pdf` and `docs/TempoSync_POC.pdf` (Rev. 2). The MVP doc wins on conflicts.
Extract text with `pdftotext -layout docs/<file>.pdf out.txt` if the PDF reader tool fails.

## Scope and tooling
- Frontend-only Vite + React + TypeScript + Tailwind v4, pnpm, Vitest. Solo project.
- No `server/` folder, no Playwright, no worktrees.
- Commands: `pnpm dev`, `pnpm test`, `pnpm typecheck`, `pnpm build`.

## Structure
```
src/types/contracts.ts     shared contracts, exactly per the spec (no added/renamed fields)
src/engine/                pure TS, no React/DOM, takes `now` as an argument
  recommend.ts scoring.ts desiredEnergy.ts hysteresis.ts dropSync.ts cooldown.ts
  workoutState.ts          pure reducer: (state, event, now) => state
src/signals/               paceSimulator, gpsPace — both behind one pace-event interface
src/audio/                 player.ts, useAudioPlayer.ts
src/state/                 Zustand store that calls the engine; profileStorage
src/screens/  src/components/
src/data/                  tracks.json + TRACKS_TODO.md
tests/fixtures  tests/engine  tests/e2e (manual scenarios)
```

## Rules
- Never invent `dropAtSec` or audio URLs for real tracks. Flag gaps in `src/data/TRACKS_TODO.md`.
- Keep the README "Built before / during HackOHI/O" sections current.
- Small commits; push after each milestone step.
- Do not implement Spotify integration. Do not claim BPM improves performance.

## Event split (HackOHI/O, Oct 24-25, 2026)
- Pre-event: scaffold, contracts, catalog, player (incl. crossfade + startAtSec), simulator, engine, tests.
- During event: workout screens, drop marker UI, Boost-to-drop polish, GPS.

## Milestones (MVP doc)
M1 scaffold + catalog + reliable playback · M2 state machine + recommendation rules + tests ·
M3 running and strength screens · M4 crossfade + drop-sync + accessibility · M5 GPS, rehearsal, deploy.
