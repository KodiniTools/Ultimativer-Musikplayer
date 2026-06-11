import { getBands, glow, noGlow } from './utils.js'

export const drawMandala = (ctx, w, h, cx, cy, t, dataArray, vizIntensity) => {
  const data = dataArray; if (!data) return
  const bands = getBands(data)
  const maxR  = Math.min(cx, cy) * 0.88

  ctx.save()
  ctx.translate(cx, cy)
  ctx.globalCompositeOperation = 'source-over'

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
      const r     = iR + v * (lR - iR) * (0.35 + vizIntensity * 0.85)
      pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r })
    }

    ctx.save()
    glow(ctx, `hsl(${hBase},85%,65%)`, 7 + vizIntensity * 10)
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length - 1; i++) {
      ctx.quadraticCurveTo(
        pts[i].x, pts[i].y,
        (pts[i].x + pts[i + 1].x) / 2,
        (pts[i].y + pts[i + 1].y) / 2
      )
    }
    ctx.closePath()

    const al = 0.10 + vizIntensity * 0.13 + bands.mid * 0.10
    const fg = ctx.createRadialGradient(0, 0, iR * 0.4, 0, 0, lR)
    fg.addColorStop(0,   `hsla(${hBase},     85%,65%,${al * 0.55})`)
    fg.addColorStop(0.5, `hsla(${hBase + 40},80%,60%,${al})`)
    fg.addColorStop(1,   `hsla(${hBase + 80},75%,55%,${al * 0.3})`)
    ctx.fillStyle   = fg
    ctx.fill()
    ctx.strokeStyle = `hsla(${hBase + 20},85%,70%,${0.28 + bands.high * 0.3})`
    ctx.lineWidth   = 0.7 + vizIntensity * 1.1
    ctx.stroke()
    noGlow(ctx)
    ctx.restore()
  }

  const cr  = Math.min(cx, cy) * 0.055 * (1 + bands.low * 1.6)
  const ch2 = (t * 0.55) % 360
  const cg2 = ctx.createRadialGradient(0, 0, 0, 0, 0, cr)
  cg2.addColorStop(0, `hsla(${ch2},90%,88%,${0.35 + bands.low * 0.45})`)
  cg2.addColorStop(1, `hsla(${ch2},85%,60%,0)`)
  ctx.fillStyle = cg2
  ctx.beginPath()
  ctx.arc(0, 0, cr, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
