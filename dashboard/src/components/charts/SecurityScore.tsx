import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import type { CbomSummary } from '../../api/types'

interface Props {
  summary: CbomSummary | undefined
}

export default function SecurityScore({ summary }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300)
    return () => clearTimeout(t)
  }, [])

  if (!summary) return null

  const total = summary.total || 1
  const score = Math.round(((summary.pqc * 1.0 + summary.hybrid * 0.5) / total) * 100)

  const getColor = (s: number) => {
    if (s >= 80) return '#10b981'
    if (s >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const getLabel = (s: number) => {
    if (s >= 80) return 'Excellent'
    if (s >= 50) return 'Moderate'
    return 'At Risk'
  }

  const color = getColor(score)

  // Semi-circle gauge
  const radius = 65
  const stroke = 10
  const halfCircumference = Math.PI * radius
  const fillLength = (score / 100) * halfCircumference

  return (
    <div className="glass-card-static p-6 animate-fade-in-up flex flex-col" style={{ animationDelay: '0.3s', opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">Security Posture</h3>
        <div className="w-7 h-7 rounded-lg bg-accent-light flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-accent" />
        </div>
      </div>

      {/* Gauge */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <svg width="180" height="100" viewBox="0 0 180 100">
            {/* Background arc */}
            <path
              d="M 15 90 A 65 65 0 0 1 165 90"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            {/* Value arc */}
            <path
              d="M 15 90 A 65 65 0 0 1 165 90"
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${halfCircumference}`}
              strokeDashoffset={mounted ? halfCircumference - fillLength : halfCircumference}
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 2px 4px ${color}40)` }}
            />
          </svg>
          {/* Score in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <div className="text-4xl font-bold" style={{ color }}>{mounted ? score : 0}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">/ 100</div>
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="text-center mt-2">
        <span
          className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {getLabel(score)}
        </span>
        <p className="text-[11px] text-gray-400 mt-3">
          Based on {summary.pqc} PQC + {summary.hybrid} hybrid of {total} total departments
        </p>
      </div>
    </div>
  )
}
