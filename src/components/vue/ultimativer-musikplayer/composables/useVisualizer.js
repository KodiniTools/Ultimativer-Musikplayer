import { ref, watch, onBeforeUnmount, computed } from 'vue'
import { drawBars }        from './visualizers/bars.js'
import { drawLiquid }      from './visualizers/waves.js'
import { drawPlasma }      from './visualizers/nebula.js'
import { drawArcSpectrum } from './visualizers/spectrum.js'
import { drawDNA }         from './visualizers/dna.js'
import { drawTunnel }      from './visualizers/tunnel.js'
import { drawEqualizer }   from './visualizers/equalizer.js'
import { drawAurora }      from './visualizers/aurora.js'
import { drawMandala }     from './visualizers/mandala.js'
import { drawSparks }      from './visualizers/sparks.js'

const TRAIL = {
  ribbon: 0, waves: 0, nebula: 0.16, spectrum: 0.12,
  orbits: 0, starfield: 0.10, grid: 0, aurora: 0.14,
  kaleidoscope: 0.13, particles: 0.10,
}

export function useVisualizer(store, analyserRef, dataArrayRef, timeDomainArrayRef) {
  const canvas           = ref(null)
  const ctx              = ref(null)
  const animationFrameId = ref(null)
  const resizeObserver   = ref(null)

  let frameCounter = 0
  let peakHolds    = new Float32Array(0)

  // Mutable state passed into draw functions that need it across frames
  const sparksState = { particles: [], lastEnergy: 0 }

  const analyser   = computed(() => typeof analyserRef          === 'function' ? analyserRef()          : analyserRef)
  const dataArray  = computed(() => typeof dataArrayRef         === 'function' ? dataArrayRef()         : dataArrayRef)
  const timeDomain = computed(() => typeof timeDomainArrayRef   === 'function' ? timeDomainArrayRef()   : timeDomainArrayRef)

  // ── Canvas setup ─────────────────────────────────────────────
  let _cssW = 0, _cssH = 0

  const resizeCanvas = () => {
    if (!canvas.value?.parentElement) return
    const rect = canvas.value.parentElement.getBoundingClientRect()
    const dpr  = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    _cssW = rect.width
    _cssH = rect.height
    canvas.value.width  = Math.floor(rect.width  * dpr)
    canvas.value.height = Math.floor(rect.height * dpr)
    canvas.value.style.width  = `${rect.width}px`
    canvas.value.style.height = `${rect.height}px`
    if (ctx.value) ctx.value.setTransform(dpr, 0, 0, dpr, 0, 0)
    peakHolds = new Float32Array(0)
  }

  const initCanvas = (el) => {
    canvas.value = el
    if (!canvas.value) return
    ctx.value = canvas.value.getContext('2d', { alpha: false })
    resizeCanvas()
    if ('ResizeObserver' in window) {
      resizeObserver.value = new ResizeObserver(resizeCanvas)
      resizeObserver.value.observe(canvas.value.parentElement)
    } else {
      window.addEventListener('resize', resizeCanvas)
    }
  }

  // ── Main draw loop ────────────────────────────────────────────
  const draw = () => {
    if (!analyser.value || !ctx.value || !canvas.value) return
    if (!dataArray.value || !timeDomain.value) return

    analyser.value.getByteFrequencyData(dataArray.value)
    analyser.value.getByteTimeDomainData(timeDomain.value)

    const w    = _cssW || canvas.value.width
    const h    = _cssH || canvas.value.height
    const cx   = w / 2
    const cy   = h / 2
    const mode = store.vizMode
    const vi   = store.vizIntensity
    const fd   = dataArray.value
    const td   = timeDomain.value
    const c    = ctx.value
    const t    = frameCounter

    const trail = TRAIL[mode] ?? 0
    c.globalCompositeOperation = 'source-over'
    c.fillStyle = trail > 0 ? `rgba(0,0,0,${trail})` : '#000'
    c.fillRect(0, 0, w, h)

    switch (mode) {
      case 'ribbon':       drawBars(c, w, h, cx, cy, fd, vi);              break
      case 'waves':        drawLiquid(c, w, h, cy, fd, td, vi);            break
      case 'nebula':       drawPlasma(c, w, h, cx, cy, t, fd, vi);         break
      case 'spectrum':     drawArcSpectrum(c, w, h, cx, cy, t, fd, vi);    break
      case 'orbits':       drawDNA(c, w, h, cy, t, fd, td, vi);            break
      case 'starfield':    drawTunnel(c, w, h, cx, cy, t, fd, vi);         break
      case 'grid':         drawEqualizer(c, w, h, fd, vi, peakHolds);      break
      case 'aurora':       drawAurora(c, w, h, t, fd, vi);                 break
      case 'kaleidoscope': drawMandala(c, w, h, cx, cy, t, fd, vi);        break
      case 'particles':    drawSparks(c, w, h, cx, cy, fd, vi, sparksState); break
    }

    frameCounter++
    animationFrameId.value = requestAnimationFrame(draw)
  }

  const start = () => {
    if (!analyser.value || animationFrameId.value) return
    draw()
  }

  const stop = () => {
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value)
      animationFrameId.value = null
    }
  }

  const reset = () => {
    stop()
    if (ctx.value && canvas.value) ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    frameCounter = 0
    peakHolds    = new Float32Array(0)
    sparksState.particles  = []
    sparksState.lastEnergy = 0
  }

  watch(() => store.isPlaying, (playing) => { playing ? start() : stop() })

  onBeforeUnmount(() => {
    stop()
    if (resizeObserver.value) resizeObserver.value.disconnect()
    else window.removeEventListener('resize', resizeCanvas)
  })

  return { initCanvas, start, stop, reset }
}
