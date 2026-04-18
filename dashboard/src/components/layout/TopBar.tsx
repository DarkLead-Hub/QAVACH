import { Shield } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

function Breadcrumb() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  return (
    <div className="flex items-center gap-2 text-sm ml-6 pl-6 border-l border-gray-200">
      <Link to="/" className="text-gray-400 hover:text-accent transition-colors">Overview</Link>
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="text-gray-300">/</span>
          <span className={i === segments.length - 1 ? 'text-gray-700 font-medium capitalize' : 'text-gray-400 capitalize'}>
            {seg}
          </span>
        </span>
      ))}
    </div>
  )
}

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
      <div className="max-w-[1280px] mx-auto px-8 py-3.5 flex items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-sm shadow-accent/20">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">QAVACH</h1>
            <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">CBOM Dashboard</p>
          </div>
        </Link>

        {/* Breadcrumb */}
        <Breadcrumb />

        {/* Right: Live status */}
        <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
          <div className="w-1.5 h-1.5 bg-pqc rounded-full animate-pulse" />
          GovSign API · Live
        </div>
      </div>
    </header>
  )
}
