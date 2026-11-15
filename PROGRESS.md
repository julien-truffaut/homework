# Progress

## Status (2026-11-15)

**v0.3: multiplication sprint**, live at https://julien-truffaut.github.io/homework/
- Essai / Pour de vrai, 25 · 50 · 100 questions (1 · 2 · 4 min), tables 0–10 (+12 option)
- Facile / Difficile switch with set proportions per level (très facile ×0/×10 kept rare); level recorded per question
- History screen with Pour de vrai / Essais tabs, per-answer detail
- Every answer recorded on the iPad; Sauvegarder → JSONL backup; 7-day reminder
- Installs to the home screen, works offline

## Next

- Julien tries it with his son on the iPad; adjust from what they find.
- Not built yet: restore from a backup file, parent screen, skill tracker, written calculations (opérations posées), Padlet checklist, points.

## Decisions log

- 2026-11-15 Process over final answer for written calculations; speed drills judged on score only.
- 2026-11-15 Every exercise has a trial mode (recorded, marked, never counted).
- 2026-11-15 Storage v1: iPad only + JSONL backup file; sync server later (home or hosted).
- 2026-11-15 Hosting: GitHub Pages, public repo, address julien-truffaut.github.io/homework (must not change).
- 2026-11-15 Difficulty: fixed general levels (F/M/D grid in DESIGN.md) + Facile/Difficile switch; personal difficulty from his data later.
- 2026-11-15 ×0 and ×10 split out as "très facile" and kept rare (10% Facile, 5% Difficile).
- Deferred until v1 works: points/rewards, session length.
