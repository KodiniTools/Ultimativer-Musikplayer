import { getBands, glow, noGlow, smoothCurve } from './utils.js'

// Schwarz-Gold: Schleier von Kupfer über Gold bis Hellgelb
const PALETTE = [
  [44, 70, 50],
  [38, 65, 46],
  [48, 82, 58],
  [34, 60, 42],
  [42, 72, 52],
  [50, 88, 62],
  [36, 62, 44],
  [46, 76, 55],
  [40, 68, 48],
  [32, 58, 40],
]

export const drawAurora = (ctx, w, h, t, dataArray, vizIntensity) => {
  const data = dataArray
  if (!data) return
  const bands = getBands(data)
  const layers = 7 + Math.floor(vizIntensity * 4)

  ctx.globalCompositeOperation = 'source-over'
  for (let l = 0; l < layers; l++) {
    const lr = l / layers
    const baseY = h * (0.12 + lr * 0.6)
    const amp = h * (0.055 + 0.13 * vizIntensity) * (1 - lr * 0.32)
    const [ch, cs, cl] = PALETTE[l % PALETTE.length]

    const pts = []
    for (let x = 0; x <= w; x += 3) {
      const bi = Math.floor((x / w) * data.length) % data.length
      const v = data[bi] / 255
      const w1 = Math.sin(x * 0.006 + t * 0.01 + l * 1.25) * amp
      const w2 = Math.sin(x * 0.011 + t * 0.006 - l * 0.75) * amp * 0.38
      pts.push({ x, y: baseY + w1 + w2 + v * amp * 0.45 * (0.4 + vizIntensity) })
    }

    const al = 0.025 + 0.065 * vizIntensity + bands.mid * 0.055
    const gr = ctx.createLinearGradient(0, baseY - amp * 1.6, 0, baseY + amp * 2.6)
    gr.addColorStop(0, `hsla(${ch},${cs}%,${cl}%,0)`)
    gr.addColorStop(0.32, `hsla(${ch},${cs}%,${cl}%,${al * 1.1})`)
    gr.addColorStop(0.62, `hsla(${ch + 4},${cs}%,${cl + 8}%,${al * 1.35})`)
    gr.addColorStop(1, `hsla(${ch},${cs}%,${cl}%,0)`)

    ctx.beginPath()
    ctx.moveTo(0, h)
    smoothCurve(ctx, pts, 0)
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fillStyle = gr
    ctx.fill()

    ctx.save()
    glow(ctx, `hsl(${ch},${cs}%,${cl + 22}%)`, 4 + vizIntensity * 6)
    ctx.strokeStyle = `hsla(${ch},${cs}%,${cl + 22}%,${0.1 + bands.high * 0.22})`
    ctx.lineWidth = 1 + vizIntensity * 1.4
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    smoothCurve(ctx, pts, 0)
    ctx.stroke()
    noGlow(ctx)
    ctx.restore()
  }
}
