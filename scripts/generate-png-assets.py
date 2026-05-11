from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "assets"
SRC_DIR = ROOT / "src"
ASSET_DIR.mkdir(parents=True, exist_ok=True)
SRC_DIR.mkdir(parents=True, exist_ok=True)

T = (0, 0, 0, 0)
C = {
    "ink": (30, 20, 24, 255),
    "outline": (43, 29, 34, 255),
    "skin": (247, 214, 168, 255),
    "cream": (244, 203, 143, 255),
    "bread": (198, 130, 59, 255),
    "toast": (142, 84, 40, 255),
    "rye": (96, 58, 35, 255),
    "butter": (255, 230, 109, 255),
    "ham": (212, 93, 106, 255),
    "lettuce": (126, 217, 87, 255),
    "leaf_dark": (67, 151, 77, 255),
    "robe": (65, 125, 203, 255),
    "green": (74, 166, 95, 255),
    "red": (201, 60, 70, 255),
    "spirit": (128, 190, 255, 210),
    "purple": (142, 79, 202, 255),
    "orange": (216, 125, 46, 255),
    "gold": (255, 207, 90, 255),
    "white": (255, 246, 222, 255),
    "floor": (38, 39, 45, 255),
    "floor2": (52, 53, 60, 255),
    "wall": (71, 54, 48, 255),
    "wall2": (102, 82, 72, 255),
}


def px(im: Image.Image) -> ImageDraw.ImageDraw:
    return ImageDraw.Draw(im)


def rect(d, xy, fill, outline=None, w=1):
    d.rectangle(xy, fill=fill, outline=outline, width=w)


def ellipse(d, xy, fill, outline=None, w=1):
    d.ellipse(xy, fill=fill, outline=outline, width=w)


def line(d, xy, fill, w=1):
    d.line(xy, fill=fill, width=w)


def poly(d, pts, fill, outline=None):
    d.polygon(pts, fill=fill, outline=outline)


def draw_face(d, x, y, mood="ok"):
    ellipse(d, (x + 7, y + 7, x + 10, y + 10), C["ink"])
    ellipse(d, (x + 17, y + 7, x + 20, y + 10), C["ink"])
    if mood == "mad":
        line(d, (x + 6, y + 6, x + 11, y + 4), C["ink"], 2)
        line(d, (x + 16, y + 4, x + 21, y + 6), C["ink"], 2)
    line(d, (x + 10, y + 16, x + 18, y + 16), C["ink"], 2)


def base_person(d, x, y, body, hat, accessory, direction, frame, mood="ok"):
    bob = -1 if frame in (1, 3) else 0
    step = [-2, -1, 1, 2][frame]
    # Legs and boots
    rect(d, (x + 9 + step, y + 25 + bob, x + 13 + step, y + 31 + bob), C["toast"], C["outline"])
    rect(d, (x + 18 - step, y + 25 + bob, x + 22 - step, y + 31 + bob), C["toast"], C["outline"])
    # Body
    poly(d, [(x + 8, y + 15 + bob), (x + 23, y + 15 + bob), (x + 25, y + 27 + bob), (x + 6, y + 27 + bob)], body, C["outline"])
    # Arms
    rect(d, (x + 4, y + 17 + bob, x + 8, y + 25 + bob), body, C["outline"])
    rect(d, (x + 24, y + 17 + bob, x + 28, y + 25 + bob), body, C["outline"])
    # Head and hat
    ellipse(d, (x + 8, y + 6 + bob, x + 23, y + 20 + bob), C["skin"], C["outline"], 2)
    rect(d, (x + 7, y + 4 + bob, x + 24, y + 9 + bob), hat, C["outline"])
    draw_face(d, x + 2, y + 6 + bob, mood)
    if direction == "up":
        rect(d, (x + 8, y + 6 + bob, x + 23, y + 18 + bob), hat, C["outline"])
        rect(d, (x + 10, y + 17 + bob, x + 21, y + 20 + bob), C["skin"])
    if accessory == "baguette":
        line(d, (x + 28, y + 4 + bob, x + 25, y + 29 + bob), C["bread"], 4)
        line(d, (x + 2, y + 13 + bob, x + 6, y + 28 + bob), C["rye"], 6)
        for yy in (9, 15, 21):
            line(d, (x + 26, y + yy + bob, x + 29, y + yy - 2 + bob), C["white"], 1)
    elif accessory == "bow":
        line(d, (x + 25, y + 8 + bob, x + 25, y + 28 + bob), C["toast"], 2)
        line(d, (x + 25, y + 8 + bob, x + 29, y + 17 + bob), C["butter"], 2)
        line(d, (x + 25, y + 28 + bob, x + 29, y + 17 + bob), C["butter"], 2)
        line(d, (x + 5, y + 20 + bob, x + 15, y + 18 + bob), C["butter"], 3)
    elif accessory == "ham":
        ellipse(d, (x + 0, y + 15 + bob, x + 11, y + 26 + bob), C["ham"], C["outline"], 2)
        ellipse(d, (x + 21, y + 15 + bob, x + 31, y + 26 + bob), C["ham"], C["outline"], 2)
    elif accessory == "leaf":
        for dx in (-5, 21):
            poly(d, [(x + dx, y + 16 + bob), (x + dx + 12, y + 12 + bob), (x + dx + 10, y + 26 + bob)], C["lettuce"], C["outline"])


