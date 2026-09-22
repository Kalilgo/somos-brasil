import confetti from 'canvas-confetti'
import { palette } from '@/styles/theme'

export function fireCelebration(bursts = 2) {
  const colors = [palette.coral, palette.verde, palette.mango, palette.sky, palette.grape]
  const defaults = { spread: 70, ticks: 160, gravity: 0.9, colors, scalar: 1.1 }

  for (let i = 0; i < bursts; i++) {
    setTimeout(() => {
      confetti({ ...defaults, particleCount: 60, angle: 60, origin: { x: 0, y: 0.7 } })
      confetti({ ...defaults, particleCount: 60, angle: 120, origin: { x: 1, y: 0.7 } })
    }, i * 260)
  }
}

export function fireMiniConfetti() {
  const colors = [palette.coral, palette.verde, palette.mango, palette.sky]
  confetti({
    particleCount: 40,
    spread: 55,
    scalar: 0.8,
    colors,
    origin: { x: 0.5, y: 0.65 },
  })
}