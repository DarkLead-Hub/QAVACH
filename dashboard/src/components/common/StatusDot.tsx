export default function StatusDot({ status }: { status: 'online' | 'offline' | 'warning' }) {
  const colors = {
    online: 'bg-pqc',
    offline: 'bg-classical',
    warning: 'bg-hybrid',
  }

  const ringColors = {
    online: 'ring-pqc/20',
    offline: 'ring-classical/20',
    warning: 'ring-hybrid/20',
  }

  return (
    <div className="relative flex items-center justify-center">
      <div className={`w-2.5 h-2.5 rounded-full ${colors[status]} ring-4 ${ringColors[status]}`} />
      {status === 'online' && (
        <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${colors[status]} animate-ping opacity-50`} />
      )}
    </div>
  )
}
