import { useRef, type ReactNode } from 'react'

/** Glass card that tilts toward the cursor (±14°) with a moving radial glare. */
export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const el = ref.current!
    const r = el.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width
    const ny = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${(0.5 - ny) * 28}deg`)
    el.style.setProperty('--ry', `${(nx - 0.5) * 28}deg`)
    el.style.setProperty('--gx', `${nx * 100}%`)
    el.style.setProperty('--gy', `${ny * 100}%`)
    el.style.setProperty('--glare', '1')
  }
  const leave = () => {
    const el = ref.current!
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--glare', '0')
  }
  return (
    <div className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave}>
      <div ref={ref} className="tilt__card">
        {children}
        <span className="tilt__glare" aria-hidden />
      </div>
    </div>
  )
}
