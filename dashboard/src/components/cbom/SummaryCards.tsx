import type { CbomSummary, QuantumStatus } from '../../api/types'
import { Shield, ShieldAlert, ShieldQuestion, Clock } from 'lucide-react'

interface Props {
  summary: CbomSummary | undefined
  activeFilter: QuantumStatus | 'all'
  onFilterChange: (f: QuantumStatus | 'all') => void
}

const cards: { key: QuantumStatus | 'all'; label: string; color: string; bg: string; border: string; icon: React.ReactNode }[] = [
  { key: 'pqc', label: 'PQC Ready', color: 'text-pqc', bg: 'bg-green-950/50', border: 'border-green-800/50', icon: <Shield className="w-5 h-5" /> },
  { key: 'hybrid', label: 'Hybrid', color: 'text-hybrid', bg: 'bg-amber-950/50', border: 'border-amber-800/50', icon: <ShieldQuestion className="w-5 h-5" /> },
  { key: 'classical', label: 'Classical', color: 'text-classical', bg: 'bg-red-950/50', border: 'border-red-800/50', icon: <ShieldAlert className="w-5 h-5" /> },
  { key: 'pending', label: 'Pending', color: 'text-pending', bg: 'bg-gray-800/50', border: 'border-gray-700/50', icon: <Clock className="w-5 h-5" /> },
]

export default function SummaryCards({ summary, activeFilter, onFilterChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map(({ key, label, color, bg, border, icon }) => {
        const count = summary ? summary[key as keyof CbomSummary] ?? 0 : 0
        const isActive = activeFilter === key
        return (
          <button
            key={key}
            onClick={() => onFilterChange(isActive ? 'all' : key as QuantumStatus)}
            className={`${bg} ${border} border rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer ${isActive ? 'ring-2 ring-white/20 scale-[1.02]' : ''}`}
          >
            <div className={`flex items-center gap-2 ${color} mb-2`}>
              {icon}
              <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <div className={`text-3xl font-bold ${color}`}>{count}</div>
            <div className="text-xs text-gray-500 mt-1">departments</div>
          </button>
        )
      })}
    </div>
  )
}
