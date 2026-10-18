import { useRef } from 'react'
import { Odometer, type OdometerHandle } from '../components/Odometer'
import { Back, Section } from '../components/Section'
import { TiltCard } from '../components/TiltCard'
import { manifesto, stats } from '../data'
import { clamp, easeOutCubic, useDirector } from '../engine/hooks'

const words = manifesto.split(' ').map((w) => ({ text: w.replace(/\*/g, ''), key: w.startsWith('*') }))

export function About() {
  const shade = useRef<HTMLDivElement>(null)
  const wordEls = useRef<(HTMLSpanElement | null)[]>([])
  const odos = useRef<(OdometerHandle | null)[]>([])

  useDirector((s) => {
    const sc = s.scenes.about
    shade.current!.style.opacity = String(sc.vis)
    shade.current!.style.transform = `translate3d(${(1 - sc.enter) * -8}vw, 0, 0)`

    const r = clamp((sc.p + sc.enter * 0.12 - 0.08) / 0.55) * words.length
    wordEls.current.forEach((el, i) => {
      if (!el) return
      const w = clamp(r - i)
      el.style.opacity = String(0.1 + 0.9 * w)
      el.style.transform = `translate3d(0, ${(1 - w) * 0.25}em, 0)`
      el.style.filter = w > 0.99 ? 'none' : `blur(${(1 - w) * 4}px)`
    })

    const k = easeOutCubic(clamp((sc.p - 0.3) / 0.45))
    odos.current.forEach((o, i) => o?.set(stats[i].value * k))
  })

  return (
    <Section id="about">
      <Back>
        <div className="about-shade" ref={shade} />
      </Back>
      <div className="about__col">
        <div>
          <p className="label" data-reveal="0">
            <em>(01)</em> — About me
          </p>
          <p className="manifesto panel" data-reveal="1">
            {words.map((w, i) => (
              <span key={i} ref={(el) => void (wordEls.current[i] = el)} className={w.key ? 'red' : undefined}>
                {w.text}{' '}
              </span>
            ))}
          </p>
        </div>
        <div className="stats" data-reveal="3">
          {stats.map((s, i) => (
            <TiltCard key={s.label} className="stat">
              <div className="stat__num">
                <Odometer target={s.value} ref={(h) => void (odos.current[i] = h)} />
                <span className="stat__suffix">{s.suffix}</span>
              </div>
              <p className="stat__label">{s.label}</p>
            </TiltCard>
          ))}
        </div>
      </div>
    </Section>
  )
}
