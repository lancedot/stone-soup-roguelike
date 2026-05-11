# Sprite Pipeline Handoff

目标是把当前程序化 PNG 素材继续替换成更精美、统一、容量可控的 PNG sprite sheet。

## Runtime Contract

- 角色和普通敌人使用 4 方向 x 4 帧 sheet。
- 行顺序固定：down、left、right、up。
- 列顺序固定：walk frame 1-4。
- 运行时读取 `src/sprites.js`：`kind: "sheet"`、`src`、`cols: 4`、`rows: 4`、`frameMs`。
- 单帧图标、道具、地形仍可保持静态 PNG 资源。

## Asset Targets

第一批移动动画：

- `hero_bread_knight`
- `hero_butter_archer`
- `hero_ham_warrior`
- `hero_lettuce_priest`
- `enemy_nightmare_rat`
- `enemy_hall_spirit`
- `enemy_canteen_beetle`
- `enemy_warden_shadow`

第二批技能动画：

- `fx_baguette_lance`
- `fx_butter_shot`
- `fx_ham_cleave`
- `fx_leaf_prayer`

第三批地图：

- `tile_floor`
- `tile_wall`
- `tile_stairs`

已接入但可继续精修：

- `cg_bread_knight`
- `cg_butter_archer`
- `cg_ham_warrior`
- `cg_lettuce_priest`
- `fx_baguette_lance`
- `fx_butter_shot`
- `fx_ham_cleave`
- `fx_leaf_prayer`

## Workflow

1. 从当前游戏里的 32x32 角色图选一个 seed frame。
2. 用 Game Studio 的 Sprite Pipeline 创建透明参考画布。
3. 一次生成完整 4x4 strip，不逐帧生成。
4. 用 normalize 脚本裁成统一尺寸，底部居中锚点。
5. 在游戏内替换 `src/sprites.js` 的 `src` 指向 PNG sheet。
6. 重新运行浏览器 smoke test，检查移动、方向、帧切换和技能反馈。

## Current State

- Runtime sheet support is complete.
- Official img2 pass is complete for the current scope.
- Four player classes, four normal enemies, and four skill FX now use img2-generated 4x4 sprite sheets normalized by `scripts/normalize-img2-hero-sheets.py`.
- Tiles, items, the final boss, and victory CGs now use img2-generated source art normalized by `scripts/normalize-img2-static-assets.py`.
- Terrain now has a dedicated img2 atlas, `art_sources/img2/terrain_variants_img2_raw.png`, sliced into four variants each for floor, wall, and stairs.
- Four victory CGs are wired into the win overlay by class.
- Raw img2 outputs are stored in `art_sources/img2/` so the formal art source is available separately from optimized runtime PNGs.

## Next Premium Pass

1. Improve any individual img2 sheet that fails in playtesting.
2. Keep Pillow/Python limited to chroma-key removal, normalization, resizing, and compression.
3. Do not use programmatic drawing as the formal art path.

## Prompt Invariants

- same character, same silhouette, same palette family
- transparent background
- four directions, four frames each
- no scenery, no labels, no poster composition
- crisp game sprite readability at the current 36px display size
- stable bottom-center anchor
