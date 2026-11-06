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

## Progress log

### 06 November 2026
- Set up the project: Three.js (pinned r160) + Vite, built to work down to Chrome 109 (WebGL).
- Added the GitHub Actions workflow `build.yml`: every push to `main` builds the game and makes an `itch-game-zip` artifact, ready to upload straight to itch.io.
- Tried a GitHub Pages workflow, then removed it (itch.io only).
- Built the **Black Eye** title screen: dark 3D "eye" background, pulsing **ENTER** button (click or Enter key), fade to black, and audio unlock for later scenes.
- Added the empty UI layers (dialogue box, "Press E" prompt, HUD arrow, warning text, fade) and the game flags (`helpedDren`, `apologizedToDren`, `kidsFound`, `reachedConsole`, `openedCard`).
- Next: Scene 1 (The Execution) with movement, mouse look, NPCs and dialogue.
