"""Generate placeholder transparent frames + manifest until the real character video exists.

Draws a simple mannequin in four "shots" that mirror the video prompt:
  S1 stand + head turn, S2 sit down, S3 type on a laptop, S4 rise to stand.

Usage: python3 scripts/make_placeholder_frames.py
"""

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "frames"
W, H, SS = 1600, 900, 2  # virtual space, supersampling
PER_SHOT = 60
SHOTS = 4

PERSON = (24, 24, 24, 255)
SKIN = (40, 40, 40, 255)
PROP = (205, 205, 205, 255)
PROP_DARK = (140, 140, 140, 255)
SCREEN = (255, 31, 31, 255)

STAND = {
    "head": (800, 245), "neck": (800, 318), "sl": (748, 340), "sr": (852, 340),
    "el": (728, 450), "er": (872, 450), "hl": (722, 552), "hr": (878, 552),
    "hipl": (776, 565), "hipr": (824, 565), "kl": (772, 720), "kr": (828, 720),
    "fl": (768, 872), "fr": (832, 872),
}
SIT = {
    "head": (800, 335), "neck": (800, 408), "sl": (748, 430), "sr": (852, 430),
    "el": (732, 535), "er": (868, 535), "hl": (770, 612), "hr": (830, 612),
    "hipl": (776, 655), "hipr": (824, 655), "kl": (748, 700), "kr": (852, 700),
    "fl": (742, 872), "fr": (858, 872),
}
TYPE = dict(SIT, el=(860, 548), er=(905, 538), hl=(948, 598), hr=(1000, 592),
            head=(812, 338), neck=(806, 410))


def lerp_pose(a, b, t):
    return {k: (a[k][0] + (b[k][0] - a[k][0]) * t, a[k][1] + (b[k][1] - a[k][1]) * t) for k in a}


def ease(t):
    return -(math.cos(math.pi * t) - 1) / 2


def cap(d, p, q, w, fill):
    p = (p[0] * SS, p[1] * SS)
    q = (q[0] * SS, q[1] * SS)
    w *= SS
    d.line([p, q], fill=fill, width=int(w))
    for c in (p, q):
        d.ellipse([c[0] - w / 2, c[1] - w / 2, c[0] + w / 2, c[1] + w / 2], fill=fill)


def poly(d, pts, fill):
    d.polygon([(x * SS, y * SS) for x, y in pts], fill=fill)


def draw_person(d, P, turn=0.0):
    # torso
    poly(d, [P["sl"], P["sr"], P["hipr"], P["hipl"]], PERSON)
    cap(d, P["sl"], P["sr"], 46, PERSON)
    cap(d, P["hipl"], P["hipr"], 54, PERSON)
    # legs
    for a, b, c in (("hipl", "kl", "fl"), ("hipr", "kr", "fr")):
        cap(d, P[a], P[b], 44, PERSON)
        cap(d, P[b], P[c], 36, PERSON)
    # arms
    for a, b, c in (("sl", "el", "hl"), ("sr", "er", "hr")):
        cap(d, P[a], P[b], 30, PERSON)
        cap(d, P[b], P[c], 26, PERSON)
    # neck + head (turn shifts the face toward the left)
    cap(d, P["neck"], (P["head"][0], P["head"][1] + 30), 30, SKIN)
    hx, hy = P["head"]
    hx -= 10 * turn
    d.ellipse([(hx - 50) * SS, (hy - 62) * SS, (hx + 50) * SS, (hy + 58) * SS], fill=SKIN)
    # hair cap that slides with the turn
    d.chord([(hx - 52 + 14 * turn) * SS, (hy - 66) * SS, (hx + 52 + 14 * turn) * SS, (hy + 20) * SS], 180, 360, fill=PERSON)


