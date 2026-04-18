import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCbom } from '../api/govsign'
import type { QuantumStatus } from '../api/types'
import SummaryCards from '../components/cbom/SummaryCards'
import DeptTable from '../components/cbom/DeptTable'
import ComplianceRing from '../components/charts/ComplianceRing'
import SecurityScore from '../components/charts/SecurityScore'
import ActivityFeed from '../components/cbom/ActivityFeed'
import ActivityBar from '../components/charts/ActivityBar'
import { RefreshCw, TrendingUp, Shield } from 'lucide-react'

export default function Overview() {
  const [filter, setFilter] = useState<QuantumStatus | 'all'>('all')

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cbom', filter],
    queryFn: () => fetchCbom(filter === 'all' ? undefined : filter),
    refetchInterval: 10000,
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-end justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">CBOM Dashboard</h1>
              <p className="text-sm text-gray-400">Cryptography Bill of Materials · PQC compliance registry</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <div className="w-1.5 h-1.5 bg-pqc rounded-full animate-pulse" />
            Auto-sync: 10s
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-dark shadow-sm shadow-accent/20 hover:shadow-md hover:shadow-accent/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Row 1: Stat Cards */}
      <SummaryCards
        summary={data?.summary}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      {/* Row 2: Charts — Compliance Ring + Security Score */}
      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3">
          <ComplianceRing summary={data?.summary} />
        </div>
        <div className="col-span-2">
          <SecurityScore summary={data?.summary} />
        </div>
      </div>

      {/* Row 3: Department Table */}
      <DeptTable departments={data?.departments ?? []} isLoading={isLoading} />

      {/* Row 4: Activity Feed + Operations Chart */}
      <div className="grid grid-cols-2 gap-5">
        <ActivityFeed entries={data?.recent_entries ?? []} />
        <ActivityBar entries={data?.recent_entries ?? []} />
      </div>
    </div>
  )
}
