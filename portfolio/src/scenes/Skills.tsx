import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { Back, Front, Section } from '../components/Section'
import { skills } from '../data'
import { getState, mouse } from '../engine/director'
import { exitFade, useDirector } from '../engine/hooks'

// Fibonacci sphere: evenly spread unit vectors.
const points = skills.map((_, i) => {
  const n = skills.length
  const y = 1 - (i / (n - 1)) * 2
  const r = Math.sqrt(1 - y * y)
  const th = Math.PI * (3 - Math.sqrt(5)) * i
  return { x: Math.cos(th) * r, y, z: Math.sin(th) * r }
})

export function Skills() {
  const back = useRef<(HTMLSpanElement | null)[]>([])
  const front = useRef<(HTMLSpanElement | null)[]>([])
  const tape = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const look = { x: 0, y: 0 }
    let spin = 0
    const tick = (_t: number, dt: number) => {
      const s = getState()
      const sc = s.scenes.skills
      if (sc.vis <= 0) {
        back.current.forEach((el) => el && (el.style.visibility = 'hidden'))
        front.current.forEach((el) => el && (el.style.visibility = 'hidden'))
        return
      }
      spin += dt * 0.00035
      look.x += (mouse.x - look.x) * 0.05
      look.y += (mouse.y - look.y) * 0.05
      const { vw, vh } = s
      const R = Math.min(vw * 0.27, vh * 0.46) * (vw < 820 ? 1.25 : 1)
      const cx = vw * 0.5
      const cy = vh * 0.56
      const rot = spin + sc.p * 5 + look.x * 0.6
      const tilt = -0.28 + look.y * 0.18
      const cr = Math.cos(rot)
      const sr = Math.sin(rot)
      const ct = Math.cos(tilt)
      const st = Math.sin(tilt)
      points.forEach((p, i) => {
        const x1 = p.x * cr - p.z * sr
        const z1 = p.x * sr + p.z * cr
        const y2 = p.y * ct - z1 * st
        const z2 = p.y * st + z1 * ct
        const sx = cx + x1 * R
        const sy = cy + y2 * R * 0.78
        const scale = 0.82 + 0.22 * z2
        const tf = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -50%) scale(${scale})`
        const b = back.current[i]!
        const f = front.current[i]!
        const vis = sc.vis
        if (z2 < 0) {
          b.style.visibility = 'visible'
          b.style.transform = tf
          b.style.opacity = String(vis * (0.55 + 0.45 * (1 + z2)))
          f.style.visibility = 'hidden'
        } else {
          f.style.visibility = 'visible'
          f.style.transform = tf
          f.style.opacity = String(vis)
          b.style.visibility = 'hidden'
        }
      })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  useDirector((s) => {
    const sc = s.scenes.skills
    tape.current!.style.opacity = String(Math.min(sc.enter * 1.5, 1) * exitFade(sc.exit))
    tape.current!.style.setProperty('--x', `${-sc.p * 40 - sc.enter * 10}%`)
  })

  const tapeText = Array.from({ length: 3 }, () => skills.join(' ✦ ')).join(' ✦ ')

  return (
    <Section id="skills">
      <Back>
        <div className="orbit orbit--back" aria-hidden>
          {skills.map((s, i) => (
            <span key={s} className="chip-orb" ref={(el) => void (back.current[i] = el)}>
              {s}
            </span>
          ))}
        </div>
      </Back>
      <Front>
        <div className="orbit orbit--front" aria-hidden>
          {skills.map((s, i) => (
            <span key={s} className="chip-orb" ref={(el) => void (front.current[i] = el)}>
              {s}
            </span>
          ))}
        </div>
      </Front>
      <div className="skills__head panel">
        <p className="label" data-reveal="0">
          <em>(04)</em> — Toolkit
        </p>
        <h2 className="display" data-reveal="1">
          Everything
          <br />
          <span className="red">in orbit.</span>
        </h2>
        <p className="sr-only">{skills.join(', ')}</p>
      </div>
      <div className="tape" ref={tape} aria-hidden>
        <div className="tape__track">{tapeText}</div>
      </div>
    </Section>
  )
}
