import type { Department } from '../../api/types'
import { Search, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  departments: Department[]
  isLoading: boolean
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pqc: 'bg-green-950/30 text-pqc border-green-800/50',
    hybrid: 'bg-amber-950/30 text-hybrid border-amber-800/50',
    classical: 'bg-red-950/30 text-classical border-red-800/50 border-dashed',
    pending: 'bg-gray-800/30 text-pending border-gray-700/50',
  }
  const labels: Record<string, string> = {
    pqc: 'PQC Ready',
    hybrid: 'Hybrid',
    classical: 'Classical',
    pending: 'Pending',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  )
}

function AlgoBadge({ algorithm }: { algorithm: string }) {
  const isPqc = !['RSA-2048', 'RSA-4096', 'ECDSA-P256', 'ECDSA-P384'].includes(algorithm)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${
      isPqc ? 'bg-green-950/20 text-green-400 border-green-900/30' : 'bg-red-950/20 text-red-400 border-red-900/30'
    }`}>
      {algorithm}
    </span>
  )
}

function RiskBar({ risk }: { risk: string | null }) {
  if (!risk) return <span className="text-gray-600">—</span>
  const widths: Record<string, string> = { low: 'w-1/4', medium: 'w-3/5', high: 'w-[90%]' }
  const colors: Record<string, string> = { low: 'bg-pqc', medium: 'bg-hybrid', high: 'bg-classical' }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${widths[risk]} ${colors[risk]} transition-all duration-500`} />
      </div>
      <span className="text-[9px] text-gray-500 uppercase font-bold w-10">{risk}</span>
    </div>
  )
}

export default function DeptTable({ departments, isLoading }: Props) {
  const [search, setSearch] = useState('')
  const filtered = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.dept_id.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="bg-surface-2 rounded-xl border border-gray-800/50 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4"></div>
        <div className="text-gray-500 text-sm">Synchronizing department registry...</div>
      </div>
    )
  }

  return (
    <div className="bg-surface-2 rounded-xl border border-gray-800/50 overflow-hidden shadow-sm">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300">Department Compliance Registry</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-3/50 border border-gray-700/50 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-widest bg-surface/30">
              <th className="px-4 py-3 font-bold">Department</th>
              <th className="px-4 py-3 font-bold">Algorithm</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold w-48">Quantum Risk</th>
              <th className="px-4 py-3 font-bold text-right">Signs (30d)</th>
              <th className="px-4 py-3 font-bold w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/30">
            {filtered.map(dept => (
              <tr key={dept.dept_id} className="group hover:bg-accent/5 transition-colors">
                <td className="px-4 py-4">
                  <Link to={`/dept/${dept.dept_id}`} className="block">
                    <div className="text-sm font-medium text-gray-200 group-hover:text-accent transition-colors">
                      {dept.name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">{dept.dept_id}</div>
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <AlgoBadge algorithm={dept.algorithm} />
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={dept.quantum_status} />
                </td>
                <td className="px-4 py-4">
                  <RiskBar risk={dept.quantum_risk} />
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-xs font-mono text-gray-400">{dept.sign_count_30d.toLocaleString()}</span>
                </td>
                <td className="px-4 py-4">
                  <Link to={`/dept/${dept.dept_id}`} className="text-gray-700 group-hover:text-accent transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-sm">No departments match your current filter</p>
        </div>
      )}
    </div>
  )
}
