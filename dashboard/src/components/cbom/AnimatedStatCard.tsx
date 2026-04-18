import { useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  label: string
  value: number
  accentColor: string
  borderColor: string
  bgColor: string
  trend?: string
  trendUp?: boolean
  isActive?: boolean
  onClick?: () => void
  delay?: number
}

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  const ref = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) { setCount(0); return }
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCount(Math.round(eased * target))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [target, duration])

  return count
}

export default function AnimatedStatCard({
  icon, label, value, accentColor, borderColor, bgColor,
  trend, trendUp, isActive, onClick, delay = 0
}: Props) {
  const displayCount = useCountUp(value)

  return (
    <button
      onClick={onClick}
      className={`card-accent-left glass-card p-5 text-left cursor-pointer w-full animate-fade-in-up group ${
        isActive ? 'ring-2 ring-accent/20 shadow-lg shadow-accent/5' : ''
      }`}
      style={{
        borderLeftColor: borderColor,
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}
          style={{ backgroundColor: bgColor }}
        >
          <div style={{ color: accentColor }}>{icon}</div>
        </div>
        {trend && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            trendUp ? 'text-pqc-dark bg-pqc-light' : 'text-classical-dark bg-classical-light'
          }`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold tracking-tight mb-1 animate-count-up`}
        style={{ color: accentColor }}
      >
        {displayCount}
      </div>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</div>

      {/* Bottom sparkline decoration */}
      <div className="mt-3 flex items-end gap-[3px] h-5 opacity-30">
        {[40, 65, 35, 80, 55, 70, 45, 90, 60].map((h, i) => (
          <div
            key={i}
            className="w-[4px] rounded-full transition-all"
            style={{
              height: `${h}%`,
              backgroundColor: accentColor,
              opacity: 0.4 + (i / 12),
            }}
          />
        ))}
      </div>
    </button>
  )
}
