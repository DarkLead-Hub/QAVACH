import type { CbomEntry } from '../../api/types'
import { Activity, ArrowRight } from 'lucide-react'

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
    <div className="glass-card-static overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-light flex items-center justify-center">
            <Activity className="w-4 h-4 text-accent" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Activity Timeline</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-pqc animate-pulse" />
          <span className="text-[10px] text-gray-400 font-medium">Live</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-h-[340px] overflow-y-auto custom-scroll">
        {entries.length === 0 ? (
          <div className="text-center py-12 px-5">
            <Activity className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">No activity yet</p>
            <p className="text-xs text-gray-300 mt-1">Sign documents through GovSign to see events</p>
          </div>
        ) : (
          <div className="relative px-5 py-3">
            {/* Vertical timeline line */}
            <div className="timeline-line" />

            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="relative flex gap-4 pb-4 last:pb-2 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
              >
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0 mt-1">
                  <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                    entry.quantum_safe ? 'bg-pqc' : 'bg-classical'
                  }`} />
                </div>

                {/* Event card */}
                <div className={`flex-1 p-3 rounded-xl border transition-colors ${
                  i % 2 === 0 ? 'bg-white border-gray-100' : 'bg-gray-50/50 border-gray-100'
                } hover:border-gray-200`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{entry.dept_name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        entry.quantum_safe
                          ? 'bg-pqc-light text-pqc-dark'
                          : 'bg-classical-light text-classical-dark'
                      }`}>
                        {entry.quantum_safe ? 'PQC' : 'Classical'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">{timeAgo(entry.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="capitalize">{entry.operation}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300" />
                    <span>{entry.doc_type}</span>
                    <span className="text-gray-300">·</span>
                    <span className="font-mono text-[11px] text-gray-400">{entry.algorithm}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
