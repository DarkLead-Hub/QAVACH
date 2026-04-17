import { LayoutDashboard, Shield, History, Settings, HelpCircle, BarChart3 } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const location = useLocation()
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: Shield, label: 'Departments', path: '/departments' },
    { icon: History, label: 'Audit Logs', path: '/audit' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  ]

  const bottomItems = [
    { icon: HelpCircle, label: 'Support', path: '/support' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]

  return (
    <div className="w-64 bg-surface border-r border-gray-800/50 flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 text-accent mb-8">
          <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-100">QAVACH</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive 
                    ? 'bg-accent/10 text-accent font-medium' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-1 border-t border-gray-800/50">
        {bottomItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
        
        <div className="mt-6 p-4 bg-accent/5 rounded-xl border border-accent/10">
          <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-pqc rounded-full animate-pulse"></div>
            <span className="text-[10px] text-gray-400 font-medium">PQC Nodes Online</span>
          </div>
        </div>
      </div>
    </div>
  )
}
