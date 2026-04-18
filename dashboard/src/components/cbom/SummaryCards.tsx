import type { CbomSummary, QuantumStatus } from '../../api/types'
import { Shield, ShieldAlert, ShieldQuestion, Clock } from 'lucide-react'
import AnimatedStatCard from './AnimatedStatCard'

interface Props {
  summary: CbomSummary | undefined
  activeFilter: QuantumStatus | 'all'
  onFilterChange: (f: QuantumStatus | 'all') => void
}

const cardConfig: {
  key: QuantumStatus
  label: string
  accentColor: string
  borderColor: string
  bgColor: string
  icon: React.ReactNode
  trend: string
  trendUp: boolean
}[] = [
  {
    key: 'pqc', label: 'PQC Ready',
    accentColor: '#10b981', borderColor: '#10b981', bgColor: '#d1fae5',
    icon: <Shield className="w-5 h-5" />, trend: 'Secure', trendUp: true
  },
  {
    key: 'hybrid', label: 'Hybrid',
    accentColor: '#f59e0b', borderColor: '#f59e0b', bgColor: '#fef3c7',
    icon: <ShieldQuestion className="w-5 h-5" />, trend: 'Migrating', trendUp: true
  },
  {
    key: 'classical', label: 'Classical',
    accentColor: '#ef4444', borderColor: '#ef4444', bgColor: '#fee2e2',
    icon: <ShieldAlert className="w-5 h-5" />, trend: 'At Risk', trendUp: false
  },
  {
    key: 'pending', label: 'Pending',
    accentColor: '#94a3b8', borderColor: '#94a3b8', bgColor: '#f1f5f9',
    icon: <Clock className="w-5 h-5" />, trend: 'Awaiting', trendUp: true
  },
]

export default function SummaryCards({ summary, activeFilter, onFilterChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {cardConfig.map((card, i) => {
        const count = summary ? summary[card.key as keyof CbomSummary] ?? 0 : 0
        const isActive = activeFilter === card.key
        return (
          <AnimatedStatCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={count as number}
            accentColor={card.accentColor}
            borderColor={card.borderColor}
            bgColor={card.bgColor}
            trend={card.trend}
            trendUp={card.trendUp}
            isActive={isActive}
            onClick={() => onFilterChange(isActive ? 'all' : card.key)}
            delay={i * 80}
          />
        )
      })}
    </div>
  )
}
