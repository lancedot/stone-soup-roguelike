from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art_sources" / "img2"
ASSET_DIR = ROOT / "public" / "assets"
FRAME_SIZE = 64
GRID = 4

SOURCES = {
    "hero_bread_knight": ("hero_bread_knight_img2_raw.png", "green"),
    "hero_butter_archer": ("hero_butter_archer_img2_raw.png", "green"),
    "hero_ham_warrior": ("hero_ham_warrior_img2_raw.png", "green"),
    "hero_lettuce_priest": ("hero_lettuce_priest_img2_raw.png", "magenta"),
    "enemy_nightmare_rat": ("enemy_nightmare_rat_img2_raw.png", "green"),
    "enemy_hall_spirit": ("enemy_hall_spirit_img2_raw.png", "green"),
    "enemy_canteen_beetle": ("enemy_canteen_beetle_img2_raw.png", "green"),
    "enemy_warden_shadow": ("enemy_warden_shadow_img2_raw.png", "green"),
    "fx_baguette_lance": ("fx_baguette_lance_img2_raw.png", "green"),
    "fx_butter_shot": ("fx_butter_shot_img2_raw.png", "green"),
    "fx_ham_cleave": ("fx_ham_cleave_img2_raw.png", "green"),
    "fx_leaf_prayer": ("fx_leaf_prayer_img2_raw.png", "magenta"),
}


def key_distance(pixel, key):
    return sum((pixel[i] - key[i]) ** 2 for i in range(3)) ** 0.5


def remove_key(im: Image.Image, key_name: str) -> Image.Image:
    im = im.convert("RGBA")
    key = (0, 255, 0) if key_name == "green" else (255, 0, 255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    src = im.load()
    dst = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = src[x, y]
            dist = key_distance((r, g, b), key)
            if dist < 36:
                continue
            alpha = 255 if dist > 135 else int(255 * (dist - 36) / (135 - 36))
            # Gentle despill for antialiased chroma edges.
            if key_name == "green":
                g = min(g, max(r, b) + 24)
            else:
                r = min(r, g + 40)
                b = min(b, g + 40)
            dst[x, y] = (r, g, b, min(a, alpha))
    return out


def bbox_for_alpha(im: Image.Image, threshold=12):
    alpha = im.getchannel("A")
    return alpha.point(lambda p: 255 if p > threshold else 0).getbbox()


def normalize_frame(cell: Image.Image) -> Image.Image:
    bbox = bbox_for_alpha(cell)
    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    if not bbox:
        return frame
    content = cell.crop(bbox)
    scale = min(54 / content.width, 58 / content.height)
    new_size = (max(1, round(content.width * scale)), max(1, round(content.height * scale)))
    content = content.resize(new_size, Image.Resampling.LANCZOS)
    x = (FRAME_SIZE - new_size[0]) // 2
    y = FRAME_SIZE - new_size[1] - 3
    frame.alpha_composite(content, (x, y))
    return frame


def normalize_sheet(name: str, src_name: str, key_name: str):
    raw = Image.open(SOURCE_DIR / src_name)
    keyed = remove_key(raw, key_name)
    out = Image.new("RGBA", (FRAME_SIZE * GRID, FRAME_SIZE * GRID), (0, 0, 0, 0))
    cell_w = keyed.width / GRID
    cell_h = keyed.height / GRID
    for row in range(GRID):
        for col in range(GRID):
            left = round(col * cell_w)
            top = round(row * cell_h)
            right = round((col + 1) * cell_w)
            bottom = round((row + 1) * cell_h)
            frame = normalize_frame(keyed.crop((left, top, right, bottom)))
            out.alpha_composite(frame, (col * FRAME_SIZE, row * FRAME_SIZE))
    out_path = ASSET_DIR / f"{name}_sheet.png"
    save_png(out, out_path, colors=128)
    print(out_path)


def save_png(im: Image.Image, path: Path, colors=128):
    quantized = im.quantize(colors=colors, method=Image.Quantize.FASTOCTREE)
    quantized.save(path, optimize=True)


def main():
    for name, (src, key_name) in SOURCES.items():
        normalize_sheet(name, src, key_name)


if __name__ == "__main__":
    main()
