import type { CbomEntry } from '../../api/types'
import { Activity } from 'lucide-react'

interface Props {
  entries: CbomEntry[]
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ActivityFeed({ entries }: Props) {
  return (
    <div className="bg-surface-2 rounded-xl border border-gray-800/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800/50">
        <Activity className="w-4 h-4 text-accent" />
        <h3 className="text-xs text-gray-500 uppercase tracking-wider">Live Activity</h3>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-gray-600">Auto-refresh</span>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/30">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">No activity yet — sign some documents through GovSign</div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-3/30 transition-colors">
              {/* Left color bar */}
              <div className={`w-0.5 h-8 rounded-full ${entry.quantum_safe ? 'bg-pqc' : 'bg-classical'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300 font-medium truncate">{entry.dept_name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${entry.quantum_safe ? 'bg-green-950/50 text-green-400' : 'bg-red-950/50 text-red-400'}`}>
                    {entry.quantum_safe ? 'PQC' : 'Classical'}
                  </span>
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {entry.operation} · {entry.doc_type} · {entry.algorithm}
                </div>
              </div>
              <div className="text-[10px] text-gray-600 whitespace-nowrap">{timeAgo(entry.timestamp)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
