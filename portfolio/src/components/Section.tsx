import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LAYOUT, registerSection, type SceneId } from '../engine/director'
import { clamp, easeOutCubic, exitFade, useDirector } from '../engine/hooks'

/**
 * A scroll scene: tall section with a sticky 100vh inner.
 * Every [data-reveal] child fades/rises in on enter and fades out fast on exit.
 */
export function Section({ id, children, className = '' }: { id: SceneId; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  const reveals = useRef<HTMLElement[]>([])
  const height = LAYOUT.find((l) => l.id === id)!.height

  useEffect(() => {
    reveals.current = Array.from(ref.current!.querySelectorAll<HTMLElement>('[data-reveal]'))
    return registerSection(id, ref.current!)
  }, [id])

  useDirector((s) => {
    const sc = s.scenes[id]
    const out = exitFade(sc.exit)
    reveals.current.forEach((el) => {
      const delay = Number(el.dataset.reveal || 0)
      const r = easeOutCubic(clamp(sc.enter * 1.35 - delay * 0.08))
      el.style.opacity = String(r * out)
      el.style.transform = `translate3d(0, ${(1 - r) * 48}px, 0)`
      el.style.visibility = r * out < 0.001 ? 'hidden' : 'visible'
    })
  })

  return (
    <section ref={ref} id={id} className={`scene scene--${id} ${className}`} style={{ height: `${height}vh` }}>
      <div className="scene__sticky">
        <div className="scene__inner">{children}</div>
      </div>
    </section>
  )
}

/** Renders into the fixed back layer (behind the person). */
export function Back({ children }: { children: ReactNode }) {
  return createPortal(children, document.getElementById('layer-back')!)
}

/** Renders into the fixed front layer (in front of the person, below the text). */
export function Front({ children }: { children: ReactNode }) {
  return createPortal(children, document.getElementById('layer-front')!)
}
