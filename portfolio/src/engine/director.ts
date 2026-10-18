import gsap from 'gsap'
import Lenis from 'lenis'
import type { Manifest } from './frames'

export type SceneId = 'hero' | 'about' | 'work' | 'journey' | 'skills' | 'awards' | 'contact'

/** Section order, nav labels and scroll lengths. Frames are filled in once the manifest loads. */
export const LAYOUT: { id: SceneId; label: string; height: number }[] = [
  { id: 'hero', label: 'Hello', height: 230 },
  { id: 'about', label: 'About', height: 280 },
  { id: 'work', label: 'Work', height: 460 },
  { id: 'journey', label: 'Journey', height: 240 },
  { id: 'skills', label: 'Toolkit', height: 280 },
  { id: 'awards', label: 'Awards', height: 320 },
  { id: 'contact', label: 'Contact', height: 240 },
]

export interface SceneDef {
  id: SceneId
  from: number
  to: number
  x: number
  k: number
}

export interface SceneState {
  enter: number
  p: number
  exit: number
  vis: number
}

export interface DirectorState {
  y: number
  vw: number
  vh: number
  scenes: Record<SceneId, SceneState>
  /** Index of the active scene in LAYOUT. */
  active: number
  /** Index of the outgoing scene while a blade transition runs, otherwise -1. */
  prev: number
  /** Blade transition progress, 1 when settled. */
  t: number
  /** Fractional video frame for the active scene. */
  frame: number
  progress: number
}

export let SCENES: SceneDef[] = []

export function buildScenes(m: Manifest) {
  let shots = m.shots.map((s) => ({ from: s.from, to: s.to }))
  if (shots.length < 4) {
    // Continuous take: split into four equal acts.
    const q = m.count / 4
    shots = [0, 1, 2, 3].map((i) => ({ from: Math.round(q * i), to: Math.round(q * (i + 1)) - 1 }))
  }
  const [s1, s2, s3, s4] = shots
  const len = s4.to - s4.from
  const a = s4.from + Math.round(len * 0.6)
  const b = s4.from + Math.round(len * 0.85)
  SCENES = [
    { id: 'hero', from: s1.from, to: s1.to, x: 0.7, k: 1 },
    { id: 'about', from: s2.from, to: s2.to, x: 0.27, k: 1 },
    { id: 'work', from: s3.from, to: s3.to, x: 0.77, k: 0.86 },
    { id: 'journey', from: s4.from, to: a, x: 0.26, k: 1 },
    { id: 'skills', from: a, to: b, x: 0.5, k: 0.98 },
    { id: 'awards', from: b, to: s4.to, x: 0.75, k: 1 },
    { id: 'contact', from: s1.to, to: s1.from, x: 0.5, k: 1 },
  ]
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2

const sections = new Map<SceneId, HTMLElement>()
const metrics = new Map<SceneId, { top: number; h: number }>()
const subs = new Set<(s: DirectorState) => void>()
const introSubs = new Set<() => void>()
let introFired = false
let lenis: Lenis | null = null
let ro: ResizeObserver | null = null
let lastKey = ''

const emptyScene = (): SceneState => ({ enter: 0, p: 0, exit: 0, vis: 0 })
const state: DirectorState = {
  y: 0,
  vw: window.innerWidth,
  vh: window.innerHeight,
  scenes: Object.fromEntries(LAYOUT.map((l) => [l.id, emptyScene()])) as Record<SceneId, SceneState>,
  active: 0,
  prev: -1,
  t: 1,
  frame: 0,
  progress: 0,
}

export const getState = () => state
export const mouse = { x: 0, y: 0, px: -100, py: -100 }

function measure() {
  const y = window.scrollY
  sections.forEach((el, id) => {
    const r = el.getBoundingClientRect()
    metrics.set(id, { top: r.top + y, h: r.height })
  })
  lastKey = ''
}

export function registerSection(id: SceneId, el: HTMLElement) {
  sections.set(id, el)
  ro?.observe(el)
  measure()
  return () => {
    sections.delete(id)
    ro?.unobserve(el)
  }
}

export const sectionTop = (id: SceneId) => metrics.get(id)?.top ?? 0

function tick() {
  const y = window.scrollY
  const vw = window.innerWidth
  const vh = window.innerHeight
  const key = `${y}|${vw}|${vh}|${SCENES.length}`
  if (key === lastKey) return
  lastKey = key
  state.y = y
  state.vw = vw
  state.vh = vh

  const lead = 0.78 * vh
  const span = 0.62 * vh
  let active = 0
  LAYOUT.forEach((l, i) => {
    const m = metrics.get(l.id)
    const s = state.scenes[l.id]
    if (!m) return
    s.enter = clamp((y - (m.top - vh)) / vh)
    s.p = clamp((y - m.top) / Math.max(1, m.h - vh))
    s.exit = clamp((y - (m.top + m.h - vh)) / vh)
    s.vis = clamp(Math.min(s.enter * 1.6, 1 - s.exit * 2.2))
    if (y >= m.top - lead) active = i
  })
  state.active = active
  state.prev = -1
  state.t = 1
  if (active > 0) {
    const m = metrics.get(LAYOUT[active].id)!
    const raw = (y - (m.top - lead)) / span
    if (raw < 1) {
      state.prev = active - 1
      state.t = easeInOutSine(clamp(raw))
    }
  }
  const sc = SCENES[active]
  if (sc) state.frame = sc.from + (sc.to - sc.from) * state.scenes[sc.id].p
  const max = document.documentElement.scrollHeight - vh
  state.progress = max > 0 ? clamp(y / max) : 0
  subs.forEach((fn) => fn(state))
}

export function subscribe(fn: (s: DirectorState) => void) {
  subs.add(fn)
  fn(state)
  return () => {
    subs.delete(fn)
  }
}

export const refresh = () => {
  lastKey = ''
}

export function onIntro(fn: () => void) {
  if (introFired) fn()
  else introSubs.add(fn)
  return () => {
    introSubs.delete(fn)
  }
}

export function fireIntro() {
  introFired = true
  introSubs.forEach((fn) => fn())
  introSubs.clear()
  lenis?.start()
}

export function initDirector() {
  if (lenis) return
  history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)
  lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.4, autoRaf: false })
  lenis.stop()
  gsap.ticker.lagSmoothing(0)
  gsap.ticker.add((time) => {
    lenis!.raf(time * 1000)
    tick()
  })
  ro = new ResizeObserver(measure)
  ro.observe(document.body)
  window.addEventListener('resize', measure)
  window.addEventListener('pointermove', (e) => {
    mouse.px = e.clientX
    mouse.py = e.clientY
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1
  })
}

const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4)

export function scrollToScene(id: SceneId) {
  lenis?.scrollTo(sectionTop(id), { duration: 2.2, easing: easeOutQuart })
}

export function scrollToTop() {
  lenis?.scrollTo(0, { duration: 2.2, easing: easeOutQuart })
}
