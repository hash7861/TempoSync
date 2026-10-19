# Track catalog gaps

`tracks.json` is currently empty. Rules: no invented `dropAtSec`, no invented audio URLs, license recorded per track.

## Dev clips (blocked)
- [ ] 4-6 generated `public/audio/dev-*.mp3` beat loops (~90, 120, 150, 170 BPM, 60-90 s, with a volume/texture
  jump at a known second used as `dropAtSec`; `licenseNote: "generated test audio, not for demo"`).
  **Blocked: `ffmpeg` is not installed on the dev machine.** Install it (e.g. `winget install Gyan.FFmpeg`), then generate.

## Real demo catalog (needed before the event)
- [ ] 12-16 Creative Commons / royalty-free tracks (minimum 8), two genres, three energy bands.
- [ ] At least 4 high-energy tracks with a hand-tagged `dropAtSec` (listen and tag; do not guess).
- [ ] Source URL + license text for each track in `licenseNote`.
