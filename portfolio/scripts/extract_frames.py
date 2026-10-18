"""Turn the character video into transparent, per-shot-cropped WebP frames + manifest.json.

Setup:  pip install rembg[cpu] numpy scipy pillow   (ffmpeg must be on PATH)
Usage:  python3 scripts/extract_frames.py path/to/video.mp4 [--shots 4]

Writes public/frames/{lg,sm}/fNNN.webp, public/frames/manifest.json and
scripts/work/check/*.png (four frames composited on red, to eyeball halos).
"""

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "scripts" / "work"
OUT = ROOT / "public" / "frames"
VW, VH = 1600, 900


def extract(video: Path) -> list[Path]:
    full = WORK / "full"
    shutil.rmtree(full, ignore_errors=True)
    full.mkdir(parents=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(video), "-start_number", "0", str(full / "f%03d.png")], check=True)
    return sorted(full.glob("f*.png"))


def detect_cuts(video: Path, count: int, shots: int) -> list[tuple[int, int]]:
    scores_file = WORK / "scores.txt"
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", str(video), "-vf",
         f"select='gte(scene,0)',metadata=print:file={scores_file}", "-an", "-f", "null", "-"],
        check=True,
    )
    scores = [float(m) for m in re.findall(r"lavfi\.scene_score=([\d.]+)", scores_file.read_text())]
    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[: shots - 1]
    if len(ranked) < shots - 1 or min(scores[i] for i in ranked) < 0.2:
        # One continuous take: split into equal acts (the video prompt times each act at 2.5s).
        q = count / shots
        cuts = [round(q * i) for i in range(1, shots)]
        print("no hard cuts found, splitting evenly at", cuts)
    else:
        cuts = sorted(ranked)
        print("cuts at frames", cuts, "scores", [round(scores[i], 3) for i in cuts])
    bounds = [0, *cuts, count]
    return [(bounds[i], bounds[i + 1] - 1) for i in range(shots)]


def matte(path: Path, session) -> tuple[Image.Image, np.ndarray]:
    im = Image.open(path).convert("RGB")
    rgb = np.asarray(im).astype(np.float32)
    h, w, _ = rgb.shape

    person = np.asarray(remove(im, session=session, only_mask=True)).astype(np.float32) / 255

    corners = np.concatenate([rgb[:12, :12].reshape(-1, 3), rgb[:12, -12:].reshape(-1, 3),
                              rgb[-12:, :12].reshape(-1, 3), rgb[-12:, -12:].reshape(-1, 3)])
    bg = float(np.median(corners))  # ~247 on a white studio background
    dist = np.abs(rgb - bg).max(axis=2)
    props = np.clip((dist - 14) / (40 - 14), 0, 1)
    solid = ndimage.binary_opening(props > 0, structure=np.ones((3, 3)))
    labels, n = ndimage.label(solid)
    if n:
        sizes = ndimage.sum(solid, labels, range(1, n + 1))
        keep = np.isin(labels, 1 + np.flatnonzero(sizes > 4000))
    else:
        keep = solid
    keep = ndimage.binary_dilation(keep, iterations=4)
    props = props * keep

    a = np.maximum(person, props)
    a = ndimage.gaussian_filter(a, 0.8)

    # Un-premultiply against the background to kill the white fringe.
    safe = np.where(a > 0.05, a, 1)[..., None]
    rgb = np.where((a > 0.05)[..., None], (rgb - (1 - a[..., None]) * bg) / safe, rgb)
    rgb = np.clip(rgb, 0, 255)

    # Erode, remap, and suppress bright edge pixels.
    a_img = Image.fromarray((a * 255).astype(np.uint8))
    a_min = np.asarray(a_img.filter(ImageFilter.MinFilter(3))).astype(np.float32) / 255
    a = 0.35 * a + 0.65 * a_min
    a = np.clip((a - 0.14) / 0.86, 0, 1) ** 1.4
    lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    edge = a < 0.95
    a = np.where(edge, a * (1 - 0.8 * np.clip((lum - 150) / 70, 0, 1)), a)

    rgba = np.dstack([rgb, a * 255]).astype(np.uint8)
    out = Image.fromarray(rgba, "RGBA").resize((VW, VH), Image.LANCZOS)
    person_v = np.asarray(Image.fromarray((person * 255).astype(np.uint8)).resize((VW, VH), Image.BILINEAR)).astype(np.float32)
    return out, person_v


def person_cx(person: np.ndarray) -> float:
    rows = np.flatnonzero(person.max(axis=1) > 20)
    if not len(rows):
        return 0.5
    top, bottom = rows[0], rows[-1]
    band = person[top : top + int((bottom - top) * 0.45)]
    xs = np.arange(VW, dtype=np.float32)
    total = band.sum()
    return float((band.sum(axis=0) * xs).sum() / total / VW) if total else 0.5


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("--shots", type=int, default=4)
    args = ap.parse_args()

    WORK.mkdir(parents=True, exist_ok=True)
    files = extract(args.video)
    count = len(files)
    shots = detect_cuts(args.video, count, args.shots)
    session = new_session("u2net_human_seg")

    for sub in ("lg", "sm"):
        shutil.rmtree(OUT / sub, ignore_errors=True)
        (OUT / sub).mkdir(parents=True)
    check = WORK / "check"
    shutil.rmtree(check, ignore_errors=True)
    check.mkdir()

    manifest_shots = []
    for si, (lo, hi) in enumerate(shots):
        frames, cxs, box = [], [], None
        for i in range(lo, hi + 1):
            im, person = matte(files[i], session)
            frames.append(im)
            cxs.append(person_cx(person))
            b = im.getchannel("A").point(lambda v: 255 if v > 6 else 0).getbbox()
            if b:
                box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
            print(f"shot {si + 1}: frame {i}/{count - 1}", end="\r")
        box = box or (0, 0, VW, VH)
        for k, im in enumerate(frames):
            i = lo + k
            crop = im.crop(box)
            crop.save(OUT / "lg" / f"f{i:03d}.webp", "WEBP", quality=80, alpha_quality=90, method=6)
            crop.resize((max(1, crop.width // 2), max(1, crop.height // 2)), Image.LANCZOS).save(
                OUT / "sm" / f"f{i:03d}.webp", "WEBP", quality=78, method=6
            )
        mid = frames[len(frames) // 2]
        red = Image.new("RGBA", mid.size, (255, 0, 0, 255))
        red.alpha_composite(mid)
        red.convert("RGB").save(check / f"shot{si + 1}.png")
        manifest_shots.append({
            "from": lo, "to": hi,
            "box": [box[0], box[1], box[2] - box[0], box[3] - box[1]],
            "cx": round(float(np.median(cxs)), 4),
        })
        print()

    (OUT / "manifest.json").write_text(json.dumps({"w": VW, "h": VH, "count": count, "shots": manifest_shots}, indent=2))
    print("manifest:", json.dumps(manifest_shots))
    print(f"check halos in {check}")


if __name__ == "__main__":
    main()
