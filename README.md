# Black Eye (3D browser game)

Built with Three.js (pinned r160) + Vite. Targets WebGL, works down to Chrome 109.

## Run locally
    npm install
    npm run dev

## Build
    npm run build   # output in dist/

## Progress log

### 06 November 2026
- Set up the project: Three.js (pinned r160) + Vite, built to work down to Chrome 109 (WebGL).
- Added the GitHub Actions workflow `build.yml`: every push to `main` builds the game and makes an `itch-game-zip` artifact, ready to upload straight to itch.io.
- Tried a GitHub Pages workflow, then removed it (itch.io only).
- Built the **Black Eye** title screen: dark 3D "eye" background, pulsing **ENTER** button (click or Enter key), fade to black, and audio unlock for later scenes.
- Added the empty UI layers (dialogue box, "Press E" prompt, HUD arrow, warning text, fade) and the game flags (`helpedDren`, `apologizedToDren`, `kidsFound`, `reachedConsole`, `openedCard`).
- Next: Scene 1 (The Execution) with movement, mouse look, NPCs and dialogue.

### 06 November 2026 (later)
- Built **Scene 1, part 1: The Execution** (Earth, Maliana), set in a futuristic city: lit skyline, holographic MALIANA banner, flying cars, a stage and a crowd of about 90 humans.
- Cutscene: the crowd laughs at the old pioneer (Roy's father), Gathen steps up, strikes him down with an energy blade (sparks, flash, parts fall apart, no gore), then laughs: "You got a body, doesn't mean you can match us!" and the crowd laughs with him.
- Subtitles: small text at bottom centre, one line at a time, coloured character name (Gathen is yellow) with white dialogue.
- Voice via the browser's built-in speech (V toggles it, Space skips a line) and simple generated sound effects (city hum, crowd, charge, zap).
- All models are placeholder boxes and capsules, to be swapped for real models later. R replays the scene.
- Next: walking control, the 3-4 NPC conversations, and the push on Dren.

### 06 November 2026 (update)
- Scene 1 now opens on a black screen with a "20 YEARS AGO..." card, then fades into Maliana.
- At the end the screen closes to black and shows two prompts: **R** to replay and **E** for the next scene (Scene 2 is a "coming soon" placeholder for now).

### 07 November 2026
- Gathen is now the real **Fedreck Gathen** model (`src/assets/gathen.fbx`, Mixamo skeleton, textured) instead of the box placeholder. Loaded by `src/characters/gathen.js`; the scene waits for it before the cutscene starts.
- His file only has a one-frame T-pose, so his movement is done in code by posing bones (`setPose`, angles in degrees, documented at the top of `gathen.js`). No animation clip needed.
- New Gathen movement in Scene 1: stands with his sword in hand, winds up (sword over the shoulder, torso twists back, left arm out for balance), then chops down through the old robot with a body twist, forward lunge and head follow-through. Fingers close around the grip. The laugh now tilts his head back and shakes his shoulders.
- Added a sword (grip, gold guard, steel blade) attached to his right hand bone. The blade core glows during the charge and the strike, like the old energy blade.
- The strike keeps the same timing as before (charge 0.9s, hold 0.5s, chop 0.26s), so the hit, sparks, shake and robot break still line up.
- Poses live as `IDLE`, `RAISE` and `SLASH` in `scene1.js`: tweak the numbers there to change his stance or swing.
