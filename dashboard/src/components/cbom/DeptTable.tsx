import type { Department } from '../../api/types'
import { Search, ChevronRight, ArrowUpDown, Filter } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  departments: Department[]
  isLoading: boolean
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    pqc: { bg: 'bg-pqc-light', text: 'text-pqc-dark', dot: 'bg-pqc', label: 'PQC Ready' },
    hybrid: { bg: 'bg-hybrid-light', text: 'text-hybrid-dark', dot: 'bg-hybrid', label: 'Hybrid' },
    classical: { bg: 'bg-classical-light', text: 'text-classical-dark', dot: 'bg-classical', label: 'Classical' },
    pending: { bg: 'bg-pending-light', text: 'text-pending-dark', dot: 'bg-pending', label: 'Pending' },
  }
  const c = config[status] ?? config.pending
  return (
    <span className={`badge-shine inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

function AlgoBadge({ algorithm }: { algorithm: string }) {
  const isPqc = !['RSA-2048', 'RSA-4096', 'ECDSA-P256', 'ECDSA-P384'].includes(algorithm)
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border ${
      isPqc
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-red-50 text-red-600 border-red-200'
    }`}>
      {algorithm}
    </span>
  )
}

function RiskBar({ risk }: { risk: string | null }) {
  if (!risk) return <span className="text-gray-300">—</span>
  const widths: Record<string, string> = { low: 'w-1/4', medium: 'w-3/5', high: 'w-[85%]' }
  const colors: Record<string, string> = { low: 'bg-gradient-to-r from-pqc to-emerald-400', medium: 'bg-gradient-to-r from-hybrid to-amber-400', high: 'bg-gradient-to-r from-classical to-red-400' }
  const dotColors: Record<string, string> = { low: 'bg-pqc', medium: 'bg-hybrid', high: 'bg-classical' }
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${widths[risk]} ${colors[risk]} transition-all duration-700`} />
      </div>
      <div className="flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[risk]}`} />
        <span className="text-[10px] text-gray-500 uppercase font-semibold w-12">{risk}</span>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-5 py-4"><div className="skeleton h-4 w-40" /><div className="skeleton h-3 w-16 mt-1.5" /></td>
      <td className="px-5 py-4"><div className="skeleton h-6 w-32 rounded-lg" /></td>
      <td className="px-5 py-4"><div className="skeleton h-6 w-20 rounded-lg" /></td>
      <td className="px-5 py-4"><div className="skeleton h-2 w-full rounded-full" /></td>
      <td className="px-5 py-4 text-right"><div className="skeleton h-4 w-8 ml-auto" /></td>
      <td className="px-5 py-4"><div className="skeleton h-4 w-4 ml-auto rounded" /></td>
    </tr>
  )
}

export default function DeptTable({ departments, isLoading }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string>('')

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.dept_id.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        if (sortKey === 'name') return a.name.localeCompare(b.name)
        if (sortKey === 'signs') return b.sign_count_30d - a.sign_count_30d
        return 0
      })
    : filtered

  return (
    <div className="glass-card-static overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-gray-800">Department Compliance Registry</h2>
          <span className="text-[11px] text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
            {filtered.length} departments
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-52 bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent/30 transition-all"
            />
          </div>
          <button
            onClick={() => setSortKey(k => k === 'name' ? 'signs' : k === 'signs' ? '' : 'name')}
            className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
            title="Sort"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] text-gray-400 uppercase tracking-[0.15em] bg-gray-50/60">
              <th className="px-5 py-3 font-bold">Department</th>
              <th className="px-5 py-3 font-bold">Algorithm</th>
              <th className="px-5 py-3 font-bold">Status</th>
              <th className="px-5 py-3 font-bold w-48">Quantum Risk</th>
              <th className="px-5 py-3 font-bold text-right">Signs (30d)</th>
              <th className="px-5 py-3 font-bold w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              sorted.map((dept, i) => (
                <tr
                  key={dept.dept_id}
                  className="table-row-hover group animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
                >
                  <td className="px-5 py-4">
                    <Link to={`/dept/${dept.dept_id}`} className="block">
                      <div className="text-sm font-medium text-gray-800 group-hover:text-accent transition-colors">
                        {dept.name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{dept.dept_id}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <AlgoBadge algorithm={dept.algorithm} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={dept.quantum_status} />
                  </td>
                  <td className="px-5 py-4">
                    <RiskBar risk={dept.quantum_risk} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-mono font-semibold text-gray-600">{dept.sign_count_30d.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`/dept/${dept.dept_id}`} className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-accent hover:border-accent hover:text-white text-gray-400">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-16">
          <Filter className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">No departments match your filter</p>
          <p className="text-xs text-gray-300 mt-1">Try adjusting your search or clearing filters</p>
        </div>
      )}
    </div>
  )
}
