import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import type { CbomEntry } from '../../api/types'
import { BarChart3 } from 'lucide-react'

interface Props {
  entries: CbomEntry[]
}

export default function ActivityBar({ entries }: Props) {
  const deptCounts: Record<string, { name: string; pqc: number; classical: number }> = {}
  for (const e of entries) {
    if (!deptCounts[e.dept_id]) {
      deptCounts[e.dept_id] = { name: e.dept_name.length > 12 ? e.dept_name.split(' ')[0] : e.dept_name, pqc: 0, classical: 0 }
    }
    if (e.quantum_safe) deptCounts[e.dept_id].pqc++
    else deptCounts[e.dept_id].classical++
  }
  const data = Object.values(deptCounts).slice(0, 8)

  return (
    <div className="glass-card-static p-5 animate-fade-in-up" style={{ animationDelay: '0.45s', opacity: 0 }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-light flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-accent" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Operations by Department</h3>
        </div>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Last 24h</span>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48">
          <BarChart3 className="w-8 h-8 text-gray-200 mb-3" />
          <p className="text-sm text-gray-400 font-medium">No data yet</p>
          <p className="text-xs text-gray-300 mt-1">Operations will appear here</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer height={210}>
            <BarChart data={data} barGap={4} barCategoryGap="20%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={25}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs shadow-xl">
                      {payload.map(p => (
                        <div key={p.dataKey as string} className="flex items-center gap-2 py-0.5">
                          <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: p.color }} />
                          <span className="text-gray-500">{p.dataKey === 'pqc' ? 'PQC' : 'Classical'}</span>
                          <span className="font-bold text-gray-800 ml-auto">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              <Bar dataKey="pqc" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="classical" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-pqc" />
              <span className="text-[11px] text-gray-500 font-medium">PQC Operations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-classical" />
              <span className="text-[11px] text-gray-500 font-medium">Classical Operations</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
