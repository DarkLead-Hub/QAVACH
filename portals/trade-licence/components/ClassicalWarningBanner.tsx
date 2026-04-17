'use client'
import Link from 'next/link'

export function ClassicalWarningBanner({ algorithm, deptName }: { algorithm: string; deptName: string }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            This portal uses classical cryptography ({algorithm}) — not quantum-safe
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Documents submitted here are signed with {algorithm}, which is vulnerable to future quantum computing attacks.
            {' '}
            <Link
              href="http://localhost:5173"
              className="underline hover:no-underline font-bold"
              target="_blank"
            >
              Check {deptName} Status on CBOM Dashboard →
            </Link>
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-300">
            {algorithm}
          </span>
        </div>
      </div>
    </div>
  )
}
