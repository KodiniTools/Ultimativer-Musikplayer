import { getBands, glow, noGlow, smoothCurve } from './utils.js'

const bezier = (ctx, arr) => {
  ctx.moveTo(arr[0].x, arr[0].y)
  smoothCurve(ctx, arr)
}

export const drawLiquid = (ctx, w, h, cy, dataArray, timeDomainArray, vizIntensity) => {
  const td = timeDomainArray
  const fd = dataArray
  if (!td || !fd) return
  const bands = getBands(fd)
  const amp = cy * (0.18 + 0.22 * vizIntensity)

  const pts = []
  for (let x = 0; x <= w; x += 2) {
    const i = Math.floor((x / w) * td.length)
    pts.push({ x, y: cy + ((td[i] - 128) / 128) * amp })
  }

  const fg = ctx.createLinearGradient(0, cy - amp, 0, cy + amp)
  fg.addColorStop(0, `hsla(48,90%,65%,0)`)
  fg.addColorStop(0.4, `hsla(43,80%,55%,${0.09 + bands.mid * 0.18})`)
  fg.addColorStop(0.6, `hsla(36,75%,48%,${0.09 + bands.low * 0.14})`)
  fg.addColorStop(1, `hsla(30,70%,40%,0)`)
  ctx.beginPath()
  ctx.moveTo(0, h)
  bezier(ctx, pts)
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fillStyle = fg
  ctx.fill()

  ctx.save()
  glow(ctx, 'hsl(42,80%,55%)', 8 + vizIntensity * 8)
  const lg = ctx.createLinearGradient(0, 0, w, 0)
  lg.addColorStop(0, `hsla(38,75%,55%,0.5)`)
  lg.addColorStop(0.5, `hsla(48,100%,77%,0.95)`)
  lg.addColorStop(1, `hsla(38,75%,55%,0.5)`)
  ctx.strokeStyle = lg
  ctx.lineWidth = 2 + vizIntensity * 1.5
  ctx.beginPath()
  bezier(ctx, pts)
  ctx.stroke()
  noGlow(ctx)
  ctx.restore()
}
