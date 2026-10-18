import { useRef } from 'react'
import { Odometer, type OdometerHandle } from '../components/Odometer'
import { Back, Section } from '../components/Section'
import { journey } from '../data'
import { clamp, easeOutCubic, useDirector } from '../engine/hooks'

export function Journey() {
  const year = useRef<HTMLDivElement>(null)
  const odo = useRef<OdometerHandle>(null)
  const line = useRef<SVGPathElement>(null)
  const items = useRef<(HTMLLIElement | null)[]>([])
  const n = journey.items.length

  useDirector((s) => {
    const sc = s.scenes.journey
    year.current!.style.opacity = String(sc.vis)
    year.current!.style.transform = `translate3d(0, ${(1 - easeOutCubic(sc.enter)) * 12}vh, 0)`
    const k = clamp((sc.p - 0.05) / 0.8)
    odo.current?.set(journey.startYear + (journey.endYear - journey.startYear) * k)

    const prog = clamp((sc.p + sc.enter * 0.15 - 0.15) / 0.7)
    line.current!.style.strokeDashoffset = String(1 - prog)
    items.current.forEach((el, i) => {
      if (!el) return
      const fromBottom = n - 1 - i
      const r = easeOutCubic(clamp(prog * n - fromBottom))
      el.style.opacity = String(r)
      el.style.transform = `perspective(900px) rotateY(${-55 * (1 - r)}deg) translate3d(0, ${(1 - r) * 30}px, 0)`
      el.classList.toggle('is-active', r > 0.98 && (i === 0 || prog * n - (fromBottom + 1) < 0))
    })
  })

  return (
    <Section id="journey">
      <Back>
        <div className="journey-year" ref={year} aria-hidden>
          <Odometer target={journey.endYear} pad ref={odo} />
        </div>
      </Back>
      <div className="journey__col panel">
        <p className="label" data-reveal="0">
          <em>(03)</em> — Journey
        </p>
        <h2 className="display" data-reveal="1">
          {journey.title[0]}
          <br />
          <span className="red">{journey.title[1]}</span>
        </h2>
        <div className="timeline" data-reveal="2">
          <span className="timeline__track" />
          <svg className="timeline__line" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden>
            <path ref={line} d="M1 100 L1 0" pathLength={1} />
          </svg>
          <ol>
            {journey.items.map((it, i) => (
              <li key={it.title + i} ref={(el) => void (items.current[i] = el)}>
                <span className="timeline__node" />
                <span className="timeline__year">{it.year}</span>
                <span className="timeline__title">{it.title}</span>
                <span className="timeline__org">{it.org}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  )
}
