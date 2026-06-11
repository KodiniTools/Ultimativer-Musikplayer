import { energy, glow, noGlow } from './utils.js'

export const drawTunnel = (ctx, w, h, cx, cy, t, dataArray, vizIntensity) => {
  const data = dataArray; if (!data) return
  const en   = energy(data)
  const spd  = (0.8 + vizIntensity * 2.5 + en * 3) * 0.012
  const maxR = Math.max(cx, cy) * 1.5
  const rings = 14 + Math.floor(vizIntensity * 10)

  ctx.globalCompositeOperation = 'source-over'

  for (let i = 0; i < rings; i++) {
    const phase = ((t * spd + i / rings) % 1.0)
    const r     = phase * maxR
    const alpha = Math.pow(1 - phase, 1.4) * (0.3 + 0.4 * vizIntensity)
    if (alpha < 0.01) continue
    const bi  = Math.floor((i / rings) * data.length * 0.7)
    const v   = data[bi] / 255
    const hue = ((i / rings) * 160 + t * 0.25) % 360

    ctx.save()
    glow(ctx, `hsl(${hue},85%,65%)`, 5 + vizIntensity * 8)
    ctx.strokeStyle = `hsla(${hue},85%,65%,${alpha * (0.4 + v * 0.6)})`
    ctx.lineWidth   = Math.max(0.8, (1 + phase * 3) * vizIntensity)
    ctx.beginPath()
    for (let j = 0; j <= 72; j++) {
      const a   = (j / 72) * Math.PI * 2
      const bj  = Math.floor((j / 72) * data.length)
      const wob = 1 + (data[bj] / 255) * 0.06 * vizIntensity
      const px  = cx + Math.cos(a) * r * wob
      const py  = cy + Math.sin(a) * r * wob
      j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()
    noGlow(ctx)
    ctx.restore()
  }

  const dr = 3 + en * 14
  const dh = (t * 0.4) % 360
  const dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, dr * 3)
  dg.addColorStop(0, `hsla(${dh},90%,96%,${0.7 + en * 0.3})`)
  dg.addColorStop(1, `hsla(${dh},85%,65%,0)`)
  ctx.fillStyle = dg
  ctx.beginPath()
  ctx.arc(cx, cy, dr * 3, 0, Math.PI * 2)
  ctx.fill()
}
