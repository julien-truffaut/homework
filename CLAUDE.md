# Notes for AI helpers

> **Resuming work? Read `PROGRESS.md` first**, then `DESIGN.md`.

## Where things live

- `src/config.ts` — the dials (sizes, pace, tables, school year). Try here first.
- `src/sprint.ts` — multiplication sprint rules. Pure, no DOM, randomness injected.
- `src/log.ts` — the history entry format + pure functions over it (runs, backup file).
- `src/store.ts` — IndexedDB storage of the log on the iPad.
- `src/main.ts` — screens and wiring.
- `public/sw.js` — offline support (network first, cache fallback).

## Conventions

- **The history log is permanent.** Entries are only ever added (`add`, never `put`). Never rename or remove a field in `log.ts`; add new optional fields or new entry types instead. Old backups must always read back.
- **Skill IDs are permanent.** Change the meaning of an exercise → bump `skillVersion`, don't reuse the ID.
- **Keep rules pure** and tested (`*.test.ts` next to the file). Deterministic rng in tests.
- **UI is French and read by a 9-year-old:** big, friendly, simple.
- **The deploy address must never change** (`base` in `vite.config.ts`): iPad data is tied to it.
- **Before declaring done:** `npm test` and `npm run build` pass. Use Node 22 (`~/.nvm/versions/node/v22.22.2/bin`).
- **Keep docs in sync:** README (run/deploy), DESIGN.md (design + decisions), PROGRESS.md (status), this file (conventions).