def draw_chair(d):
    poly(d, [(735, 470), (865, 470), (870, 650), (730, 650)], PROP)
    poly(d, [(720, 650), (880, 650), (880, 672), (720, 672)], PROP_DARK)
    cap(d, (735, 672), (725, 875), 12, PROP_DARK)
    cap(d, (865, 672), (875, 875), 12, PROP_DARK)


def draw_desk(d):
    poly(d, [(880, 600), (1200, 600), (1200, 618), (880, 618)], PROP_DARK)
    cap(d, (900, 618), (900, 875), 14, PROP_DARK)
    cap(d, (1180, 618), (1180, 875), 14, PROP_DARK)
    # open laptop: base + raised screen
    poly(d, [(925, 590), (1075, 590), (1085, 600), (915, 600)], (70, 70, 70, 255))
    poly(d, [(948, 470), (1092, 470), (1075, 590), (930, 590)], (60, 60, 60, 255))
    poly(d, [(956, 478), (1084, 478), (1069, 582), (938, 582)], SCREEN)


def render(i):
    shot, k = divmod(i, PER_SHOT)
    t = k / (PER_SHOT - 1)
    img = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    person = Image.new("RGBA", img.size, (0, 0, 0, 0))
    dp = ImageDraw.Draw(person)
    d = ImageDraw.Draw(img)
    if shot == 0:
        draw_person(dp, STAND, turn=ease(t))
    elif shot == 1:
        draw_chair(d)
        draw_person(dp, lerp_pose(STAND, SIT, ease(t)), turn=1 - ease(t))
    elif shot == 2:
        draw_chair(d)
        draw_desk(d)
        bob = math.sin(k * 1.3) * 4
        P = dict(TYPE, hl=(TYPE["hl"][0], TYPE["hl"][1] + bob), hr=(TYPE["hr"][0], TYPE["hr"][1] - bob))
        draw_person(dp, P)
    else:
        draw_chair(d)
        draw_desk(d)
        draw_person(dp, lerp_pose(TYPE, STAND, ease(t)))
    img.alpha_composite(person)
    return img.resize((W, H), Image.LANCZOS), person.resize((W, H), Image.LANCZOS)


def main():
    for sub in ("lg", "sm"):
        (OUT / sub).mkdir(parents=True, exist_ok=True)
    count = PER_SHOT * SHOTS
    frames, people = zip(*(render(i) for i in range(count)))
    shots = []
    for s in range(SHOTS):
        lo, hi = s * PER_SHOT, (s + 1) * PER_SHOT - 1
        box = None
        for i in range(lo, hi + 1):
            b = frames[i].getchannel("A").point(lambda a: 255 if a > 6 else 0).getbbox()
            if b:
                box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
        x0, y0, x1, y1 = box
        # cx: alpha-weighted mean x of the person's top 45% rows
        a = people[lo].getchannel("A")
        pb = a.getbbox()
        top = a.crop((0, pb[1], W, pb[1] + int((pb[3] - pb[1]) * 0.45)))
        hist = [0.0] * W
        px = top.load()
        for x in range(0, W):
            for y in range(0, top.height, 3):
                hist[x] += px[x, y]
        total = sum(hist) or 1
        cx = sum(x * v for x, v in enumerate(hist)) / total / W
        shots.append({"from": lo, "to": hi, "box": [x0, y0, x1 - x0, y1 - y0], "cx": round(cx, 4)})
        for i in range(lo, hi + 1):
            crop = frames[i].crop(box)
            crop.save(OUT / "lg" / f"f{i:03d}.webp", "WEBP", quality=80, alpha_quality=90, method=4)
            crop.resize((max(1, crop.width // 2), max(1, crop.height // 2)), Image.LANCZOS).save(
                OUT / "sm" / f"f{i:03d}.webp", "WEBP", quality=78, method=4
            )
    (OUT / "manifest.json").write_text(json.dumps({"w": W, "h": H, "count": count, "shots": shots, "placeholder": True}, indent=2))
    print(f"wrote {count} frames, shots={shots}")


if __name__ == "__main__":
    main()
