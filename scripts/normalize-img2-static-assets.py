from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art_sources" / "img2"
ASSET_DIR = ROOT / "public" / "assets"

STATIC_FRAME = 64
CG_SIZE = (720, 420)

ATLAS_ORDER = [
    "tile_floor",
    "tile_wall",
    "tile_stairs",
    "item_warm_milk",
    "item_lettuce_leaf",
    "item_hard_baguette",
    "item_dense_rye",
    "item_butter_block",
    "item_ham_slice",
    None,
    None,
    None,
]

CG_SOURCES = {
    "cg_bread_knight": "cg_bread_knight_img2_raw.png",
    "cg_butter_archer": "cg_butter_archer_img2_raw.png",
    "cg_ham_warrior": "cg_ham_warrior_img2_raw.png",
    "cg_lettuce_priest": "cg_lettuce_priest_img2_raw.png",
}

TERRAIN_SOURCE = "terrain_variants_img2_raw.png"
WALL_BLOCK_SOURCE = "wall_block_variants_img2_raw.png"
TERRAIN_ROWS = [
    "tile_floor",
    "tile_stairs",
]


def remove_key(im: Image.Image, key=(0, 255, 0)) -> Image.Image:
    im = im.convert("RGBA")
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    src = im.load()
    dst = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = src[x, y]
            dist = ((r - key[0]) ** 2 + (g - key[1]) ** 2 + (b - key[2]) ** 2) ** 0.5
            if dist < 36:
                continue
            alpha = 255 if dist > 135 else int(255 * (dist - 36) / (135 - 36))
            g = min(g, max(r, b) + 24)
            dst[x, y] = (r, g, b, min(a, alpha))
    return out


def alpha_bbox(im: Image.Image):
    return im.getchannel("A").point(lambda p: 255 if p > 12 else 0).getbbox()


