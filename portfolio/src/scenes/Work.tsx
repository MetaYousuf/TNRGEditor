import { useRef } from 'react'
import { Back, Section } from '../components/Section'
import { projects, type Visual } from '../data'
import { clamp, easeInOutCubic, easeOutCubic, exitFade, useDirector } from '../engine/hooks'

function Mock({ kind }: { kind: Visual }) {
  if (kind === 'chat')
    return (
      <div className="mock mock--chat">
        <span className="bubble bubble--in">/new “Monsoon economics”</span>
        <span className="bubble bubble--out">Mode 3 · Documentary — scripting…</span>
        <span className="bubble bubble--out">B-roll ✓ Voice ✓ Ducking ✓</span>
        <span className="bubble bubble--in">Publish to YouTube + LinkedIn</span>
        <span className="bubble bubble--out">Live in 4 min ✦</span>
      </div>
    )
  if (kind === 'gauge')
    return (
      <div className="mock mock--gauge">
        <svg viewBox="0 0 200 120">
          <path d="M20 110 A80 80 0 0 1 180 110" pathLength={1} className="gauge__track" />
          <path d="M20 110 A80 80 0 0 1 180 110" pathLength={1} className="gauge__fill" />
        </svg>
        <span className="gauge__val">445K</span>
        <span className="gauge__cap">from 120K subscribers</span>
      </div>
    )
  return (
    <div className="mock mock--heat">
      {Array.from({ length: 48 }, (_, i) => (
        <span key={i} style={{ animationDelay: `${((i * 37) % 23) * 0.12}s` }} />
      ))}
    </div>
  )
}

export function Work() {
  const grid = useRef<HTMLDivElement>(null)
  const deck = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLElement | null)[]>([])
  const count = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const n = projects.length

  useDirector((s) => {
    const sc = s.scenes.work
    const g = grid.current!
    g.style.opacity = String(sc.vis)
    g.style.setProperty('--shift', `${sc.p * 900}px`)

    const e = easeOutCubic(sc.enter)
    const out = exitFade(sc.exit)
    deck.current!.style.transform = `translate3d(0, ${(1 - e) * 60}vh, 0) rotateY(${-25 * (1 - e)}deg)`
    deck.current!.style.opacity = String(out)

    // Dwell on each card: progress eases between integer stops.
    const raw = clamp((sc.p - 0.06) / 0.82) * (n - 1)
    const i0 = Math.min(n - 2, Math.floor(raw))
    const q = i0 + easeInOutCubic(raw - i0)
    cards.current.forEach((el, i) => {
      if (!el) return
      const d = q - i
      let z: number, y: number, rx = 0, o: number
      if (d <= 0) {
        z = d * 300
        y = d * 3.2
        o = clamp(1 + d * 0.55)
      } else {
        z = d * 900
        y = -12 * d
        rx = 28 * d
        o = clamp(1 - 1.8 * d)
      }
      el.style.transform = `translate3d(0, ${y}vh, ${z}px) rotateX(${rx}deg)`
      el.style.opacity = String(o)
      el.style.zIndex = String(100 - Math.round(Math.abs(d) * 10))
      el.style.pointerEvents = Math.abs(d) < 0.5 ? 'auto' : 'none'
    })
    count.current!.textContent = String(Math.round(q) + 1).padStart(2, '0')
    bar.current!.style.transform = `scaleX(${q / (n - 1)})`
  })

  return (
    <Section id="work">
      <Back>
        <div className="work-grid" ref={grid}>
          <div className="work-grid__plane" />
        </div>
      </Back>
      <header className="work__head" data-reveal="0">
        <p className="label">
          <em>(02)</em> — Selected work
        </p>
        <p className="work__count">
          <span ref={count}>01</span> / {String(n).padStart(2, '0')}
        </p>
        <span className="work__bar">
          <span ref={bar} />
        </span>
      </header>
      <div className="deck" ref={deck}>
        {projects.map((p, i) => (
          <article className="card" key={p.name} ref={(el) => void (cards.current[i] = el)}>
            <div className="card__info">
              <p className="card__meta">
                <span className="red">{String(i + 1).padStart(2, '0')}</span> — {p.category}
              </p>
              <h3 className="card__name">{p.name}</h3>
              <p className="card__desc">{p.description}</p>
              <ul className="chips">
                {p.chips.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <a className="card__link" href={p.link} target="_blank" rel="noreferrer" data-cursor="Open">
                {p.linkLabel}
              </a>
            </div>
            <div className="card__visual">
              <Mock kind={p.visual} />
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}
