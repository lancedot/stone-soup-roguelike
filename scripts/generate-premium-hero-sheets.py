from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "assets"
ASSET_DIR.mkdir(parents=True, exist_ok=True)

SCALE = 4
FRAME = 64
CANVAS = FRAME * SCALE
ROWS = ["down", "left", "right", "up"]

C = {
    "outline": (35, 24, 28, 255),
    "deep": (26, 20, 24, 255),
    "shadow": (0, 0, 0, 44),
    "skin": (247, 207, 156, 255),
    "skin_hi": (255, 232, 184, 255),
    "bread": (205, 134, 62, 255),
    "bread_hi": (255, 210, 126, 255),
    "rye": (101, 58, 35, 255),
    "rye_hi": (171, 111, 58, 255),
    "butter": (255, 225, 88, 255),
    "butter_hi": (255, 247, 150, 255),
    "ham": (218, 93, 105, 255),
    "ham_hi": (255, 158, 162, 255),
    "lettuce": (115, 214, 81, 255),
    "lettuce_dark": (54, 143, 79, 255),
    "robe_blue": (62, 130, 211, 255),
    "robe_green": (55, 161, 96, 255),
    "robe_red": (190, 57, 70, 255),
    "robe_leaf": (50, 126, 84, 255),
    "white": (255, 245, 218, 255),
    "gold": (255, 197, 73, 255),
}


def s(v: float) -> int:
    return round(v * SCALE)


def xy(box):
    return tuple(s(v) for v in box)


def make_frame() -> Image.Image:
    return Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))


