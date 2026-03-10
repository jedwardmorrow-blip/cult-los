import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  color: string
  size: number
  rotation: number
  dx: number
  dy: number
}

const COLORS = ['#C8A84B', '#52B788', '#F0B429', '#E07070', '#F0F0F0']

export function useConfetti() {
  const [active, setActive] = useState(false)

  function fire() {
    setActive(true)
    setTimeout(() => setActive(false), 2500)
  }

  return { active, fire }
}

export function ConfettiOverlay({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!active) { setParticles([]); return }

    const newParticles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 50,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      dx: (Math.random() - 0.5) * 6,
      dy: -(2 + Math.random() * 4),
    }))
    setParticles(newParticles)
  }, [active])

  if (!active || particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti-pop"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
            animation: `confettiFall 2s ease-out forwards`,
            animationDelay: `${Math.random() * 0.3}s`,
            ['--dx' as any]: `${p.dx * 15}vw`,
            ['--dy' as any]: `${p.dy * 15}vh`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translate(var(--dx), calc(var(--dy) + 60vh)) rotate(720deg) scale(0.3); }
        }
      `}</style>
    </div>
  )
}
