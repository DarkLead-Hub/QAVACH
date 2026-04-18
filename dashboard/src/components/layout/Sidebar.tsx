import { LayoutDashboard, Shield, History, BarChart3, Settings, HelpCircle, Zap } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const location = useLocation()

  const mainNav = [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: Shield, label: 'Departments', path: '/departments' },
    { icon: History, label: 'Audit Logs', path: '/audit' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  ]

  const bottomNav = [
    { icon: HelpCircle, label: 'Support', path: '/support' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] sidebar-gradient flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">QAVACH</h1>
            <p className="text-indigo-300/60 text-[10px] uppercase tracking-[0.2em]">CBOM Monitor</p>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-indigo-500/20" />

      {/* Main Navigation */}
      <nav className="flex-1 px-4 pt-6 space-y-1">
        <p className="text-indigo-400/40 text-[9px] font-bold uppercase tracking-[0.2em] px-3 mb-3">Navigation</p>
        {mainNav.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${
                isActive
                  ? 'bg-white/10 text-white font-medium shadow-lg shadow-black/10'
                  : 'text-indigo-200/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-400" />
              )}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isActive ? 'bg-indigo-500/30' : 'bg-white/5 group-hover:bg-white/10'
              }`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 pb-4 space-y-1">
        {bottomNav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-indigo-200/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <item.icon className="w-4 h-4" />
            </div>
            <span>{item.label}</span>
          </Link>
        ))}

        {/* System Status Card */}
        <div className="mt-4 mx-1 p-4 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-indigo-400/10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.15em]">System Status</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            <span className="text-[11px] text-indigo-200/70">PQC Nodes Online</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-indigo-200/70">GovSign API Active</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
