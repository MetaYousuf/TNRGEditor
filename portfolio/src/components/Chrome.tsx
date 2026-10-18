import gsap from 'gsap'
import { useEffect, useRef, type ReactNode } from 'react'
import { profile } from '../data'
import { fireIntro, LAYOUT, mouse, scrollToScene } from '../engine/director'
import { onLoadProgress } from '../engine/frames'
import { useDirector } from '../engine/hooks'

/* ---------------------------------------------------------------- Preloader */

export function Preloader() {
  const root = useRef<HTMLDivElement>(null)
  const num = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current!
    const shown = { v: 0 }
    let target = 0
    let fontsReady = false
    let done = false
    const paint = () => (num.current!.textContent = String(Math.round(shown.v)).padStart(3, '0'))
    const finish = () => {
      if (done) return
      done = true
      gsap
        .timeline()
        .to(shown, { v: 100, duration: 0.5, ease: 'power2.out', onUpdate: paint })
        .to(el.querySelectorAll('.pre__line, .pre__num'), { yPercent: -120, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'power3.in' })
        .addLabel('split')
        .to(el.querySelector('.pre__half--top'), { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, 'split')
        .to(el.querySelector('.pre__half--bottom'), { yPercent: 100, duration: 1.2, ease: 'expo.inOut' }, 'split')
        .call(fireIntro, [], 'split+=0.45')
        .set(el, { display: 'none' })
    }
    const update = (p: number) => {
      target = Math.max(target, p)
      gsap.to(shown, { v: target * (fontsReady ? 100 : 96), duration: 0.6, ease: 'power2.out', onUpdate: paint, overwrite: true })
      if (target >= 1 && fontsReady) finish()
    }
    document.fonts.ready.then(() => {
      fontsReady = true
      update(target)
    })
    const off = onLoadProgress((loaded, count) => update(Math.min(1, loaded / Math.max(1, count / 4))))
    return () => {
      off()
    }
  }, [])

  return (
    <div className="pre" ref={root}>
      <div className="pre__half pre__half--top" />
      <div className="pre__half pre__half--bottom" />
      <div className="pre__center">
        <span className="pre__line">{profile.fullName} — Portfolio</span>
        <span className="pre__num" ref={num}>
          000
        </span>
        <span className="pre__line">Loading the edit · {new Date().getFullYear()}</span>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- HUD */

export function Hud() {
  const root = useRef<HTMLDivElement>(null)
  const pills = useRef<(HTMLButtonElement | null)[]>([])
  const pct = useRef<HTMLSpanElement>(null)
  const rail = useRef<HTMLSpanElement>(null)

  useDirector((s) => {
    pills.current.forEach((p, i) => p?.classList.toggle('is-active', i === s.active))
    const onContact = LAYOUT[s.active].id === 'contact' && (s.prev < 0 || s.t > 0.6)
    root.current!.classList.toggle('hud--inverse', onContact)
    pct.current!.textContent = `${String(Math.round(s.progress * 100)).padStart(2, '0')}%`
    rail.current!.style.transform = `scaleY(${s.progress})`
  })

  return (
    <div className="hud" ref={root}>
      <a className="hud__logo" href="#hero" data-cursor="Top" onClick={(e) => (e.preventDefault(), scrollToScene('hero'))}>
        {profile.firstName}
        <sup>®</sup>
      </a>
      <nav className="hud__nav" aria-label="Sections">
        {LAYOUT.map((l, i) => (
          <button key={l.id} ref={(el) => void (pills.current[i] = el)} data-cursor="Go" onClick={() => scrollToScene(l.id)}>
            {l.label}
          </button>
        ))}
      </nav>
      <div className="hud__progress">
        <span ref={pct}>00%</span>
        <span className="hud__rail">
          <span ref={rail} />
        </span>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Cursor */

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || window.innerWidth < 820) return
    document.documentElement.classList.add('has-cursor')
    const pos = { x: mouse.px, y: mouse.py }
    const tick = () => {
      pos.x += (mouse.px - pos.x) * 0.16
      pos.y += (mouse.py - pos.y) * 0.16
      dot.current!.style.transform = `translate3d(${mouse.px}px, ${mouse.py}px, 0)`
      ring.current!.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
    }
    const over = (e: PointerEvent) => {
      const t = (e.target as Element).closest<HTMLElement>('[data-cursor]')
      ring.current!.classList.toggle('is-hover', !!t)
      if (t) label.current!.textContent = t.dataset.cursor || ''
    }
    gsap.ticker.add(tick)
    window.addEventListener('pointerover', over)
    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('pointerover', over)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [])

  return (
    <>
      <div className="cursor-ring" ref={ring}>
        <span ref={label} />
      </div>
      <div className="cursor-dot" ref={dot} />
    </>
  )
}

/* ---------------------------------------------------------------- Button */

export function Button({
  children,
  href,
  onClick,
  variant = 'red',
  cursor = 'Go',
  download,
  className = '',
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: 'red' | 'outline'
  cursor?: string
  download?: boolean
  className?: string
}) {
  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const el = ref.current!
    const xTo = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'elastic.out(1, 0.35)' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'elastic.out(1, 0.35)' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * 0.35)
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35)
    }
    const leave = () => {
      xTo(0)
      yTo(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <a
      ref={ref}
      className={`btn btn--${variant} ${className}`}
      href={href ?? '#'}
      data-cursor={cursor}
      download={download || undefined}
      target={href && /^https?:/.test(href) ? '_blank' : undefined}
      rel="noreferrer"
      onClick={(e) => {
        if (onClick) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <span className="btn__fill" aria-hidden />
      <span className="btn__roll">
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
    </a>
  )
}

