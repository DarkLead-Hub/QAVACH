import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { CbomSummary } from '../../api/types'

interface Props {
  summary: CbomSummary | undefined
}

const COLORS: Record<string, string> = {
  pqc: '#16a34a',
  hybrid: '#d97706',
  classical: '#dc2626',
  pending: '#9ca3af',
}

const LABELS: Record<string, string> = {
  pqc: 'PQC Ready',
  hybrid: 'Hybrid',
  classical: 'Classical',
  pending: 'Pending',
}

export default function CompliancePie({ summary }: Props) {
  if (!summary) return null

  const data = [
    { name: 'pqc', value: summary.pqc },
    { name: 'hybrid', value: summary.hybrid },
    { name: 'classical', value: summary.classical },
    { name: 'pending', value: summary.pending },
  ].filter(d => d.value > 0)

  const total = summary.total || 1

  return (
    <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-4 flex flex-col items-center">
      <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2 self-start">Compliance Distribution</h3>
      <div className="relative w-full" style={{ height: 180 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map(entry => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]
                return (
                  <div className="bg-surface-3 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
                    <div className="text-gray-300 font-medium">{LABELS[d.name as string]}</div>
                    <div className="text-gray-400">{d.value} depts · {Math.round(((d.value as number) / total) * 100)}%</div>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-2xl font-bold text-gray-200">{total}</div>
          <div className="text-[10px] text-gray-500 uppercase">Total</div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[d.name] }} />
            <span className="text-[10px] text-gray-500">{LABELS[d.name]} ({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
