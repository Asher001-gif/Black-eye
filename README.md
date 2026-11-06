# Arin (3D browser game)

Built with Three.js (pinned r160) + Vite. Targets WebGL, works down to Chrome 109.

## Run locally
    npm install
    npm run dev

## Build
    npm run build   # output in dist/

## Upload to itch.io (manual)
1. Push to `main`. Open the repo's Actions tab, then the latest "Build Game for Itch" run.
2. Download the `itch-game-zip` artifact and unzip it once (GitHub wraps it in a zip).
3. On itch.io, upload that zip, tick "This file will be played in the browser".
   `index.html` must be at the zip root.

