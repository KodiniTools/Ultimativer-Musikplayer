import { getBands, glow, noGlow } from './utils.js'

const strand = (ctx, w, pts, h1, h2, vizIntensity) => {
  ctx.save()
  glow(ctx, `hsl(${h1},90%,65%)`, 7 + vizIntensity * 8)
  const sg = ctx.createLinearGradient(0, 0, w, 0)
  sg.addColorStop(0,   `hsla(${h1},90%,65%,0.25)`)
  sg.addColorStop(0.5, `hsla(${h2},90%,72%,0.95)`)
  sg.addColorStop(1,   `hsla(${h1},90%,65%,0.25)`)
  ctx.strokeStyle = sg
  ctx.lineWidth   = 2.5
  ctx.lineJoin    = 'round'
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length - 1; i++) {
    ctx.quadraticCurveTo(
      pts[i].x, pts[i].y,
      (pts[i].x + pts[i + 1].x) / 2,
      (pts[i].y + pts[i + 1].y) / 2
    )
  }
  ctx.stroke()
  noGlow(ctx)
  ctx.restore()
}

export const drawDNA = (ctx, w, h, cy, t, dataArray, timeDomainArray, vizIntensity) => {
  const data = dataArray; const td = timeDomainArray
  if (!data || !td) return
  const bands = getBands(data)
  const amp   = cy * (0.22 + 0.28 * vizIntensity) * (0.6 + bands.low * 0.8)
  const freq  = 2.5 + vizIntensity
  const spd   = t * 0.022
  const steps = Math.floor(w / 3)

  const pts1 = [], pts2 = []
  for (let i = 0; i <= steps; i++) {
    const x  = (i / steps) * w
    const ph = (i / steps) * Math.PI * 2 * freq + spd
    const bi = Math.floor((i / steps) * data.length)
    const am = (data[bi] / 255) * 0.25
    pts1.push({ x, y: cy + Math.sin(ph)           * amp * (1 + am) })
    pts2.push({ x, y: cy + Math.sin(ph + Math.PI) * amp * (1 + am) })
  }

  ctx.save()
  ctx.globalCompositeOperation = 'source-over'

  const ri = Math.max(1, Math.floor(steps / 18))
  for (let i = 0; i < pts1.length; i += ri) {
    const v = data[Math.floor((i / pts1.length) * data.length)] / 255
    ctx.strokeStyle = `hsla(${180 + v * 80},75%,70%,${0.1 + v * 0.28})`
    ctx.lineWidth   = 1 + v * 1.5 * vizIntensity
    ctx.beginPath()
    ctx.moveTo(pts1[i].x, pts1[i].y)
    ctx.lineTo(pts2[i].x, pts2[i].y)
    ctx.stroke()
  }

  strand(ctx, w, pts1, 200, 225, vizIntensity)
  strand(ctx, w, pts2, 280, 300, vizIntensity)
  ctx.restore()
}
