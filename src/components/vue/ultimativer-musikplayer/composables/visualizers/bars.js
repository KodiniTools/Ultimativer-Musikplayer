import { glow, noGlow } from './utils.js'

export const drawBars = (ctx, w, h, cx, cy, dataArray, vizIntensity) => {
  const data = dataArray
  if (!data) return
  const bars = Math.min(96, Math.floor(w / 5.5))
  const slot = w / bars
  const bw = slot * 0.7
  const maxH = cy * 0.88

  ctx.globalCompositeOperation = 'source-over'
  for (let i = 0; i < bars; i++) {
    const bi = Math.floor((i / bars) * data.length * 0.8)
    const v = data[bi] / 255
    const bh = v * maxH * (0.5 + vizIntensity * 0.9)
    if (bh < 1) continue
    const x = i * slot + (slot - bw) / 2
    // Schwarz-Gold: Gold zur Mitte, hellgelbe Spitzen; rechts etwas dunkler
    const hue = 44 - (i / bars) * 8
    const lit = 56 - (i / bars) * 12
    const r = Math.min(bw / 2, 4)

    const gr = ctx.createLinearGradient(x, cy - bh, x, cy + bh)
    gr.addColorStop(0, `hsl(48,100%,77%)`)
    gr.addColorStop(0.45, `hsl(${hue},62%,${lit}%)`)
    gr.addColorStop(0.55, `hsl(${hue},62%,${lit}%)`)
    gr.addColorStop(1, `hsl(48,100%,77%)`)

    ctx.save()
    glow(ctx, `hsl(${hue},70%,50%)`, 4 + vizIntensity * 6)
    ctx.fillStyle = gr

    ctx.beginPath()
    ctx.moveTo(x + r, cy - bh)
    ctx.lineTo(x + bw - r, cy - bh)
    ctx.quadraticCurveTo(x + bw, cy - bh, x + bw, cy - bh + r)
    ctx.lineTo(x + bw, cy)
    ctx.lineTo(x, cy)
    ctx.lineTo(x, cy - bh + r)
    ctx.quadraticCurveTo(x, cy - bh, x + r, cy - bh)
    ctx.closePath()
    ctx.fill()

    ctx.globalAlpha = 0.32
    ctx.beginPath()
    ctx.moveTo(x, cy)
    ctx.lineTo(x + bw, cy)
    ctx.lineTo(x + bw, cy + bh - r)
    ctx.quadraticCurveTo(x + bw, cy + bh, x + bw - r, cy + bh)
    ctx.lineTo(x + r, cy + bh)
    ctx.quadraticCurveTo(x, cy + bh, x, cy + bh - r)
    ctx.closePath()
    ctx.fill()

    ctx.globalAlpha = 1
    noGlow(ctx)
    ctx.restore()
  }
}