def normalize_icon(cell: Image.Image, frame_size=STATIC_FRAME, pad=5) -> Image.Image:
    bbox = alpha_bbox(cell)
    out = Image.new("RGBA", (frame_size, frame_size), (0, 0, 0, 0))
    if not bbox:
        return out
    content = cell.crop(bbox)
    scale = min((frame_size - pad * 2) / content.width, (frame_size - pad * 2) / content.height)
    size = (max(1, round(content.width * scale)), max(1, round(content.height * scale)))
    content = content.resize(size, Image.Resampling.LANCZOS)
    out.alpha_composite(content, ((frame_size - size[0]) // 2, (frame_size - size[1]) // 2))
    return out


def normalize_tile(cell: Image.Image, frame_size=STATIC_FRAME, pad=1, seamless=False) -> Image.Image:
    bbox = alpha_bbox(cell)
    out = Image.new("RGBA", (frame_size, frame_size), (0, 0, 0, 0))
    if not bbox:
        return out
    content = cell.crop(bbox)
    if seamless:
        margin_x = max(1, round(content.width * 0.18))
        margin_y = max(1, round(content.height * 0.18))
        content = content.crop((margin_x, margin_y, content.width - margin_x, content.height - margin_y))
        return content.resize((frame_size, frame_size), Image.Resampling.LANCZOS)
    scale = min((frame_size - pad * 2) / content.width, (frame_size - pad * 2) / content.height)
    size = (max(1, round(content.width * scale)), max(1, round(content.height * scale)))
    content = content.resize(size, Image.Resampling.LANCZOS)
    out.alpha_composite(content, ((frame_size - size[0]) // 2, (frame_size - size[1]) // 2))
    return out


def normalize_wall_block(cell: Image.Image, frame_size=STATIC_FRAME) -> Image.Image:
    bbox = alpha_bbox(cell)
    out = Image.new("RGBA", (frame_size, frame_size), (0, 0, 0, 0))
    if not bbox:
        return out
    content = cell.crop(bbox)
    return content.resize((frame_size, frame_size), Image.Resampling.LANCZOS)


def save_png(im: Image.Image, path: Path, colors=128):
    if im.mode == "RGBA":
        im = im.quantize(colors=colors, method=Image.Quantize.FASTOCTREE)
    else:
        im = im.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    im.save(path, optimize=True)


def build_static_icons():
    atlas = remove_key(Image.open(SOURCE_DIR / "static_atlas_img2_raw.png"))
    cols, rows = 4, 3
    cell_w = atlas.width / cols
    cell_h = atlas.height / rows
    for idx, name in enumerate(ATLAS_ORDER):
        if not name:
            continue
        col = idx % cols
        row = idx // cols
        cell = atlas.crop((
            round(col * cell_w),
            round(row * cell_h),
            round((col + 1) * cell_w),
            round((row + 1) * cell_h),
        ))
        save_png(normalize_icon(cell), ASSET_DIR / f"{name}.png", colors=96)


def build_terrain_variants():
    terrain_path = SOURCE_DIR / TERRAIN_SOURCE
    if not terrain_path.exists():
        return

    atlas = remove_key(Image.open(terrain_path))
    cols, rows = 4, 3
    cell_w = atlas.width / cols
    cell_h = atlas.height / rows
    terrain_row_indexes = {
        "tile_floor": 0,
        "tile_stairs": 2,
    }
    for name in TERRAIN_ROWS:
        row = terrain_row_indexes[name]
        for col in range(cols):
            cell = atlas.crop((
                round(col * cell_w),
                round(row * cell_h),
                round((col + 1) * cell_w),
                round((row + 1) * cell_h),
            ))
            tile = normalize_tile(cell, pad=0 if name == "tile_floor" else 1, seamless=name == "tile_floor")
            save_png(tile, ASSET_DIR / f"{name}_{col + 1}.png", colors=128)
            if col == 0:
                save_png(tile, ASSET_DIR / f"{name}.png", colors=128)


def build_wall_block_variants():
    wall_path = SOURCE_DIR / WALL_BLOCK_SOURCE
    if not wall_path.exists():
        raise FileNotFoundError(
            f"Missing img2 wall source: {wall_path}. Generate a 4-cell wall block atlas with img2 before normalizing assets."
        )

    atlas = remove_key(Image.open(wall_path))
    cols = 4
    rows = 1
    cell_w = atlas.width / cols
    cell_h = atlas.height / rows
    for col in range(cols):
        cell = atlas.crop((
            round(col * cell_w),
            0,
            round((col + 1) * cell_w),
            round(cell_h),
        ))
        tile = normalize_wall_block(cell)
        save_png(tile, ASSET_DIR / f"tile_wall_{col + 1}.png", colors=128)
        if col == 0:
            save_png(tile, ASSET_DIR / "tile_wall.png", colors=128)


def build_boss():
    boss = remove_key(Image.open(SOURCE_DIR / "enemy_insomnia_lord_img2_raw.png"))
    save_png(normalize_icon(boss, frame_size=96, pad=4), ASSET_DIR / "enemy_insomnia_lord.png", colors=128)


def center_crop_resize(im: Image.Image, size):
    target_w, target_h = size
    src_w, src_h = im.size
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h
    if src_ratio > target_ratio:
        new_w = round(src_h * target_ratio)
        left = (src_w - new_w) // 2
        box = (left, 0, left + new_w, src_h)
    else:
        new_h = round(src_w / target_ratio)
        top = (src_h - new_h) // 2
        box = (0, top, src_w, top + new_h)
    return im.crop(box).resize(size, Image.Resampling.LANCZOS)


def build_cgs():
    for name, src in CG_SOURCES.items():
        im = Image.open(SOURCE_DIR / src).convert("RGB")
        save_png(center_crop_resize(im, CG_SIZE), ASSET_DIR / f"{name}.png", colors=160)


def main():
    build_static_icons()
    build_terrain_variants()
    build_wall_block_variants()
    build_boss()
    build_cgs()
    print("normalized img2 static assets")


if __name__ == "__main__":
    main()
