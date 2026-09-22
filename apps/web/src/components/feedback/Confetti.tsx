import confetti from 'canvas-confetti'
import { palette } from '@/styles/theme'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function fireCelebration(bursts = 2) {
  if (prefersReducedMotion()) return
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
  if (prefersReducedMotion()) return
  const colors = [palette.coral, palette.verde, palette.mango, palette.sky]
  confetti({
    particleCount: 40,
    spread: 55,
    scalar: 0.8,
    colors,
    origin: { x: 0.5, y: 0.65 },
  })
}

export function fireBurstAt(clientX: number, clientY: number, strength = 12) {
  if (prefersReducedMotion()) return
  const colors = [palette.coral, palette.verde, palette.mango, palette.sky, palette.grape]
  confetti({
    particleCount: strength,
    spread: 70,
    scalar: 0.75,
    gravity: 0.85,
    colors,
    ticks: 120,
    origin: {
      x: Math.max(0.05, Math.min(0.95, clientX / Math.max(1, window.innerWidth))),
      y: Math.max(0.05, Math.min(0.9, clientY / Math.max(1, window.innerHeight))),
    },
  })
}