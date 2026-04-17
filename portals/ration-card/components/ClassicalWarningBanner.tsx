'use client'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export function ClassicalWarningBanner({ algorithm, deptName }: { algorithm: string, deptName: string }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            This portal uses classical cryptography ({algorithm}) — not quantum-safe
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Documents verified by {deptName} are currently using {algorithm}, which is vulnerable to future quantum computing attacks.
            {' '}
            <Link
              href="http://localhost:5173"
              className="underline hover:no-underline font-bold"
              target="_blank"
            >
              View CBOM dashboard →
            </Link>
          </p>
        </div>
        <div className="flex-shrink-0 hidden md:block">
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-300 tracking-tight uppercase">
            {algorithm}
          </span>
        </div>
      </div>
    </div>
  )
}
