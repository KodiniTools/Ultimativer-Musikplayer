import { glow, noGlow } from './utils.js'

export const drawArcSpectrum = (ctx, w, h, cx, cy, t, dataArray, vizIntensity) => {
  const data = dataArray; if (!data) return
  const bars   = Math.floor(80 + vizIntensity * 120)
  const innerR = Math.min(cx, cy) * 0.20
  const outerM = Math.min(cx, cy) * 0.88

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(t * 0.0015)
  ctx.globalCompositeOperation = 'source-over'
  ctx.lineCap = 'round'

  for (let i = 0; i < bars; i++) {
    const angle = (i / bars) * Math.PI * 2 - Math.PI / 2
    const bi    = Math.floor((i / bars) * data.length * 0.85)
    const v     = data[bi] / 255
    const len   = v * (outerM - innerR) * (0.45 + vizIntensity * 0.85)
    if (len < 1) continue
    const hue = (i / bars) * 360
    ctx.save()
    glow(ctx, `hsl(${hue},90%,65%)`, 5 + vizIntensity * 10)
    ctx.strokeStyle = `hsla(${hue},90%,65%,${0.55 + v * 0.45})`
    ctx.lineWidth   = Math.max(1.5, (Math.PI * 2 * innerR / bars) * 0.70)
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * innerR,       Math.sin(angle) * innerR)
    ctx.lineTo(Math.cos(angle) * (innerR+len), Math.sin(angle) * (innerR+len))
    ctx.stroke()
    noGlow(ctx)
    ctx.restore()
  }

  ctx.save()
  glow(ctx, `hsl(${(t * 0.4) % 360},80%,70%)`, 10)
  ctx.strokeStyle = `hsla(${(t * 0.4) % 360},80%,70%,0.5)`
  ctx.lineWidth   = 1.5
  ctx.beginPath()
  ctx.arc(0, 0, innerR * 0.88, 0, Math.PI * 2)
  ctx.stroke()
  noGlow(ctx)
  ctx.restore()
  ctx.restore()
}
