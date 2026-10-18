import { useRef } from 'react'
import { Section } from '../components/Section'
import { certifications, counters } from '../data'
import { clamp, easeOutCubic, exitFade, useDirector } from '../engine/hooks'

export function Awards() {
  const flips = useRef<(HTMLDivElement | null)[]>([])
  const nums = useRef<(HTMLSpanElement | null)[]>([])
  const ring = useRef<HTMLDivElement>(null)
  const cyl = useRef<HTMLDivElement>(null)
  const N = certifications.length

  useDirector((s) => {
    const sc = s.scenes.awards
    const out = exitFade(sc.exit)
    flips.current.forEach((el, i) => {
      if (!el) return
      const r = easeOutCubic(clamp(sc.enter * 1.5 - 0.35 - i * 0.12))
      el.style.transform = `perspective(800px) rotateX(${-100 * (1 - r)}deg)`
      el.style.opacity = String(clamp(r * 1.4) * out)
      const k = easeOutCubic(clamp((sc.enter - 0.3 - i * 0.06) / 0.5))
      nums.current[i]!.textContent = String(Math.round(counters[i].value * k))
    })
    const e = easeOutCubic(clamp(sc.enter * 1.3 - 0.2))
    cyl.current!.style.opacity = String(e * out)
    ring.current!.style.transform = `translateZ(-360px) rotateX(-14deg) rotateY(${-sc.p * (360 - 360 / N)}deg)`
  })

  return (
    <Section id="awards">
      <div className="awards__col">
        <p className="label" data-reveal="0">
          <em>(05)</em> — Milestones
        </p>
        <div className="counters">
          {counters.map((c, i) => (
            <div key={c.label} className={`counter ${i % 2 ? 'counter--ink' : 'counter--red'}`} ref={(el) => void (flips.current[i] = el)}>
              <span className="counter__num">
                <span ref={(el) => void (nums.current[i] = el)}>0</span>
                {c.suffix}
              </span>
              <span className="counter__label">{c.label}</span>
            </div>
          ))}
        </div>
        <div className="cyl" ref={cyl}>
          <p className="label">
            <em>✓</em> — Education & certifications
          </p>
          <div className="cyl__stage">
            <div className="cyl__ring" ref={ring}>
              {certifications.map((c, i) => (
                <div
                  key={i}
                  className={`cert ${i % 3 === 0 ? 'cert--red' : ''}`}
                  style={{ transform: `rotateY(${(360 / N) * i}deg) translateZ(360px)` }}
                >
                  <div className="cert__face cert__front">
                    <span className="cert__seal">✓</span>
                    <span className="cert__title">{c.title}</span>
                    <span className="cert__issuer">{c.issuer}</span>
                  </div>
                  <div className="cert__face cert__back" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
