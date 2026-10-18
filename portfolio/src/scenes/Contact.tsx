import { useRef } from 'react'
import { Back, Section } from '../components/Section'
import { profile } from '../data'
import { LAYOUT, scrollToTop } from '../engine/director'
import { clamp, easeOutCubic, useDirector } from '../engine/hooks'

const CONTACT = LAYOUT.findIndex((l) => l.id === 'contact')

export function Contact() {
  const bg = useRef<HTMLDivElement>(null)
  const talk = useRef<HTMLDivElement>(null)
  const [user, domain] = profile.email.split('@')

  useDirector((s) => {
    const el = bg.current!
    if (s.active < CONTACT) {
      el.style.visibility = 'hidden'
    } else {
      el.style.visibility = 'visible'
      if (s.prev >= 0) {
        // Same blade maths as the canvas.
        const skew = 0.2 * s.vh
        const e = -skew + (s.vw + 2 * skew) * s.t
        el.style.clipPath = `polygon(0 0, ${e + skew}px 0, ${e - skew}px 100%, 0 100%)`
      } else el.style.clipPath = 'none'
    }
    const sc = s.scenes.contact
    const r = easeOutCubic(clamp((sc.enter - 0.45) / 0.55))
    talk.current!.style.opacity = String(r)
    talk.current!.style.transform = `translate3d(-50%, ${(1 - r) * 14}vh, 0)`
  })

  return (
    <Section id="contact">
      <Back>
        <div className="contact-bg" ref={bg}>
          <div className="contact-talk" ref={talk} aria-hidden>
            <span>Let's</span>
            <span>Talk</span>
          </div>
        </div>
      </Back>
      <div className="contact__front">
        <p className="label label--light" data-reveal="0">
          <em>(06)</em> — Contact
        </p>
        <div className="contact__row">
          <a className="contact__email" href={`mailto:${profile.email}`} data-cursor="Write" data-reveal="1">
            <span>{user}</span>
            <span className="contact__domain">@{domain}</span>
          </a>
          <ul className="contact__links" data-reveal="2">
            {profile.links.map((l) => (
              <li key={l.label}>
                <a href={l.href} target="_blank" rel="noreferrer" data-cursor={l.cursor}>
                  {l.label}
                  <span className="arrow">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <footer className="contact__foot" data-reveal="3">
          <span>
            © {new Date().getFullYear()} {profile.fullName}
          </span>
          <button onClick={scrollToTop} data-cursor="Top">
            Back to top ↑
          </button>
        </footer>
      </div>
    </Section>
  )
}
