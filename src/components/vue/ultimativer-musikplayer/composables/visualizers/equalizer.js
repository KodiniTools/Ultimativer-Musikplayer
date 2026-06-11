import { glow, noGlow } from './utils.js'

export const drawEqualizer = (ctx, w, h, dataArray, vizIntensity, peakHolds) => {
  const data = dataArray; if (!data) return
  const bars   = Math.min(60, Math.floor(w / 9))
  const slotW  = w / bars
  const barW   = Math.floor(slotW * 0.72)
  const segCnt = 28
  const segH   = Math.floor((h * 0.82) / segCnt)
  const segGap = Math.max(1, Math.floor(segH * 0.22))
  const segNet = segH - segGap
  const baseY  = h * 0.91

  if (peakHolds.length !== bars) peakHolds.fill(0, 0, bars)
  ctx.globalCompositeOperation = 'source-over'

  for (let i = 0; i < bars; i++) {
    const bi  = Math.floor((i / bars) * data.length * 0.78)
    const v   = data[bi] / 255
    const lit = Math.round(v * segCnt * (0.4 + vizIntensity * 0.8))
    const x   = Math.floor(i * slotW + (slotW - barW) / 2)

    for (let s = 0; s < lit; s++) {
      const sy    = baseY - (s + 1) * segH
      const ratio = s / segCnt
      const hue   = ratio < 0.60 ? 130 : ratio < 0.82 ? 55 : 0
      ctx.fillStyle = `hsla(${hue},90%,52%,${0.6 + ratio * 0.4})`
      ctx.fillRect(x, sy, barW, segNet)
    }

    if (lit > peakHolds[i]) peakHolds[i] = lit
    else peakHolds[i] = Math.max(0, peakHolds[i] - 0.8)

    const ps = Math.floor(peakHolds[i])
    if (ps > 1) {
      const py   = baseY - (ps + 1) * segH
      const pr   = ps / segCnt
      const phue = pr < 0.60 ? 130 : pr < 0.82 ? 55 : 0
      ctx.save()
      glow(ctx, `hsl(${phue},90%,65%)`, 6)
      ctx.fillStyle = `hsl(${phue},90%,76%)`
      ctx.fillRect(x, py, barW, segNet)
      noGlow(ctx)
      ctx.restore()
    }
  }
}
