# Mohammed Yousuf A — Portfolio

Scroll-driven portfolio: Vite + React + TypeScript, GSAP ticker, Lenis smooth scroll, a canvas that scrubs a transparent character video, and CSS-3D scenes (Hero, About, Work, Journey, Toolkit, Awards, Contact).

## Run

```bash
cd portfolio
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build into dist/
npm run preview    # serve the build
```

The build uses `base: './'`, so `dist/` can be hosted from any folder or static host.

## Placeholders still needed

| What | Where |
| --- | --- |
| **Character video** (10s, 16:9, white studio background; see the video prompt) | Run `python3 scripts/extract_frames.py video.mp4`. It replaces `public/frames/` |
| GitHub profile URL | `src/data.ts` → `profile.links` |
| Salar Digital channel / case-study link | `src/data.ts` → `projects[1].link` |
| Newton Studio showreel link | `src/data.ts` → `projects[2].link` |
| Certifications (6 slots) | `src/data.ts` → `certifications` |
| Any copy changes (tagline, manifesto, stats, journey) | `src/data.ts` |

The frames in `public/frames/` now are a generated mannequin (`scripts/make_placeholder_frames.py`). It acts out the same four parts as the real video: stand and turn, sit, type, rise.

## Swapping in the real video

```bash
pip install "rembg[cpu]" numpy scipy pillow     # ffmpeg must be installed too
python3 scripts/extract_frames.py ~/Downloads/character.mp4
```

The script extracts every frame and detects the shot cuts. If the video is one continuous take, it splits it evenly into four 2.5s parts. It then mattes the person and props (rembg `u2net_human_seg` plus a background-distance props mask), removes the white fringe, crops each shot and writes `lg/` + `sm/` WebPs and `manifest.json`. Check `scripts/work/check/*.png` (frames composited on red) for white halos around the hair.

## Structure

```
src/data.ts               all content
src/engine/director.ts    Lenis + scroll engine (scene enter/p/exit/vis, frame + blade transition)
src/engine/frames.ts      manifest + stride-ordered frame loader with nearest-frame fallback
src/engine/hooks.ts       useDirector / useIntro / easing helpers
src/components/           Stage (canvas), Chrome (preloader, HUD, cursor, buttons), Odometer, TiltCard, Section
src/scenes/               one file per section
public/resume.pdf         downloadable résumé
```
