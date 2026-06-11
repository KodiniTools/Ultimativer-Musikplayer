import { energy } from './utils.js'

export const drawSparks = (ctx, w, h, cx, cy, dataArray, vizIntensity, state) => {
  const data = dataArray; if (!data) return
  const en   = energy(data)
  const beat = en - state.lastEnergy > 0.038 * (1.6 - vizIntensity)
  state.lastEnergy = en * 0.75 + state.lastEnergy * 0.25

  const maxP  = Math.floor(180 + 420 * vizIntensity)
  const spawn = Math.floor(en * (2 + 7 * vizIntensity)) +
                (beat ? Math.floor(10 + 14 * vizIntensity) : 0)

  for (let i = 0; i < spawn && state.particles.length < maxP; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * (beat ? 1.4 : 0.5)
    const spd   = (1.8 + Math.random() * 4.5) * (0.5 + vizIntensity) * (0.4 + en * 1.8)
    const hue   = beat ? 35 + Math.random() * 35 : 195 + Math.random() * 150
    state.particles.push({
      x: cx + (Math.random() - 0.5) * 25 * (beat ? 2.5 : 1),
      y: cy + (Math.random() - 0.5) * 15,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1.0,
      decay: 0.007 + Math.random() * 0.013 + 0.005 * vizIntensity,
      size: (beat ? 2.2 : 1.2) + Math.random() * 2.8 * vizIntensity,
      hue, sat: 80 + Math.random() * 18, lit: 55 + Math.random() * 22,
    })
  }

  const gravity = 0.038 + 0.028 * vizIntensity
  const alive   = []
  ctx.globalCompositeOperation = 'lighter'

  for (const p of state.particles) {
    p.vy += gravity; p.vx *= 0.994; p.vy *= 0.994
    p.x  += p.vx;   p.y  += p.vy;  p.life -= p.decay
    if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y > h + 20) continue
    alive.push(p)
    const al   = p.life * (0.45 + 0.4 * vizIntensity)
    const spd2 = Math.hypot(p.vx, p.vy)
    if (spd2 > 0.5) {
      const nx = p.vx / spd2, ny = p.vy / spd2
      const tl = Math.min(spd2 * 2.5, 14)
      ctx.strokeStyle = `hsla(${p.hue},${p.sat}%,${p.lit}%,${al * 0.32})`
      ctx.lineWidth   = p.size * 0.55 * p.life
      ctx.beginPath()
      ctx.moveTo(p.x - nx * tl, p.y - ny * tl)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    }
    ctx.fillStyle = `hsla(${p.hue},${p.sat}%,${p.lit + 15}%,${al})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, Math.max(0.4, p.size * p.life), 0, Math.PI * 2)
    ctx.fill()
  }
  state.particles = alive
  ctx.globalCompositeOperation = 'source-over'
}
