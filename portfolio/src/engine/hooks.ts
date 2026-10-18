import { useEffect, useRef, useState } from 'react'
import { onIntro, subscribe, type DirectorState } from './director'

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3)
export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
/** Fade-out factor every text block uses so neighbouring sections never overlap. */
export const exitFade = (exit: number) => Math.max(0, 1 - exit * 2.4)

/** Subscribe to scroll state. The callback mutates DOM through refs; it never triggers a render. */
export function useDirector(fn: (s: DirectorState) => void) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => subscribe((s) => ref.current(s)), [])
}

export function useIntro(fn: () => void) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => onIntro(() => ref.current()), [])
}

export const isMobile = () => window.innerWidth < 820

export function useIsMobile() {
  const [m, setM] = useState(isMobile)
  useEffect(() => {
    const on = () => setM(isMobile())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return m
}
