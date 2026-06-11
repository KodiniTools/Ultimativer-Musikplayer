export const getBands = (data) => {
  const n = data.length
  let lo = 0, mi = 0, hi = 0
  for (let i = 0; i < n; i++) {
    if      (i < n * 0.25) lo += data[i]
    else if (i < n * 0.70) mi += data[i]
    else                   hi += data[i]
  }
  return {
    low:  lo / (n * 0.25 * 255),
    mid:  mi / (n * 0.45 * 255),
    high: hi / (n * 0.30 * 255),
  }
}

export const energy = (data) => {
  let e = 0
  for (let i = 0; i < data.length; i++) e += data[i]
  return e / (data.length * 255)
}

export const glow = (ctx, color, blur) => {
  ctx.shadowColor = color
  ctx.shadowBlur  = blur
}

export const noGlow = (ctx) => { ctx.shadowBlur = 0 }
