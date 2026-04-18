import { useEffect, useState } from 'react'
import type { CbomSummary } from '../../api/types'

interface Props {
  summary: CbomSummary | undefined
}

export default function ComplianceRing({ summary }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  if (!summary) return null

  const total = summary.total || 1
  const pqcPercent = Math.round((summary.pqc / total) * 100)
  const hybridPercent = Math.round((summary.hybrid / total) * 100)

  const radius = 80
  const stroke = 12
  const circumference = 2 * Math.PI * radius
  const center = radius + stroke

  const segments = [
    { key: 'pqc', value: summary.pqc, color: '#10b981', label: 'PQC Ready' },
    { key: 'hybrid', value: summary.hybrid, color: '#f59e0b', label: 'Hybrid' },
    { key: 'classical', value: summary.classical, color: '#ef4444', label: 'Classical' },
    { key: 'pending', value: summary.pending, color: '#94a3b8', label: 'Pending' },
  ].filter(s => s.value > 0)

  // Build cumulative offsets for each arc segment
  let cumulative = 0
  const arcs = segments.map(seg => {
    const fraction = seg.value / total
    const dashLength = fraction * circumference
    const gap = circumference - dashLength
    const offset = -cumulative * circumference / total * (total / total) // simplified
    const rotation = (cumulative / total) * 360 - 90
    cumulative += seg.value
    return { ...seg, dashLength, gap, rotation, fraction }
  })

  return (
    <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">Compliance Distribution</h3>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Live</span>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width={center * 2} height={center * 2} className="transform -rotate-90">
            {/* Background track */}
            <circle
              cx={center} cy={center} r={radius}
              fill="none" stroke="#f1f5f9" strokeWidth={stroke}
            />
            {/* Segments */}
            {arcs.map((arc, i) => {
              let segOffset = 0
              for (let j = 0; j < i; j++) segOffset += arcs[j].fraction
              return (
                <circle
                  key={arc.key}
                  cx={center} cy={center} r={radius}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${arc.dashLength} ${arc.gap}`}
                  strokeDashoffset={mounted ? -segOffset * circumference : circumference}
                  className="ring-progress"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                />
              )
            })}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-gray-900">{total}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Departments</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-5">
        {segments.map(seg => (
          <div key={seg.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50/50">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] text-gray-600">{seg.label}</span>
            <span className="text-[11px] font-bold text-gray-800 ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>

      {/* Migration Progress Bar */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-gray-500">PQC Migration</span>
          <span className="text-xs font-bold text-pqc">{pqcPercent + hybridPercent}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pqc to-emerald-400 transition-all duration-1000 ease-out"
            style={{ width: mounted ? `${pqcPercent + hybridPercent}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  )
}
