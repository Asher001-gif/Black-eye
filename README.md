# Black Eye (3D browser game)

Built with Three.js (pinned r160) + Vite. Targets WebGL, works down to Chrome 109.

## Run locally
    npm install
    npm run dev

## Build
    npm run build   # output in dist/

## Upload to itch.io (manual)
1. Push to `main`. Open the repo's Actions tab, then the latest "Build Game for Itch" run.
2. Download the `itch-game-zip` artifact. GitHub already zips it with `index.html` at the root.
3. Upload that file directly to itch.io (no unzipping) and tick "This file will be played in the browser".
