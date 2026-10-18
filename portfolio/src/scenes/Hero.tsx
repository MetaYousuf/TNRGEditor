import gsap from 'gsap'
import { useRef } from 'react'
import { Button } from '../components/Chrome'
import { Back, Section } from '../components/Section'
import { profile } from '../data'
import { scrollToScene } from '../engine/director'
import { clamp, exitFade, useDirector, useIntro } from '../engine/hooks'

export function Hero() {
  const name = useRef<HTMLDivElement>(null)
  const front = useRef<HTMLDivElement>(null)
  const hl = useRef<HTMLSpanElement>(null)
  const letters = profile.firstName.toUpperCase().split('')

  useIntro(() => {
    const tl = gsap.timeline()
    tl.fromTo(
      name.current!.querySelectorAll('.hero-name__in'),
      { y: 0, yPercent: 115, rotateX: -80 },
      { y: 0, yPercent: 0, rotateX: 0, duration: 1.6, stagger: 0.07, ease: 'expo.out' },
    )
    tl.fromTo(
      front.current!.querySelectorAll('.mask > span'),
      { y: 0, yPercent: 110 },
      { y: 0, yPercent: 0, duration: 1.4, stagger: 0.08, ease: 'expo.out' },
      0.15,
    )
    tl.fromTo(
      front.current!.querySelectorAll('.hero__fade'),
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out' },
      0.45,
    )
  })

  useDirector((s) => {
    const sc = s.scenes.hero
    const out = exitFade(sc.exit)
    name.current!.style.opacity = String(sc.vis)
    name.current!.querySelectorAll<HTMLElement>('.hero-name__par').forEach((el, i) => {
      el.style.transform = `translate3d(0, ${(i % 2 ? 1 : -1) * sc.p * 2.4}vh, 0)`
    })
    front.current!.style.opacity = String(out)
    front.current!.style.visibility = out < 0.001 ? 'hidden' : 'visible'
    hl.current!.style.backgroundSize = `${clamp(sc.p / 0.75) * 100}% 0.42em`
  })

  return (
    <Section id="hero">
      <Back>
        <div className="hero-name" ref={name} aria-hidden>
          {letters.map((l, i) => (
            <span className="hero-name__par" key={i}>
              <span className="hero-name__in">{l}</span>
            </span>
          ))}
        </div>
      </Back>
      <div className="hero__front panel" ref={front}>
        <p className="hero__hello hero__fade">
          Hi, I'm <b>{profile.fullName}</b> —
        </p>
        <h1 className="hero__title">
          <span className="mask">
            <span>{profile.role[0]}</span>
          </span>
          <span className="mask red">
            <span>{profile.role[1]}</span>
          </span>
        </h1>
        <p className="hero__desc hero__fade">
          <span className="hl" ref={hl}>
            {profile.tagline}
          </span>
        </p>
        <div className="hero__ctas hero__fade">
          <Button onClick={() => scrollToScene('work')} cursor="Go">
            See my work ↘
          </Button>
          <Button href={profile.resume} variant="outline" cursor="PDF" download>
            Download résumé
          </Button>
        </div>
      </div>
    </Section>
  )
}