def draw_enemy(d, name, x, y, direction, frame):
    bob = -1 if frame in (1, 3) else 0
    if name == "enemy_nightmare_rat":
        ellipse(d, (x + 5, y + 17 + bob, x + 25, y + 26 + bob), C["purple"], C["outline"], 2)
        ellipse(d, (x + 2, y + 14 + bob, x + 9, y + 21 + bob), C["purple"], C["outline"])
        line(d, (x + 24, y + 22 + bob, x + 31, y + 20 + bob), C["spirit"], 2)
        ellipse(d, (x + 9, y + 19 + bob, x + 12, y + 22 + bob), C["ink"])
        line(d, (x + 4, y + 13 + bob, x + 2, y + 9 + bob), C["red"], 2)
    elif name == "enemy_hall_spirit":
        ellipse(d, (x + 7, y + 6 + bob, x + 24, y + 22 + bob), C["spirit"], C["outline"], 2)
        poly(d, [(x + 8, y + 18 + bob), (x + 13, y + 29 + bob), (x + 17, y + 23 + bob), (x + 21, y + 29 + bob), (x + 24, y + 18 + bob)], C["spirit"], C["outline"])
        ellipse(d, (x + 11, y + 12 + bob, x + 14, y + 15 + bob), C["ink"])
        ellipse(d, (x + 18, y + 12 + bob, x + 21, y + 15 + bob), C["ink"])
    elif name == "enemy_canteen_beetle":
        ellipse(d, (x + 6, y + 10 + bob, x + 26, y + 25 + bob), C["orange"], C["outline"], 2)
        line(d, (x + 16, y + 10 + bob, x + 16, y + 25 + bob), C["outline"], 2)
        for yy in (14, 18, 22):
            line(d, (x + 5, y + yy + bob, x + 0, y + yy - 3 + bob), C["outline"], 2)
            line(d, (x + 27, y + yy + bob, x + 31, y + yy - 3 + bob), C["outline"], 2)
        ellipse(d, (x + 10, y + 11 + bob, x + 13, y + 14 + bob), C["ink"])
        ellipse(d, (x + 20, y + 11 + bob, x + 23, y + 14 + bob), C["ink"])
    elif name == "enemy_warden_shadow":
        rect(d, (x + 9, y + 4 + bob, x + 23, y + 10 + bob), C["wall2"], C["outline"])
        poly(d, [(x + 6, y + 10 + bob), (x + 26, y + 10 + bob), (x + 24, y + 29 + bob), (x + 8, y + 29 + bob)], C["ink"], C["outline"])
        ellipse(d, (x + 10, y + 14 + bob, x + 14, y + 18 + bob), C["red"])
        ellipse(d, (x + 19, y + 14 + bob, x + 23, y + 18 + bob), C["red"])
        line(d, (x + 5, y + 21 + bob, x + 0, y + 26 + bob), C["purple"], 3)
        line(d, (x + 26, y + 21 + bob, x + 31, y + 26 + bob), C["purple"], 3)


def draw_fx(d, name, x, y, frame):
    if name == "fx_baguette_lance":
        line(d, (x + 2 + frame * 2, y + 16, x + 28, y + 11 + frame), C["bread"], 4)
        line(d, (x + 20, y + 8, x + 30, y + 16), C["gold"], 3)
        line(d, (x + 22, y + 20, x + 30, y + 16), C["gold"], 3)
    elif name == "fx_butter_shot":
        line(d, (x + 2, y + 18 - frame, x + 28, y + 13 + frame), C["butter"], 5)
        ellipse(d, (x + 20, y + 8, x + 31, y + 20), (255, 245, 130, 180), C["gold"], 2)
    elif name == "fx_ham_cleave":
        d.arc((x + 2, y + 3, x + 30, y + 30), 200 - frame * 20, 350 - frame * 20, fill=C["ham"], width=5)
        d.arc((x + 5, y + 7, x + 27, y + 27), 205 - frame * 20, 350 - frame * 20, fill=C["white"], width=2)
    elif name == "fx_leaf_prayer":
        for i in range(5):
            a = (i * 72 + frame * 18) * math.pi / 180
            cx = x + 16 + math.cos(a) * (5 + frame * 2)
            cy = y + 16 + math.sin(a) * (5 + frame * 2)
            ellipse(d, (cx - 3, cy - 2, cx + 4, cy + 3), C["lettuce"], C["outline"], 1)
        line(d, (x + 16, y + 5, x + 16, y + 28), C["white"], 2)


