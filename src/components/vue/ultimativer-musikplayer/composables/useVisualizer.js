import { ref, watch, onBeforeUnmount, computed } from 'vue'

export function useVisualizer(store, analyserRef, dataArrayRef, timeDomainArrayRef) {
  const canvas = ref(null)
  const ctx = ref(null)
  const animationFrameId = ref(null)
  const resizeObserver = ref(null)

  let frameCounter = 0

  // Persistent particle state for particle visualizer
  let particles = []

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

  // --- Helper: compute frequency band averages ---
  const getBands = (data, bins) => {
    let low = 0, mid = 0, high = 0
    for (let i = 0; i < bins; i++) {
      if (i < bins * 0.25) low += data[i]
      else if (i < bins * 0.7) mid += data[i]
      else high += data[i]
    }
    low /= (bins * 0.25)
    mid /= (bins * 0.45)
    high /= (bins * 0.3)
    return { low: low / 255, mid: mid / 255, high: high / 255 }
  }

  // ============================================================
  // MODERNIZED VISUALIZERS
  // ============================================================

  // 1. Ribbon — smooth bezier curves, dual-layer, color-shifting
  const drawRibbon = (w, h, cx, cy, t, ampMul, glowMul) => {
    const data = dataArray.value
    if (!data) return

    const bins = data.length
    const baseR = Math.min(cx, cy) * 0.6
    const bands = getBands(data, bins)

    const ampL = bands.low * baseR * 0.65 * ampMul
    const ampM = bands.mid * baseR * 0.45 * ampMul
    const ampH = bands.high * baseR * 0.30 * ampMul

    // Color shifts based on frequency content
    const hueShift = bands.mid * 40

    // Draw two ribbon layers
    for (let layer = 0; layer < 2; layer++) {
      const phase = layer * Math.PI * 0.3
      const layerScale = layer === 0 ? 1.0 : 0.7
      const alpha = layer === 0 ? 1.0 : 0.6

      const grad = ctx.value.createLinearGradient(cx - baseR, cy - baseR, cx + baseR, cy + baseR)
      grad.addColorStop(0.0, `hsla(${210 + hueShift}, 80%, 55%, ${alpha})`)
      grad.addColorStop(0.5, `hsla(${230 + hueShift}, 75%, 65%, ${alpha})`)
      grad.addColorStop(1.0, `hsla(${260 + hueShift * 0.5}, 70%, 75%, ${alpha})`)

      ctx.value.save()
      ctx.value.translate(cx, cy)
      ctx.value.strokeStyle = grad
      ctx.value.lineWidth = Math.max(1.5, Math.min(w, h) * 0.006 * glowMul) * (layer === 0 ? 1.0 : 0.6)
      ctx.value.beginPath()

      const points = []
      const steps = 120
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2
        const r = (baseR * layerScale
          + Math.sin(a * 4 + phase) * ampL
          + Math.cos(a * 2 + phase) * ampM
          + Math.sin(a * 0.7 + phase) * ampH)
        points.push({
          x: Math.cos(a + t * 0.02 + phase * 0.5) * r,
          y: Math.sin(a + t * 0.02 + phase * 0.5) * r
        })
      }

      // Draw smooth bezier curve through points
      ctx.value.moveTo(points[0].x, points[0].y)
      for (let i = 0; i < points.length - 1; i++) {
        const cpx = (points[i].x + points[i + 1].x) / 2
        const cpy = (points[i].y + points[i + 1].y) / 2
        ctx.value.quadraticCurveTo(points[i].x, points[i].y, cpx, cpy)
      }
      ctx.value.closePath()
      ctx.value.stroke()
      ctx.value.restore()
    }
  }

  // 2. Waves — bezier curves, gradient fills between waves, color variation
  const drawWaves = (w, h, ampMul, glowMul) => {
    const timeDomain = timeDomainArray.value
    const data = dataArray.value
    if (!timeDomain || !data) return

    const bands = getBands(data, data.length)
    const lines = 3
    const colors = [
      { h: 200 + bands.low * 30, s: 80, l: 55 },
      { h: 230 + bands.mid * 20, s: 75, l: 60 },
      { h: 260 + bands.high * 25, s: 70, l: 65 }
    ]

    for (let l = 0; l < lines; l++) {
      const offsetY = (h / (lines + 1)) * (l + 1)
      const c = colors[l]

      // Filled area under the wave
      ctx.value.beginPath()
      const wavePoints = []
      for (let x = 0; x <= w; x += 3) {
        const i = Math.floor((x / w) * timeDomain.length)
        const v = (timeDomain[i] - 128) / 128
        const y = offsetY + v * (h * 0.18 * ampMul) * (0.6 + l * 0.25)
        wavePoints.push({ x, y })
      }

      // Draw filled gradient area
      const fillGrad = ctx.value.createLinearGradient(0, offsetY - h * 0.15, 0, offsetY + h * 0.15)
      fillGrad.addColorStop(0, `hsla(${c.h}, ${c.s}%, ${c.l}%, 0.0)`)
      fillGrad.addColorStop(0.5, `hsla(${c.h}, ${c.s}%, ${c.l}%, 0.08)`)
      fillGrad.addColorStop(1, `hsla(${c.h}, ${c.s}%, ${c.l}%, 0.0)`)

      ctx.value.beginPath()
      ctx.value.moveTo(0, offsetY)
      for (let p = 0; p < wavePoints.length - 1; p++) {
        const cpx = (wavePoints[p].x + wavePoints[p + 1].x) / 2
        const cpy = (wavePoints[p].y + wavePoints[p + 1].y) / 2
        ctx.value.quadraticCurveTo(wavePoints[p].x, wavePoints[p].y, cpx, cpy)
      }
      ctx.value.lineTo(w, offsetY)
      ctx.value.closePath()
      ctx.value.fillStyle = fillGrad
      ctx.value.fill()

      // Draw the wave line with bezier curves
      ctx.value.beginPath()
      ctx.value.moveTo(wavePoints[0].x, wavePoints[0].y)
      for (let p = 0; p < wavePoints.length - 1; p++) {
        const cpx = (wavePoints[p].x + wavePoints[p + 1].x) / 2
        const cpy = (wavePoints[p].y + wavePoints[p + 1].y) / 2
        ctx.value.quadraticCurveTo(wavePoints[p].x, wavePoints[p].y, cpx, cpy)
      }
      ctx.value.lineWidth = (1.5 + l * 0.3) * glowMul
      ctx.value.strokeStyle = `hsla(${c.h}, ${c.s}%, ${c.l}%, 0.9)`
      ctx.value.stroke()
    }
  }

  // 3. Nebula — multi-color palette, varying sizes, organic movement
  const drawNebula = (w, h, cx, cy, t) => {
    const data = dataArray.value
    if (!data) return

    const count = Math.floor(220 + store.vizIntensity * 480)
    const bins = data.length
    const bands = getBands(data, bins)

    // Multi-color palette: blue, purple, pink, cyan
    const palette = [
      { h: 220, s: 85, l: 60 },
      { h: 270, s: 75, l: 60 },
      { h: 310, s: 70, l: 65 },
      { h: 190, s: 80, l: 55 }
    ]

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + t * 0.004
      const spiralR = (Math.sin(i * 0.05 + t * 0.02) * 0.5 + 0.5)
      const breathe = 1.0 + Math.sin(t * 0.015 + i * 0.1) * 0.08
      const r = spiralR * Math.min(cx, cy) * (0.4 + 0.5 * store.vizIntensity) * breathe
      const x = cx + Math.cos(a) * r
      const y = cy + Math.sin(a) * r

      const v = data[Math.floor((i + t) % bins)] / 255
      const rad = 1 + v * (3 + 5 * store.vizIntensity)

      const c = palette[i % palette.length]
      const brightness = c.l + v * 15
      ctx.value.beginPath()
      ctx.value.fillStyle = `hsla(${c.h + bands.mid * 20}, ${c.s}%, ${brightness}%, ${0.06 + v * (0.15 + 0.25 * store.vizIntensity)})`
      ctx.value.arc(x, y, rad, 0, Math.PI * 2)
      ctx.value.fill()
    }
  }

  // 4. Spectrum — enhanced glow, outer dots at ray tips
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

      const hue = (i / rays) * 360 + t * 0.3
      const saturation = 70 + v * 30
      const lightness = 50 + v * 20

      ctx.value.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.7 + v * 0.3})`

      ctx.value.beginPath()
      ctx.value.moveTo(cx, cy)
      const tipX = cx + Math.cos(a) * r
      const tipY = cy + Math.sin(a) * r
      ctx.value.lineTo(tipX, tipY)
      ctx.value.stroke()

      // Dot at ray tip for high values
      if (v > 0.5) {
        const dotSize = 1.5 + v * 2.5 * store.vizIntensity
        ctx.value.beginPath()
        ctx.value.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness + 15}%, ${v * 0.8})`
        ctx.value.arc(tipX, tipY, dotSize, 0, Math.PI * 2)
        ctx.value.fill()
      }

      // Glow effect at high intensity
      if (v > 0.7 && store.vizIntensity > 0.5) {
        ctx.value.globalAlpha = (v - 0.7) * 0.4
        ctx.value.lineWidth = Math.max(1.0, 1.4 * (0.7 + store.vizIntensity)) * 2.5
        ctx.value.beginPath()
        ctx.value.moveTo(cx, cy)
        ctx.value.lineTo(tipX, tipY)
        ctx.value.stroke()
        ctx.value.globalAlpha = 1.0
        ctx.value.lineWidth = Math.max(1.0, 1.4 * (0.7 + store.vizIntensity))
      }
    }
  }

  // 5. Orbits — gradient-colored per ring, accent dots at peaks
  const drawOrbits = (cx, cy, t) => {
    const data = dataArray.value
    if (!data) return

    const rings = 4 + Math.floor(store.vizIntensity * 3)
    const bins = data.length

    for (let rIdx = 1; rIdx <= rings; rIdx++) {
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

      // Color varies from warm inner to cool outer rings
      const hue = 200 + (rIdx / rings) * 60 + intensity * 30
      const sat = 70 + intensity * 25
      const lit = 50 + intensity * 20

      const segments = 64
      const points = []

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2 + t * 0.001 * (rIdx * 0.3)
        const binIndex = Math.floor((i / segments) * bins) % bins
        const segmentIntensity = data[binIndex] / 255

        const r = radius + segmentIntensity * 8 * (0.3 + store.vizIntensity * 0.7)
        points.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          v: segmentIntensity
        })
      }

      // Draw smooth ring
      ctx.value.beginPath()
      ctx.value.moveTo(points[0].x, points[0].y)
      for (let i = 0; i < points.length - 1; i++) {
        const cpx = (points[i].x + points[i + 1].x) / 2
        const cpy = (points[i].y + points[i + 1].y) / 2
        ctx.value.quadraticCurveTo(points[i].x, points[i].y, cpx, cpy)
      }
      ctx.value.closePath()
      ctx.value.lineWidth = 1.2 + store.vizIntensity * 1.8 + intensity * 1.5
      ctx.value.strokeStyle = `hsla(${hue}, ${sat}%, ${lit}%, 0.85)`
      ctx.value.stroke()

      // Accent dots at peaks
      for (let i = 0; i < points.length - 1; i += 4) {
        if (points[i].v > 0.65) {
          ctx.value.beginPath()
          ctx.value.fillStyle = `hsla(${hue}, ${sat}%, ${lit + 15}%, ${points[i].v * 0.7})`
          ctx.value.arc(points[i].x, points[i].y, 1.5 + points[i].v * 2.5 * store.vizIntensity, 0, Math.PI * 2)
          ctx.value.fill()
        }
      }

      // Glow for high intensity rings
      if (intensity > 0.6) {
        ctx.value.globalAlpha = (intensity - 0.6) * 0.4
        ctx.value.lineWidth = (1.2 + store.vizIntensity * 1.8) * 2
        ctx.value.strokeStyle = `hsla(${hue}, ${sat}%, ${lit + 10}%, 0.5)`
        ctx.value.beginPath()
        ctx.value.moveTo(points[0].x, points[0].y)
        for (let i = 0; i < points.length - 1; i++) {
          const cpx = (points[i].x + points[i + 1].x) / 2
          const cpy = (points[i].y + points[i + 1].y) / 2
          ctx.value.quadraticCurveTo(points[i].x, points[i].y, cpx, cpy)
        }
        ctx.value.closePath()
        ctx.value.stroke()
        ctx.value.globalAlpha = 1.0
      }
    }
  }

  // 6. Starfield — star trails, depth-based sizing, color temperature
  const drawStarfield = (cx, cy, t) => {
    const data = dataArray.value
    if (!data) return

    const count = Math.floor(200 + 600 * store.vizIntensity)
    const bins = data.length
    const maxDist = Math.min(cx, cy) * (0.25 + 0.9 * store.vizIntensity)
    const speed = 0.02 * (0.6 + store.vizIntensity * 2.0)

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const progress = ((t * speed + i * 0.003) % 1)
      const d = progress * maxDist
      const x = cx + Math.cos(a) * d
      const y = cy + Math.sin(a) * d

      const v = data[Math.floor((i * 7 + t) % bins)] / 255

      // Depth-based sizing: farther stars are bigger
      const depthScale = 0.3 + progress * 0.7
      const size = (0.7 + v * (1.2 + 2.4 * store.vizIntensity)) * depthScale

      // Color temperature: inner = warm blue-white, outer = cool blue
      const hue = 210 + (1 - progress) * 30
      const lightness = 60 + v * 25 + progress * 10
      const alpha = (0.05 + v * (0.2 + 0.3 * store.vizIntensity)) * depthScale

      // Draw trail line for fast-moving stars
      if (progress > 0.15 && v > 0.3) {
        const trailLen = Math.min(d * 0.08, 8) * (0.5 + store.vizIntensity)
        const tx = cx + Math.cos(a) * (d - trailLen)
        const ty = cy + Math.sin(a) * (d - trailLen)
        ctx.value.beginPath()
        ctx.value.strokeStyle = `hsla(${hue}, 70%, ${lightness}%, ${alpha * 0.5})`
        ctx.value.lineWidth = size * 0.6
        ctx.value.moveTo(tx, ty)
        ctx.value.lineTo(x, y)
        ctx.value.stroke()
      }

      // Draw star dot
      ctx.value.beginPath()
      ctx.value.fillStyle = `hsla(${hue}, 70%, ${lightness}%, ${alpha})`
      ctx.value.arc(x, y, size, 0, Math.PI * 2)
      ctx.value.fill()
    }
  }

  // 7. Grid — HSL color variation, rounded cells
  const drawGrid = (w, h, t) => {
    const data = dataArray.value
    if (!data) return

    const cell = Math.max(8, Math.floor(Math.min(w, h) / (18 + 30 * (1 - store.vizIntensity))))
    const bins = data.length

    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const v = data[Math.floor(((x + y + t) % (w + h)) / (w + h) * bins)] / 255

        // HSL color based on frequency bin position
        const hue = 200 + v * 80 + ((x + y) / (w + h)) * 40
        const sat = 65 + v * 30
        const lit = 40 + v * 30
        const alpha = 0.06 + v * (0.25 + 0.25 * store.vizIntensity)

        ctx.value.fillStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${alpha})`
        const inset = (1 - v) * (cell * 0.35 * (0.2 + 0.8 * store.vizIntensity))
        const size = cell - inset * 2
        const r = Math.min(size * 0.2, 4)
        const sx = x + inset
        const sy = y + inset

        // Rounded rectangle
        ctx.value.beginPath()
        ctx.value.moveTo(sx + r, sy)
        ctx.value.lineTo(sx + size - r, sy)
        ctx.value.quadraticCurveTo(sx + size, sy, sx + size, sy + r)
        ctx.value.lineTo(sx + size, sy + size - r)
        ctx.value.quadraticCurveTo(sx + size, sy + size, sx + size - r, sy + size)
        ctx.value.lineTo(sx + r, sy + size)
        ctx.value.quadraticCurveTo(sx, sy + size, sx, sy + size - r)
        ctx.value.lineTo(sx, sy + r)
        ctx.value.quadraticCurveTo(sx, sy, sx + r, sy)
        ctx.value.closePath()
        ctx.value.fill()
      }
    }
  }

  // ============================================================
  // NEW VISUALIZERS
  // ============================================================

  // 8. Aurora — flowing northern lights curtains with gradient fills
  const drawAurora = (w, h, t) => {
    const data = dataArray.value
    if (!data) return

    const bins = data.length
    const bands = getBands(data, bins)
    const layers = 5 + Math.floor(store.vizIntensity * 3)

    // Aurora color palette: green, cyan, purple, pink
    const auroraColors = [
      { h: 140, s: 80, l: 55 },
      { h: 170, s: 75, l: 50 },
      { h: 200, s: 70, l: 55 },
      { h: 260, s: 65, l: 55 },
      { h: 290, s: 60, l: 60 },
      { h: 320, s: 55, l: 60 },
      { h: 150, s: 75, l: 50 },
      { h: 180, s: 70, l: 55 }
    ]

    for (let l = 0; l < layers; l++) {
      const layerRatio = l / layers
      const baseY = h * (0.2 + layerRatio * 0.5)
      const amplitude = h * (0.08 + 0.12 * store.vizIntensity) * (1 - layerRatio * 0.4)
      const c = auroraColors[l % auroraColors.length]

      // Build wave points
      const points = []
      const step = 4
      for (let x = 0; x <= w; x += step) {
        const binIdx = Math.floor((x / w) * bins) % bins
        const v = data[binIdx] / 255

        const wave1 = Math.sin(x * 0.008 + t * 0.012 + l * 1.2) * amplitude
        const wave2 = Math.sin(x * 0.015 + t * 0.008 - l * 0.7) * amplitude * 0.5
        const audioDisp = v * amplitude * 0.6 * (0.5 + store.vizIntensity)

        const y = baseY + wave1 + wave2 + audioDisp
        points.push({ x, y })
      }

      // Draw filled curtain
      const grad = ctx.value.createLinearGradient(0, baseY - amplitude, 0, baseY + amplitude * 2)
      const alpha = 0.04 + 0.06 * store.vizIntensity + bands.mid * 0.04
      grad.addColorStop(0, `hsla(${c.h}, ${c.s}%, ${c.l}%, 0)`)
      grad.addColorStop(0.3, `hsla(${c.h}, ${c.s}%, ${c.l}%, ${alpha})`)
      grad.addColorStop(0.6, `hsla(${c.h + 20}, ${c.s}%, ${c.l + 10}%, ${alpha * 1.2})`)
      grad.addColorStop(1, `hsla(${c.h}, ${c.s}%, ${c.l}%, 0)`)

      ctx.value.beginPath()
      ctx.value.moveTo(0, h)
      for (let i = 0; i < points.length - 1; i++) {
        const cpx = (points[i].x + points[i + 1].x) / 2
        const cpy = (points[i].y + points[i + 1].y) / 2
        ctx.value.quadraticCurveTo(points[i].x, points[i].y, cpx, cpy)
      }
      ctx.value.lineTo(w, h)
      ctx.value.closePath()
      ctx.value.fillStyle = grad
      ctx.value.fill()

      // Draw the bright edge line
      ctx.value.beginPath()
      ctx.value.moveTo(points[0].x, points[0].y)
      for (let i = 0; i < points.length - 1; i++) {
        const cpx = (points[i].x + points[i + 1].x) / 2
        const cpy = (points[i].y + points[i + 1].y) / 2
        ctx.value.quadraticCurveTo(points[i].x, points[i].y, cpx, cpy)
      }
      ctx.value.strokeStyle = `hsla(${c.h}, ${c.s}%, ${c.l + 15}%, ${0.15 + bands.high * 0.2})`
      ctx.value.lineWidth = 1.0 + store.vizIntensity * 1.5
      ctx.value.stroke()
    }
  }

  // 9. Kaleidoscope — rotational symmetry with reflected geometric patterns
  const drawKaleidoscope = (w, h, cx, cy, t) => {
    const data = dataArray.value
    if (!data) return

    const bins = data.length
    const bands = getBands(data, bins)
    const symmetry = 6 + Math.floor(store.vizIntensity * 4)
    const maxR = Math.min(cx, cy) * 0.9

    ctx.value.save()
    ctx.value.translate(cx, cy)

    for (let s = 0; s < symmetry; s++) {
      const baseAngle = (s / symmetry) * Math.PI * 2

      ctx.value.save()
      ctx.value.rotate(baseAngle + t * 0.003)

      // Draw mirrored pattern
      for (let mirror = 0; mirror < 2; mirror++) {
        ctx.value.save()
        if (mirror === 1) ctx.value.scale(1, -1)

        // Draw shapes along the segment
        const shapes = 8 + Math.floor(store.vizIntensity * 8)
        for (let i = 0; i < shapes; i++) {
          const binIdx = Math.floor((s * shapes + i) / (symmetry * shapes) * bins) % bins
          const v = data[binIdx] / 255
          const dist = (i / shapes) * maxR * (0.3 + 0.7 * v)

          const hue = (s / symmetry) * 360 + t * 0.5 + v * 60
          const alpha = 0.08 + v * (0.2 + 0.2 * store.vizIntensity)

          // Draw petal/diamond shapes
          const size = (3 + v * 12 * store.vizIntensity) * (0.5 + (i / shapes) * 0.5)
          const angle = (i / shapes) * 0.5 + Math.sin(t * 0.01 + i) * 0.1

          ctx.value.save()
          ctx.value.translate(dist * Math.cos(angle), dist * Math.sin(angle))
          ctx.value.rotate(t * 0.005 + i * 0.3)

          ctx.value.beginPath()
          ctx.value.fillStyle = `hsla(${hue}, ${70 + v * 25}%, ${50 + v * 20}%, ${alpha})`
          // Diamond shape
          ctx.value.moveTo(0, -size)
          ctx.value.quadraticCurveTo(size * 0.5, 0, 0, size)
          ctx.value.quadraticCurveTo(-size * 0.5, 0, 0, -size)
          ctx.value.fill()

          // Connecting line
          if (i > 0) {
            ctx.value.strokeStyle = `hsla(${hue}, 60%, 60%, ${alpha * 0.4})`
            ctx.value.lineWidth = 0.5 + v * store.vizIntensity
            ctx.value.beginPath()
            ctx.value.moveTo(0, 0)
            ctx.value.lineTo(-dist * 0.15, 0)
            ctx.value.stroke()
          }

          ctx.value.restore()
        }

        ctx.value.restore()
      }

      ctx.value.restore()
    }

    // Central glow
    const centerGlow = ctx.value.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.15)
    centerGlow.addColorStop(0, `hsla(${t * 0.5 % 360}, 80%, 70%, ${0.15 + bands.low * 0.2})`)
    centerGlow.addColorStop(1, 'hsla(0, 0%, 0%, 0)')
    ctx.value.fillStyle = centerGlow
    ctx.value.beginPath()
    ctx.value.arc(0, 0, maxR * 0.15, 0, Math.PI * 2)
    ctx.value.fill()

    ctx.value.restore()
  }

  // 10. Particles — physics-based particle system with bursts and gravity
  const drawParticles = (w, h, cx, cy, t) => {
    const data = dataArray.value
    if (!data) return

    const bins = data.length
    const bands = getBands(data, bins)

    // Compute overall energy to trigger bursts
    let energy = 0
    for (let i = 0; i < bins; i++) energy += data[i]
    energy /= (bins * 255)

    const maxParticles = Math.floor(300 + 500 * store.vizIntensity)

    // Spawn new particles on energy beats
    const spawnCount = Math.floor(energy * (3 + 8 * store.vizIntensity))
    for (let i = 0; i < spawnCount; i++) {
      if (particles.length >= maxParticles) break
      const angle = Math.random() * Math.PI * 2
      const speed = (1.5 + Math.random() * 3) * (0.5 + store.vizIntensity) * (0.5 + energy)
      const hue = 200 + Math.random() * 160 + bands.high * 60
      particles.push({
        x: cx + (Math.random() - 0.5) * 20,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1.0,
        decay: 0.005 + Math.random() * 0.01 + 0.005 * store.vizIntensity,
        size: 1.5 + Math.random() * 3 * store.vizIntensity,
        hue: hue,
        sat: 70 + Math.random() * 25,
        lit: 55 + Math.random() * 20
      })
    }

    // Update and draw particles
    const gravity = 0.03 + 0.02 * store.vizIntensity
    const drag = 0.995
    const alive = []

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]

      // Physics
      p.vy += gravity
      p.vx *= drag
      p.vy *= drag
      p.x += p.vx
      p.y += p.vy
      p.life -= p.decay

      if (p.life <= 0) continue
      if (p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) continue

      alive.push(p)

      // Draw particle with trail
      const alpha = p.life * (0.4 + 0.5 * store.vizIntensity)
      const trailLen = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 2

      if (trailLen > 1) {
        const nx = p.vx / trailLen * 2
        const ny = p.vy / trailLen * 2
        ctx.value.beginPath()
        ctx.value.strokeStyle = `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, ${alpha * 0.4})`
        ctx.value.lineWidth = p.size * 0.5 * p.life
        ctx.value.moveTo(p.x - nx * trailLen, p.y - ny * trailLen)
        ctx.value.lineTo(p.x, p.y)
        ctx.value.stroke()
      }

      // Draw particle body
      ctx.value.beginPath()
      ctx.value.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, ${alpha})`
      ctx.value.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.value.fill()
    }

    particles = alive
  }

  // ============================================================
  // Main draw loop
  // ============================================================
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
      case 'aurora':
        drawAurora(w, h, frameCounter)
        break
      case 'kaleidoscope':
        drawKaleidoscope(w, h, cx, cy, frameCounter)
        break
      case 'particles':
        drawParticles(w, h, cx, cy, frameCounter)
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
    particles = []
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
