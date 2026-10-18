import { useEffect } from 'react'
import { Cursor, Hud, Preloader } from './components/Chrome'
import { Stage } from './components/Stage'
import { buildScenes, initDirector, refresh } from './engine/director'
import { loadManifest, startLoading } from './engine/frames'
import { About } from './scenes/About'
import { Awards } from './scenes/Awards'
import { Contact } from './scenes/Contact'
import { Hero } from './scenes/Hero'
import { Journey } from './scenes/Journey'
import { Skills } from './scenes/Skills'
import { Work } from './scenes/Work'

initDirector()

export default function App() {
  useEffect(() => {
    loadManifest().then((m) => {
      buildScenes(m)
      refresh()
      startLoading()
    })
  }, [])

  return (
    <>
      <Stage />
      <main>
        <Hero />
        <About />
        <Work />
        <Journey />
        <Skills />
        <Awards />
        <Contact />
      </main>
      <Hud />
      <Cursor />
      <Preloader />
    </>
  )
}
