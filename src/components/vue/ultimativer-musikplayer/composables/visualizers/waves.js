import { getBands, glow, noGlow } from './utils.js'

const bezier = (ctx, arr) => {
  ctx.moveTo(arr[0].x, arr[0].y)
  for (let i = 1; i < arr.length - 1; i++) {
    ctx.quadraticCurveTo(
      arr[i].x, arr[i].y,
      (arr[i].x + arr[i + 1].x) / 2,
      (arr[i].y + arr[i + 1].y) / 2
    )
  }
}

export const drawLiquid = (ctx, w, h, cy, dataArray, timeDomainArray, vizIntensity) => {
  const td = timeDomainArray; const fd = dataArray
  if (!td || !fd) return
  const bands = getBands(fd)
  const amp   = cy * (0.18 + 0.22 * vizIntensity)

  const pts = []
  for (let x = 0; x <= w; x += 2) {
    const i = Math.floor((x / w) * td.length)
    pts.push({ x, y: cy + ((td[i] - 128) / 128) * amp })
  }

  const fg = ctx.createLinearGradient(0, cy - amp, 0, cy + amp)
  fg.addColorStop(0,   `hsla(200,90%,65%,0)`)
  fg.addColorStop(0.4, `hsla(220,85%,60%,${0.09 + bands.mid * 0.18})`)
  fg.addColorStop(0.6, `hsla(245,80%,58%,${0.09 + bands.low * 0.14})`)
  fg.addColorStop(1,   `hsla(260,85%,65%,0)`)
  ctx.beginPath()
  ctx.moveTo(0, h)
  bezier(ctx, pts)
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fillStyle = fg
  ctx.fill()

  ctx.save()
  glow(ctx, 'hsl(220,90%,70%)', 12 + vizIntensity * 10)
  const lg = ctx.createLinearGradient(0, 0, w, 0)
  lg.addColorStop(0,   `hsla(200,85%,70%,0.5)`)
  lg.addColorStop(0.5, `hsla(225,90%,78%,0.95)`)
  lg.addColorStop(1,   `hsla(260,80%,72%,0.5)`)
  ctx.strokeStyle = lg
  ctx.lineWidth   = 2 + vizIntensity * 1.5
  ctx.beginPath()
  bezier(ctx, pts)
  ctx.stroke()
  noGlow(ctx)
  ctx.restore()
}
