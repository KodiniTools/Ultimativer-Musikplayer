import { ref, watch, onBeforeUnmount, computed } from 'vue'

export function useVisualizer(store, analyserRef, dataArrayRef, timeDomainArrayRef) {
  const canvas = ref(null)
  const ctx = ref(null)
  const animationFrameId = ref(null)
  const resizeObserver = ref(null)

  let frameCounter = 0
  let particles = []
  let peakHolds = []
  let lastEnergy = 0

  const analyser    = computed(() => typeof analyserRef       === 'function' ? analyserRef()       : analyserRef)
  const dataArray   = computed(() => typeof dataArrayRef      === 'function' ? dataArrayRef()      : dataArrayRef)
  const timeDomain  = computed(() => typeof timeDomainArrayRef === 'function' ? timeDomainArrayRef() : timeDomainArrayRef)

  // ── Canvas setup ────────────────────────────────────────────
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
    peakHolds = []
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

  // ── Helpers ──────────────────────────────────────────────────
  const getBands = (data) => {
    const n = data.length
    let lo = 0, mi = 0, hi = 0
    for (let i = 0; i < n; i++) {
      if      (i < n * 0.25) lo += data[i]
      else if (i < n * 0.70) mi += data[i]
      else                   hi += data[i]
    }
    return {
      low:  lo / (n * 0.25 * 255),
      mid:  mi / (n * 0.45 * 255),
      high: hi / (n * 0.30 * 255)
    }
  }

  const energy = (data) => {
    let e = 0
    for (let i = 0; i < data.length; i++) e += data[i]
    return e / (data.length * 255)
  }

  const c = ctx  // shorthand

  const glow = (color, blur) => {
    c.value.shadowColor = color
    c.value.shadowBlur  = blur
  }
  const noGlow = () => { c.value.shadowBlur = 0 }

  // ── 1. MIRROR BARS (ribbon) ──────────────────────────────────
  const drawBars = (w, h, cx, cy) => {
    const data = dataArray.value; if (!data) return
    const bars   = Math.min(96, Math.floor(w / 5.5))
    const slot   = w / bars
    const bw     = slot * 0.70
    const maxH   = cy * 0.88

    c.value.globalCompositeOperation = 'source-over'
    for (let i = 0; i < bars; i++) {
      const bi  = Math.floor((i / bars) * data.length * 0.8)
      const v   = data[bi] / 255
      const bh  = v * maxH * (0.5 + store.vizIntensity * 0.9)
      if (bh < 1) continue
      const x   = i * slot + (slot - bw) / 2
      const hue = 200 + (i / bars) * 120
      const r   = Math.min(bw / 2, 4)

      const gr = c.value.createLinearGradient(x, cy - bh, x, cy + bh)
      gr.addColorStop(0,    `hsl(${hue + 25},95%,82%)`)
      gr.addColorStop(0.45, `hsl(${hue},85%,58%)`)
      gr.addColorStop(0.55, `hsl(${hue},85%,58%)`)
      gr.addColorStop(1,    `hsl(${hue + 25},95%,82%)`)

      c.value.save()
      glow(`hsl(${hue},90%,65%)`, 10 + store.vizIntensity * 14)
      c.value.fillStyle = gr

      // upper
      c.value.beginPath()
      c.value.moveTo(x + r, cy - bh)
      c.value.lineTo(x + bw - r, cy - bh)
      c.value.quadraticCurveTo(x + bw, cy - bh, x + bw, cy - bh + r)
      c.value.lineTo(x + bw, cy)
      c.value.lineTo(x, cy)
      c.value.lineTo(x, cy - bh + r)
      c.value.quadraticCurveTo(x, cy - bh, x + r, cy - bh)
      c.value.closePath()
      c.value.fill()

      // mirror
      c.value.globalAlpha = 0.32
      c.value.beginPath()
      c.value.moveTo(x, cy)
      c.value.lineTo(x + bw, cy)
      c.value.lineTo(x + bw, cy + bh - r)
      c.value.quadraticCurveTo(x + bw, cy + bh, x + bw - r, cy + bh)
      c.value.lineTo(x + r, cy + bh)
      c.value.quadraticCurveTo(x, cy + bh, x, cy + bh - r)
      c.value.closePath()
      c.value.fill()

      c.value.globalAlpha = 1
      noGlow()
      c.value.restore()
    }
  }

  // ── 2. LIQUID WAVE (waves) ────────────────────────────────────
  const drawLiquid = (w, h, cy) => {
    const td = timeDomain.value; const fd = dataArray.value
    if (!td || !fd) return
    const bands = getBands(fd)
    const amp   = cy * (0.18 + 0.22 * store.vizIntensity)

    const pts = []
    for (let x = 0; x <= w; x += 2) {
      const i = Math.floor((x / w) * td.length)
      pts.push({ x, y: cy + ((td[i] - 128) / 128) * amp })
    }

    const bezier = (arr) => {
      c.value.moveTo(arr[0].x, arr[0].y)
      for (let i = 1; i < arr.length - 1; i++) {
        c.value.quadraticCurveTo(arr[i].x, arr[i].y,
          (arr[i].x + arr[i+1].x) / 2, (arr[i].y + arr[i+1].y) / 2)
      }
    }

    // fill
    const fg = c.value.createLinearGradient(0, cy - amp, 0, cy + amp)
    fg.addColorStop(0,   `hsla(200,90%,65%,0)`)
    fg.addColorStop(0.4, `hsla(220,85%,60%,${0.09 + bands.mid * 0.18})`)
    fg.addColorStop(0.6, `hsla(245,80%,58%,${0.09 + bands.low * 0.14})`)
    fg.addColorStop(1,   `hsla(260,85%,65%,0)`)
    c.value.beginPath()
    c.value.moveTo(0, h)
    bezier(pts)
    c.value.lineTo(w, h)
    c.value.closePath()
    c.value.fillStyle = fg
    c.value.fill()

    // line
    c.value.save()
    glow('hsl(220,90%,70%)', 12 + store.vizIntensity * 10)
    const lg = c.value.createLinearGradient(0, 0, w, 0)
    lg.addColorStop(0,   `hsla(200,85%,70%,0.5)`)
    lg.addColorStop(0.5, `hsla(225,90%,78%,0.95)`)
    lg.addColorStop(1,   `hsla(260,80%,72%,0.5)`)
    c.value.strokeStyle = lg
    c.value.lineWidth   = 2 + store.vizIntensity * 1.5
    c.value.beginPath()
    bezier(pts)
    c.value.stroke()
    noGlow()
    c.value.restore()
  }

  // ── 3. PLASMA BLOBS (nebula) ──────────────────────────────────
  const drawPlasma = (w, h, cx, cy, t) => {
    const data = dataArray.value; if (!data) return
    const bands = getBands(data)
    const en    = energy(data)
    const count = 10 + Math.floor(store.vizIntensity * 14)
    const maxR  = Math.min(cx, cy)

    c.value.globalCompositeOperation = 'source-over'
    for (let i = 0; i < count; i++) {
      const ph  = (i / count) * Math.PI * 2
      const or  = maxR * (0.12 + 0.35 * store.vizIntensity) * (0.5 + bands.low * 0.8)
      const bx  = cx + Math.cos(ph + t * 0.007) * or
      const by  = cy + Math.sin(ph + t * 0.005) * or
      const bi  = Math.floor((i / count) * data.length)
      const v   = data[bi] / 255
      const br  = maxR * (0.18 + v * 0.5 * store.vizIntensity)
      const hue = (i / count) * 300 + t * 0.4
      const al  = 0.04 + v * (0.07 + 0.09 * store.vizIntensity)

      const bg = c.value.createRadialGradient(bx, by, 0, bx, by, br)
      bg.addColorStop(0,   `hsla(${hue},90%,72%,${al*2.2})`)
      bg.addColorStop(0.5, `hsla(${hue+25},85%,60%,${al})`)
      bg.addColorStop(1,   `hsla(${hue+50},80%,50%,0)`)
      c.value.fillStyle = bg
      c.value.beginPath()
      c.value.arc(bx, by, br, 0, Math.PI * 2)
      c.value.fill()
    }

    const cr = maxR * 0.08 * (0.8 + en * 1.8)
    const ch = (t * 0.7) % 360
    const cg = c.value.createRadialGradient(cx, cy, 0, cx, cy, cr)
    cg.addColorStop(0, `hsla(${ch},90%,92%,${0.25 + en * 0.5})`)
    cg.addColorStop(1, `hsla(${ch},85%,62%,0)`)
    c.value.fillStyle = cg
    c.value.beginPath()
    c.value.arc(cx, cy, cr, 0, Math.PI * 2)
    c.value.fill()
  }

  // ── 4. ARC SPECTRUM (spectrum) ────────────────────────────────
  const drawArcSpectrum = (w, h, cx, cy, t) => {
    const data = dataArray.value; if (!data) return
    const bars   = Math.floor(80 + store.vizIntensity * 120)
    const innerR = Math.min(cx, cy) * 0.20
    const outerM = Math.min(cx, cy) * 0.88

    c.value.save()
    c.value.translate(cx, cy)
    c.value.rotate(t * 0.0015)
    c.value.globalCompositeOperation = 'source-over'
    c.value.lineCap = 'round'

    for (let i = 0; i < bars; i++) {
      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2
      const bi    = Math.floor((i / bars) * data.length * 0.85)
      const v     = data[bi] / 255
      const len   = v * (outerM - innerR) * (0.45 + store.vizIntensity * 0.85)
      if (len < 1) continue
      const hue = (i / bars) * 360
      c.value.save()
      glow(`hsl(${hue},90%,65%)`, 5 + store.vizIntensity * 10)
      c.value.strokeStyle = `hsla(${hue},90%,65%,${0.55 + v * 0.45})`
      c.value.lineWidth   = Math.max(1.5, (Math.PI * 2 * innerR / bars) * 0.70)
      c.value.beginPath()
      c.value.moveTo(Math.cos(angle) * innerR,       Math.sin(angle) * innerR)
      c.value.lineTo(Math.cos(angle) * (innerR+len), Math.sin(angle) * (innerR+len))
      c.value.stroke()
      noGlow()
      c.value.restore()
    }

    c.value.save()
    glow(`hsl(${(t*0.4)%360},80%,70%)`, 10)
    c.value.strokeStyle = `hsla(${(t*0.4)%360},80%,70%,0.5)`
    c.value.lineWidth   = 1.5
    c.value.beginPath()
    c.value.arc(0, 0, innerR * 0.88, 0, Math.PI * 2)
    c.value.stroke()
    noGlow()
    c.value.restore()
    c.value.restore()
  }

  // ── 5. DNA HELIX (orbits) ─────────────────────────────────────
  const drawDNA = (w, h, cy, t) => {
    const data = dataArray.value; const td = timeDomain.value
    if (!data || !td) return
    const bands = getBands(data)
    const amp   = cy * (0.22 + 0.28 * store.vizIntensity) * (0.6 + bands.low * 0.8)
    const freq  = 2.5 + store.vizIntensity
    const spd   = t * 0.022
    const steps = Math.floor(w / 3)

    const pts1 = [], pts2 = []
    for (let i = 0; i <= steps; i++) {
      const x  = (i / steps) * w
      const ph = (i / steps) * Math.PI * 2 * freq + spd
      const bi = Math.floor((i / steps) * data.length)
      const am = (data[bi] / 255) * 0.25
      pts1.push({ x, y: cy + Math.sin(ph)            * amp * (1 + am) })
      pts2.push({ x, y: cy + Math.sin(ph + Math.PI)  * amp * (1 + am) })
    }

    c.value.save()
    c.value.globalCompositeOperation = 'source-over'

    const ri = Math.max(1, Math.floor(steps / 18))
    for (let i = 0; i < pts1.length; i += ri) {
      const v = data[Math.floor((i / pts1.length) * data.length)] / 255
      c.value.strokeStyle = `hsla(${180 + v*80},75%,70%,${0.1 + v*0.28})`
      c.value.lineWidth   = 1 + v * 1.5 * store.vizIntensity
      c.value.beginPath()
      c.value.moveTo(pts1[i].x, pts1[i].y)
      c.value.lineTo(pts2[i].x, pts2[i].y)
      c.value.stroke()
    }

    const strand = (pts, h1, h2) => {
      c.value.save()
      glow(`hsl(${h1},90%,65%)`, 7 + store.vizIntensity * 8)
      const sg = c.value.createLinearGradient(0, 0, w, 0)
      sg.addColorStop(0,   `hsla(${h1},90%,65%,0.25)`)
      sg.addColorStop(0.5, `hsla(${h2},90%,72%,0.95)`)
      sg.addColorStop(1,   `hsla(${h1},90%,65%,0.25)`)
      c.value.strokeStyle = sg
      c.value.lineWidth   = 2.5
      c.value.lineJoin    = 'round'
      c.value.beginPath()
      c.value.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length - 1; i++) {
        c.value.quadraticCurveTo(pts[i].x, pts[i].y,
          (pts[i].x+pts[i+1].x)/2, (pts[i].y+pts[i+1].y)/2)
      }
      c.value.stroke()
      noGlow()
      c.value.restore()
    }
    strand(pts1, 200, 225)
    strand(pts2, 280, 300)
    c.value.restore()
  }

  // ── 6. WARP TUNNEL (starfield) ────────────────────────────────
  const drawTunnel = (w, h, cx, cy, t) => {
    const data = dataArray.value; if (!data) return
    const en    = energy(data)
    const spd   = (0.8 + store.vizIntensity * 2.5 + en * 3) * 0.012
    const maxR  = Math.max(cx, cy) * 1.5
    const rings = 14 + Math.floor(store.vizIntensity * 10)

    c.value.globalCompositeOperation = 'source-over'

    for (let i = 0; i < rings; i++) {
      const phase = ((t * spd + i / rings) % 1.0)
      const r     = phase * maxR
      const alpha = Math.pow(1 - phase, 1.4) * (0.3 + 0.4 * store.vizIntensity)
      if (alpha < 0.01) continue
      const bi  = Math.floor((i / rings) * data.length * 0.7)
      const v   = data[bi] / 255
      const hue = ((i / rings) * 160 + t * 0.25) % 360

      c.value.save()
      glow(`hsl(${hue},85%,65%)`, 5 + store.vizIntensity * 8)
      c.value.strokeStyle = `hsla(${hue},85%,65%,${alpha * (0.4 + v * 0.6)})`
      c.value.lineWidth   = Math.max(0.8, (1 + phase * 3) * store.vizIntensity)
      c.value.beginPath()
      for (let j = 0; j <= 72; j++) {
        const a   = (j / 72) * Math.PI * 2
        const bj  = Math.floor((j / 72) * data.length)
        const wob = 1 + (data[bj] / 255) * 0.06 * store.vizIntensity
        const px  = cx + Math.cos(a) * r * wob
        const py  = cy + Math.sin(a) * r * wob
        j === 0 ? c.value.moveTo(px, py) : c.value.lineTo(px, py)
      }
      c.value.closePath()
      c.value.stroke()
      noGlow()
      c.value.restore()
    }

    const dr  = 3 + en * 14
    const dh  = (t * 0.4) % 360
    const dg  = c.value.createRadialGradient(cx, cy, 0, cx, cy, dr * 3)
    dg.addColorStop(0, `hsla(${dh},90%,96%,${0.7 + en * 0.3})`)
    dg.addColorStop(1, `hsla(${dh},85%,65%,0)`)
    c.value.fillStyle = dg
    c.value.beginPath()
    c.value.arc(cx, cy, dr * 3, 0, Math.PI * 2)
    c.value.fill()
  }

  // ── 7. LED EQUALIZER (grid) ───────────────────────────────────
  const drawEqualizer = (w, h) => {
    const data = dataArray.value; if (!data) return
    const bars    = Math.min(60, Math.floor(w / 9))
    const slotW   = w / bars
    const barW    = Math.floor(slotW * 0.72)
    const segCnt  = 28
    const segH    = Math.floor((h * 0.82) / segCnt)
    const segGap  = Math.max(1, Math.floor(segH * 0.22))
    const segNet  = segH - segGap
    const baseY   = h * 0.91

    if (peakHolds.length !== bars) peakHolds = new Float32Array(bars)
    c.value.globalCompositeOperation = 'source-over'

    for (let i = 0; i < bars; i++) {
      const bi   = Math.floor((i / bars) * data.length * 0.78)
      const v    = data[bi] / 255
      const lit  = Math.round(v * segCnt * (0.4 + store.vizIntensity * 0.8))
      const x    = Math.floor(i * slotW + (slotW - barW) / 2)

      for (let s = 0; s < lit; s++) {
        const sy    = baseY - (s + 1) * segH
        const ratio = s / segCnt
        const hue   = ratio < 0.60 ? 130 : ratio < 0.82 ? 55 : 0
        c.value.fillStyle = `hsla(${hue},90%,52%,${0.6 + ratio * 0.4})`
        c.value.fillRect(x, sy, barW, segNet)
      }

      if (lit > peakHolds[i]) peakHolds[i] = lit
      else peakHolds[i] = Math.max(0, peakHolds[i] - 0.8)

      const ps = Math.floor(peakHolds[i])
      if (ps > 1) {
        const py   = baseY - (ps + 1) * segH
        const pr   = ps / segCnt
        const phue = pr < 0.60 ? 130 : pr < 0.82 ? 55 : 0
        c.value.save()
        glow(`hsl(${phue},90%,65%)`, 6)
        c.value.fillStyle = `hsl(${phue},90%,76%)`
        c.value.fillRect(x, py, barW, segNet)
        noGlow()
        c.value.restore()
      }
    }
  }

  // ── 8. AURORA (aurora) ────────────────────────────────────────
  const drawAurora = (w, h, t) => {
    const data = dataArray.value; if (!data) return
    const bands  = getBands(data)
    const layers = 7 + Math.floor(store.vizIntensity * 4)
    const pal = [
      [130,85,50],[160,80,48],[195,75,52],[230,70,55],
      [260,68,55],[290,62,58],[320,58,60],[155,80,48],
      [185,75,52],[110,88,46]
    ]

    c.value.globalCompositeOperation = 'source-over'
    for (let l = 0; l < layers; l++) {
      const lr   = l / layers
      const baseY = h * (0.12 + lr * 0.60)
      const amp   = h * (0.055 + 0.13 * store.vizIntensity) * (1 - lr * 0.32)
      const [ch, cs, cl] = pal[l % pal.length]

      const pts = []
      for (let x = 0; x <= w; x += 3) {
        const bi = Math.floor((x / w) * data.length) % data.length
        const v  = data[bi] / 255
        const w1 = Math.sin(x * 0.006 + t * 0.010 + l * 1.25) * amp
        const w2 = Math.sin(x * 0.011 + t * 0.006 - l * 0.75) * amp * 0.38
        pts.push({ x, y: baseY + w1 + w2 + v * amp * 0.45 * (0.4 + store.vizIntensity) })
      }

      const al  = 0.025 + 0.065 * store.vizIntensity + bands.mid * 0.055
      const gr  = c.value.createLinearGradient(0, baseY - amp*1.6, 0, baseY + amp*2.6)
      gr.addColorStop(0,    `hsla(${ch},${cs}%,${cl}%,0)`)
      gr.addColorStop(0.32, `hsla(${ch},${cs}%,${cl}%,${al*1.1})`)
      gr.addColorStop(0.62, `hsla(${ch+20},${cs}%,${cl+8}%,${al*1.35})`)
      gr.addColorStop(1,    `hsla(${ch},${cs}%,${cl}%,0)`)

      const bezierPts = (arr) => {
        for (let i = 0; i < arr.length - 1; i++) {
          c.value.quadraticCurveTo(arr[i].x, arr[i].y,
            (arr[i].x+arr[i+1].x)/2, (arr[i].y+arr[i+1].y)/2)
        }
      }

      c.value.beginPath()
      c.value.moveTo(0, h)
      bezierPts(pts)
      c.value.lineTo(w, h)
      c.value.closePath()
      c.value.fillStyle = gr
      c.value.fill()

      c.value.save()
      glow(`hsl(${ch},${cs}%,${cl+22}%)`, 4 + store.vizIntensity * 6)
      c.value.strokeStyle = `hsla(${ch},${cs}%,${cl+22}%,${0.1 + bands.high * 0.22})`
      c.value.lineWidth   = 1 + store.vizIntensity * 1.4
      c.value.beginPath()
      c.value.moveTo(pts[0].x, pts[0].y)
      bezierPts(pts)
      c.value.stroke()
      noGlow()
      c.value.restore()
    }
  }

  // ── 9. MANDALA (kaleidoscope) ─────────────────────────────────
  const drawMandala = (w, h, cx, cy, t) => {
    const data = dataArray.value; if (!data) return
    const bands = getBands(data)
    const maxR  = Math.min(cx, cy) * 0.88

    c.value.save()
    c.value.translate(cx, cy)
    c.value.globalCompositeOperation = 'source-over'

    for (let layer = 0; layer < 3; layer++) {
      const lR    = maxR * (0.30 + layer * 0.32)
      const iR    = lR   * 0.28
      const rot   = t * 0.0018 * (layer % 2 === 0 ? 1 : -1.4)
      const hBase = (layer * 130 + t * 0.35) % 360
      const res   = 256
      const pts   = []

      for (let i = 0; i <= res; i++) {
        const angle = (i / res) * Math.PI * 2 + rot
        const bi    = Math.floor((i / res) * data.length) % data.length
        const v     = data[bi] / 255
        const r     = iR + v * (lR - iR) * (0.35 + store.vizIntensity * 0.85)
        pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r })
      }

      c.value.save()
      glow(`hsl(${hBase},85%,65%)`, 7 + store.vizIntensity * 10)
      c.value.beginPath()
      c.value.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length - 1; i++) {
        c.value.quadraticCurveTo(pts[i].x, pts[i].y,
          (pts[i].x+pts[i+1].x)/2, (pts[i].y+pts[i+1].y)/2)
      }
      c.value.closePath()

      const al  = 0.10 + store.vizIntensity * 0.13 + bands.mid * 0.10
      const fg  = c.value.createRadialGradient(0, 0, iR*0.4, 0, 0, lR)
      fg.addColorStop(0,   `hsla(${hBase},     85%,65%,${al*0.55})`)
      fg.addColorStop(0.5, `hsla(${hBase+40},  80%,60%,${al})`)
      fg.addColorStop(1,   `hsla(${hBase+80},  75%,55%,${al*0.3})`)
      c.value.fillStyle   = fg
      c.value.fill()
      c.value.strokeStyle = `hsla(${hBase+20},85%,70%,${0.28 + bands.high * 0.3})`
      c.value.lineWidth   = 0.7 + store.vizIntensity * 1.1
      c.value.stroke()
      noGlow()
      c.value.restore()
    }

    const cr  = Math.min(cx, cy) * 0.055 * (1 + bands.low * 1.6)
    const ch2 = (t * 0.55) % 360
    const cg2 = c.value.createRadialGradient(0, 0, 0, 0, 0, cr)
    cg2.addColorStop(0, `hsla(${ch2},90%,88%,${0.35 + bands.low * 0.45})`)
    cg2.addColorStop(1, `hsla(${ch2},85%,60%,0)`)
    c.value.fillStyle = cg2
    c.value.beginPath()
    c.value.arc(0, 0, cr, 0, Math.PI * 2)
    c.value.fill()
    c.value.restore()
  }

  // ── 10. SPARKS (particles) ────────────────────────────────────
  const drawSparks = (w, h, cx, cy) => {
    const data = dataArray.value; if (!data) return
    const bands = getBands(data)
    const en    = energy(data)
    const beat  = en - lastEnergy > 0.038 * (1.6 - store.vizIntensity)
    lastEnergy  = en * 0.75 + lastEnergy * 0.25

    const maxP  = Math.floor(180 + 420 * store.vizIntensity)
    const spawn = Math.floor(en * (2 + 7 * store.vizIntensity)) + (beat ? Math.floor(10 + 14 * store.vizIntensity) : 0)

    for (let i = 0; i < spawn && particles.length < maxP; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * (beat ? 1.4 : 0.5)
      const spd   = (1.8 + Math.random() * 4.5) * (0.5 + store.vizIntensity) * (0.4 + en * 1.8)
      const hue   = beat ? 35 + Math.random() * 35 : 195 + Math.random() * 150
      particles.push({
        x: cx + (Math.random() - 0.5) * 25 * (beat ? 2.5 : 1),
        y: cy + (Math.random() - 0.5) * 15,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 1.0,
        decay: 0.007 + Math.random() * 0.013 + 0.005 * store.vizIntensity,
        size: (beat ? 2.2 : 1.2) + Math.random() * 2.8 * store.vizIntensity,
        hue, sat: 80 + Math.random() * 18, lit: 55 + Math.random() * 22
      })
    }

    const gravity = 0.038 + 0.028 * store.vizIntensity
    const alive   = []
    c.value.globalCompositeOperation = 'lighter'

    for (const p of particles) {
      p.vy += gravity; p.vx *= 0.994; p.vy *= 0.994
      p.x  += p.vx;   p.y  += p.vy;  p.life -= p.decay
      if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y > h + 20) continue
      alive.push(p)
      const al  = p.life * (0.45 + 0.4 * store.vizIntensity)
      const spd2 = Math.hypot(p.vx, p.vy)
      if (spd2 > 0.5) {
        const nx = p.vx / spd2, ny = p.vy / spd2
        const tl = Math.min(spd2 * 2.5, 14)
        c.value.strokeStyle = `hsla(${p.hue},${p.sat}%,${p.lit}%,${al*0.32})`
        c.value.lineWidth   = p.size * 0.55 * p.life
        c.value.beginPath()
        c.value.moveTo(p.x - nx*tl, p.y - ny*tl)
        c.value.lineTo(p.x, p.y)
        c.value.stroke()
      }
      c.value.fillStyle = `hsla(${p.hue},${p.sat}%,${p.lit+15}%,${al})`
      c.value.beginPath()
      c.value.arc(p.x, p.y, Math.max(0.4, p.size * p.life), 0, Math.PI * 2)
      c.value.fill()
    }
    particles = alive
    c.value.globalCompositeOperation = 'source-over'
  }

  // ── Main draw loop ───────────────────────────────────────────
  const TRAIL = {
    ribbon: 0, waves: 0, nebula: 0.16, spectrum: 0.12,
    orbits: 0, starfield: 0.10, grid: 0, aurora: 0.14,
    kaleidoscope: 0.13, particles: 0.10
  }

  const draw = () => {
    if (!analyser.value || !ctx.value || !canvas.value) return
    if (!dataArray.value || !timeDomain.value) return

    analyser.value.getByteFrequencyData(dataArray.value)
    analyser.value.getByteTimeDomainData(timeDomain.value)

    const w  = _cssW || canvas.value.width
    const h  = _cssH || canvas.value.height
    const cx = w / 2
    const cy = h / 2
    const mode = store.vizMode

    // background
    const trail = TRAIL[mode] ?? 0
    c.value.globalCompositeOperation = 'source-over'
    if (trail > 0) {
      c.value.fillStyle = `rgba(0,0,0,${trail})`
    } else {
      c.value.fillStyle = '#000'
    }
    c.value.fillRect(0, 0, w, h)

    switch (mode) {
      case 'ribbon':       drawBars(w, h, cx, cy);              break
      case 'waves':        drawLiquid(w, h, cy);                break
      case 'nebula':       drawPlasma(w, h, cx, cy, frameCounter); break
      case 'spectrum':     drawArcSpectrum(w, h, cx, cy, frameCounter); break
      case 'orbits':       drawDNA(w, h, cy, frameCounter);     break
      case 'starfield':    drawTunnel(w, h, cx, cy, frameCounter); break
      case 'grid':         drawEqualizer(w, h);                 break
      case 'aurora':       drawAurora(w, h, frameCounter);      break
      case 'kaleidoscope': drawMandala(w, h, cx, cy, frameCounter); break
      case 'particles':    drawSparks(w, h, cx, cy);            break
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
    particles    = []
    peakHolds    = []
    lastEnergy   = 0
  }

  watch(() => store.isPlaying, (playing) => { playing ? start() : stop() })

  onBeforeUnmount(() => {
    stop()
    if (resizeObserver.value) resizeObserver.value.disconnect()
    else window.removeEventListener('resize', resizeCanvas)
  })

  return { initCanvas, start, stop, reset }
}
