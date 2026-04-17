import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { CbomEntry } from '../../api/types'

interface Props {
  entries: CbomEntry[]
}

export default function ActivityBar({ entries }: Props) {
  // Group by department for a simple bar chart
  const deptCounts: Record<string, { name: string; pqc: number; classical: number }> = {}
  for (const e of entries) {
    if (!deptCounts[e.dept_id]) {
      deptCounts[e.dept_id] = { name: e.dept_name.split(' ')[0], pqc: 0, classical: 0 }
    }
    if (e.quantum_safe) deptCounts[e.dept_id].pqc++
    else deptCounts[e.dept_id].classical++
  }
  const data = Object.values(deptCounts).slice(0, 8)

  return (
    <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-4">
      <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">Operations by Department</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-600 text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer height={200}>
          <BarChart data={data} barGap={2}>
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="bg-surface-3 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
                    {payload.map(p => (
                      <div key={p.dataKey as string} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-gray-400">{p.dataKey === 'pqc' ? 'PQC' : 'Classical'}: {p.value}</span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            <Bar dataKey="pqc" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="classical" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