def make_sheet(name: str, drawer, frame_ms=520):
    sheet = Image.new("RGBA", (128, 128), T)
    rows = ["down", "left", "right", "up"]
    for r, direction in enumerate(rows):
        for f in range(4):
            frame = Image.new("RGBA", (32, 32), T)
            drawer(ImageDraw.Draw(frame), direction, f)
            sheet.alpha_composite(frame, (f * 32, r * 32))
    out = ASSET_DIR / f"{name}_sheet.png"
    sheet.save(out, optimize=True)
    return {
        "kind": "sheet",
        "src": f"assets/{name}_sheet.png",
        "cols": 4,
        "rows": 4,
        "frameMs": frame_ms,
    }


def make_static(name: str, drawer, size=(32, 32)):
    im = Image.new("RGBA", size, T)
    drawer(ImageDraw.Draw(im), im)
    out = ASSET_DIR / f"{name}.png"
    im.save(out, optimize=True)
    return f"assets/{name}.png"


def character_drawer(kind):
    def _draw(d, direction, frame):
        if kind == "hero_bread_knight":
            base_person(d, 0, 0, C["robe"], C["cream"], "baguette", direction, frame)
        elif kind == "hero_butter_archer":
            base_person(d, 0, 0, C["green"], C["butter"], "bow", direction, frame)
        elif kind == "hero_ham_warrior":
            base_person(d, 0, 0, C["red"], C["ham"], "ham", direction, frame, "mad")
        elif kind == "hero_lettuce_priest":
            base_person(d, 0, 0, C["leaf_dark"], C["lettuce"], "leaf", direction, frame)
    return _draw


def enemy_drawer(kind):
    return lambda d, direction, frame: draw_enemy(d, kind, 0, 0, direction, frame)


def fx_drawer(kind):
    return lambda d, direction, frame: draw_fx(d, kind, 0, 0, frame)


def tile_floor(d, im):
    d.rectangle((0, 0, 31, 31), fill=C["floor"])
    for x, y, w in [(2, 4, 5), (14, 9, 7), (5, 21, 10), (23, 26, 5)]:
        d.rectangle((x, y, x + w, y + 1), fill=C["floor2"])


def tile_wall(d, im):
    d.rectangle((0, 0, 31, 31), fill=C["wall"])
    for y in (6, 15, 24):
        d.rectangle((0, y, 31, y + 2), fill=C["outline"])
    for x, y in [(2, 2), (12, 9), (24, 18), (8, 25)]:
        d.rectangle((x, y, x + 6, y + 3), fill=C["wall2"])


def tile_stairs(d, im):
    tile_floor(d, im)
    for i, w in enumerate([22, 18, 14, 10, 6]):
        y = 24 - i * 5
        d.rectangle((5 + i * 4, y, 5 + i * 4 + w, y + 3), fill=C["wall2"], outline=C["outline"])
    d.rectangle((22, 3, 27, 6), fill=C["gold"])


def item_drawer(kind):
    def _draw(d, im):
        if kind == "item_warm_milk":
            d.rectangle((10, 9, 22, 27), fill=C["white"], outline=C["outline"], width=2)
            d.rectangle((12, 14, 20, 22), fill=(166, 239, 210, 255))
            d.rectangle((13, 5, 19, 9), fill=C["wall2"], outline=C["outline"])
        elif kind == "item_lettuce_leaf":
            d.ellipse((6, 7, 26, 26), fill=C["lettuce"], outline=C["outline"], width=2)
            d.line((16, 8, 16, 26), fill=C["white"], width=2)
        elif kind == "item_hard_baguette":
            d.line((17, 4, 15, 29), fill=C["bread"], width=6)
            for y in (8, 15, 22):
                d.line((14, y, 18, y - 2), fill=C["white"], width=1)
        elif kind == "item_dense_rye":
            d.ellipse((5, 10, 27, 26), fill=C["rye"], outline=C["outline"], width=2)
            for x in (10, 16, 22):
                d.rectangle((x, 14, x + 2, 16), fill=C["cream"])
        elif kind == "item_butter_block":
            d.rectangle((7, 10, 26, 24), fill=C["butter"], outline=C["outline"], width=2)
            d.rectangle((11, 14, 22, 16), fill=C["white"])
        elif kind == "item_ham_slice":
            d.ellipse((6, 8, 26, 27), fill=C["ham"], outline=C["outline"], width=2)
            d.ellipse((12, 14, 18, 20), fill=C["white"])
    return _draw


