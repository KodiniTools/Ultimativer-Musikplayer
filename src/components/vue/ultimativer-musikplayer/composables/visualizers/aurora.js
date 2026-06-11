import { getBands, glow, noGlow } from './utils.js'

const PALETTE = [
  [130, 85, 50], [160, 80, 48], [195, 75, 52], [230, 70, 55],
  [260, 68, 55], [290, 62, 58], [320, 58, 60], [155, 80, 48],
  [185, 75, 52], [110, 88, 46],
]

const bezierPts = (ctx, arr) => {
  for (let i = 0; i < arr.length - 1; i++) {
    ctx.quadraticCurveTo(
      arr[i].x, arr[i].y,
      (arr[i].x + arr[i + 1].x) / 2,
      (arr[i].y + arr[i + 1].y) / 2
    )
  }
}

export const drawAurora = (ctx, w, h, t, dataArray, vizIntensity) => {
  const data = dataArray; if (!data) return
  const bands  = getBands(data)
  const layers = 7 + Math.floor(vizIntensity * 4)

  ctx.globalCompositeOperation = 'source-over'
  for (let l = 0; l < layers; l++) {
    const lr    = l / layers
    const baseY = h * (0.12 + lr * 0.60)
    const amp   = h * (0.055 + 0.13 * vizIntensity) * (1 - lr * 0.32)
    const [ch, cs, cl] = PALETTE[l % PALETTE.length]

    const pts = []
    for (let x = 0; x <= w; x += 3) {
      const bi = Math.floor((x / w) * data.length) % data.length
      const v  = data[bi] / 255
      const w1 = Math.sin(x * 0.006 + t * 0.010 + l * 1.25) * amp
      const w2 = Math.sin(x * 0.011 + t * 0.006 - l * 0.75) * amp * 0.38
      pts.push({ x, y: baseY + w1 + w2 + v * amp * 0.45 * (0.4 + vizIntensity) })
    }

    const al = 0.025 + 0.065 * vizIntensity + bands.mid * 0.055
    const gr = ctx.createLinearGradient(0, baseY - amp * 1.6, 0, baseY + amp * 2.6)
    gr.addColorStop(0,    `hsla(${ch},${cs}%,${cl}%,0)`)
    gr.addColorStop(0.32, `hsla(${ch},${cs}%,${cl}%,${al * 1.1})`)
    gr.addColorStop(0.62, `hsla(${ch + 20},${cs}%,${cl + 8}%,${al * 1.35})`)
    gr.addColorStop(1,    `hsla(${ch},${cs}%,${cl}%,0)`)

    ctx.beginPath()
    ctx.moveTo(0, h)
    bezierPts(ctx, pts)
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fillStyle = gr
    ctx.fill()

    ctx.save()
    glow(ctx, `hsl(${ch},${cs}%,${cl + 22}%)`, 4 + vizIntensity * 6)
    ctx.strokeStyle = `hsla(${ch},${cs}%,${cl + 22}%,${0.1 + bands.high * 0.22})`
    ctx.lineWidth   = 1 + vizIntensity * 1.4
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    bezierPts(ctx, pts)
    ctx.stroke()
    noGlow(ctx)
    ctx.restore()
  }
}
