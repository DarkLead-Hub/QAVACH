import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCbom } from '../api/govsign'
import type { QuantumStatus } from '../api/types'
import SummaryCards from '../components/cbom/SummaryCards'
import DeptTable from '../components/cbom/DeptTable'
import CompliancePie from '../components/charts/CompliancePie'
import ActivityFeed from '../components/cbom/ActivityFeed'
import ActivityBar from '../components/charts/ActivityBar'
import { RefreshCw } from 'lucide-react'

export default function Overview() {
  const [filter, setFilter] = useState<QuantumStatus | 'all'>('all')

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cbom', filter],
    queryFn: () => fetchCbom(filter === 'all' ? undefined : filter),
    refetchInterval: 10000,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-100">CBOM — Cryptography bill of materials</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            GovSign API · department PQC compliance registry
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-gray-700/50 rounded-lg text-xs text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary cards + pie chart side by side */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <SummaryCards
            summary={data?.summary}
            activeFilter={filter}
            onFilterChange={setFilter}
          />
        </div>
        <CompliancePie summary={data?.summary} />
      </div>

      {/* Department table */}
      <DeptTable departments={data?.departments ?? []} isLoading={isLoading} />

      {/* Activity feed */}
      <div className="grid grid-cols-2 gap-4">
        <ActivityFeed entries={data?.recent_entries ?? []} />
        <ActivityBar entries={data?.recent_entries ?? []} />
      </div>
    </div>
  )
}
