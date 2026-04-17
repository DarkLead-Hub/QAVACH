import React from 'react'
import { Shield } from 'lucide-react'

interface Props {
  children: React.ReactNode
  title: string
  color?: 'orange' | 'blue'
}

export default function PortalLayout({ children, title, color = 'orange' }: Props) {
  const bgColor = color === 'orange' ? 'bg-orange-600' : 'bg-blue-700'
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Government Header */}
      <header className={`${bgColor} text-white shadow-md`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded shadow-sm flex items-center justify-center">
              <span className="text-2xl" role="img" aria-label="India Emblem">🏛️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight uppercase tracking-tight">{title}</h1>
              <p className="text-[10px] opacity-80 uppercase tracking-widest">Government of India · Digital Identity Initiative</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20">
            <Shield className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">PQC Enabled</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6">
        {children}
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            This portal is part of the QAVACH Post-Quantum Proof of Concept. 
            All identity verifications are performed using NIST-standardized PQC algorithms.
          </p>
        </div>
      </footer>
    </div>
  )
}