def boss_draw(d, im):
    d.ellipse((5, 5, 27, 25), fill=C["purple"], outline=C["outline"], width=2)
    d.rectangle((3, 12, 29, 22), fill=(32, 25, 42, 255), outline=C["outline"])
    d.ellipse((10, 13, 14, 17), fill=C["red"])
    d.ellipse((19, 13, 23, 17), fill=C["red"])
    d.rectangle((9, 23, 23, 28), fill=C["gold"], outline=C["outline"])


def font(size):
    for candidate in [
        Path("C:/Windows/Fonts/msyh.ttc"),
        Path("C:/Windows/Fonts/simhei.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def cg_drawer(title, subtitle, color, gag):
    def _draw(d, im):
        d.rectangle((0, 0, 719, 419), fill=(248, 237, 208, 255))
        d.line((35, 38, 690, 28, 678, 383, 45, 390, 35, 38), fill=C["ink"], width=5)
        d.ellipse((80, 250, 235, 350), fill=color, outline=C["ink"], width=7)
        d.ellipse((100, 118, 215, 235), fill=C["skin"], outline=C["ink"], width=7)
        d.arc((80, 70, 235, 200), 200, 335, fill=color, width=22)
        d.ellipse((130, 166, 142, 178), fill=C["ink"])
        d.ellipse((176, 166, 188, 178), fill=C["ink"])
        d.arc((130, 180, 190, 230), 20, 160, fill=C["ink"], width=5)
        d.line((260, 265, 610, 120), fill=C["bread"], width=18)
        d.line((260, 285, 405, 330), fill=C["rye"], width=30)
        d.polygon([(445, 105), (515, 65), (560, 110), (505, 155)], fill=C["gold"], outline=C["ink"])
        d.line((470, 250, 510, 210, 550, 250, 590, 210, 635, 250), fill=C["ham"], width=9)
        d.text((340, 56), title, fill=C["ink"], font=font(42))
        d.text((340, 112), subtitle, fill=C["ink"], font=font(26))
        d.text((340, 340), gag, fill=C["ink"], font=font(32))
        d.line((55, 65, 80, 75, 65, 95, 95, 100), fill=C["ink"], width=5)
        d.line((635, 300, 655, 320, 625, 328, 660, 346), fill=C["ink"], width=5)
    return _draw


sprites = {}
for name in ["hero_bread_knight", "hero_butter_archer", "hero_ham_warrior", "hero_lettuce_priest"]:
    sprites[name] = make_sheet(name, character_drawer(name), 520)
for name in ["enemy_nightmare_rat", "enemy_hall_spirit", "enemy_canteen_beetle", "enemy_warden_shadow"]:
    sprites[name] = make_sheet(name, enemy_drawer(name), 680)
for name in ["fx_baguette_lance", "fx_butter_shot", "fx_ham_cleave", "fx_leaf_prayer"]:
    sprites[name] = make_sheet(name, fx_drawer(name), 420)

sprites["tile_floor"] = make_static("tile_floor", tile_floor)
sprites["tile_wall"] = make_static("tile_wall", tile_wall)
sprites["tile_stairs"] = make_static("tile_stairs", tile_stairs)
sprites["enemy_insomnia_lord"] = make_static("enemy_insomnia_lord", boss_draw)
for name in ["item_warm_milk", "item_lettuce_leaf", "item_hard_baguette", "item_dense_rye", "item_butter_block", "item_ham_slice"]:
    sprites[name] = make_static(name, item_drawer(name))

cg_specs = {
    "cg_bread_knight": ("面包骑士通关", "列巴盾+法棍枪", (62, 122, 203, 255), "床帘被救下了"),
    "cg_butter_archer": ("黄油射手通关", "黄油箭冠军", (232, 200, 63, 255), "地板很滑但赢了"),
    "cg_ham_warrior": ("火腿战士通关", "反梦水手", (212, 93, 106, 255), "梦醒以后更饿了"),
    "cg_lettuce_priest": ("生菜牧师通关", "终于能睡", (126, 217, 87, 255), "今天不更新"),
}
for name, args in cg_specs.items():
    sprites[name] = make_static(name, cg_drawer(*args), size=(720, 420))

(SRC_DIR / "sprites.js").write_text(
    "export const sprites = " + json.dumps(sprites, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8",
)
print(f"generated {len(sprites)} png assets")
