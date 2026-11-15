# Devoirs

iPad app for homework and maths practice. See `DESIGN.md` for the why, `PROGRESS.md` for where we are.

Live: https://julien-truffaut.github.io/homework/

## Run locally

Node 22.

```sh
npm install
npm run dev      # http://localhost:5173/homework/ — also reachable from the iPad on the home Wi-Fi (address printed by Vite)
npm test
npm run build    # typecheck + production build into dist/
```

Data saved while testing over the Wi-Fi address is separate from the live app's data.

## Deploy

Push to `main`. GitHub Actions (`.github/workflows/deploy.yml`) runs the tests, builds, and publishes to GitHub Pages.

## Install on the iPad

1. Open https://julien-truffaut.github.io/homework/ in **Safari**.
2. Share → **Add to Home Screen**.
3. Open it from the icon (full screen, works offline).

## Backup

Home screen → **Sauvegarder** → Save to Files → iCloud Drive. The file (`devoirs-sauvegarde-YYYY-MM-DD.jsonl`) has one history entry per line, readable without the app. The app reminds you after 7 days without a backup.

## Icons

`node scripts/make-icons.mjs` regenerates `public/icon-*.png`.