def rr(d: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    d.rounded_rectangle(xy(box), radius=s(radius), fill=fill, outline=outline, width=s(width) if outline else 1)


def ellipse(d: ImageDraw.ImageDraw, box, fill, outline=None, width=1):
    d.ellipse(xy(box), fill=fill, outline=outline, width=s(width) if outline else 1)


def line(d: ImageDraw.ImageDraw, points, fill, width=1):
    d.line([xy(p) for p in points], fill=fill, width=s(width), joint="curve")


def polygon(d: ImageDraw.ImageDraw, points, fill, outline=None):
    d.polygon([xy(p) for p in points], fill=fill, outline=outline)


def draw_face(d: ImageDraw.ImageDraw, direction: str, bob: float, mood: str):
    if direction == "up":
        rr(d, (21, 14 + bob, 43, 32 + bob), 6, C["bread"], C["outline"], 1.5)
        return
    eye_y = 23 + bob
    if direction == "left":
        eyes = [(25, eye_y, 28, eye_y + 3), (33, eye_y, 36, eye_y + 3)]
    elif direction == "right":
        eyes = [(28, eye_y, 31, eye_y + 3), (36, eye_y, 39, eye_y + 3)]
    else:
        eyes = [(25, eye_y, 28, eye_y + 3), (36, eye_y, 39, eye_y + 3)]
    for eye in eyes:
        ellipse(d, eye, C["deep"])
    if mood == "mad":
        line(d, [(23, eye_y - 3), (30, eye_y - 5)], C["deep"], 1.2)
        line(d, [(35, eye_y - 5), (42, eye_y - 3)], C["deep"], 1.2)
    line(d, [(28, 34 + bob), (37, 34 + bob)], C["deep"], 1.4)


def draw_person(d: ImageDraw.ImageDraw, direction: str, frame: int, palette: dict):
    bob = -1.6 if frame in (1, 3) else 0
    step = [-2.4, -0.9, 1.1, 2.4][frame]
    turn = -2 if direction == "left" else 2 if direction == "right" else 0

    ellipse(d, (15, 51, 49, 59), C["shadow"])
    # Back cape / robe volume
    polygon(d, [(21, 29 + bob), (43, 29 + bob), (49, 53 + bob), (15, 53 + bob)], palette["body_dark"], C["outline"])
    polygon(d, [(24, 27 + bob), (40, 27 + bob), (45, 52 + bob), (19, 52 + bob)], palette["body"], C["outline"])
    rr(d, (26 + step, 49 + bob, 31 + step, 59 + bob), 2, C["rye"], C["outline"])
    rr(d, (34 - step, 49 + bob, 39 - step, 59 + bob), 2, C["rye"], C["outline"])
    rr(d, (19 + turn, 32 + bob, 25 + turn, 46 + bob), 3, palette["body"], C["outline"])
    rr(d, (39 + turn, 32 + bob, 45 + turn, 46 + bob), 3, palette["body"], C["outline"])
    ellipse(d, (21 + turn, 13 + bob, 43 + turn, 36 + bob), C["skin"], C["outline"], 1.5)
    ellipse(d, (24 + turn, 15 + bob, 38 + turn, 25 + bob), C["skin_hi"])
    rr(d, (19 + turn, 10 + bob, 45 + turn, 18 + bob), 4, palette["hat"], C["outline"], 1.5)
    rr(d, (23 + turn, 8 + bob, 41 + turn, 13 + bob), 3, palette["hat_hi"], None)
    draw_face(d, direction, bob, palette.get("mood", "ok"))


def bread_knight(d, direction, frame):
    draw_person(d, direction, frame, {
        "body": C["robe_blue"],
        "body_dark": (38, 80, 150, 255),
        "hat": C["bread"],
        "hat_hi": C["bread_hi"],
    })
    bob = -1.6 if frame in (1, 3) else 0
    lance_dx = 4 if direction == "right" else -4 if direction == "left" else 0
    line(d, [(47 + lance_dx, 12 + bob), (42 + lance_dx, 53 + bob)], C["bread"], 4)
    line(d, [(47 + lance_dx, 12 + bob), (50 + lance_dx, 5 + bob)], C["bread_hi"], 2)
    for y in (20, 29, 38):
        line(d, [(43 + lance_dx, y + bob), (48 + lance_dx, y - 3 + bob)], C["white"], 0.8)
    ellipse(d, (9, 31 + bob, 22, 51 + bob), C["rye"], C["outline"], 2)
    ellipse(d, (12, 34 + bob, 18, 45 + bob), C["rye_hi"])


def butter_archer(d, direction, frame):
    draw_person(d, direction, frame, {
        "body": C["robe_green"],
        "body_dark": (28, 104, 69, 255),
        "hat": C["butter"],
        "hat_hi": C["butter_hi"],
    })
    bob = -1.6 if frame in (1, 3) else 0
    x = 46 if direction != "left" else 16
    curve = -5 if direction != "left" else 5
    line(d, [(x, 17 + bob), (x + curve, 33 + bob), (x, 50 + bob)], C["rye"], 2.5)
    line(d, [(x, 17 + bob), (x, 50 + bob)], C["butter_hi"], 0.9)
    line(d, [(25, 38 + bob), (43, 34 + bob)], C["butter"], 2.5)
    ellipse(d, (42, 31 + bob, 49, 38 + bob), C["butter_hi"], C["outline"], 1)


def ham_warrior(d, direction, frame):
    draw_person(d, direction, frame, {
        "body": C["robe_red"],
        "body_dark": (128, 32, 47, 255),
        "hat": C["ham"],
        "hat_hi": C["ham_hi"],
        "mood": "mad",
    })
    bob = -1.6 if frame in (1, 3) else 0
    ellipse(d, (7, 31 + bob, 25, 51 + bob), C["ham"], C["outline"], 2)
    ellipse(d, (12, 36 + bob, 19, 44 + bob), C["white"])
    ellipse(d, (39, 31 + bob, 57, 51 + bob), C["ham"], C["outline"], 2)
    ellipse(d, (44, 36 + bob, 51, 44 + bob), C["white"])
    line(d, [(17, 31 + bob), (27, 40 + bob)], C["ham_hi"], 1.2)
    line(d, [(47, 31 + bob), (37, 40 + bob)], C["ham_hi"], 1.2)


def lettuce_priest(d, direction, frame):
    draw_person(d, direction, frame, {
        "body": C["robe_leaf"],
        "body_dark": (26, 82, 58, 255),
        "hat": C["lettuce"],
        "hat_hi": (180, 246, 126, 255),
    })
    bob = -1.6 if frame in (1, 3) else 0
    for side in (-1, 1):
        cx = 32 + side * (18 + math.sin(frame) * 1.2)
        polygon(d, [(cx, 28 + bob), (cx + side * 14, 22 + bob), (cx + side * 10, 47 + bob)], C["lettuce"], C["outline"])
        line(d, [(cx + side * 2, 30 + bob), (cx + side * 10, 40 + bob)], C["white"], 0.8)


HEROES = {
    "hero_bread_knight": bread_knight,
    "hero_butter_archer": butter_archer,
    "hero_ham_warrior": ham_warrior,
    "hero_lettuce_priest": lettuce_priest,
}


def render_sheet(name: str, drawer):
    sheet = Image.new("RGBA", (FRAME * 4, FRAME * 4), (0, 0, 0, 0))
    for row, direction in enumerate(ROWS):
        for frame in range(4):
            hi = make_frame()
            drawer(ImageDraw.Draw(hi), direction, frame)
            frame_img = hi.resize((FRAME, FRAME), Image.Resampling.LANCZOS)
            sheet.alpha_composite(frame_img, (frame * FRAME, row * FRAME))
    out = ASSET_DIR / f"{name}_sheet.png"
    sheet.save(out, optimize=True)
    return out


def main():
    for name, drawer in HEROES.items():
        print(render_sheet(name, drawer))


if __name__ == "__main__":
    main()
