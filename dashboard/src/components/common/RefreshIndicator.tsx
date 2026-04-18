import { RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function RefreshIndicator({ lastUpdated }: { lastUpdated?: number }) {
  const [timeAgo, setTimeAgo] = useState('Just now')

  useEffect(() => {
    if (!lastUpdated) return

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastUpdated) / 1000)
      if (seconds < 5) setTimeAgo('Just now')
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`)
      else setTimeAgo(`${Math.floor(seconds / 60)}m ago`)
    }, 1000)

    return () => clearInterval(interval)
  }, [lastUpdated])

  return (
    <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-gray-200 shadow-sm">
      <RefreshCw className={`w-3 h-3 text-accent ${Date.now() - (lastUpdated ?? 0) < 2000 ? 'animate-spin' : ''}`} />
      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tight">
        Synced: <span className="text-gray-700 font-semibold">{timeAgo}</span>
      </span>
    </div>
  )
}
