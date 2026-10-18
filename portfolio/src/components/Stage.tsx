import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { getState, LAYOUT, mouse, SCENES, type SceneDef } from '../engine/director'
import { getFrame, getManifest, hasFrame, loadedCount, shotIndexOf } from '../engine/frames'

/** Fixed full-viewport canvas that paints the transparent video frames for the active scene. */
export function Stage() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const par = { x: 0, y: 0 }
    let lastKey = ''

    const drawScene = (sc: SceneDef, f: number, vw: number, vh: number, dx: number) => {
      const m = getManifest()!
      const fi = Math.max(0, Math.min(m.count - 1, Math.floor(f)))
      const frac = f - fi
      const shot = m.shots[shotIndexOf(fi)]
      const [bx, by, bw, bh] = shot.box
      const mobile = vw < 820
      const scale = mobile ? Math.min((vh * 0.74) / 900, (vw * 1.05) / bw) : (vh * sc.k) / 900
      const offY = vh - 900 * scale + par.y
      const offX = (mobile ? 0.5 : sc.x) * vw - shot.cx * 1600 * scale + par.x + dx
      const paint = (img: HTMLImageElement) =>
        ctx.drawImage(img, offX + bx * scale, offY + by * scale, bw * scale, bh * scale)
      const a = getFrame(fi)
      if (a) paint(a)
      if (frac > 0.001 && fi + 1 <= shot.to && hasFrame(fi + 1)) {
        const base = ctx.globalAlpha
        ctx.globalAlpha = base * frac
        paint(getFrame(fi + 1)!)
        ctx.globalAlpha = base
      }
    }

    const render = () => {
      if (!getManifest() || !SCENES.length) return
      const s = getState()
      const vw = s.vw
      const vh = s.vh
      const desktop = vw >= 820
      par.x += ((desktop ? -mouse.x * 14 : 0) - par.x) * 0.06
      par.y += ((desktop ? -mouse.y * 14 : 0) - par.y) * 0.06
      const key = `${s.active}|${s.prev}|${s.t.toFixed(4)}|${s.frame.toFixed(3)}|${par.x.toFixed(1)}|${par.y.toFixed(1)}|${vw}x${vh}|${loadedCount()}`
      if (key === lastKey) return
      lastKey = key

      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const W = Math.round(vw * dpr)
      const H = Math.round(vh * dpr)
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W
        canvas.height = H
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, vw, vh)

      const inc = SCENES[s.active]
      if (s.prev < 0) {
        drawScene(inc, s.frame, vw, vh, 0)
        return
      }

      // Blade transition: outgoing right of the line, incoming left of it.
      const out = SCENES[s.prev]
      const t = s.t
      const skew = 0.2 * vh
      const e = -skew + (vw + 2 * skew) * t
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(e + skew, 0)
      ctx.lineTo(vw + 100, 0)
      ctx.lineTo(vw + 100, vh)
      ctx.lineTo(e - skew, vh)
      ctx.closePath()
      ctx.clip()
      ctx.globalAlpha = 1 - 0.35 * t
      drawScene(out, out.to, vw, vh, 60 * t)
      ctx.restore()

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(-100, 0)
      ctx.lineTo(e + skew, 0)
      ctx.lineTo(e - skew, vh)
      ctx.lineTo(-100, vh)
      ctx.closePath()
      ctx.clip()
      drawScene(inc, inc.from, vw, vh, -60 * (1 - t))
      ctx.restore()

      const white = LAYOUT[s.active].id === 'contact'
      const color = white ? '255,255,255' : '255,31,31'
      // Trail
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(e + skew - 90, 0)
      ctx.lineTo(e + skew, 0)
      ctx.lineTo(e - skew, vh)
      ctx.lineTo(e - skew - 90, vh)
      ctx.closePath()
      const g = ctx.createLinearGradient(e - 90, 0, e, 0)
      g.addColorStop(0, `rgba(${color},0)`)
      g.addColorStop(1, `rgba(${color},0.28)`)
      ctx.fillStyle = g
      ctx.fill()
      ctx.restore()
      // Blade
      ctx.save()
      ctx.strokeStyle = `rgb(${color})`
      ctx.lineWidth = 3
      ctx.shadowColor = `rgba(${color},0.9)`
      ctx.shadowBlur = 24
      ctx.beginPath()
      ctx.moveTo(e + skew, 0)
      ctx.lineTo(e - skew, vh)
      ctx.stroke()
      ctx.restore()
    }

    gsap.ticker.add(render)
    return () => gsap.ticker.remove(render)
  }, [])

  return <canvas ref={ref} className="stage" aria-hidden />
}
