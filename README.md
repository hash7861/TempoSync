# TempoSync

Activity-aware adaptive fitness DJ: a deterministic, explainable rule engine picks and
transitions between authorized tracks as workout state changes, landing boosts on a song's drop.
Specs live in [`docs/`](docs/) (`TempoSync_POC.pdf`, `TempoSync_MVP.pdf`, Rev. 2).

> Status: Milestone 1 in progress (scaffold, contracts, dev audio, player test page).

## Run locally

```
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # Vitest (engine rules)
pnpm typecheck
pnpm build
```

Stack: React 19, TypeScript, Vite, Tailwind v4, Zustand, Vitest. Frontend-only; the engine
stays pure TypeScript behind typed contracts so it can move behind an API later.

Windows note: `@rolldown/binding-win32-x64-msvc` is pinned as a devDependency because pnpm
skipped rolldown's optional native binding on the dev machine. Safe to drop on other platforms.

## Built before HackOHI/O (Oct 24-25, 2026)

Pre-event work, tracked here per the event's transparency rules. Commit history is intact.

- [x] Repo baseline, specs
- [x] Vite/React/TS/Tailwind/Vitest scaffold (pnpm)
- [x] CLAUDE.md (agreed plan)
- [x] Shared contracts (`src/types/contracts.ts`) and `recommend()` stub
- [x] Audio player: two elements, cut, 2-4 s crossfade, `startAtSec`, gesture-gated (unit-tested)
- [x] Dev player test page (Cut / Crossfade / Crossfade to drop)
- [ ] Generated dev clips + `dropAtSec` tags: **blocked, `ffmpeg` not installed** (see `src/data/TRACKS_TODO.md`)
- [ ] Real 12-16 track catalog with hand-tagged drops

## Built during HackOHI/O

_Nothing yet._ Planned event work: workout screens, drop marker UI, Boost-to-drop polish, GPS pace.
