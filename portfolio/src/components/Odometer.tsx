import { forwardRef, useImperativeHandle, useRef } from 'react'
import { smoothstep } from '../engine/hooks'

export interface OdometerHandle {
  /** Set the displayed value (fractional values roll the lowest digit). */
  set: (v: number) => void
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]

/**
 * Mechanical odometer: each digit is a 0–9,0 column. The lowest digit snaps with
 * smoothstep(.55, 1) on the fractional part; higher digits carry when the one below passes 9.
 */
export const Odometer = forwardRef<OdometerHandle, { target: number; className?: string; pad?: boolean }>(
  function Odometer({ target, className = '', pad = false }, ref) {
    const len = String(Math.round(target)).length
    const cols = useRef<(HTMLSpanElement | null)[]>([])

    useImperativeHandle(ref, () => ({
      set(v: number) {
        let lower = 0
        for (let k = 0; k < len; k++) {
          const d = v / Math.pow(10, k)
          let pos: number
          if (k === 0) pos = (Math.floor(d) % 10) + smoothstep(0.55, 1, d - Math.floor(d))
          else pos = (Math.floor(d) % 10) + Math.max(0, lower - 9)
          lower = pos
          const el = cols.current[len - 1 - k]
          if (!el) continue
          el.style.transform = `translate3d(0, ${(-pos / DIGITS.length) * 100}%, 0)`
          const hidden = !pad && k > 0 && v < Math.pow(10, k) - 0.5
          ;(el.parentElement as HTMLElement).style.opacity = hidden ? '0.12' : '1'
        }
      },
    }))

    return (
      <span className={`odo ${className}`} aria-label={String(target)}>
        {Array.from({ length: len }, (_, i) => (
          <span className="odo__win" key={i}>
            <span className="odo__col" ref={(el) => void (cols.current[i] = el)}>
              {DIGITS.map((d, j) => (
                <span key={j}>{d}</span>
              ))}
            </span>
          </span>
        ))}
      </span>
    )
  },
)
