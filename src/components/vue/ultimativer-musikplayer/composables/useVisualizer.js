import { ref, watch, onBeforeUnmount, computed } from 'vue'

export function useVisualizer(store, analyserRef, dataArrayRef, timeDomainArrayRef) {
  const canvas = ref(null)
  const ctx = ref(null)
  const animationFrameId = ref(null)
  const resizeObserver = ref(null)
  
  let frameCounter = 0
  
  // Get reactive values
  const analyser = computed(() => {
    return typeof analyserRef === 'function' ? analyserRef() : analyserRef
  })
  
  const dataArray = computed(() => {
    return typeof dataArrayRef === 'function' ? dataArrayRef() : dataArrayRef
  })
  
  const timeDomainArray = computed(() => {
    return typeof timeDomainArrayRef === 'function' ? timeDomainArrayRef() : timeDomainArrayRef
  })
  
  // Resize canvas to match container
  const resizeCanvas = () => {
    if (!canvas.value || !canvas.value.parentElement) return
    
    const rect = canvas.value.parentElement.getBoundingClientRect()
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    
    canvas.value.width = Math.floor(rect.width * dpr)
    canvas.value.height = Math.floor(rect.height * dpr)
    canvas.value.style.width = `${rect.width}px`
    canvas.value.style.height = `${rect.height}px`
    
    if (ctx.value) {
      ctx.value.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }
  
  // Initialize canvas
  const initCanvas = (canvasElement) => {
    canvas.value = canvasElement
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
  
  // Drawing functions
  const drawRibbon = (w, h, cx, cy, t, ampMul, glowMul) => {
    const data = dataArray.value
    if (!data) return
    
    const bins = data.length
    const baseR = Math.min(cx, cy) * 0.6
    
    let low = 0, mid = 0, high = 0
    for (let i = 0; i < bins; i++) {
      if (i < bins * 0.25) low += data[i]
      else if (i < bins * 0.7) mid += data[i]
      else high += data[i]
    }
    
    low /= (bins * 0.25)
    mid /= (bins * 0.45)
    high /= (bins * 0.3)
    
    const ampL = (low / 255) * baseR * 0.65 * ampMul
    const ampM = (mid / 255) * baseR * 0.45 * ampMul
    const ampH = (high / 255) * baseR * 0.30 * ampMul
    
    const grad = ctx.value.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0.0, '#3b82f6')
    grad.addColorStop(0.5, '#60a5fa')
    grad.addColorStop(1.0, '#93c5fd')
    
    ctx.value.save()
    ctx.value.translate(cx, cy)
    ctx.value.strokeStyle = grad
    ctx.value.lineWidth = Math.max(1.5, Math.min(w, h) * 0.006 * glowMul)
    ctx.value.beginPath()
    
    for (let i = 0; i <= 360; i++) {
      const a = (i / 360) * Math.PI * 2
      const r = baseR + Math.sin(a * 4) * ampL + Math.cos(a * 2) * ampM + Math.sin(a * 0.7) * ampH
      const x = Math.cos(a + t * 0.02) * r
      const y = Math.sin(a + t * 0.02) * r
      
      if (i === 0) ctx.value.moveTo(x, y)
      else ctx.value.lineTo(x, y)
    }
    
    ctx.value.closePath()
    ctx.value.stroke()
    ctx.value.restore()
  }
  
  const drawWaves = (w, h, ampMul, glowMul) => {
    const timeDomain = timeDomainArray.value
    if (!timeDomain) return
    
    const lines = 3
    const grad = ctx.value.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0.0, '#3b82f6')
    grad.addColorStop(0.5, '#60a5fa')
    grad.addColorStop(1.0, '#93c5fd')
    
    for (let l = 0; l < lines; l++) {
      const offsetY = (h / (lines + 1)) * (l + 1)
      ctx.value.beginPath()
      ctx.value.lineWidth = 2.0 * glowMul
      ctx.value.strokeStyle = grad
      
      for (let x = 0; x < w; x += 2) {
        const i = Math.floor((x / w) * timeDomain.length)
        const v = (timeDomain[i] - 128) / 128
        const y = offsetY + v * (h * 0.18 * ampMul) * (0.6 + l * 0.25)
        
        if (x === 0) ctx.value.moveTo(x, y)
        else ctx.value.lineTo(x, y)
      }
      
      ctx.value.stroke()
    }
  }
  
  const drawNebula = (w, h, cx, cy, t) => {
    const data = dataArray.value
    if (!data) return
    
    const count = Math.floor(220 + store.vizIntensity * 480)
    
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + t * 0.004
      const r = (Math.sin(i * 0.05 + t * 0.02) * 0.5 + 0.5) * Math.min(cx, cy) * (0.4 + 0.5 * store.vizIntensity)
      const x = cx + Math.cos(a) * r
      const y = cy + Math.sin(a) * r
      
      const bins = data.length
      const v = data[Math.floor((i + t) % bins)] / 255
      const rad = 1 + v * (3 + 4 * store.vizIntensity)
      
      ctx.value.beginPath()
      ctx.value.fillStyle = `rgba(59, 130, 246, ${0.06 + v * (0.12 + 0.25 * store.vizIntensity)})`
      ctx.value.arc(x, y, rad, 0, Math.PI * 2)
      ctx.value.fill()
    }
  }
  
  const drawSpectrum = (w, h, cx, cy, t) => {
    const data = dataArray.value
    if (!data) return
    
    const rays = Math.floor(120 + store.vizIntensity * 200)
    const bins = data.length
    
    ctx.value.lineWidth = Math.max(1.0, 1.4 * (0.7 + store.vizIntensity))
    
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + t * 0.004
      const v = data[Math.floor((i / rays) * bins) % bins] / 255
      const r = (0.25 + v * (0.55 * (0.7 + 0.6 * store.vizIntensity))) * Math.min(w, h)
      
      // Berechne Spektrum-Farbe basierend auf Position
      const hue = (i / rays) * 360
      const saturation = 70 + v * 30
      const lightness = 50 + v * 20
      
      ctx.value.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.7 + v * 0.3})`
      
      ctx.value.beginPath()
      ctx.value.moveTo(cx, cy)
      ctx.value.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      ctx.value.stroke()
      
      // Optional: Glow-Effekt bei hoher Intensität
      if (v > 0.7 && store.vizIntensity > 0.5) {
        ctx.value.globalAlpha = (v - 0.7) * 0.5
        ctx.value.lineWidth = Math.max(1.0, 1.4 * (0.7 + store.vizIntensity)) * 2
        ctx.value.stroke()
        ctx.value.globalAlpha = 1.0
        ctx.value.lineWidth = Math.max(1.0, 1.4 * (0.7 + store.vizIntensity))
      }
    }
  }
  
  const drawOrbits = (cx, cy, t) => {
    const data = dataArray.value
    if (!data) return
    
    const rings = 4 + Math.floor(store.vizIntensity * 3)
    const bins = data.length
    
    const grad = ctx.value.createLinearGradient(0, 0, canvas.value.width, canvas.value.height)
    grad.addColorStop(0.0, '#3b82f6')
    grad.addColorStop(0.5, '#60a5fa')
    grad.addColorStop(1.0, '#93c5fd')
    
    for (let rIdx = 1; rIdx <= rings; rIdx++) {
      // Berechne durchschnittliche Amplitude für diesen Ring
      const startBin = Math.floor((rIdx - 1) / rings * bins)
      const endBin = Math.floor(rIdx / rings * bins)
      let avg = 0
      for (let i = startBin; i < endBin; i++) {
        avg += data[i]
      }
      avg /= (endBin - startBin)
      const intensity = avg / 255
      
      const baseRadius = (rIdx / (rings + 1)) * Math.min(cx, cy) * (0.8 + 0.2 * store.vizIntensity)
      const pulseAmount = intensity * 20 * (0.5 + store.vizIntensity)
      const radius = baseRadius + pulseAmount
      
      // Zeichne Ring mit Segmenten für Audio-Reaktion
      const segments = 64
      ctx.value.beginPath()
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2 + t * 0.001 * (rIdx * 0.3)
        const binIndex = Math.floor((i / segments) * bins) % bins
        const segmentIntensity = data[binIndex] / 255
        
        const r = radius + segmentIntensity * 8 * (0.3 + store.vizIntensity * 0.7)
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        
        if (i === 0) {
          ctx.value.moveTo(x, y)
        } else {
          ctx.value.lineTo(x, y)
        }
      }
      
      ctx.value.closePath()
      ctx.value.lineWidth = 1.2 + store.vizIntensity * 1.8 + intensity * 1.5
      ctx.value.strokeStyle = grad
      ctx.value.stroke()
      
      // Optional: Füge Glow-Effekt hinzu bei hoher Intensität
      if (intensity > 0.6) {
        ctx.value.globalAlpha = (intensity - 0.6) * 0.5
        ctx.value.lineWidth = (1.2 + store.vizIntensity * 1.8) * 2
        ctx.value.stroke()
        ctx.value.globalAlpha = 1.0
      }
    }
  }
  
  const drawStarfield = (cx, cy, t) => {
    const data = dataArray.value
    if (!data) return
    
    const count = Math.floor(200 + 600 * store.vizIntensity)
    const bins = data.length
    
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const d = ((t * (0.02 * (0.6 + store.vizIntensity * 2.0)) + i * 0.003) % 1) * Math.min(cx, cy) * (0.25 + 0.9 * store.vizIntensity)
      const x = cx + Math.cos(a) * d
      const y = cy + Math.sin(a) * d
      
      const v = data[Math.floor((i * 7 + t) % bins)] / 255
      
      ctx.value.beginPath()
      ctx.value.fillStyle = `rgba(59, 130, 246, ${0.05 + v * (0.15 + 0.25 * store.vizIntensity)})`
      ctx.value.arc(x, y, 0.7 + v * (1.2 + 2.4 * store.vizIntensity), 0, Math.PI * 2)
      ctx.value.fill()
    }
  }
  
  const drawGrid = (w, h, t) => {
    const data = dataArray.value
    if (!data) return
    
    const cell = Math.max(8, Math.floor(Math.min(w, h) / (18 + 30 * (1 - store.vizIntensity))))
    const bins = data.length
    
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const v = data[Math.floor(((x + y + t) % (w + h)) / (w + h) * bins)] / 255
        ctx.value.fillStyle = `rgba(59, 130, 246, ${0.06 + v * (0.20 + 0.25 * store.vizIntensity)})`
        const inset = (1 - v) * (cell * 0.35 * (0.2 + 0.8 * store.vizIntensity))
        ctx.value.fillRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2)
      }
    }
  }
  
  // Main draw loop
  const draw = () => {
    if (!analyser.value || !ctx.value || !canvas.value) return
    if (!dataArray.value || !timeDomainArray.value) return
    
    analyser.value.getByteFrequencyData(dataArray.value)
    analyser.value.getByteTimeDomainData(timeDomainArray.value)
    
    const w = canvas.value.width
    const h = canvas.value.height
    const cx = w / 2
    const cy = h / 2
    
    const trail = Math.max(0.08, 0.30 - store.vizIntensity * 0.22)
    
    ctx.value.globalCompositeOperation = 'source-over'
    ctx.value.fillStyle = `rgba(0,0,0,${trail})`
    ctx.value.fillRect(0, 0, w, h)
    
    ctx.value.globalCompositeOperation = 'lighter'
    
    const glowMul = 0.6 + store.vizIntensity * 0.8
    const ampMul = 0.5 + store.vizIntensity * 0.9
    
    switch (store.vizMode) {
      case 'ribbon':
        drawRibbon(w, h, cx, cy, frameCounter, ampMul, glowMul)
        break
      case 'waves':
        drawWaves(w, h, ampMul, glowMul)
        break
      case 'nebula':
        drawNebula(w, h, cx, cy, frameCounter)
        break
      case 'spectrum':
        drawSpectrum(w, h, cx, cy, frameCounter)
        break
      case 'orbits':
        drawOrbits(cx, cy, frameCounter)
        break
      case 'starfield':
        drawStarfield(cx, cy, frameCounter)
        break
      case 'grid':
        drawGrid(w, h, frameCounter)
        break
    }
    
    frameCounter++
    animationFrameId.value = requestAnimationFrame(draw)
  }
  
  // Start/stop animation
  const start = () => {
    if (!analyser.value) return
    if (animationFrameId.value) return
    
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
    if (ctx.value && canvas.value) {
      ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    }
    frameCounter = 0
  }
  
  // Watch for playing state
  watch(() => store.isPlaying, (playing) => {
    if (playing) {
      start()
    } else {
      stop()
    }
  })
  
  // Cleanup
  onBeforeUnmount(() => {
    stop()
    if (resizeObserver.value) {
      resizeObserver.value.disconnect()
    } else {
      window.removeEventListener('resize', resizeCanvas)
    }
  })
  
  return {
    initCanvas,
    start,
    stop,
    reset
  }
}
