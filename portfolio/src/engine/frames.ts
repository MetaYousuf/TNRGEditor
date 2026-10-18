export interface Shot {
  from: number
  to: number
  box: [number, number, number, number]
  cx: number
}

export interface Manifest {
  w: number
  h: number
  count: number
  shots: Shot[]
}

let manifest: Manifest | null = null
let images: (HTMLImageElement | null)[] = []
let loaded = 0
const progressSubs = new Set<(loaded: number, count: number) => void>()

export const getManifest = () => manifest
export const loadedCount = () => loaded

export function shotIndexOf(i: number): number {
  const shots = manifest!.shots
  for (let s = 0; s < shots.length; s++) if (i <= shots[s].to) return s
  return shots.length - 1
}

/** Exact frame if decoded, otherwise the nearest decoded frame inside the same shot. */
export function getFrame(i: number): HTMLImageElement | null {
  if (images[i]) return images[i]
  const shot = manifest!.shots[shotIndexOf(i)]
  for (let d = 1; d <= shot.to - shot.from; d++) {
    if (i - d >= shot.from && images[i - d]) return images[i - d]
    if (i + d <= shot.to && images[i + d]) return images[i + d]
  }
  return null
}

export const hasFrame = (i: number) => !!images[i]

export function onLoadProgress(fn: (loaded: number, count: number) => void) {
  progressSubs.add(fn)
  return () => progressSubs.delete(fn)
}

export async function loadManifest(): Promise<Manifest> {
  const res = await fetch('./frames/manifest.json')
  manifest = (await res.json()) as Manifest
  images = new Array(manifest.count).fill(null)
  return manifest
}

function loadOrder(m: Manifest): number[] {
  const seen = new Set<number>()
  const order: number[] = []
  const push = (i: number) => {
    if (!seen.has(i)) {
      seen.add(i)
      order.push(i)
    }
  }
  for (const s of m.shots) {
    push(s.from)
    push(s.to)
  }
  for (const stride of [8, 4, 2, 1]) for (let i = 0; i < m.count; i += stride) push(i)
  return order
}

export function startLoading(concurrency = 8) {
  const m = manifest!
  const dir = window.innerWidth < 820 ? 'sm' : 'lg'
  const queue = loadOrder(m)
  const next = (): Promise<void> => {
    const i = queue.shift()
    if (i === undefined) return Promise.resolve()
    const img = new Image()
    img.src = `./frames/${dir}/f${String(i).padStart(3, '0')}.webp`
    return img
      .decode()
      .then(() => {
        images[i] = img
      })
      .catch(() => {})
      .then(() => {
        loaded++
        progressSubs.forEach((fn) => fn(loaded, m.count))
        return next()
      })
  }
  for (let c = 0; c < concurrency; c++) next()
}
