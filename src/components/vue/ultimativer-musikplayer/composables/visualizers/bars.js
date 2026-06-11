import { glow, noGlow } from './utils.js'

export const drawBars = (ctx, w, h, cx, cy, dataArray, vizIntensity) => {
  const data = dataArray; if (!data) return
  const bars = Math.min(96, Math.floor(w / 5.5))
  const slot = w / bars
  const bw   = slot * 0.70
  const maxH = cy * 0.88

  ctx.globalCompositeOperation = 'source-over'
  for (let i = 0; i < bars; i++) {
    const bi  = Math.floor((i / bars) * data.length * 0.8)
    const v   = data[bi] / 255
    const bh  = v * maxH * (0.5 + vizIntensity * 0.9)
    if (bh < 1) continue
    const x   = i * slot + (slot - bw) / 2
    const hue = 200 + (i / bars) * 120
    const r   = Math.min(bw / 2, 4)

    const gr = ctx.createLinearGradient(x, cy - bh, x, cy + bh)
    gr.addColorStop(0,    `hsl(${hue + 25},95%,82%)`)
    gr.addColorStop(0.45, `hsl(${hue},85%,58%)`)
    gr.addColorStop(0.55, `hsl(${hue},85%,58%)`)
    gr.addColorStop(1,    `hsl(${hue + 25},95%,82%)`)

    ctx.save()
    glow(ctx, `hsl(${hue},90%,65%)`, 10 + vizIntensity * 14)
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
