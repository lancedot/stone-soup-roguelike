Original prompt: Transform https://github.com/lancedot/stone-soup-roguelike into a small bread-squad roguelike, keeping the existing web stack if feasible, with four joke-inspired classes, balanced skills/items, simple funny main story, visible instructions, item descriptions, small package size, and lightweight generated art.

## Progress

- Cloned `lancedot/stone-soup-roguelike` into the workspace.
- Confirmed existing stack is Vite + React + Node test runner with a small custom roguelike engine and SVG asset generator.
- Starting with RED tests for the four-character bread-squad theme, item descriptions, and final boss victory.
- Confirmed RED with `node --test tests/*.test.js`; failures were old five-class data, old UI text, and old boss win condition.
- Replaced core data, skill dispatch, UI copy, side instructions, item descriptions, and generated SVG sprite definitions for the bread-squad theme.
- Verified `node --test tests/*.test.js`, Vite production build, single-file HTML generation, and Playwright browser smoke screenshots.
- Browser smoke found and fixed an important keyboard bug: pressing Space to wait was also scrolling the page.
- Added RED/GREEN coverage for loot balance, non-free skill attempts, and four-direction sprite sheet metadata.
- Reduced scroll economy: one scroll max per floor, ham slice only appears from depth 3, weapon/heal values tightened.
- Added runtime support for 4x4 animated sprite sheets and documented the Sprite Pipeline handoff in `docs/art/sprite-pipeline.md`.
- Corrected skill turn rule per user clarification: only successful skills consume a turn; failed/no-target/cooldown attempts do not move enemies.
- Added per-class rough hand-drawn victory CG assets, skill FX sheets, and UI rendering for class sheet previews plus win overlay art.
- Replaced the runtime asset manifest with generated PNG sprite sheets/static PNGs via `scripts/generate-png-assets.py`; `node scripts/generate-assets.mjs` now delegates to that Pillow pipeline.
- Rebuilt and smoke-tested the PNG animation asset version; single-file export now inlines PNG data URLs and contains no `/assets/` paths.
- Continued handoff after img2 raw assets were completed: reran `node scripts/generate-assets.mjs`, regenerated all runtime PNG sheets/static PNGs from `art_sources/img2/`, rebuilt Vite, regenerated `bread-squad-single.html` and root `index.html`, and visually smoke-tested the single-file build with the web-game Playwright client.
- Verification notes: `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" test` passed 23/23; `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build` passed; `node scripts\make-single-html.mjs` produced a 1680.6 KB single-file export.
- Screenshot checks: menu class previews are visible in `output/img2-menu-smoke/shot-0.png`; gameplay sprites, tiles, items, and enemies are visible in `output/img2-smoke-file/shot-2.png`.
- Environment gotcha: the plain `npm` shim points at a missing `C:\Users\Administrator\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js`; use `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" ...` on this machine.
- Generated a new formal img2 terrain atlas at `art_sources/img2/terrain_variants_img2_raw.png`, then sliced it into four runtime PNG variants each for floor, wall, and stairs.
- Runtime terrain rendering now chooses tile variants by a stable coordinate hash, so maps look less repetitive without changing map generation, collision, or gameplay seeds.
- Increased `TILE_SIZE` from 32 to 36 for clearer high-resolution assets; added responsive scaling for narrower desktop viewports so the side panel remains visible.
- Verification: `node scripts\generate-assets.mjs`, `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" test`, `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build`, `node scripts\make-single-html.mjs`, and single-file Playwright smoke all passed. Latest visual checks are `output/terrain-variants-preview.png` and `output/terrain-random-smoke-2/shot-2.png`.
- Added the rewritten start-menu background story based on the available bread-squad dorm joke framing; if the original joke text is provided later, swap only the copy in `src/App.jsx` and README.
- Depth 4 now has no downward stairs. The final boss spawns as a stationary 2x2 entity, renders larger, occupies all four tiles for collision/attack targeting, and wins the run when defeated.
- Verification after boss/story work: 25/25 tests passed, Vite build passed, single-file export regenerated at 1709.5 KB, and `output/story-menu-smoke/shot-0.png` confirms the start story layout.
- Replaced the temporary story copy with the user's original dorm joke: baguette + dense rye as spear/shield, butter archer, reversed sailor/ham warrior, and narrator becoming lettuce priest at 2 AM.
- Visual map polish pass: increased gameplay tiles to 64px, reduced map grid to 18x12, render only walk-adjacent wall tiles over a black board background, and crop floor variants as full-cell textures to remove black seams between floor tiles. Added a small spawn breathing room and lower small-map enemy density.
- Bugfix pass: UI now clears skill FX after the animation window, img2 generated `wall_oriented_variants_img2_raw.png` for north/south/west/east wall variants, wall rendering picks orientation based on adjacent floor direction, and floor rendering uses seeded hash rotation/flip to reduce obvious repeated patterns.
- Wall continuity pass: side walls no longer use the perspective side-wall img2 pieces because those cannot tile cleanly cell-by-cell; left/right walls now reuse the north wall edge rotated vertically and lock their variant so vertical boundaries read as continuous dungeon walls.
- Corner/scale pass: generated `art_sources/img2/wall_corner_variants_img2_raw.png`, sliced four wall-corner PNGs, render diagonal-only wall cells as corner pieces, changed side walls to use the bottom wall edge rotated vertically, and increased the map to 20x13 with more room attempts/target rooms.
- Wall-corner cleanup/menu pass: corner assets are now compact corner caps instead of full-cell L tiles, and corner caps render only when they connect two real wall edges. The start story now uses a magic-scroll style panel with narrower text measure and cleaner paragraph rhythm.
- Partial-floor fill pass: wall tiles now render half-tile floor patches under cardinal wall edges and quarter-tile floor patches under corner caps, filling visible gaps without changing collision or map data.
- Start-story copy pass: replaced the scroll story with the user's BBS-style dungeon thread copy, including per-poster replies and class unlock/status lines.
