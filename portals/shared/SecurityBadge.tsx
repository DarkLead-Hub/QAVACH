import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react'

export function PqcSecurityBadge({ algorithm }: { algorithm: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
      <ShieldCheck className="w-3.5 h-3.5" />
      PQC Verified · {algorithm}
    </div>
  )
}

export function ClassicalRiskBadge({ algorithm }: { algorithm: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
      <ShieldAlert className="w-3.5 h-3.5" />
      Classical Risk · {algorithm}
    </div>
  )
}

export function WarningBadge({ message }: { message: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-3 py-2 text-xs font-medium">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      {message}
    </div>
  )
}
