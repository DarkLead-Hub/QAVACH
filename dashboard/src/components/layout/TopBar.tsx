import { Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-100 tracking-tight">QAVACH CBOM Dashboard</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Cryptography Bill of Materials · India e-Gov PQC Migration Tracker</p>
          </div>
        </Link>
      </div>
    </header>
  )
}
