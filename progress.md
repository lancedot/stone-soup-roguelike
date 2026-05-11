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
