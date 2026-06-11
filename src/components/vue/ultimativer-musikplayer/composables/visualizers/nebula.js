import { getBands, energy } from './utils.js'

export const drawPlasma = (ctx, w, h, cx, cy, t, dataArray, vizIntensity) => {
  const data = dataArray; if (!data) return
  const bands = getBands(data)
  const en    = energy(data)
  const count = 10 + Math.floor(vizIntensity * 14)
  const maxR  = Math.min(cx, cy)

  ctx.globalCompositeOperation = 'source-over'
  for (let i = 0; i < count; i++) {
    const ph  = (i / count) * Math.PI * 2
    const or  = maxR * (0.12 + 0.35 * vizIntensity) * (0.5 + bands.low * 0.8)
    const bx  = cx + Math.cos(ph + t * 0.007) * or
    const by  = cy + Math.sin(ph + t * 0.005) * or
    const bi  = Math.floor((i / count) * data.length)
    const v   = data[bi] / 255
    const br  = maxR * (0.18 + v * 0.5 * vizIntensity)
    const hue = (i / count) * 300 + t * 0.4
    const al  = 0.04 + v * (0.07 + 0.09 * vizIntensity)

    const bg = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    bg.addColorStop(0,   `hsla(${hue},90%,72%,${al * 2.2})`)
    bg.addColorStop(0.5, `hsla(${hue + 25},85%,60%,${al})`)
    bg.addColorStop(1,   `hsla(${hue + 50},80%,50%,0)`)
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
  }

  const cr = maxR * 0.08 * (0.8 + en * 1.8)
  const ch = (t * 0.7) % 360
  const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr)
  cg.addColorStop(0, `hsla(${ch},90%,92%,${0.25 + en * 0.5})`)
  cg.addColorStop(1, `hsla(${ch},85%,62%,0)`)
  ctx.fillStyle = cg
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, Math.PI * 2)
  ctx.fill()
}
