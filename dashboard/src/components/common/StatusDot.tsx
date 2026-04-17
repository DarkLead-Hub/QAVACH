export default function StatusDot({ status }: { status: 'online' | 'offline' | 'warning' }) {
  const colors = {
    online: 'bg-pqc shadow-pqc/50',
    offline: 'bg-red-500 shadow-red-500/50',
    warning: 'bg-hybrid shadow-hybrid/50',
  }

  return (
    <div className={`w-2 h-2 rounded-full shadow-lg ${colors[status]} relative`}>
      {status === 'online' && (
        <div className="absolute inset-0 bg-pqc rounded-full animate-ping opacity-75"></div>
      )}
    </div>
  )
}
